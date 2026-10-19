import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import { dailyUsage, dreams } from "../shared/schema";
import { DAILY_LIMIT_MESSAGES, canonicalTimeZone, dailyLimitMessage, DailyLimitError } from "../shared/daily-limits";
import { assertDailyAllowance, withDailyUsage } from "./daily-usage";

test("allowances are exactly five dreams and three cards for all accounts", () => {
  assertDailyAllowance("dreams", 4, 1);
  assertDailyAllowance("tarot", 2, 1);
  assertDailyAllowance("tarot", 0, 3);
  assert.throws(() => assertDailyAllowance("dreams", 5, 1), DailyLimitError);
  assert.throws(() => assertDailyAllowance("tarot", 3, 1), DailyLimitError);
  assert.throws(() => assertDailyAllowance("tarot", 1, 3), DailyLimitError);
  assert.throws(() => assertDailyAllowance("dreams", 0, -1));
  assertDailyAllowance("interpretations", 4, 1);
  assert.throws(() => assertDailyAllowance("interpretations", 5, 1), DailyLimitError);
});

test("exact friendly messages survive the API error format", () => {
  for (const message of Object.values(DAILY_LIMIT_MESSAGES)) {
    assert.equal(dailyLimitMessage(new Error(`429: ${JSON.stringify({ error: message })}`)), message);
    assert.doesNotMatch(message, /upgrad|premium|pric|subscri|unlock/i);
  }
  assert.equal(dailyLimitMessage(new Error("network error")), undefined);
});

test("IANA zones are validated; missing or invalid zones safely use UTC", () => {
  assert.equal(canonicalTimeZone("America/New_York"), "America/New_York");
  assert.equal(canonicalTimeZone("Pacific/Auckland"), "Pacific/Auckland");
  assert.equal(canonicalTimeZone("not/a-zone"), "UTC");
  assert.equal(canonicalTimeZone(undefined), "UTC");
});

test("database-backed quota concurrency, resets, isolation and rollback", async t => {
  const ids = Array.from({ length: 6 }, () => `daily-usage-test-${randomUUID()}`);
  try {
    await t.test("parallel dream saves cannot exceed five", async () => {
      const results = await Promise.allSettled(Array.from({ length: 12 }, () =>
        withDailyUsage(ids[0], "America/New_York", async (quota, tx) => {
          await quota.consume("dreams", 1);
          await tx.insert(dreams).values({
            userId: ids[0], title: "Quota test", content: "Synthetic test only",
          });
        }),
      ));
      assert.equal(results.filter(result => result.status === "fulfilled").length, 5);
      const rejected = results.filter(result => result.status === "rejected");
      assert.equal(rejected.length, 7);
      for (const result of rejected) {
        if (result.status === "rejected") assert.equal(result.reason.message, DAILY_LIMIT_MESSAGES.dreams);
      }
      const saved = await db.select().from(dreams).where(eq(dreams.userId, ids[0]));
      assert.equal(saved.length, 5);
    });

    await t.test("deleting/backdating dreams and changing the reported zone cannot reset usage", async () => {
      await db.delete(dreams).where(eq(dreams.userId, ids[0]));
      await assert.rejects(withDailyUsage(ids[0], "Pacific/Auckland", quota => quota.consume("dreams", 1)), DailyLimitError);
      const [row] = await db.select().from(dailyUsage).where(eq(dailyUsage.userId, ids[0]));
      assert.equal(row.timeZone, "America/New_York");
      assert.equal(row.dreamCount, 5);
    });

    await t.test("per-user counts and dream/Tarot allowances are independent", async () => {
      await withDailyUsage(ids[1], "America/New_York", quota => quota.consume("dreams", 5));
      await withDailyUsage(ids[1], "America/New_York", quota => quota.consume("tarot", 3));
      await withDailyUsage(ids[1], "America/New_York", quota => quota.consume("interpretations", 5));
      await assert.rejects(withDailyUsage(ids[1], "UTC", quota => quota.consume("tarot", 1)), DailyLimitError);
      await withDailyUsage(ids[2], "UTC", quota => quota.consume("tarot", 3));
    });

    await t.test("concurrent single-card draws cannot exceed three", async () => {
      const results = await Promise.allSettled(Array.from({ length: 10 }, () =>
        withDailyUsage(ids[3], "UTC", quota => quota.consume("tarot", 1)),
      ));
      assert.equal(results.filter(result => result.status === "fulfilled").length, 3);
      assert.equal(results.filter(result => result.status === "rejected").length, 7);
    });

    await t.test("both counters reset together when the account's local date changes", async () => {
      await db.update(dailyUsage).set({ usageDay: "2000-01-01" }).where(eq(dailyUsage.userId, ids[1]));
      await withDailyUsage(ids[1], "UTC", async quota => {
        await quota.consume("dreams", 5);
        await quota.consume("tarot", 3);
        await quota.consume("interpretations", 5);
      });
      const [row] = await db.select().from(dailyUsage).where(eq(dailyUsage.userId, ids[1]));
      assert.equal(row.dreamCount, 5);
      assert.equal(row.tarotCount, 3);
      assert.equal(row.interpretationCount, 5);
      assert.notEqual(row.usageDay, "2000-01-01");
    });

    await t.test("failed actions roll back the usage reservation", async () => {
      await withDailyUsage(ids[4], "UTC", async () => undefined);
      await assert.rejects(withDailyUsage(ids[4], "UTC", async quota => {
        await quota.consume("dreams", 1);
        await quota.consume("tarot", 1);
        await quota.consume("interpretations", 1);
        throw new Error("Simulated save failure");
      }));
      await withDailyUsage(ids[4], "UTC", async quota => {
        await quota.consume("dreams", 5);
        await quota.consume("tarot", 3);
        await quota.consume("interpretations", 5);
      });
    });

    await t.test("missing zone is explicitly stored as UTC", async () => {
      await withDailyUsage(ids[5], undefined, quota => quota.consume("dreams", 1));
      const [row] = await db.select().from(dailyUsage).where(eq(dailyUsage.userId, ids[5]));
      assert.equal(row.timeZone, "UTC");
    });

    await t.test("local midnight and daylight saving boundaries use IANA calendar dates", async () => {
      for (const [instant, zone, expected] of [
        ["2026-10-19T03:59:59Z", "America/New_York", "2026-10-18"],
        ["2026-10-19T04:00:00Z", "America/New_York", "2026-10-19"],
        ["2026-11-01T05:59:59Z", "America/New_York", "2026-11-01"],
        ["2026-11-01T06:00:00Z", "America/New_York", "2026-11-01"],
        ["2026-11-02T04:59:59Z", "America/New_York", "2026-11-01"],
        ["2026-11-02T05:00:00Z", "America/New_York", "2026-11-02"],
        ["2026-03-09T03:59:59Z", "America/New_York", "2026-03-08"],
        ["2026-03-09T04:00:00Z", "America/New_York", "2026-03-09"],
        ["2026-10-18T11:00:00Z", "Pacific/Auckland", "2026-10-19"],
      ]) {
        const result = await db.execute(sql`
          SELECT to_char(${instant}::timestamptz AT TIME ZONE ${zone}, 'YYYY-MM-DD') AS day
        `);
        assert.equal(result.rows[0].day, expected);
      }
    });
  } finally {
    // Only synthetic users allocated by this test are ever removed.
    await db.delete(dreams).where(inArray(dreams.userId, ids));
    await db.delete(dailyUsage).where(inArray(dailyUsage.userId, ids));
    await db.$client.end();
  }
});
