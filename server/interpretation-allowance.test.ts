import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import { clerkClient } from "@clerk/express";
import { eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { dailyUsage, dreams, type EnhancedDreamInterpretation } from "../shared/schema";
import { DEMO_EMAIL, type DemoIdentity } from "../shared/demo";
import { withDreamAiConsent } from "../shared/ai-dream-consent";
import { DAILY_LIMIT_MESSAGES, INTERPRETATION_LIMIT_HEADING } from "../shared/daily-limits";
import {
  interpretationAllowance, withInterpretationAllowance, isDevelopmentInterpretationPreview,
} from "./interpretation-allowance";
import { storage } from "./storage";
import { registerRoutes } from "./routes";

function identity(id: string, email = "synthetic@example.invalid", demo = false): DemoIdentity {
  return {
    id,
    primaryEmailAddressId: "synthetic-email",
    emailAddresses: [{
      id: "synthetic-email", emailAddress: email, verification: { status: "verified" },
    }],
    privateMetadata: withDreamAiConsent({ is_demo: demo }, "2026-10-01T00:00:00Z"),
  };
}

test("mock exemptions are development-only and cannot activate in production", () => {
  assert.equal(isDevelopmentInterpretationPreview("development", undefined, "DEVELOPMENT_PREMIUM"), true);
  assert.equal(isDevelopmentInterpretationPreview("development", undefined, "PSYRA_PLUS"), true);
  assert.equal(isDevelopmentInterpretationPreview("production", undefined, "PSYRA_PLUS"), false);
  assert.equal(isDevelopmentInterpretationPreview("development", "1", "DEVELOPMENT_PREMIUM"), false);
  assert.equal(isDevelopmentInterpretationPreview(undefined, undefined, "PSYRA_PLUS"), false);
  assert.equal(isDevelopmentInterpretationPreview("development", undefined, "FREE"), false);
});

test("all interpretation HTTP endpoints enforce one account-wide daily allowance", async t => {
  const ids = Array.from({ length: 6 }, () => `interpretation-test-${randomUUID()}`);
  const actors = ids.map(id => identity(id));
  actors[4] = identity(ids[4], DEMO_EMAIL, true);
  actors[5] = identity(ids[5], DEMO_EMAIL, false);
  const savedDreamId = randomUUID();
  let aiCalls = 0;
  const basic = {
    symbols: [], themes: ["Reflection"], emotions: ["Curiosity"],
    overallInsight: "Synthetic AI interpretation for testing.", moonInfluence: "Synthetic",
  };
  const enhanced = {
    dreamOverview: "Synthetic reading", keySymbols: [{ symbol: "door", meaning: "Synthetic", questions: "Synthetic?" }],
    coreThemes: ["Reflection"], emotionalLandscape: "Curiosity", shadowElements: "Synthetic",
    dreamsMessage: "Reflect", archetype: "explorer",
  } as unknown as EnhancedDreamInterpretation;
  const clerkUsers = clerkClient.users;
  t.mock.method(clerkUsers, "getUser", async (id: string) => {
    const actor = actors.find(user => user.id === id);
    if (!actor) throw new Error("Unknown synthetic test account");
    return actor;
  });
  t.mock.method(storage, "decodeDream", async (content: string, _phase: unknown, onAiFailure?: () => void) => {
    aiCalls++;
    if (content === "BASIC_FAIL") onAiFailure?.();
    return basic;
  });
  t.mock.method(storage, "enhancedDecodeDream", async (content: string) => {
    aiCalls++;
    if (content === "AI_FAIL") throw new Error("Synthetic AI failure");
    return enhanced;
  });
  const app = express();
  app.use(express.json());
  // TEST SERVER ONLY: inject a synthetic authenticated identity. The actual
  // application/auth middleware is neither edited nor bypassed in production.
  app.use((req, _res, next) => {
    Object.assign(req, { auth: Object.assign(() => ({
      userId: req.get("X-Test-User"), tokenType: "session_token",
      sessionClaims: {}, isAuthenticated: Boolean(req.get("X-Test-User")),
    }), { [Symbol.for("@clerk/express.auth")]: true }) });
    next();
  });
  const server = createServer(app);
  await registerRoutes(server, app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not start");
  const base = `http://127.0.0.1:${address.port}`;
  const post = (id: string, path: string, content = "SYNTHETIC", extra: Record<string, unknown> = {}) =>
    fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Test-User": id, "X-User-Time-Zone": "America/New_York" },
      body: JSON.stringify({ content, moonPhase: "new_moon", ...extra }),
    });
  const basicPath = "/api/dreams/decode";
  const enhancedPath = "/api/dreams/enhanced-decode";
  const savedPath = `/api/dreams/${savedDreamId}/enhanced-decode`;
  try {
    await db.insert(dreams).values({
      id: savedDreamId, userId: ids[0], title: "Synthetic quota test", content: "SYNTHETIC",
    });

    await t.test("five successes shared across all three endpoints; sixth is blocked everywhere before AI", async () => {
      for (const path of [basicPath, enhancedPath, savedPath, basicPath, enhancedPath]) {
        const response = await post(ids[0], path);
        assert.equal(response.status, 200, await response.text());
      }
      const before = aiCalls;
      for (const path of [basicPath, enhancedPath, savedPath]) {
        const response = await post(ids[0], path, "SYNTHETIC", {
          userId: ids[4], is_demo: true, entitlement: "PSYRA_PLUS",
        });
        assert.equal(response.status, 429);
        const body = await response.json();
        assert.equal(body.heading, INTERPRETATION_LIMIT_HEADING);
        assert.equal(body.error, DAILY_LIMIT_MESSAGES.interpretations);
      }
      assert.equal(aiCalls, before);
      const status = await interpretationAllowance(actors[0], "Pacific/Auckland");
      assert.equal(status.remaining, 0);
      assert.equal(status.timeZone, "America/New_York");
    });

    await t.test("parallel calls across endpoints/devices cannot exceed five AI successes", async () => {
      const before = aiCalls;
      const responses = await Promise.all(Array.from({ length: 12 }, (_, index) =>
        post(ids[1], index % 2 ? basicPath : enhancedPath),
      ));
      assert.equal(responses.filter(response => response.status === 200).length, 5);
      assert.equal(responses.filter(response => response.status === 429).length, 7);
      assert.equal(aiCalls - before, 5);
    });

    await t.test("AI failure, basic keyword fallback and failed persistence do not consume allowance", async () => {
      assert.equal((await post(ids[2], enhancedPath, "AI_FAIL")).status, 500);
      assert.equal((await post(ids[2], basicPath, "BASIC_FAIL")).status, 200);
      await assert.rejects(withInterpretationAllowance(actors[2], "UTC", async () => {
        throw new Error("Synthetic persistence failure");
      }));
      assert.equal((await interpretationAllowance(actors[2], "UTC")).remaining, 5);
      for (let i = 0; i < 5; i++) assert.equal((await post(ids[2], enhancedPath)).status, 200);
      assert.equal((await post(ids[2], basicPath)).status, 429);
    });

    await t.test("different account has an independent allowance", async () => {
      assert.equal((await post(ids[3], enhancedPath)).status, 200);
      assert.equal((await interpretationAllowance(actors[3], "UTC")).remaining, 4);
    });

    await t.test("verified demo plus private flag remains exempt; matching email alone is not", async () => {
      for (let i = 0; i < 7; i++) assert.equal((await post(ids[4], enhancedPath)).status, 200);
      const demo = await interpretationAllowance(actors[4], "UTC");
      assert.equal(demo.exempt, true);
      assert.equal(demo.remaining, null);
      for (let i = 0; i < 5; i++) assert.equal((await post(ids[5], enhancedPath)).status, 200);
      assert.equal((await post(ids[5], enhancedPath)).status, 429);
    });

    await t.test("daily rollover resets all counters using the saved account zone", async () => {
      await db.update(dailyUsage).set({
        usageDay: "2000-01-01", dreamCount: 5, tarotCount: 3, interpretationCount: 5,
      }).where(eq(dailyUsage.userId, ids[0]));
      const status = await interpretationAllowance(actors[0], "Pacific/Auckland");
      assert.equal(status.remaining, 5);
      assert.equal(status.timeZone, "America/New_York");
      assert.ok(Date.parse(status.resetsAt) > Date.now());
      const [row] = await db.select().from(dailyUsage).where(eq(dailyUsage.userId, ids[0]));
      assert.equal(row.dreamCount, 0);
      assert.equal(row.tarotCount, 0);
      assert.equal(row.interpretationCount, 0);
    });

    await t.test("invalid input, missing/foreign dreams, missing consent and anonymous calls never reach AI", async () => {
      const before = aiCalls;
      assert.equal((await post(ids[3], basicPath, "")).status, 400);
      assert.equal((await post(ids[3], enhancedPath, "")).status, 400);
      assert.equal((await post(ids[3], savedPath)).status, 404);
      const metadata = actors[3].privateMetadata;
      actors[3].privateMetadata = {};
      assert.equal((await post(ids[3], enhancedPath)).status, 428);
      actors[3].privateMetadata = metadata;
      assert.equal((await post("", enhancedPath)).status, 401);
      assert.equal(aiCalls, before);
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    t.mock.restoreAll();
    await db.delete(dreams).where(inArray(dreams.userId, ids));
    await db.delete(dailyUsage).where(inArray(dailyUsage.userId, ids));
    await db.$client.end();
  }
});
