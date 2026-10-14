import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createTarotService } from "./tarot-service";
import { TAROT_POSITIONS } from "../shared/tarot";

test("database row locks deduplicate pulls and preserve cache across interpretation saves", {
  skip: process.env.RUN_TAROT_DB_TEST !== "1",
}, async () => {
  const { storage } = await import("./storage");
  const { tarotRepository } = await import("./tarot");
  const userId = `tarot-test-${randomUUID()}`;
  const otherId = `tarot-test-${randomUUID()}`;
  const insights = JSON.stringify({ interpretation: {
    dreamOverview: "An imaginary forest path.", keySymbols: [{ symbol: "path", meaning: "direction" }],
    coreThemes: ["direction"], emotionalLandscape: "Curiosity", shadowElements: "Hesitation", dreamsMessage: "Explore gently",
  } });
  const owned = await storage.createDream(userId, {
    title: "Synthetic Tarot test", content: "Synthetic test content, not a real journal.",
    decodedInsights: insights, date: new Date("2026-10-01"), emotions: [], themes: [], symbols: [],
  });
  let other: Awaited<ReturnType<typeof storage.createDream>> | undefined;
  try {
    other = await storage.createDream(otherId, {
      title: "Other synthetic user's dream", content: "Synthetic test content.",
      decodedInsights: insights, date: new Date("2026-12-01"), emotions: [], themes: [], symbols: [],
    });
    let calls = 0;
    const choose: Parameters<typeof createTarotService>[1] = async (_input, spread) => {
      calls++;
      await new Promise(resolve => setTimeout(resolve, 40));
      return { cards: TAROT_POSITIONS[spread].map((position, card_id) => ({
        position, card_id, reason: "Your forest path reflects a new direction and a sense of curiosity.",
      })) };
    };
    const a = createTarotService(tarotRepository, choose);
    const b = createTarotService(tarotRepository, choose);
    const [first, repeat] = await Promise.all([a.draw(userId, "dream"), b.draw(userId, "dream")]);
    assert.equal(calls, 1);
    assert.equal(first.dream?.id, owned.id);
    assert.deepEqual(first.cards, repeat.cards);
    assert.equal(await storage.getDream(otherId, owned.id), undefined);
    await storage.updateDream(userId, owned.id, { decodedInsights: insights });
    const restored = await b.context(userId);
    assert.deepEqual(restored.savedPull?.cards, first.cards);
    assert.equal((await b.draw(userId, "dream")).cached, true);
    assert.equal(calls, 1);
    assert.equal((await b.context(otherId)).savedPull, null);
  } finally {
    await storage.deleteDream(userId, owned.id);
    if (other) await storage.deleteDream(otherId, other.id);
  }
});
