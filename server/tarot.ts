import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { dreams } from "../shared/schema";
import { chooseDreamTarotCards, storage } from "./storage";
import { createTarotService, type TarotRepository } from "./tarot-service";
import { withDailyUsage, type UsageTransaction } from "./daily-usage";
import type { TarotSpreadId } from "../shared/tarot";

function repository(transaction?: UsageTransaction): TarotRepository {
  return {
    listDreams: userId => transaction
      ? transaction.select().from(dreams).where(eq(dreams.userId, userId))
      : storage.getDreams(userId),
    withDreamLock: (userId, dreamId, work) => {
      const run = async (tx: UsageTransaction) => {
        const condition = and(eq(dreams.userId, userId), eq(dreams.id, dreamId));
        // Row locking deduplicates concurrent pulls across tabs, devices and servers.
        const [dream] = await tx.select().from(dreams).where(condition).for("update");
        if (!dream) throw new Error("Dream not found");
        return work(dream, async decodedInsights => {
          await tx.update(dreams).set({ decodedInsights }).where(condition);
        });
      };
      return transaction ? run(transaction) : db.transaction(run);
    },
  };
}

export const tarotRepository = repository();
export const tarotService = createTarotService(tarotRepository, chooseDreamTarotCards);

export function drawTarotWithDailyLimit(userId: string, spreadId: TarotSpreadId, timeZone: unknown) {
  return withDailyUsage(userId, timeZone, (quota, tx) =>
    createTarotService(repository(tx), chooseDreamTarotCards).draw(
      userId, spreadId, count => quota.consume("tarot", count),
    ),
  );
}
