import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { dreams } from "../shared/schema";
import { chooseDreamTarotCards, storage } from "./storage";
import { createTarotService, type TarotRepository } from "./tarot-service";

export const tarotRepository: TarotRepository = {
  listDreams: userId => storage.getDreams(userId),
  withDreamLock: (userId, dreamId, work) => db.transaction(async tx => {
    const condition = and(eq(dreams.userId, userId), eq(dreams.id, dreamId));
    // Row locking deduplicates concurrent pulls across tabs, devices and servers.
    const [dream] = await tx.select().from(dreams).where(condition).for("update");
    if (!dream) throw new Error("Dream not found");
    return work(dream, async decodedInsights => {
      await tx.update(dreams).set({ decodedInsights }).where(condition);
    });
  }),
};

export const tarotService = createTarotService(tarotRepository, chooseDreamTarotCards);
