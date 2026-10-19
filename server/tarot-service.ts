import { z } from "zod";
import type { Dream } from "../shared/schema";
import {
  TAROT_DECK, TAROT_POSITIONS,
  type TarotSpreadId, type TarotSelection, type SavedTarotPull,
  type DreamTarotPull, type TarotContext,
} from "../shared/tarot";

const object = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
const text = (value: unknown) =>
  typeof value === "string" ? value.trim().slice(0, 6000) : "";
const texts = (value: unknown) =>
  Array.isArray(value) ? value.map(text).filter(Boolean).slice(0, 12) : [];

export function readEnvelope(value: string | null): Record<string, unknown> | null {
  try { return object(JSON.parse(value || "")); } catch { return null; }
}

export function savedInterpretation(dream: Dream) {
  const envelope = readEnvelope(dream.decodedInsights);
  if (!envelope) return null;
  const reading = object(envelope.interpretation) ?? envelope;
  const symbols = reading.keySymbols ?? reading.symbols;
  const result = {
    dreamOverview: text(reading.dreamOverview ?? reading.overview ?? reading.insight),
    keySymbols: Array.isArray(symbols) ? symbols.slice(0, 12).flatMap(value => {
      const item = object(value);
      const symbol = text(item?.symbol);
      return symbol ? [{ symbol, meaning: text(item?.meaning) }] : [];
    }) : [],
    coreThemes: texts(reading.coreThemes ?? reading.themes),
    emotionalLandscape: text(reading.emotionalLandscape) || texts(reading.emotions).join(", "),
    shadowElements: text(reading.shadowElements),
    dreamsMessage: text(reading.dreamsMessage ?? reading.dreamMessage ?? reading.message ?? reading.insight),
  };
  return result.dreamOverview || result.keySymbols.length || result.coreThemes.length ||
    result.emotionalLandscape || result.shadowElements || result.dreamsMessage ? result : null;
}

export function latestInterpretedDream(dreams: Dream[], userId: string) {
  return dreams.filter(dream => dream.userId === userId && savedInterpretation(dream))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date) || b.id.localeCompare(a.id))[0];
}

const aiCardSchema = z.object({
  card_id: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(Number)])
    .refine(id => TAROT_DECK.some(card => card.id === id)),
  position: z.string(),
  reason: z.string().trim().min(12).max(1500),
});

export function validateAISelection(value: unknown, spreadId: TarotSpreadId): TarotSelection[] {
  const { cards } = z.object({ cards: z.array(aiCardSchema) }).parse(value);
  const positions = TAROT_POSITIONS[spreadId];
  if (cards.length !== positions.length || new Set(cards.map(card => card.card_id)).size !== cards.length) {
    throw new Error("Incorrect card count or duplicate Tarot card");
  }
  return positions.map(position => {
    const card = cards.find(item => item.position.toUpperCase() === position.toUpperCase());
    if (!card) throw new Error("Incorrect Tarot positions");
    return { ...card, position, reversed: Math.random() > 0.7 };
  });
}

export function randomSelection(spreadId: TarotSpreadId): TarotSelection[] {
  const deck = [...TAROT_DECK];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return TAROT_POSITIONS[spreadId].map((position, index) => ({
    position, card_id: deck[index].id, reason: "", reversed: Math.random() > 0.7,
  }));
}

function cachedPull(dream: Dream, spreadId: TarotSpreadId): SavedTarotPull | null {
  const entry = object(object(readEnvelope(dream.decodedInsights)?.tarotPulls)?.[spreadId]);
  if (!entry || entry.spreadId !== spreadId || !["dream", "random"].includes(String(entry.source))) return null;
  try {
    const cards = z.array(aiCardSchema.extend({
      reason: entry.source === "random" ? z.string().max(1500) : aiCardSchema.shape.reason,
      reversed: z.boolean(),
    })).parse(entry.cards);
    const positions = TAROT_POSITIONS[spreadId];
    if (cards.length !== positions.length || new Set(cards.map(card => card.card_id)).size !== cards.length ||
      cards.some((card, index) => card.position !== positions[index]) ||
      !text(entry.createdAt)) return null;
    return { spreadId, source: entry.source as SavedTarotPull["source"], cards, createdAt: text(entry.createdAt) };
  } catch { return null; }
}

// Interpretation edits must not allow a client to replace or accidentally erase
// server-selected cards for the same dream.
export function preserveTarotCache(previous: string | null, next: string): string {
  const incoming = readEnvelope(next);
  if (!incoming) return next;
  const old = readEnvelope(previous);
  delete incoming.tarotPulls;
  delete incoming.tarotLastSpread;
  if (old?.tarotPulls) incoming.tarotPulls = old.tarotPulls;
  if (old?.tarotLastSpread) incoming.tarotLastSpread = old.tarotLastSpread;
  return JSON.stringify(incoming);
}

export interface TarotRepository {
  listDreams(userId: string): Promise<Dream[]>;
  withDreamLock<T>(userId: string, dreamId: string, work: (
    dream: Dream, save: (insights: string) => Promise<void>,
  ) => Promise<T>): Promise<T>;
}

export function createTarotService(
  repository: TarotRepository,
  choose: (interpretation: NonNullable<ReturnType<typeof savedInterpretation>>, spreadId: TarotSpreadId) => Promise<unknown>,
) {
  const describe = (dream: Dream) => ({ id: dream.id, title: dream.title });
  return {
    async context(userId: string): Promise<TarotContext> {
      const dream = latestInterpretedDream(await repository.listDreams(userId), userId);
      if (!dream) return { dream: null, savedPull: null, pulls: {} };
      const last = readEnvelope(dream.decodedInsights)?.tarotLastSpread;
      const spreadId = typeof last === "string" && Object.hasOwn(TAROT_POSITIONS, last)
        ? last as TarotSpreadId : null;
      const pulls: TarotContext["pulls"] = {};
      for (const id of Object.keys(TAROT_POSITIONS) as TarotSpreadId[]) {
        const saved = cachedPull(dream, id);
        if (saved) pulls[id] = { ...saved, dream: describe(dream), cached: true };
      }
      return { dream: describe(dream), pulls, savedPull: spreadId ? pulls[spreadId] ?? null : null };
    },
    async draw(
      userId: string,
      spreadId: TarotSpreadId,
      beforeNewPull?: (cardCount: number) => Promise<void>,
    ): Promise<DreamTarotPull> {
      const dream = latestInterpretedDream(await repository.listDreams(userId), userId);
      if (!dream) {
        await beforeNewPull?.(TAROT_POSITIONS[spreadId].length);
        return { dream: null, spreadId, cards: randomSelection(spreadId), source: "random", cached: false, createdAt: new Date().toISOString() };
      }
      return repository.withDreamLock(userId, dream.id, async (lockedDream, save) => {
        if (lockedDream.userId !== userId) throw new Error("Dream ownership mismatch");
        const interpretation = savedInterpretation(lockedDream);
        if (!interpretation) throw new Error("Dream interpretation changed");
        let saved = cachedPull(lockedDream, spreadId);
        const cached = Boolean(saved);
        if (!saved) {
          // Outside the AI fallback: quota errors must never become random cards.
          await beforeNewPull?.(TAROT_POSITIONS[spreadId].length);
          let cards: TarotSelection[];
          let source: SavedTarotPull["source"] = "dream";
          try {
            cards = validateAISelection(await choose(interpretation, spreadId), spreadId);
          } catch {
            // A failed selection is also saved: repeated opens must not retry AI.
            console.warn("Dream Tarot selection unavailable; using a saved random spread.");
            source = "random";
            cards = randomSelection(spreadId);
          }
          saved = { spreadId, source, cards, createdAt: new Date().toISOString() };
        }
        const envelope = readEnvelope(lockedDream.decodedInsights)!;
        envelope.tarotPulls = { ...object(envelope.tarotPulls), [spreadId]: saved };
        envelope.tarotLastSpread = spreadId;
        if (!cached || readEnvelope(lockedDream.decodedInsights)?.tarotLastSpread !== spreadId) {
          await save(JSON.stringify(envelope));
        }
        return { ...saved, dream: describe(lockedDream), cached };
      });
    },
  };
}
