import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { DEMO_EMAIL, hasDemoPremium, hasVerifiedDemoEmail, type DemoIdentity } from "../shared/demo";
import { archetypes } from "../shared/psyra";
import { buildPsycheProfile } from "../shared/psyche-profile";
import type { Dream, EnhancedDreamInterpretation, InsertDream } from "../shared/schema";
import {
  DEMO_DREAMS, generateDemoDreams, seedDemoContentForIdentity, validDemoSeedAuthorization,
} from "./demo-seed";

const identity: DemoIdentity = {
  id: "demo-test-identity", primaryEmailAddressId: "email-demo",
  emailAddresses: [{ id: "email-demo", emailAddress: DEMO_EMAIL, verification: { status: "verified" } }],
  privateMetadata: { is_demo: true },
};
const available = archetypes.filter(item => item.isArchetype);
function reading(index: number): EnhancedDreamInterpretation {
  return {
    dreamOverview: "Generated test interpretation", keySymbols: [{ symbol: "water", meaning: "feeling" }],
    coreThemes: ["growth"], emotionalLandscape: "curiosity", shadowElements: "hesitation",
    dreamsMessage: "Explore", reflectionPrompts: ["What changed?"],
    archetypeAnalysis: {
      primaryArchetype: available[index < 7 ? 0 : 1].id, whyPsyraSawThis: "Test evidence",
      reflectionQuestion: "What resonates?", relevanceScore: 0.8,
      jungianDimensions: { shadow: 0.2, ego: 0.4, self: 0.8, persona: 0.6 },
      majorSymbols: ["water"], majorEmotions: ["curiosity"], recurringThemes: ["growth"],
    },
  };
}
const rowsFor = (userId: string, samples: InsertDream[]): Dream[] => samples.map((sample, index) => ({
  ...sample, id: `${userId}-${index}`, userId, isArchived: false, moonPhase: null,
} as Dream));

test("demo premium needs the fixed, verified primary email AND server-private flag", () => {
  assert.equal(hasDemoPremium(identity), true);
  assert.equal(hasDemoPremium({ ...identity, privateMetadata: {} }), false);
  assert.equal(hasDemoPremium({ ...identity, privateMetadata: { is_demo: "true" } }), false);
  assert.equal(hasDemoPremium({ ...identity, primaryEmailAddressId: "different-email" }), false);
  assert.equal(hasDemoPremium({
    ...identity, emailAddresses: [{ ...identity.emailAddresses[0], verification: { status: "unverified" } }],
  }), false);
  const ordinary = {
    ...identity, publicMetadata: { is_demo: true },
    emailAddresses: [{ ...identity.emailAddresses[0], emailAddress: "ordinary@example.invalid" }],
  };
  assert.equal(hasDemoPremium(ordinary), false);
  assert.equal(hasVerifiedDemoEmail(ordinary), false);
});

test("admin seed rejects missing, short or incorrect secrets", () => {
  const secret = "synthetic-test-secret-not-a-real-key-12345";
  assert.equal(validDemoSeedAuthorization(undefined, secret), false);
  assert.equal(validDemoSeedAuthorization(`Bearer ${secret}`, undefined), false);
  assert.equal(validDemoSeedAuthorization("Bearer short", "short"), false);
  assert.equal(validDemoSeedAuthorization("Bearer incorrect", secret), false);
  assert.equal(validDemoSeedAuthorization(`Bearer ${secret}`, secret), true);
});

test("all ten exact supplied dreams use the interpreter, dated consecutively with Owl newest", async () => {
  const seen: string[] = [];
  const samples = await generateDemoDreams(async content => {
    const index = DEMO_DREAMS.findIndex(sample => sample[1] === content);
    seen.push(content);
    return reading(index);
  }, new Date("2026-10-14T18:00:00Z"));
  assert.equal(seen.length, 10);
  assert.deepEqual(new Set(seen), new Set(DEMO_DREAMS.map(sample => sample[1])));
  assert.equal(samples[9].title, "The Owl at the Window");
  assert.equal(new Date(samples[9].date!).toISOString().slice(0, 10), "2026-10-14");
  for (let i = 1; i < samples.length; i++) {
    assert.equal(+new Date(samples[i].date!) - +new Date(samples[i - 1].date!), 86400000);
  }
  const profile = buildPsycheProfile(samples);
  assert.equal(profile.total, 10);
  assert.equal(profile.dominantId, available[0].id);
  assert.equal(profile.counts.get(available[0].id), 7);
  assert.ok(Math.abs(profile.dimensions.self - 0.8) < 0.00001);
});

test("reruns replace only the demo journal and grant only the demo identity", async () => {
  const journals = new Map<string, Dream[]>([["ordinary", [{ id: "private-record" } as Dream]]]);
  let calls = 0;
  const grants: string[] = [];
  const operations = {
    interpret: async (content: string) => {
      calls++;
      return reading(DEMO_DREAMS.findIndex(sample => sample[1] === content));
    },
    replaceJournal: async (userId: string, samples: InsertDream[]) => {
      const records = rowsFor(userId, samples);
      journals.set(userId, records);
      return records;
    },
    grantPremium: async (userId: string) => { grants.push(userId); },
  };
  const report = await seedDemoContentForIdentity(identity, operations);
  await seedDemoContentForIdentity(identity, operations);
  assert.equal(calls, 20);
  assert.equal(journals.get(identity.id)?.length, 10);
  assert.deepEqual(journals.get("ordinary"), [{ id: "private-record" }]);
  assert.deepEqual(grants, [identity.id, identity.id]);
  assert.equal(report.archetype.id, available[0].id);
  assert.equal(report.archetype.appearedIn, 7);
  assert.equal(report.jungianDimensions.self, 80);
  assert.ok(report.archetype.artwork);
  assert.ok(report.archetype.subtitle);
});

test("non-demo identities and incomplete AI output cannot seed a journal or grant premium", async () => {
  let writes = 0;
  let grants = 0;
  const operations = {
    interpret: async () => reading(0),
    replaceJournal: async (_userId: string, _samples: InsertDream[]) => { writes++; return []; },
    grantPremium: async () => { grants++; },
  };
  await assert.rejects(seedDemoContentForIdentity({
    ...identity, primaryEmailAddressId: null,
  }, operations));
  await assert.rejects(seedDemoContentForIdentity(identity, {
    ...operations, interpret: async () => { throw new Error("AI unavailable"); },
  }));
  assert.equal(writes, 0);
  assert.equal(grants, 0);
});

test("seed CLI will not implicitly choose an environment", () => {
  assert.throws(() => execFileSync(process.execPath, ["scripts/seed-demo.js"], { stdio: "pipe" }),
    /Pass --url/);
});
