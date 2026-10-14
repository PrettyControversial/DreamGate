import { clerkClient } from "@clerk/express";
import { createHash, timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import pLimit from "p-limit";
import { DEMO_EMAIL, hasVerifiedDemoEmail, type DemoIdentity } from "../shared/demo";
import { buildPsycheProfile } from "../shared/psyche-profile";
import { getArchetype } from "../shared/psyra";
import { dreams, type Dream, type EnhancedDreamInterpretation, type InsertDream } from "../shared/schema";
import { db } from "./db";
import { storage } from "./storage";

export const DEMO_DREAMS = [
  ["The Golden Key", "I was swimming through my childhood house, which was flooded with warm, clear water. Under the staircase I found a golden key glowing on the floor."],
  ["The Moon Library", "I walked into a library whose ceiling was the night sky with a full moon. The books whispered my name and a white owl watched from a shelf."],
  ["Flying Over the Ocean", "I was flying low over turquoise water. Whales rose beside me, and I felt completely calm and free."],
  ["The Blue Door", "I found a blue door in an old stone wall. It opened into a garden of white roses where my grandmother was waiting with tea."],
  ["The Silver Horse", "A silver horse ran along a beach at night under the moon. It stopped and let me ride it into the waves."],
  ["Staircase of Stars", "I climbed a spiral staircase that kept going up into the sky. Each step lit up like a star beneath my feet."],
  ["The Mirror Room", "I was in a room full of mirrors. One reflection smiled at me with a face I didn't recognize, but I felt peaceful."],
  ["The Pearl in the River", "I knelt by a clear river and saw a pearl earring on the bottom. Golden fish circled it like they were guarding it."],
  ["The Desert Train", "I rode a train through a desert at sunset. A stranger sat across from me and handed me a small brass key."],
  ["The Owl at the Window", "A white owl tapped on my bedroom window at midnight. When I opened it, the owl dropped a folded letter in my hand."],
] as const;

export function validDemoSeedAuthorization(header: string | undefined, secret: string | undefined): boolean {
  if (!secret || secret.length < 32 || !header?.startsWith("Bearer ")) return false;
  const hash = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(header.slice(7)), hash(secret));
}

export async function generateDemoDreams(
  interpret: (content: string) => Promise<EnhancedDreamInterpretation>,
  now = new Date(),
): Promise<InsertDream[]> {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => Number(parts.find(p => p.type === type)?.value);
  const limit = pLimit(2);
  return Promise.all(DEMO_DREAMS.map(([title, content], index) => limit(async () => {
    // This is exactly the real interpretation pipeline, including its validated
    // AI-selected archetype analysis. No seeded archetype or dimension scores.
    const interpretation = await interpret(content);
    if (!interpretation.archetypeAnalysis) throw new Error("Demo interpretation lacks archetype analysis");
    return {
      title, content,
      date: new Date(Date.UTC(part("year"), part("month") - 1, part("day") - 9 + index, 16)),
      decodedInsights: JSON.stringify({ interpretation, reflection: "" }),
      symbols: interpretation.keySymbols.map(item => item.symbol),
      emotions: interpretation.archetypeAnalysis.majorEmotions,
      themes: interpretation.coreThemes,
    };
  })));
}

let inFlight: Promise<ReturnType<typeof describeDemoProfile>> | undefined;

export function describeDemoProfile(records: Pick<Dream, "decodedInsights">[]) {
  const profile = buildPsycheProfile(records);
  const archetype = getArchetype(profile.dominantId);
  if (profile.total !== 10 || !archetype) throw new Error("All ten dreams must have real archetype analysis");
  return {
    email: DEMO_EMAIL, isDemo: true, premium: true, analyzedDreams: profile.total,
    archetype: {
      id: archetype.id, name: archetype.displayName, subtitle: archetype.subtitle,
      description: archetype.shortDescription, appearedIn: profile.counts.get(archetype.id) ?? 0,
      artwork: archetype.expectedFileName,
    },
    jungianDimensions: Object.fromEntries(Object.entries(profile.dimensions).map(([key, score]) =>
      [key, Math.round(score * 100)],
    )),
  };
}

export async function seedDemoContentForIdentity(
  user: DemoIdentity,
  operations: {
    interpret: (content: string) => Promise<EnhancedDreamInterpretation>;
    replaceJournal: (userId: string, samples: InsertDream[]) => Promise<Dream[]>;
    grantPremium: (userId: string) => Promise<void>;
  },
  now = new Date(),
) {
  if (!hasVerifiedDemoEmail(user)) throw new Error("Refusing to seed a non-demo identity");
  const samples = await generateDemoDreams(operations.interpret, now);
  const seeded = await operations.replaceJournal(user.id, samples);
  if (seeded.some(dream => dream.userId !== user.id)) throw new Error("Seed ownership mismatch");
  const report = describeDemoProfile(seeded);
  await operations.grantPremium(user.id);
  return report;
}

async function runSeed() {
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 16) throw new Error("Set a strong DEMO_PASSWORD in Secrets before seeding");
  if (password === process.env.DEMO_SEED_TOKEN) throw new Error("Demo login and administrator seed secrets must be different");
  const candidates = await clerkClient.users.getUserList({ emailAddress: [DEMO_EMAIL] });
  if (candidates.data.length > 1) throw new Error("Ambiguous demo identity; refusing to seed");
  let user = candidates.data[0];
  if (user) {
    const primary = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId);
    if (primary?.emailAddress.toLowerCase() !== DEMO_EMAIL) {
      throw new Error("Demo email is not the primary email; refusing to touch this account");
    }
  } else {
    user = await clerkClient.users.createUser({
      emailAddress: [DEMO_EMAIL], password, firstName: "Luna",
    });
  }
  const primary = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId);
  if (!primary || primary.emailAddress.toLowerCase() !== DEMO_EMAIL) throw new Error("Unexpected demo identity");
  if (primary.verification?.status !== "verified") {
    await clerkClient.emailAddresses.updateEmailAddress(primary.id, { verified: true });
  }
  user = await clerkClient.users.getUser(user.id);
  if (!hasVerifiedDemoEmail(user)) throw new Error("Demo email verification failed");

  return seedDemoContentForIdentity(user, {
    interpret: content => storage.enhancedDecodeDream(content),
    replaceJournal: (userId, samples) => db.transaction(async tx => {
      // This fixed, verified identity is the ONLY account this operation resets.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))`);
      await tx.delete(dreams).where(eq(dreams.userId, userId));
      return tx.insert(dreams).values(samples.map(sample => ({ ...sample, userId }))).returning();
    }),
    grantPremium: async userId => {
      await clerkClient.users.updateUser(userId, { firstName: "Luna", password });
      await clerkClient.users.updateUserMetadata(userId, { privateMetadata: { is_demo: true } });
    },
  });
}

export function seedDemo() {
  // Repeated clicks on one server share the same in-progress seed operation.
  if (!inFlight) inFlight = runSeed().finally(() => { inFlight = undefined; });
  return inFlight;
}
