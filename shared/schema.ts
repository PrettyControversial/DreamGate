import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Dreams table
export const dreams = pgTable("dreams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  emotions: text("emotions").array().notNull().default(sql`ARRAY[]::text[]`),
  themes: text("themes").array().notNull().default(sql`ARRAY[]::text[]`),
  symbols: text("symbols").array().notNull().default(sql`ARRAY[]::text[]`),
  decodedInsights: text("decoded_insights"),
  isArchived: boolean("is_archived").notNull().default(false),
  moonPhase: text("moon_phase"),
});

export const insertDreamSchema = createInsertSchema(dreams).omit({
  id: true,
  userId: true,
}).extend({
  date: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  emotions: z.array(z.string()).optional().default([]),
  themes: z.array(z.string()).optional().default([]),
  symbols: z.array(z.string()).optional().default([]),
  decodedInsights: z.string().nullable().optional(),
});

export const updateDreamSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  emotions: z.array(z.string()).optional(),
  themes: z.array(z.string()).optional(),
  symbols: z.array(z.string()).optional(),
  decodedInsights: z.string().nullable().optional(),
  isArchived: z.boolean().optional(),
  moonPhase: z.string().nullable().optional(),
});

export type InsertDream = z.infer<typeof insertDreamSchema>;
export type UpdateDream = z.infer<typeof updateDreamSchema>;
export type Dream = typeof dreams.$inferSelect;

// Writing prompts table
export const writingPrompts = pgTable("writing_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prompt: text("prompt").notNull(),
  category: text("category").notNull().default("general"),
  isUsed: boolean("is_used").notNull().default(false),
});

export const insertWritingPromptSchema = createInsertSchema(writingPrompts).omit({
  id: true,
});

export type InsertWritingPrompt = z.infer<typeof insertWritingPromptSchema>;
export type WritingPrompt = typeof writingPrompts.$inferSelect;

export const savedWritingPrompts = pgTable("saved_writing_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  promptId: varchar("prompt_id").notNull(),
  prompt: text("prompt").notNull(),
  category: text("category").notNull(),
  savedAt: timestamp("saved_at").notNull().defaultNow(),
});

export const insertSavedWritingPromptSchema = createInsertSchema(savedWritingPrompts).pick({
  promptId: true,
  prompt: true,
  category: true,
});

export type InsertSavedWritingPrompt = z.infer<typeof insertSavedWritingPromptSchema>;
export type SavedWritingPrompt = typeof savedWritingPrompts.$inferSelect;

// Moon phase types
export const moonPhases = [
  "new_moon",
  "waxing_crescent", 
  "first_quarter",
  "waxing_gibbous",
  "full_moon",
  "waning_gibbous",
  "last_quarter",
  "waning_crescent"
] as const;

export type MoonPhase = typeof moonPhases[number];

export const zodiacSigns = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"
] as const;

export type ZodiacSign = typeof zodiacSigns[number];

export interface CelestialData {
  moonPhase: MoonPhase;
  moonSign: ZodiacSign;
  sunSign: ZodiacSign;
  illumination: number;
  nextFullMoon: string;
  nextNewMoon: string;
  instant: string;
  phaseAngle: number;
  moonLongitude: number;
  sunLongitude: number;
  dataSource: "astronomy-engine";
  referenceFrame: "geocentric-tropical";
}

export const celestialDataSchema: z.ZodType<CelestialData> = z.object({
  moonPhase: z.enum(moonPhases),
  moonSign: z.enum(zodiacSigns),
  sunSign: z.enum(zodiacSigns),
  illumination: z.number().finite().min(0).max(1),
  nextFullMoon: z.string().datetime(),
  nextNewMoon: z.string().datetime(),
  instant: z.string().datetime(),
  phaseAngle: z.number().finite().min(0).lt(360),
  moonLongitude: z.number().finite().min(0).lt(360),
  sunLongitude: z.number().finite().min(0).lt(360),
  dataSource: z.literal("astronomy-engine"),
  referenceFrame: z.literal("geocentric-tropical"),
});

export interface DreamStats {
  totalDreams: number;
  dreamsThisWeek: number;
  dreamsThisMonth: number;
  dreamsThisYear: number;
  recurringSymbolsThisMonth: { symbol: string; count: number }[];
  topEmotions: { emotion: string; count: number }[];
  topThemes: { theme: string; count: number }[];
  topSymbols: { symbol: string; count: number }[];
  dreamsByMonth: { month: string; count: number }[];
}

export interface DreamDecoding {
  symbols: { symbol: string; meaning: string }[];
  themes: string[];
  emotions: string[];
  overallInsight: string;
  moonInfluence: string;
}

export interface EnhancedDreamInterpretation {
  dreamOverview: string;
  keySymbols: { symbol: string; meaning: string; questions?: string }[];
  coreThemes: string[];
  emotionalLandscape: string;
  shadowElements: string;
  dreamsMessage: string;
  reflectionPrompts: string[];
  archetypeAnalysis?: PsyraArchetypeAnalysis;
}

export interface JungianDimensionScores {
  shadow: number;
  ego: number;
  self: number;
  persona: number;
}

export interface PsyraArchetypeAnalysis {
  primaryArchetype: string;
  secondaryInfluence?: string;
  whyPsyraSawThis: string;
  reflectionQuestion: string;
  relevanceScore: number;
  jungianDimensions: JungianDimensionScores;
  majorSymbols: string[];
  majorEmotions: string[];
  recurringThemes: string[];
}

export interface NumerologyProfile {
  id: string;
  birthDate: string;
  lifePathNumber: number;
  lifePathMeaning: string;
  expressionNumber: number;
  expressionMeaning: string;
  soulUrgeNumber: number;
  soulUrgeMeaning: string;
  personalityNumber: number;
  personalityMeaning: string;
  birthdayNumber: number;
  birthdayMeaning: string;
}

export const insertNumerologySchema = z.object({
  birthDate: z.string().min(1, "Birth date is required"),
});

export type InsertNumerology = z.infer<typeof insertNumerologySchema>;

export const eclipseTypes = [
  "total_solar",
  "partial_solar", 
  "annular_solar",
  "total_lunar",
  "partial_lunar",
  "penumbral_lunar"
] as const;

export type EclipseType = typeof eclipseTypes[number];

export interface LunarEvent {
  date: string;
  instant: string;
  type: "new_moon" | "full_moon" | "solar_eclipse" | "lunar_eclipse";
  eclipseType?: EclipseType;
  moonSign: ZodiacSign;
  sunSign: ZodiacSign;
  time?: string;
}

export const lunarEventSchema: z.ZodType<LunarEvent> = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  instant: z.string().datetime(),
  type: z.enum(["new_moon", "full_moon", "solar_eclipse", "lunar_eclipse"]),
  eclipseType: z.enum(eclipseTypes).optional(),
  moonSign: z.enum(zodiacSigns),
  sunSign: z.enum(zodiacSigns),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export interface LunarCalendarDay {
  date: string;
  instant: string;
  moonPhase: MoonPhase;
  moonSign: ZodiacSign;
  sunSign?: ZodiacSign;
  illumination: number;
  phaseAngle: number;
  moonLongitude: number;
  isNewMoon: boolean;
  isFullMoon: boolean;
  eclipse?: {
    type: EclipseType;
    visibility?: string;
  };
}

export interface MonthlyLunarCalendar {
  schemaVersion: 2;
  year: number;
  month: number;
  days: LunarCalendarDay[];
  lunarEvents: LunarEvent[];
  dataSource: "astronomy-engine";
  referenceFrame: "geocentric-tropical";
  generatedAt: string;
}

export const lunarCalendarDaySchema: z.ZodType<LunarCalendarDay> = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  instant: z.string().datetime(),
  moonPhase: z.enum(moonPhases),
  moonSign: z.enum(zodiacSigns),
  sunSign: z.enum(zodiacSigns).optional(),
  illumination: z.number().finite().min(0).max(1),
  phaseAngle: z.number().finite().min(0).lt(360),
  moonLongitude: z.number().finite().min(0).lt(360),
  isNewMoon: z.boolean(),
  isFullMoon: z.boolean(),
  eclipse: z.object({
    type: z.enum(eclipseTypes),
    visibility: z.string().optional(),
  }).optional(),
});

export const monthlyLunarCalendarSchema: z.ZodType<MonthlyLunarCalendar> = z.object({
  schemaVersion: z.literal(2),
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  days: z.array(lunarCalendarDaySchema),
  lunarEvents: z.array(lunarEventSchema),
  dataSource: z.literal("astronomy-engine"),
  referenceFrame: z.literal("geocentric-tropical"),
  generatedAt: z.string().datetime(),
});

// Mood tracker
export const moodEntries = pgTable("mood_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull().defaultNow(),
  mood: integer("mood").notNull(),
  notes: text("notes"),
  moonPhase: text("moon_phase"),
  moonSign: text("moon_sign"),
});

export const insertMoodSchema = createInsertSchema(moodEntries).omit({
  id: true,
});

export type InsertMood = z.infer<typeof insertMoodSchema>;
export type MoodEntry = typeof moodEntries.$inferSelect;

// Sleep intentions / Intentions Journal
export const sleepIntentions = pgTable("sleep_intentions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull().default("My Intention"),
  date: timestamp("date").notNull().defaultNow(),
  intention: text("intention").notNull(),
  moonPhase: text("moon_phase"),
  moonSign: text("moon_sign"),
  isArchived: boolean("is_archived").notNull().default(false),
});

export const insertIntentionSchema = createInsertSchema(sleepIntentions).omit({
  id: true,
}).extend({
  title: z.string().min(1).max(200).optional().default("My Intention"),
  isArchived: z.boolean().optional().default(false),
});

export const updateIntentionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  intention: z.string().optional(),
  isArchived: z.boolean().optional(),
  moonPhase: z.string().nullable().optional(),
  moonSign: z.string().nullable().optional(),
});

export type InsertIntention = z.infer<typeof insertIntentionSchema>;
export type UpdateIntention = z.infer<typeof updateIntentionSchema>;
export type SleepIntention = typeof sleepIntentions.$inferSelect;

// Dream Dictionary symbols
export interface DreamSymbol {
  symbol: string;
  meaning: string;
  category: string;
  keywords: string[];
}
