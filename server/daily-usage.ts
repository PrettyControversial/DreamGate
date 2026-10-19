import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { dailyUsage } from "../shared/schema";
import { canonicalTimeZone, DAILY_LIMITS, DailyLimitError, type DailyUsageKind } from "../shared/daily-limits";

export type UsageTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export function assertDailyAllowance(kind: DailyUsageKind, used: number, amount: number) {
  if (!Number.isInteger(amount) || amount < 1) throw new Error("Invalid daily usage amount");
  if (used + amount > DAILY_LIMITS[kind]) throw new DailyLimitError(kind);
}

/**
 * One locked row per authenticated account serializes actions across devices,
 * server processes and concurrent requests. Counts and the action commit in
 * the SAME transaction; a failed save/draw never consumes the allowance.
 */
export async function withDailyUsage<T>(
  userId: string,
  reportedTimeZone: unknown,
  work: (quota: { consume: (kind: DailyUsageKind, amount: number) => Promise<void> }, tx: UsageTransaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async tx => {
    await tx.insert(dailyUsage).values({
      userId, timeZone: canonicalTimeZone(reportedTimeZone),
    }).onConflictDoNothing();
    const [usage] = await tx.select().from(dailyUsage)
      .where(eq(dailyUsage.userId, userId)).for("update");
    // Pin the first reported IANA zone to the account. Changing request
    // headers/device clock cannot move the reset or obtain a second allowance.
    // clock_timestamp is evaluated after acquiring the lock, not at tx start.
    const result = await tx.execute(sql`
      SELECT to_char(clock_timestamp() AT TIME ZONE ${usage.timeZone}, 'YYYY-MM-DD') AS day
    `);
    const day = String(result.rows[0].day);
    if (usage.usageDay !== day) {
      usage.usageDay = day;
      usage.dreamCount = 0;
      usage.tarotCount = 0;
      await tx.update(dailyUsage).set({
        usageDay: day, dreamCount: 0, tarotCount: 0,
      }).where(eq(dailyUsage.userId, userId));
    }
    return work({
      consume: async (kind, amount) => {
        const field = kind === "dreams" ? "dreamCount" : "tarotCount";
        assertDailyAllowance(kind, usage[field], amount);
        usage[field] += amount;
        await tx.update(dailyUsage).set({ [field]: usage[field] })
          .where(eq(dailyUsage.userId, userId));
      },
    }, tx);
  });
}
