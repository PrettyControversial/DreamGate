import { 
  type User, 
  type InsertUser, 
  type Dream, 
  type InsertDream,
  type WritingPrompt,
  type InsertWritingPrompt,
  type DreamStats,
  type CelestialData,
  type MoonPhase,
  type ZodiacSign,
  type DreamDecoding,
  type EnhancedDreamInterpretation,
  type NumerologyProfile,
  type InsertNumerology,
  type LunarCalendarDay,
  type MonthlyLunarCalendar,
  type LunarEvent,
  type EclipseType,
  type MoodEntry,
  type InsertMood,
  type SleepIntention,
  type InsertIntention,
  type DreamSymbol,
} from "@shared/schema";
import { randomUUID } from "crypto";
import OpenAI from "openai";
import { normalizeArchetypeId } from "@shared/psyra";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { dreams as dreamsTable } from "@shared/schema";
import {
  getAstronomicalSnapshot,
  getCurrentCelestialData,
  getMonthlyAstronomicalCalendar,
} from "./lunar-astronomy";

// Use Replit's managed OpenAI integration so usage is charged to this app's
// Replit account credits rather than a separately configured provider key.
const useDirectOpenAI = false;
console.log("Initializing OpenAI - using Replit-managed AI integration");

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function getRecurringSymbolsThisMonth(
  dreams: Dream[],
  now = new Date(),
): Array<{ symbol: string; count: number }> {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const counts = new Map<string, number>();

  for (const dream of dreams) {
    const dreamDate = new Date(dream.date);
    if (
      !Number.isFinite(dreamDate.getTime()) ||
      dreamDate < monthStart ||
      dreamDate >= nextMonthStart
    ) {
      continue;
    }

    let sourceSymbols = dream.symbols;
    if (sourceSymbols.length === 0 && dream.decodedInsights) {
      try {
        const decoded = JSON.parse(dream.decodedInsights) as {
          interpretation?: {
            keySymbols?: Array<{ symbol?: unknown }>;
            symbols?: Array<{ symbol?: unknown } | string>;
          };
          keySymbols?: Array<{ symbol?: unknown }>;
          symbols?: Array<{ symbol?: unknown } | string>;
        };
        const interpretation = decoded.interpretation ?? decoded;
        const legacySymbols = Array.isArray(interpretation.keySymbols)
          ? interpretation.keySymbols
          : Array.isArray(interpretation.symbols)
            ? interpretation.symbols
            : [];
        if (legacySymbols.length > 0) {
          sourceSymbols = legacySymbols
            .map((entry) => {
              if (typeof entry === "string") return entry;
              return typeof entry.symbol === "string" ? entry.symbol : "";
            })
            .filter(Boolean);
        }
      } catch {
        sourceSymbols = [];
      }
    }

    const uniqueSymbols = new Set(
      sourceSymbols
        .map((symbol) =>
          symbol
            .trim()
            .replace(/\s+/g, " ")
            .normalize("NFKC")
            .toLocaleLowerCase("en-US"),
        )
        .filter(Boolean),
    );
    uniqueSymbols.forEach((symbol) => {
      counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
    });
  }

  return Array.from(counts, ([symbol, count]) => ({ symbol, count }))
    .filter(({ count }) => count >= 2)
    .sort((left, right) => right.count - left.count || left.symbol.localeCompare(right.symbol))
    .slice(0, 5);
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  deleteUserData(userId: string): Promise<void>;
  
  getDreams(userId: string): Promise<Dream[]>;
  getDream(userId: string, id: string): Promise<Dream | undefined>;
  createDream(userId: string, dream: InsertDream): Promise<Dream>;
  updateDream(userId: string, id: string, updates: Partial<Dream>): Promise<Dream | undefined>;
  deleteDream(userId: string, id: string): Promise<boolean>;
  getDreamStats(userId: string): Promise<DreamStats>;
  decodeDream(content: string, moonPhase: MoonPhase): Promise<DreamDecoding>;
  enhancedDecodeDream(content: string): Promise<EnhancedDreamInterpretation>;
  
  getPrompts(): Promise<WritingPrompt[]>;
  getPrompt(id: string): Promise<WritingPrompt | undefined>;
  getDailyPrompt(): Promise<WritingPrompt | undefined>;
  createPrompt(prompt: InsertWritingPrompt): Promise<WritingPrompt>;
  
  getCelestialData(): Promise<CelestialData>;
  getMonthlyLunarCalendar(year: number, month: number): Promise<MonthlyLunarCalendar>;
  
  getNumerologyProfile(userId: string): Promise<NumerologyProfile | undefined>;
  createNumerologyProfile(userId: string, data: InsertNumerology): Promise<NumerologyProfile>;
  
  getMoodEntries(userId: string): Promise<MoodEntry[]>;
  createMoodEntry(userId: string, mood: InsertMood): Promise<MoodEntry>;
  
  getSleepIntentions(userId: string): Promise<SleepIntention[]>;
  getSleepIntention(userId: string, id: string): Promise<SleepIntention | undefined>;
  createSleepIntention(userId: string, intention: InsertIntention): Promise<SleepIntention>;
  updateSleepIntention(userId: string, id: string, updates: Partial<SleepIntention>): Promise<SleepIntention | undefined>;
  deleteSleepIntention(userId: string, id: string): Promise<boolean>;
  
  getDreamSymbols(): DreamSymbol[];
  searchDreamSymbols(query: string): DreamSymbol[];
}

const defaultPrompts: InsertWritingPrompt[] = [
  { prompt: "Describe a recurring dream you've had. What do you think it means?", category: "reflection" },
  { prompt: "If you could design your perfect dream, what would happen?", category: "creativity" },
  { prompt: "Write about a dream that changed how you view something in your waking life.", category: "growth" },
  { prompt: "Describe a dream where you met someone from your past. What did you want to say to them?", category: "healing" },
  { prompt: "If your dreams were a movie, what genre would it be?", category: "creativity" },
  { prompt: "Write about a place that appears often in your dreams. Why do you think you visit it?", category: "exploration" },
  { prompt: "Describe a dream where you could fly. How did it feel?", category: "exploration" },
  { prompt: "What's the strangest object that has appeared in your dreams?", category: "exploration" },
  { prompt: "Write about a nightmare you've overcome. What helped you process it?", category: "healing" },
  { prompt: "If you could invite anyone into your dreams for a conversation, who would it be?", category: "reflection" },
  { prompt: "Describe a dream that felt more real than reality.", category: "exploration" },
  { prompt: "What emotion do you feel most often in your dreams? Explore why.", category: "reflection" },
  { prompt: "Write about a dream that taught you something about yourself.", category: "growth" },
  { prompt: "If your subconscious could send you one message through your dreams, what would it be?", category: "reflection" },
  { prompt: "Describe a dream where you discovered a hidden room or secret place.", category: "exploration" },
  { prompt: "Write about reuniting with someone you've lost in a dream.", category: "healing" },
  { prompt: "What symbol appears most often in your dreams? What might it represent?", category: "reflection" },
  { prompt: "Describe your ideal dream sanctuary - a place of complete peace.", category: "creativity" },
  { prompt: "Write about a dream that helped you solve a real-world problem.", category: "growth" },
  { prompt: "If you could continue any dream you've had, which would you choose and why?", category: "creativity" },
];

function calculateMoonPhase(): MoonPhase {
  return getAstronomicalSnapshot().moonPhase;
}

const symbolMeanings: Record<string, string> = {
  water: "Emotions, subconscious, purification, or life changes",
  flying: "Freedom, ambition, escape, or transcendence",
  falling: "Loss of control, anxiety, or letting go",
  chase: "Avoidance, fear, or unresolved issues",
  death: "Transformation, endings, or new beginnings",
  house: "Self, psyche, or different aspects of personality",
  teeth: "Confidence, communication, or appearance concerns",
  animals: "Instincts, nature, or primal emotions",
  door: "Opportunities, transitions, or new phases",
  key: "Solutions, secrets, or access to hidden knowledge",
  mirror: "Self-reflection, identity, or truth",
  fire: "Passion, transformation, or destruction",
  ocean: "Deep emotions, unconscious mind, or vastness",
  forest: "Unknown, growth, or getting lost",
  snake: "Transformation, healing, or hidden fears",
  baby: "New beginnings, innocence, or vulnerability",
  car: "Life direction, control, or journey",
  school: "Learning, growth, or past experiences",
  wedding: "Commitment, transition, or union of opposites",
  running: "Escape, pursuit of goals, or avoiding issues",
  naked: "Vulnerability, authenticity, or fear of exposure",
  lost: "Uncertainty, searching for direction, or feeling disconnected",
  mountain: "Challenges, achievement, or spiritual ascent",
  bridge: "Transition, connection, or crossing to new phases",
  storm: "Emotional turmoil, cleansing, or dramatic change",
};

const moonPhaseInfluences: Record<MoonPhase, string> = {
  new_moon: "This dream comes during the New Moon, a time of new beginnings. Your subconscious may be planting seeds for future growth.",
  waxing_crescent: "The Waxing Crescent amplifies intention-setting. This dream may reveal what you're nurturing in your life.",
  first_quarter: "The First Quarter Moon highlights action and decisions. Your dream may show obstacles to overcome.",
  waxing_gibbous: "During the Waxing Gibbous, dreams often reveal what needs refinement before completion.",
  full_moon: "The Full Moon brings illumination and heightened intuition. This dream offers powerful emotional insights.",
  waning_gibbous: "The Waning Gibbous encourages gratitude and sharing. Your dream may show what you're ready to give back.",
  last_quarter: "The Last Quarter is for release. This dream may help you process what you're ready to let go.",
  waning_crescent: "The Waning Crescent brings rest and reflection. This dream is deeply introspective and healing.",
};

function decodeDreamContent(content: string, moonPhase: MoonPhase): DreamDecoding {
  const lowerContent = content.toLowerCase();
  const detectedSymbols: { symbol: string; meaning: string }[] = [];
  const detectedThemes: string[] = [];
  const detectedEmotions: string[] = [];

  for (const [symbol, meaning] of Object.entries(symbolMeanings)) {
    if (lowerContent.includes(symbol)) {
      detectedSymbols.push({ symbol, meaning });
    }
  }

  const themeKeywords: Record<string, string[]> = {
    transformation: ["change", "transform", "new", "different", "become"],
    fear: ["scared", "afraid", "terrified", "panic", "horror", "nightmare"],
    love: ["love", "heart", "romance", "kiss", "embrace", "partner"],
    journey: ["travel", "path", "road", "destination", "journey", "adventure"],
    family: ["mother", "father", "sister", "brother", "family", "home", "parent"],
    work: ["job", "office", "boss", "work", "career", "colleague"],
    conflict: ["fight", "argue", "conflict", "battle", "war", "enemy"],
    healing: ["heal", "recover", "peace", "calm", "comfort", "safe"],
  };

  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(k => lowerContent.includes(k))) {
      detectedThemes.push(theme);
    }
  }

  const emotionKeywords: Record<string, string[]> = {
    joy: ["happy", "joy", "laugh", "smile", "excited", "wonderful"],
    fear: ["scared", "afraid", "terrified", "anxious", "worried"],
    sadness: ["sad", "cry", "tears", "grief", "lost", "lonely"],
    anger: ["angry", "furious", "rage", "frustrated"],
    peace: ["peaceful", "calm", "serene", "relaxed"],
    confusion: ["confused", "lost", "uncertain", "strange"],
    love: ["love", "warm", "connected", "close"],
    wonder: ["amazing", "beautiful", "magical", "incredible"],
  };

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    if (keywords.some(k => lowerContent.includes(k))) {
      detectedEmotions.push(emotion);
    }
  }

  let overallInsight = "Your dream contains rich symbolic content. ";
  if (detectedSymbols.length > 0) {
    overallInsight += `The presence of ${detectedSymbols.map(s => s.symbol).join(", ")} suggests themes of ${detectedSymbols.slice(0, 2).map(s => s.meaning.split(",")[0].toLowerCase()).join(" and ")}. `;
  }
  if (detectedThemes.length > 0) {
    overallInsight += `This dream explores themes of ${detectedThemes.join(", ")}. `;
  }
  if (detectedEmotions.length > 0) {
    overallInsight += `The emotional landscape includes ${detectedEmotions.join(", ")}, which may reflect your waking life experiences.`;
  }

  return {
    symbols: detectedSymbols,
    themes: detectedThemes,
    emotions: detectedEmotions,
    overallInsight,
    moonInfluence: moonPhaseInfluences[moonPhase],
  };
}

function parseJsonObject(raw: string): Record<string, unknown> {
  const withoutFences = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(withoutFences);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Some models add a short preamble before the JSON.
  }

  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("Could not parse AI response as JSON");
  }

  const parsed = JSON.parse(withoutFences.slice(start, end + 1));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("AI response was not a JSON object");
  }
  return parsed as Record<string, unknown>;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeEnhancedInterpretation(
  parsed: Record<string, unknown>,
  dreamContent: string,
): EnhancedDreamInterpretation {
  const answer = asText(parsed.answer) || asText(parsed.interpretation);
  const dreamOverview =
    asText(parsed.dreamOverview) ||
    asText(parsed.overview) ||
    answer;

  if (!dreamOverview) {
    throw new Error("AI response did not contain an interpretation");
  }

  const rawSymbols = Array.isArray(parsed.keySymbols)
    ? parsed.keySymbols
    : Array.isArray(parsed.symbols)
      ? parsed.symbols
      : [];
  const keySymbols = rawSymbols
    .map((symbol) => {
      if (typeof symbol === "string") {
        return {
          symbol,
          meaning: "Explore your personal associations with this image.",
        };
      }
      if (!symbol || typeof symbol !== "object") return null;
      const item = symbol as Record<string, unknown>;
      const name = asText(item.symbol) || asText(item.name);
      const meaning = asText(item.meaning) || asText(item.interpretation);
      if (!name || !meaning) return null;
      return {
        symbol: name,
        meaning,
        questions: asText(item.questions) || asText(item.question) || undefined,
      };
    })
    .filter(Boolean) as EnhancedDreamInterpretation["keySymbols"];

  const parsedCoreThemes = asTextArray(parsed.coreThemes);
  const coreThemes = parsedCoreThemes.length
    ? parsedCoreThemes
    : asTextArray(parsed.themes);
  const parsedReflectionPrompts = asTextArray(parsed.reflectionPrompts);
  const reflectionPrompts = parsedReflectionPrompts.length
    ? parsedReflectionPrompts
    : asTextArray(parsed.prompts);

  const archetypeInput =
    parsed.archetypeAnalysis &&
    typeof parsed.archetypeAnalysis === "object" &&
    !Array.isArray(parsed.archetypeAnalysis)
      ? (parsed.archetypeAnalysis as Record<string, unknown>)
      : undefined;
  const primaryArchetype = normalizeArchetypeId(archetypeInput?.primaryArchetype);
  if (!archetypeInput || !primaryArchetype) {
    throw new Error("AI response did not contain a valid Psyra archetype analysis");
  }
  const secondaryCandidate = normalizeArchetypeId(archetypeInput.secondaryInfluence);
  const dimensionsInput =
    archetypeInput.jungianDimensions &&
    typeof archetypeInput.jungianDimensions === "object" &&
    !Array.isArray(archetypeInput.jungianDimensions)
      ? (archetypeInput.jungianDimensions as Record<string, unknown>)
      : undefined;
  const score = (key: "shadow" | "ego" | "self" | "persona") => {
    const value = dimensionsInput?.[key];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`AI response contained an invalid ${key} dimension score`);
    }
    return Math.min(1, Math.max(0, value));
  };
  const relevanceScore = archetypeInput.relevanceScore;
  const whyPsyraSawThis = asText(archetypeInput.whyPsyraSawThis);
  const reflectionQuestion = asText(archetypeInput.reflectionQuestion);
  const majorSymbols = asTextArray(archetypeInput.majorSymbols);
  const majorEmotions = asTextArray(archetypeInput.majorEmotions);
  const recurringThemes = asTextArray(archetypeInput.recurringThemes);
  if (
    typeof relevanceScore !== "number" ||
    !Number.isFinite(relevanceScore) ||
    !whyPsyraSawThis ||
    !reflectionQuestion ||
    !majorSymbols.length ||
    !majorEmotions.length ||
    !recurringThemes.length
  ) {
    throw new Error("AI response contained an incomplete Psyra archetype analysis");
  }

  return {
    dreamOverview,
    keySymbols: keySymbols.slice(0, 6),
    coreThemes: coreThemes.slice(0, 5),
    emotionalLandscape:
      asText(parsed.emotionalLandscape) ||
      "Notice the feeling that remained after waking; in Jungian work, the affect often reveals what the image is constellating in the psyche.",
    shadowElements:
      asText(parsed.shadowElements) ||
      "Consider which quality, desire, fear, or vulnerability in the dream you may be keeping outside your conscious identity.",
    dreamsMessage:
      asText(parsed.dreamsMessage) ||
      asText(parsed.dreamMessage) ||
      `The unconscious may be asking you to stay with the most emotionally charged image in this dream: ${dreamContent.slice(0, 120)}${dreamContent.length > 120 ? "…" : ""}`,
    reflectionPrompts: reflectionPrompts.length
      ? reflectionPrompts.slice(0, 5)
      : [
          "Which image carries the strongest emotional charge for you, and what personal memory or association does it awaken?",
          "What part of yourself does the dream seem to place outside your usual waking identity?",
          "Where might this dream be compensating for, or balancing, your current waking attitude?",
        ],
    archetypeAnalysis: {
      primaryArchetype,
      secondaryInfluence:
        secondaryCandidate && secondaryCandidate !== primaryArchetype
          ? secondaryCandidate
          : undefined,
      whyPsyraSawThis,
      reflectionQuestion,
      relevanceScore: Math.min(1, Math.max(0, relevanceScore)),
      jungianDimensions: {
        shadow: score("shadow"),
        ego: score("ego"),
        self: score("self"),
        persona: score("persona"),
      },
      majorSymbols: majorSymbols.slice(0, 8),
      majorEmotions: majorEmotions.slice(0, 8),
      recurringThemes: recurringThemes.slice(0, 8),
    },
  };
}

function reduceToSingleDigit(num: number): number {
  while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
    num = String(num).split('').reduce((a, b) => a + parseInt(b), 0);
  }
  return num;
}

function calculateLifePathNumber(birthDate: string): number {
  const date = new Date(birthDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  
  const monthReduced = reduceToSingleDigit(month);
  const dayReduced = reduceToSingleDigit(day);
  const yearReduced = reduceToSingleDigit(String(year).split('').reduce((a, b) => a + parseInt(b), 0));
  
  return reduceToSingleDigit(monthReduced + dayReduced + yearReduced);
}

function letterToNumber(letter: string): number {
  const values: Record<string, number> = {
    a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
    j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
    s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8
  };
  return values[letter.toLowerCase()] || 0;
}

const numerologyMeanings: Record<number, { lifePath: string; expression: string; soulUrge: string; personality: string; birthday: string }> = {
  1: {
    lifePath: "You are a natural leader with pioneering spirit. Independence and originality define your path.",
    expression: "You express yourself through leadership and initiative. You're meant to blaze new trails.",
    soulUrge: "Your soul craves independence, achievement, and being first. You desire to lead and innovate.",
    personality: "Others see you as confident, ambitious, and self-reliant. You project strength and determination.",
    birthday: "Born on a day of new beginnings, you have natural leadership abilities and pioneering spirit."
  },
  2: {
    lifePath: "You are a peacemaker and diplomat. Cooperation and sensitivity guide your journey.",
    expression: "You express through partnership and harmony. You're here to bring balance and support others.",
    soulUrge: "Your soul desires peace, love, and harmony. You seek deep connections and partnerships.",
    personality: "Others see you as gentle, tactful, and cooperative. You appear patient and understanding.",
    birthday: "Your birthday carries the energy of partnership and sensitivity to others' needs."
  },
  3: {
    lifePath: "You are creative and expressive. Joy, inspiration, and communication light your way.",
    expression: "You express through creativity and words. You're here to inspire and uplift others.",
    soulUrge: "Your soul desires creative expression, joy, and social connection. You need artistic outlets.",
    personality: "Others see you as charming, optimistic, and creative. You bring light and enthusiasm.",
    birthday: "Your birthday blesses you with natural creativity and the gift of joyful expression."
  },
  4: {
    lifePath: "You are a builder and organizer. Stability, hard work, and practicality define you.",
    expression: "You express through structure and dedication. You're here to create lasting foundations.",
    soulUrge: "Your soul desires security, order, and accomplishment. You need to build something lasting.",
    personality: "Others see you as reliable, practical, and hardworking. You project stability and trustworthiness.",
    birthday: "Your birthday grants you exceptional organizational abilities and dedication to your work."
  },
  5: {
    lifePath: "You are an adventurer seeking freedom. Change, versatility, and experience drive you.",
    expression: "You express through variety and adventure. You're here to experience life fully.",
    soulUrge: "Your soul craves freedom, adventure, and new experiences. You need variety and excitement.",
    personality: "Others see you as dynamic, versatile, and magnetic. You appear adaptable and curious.",
    birthday: "Your birthday brings the gift of adaptability and a thirst for life's adventures."
  },
  6: {
    lifePath: "You are a nurturer and healer. Love, responsibility, and service guide your path.",
    expression: "You express through caring and responsibility. You're here to nurture and protect.",
    soulUrge: "Your soul desires to love and be loved. You need harmony in home and relationships.",
    personality: "Others see you as caring, responsible, and protective. You project warmth and stability.",
    birthday: "Your birthday blesses you with the ability to create harmony and nurture those around you."
  },
  7: {
    lifePath: "You are a seeker of truth. Wisdom, spirituality, and introspection illuminate your journey.",
    expression: "You express through analysis and intuition. You're here to discover deeper truths.",
    soulUrge: "Your soul desires knowledge, understanding, and spiritual growth. You need time for reflection.",
    personality: "Others see you as wise, mysterious, and thoughtful. You project depth and intelligence.",
    birthday: "Your birthday grants you natural intuition and a deep connection to spiritual wisdom."
  },
  8: {
    lifePath: "You are a manifestor of abundance. Power, achievement, and material mastery define you.",
    expression: "You express through achievement and authority. You're here to master the material world.",
    soulUrge: "Your soul desires success, recognition, and material abundance. You need to achieve greatness.",
    personality: "Others see you as powerful, successful, and authoritative. You project confidence and capability.",
    birthday: "Your birthday brings natural business acumen and the ability to manifest abundance."
  },
  9: {
    lifePath: "You are a humanitarian and old soul. Compassion, wisdom, and universal love guide you.",
    expression: "You express through service and compassion. You're here to give back to humanity.",
    soulUrge: "Your soul desires to serve humanity and make a difference. You need to contribute to the greater good.",
    personality: "Others see you as compassionate, wise, and idealistic. You project understanding and tolerance.",
    birthday: "Your birthday connects you to universal wisdom and humanitarian service."
  },
  11: {
    lifePath: "You are a master intuitive. Spiritual illumination and inspiration are your gifts.",
    expression: "You express through spiritual insight and inspiration. You're here to enlighten others.",
    soulUrge: "Your soul desires spiritual mastery and to inspire humanity. You carry profound intuition.",
    personality: "Others see you as inspiring, intuitive, and visionary. You project spiritual depth.",
    birthday: "Your birthday carries master energy of illumination and spiritual leadership."
  },
  22: {
    lifePath: "You are a master builder. You have the power to turn dreams into reality on a grand scale.",
    expression: "You express through manifesting visions. You're here to build lasting legacies.",
    soulUrge: "Your soul desires to create something of lasting significance. You carry immense potential.",
    personality: "Others see you as capable, visionary, and powerful. You project mastery and competence.",
    birthday: "Your birthday carries master builder energy capable of achieving extraordinary things."
  },
  33: {
    lifePath: "You are a master teacher. Unconditional love and spiritual service define your highest path.",
    expression: "You express through healing and teaching. You're here to uplift humanity through love.",
    soulUrge: "Your soul desires to serve through unconditional love. You carry the energy of the healer.",
    personality: "Others see you as loving, selfless, and spiritually evolved. You project pure compassion.",
    birthday: "Your birthday carries the master teacher energy of unconditional love and healing."
  },
};

function getSunSignForDate(date: Date): ZodiacSign {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "aquarius";
  return "pisces";
}

const planetMeanings: Record<string, Record<ZodiacSign, string>> = {
  sun: {
    aries: "Your core identity is bold, pioneering, and action-oriented.",
    taurus: "Your core identity is stable, sensual, and determined.",
    gemini: "Your core identity is curious, communicative, and adaptable.",
    cancer: "Your core identity is nurturing, intuitive, and protective.",
    leo: "Your core identity is creative, generous, and dramatic.",
    virgo: "Your core identity is analytical, helpful, and detail-oriented.",
    libra: "Your core identity seeks harmony, beauty, and partnership.",
    scorpio: "Your core identity is intense, transformative, and powerful.",
    sagittarius: "Your core identity is adventurous, philosophical, and optimistic.",
    capricorn: "Your core identity is ambitious, disciplined, and responsible.",
    aquarius: "Your core identity is innovative, humanitarian, and independent.",
    pisces: "Your core identity is intuitive, compassionate, and imaginative."
  },
  moon: {
    aries: "You process emotions with fire and immediacy. You need action to feel secure.",
    taurus: "You need comfort and stability to feel emotionally secure.",
    gemini: "You process emotions through communication and mental activity.",
    cancer: "You are deeply intuitive and need emotional security and home.",
    leo: "You need recognition and creative expression to feel emotionally fulfilled.",
    virgo: "You process emotions through analysis and service to others.",
    libra: "You need harmony and partnership to feel emotionally balanced.",
    scorpio: "You experience emotions intensely and need depth in connections.",
    sagittarius: "You need freedom and adventure to feel emotionally alive.",
    capricorn: "You need achievement and structure for emotional security.",
    aquarius: "You need intellectual stimulation and independence emotionally.",
    pisces: "You are highly empathic and need spiritual connection for emotional wellbeing."
  },
  mercury: {
    aries: "You think and communicate quickly, directly, and competitively.",
    taurus: "You think methodically and communicate with patience and practicality.",
    gemini: "You think rapidly and love to communicate, learn, and share ideas.",
    cancer: "You think intuitively and communicate with emotional sensitivity.",
    leo: "You think creatively and communicate with warmth and drama.",
    virgo: "You think analytically and communicate with precision and helpfulness.",
    libra: "You think diplomatically and communicate with grace and fairness.",
    scorpio: "You think deeply and communicate with intensity and perception.",
    sagittarius: "You think broadly and communicate with optimism and philosophy.",
    capricorn: "You think strategically and communicate with authority and structure.",
    aquarius: "You think innovatively and communicate with originality and vision.",
    pisces: "You think imaginatively and communicate with poetry and empathy."
  },
  venus: {
    aries: "You love passionately and need excitement in relationships.",
    taurus: "You love sensually and need stability and comfort in relationships.",
    gemini: "You love intellectually and need mental stimulation in relationships.",
    cancer: "You love nurturingly and need emotional security in relationships.",
    leo: "You love dramatically and need admiration in relationships.",
    virgo: "You love practically and show care through acts of service.",
    libra: "You love harmoniously and thrive in balanced partnerships.",
    scorpio: "You love intensely and need deep, transformative connections.",
    sagittarius: "You love adventurously and need freedom in relationships.",
    capricorn: "You love traditionally and value committed, lasting relationships.",
    aquarius: "You love unconventionally and need intellectual connection.",
    pisces: "You love romantically and seek soulmate connections."
  },
  mars: {
    aries: "You take action boldly and assertively. You're a natural warrior.",
    taurus: "You take action steadily and persistently. Your determination is unwavering.",
    gemini: "You take action through communication and versatility.",
    cancer: "You take action protectively and emotionally. You defend those you love.",
    leo: "You take action dramatically and creatively. You lead with confidence.",
    virgo: "You take action precisely and practically. You improve and perfect.",
    libra: "You take action diplomatically, seeking fairness and balance.",
    scorpio: "You take action intensely and strategically. Your will is powerful.",
    sagittarius: "You take action adventurously, pursuing goals with optimism.",
    capricorn: "You take action ambitiously and with discipline toward achievement.",
    aquarius: "You take action innovatively, fighting for humanitarian causes.",
    pisces: "You take action intuitively, driven by compassion and creativity."
  },
};

const houseMeanings: Record<number, string> = {
  1: "Self, identity, appearance, and how you present to the world",
  2: "Values, possessions, money, and self-worth",
  3: "Communication, siblings, local travel, and learning",
  4: "Home, family, roots, and emotional foundation",
  5: "Creativity, romance, children, and self-expression",
  6: "Health, daily routine, work, and service",
  7: "Partnerships, marriage, and one-on-one relationships",
  8: "Transformation, shared resources, intimacy, and rebirth",
  9: "Philosophy, higher education, travel, and expansion",
  10: "Career, public image, reputation, and life purpose",
  11: "Friends, community, hopes, and humanitarian goals",
  12: "Spirituality, hidden matters, endings, and the unconscious",
};

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private dreams: Map<string, Map<string, Dream>>;
  private prompts: Map<string, WritingPrompt>;
  private numerologyProfiles: Map<string, NumerologyProfile>;
  private moodEntries: Map<string, MoodEntry[]>;
  private sleepIntentions: Map<string, SleepIntention[]>;

  constructor() {
    this.users = new Map();
    this.dreams = new Map();
    this.prompts = new Map();
    this.numerologyProfiles = new Map();
    this.moodEntries = new Map();
    this.sleepIntentions = new Map();
    
    defaultPrompts.forEach(prompt => {
      const id = randomUUID();
      this.prompts.set(id, { ...prompt, id, isUsed: false, category: prompt.category || "general" });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async deleteUserData(userId: string): Promise<void> {
    this.users.delete(userId);
    this.dreams.delete(userId);
    this.numerologyProfiles.delete(userId);
    this.moodEntries.delete(userId);
    this.sleepIntentions.delete(userId);
  }

  private getDreamStore(userId: string): Map<string, Dream> {
    let dreams = this.dreams.get(userId);
    if (!dreams) {
      dreams = new Map();
      this.dreams.set(userId, dreams);
    }
    return dreams;
  }

  private getMoodStore(userId: string): MoodEntry[] {
    let moods = this.moodEntries.get(userId);
    if (!moods) {
      moods = [];
      this.moodEntries.set(userId, moods);
    }
    return moods;
  }

  private getIntentionStore(userId: string): SleepIntention[] {
    let intentions = this.sleepIntentions.get(userId);
    if (!intentions) {
      intentions = [];
      this.sleepIntentions.set(userId, intentions);
    }
    return intentions;
  }

  async getDreams(userId: string): Promise<Dream[]> {
    return Array.from(this.getDreamStore(userId).values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getDream(userId: string, id: string): Promise<Dream | undefined> {
    return this.getDreamStore(userId).get(id);
  }

  async createDream(userId: string, insertDream: InsertDream): Promise<Dream> {
    const id = randomUUID();
    const dream: Dream = {
      id,
      userId,
      title: insertDream.title,
      content: insertDream.content,
      date: insertDream.date || new Date(),
      emotions: insertDream.emotions || [],
      themes: insertDream.themes || [],
      symbols: insertDream.symbols || [],
      decodedInsights: insertDream.decodedInsights || null,
      isArchived: insertDream.isArchived || false,
      moonPhase: insertDream.moonPhase || calculateMoonPhase(),
    };
    this.getDreamStore(userId).set(id, dream);
    return dream;
  }

  async updateDream(userId: string, id: string, updates: Partial<Dream>): Promise<Dream | undefined> {
    const dreamStore = this.getDreamStore(userId);
    const existing = dreamStore.get(id);
    if (!existing) return undefined;
    
    const updated: Dream = { ...existing, ...updates };
    dreamStore.set(id, updated);
    return updated;
  }

  async deleteDream(userId: string, id: string): Promise<boolean> {
    return this.getDreamStore(userId).delete(id);
  }

  async getDreamStats(userId: string): Promise<DreamStats> {
    const allDreams = Array.from(this.getDreamStore(userId).values());
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const dreamsThisWeek = allDreams.filter(d => new Date(d.date) >= weekAgo).length;
    const dreamsThisMonth = allDreams.filter(d => new Date(d.date) >= monthAgo).length;
    const dreamsThisYear = allDreams.filter(d => new Date(d.date) >= yearStart).length;

    const emotionCounts: Record<string, number> = {};
    const themeCounts: Record<string, number> = {};
    const symbolCounts: Record<string, number> = {};
    const monthCounts: Record<string, number> = {};

    allDreams.forEach(dream => {
      dream.emotions.forEach(e => {
        emotionCounts[e] = (emotionCounts[e] || 0) + 1;
      });
      dream.themes.forEach(t => {
        themeCounts[t] = (themeCounts[t] || 0) + 1;
      });
      dream.symbols.forEach(s => {
        symbolCounts[s] = (symbolCounts[s] || 0) + 1;
      });
      
      const monthKey = new Date(dream.date).toLocaleDateString('en-US', { month: 'short' });
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    const topEmotions = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topThemes = Object.entries(themeCounts)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topSymbols = Object.entries(symbolCounts)
      .map(([symbol, count]) => ({ symbol, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dreamsByMonth = months.map(month => ({
      month,
      count: monthCounts[month] || 0
    }));

    return {
      totalDreams: allDreams.length,
      dreamsThisWeek,
      dreamsThisMonth,
      dreamsThisYear,
      recurringSymbolsThisMonth: getRecurringSymbolsThisMonth(allDreams, now),
      topEmotions,
      topThemes,
      topSymbols,
      dreamsByMonth
    };
  }

  async getPrompts(): Promise<WritingPrompt[]> {
    return Array.from(this.prompts.values());
  }

  async getPrompt(id: string): Promise<WritingPrompt | undefined> {
    return this.prompts.get(id);
  }

  async getDailyPrompt(): Promise<WritingPrompt | undefined> {
    const prompts = Array.from(this.prompts.values());
    const today = new Date().toDateString();
    const hash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % prompts.length;
    return prompts[index];
  }

  async createPrompt(insertPrompt: InsertWritingPrompt): Promise<WritingPrompt> {
    const id = randomUUID();
    const prompt: WritingPrompt = { ...insertPrompt, id, isUsed: false, category: insertPrompt.category || "general" };
    this.prompts.set(id, prompt);
    return prompt;
  }

  async getCelestialData(): Promise<CelestialData> {
    return getCurrentCelestialData();
  }

  async decodeDream(content: string, moonPhase: MoonPhase): Promise<DreamDecoding> {
    const moonInfluence = moonPhaseInfluences[moonPhase];
    
    try {
      const response = await openai.chat.completions.create({
        model: useDirectOpenAI ? "gpt-4o" : "gpt-5-mini",
        ...(!useDirectOpenAI ? { reasoning_effort: "low" as const } : {}),
        messages: [
          {
            role: "system",
            content: `You are a dream analyst specializing in Jungian psychology and symbolic interpretation. Analyze dreams and provide meaningful insights. Always respond with valid JSON in this exact format:
{
  "symbols": [{"symbol": "string", "meaning": "string"}],
  "themes": ["string"],
  "emotions": ["string"],
  "overallInsight": "string"
}
Keep each symbol meaning to 1-2 sentences. Identify 3-5 key symbols, 2-4 themes, and 2-4 emotions. The overall insight should be 2-3 sentences providing a cohesive interpretation.`
          },
          {
            role: "user",
            content: `Please analyze this dream and identify its symbols, themes, emotions, and provide an overall insight:\n\n"${content}"\n\nThe dreamer had this dream during the ${moonPhase.replace(/_/g, ' ')} phase of the moon.`
          }
        ],
        ...(useDirectOpenAI ? { max_tokens: 1000 } : { max_completion_tokens: 1000 }),
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error("No response from AI");
      }

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not parse AI response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        symbols: parsed.symbols || [],
        themes: parsed.themes || [],
        emotions: parsed.emotions || [],
        overallInsight: parsed.overallInsight || "Your dream contains rich symbolic content worth exploring.",
        moonInfluence,
      };
    } catch (error) {
      console.error("AI dream analysis failed, falling back to keyword analysis:", error);
      return decodeDreamContent(content, moonPhase);
    }
  }

  async enhancedDecodeDream(content: string): Promise<EnhancedDreamInterpretation> {
    const systemPrompt = `You are a Jungian dream analyst. Your job is to explore what this particular dream may be communicating from the dreamer's unconscious — not to provide a universal dream dictionary or predict the future.

Use Jung's method:
- Start with the dreamer's own associations and the exact images, people, setting, actions, and emotions in the dream.
- Treat the dream as a living psychological drama. Consider what each figure could represent as an aspect of the dreamer's psyche, and whether the dream compensates for an attitude or one-sidedness in waking life.
- Look for archetypal patterns only when the actual dream supports them.
- Discuss shadow material gently and tentatively. Do not diagnose, make deterministic claims, or imply that one symbol has one fixed meaning.
- Make the central synthesis explicit: what tension is the unconscious presenting, what seems ready to become conscious, and what small act of reflection might support integration.

Ground every section in the dream text. Quote or name concrete details from it. If the dream is brief, say what is uncertain and ask for the dreamer's personal associations rather than inventing details.

Choose one primary archetype from this exact set, based only on evidence in the dream:
innocent, explorer, sage, hero, rebel, magician, everyman, lover, jester, caregiver, creator, ruler.
You may include one secondary influence only when the dream strongly supports it. Never choose randomly. Shadow, Persona, Self, and Ego are Jungian dimensions, not cards in the 12-archetype set.

Return ONLY one valid JSON object with exactly these keys:
{
  "dreamOverview": "3-4 sentences naming the dream's concrete images and the central unconscious tension",
  "keySymbols": [
    {
      "symbol": "an exact image, person, place, object, or action from the dream",
      "meaning": "2-3 sentences of tentative Jungian meaning grounded in this dream and the dreamer's possible associations",
      "questions": "one personal-association question about this exact symbol"
    }
  ],
  "coreThemes": ["2-4 specific psychological tensions or movements in this dream"],
  "emotionalLandscape": "2-3 sentences connecting the dream's stated or implied emotions to specific moments",
  "shadowElements": "2-3 sentences about a possible disowned quality or unconscious material seeking recognition, using tentative language",
  "dreamsMessage": "2-3 direct, warm sentences in second person explaining what the unconscious may be asking the dreamer to notice or integrate",
  "reflectionPrompts": ["3 journaling questions that directly reference this dream's details"],
  "archetypeAnalysis": {
    "primaryArchetype": "one lowercase id from the exact 12-archetype set",
    "secondaryInfluence": "one different lowercase id from the set, or null",
    "whyPsyraSawThis": "2-3 tentative sentences naming concrete dream evidence for this archetype",
    "reflectionQuestion": "one exploratory question specific to this dream and archetype",
    "relevanceScore": 0.0,
    "jungianDimensions": {
      "shadow": 0.0,
      "ego": 0.0,
      "self": 0.0,
      "persona": 0.0
    },
    "majorSymbols": ["concrete symbols copied from this dream"],
    "majorEmotions": ["emotions stated or strongly implied by this dream"],
    "recurringThemes": ["short themes supported by this dream"]
  }
}

Use 0.0-1.0 scores to express how active each Jungian dimension appears in this dream; they do not need to sum to 1. Provide 3-5 keySymbols. Keep the prose insightful and specific, not generic.`;

    try {
      console.log("Starting Jungian dream decode");
      const response = await openai.chat.completions.create({
        model: useDirectOpenAI ? "gpt-4o" : "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Please provide a thoughtful dream interpretation for this dream:\n\n"${content}"`
          }
        ],
        ...(useDirectOpenAI ? { max_tokens: 1800 } : { max_completion_tokens: 3000 }),
      });
      console.log("AI response received successfully");

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error(`AI returned no visible content (finish reason: ${response.choices[0]?.finish_reason || "unknown"})`);
      }

      const parsed = parseJsonObject(aiResponse);
      return normalizeEnhancedInterpretation(parsed, content);
    } catch (error: any) {
      console.error("Enhanced AI dream analysis failed:", error?.message || error);
      throw new Error("Dream decoding is temporarily unavailable. Please try again in a moment.");
    }
  }

  async getMonthlyLunarCalendar(year: number, month: number): Promise<MonthlyLunarCalendar> {
    return getMonthlyAstronomicalCalendar(year, month);
  }

  async getNumerologyProfile(userId: string): Promise<NumerologyProfile | undefined> {
    return this.numerologyProfiles.get(userId);
  }

  async createNumerologyProfile(userId: string, data: InsertNumerology): Promise<NumerologyProfile> {
    const birthDate = new Date(data.birthDate);
    const lifePathNumber = calculateLifePathNumber(data.birthDate);
    const birthdayNumber = reduceToSingleDigit(birthDate.getDate());
    
    const meanings = numerologyMeanings[lifePathNumber] || numerologyMeanings[9];
    const birthdayMeanings = numerologyMeanings[birthdayNumber] || numerologyMeanings[9];
    
    const expressionNumber = reduceToSingleDigit((lifePathNumber * 2 + birthdayNumber) % 9 || 9);
    const soulUrgeNumber = reduceToSingleDigit((lifePathNumber + birthdayNumber) % 9 || 9);
    const personalityNumber = reduceToSingleDigit(Math.abs(lifePathNumber - birthdayNumber) % 9 || 9);
    
    const expressionMeanings = numerologyMeanings[expressionNumber] || numerologyMeanings[9];
    const soulUrgeMeanings = numerologyMeanings[soulUrgeNumber] || numerologyMeanings[9];
    const personalityMeanings = numerologyMeanings[personalityNumber] || numerologyMeanings[9];
    
    const profile: NumerologyProfile = {
      id: randomUUID(),
      birthDate: data.birthDate,
      lifePathNumber,
      lifePathMeaning: meanings.lifePath,
      expressionNumber,
      expressionMeaning: expressionMeanings.expression,
      soulUrgeNumber,
      soulUrgeMeaning: soulUrgeMeanings.soulUrge,
      personalityNumber,
      personalityMeaning: personalityMeanings.personality,
      birthdayNumber,
      birthdayMeaning: birthdayMeanings.birthday,
    };
    
    this.numerologyProfiles.set(userId, profile);
    return profile;
  }

  async getMoodEntries(userId: string): Promise<MoodEntry[]> {
    return this.getMoodStore(userId).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async createMoodEntry(userId: string, mood: InsertMood): Promise<MoodEntry> {
    const entry: MoodEntry = {
      id: randomUUID(),
      date: mood.date || new Date(),
      mood: mood.mood,
      notes: mood.notes || null,
      moonPhase: mood.moonPhase || null,
      moonSign: mood.moonSign || null,
    };
    this.getMoodStore(userId).push(entry);
    return entry;
  }

  async getSleepIntentions(userId: string): Promise<SleepIntention[]> {
    return this.getIntentionStore(userId).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getSleepIntention(userId: string, id: string): Promise<SleepIntention | undefined> {
    return this.getIntentionStore(userId).find(i => i.id === id);
  }

  async createSleepIntention(userId: string, intention: InsertIntention): Promise<SleepIntention> {
    const entry: SleepIntention = {
      id: randomUUID(),
      title: intention.title || "My Intention",
      date: intention.date || new Date(),
      intention: intention.intention,
      moonPhase: intention.moonPhase || null,
      moonSign: intention.moonSign || null,
      isArchived: intention.isArchived || false,
    };
    this.getIntentionStore(userId).push(entry);
    return entry;
  }

  async updateSleepIntention(userId: string, id: string, updates: Partial<SleepIntention>): Promise<SleepIntention | undefined> {
    const intentions = this.getIntentionStore(userId);
    const index = intentions.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    intentions[index] = { ...intentions[index], ...updates };
    return intentions[index];
  }

  async deleteSleepIntention(userId: string, id: string): Promise<boolean> {
    const intentions = this.getIntentionStore(userId);
    const index = intentions.findIndex(i => i.id === id);
    if (index === -1) return false;
    intentions.splice(index, 1);
    return true;
  }

  getDreamSymbols(): DreamSymbol[] {
    return dreamSymbolsData;
  }

  searchDreamSymbols(query: string): DreamSymbol[] {
    const q = query.toLowerCase();
    return dreamSymbolsData.filter(s => 
      s.symbol.toLowerCase().includes(q) ||
      s.meaning.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.keywords.some(k => k.toLowerCase().includes(q))
    );
  }
}

const dreamSymbolsData: DreamSymbol[] = [
  { symbol: "Water", meaning: "Represents emotions, the unconscious mind, and spiritual cleansing. Calm water suggests peace; turbulent water may indicate emotional turmoil.", category: "Elements", keywords: ["ocean", "river", "rain", "flood", "swimming"] },
  { symbol: "Flying", meaning: "Symbolizes freedom, ambition, and escaping limitations. May represent a desire to rise above problems or gain a new perspective.", category: "Actions", keywords: ["soaring", "floating", "wings", "levitating"] },
  { symbol: "Falling", meaning: "Often indicates feelings of losing control, anxiety, or fear of failure. Can also represent letting go or surrendering.", category: "Actions", keywords: ["dropping", "plummeting", "descending"] },
  { symbol: "Teeth", meaning: "Connected to self-image, confidence, and communication. Losing teeth may signify anxiety about appearance or fear of aging.", category: "Body", keywords: ["losing teeth", "broken teeth", "dental"] },
  { symbol: "House", meaning: "Represents the self and different aspects of your psyche. Different rooms symbolize different parts of your mind or life.", category: "Places", keywords: ["home", "building", "rooms", "attic", "basement"] },
  { symbol: "Snake", meaning: "Symbolizes transformation, healing, hidden fears, or wisdom. Can represent both danger and renewal.", category: "Animals", keywords: ["serpent", "reptile", "venom"] },
  { symbol: "Cat", meaning: "Represents intuition, femininity, independence, and mystery. May indicate a need to trust your instincts.", category: "Animals", keywords: ["feline", "kitten"] },
  { symbol: "Dog", meaning: "Symbolizes loyalty, friendship, protection, and instincts. May represent a faithful companion or your own loyal nature.", category: "Animals", keywords: ["puppy", "canine", "pet"] },
  { symbol: "Spider", meaning: "Represents creativity, patience, and the web of life. Can also indicate feeling trapped or anxious.", category: "Animals", keywords: ["web", "arachnid"] },
  { symbol: "Bird", meaning: "Symbolizes freedom, perspective, spiritual connection, and aspirations. The type of bird adds specific meaning.", category: "Animals", keywords: ["flying bird", "crow", "eagle", "owl"] },
  { symbol: "Death", meaning: "Rarely literal; usually represents endings, transformation, and new beginnings. Signifies the end of one phase and start of another.", category: "Events", keywords: ["dying", "funeral", "dead"] },
  { symbol: "Baby", meaning: "Represents new beginnings, innocence, vulnerability, or a new project or idea. May indicate nurturing needs.", category: "People", keywords: ["infant", "newborn", "child"] },
  { symbol: "Chase", meaning: "Indicates avoidance of an issue, anxiety, or feeling pursued by responsibilities. Consider what is chasing you.", category: "Actions", keywords: ["running", "pursued", "escaping", "hunting"] },
  { symbol: "Fire", meaning: "Symbolizes passion, anger, transformation, or destruction. Can represent purification or consuming emotions.", category: "Elements", keywords: ["flames", "burning", "heat"] },
  { symbol: "Mirror", meaning: "Represents self-reflection, truth, and how you see yourself. Distorted reflections may indicate self-perception issues.", category: "Objects", keywords: ["reflection", "glass"] },
  { symbol: "Moon", meaning: "Connected to intuition, femininity, cycles, and the unconscious. Different phases carry different meanings.", category: "Celestial", keywords: ["lunar", "moonlight", "night sky"] },
  { symbol: "Sun", meaning: "Represents consciousness, vitality, success, and masculine energy. A rising sun suggests new beginnings.", category: "Celestial", keywords: ["solar", "daylight", "sunshine"] },
  { symbol: "Stars", meaning: "Symbolize hope, guidance, destiny, and spiritual aspirations. May represent goals or wishes.", category: "Celestial", keywords: ["night sky", "constellation"] },
  { symbol: "Tree", meaning: "Represents growth, life, family roots, and personal development. The condition of the tree reflects your state.", category: "Nature", keywords: ["forest", "branches", "roots", "leaves"] },
  { symbol: "Road", meaning: "Symbolizes your life path, journey, and the direction you're heading. Forks represent choices.", category: "Places", keywords: ["path", "highway", "journey", "crossroads"] },
  { symbol: "Bridge", meaning: "Represents transition, connection, and overcoming obstacles. Crossing a bridge suggests moving forward.", category: "Places", keywords: ["crossing", "connection"] },
  { symbol: "Ocean", meaning: "Represents the vastness of the unconscious, emotions, and the unknown. Calm seas suggest peace.", category: "Nature", keywords: ["sea", "waves", "beach"] },
  { symbol: "Mountain", meaning: "Symbolizes obstacles, achievements, spiritual growth, and higher perspective. Climbing represents progress.", category: "Nature", keywords: ["climbing", "peak", "summit"] },
  { symbol: "Door", meaning: "Represents opportunities, transitions, and new possibilities. Locked doors may indicate obstacles.", category: "Objects", keywords: ["entrance", "exit", "opening", "locked"] },
  { symbol: "Key", meaning: "Symbolizes solutions, knowledge, access, and unlocking potential. May represent answers you're seeking.", category: "Objects", keywords: ["unlock", "answer"] },
  { symbol: "Money", meaning: "Represents self-worth, power, success, or anxiety about resources. May reflect values and priorities.", category: "Objects", keywords: ["coins", "wealth", "currency", "wallet"] },
  { symbol: "Car", meaning: "Symbolizes your drive, direction in life, and personal control. Who's driving matters.", category: "Vehicles", keywords: ["driving", "vehicle", "journey"] },
  { symbol: "Airplane", meaning: "Represents aspirations, rapid progress, or anxiety about upcoming events. Take-off suggests new ventures.", category: "Vehicles", keywords: ["flying", "travel", "airport"] },
  { symbol: "Naked", meaning: "Indicates vulnerability, authenticity, or fear of exposure. May suggest feeling unprepared.", category: "States", keywords: ["nude", "exposed", "undressed"] },
  { symbol: "Lost", meaning: "Represents confusion, lack of direction, or searching for purpose. May indicate life transitions.", category: "States", keywords: ["wandering", "confused", "searching"] },
  { symbol: "Exam", meaning: "Symbolizes self-evaluation, fear of judgment, or feeling tested. Often appears during stressful times.", category: "Events", keywords: ["test", "school", "unprepared"] },
  { symbol: "Wedding", meaning: "Represents commitment, union, transition, or anxiety about relationships. May symbolize integration of self.", category: "Events", keywords: ["marriage", "bride", "groom"] },
  { symbol: "Pregnancy", meaning: "Symbolizes creativity, new ideas developing, or personal growth. Something new is being nurtured.", category: "States", keywords: ["birth", "creating", "developing"] },
  { symbol: "Storm", meaning: "Represents emotional turmoil, conflict, or impending change. Can be cleansing or destructive.", category: "Weather", keywords: ["thunder", "lightning", "rain", "tornado"] },
  { symbol: "Garden", meaning: "Symbolizes personal growth, cultivation of ideas, and the fruits of your labor. Condition reflects inner state.", category: "Nature", keywords: ["flowers", "planting", "growing"] },
  { symbol: "Clock", meaning: "Represents time pressure, deadlines, or awareness of mortality. May indicate fear of running out of time.", category: "Objects", keywords: ["time", "watch", "deadline"] },
  { symbol: "Blood", meaning: "Symbolizes life force, passion, sacrifice, or loss. Can indicate emotional pain or family connections.", category: "Body", keywords: ["wound", "injury", "vitality"] },
  { symbol: "Hands", meaning: "Represent capability, action, and connection. Right hand often symbolizes giving; left receiving.", category: "Body", keywords: ["fingers", "touching", "grasping"] },
  { symbol: "Eyes", meaning: "Symbolize perception, awareness, soul, and truth. Many eyes may indicate feeling watched.", category: "Body", keywords: ["seeing", "watching", "vision"] },
  { symbol: "Butterfly", meaning: "Represents transformation, beauty, and the soul. Signifies personal growth and metamorphosis.", category: "Animals", keywords: ["metamorphosis", "change", "beauty"] },
];

class DatabaseStorage extends MemStorage {
  async deleteUserData(userId: string): Promise<void> {
    await db.delete(dreamsTable).where(eq(dreamsTable.userId, userId));
    await super.deleteUserData(userId);
  }

  async getDreams(userId: string): Promise<Dream[]> {
    return db
      .select()
      .from(dreamsTable)
      .where(eq(dreamsTable.userId, userId))
      .orderBy(desc(dreamsTable.date));
  }

  async getDream(userId: string, id: string): Promise<Dream | undefined> {
    const [dream] = await db
      .select()
      .from(dreamsTable)
      .where(and(eq(dreamsTable.userId, userId), eq(dreamsTable.id, id)))
      .limit(1);
    return dream;
  }

  async createDream(userId: string, insertDream: InsertDream): Promise<Dream> {
    const [dream] = await db
      .insert(dreamsTable)
      .values({ userId, ...insertDream })
      .returning();
    return dream;
  }

  async updateDream(
    userId: string,
    id: string,
    updates: Partial<Dream>,
  ): Promise<Dream | undefined> {
    const { id: _id, userId: _userId, ...safeUpdates } = updates;
    const [dream] = await db
      .update(dreamsTable)
      .set(safeUpdates)
      .where(and(eq(dreamsTable.userId, userId), eq(dreamsTable.id, id)))
      .returning();
    return dream;
  }

  async deleteDream(userId: string, id: string): Promise<boolean> {
    const deleted = await db
      .delete(dreamsTable)
      .where(and(eq(dreamsTable.userId, userId), eq(dreamsTable.id, id)))
      .returning({ id: dreamsTable.id });
    return deleted.length > 0;
  }

  async getDreamStats(userId: string): Promise<DreamStats> {
    const allDreams = await this.getDreams(userId);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const dreamsThisWeek = allDreams.filter((dream) => new Date(dream.date) >= weekAgo).length;
    const dreamsThisMonth = allDreams.filter((dream) => new Date(dream.date) >= monthAgo).length;
    const dreamsThisYear = allDreams.filter((dream) => new Date(dream.date) >= yearStart).length;
    const emotionCounts: Record<string, number> = {};
    const themeCounts: Record<string, number> = {};
    const symbolCounts: Record<string, number> = {};
    const monthCounts: Record<string, number> = {};

    allDreams.forEach((dream) => {
      dream.emotions.forEach((emotion) => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
      dream.themes.forEach((theme) => {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      });
      dream.symbols.forEach((symbol) => {
        symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
      });
      const monthKey = new Date(dream.date).toLocaleDateString("en-US", { month: "short" });
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    const topEntries = (counts: Record<string, number>) =>
      Object.entries(counts)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return {
      totalDreams: allDreams.length,
      dreamsThisWeek,
      dreamsThisMonth,
      dreamsThisYear,
      recurringSymbolsThisMonth: getRecurringSymbolsThisMonth(allDreams, now),
      topEmotions: topEntries(emotionCounts).map(({ value: emotion, count }) => ({ emotion, count })),
      topThemes: topEntries(themeCounts).map(({ value: theme, count }) => ({ theme, count })),
      topSymbols: topEntries(symbolCounts).map(({ value: symbol, count }) => ({ symbol, count })),
      dreamsByMonth: months.map((month) => ({ month, count: monthCounts[month] || 0 })),
    };
  }
}

export const storage = new DatabaseStorage();
