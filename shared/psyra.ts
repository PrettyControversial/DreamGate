export interface ArchetypeDefinition {
  id: string;
  name: string;
  displayName: string;
  subtitle: string;
  imagePath: string;
  expectedFileName: string;
  shortDescription: string;
  keywords: string[];
  category: "archetype";
  isArchetype: true;
}

export interface PsycheDimensionDefinition {
  id: "shadow" | "persona" | "self" | "ego";
  name: string;
  imagePath: string | null;
  expectedFileName: string | null;
  category: "psyche_dimension";
  isArchetype: false;
  shortDescription: string;
  detail: string;
  dreamRole: string;
  reflectionPrompt: string;
}

export const archetypes: ArchetypeDefinition[] = [
  { id: "innocent", name: "Innocent", displayName: "The Innocent", subtitle: "Trust and Renewal", imagePath: "/archetypes/IMG_3535.jpeg", expectedFileName: "IMG_3535.jpeg", shortDescription: "The part of the psyche that seeks trust, simplicity, hope, and a return to what feels whole.", keywords: ["hope", "light", "beginnings", "safety", "renewal"], category: "archetype", isArchetype: true },
  { id: "explorer", name: "Explorer", displayName: "The Explorer", subtitle: "The Call Beyond", imagePath: "/archetypes/IMG_3536.jpeg", expectedFileName: "IMG_3536.jpeg", shortDescription: "The impulse toward freedom, discovery, and a more authentic path.", keywords: ["journey", "freedom", "path", "search", "unknown"], category: "archetype", isArchetype: true },
  { id: "sage", name: "Sage", displayName: "The Sage", subtitle: "The Search for Truth", imagePath: "/archetypes/IMG_3528.jpeg", expectedFileName: "IMG_3528.jpeg", shortDescription: "The inner witness that seeks understanding, truth, perspective, and earned wisdom.", keywords: ["wisdom", "teacher", "knowledge", "clarity", "guidance"], category: "archetype", isArchetype: true },
  { id: "hero", name: "Hero", displayName: "The Hero", subtitle: "The Courage to Become", imagePath: "/archetypes/IMG_3547.jpeg", expectedFileName: "IMG_3547.jpeg", shortDescription: "The force that meets a challenge, accepts a difficult task, and grows through action.", keywords: ["challenge", "courage", "trial", "victory", "strength"], category: "archetype", isArchetype: true },
  { id: "rebel", name: "Rebel", displayName: "The Rebel", subtitle: "The Liberating Disruption", imagePath: "/archetypes/IMG_3537.jpeg", expectedFileName: "IMG_3537.jpeg", shortDescription: "The energy that breaks stale rules, confronts constraint, and makes transformation possible.", keywords: ["revolt", "freedom", "disruption", "serpent", "change"], category: "archetype", isArchetype: true },
  { id: "magician", name: "Magician", displayName: "The Magician", subtitle: "The Agent of Transformation", imagePath: "/archetypes/IMG_3545.jpeg", expectedFileName: "IMG_3545.jpeg", shortDescription: "The capacity to connect inner and outer worlds and turn insight into transformation.", keywords: ["transformation", "energy", "synchronicity", "power", "manifestation"], category: "archetype", isArchetype: true },
  { id: "everyman", name: "Everyman", displayName: "The Everyman", subtitle: "The Need to Belong", imagePath: "/archetypes/IMG_3540.jpeg", expectedFileName: "IMG_3540.jpeg", shortDescription: "The longing for belonging, equality, community, and an honest place among others.", keywords: ["belonging", "community", "ordinary", "connection", "home"], category: "archetype", isArchetype: true },
  { id: "lover", name: "Lover", displayName: "The Lover", subtitle: "The Longing for Union", imagePath: "/archetypes/IMG_3534.jpeg", expectedFileName: "IMG_3534.jpeg", shortDescription: "The movement toward intimacy, devotion, beauty, and meaningful connection.", keywords: ["love", "union", "desire", "beauty", "devotion"], category: "archetype", isArchetype: true },
  { id: "jester", name: "Jester", displayName: "The Jester", subtitle: "The Disruptive Truth", imagePath: "/archetypes/IMG_3546.jpeg", expectedFileName: "IMG_3546.jpeg", shortDescription: "The playful intelligence that punctures certainty, changes perspective, and reveals truth through paradox.", keywords: ["play", "masks", "humor", "paradox", "surprise"], category: "archetype", isArchetype: true },
  { id: "caregiver", name: "Caregiver", displayName: "The Caregiver", subtitle: "The Instinct to Protect", imagePath: "/archetypes/IMG_3541.jpeg", expectedFileName: "IMG_3541.jpeg", shortDescription: "The nurturing force that protects, tends, repairs, and responds to vulnerability.", keywords: ["care", "mother", "healing", "protection", "service"], category: "archetype", isArchetype: true },
  { id: "creator", name: "Creator", displayName: "The Creator", subtitle: "The Form-Giving Imagination", imagePath: "/archetypes/IMG_3539.jpeg", expectedFileName: "IMG_3539.jpeg", shortDescription: "The need to imagine, shape, express, and bring something original into being.", keywords: ["creation", "art", "vision", "expression", "form"], category: "archetype", isArchetype: true },
  { id: "ruler", name: "Ruler", displayName: "The Ruler", subtitle: "The Principle of Order", imagePath: "/archetypes/IMG_3530.jpeg", expectedFileName: "IMG_3530.jpeg", shortDescription: "The organizing force that seeks responsibility, structure, authority, and durable order.", keywords: ["order", "control", "leadership", "structure", "authority"], category: "archetype", isArchetype: true },
];

export const psycheDimensions: PsycheDimensionDefinition[] = [
  { id: "shadow", name: "Shadow", imagePath: "/archetypes/IMG_3542.jpeg", expectedFileName: "IMG_3542.jpeg", category: "psyche_dimension", isArchetype: false, shortDescription: "The qualities, feelings, and possibilities outside the identity you usually show the world.", detail: "The Shadow is not simply a storehouse of bad qualities. It can include strength, desire, anger, creativity, or vulnerability that the conscious personality has not fully recognized. Dreams may give these unfamiliar qualities a figure, animal, place, or atmosphere.", dreamRole: "Notice what you avoid, judge, fear, or feel unexpectedly drawn toward. The image may be asking for curiosity rather than rejection.", reflectionPrompt: "What quality in this dream do you most want to push away—and what might it offer if you listened carefully?" },
  { id: "persona", name: "Persona", imagePath: "/archetypes/IMG_3544.jpeg", expectedFileName: "IMG_3544.jpeg", category: "psyche_dimension", isArchetype: false, shortDescription: "The social face, role, or identity you shape for the outer world.", detail: "The Persona helps us move through relationships, work, family, and culture. It becomes limiting when a role is mistaken for the whole self. Dreams may show masks, costumes, performances, changed faces, or moments when a familiar role no longer fits.", dreamRole: "Compare the version of yourself in the dream with the version others expect you to be. The tension can reveal where authenticity wants more room.", reflectionPrompt: "Which role were you performing in the dream, and what felt different underneath it?" },
  { id: "self", name: "Self", imagePath: "/archetypes/IMG_3527.jpeg", expectedFileName: "IMG_3527.jpeg", category: "psyche_dimension", isArchetype: false, shortDescription: "The psyche’s movement toward wholeness, balance, and integration.", detail: "The Self is Jung’s name for the wider organizing center of the psyche—the conscious and unconscious life held together. It is not an idealized personality or a fixed destination. Dreams can approach this dimension through mandalas, circles, centers, luminous figures, reunions, or a felt sense of inner order.", dreamRole: "Ask what different parts of your life are trying to relate to one another. The invitation is usually toward integration, not perfection.", reflectionPrompt: "What two seemingly separate parts of your life or inner world are trying to meet in this dream?" },
  { id: "ego", name: "Ego", imagePath: "/archetypes/ego-depth-psychology.webp", expectedFileName: "ego-depth-psychology.webp", category: "psyche_dimension", isArchetype: false, shortDescription: "The conscious point of view that says “I” and meets the dream world.", detail: "The Ego is the center of conscious awareness: the part that notices, chooses, remembers, and makes meaning. It is important, but it is not the whole psyche. Dreams often reveal how the conscious Ego responds when it encounters something larger, stranger, or more emotionally powerful than expected.", dreamRole: "Watch whether the dream Ego is controlling, avoiding, observing, surrendering, or learning. Its response can show the relationship between waking identity and the unconscious.", reflectionPrompt: "How did the dreaming ‘you’ respond—and what other response might have been possible?" },
];

export const askPsyraHero = {
  imagePath: "/archetypes/IMG_3543.jpeg",
  expectedFileName: "IMG_3543.jpeg",
};

export function normalizeArchetypeId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/outlaw/g, "rebel")
    .replace(/regular\s+person/g, "everyman")
    .replace(/[^a-z]/g, "");
  return archetypes.some((item) => item.id === normalized) ? normalized : undefined;
}

export function getArchetype(id: string | undefined) {
  return archetypes.find((item) => item.id === id);
}