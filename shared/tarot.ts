// The allowed deck for dream-based selection. IDs match the existing card art
// and detailed meanings in the Tarot page.
export const TAROT_DECK = [
  { id: 0, name: "The Fool" },
  { id: 1, name: "The Magician" },
  { id: 2, name: "The High Priestess" },
  { id: 3, name: "The Empress" },
  { id: 4, name: "The Emperor" },
  { id: 5, name: "The Hierophant" },
  { id: 6, name: "The Lovers" },
  { id: 7, name: "The Chariot" },
  { id: 8, name: "Strength" },
  { id: 9, name: "The Hermit" },
  { id: 10, name: "Wheel of Fortune" },
  { id: 11, name: "Justice" },
  { id: 12, name: "The Hanged Man" },
  { id: 13, name: "Death" },
  { id: 14, name: "Temperance" },
  { id: 15, name: "The Devil" },
  { id: 16, name: "The Tower" },
  { id: 17, name: "The Star" },
  { id: 18, name: "The Moon" },
  { id: 19, name: "The Sun" },
  { id: 20, name: "Judgement" },
  { id: 21, name: "The World" },
] as const;

export const TAROT_POSITIONS = {
  single: ["Your Message"],
  "past-present-future": ["Past", "Present", "Future"],
  dream: ["The Symbol", "The Shadow", "The Guidance"],
} as const;

export type TarotSpreadId = keyof typeof TAROT_POSITIONS;
export interface TarotSelection {
  card_id: number;
  position: string;
  reason: string;
  reversed: boolean;
}
export interface SavedTarotPull {
  spreadId: TarotSpreadId;
  source: "dream" | "random";
  cards: TarotSelection[];
  createdAt: string;
}
export interface DreamTarotPull extends SavedTarotPull {
  dream: { id: string; title: string } | null;
  cached: boolean;
}
export interface TarotContext {
  dream: { id: string; title: string } | null;
  savedPull: DreamTarotPull | null;
  pulls: Partial<Record<TarotSpreadId, DreamTarotPull>>;
}
