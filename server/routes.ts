import type { Express, NextFunction, Request, Response } from "express";
import { createServer, type Server } from "http";
import { clerkClient, getAuth } from "@clerk/express";
import { storage } from "./storage";
import { appleSubjects, AppleDeletionError, deleteAccountForUser } from "./account-deletion";
import { 
  insertDreamSchema, 
  updateDreamSchema, 
  insertWritingPromptSchema,
  insertSavedWritingPromptSchema,
  insertWritingResponseSchema,
  insertNumerologySchema,
  insertIntentionSchema,
  updateIntentionSchema,
  celestialDataSchema,
  lunarEventSchema,
  monthlyLunarCalendarSchema,
  type MoonPhase
} from "@shared/schema";
import { z } from "zod";
import { getLunarEventsForYear } from "./lunar-astronomy";
import { tarotService, drawTarotWithDailyLimit } from "./tarot";
import { withDailyUsage } from "./daily-usage";
import { DailyLimitError } from "@shared/daily-limits";
import { dreams as dreamsTable } from "@shared/schema";
import { preserveTarotCache } from "./tarot-service";
import { hasDemoPremium } from "@shared/demo";
import {
  DemoSeedFailure,
  seedDemo,
  validDemoSeedAuthorization,
} from "./demo-seed";
import {
  hasAcceptedDreamAiConsent,
  withDreamAiConsent,
} from "@shared/ai-dream-consent";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.locals.userId = userId;
  next();
}

function currentUserId(res: Response): string {
  return res.locals.userId as string;
}

async function requireDreamAiConsent(userId: string, res: Response): Promise<boolean> {
  try {
    const user = await clerkClient.users.getUser(userId);
    if (hasAcceptedDreamAiConsent(user.privateMetadata)) return true;
    res.status(428).json({ error: "AI_CONSENT_REQUIRED" });
  } catch {
    res.status(503).json({ error: "Unable to verify AI consent" });
  }
  return false;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Administrator-only maintenance operation, not an authentication bypass.
  // The body cannot choose a user or email; it can only seed the fixed demo.
  app.post("/internal/demo/seed", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!process.env.DEMO_SEED_TOKEN) return res.sendStatus(404);
    if (!validDemoSeedAuthorization(req.get("authorization"), process.env.DEMO_SEED_TOKEN)) {
      return res.sendStatus(401);
    }
    try {
      res.json(await seedDemo());
    } catch (error) {
      const phase =
        error instanceof DemoSeedFailure ? error.phase : "unknown";
      console.error(`Demo seed failed at phase=${phase}; sensitive data was not logged.`);
      res.status(500).json({ error: "Demo seed failed", phase });
    }
  });

  app.use("/api", requireAuth);

  app.get("/api/account/demo-access", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const user = await clerkClient.users.getUser(currentUserId(res));
      res.json({ isDemo: hasDemoPremium(user) });
    } catch {
      res.status(503).json({ error: "Unable to verify demo access" });
    }
  });

  app.get("/api/account/ai-dream-consent", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const user = await clerkClient.users.getUser(currentUserId(res));
      res.json({
        consented: hasAcceptedDreamAiConsent(user.privateMetadata),
      });
    } catch {
      res.status(503).json({ error: "Unable to check AI consent" });
    }
  });

  app.post("/api/account/ai-dream-consent", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const acceptance = z.object({ accepted: z.literal(true) }).safeParse(req.body);
    if (!acceptance.success) {
      return res.status(400).json({ error: "Consent must be explicitly accepted" });
    }

    try {
      const userId = currentUserId(res);
      const user = await clerkClient.users.getUser(userId);
      if (!hasAcceptedDreamAiConsent(user.privateMetadata)) {
        const privateMetadata = withDreamAiConsent(
          user.privateMetadata,
          new Date().toISOString(),
        );
        await clerkClient.users.updateUserMetadata(userId, { privateMetadata });
      }
      res.json({ consented: true });
    } catch {
      res.status(503).json({ error: "Unable to save AI consent" });
    }
  });

  app.get("/api/tarot/latest", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      res.json(await tarotService.context(currentUserId(res)));
    } catch {
      res.status(503).json({ error: "Dream-based Tarot is temporarily unavailable" });
    }
  });

  app.post("/api/tarot/pull", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const input = z.object({ spreadId: z.enum(["single", "past-present-future", "dream"]) }).safeParse(req.body);
    if (!input.success) return res.status(400).json({ error: "Unknown Tarot spread" });
    try {
      res.json(await drawTarotWithDailyLimit(
        currentUserId(res), input.data.spreadId, req.get("X-User-Time-Zone"),
      ));
    } catch (error) {
      if (error instanceof DailyLimitError) {
        return res.status(429).json({ error: error.message, code: "DAILY_TAROT_LIMIT" });
      }
      res.status(503).json({ error: "Dream-based Tarot is temporarily unavailable" });
    }
  });

  app.get("/api/account/deletion-requirements", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const user = await clerkClient.users.getUser(currentUserId(res));
      res.json({ appleReauthorizationRequired: appleSubjects(user).length > 0 });
    } catch {
      res.status(503).json({ error: "Unable to check account deletion requirements" });
    }
  });

  app.delete("/api/account", async (req, res) => {
    const userId = currentUserId(res);
    res.setHeader("Cache-Control", "no-store");
    const input = z.object({
      appleAuthorizationCode: z.string().min(1).max(4096).optional(),
      manualAppleRevocation: z.boolean().optional(),
    }).strict().safeParse(req.body ?? {});
    if (!input.success) return res.status(400).json({ error: "Invalid account deletion request" });

    try {
      const appleRevocation = await deleteAccountForUser(userId, input.data, {
        getUser: (id) => clerkClient.users.getUser(id),
        deleteUserData: (id) => storage.deleteUserData(id),
        deleteUser: (id) => clerkClient.users.deleteUser(id),
      });
      if (appleRevocation === "manual_required") {
        return res.json({ appleRevocation });
      }
      return res.status(204).send();
    } catch (error) {
      if (error instanceof AppleDeletionError) {
        return res.status(error.code === "APPLE_REAUTH_REQUIRED" ? 428 : 503).json({
          error: error.code,
        });
      }
      console.error("Account deletion failed; sensitive details were not logged.");
      res.status(500).json({ error: "Failed to delete account" });
    }
  });
  
  app.get("/api/dreams", async (req, res) => {
    try {
      const dreams = await storage.getDreams(currentUserId(res));
      res.json(dreams);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dreams" });
    }
  });

  app.get("/api/dreams/stats", async (req, res) => {
    try {
      const stats = await storage.getDreamStats(currentUserId(res));
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dream stats" });
    }
  });

  app.get("/api/dreams/:id", async (req, res) => {
    try {
      const dream = await storage.getDream(currentUserId(res), req.params.id);
      if (!dream) {
        return res.status(404).json({ error: "Dream not found" });
      }
      res.json(dream);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dream" });
    }
  });

  app.post("/api/dreams", async (req, res) => {
    try {
      const parsed = insertDreamSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const userId = currentUserId(res);
      const isFirstDream = (await storage.getDreams(userId)).length === 0;
      const dream = await withDailyUsage(userId, req.get("X-User-Time-Zone"), async (quota, tx) => {
        await quota.consume("dreams", 1);
        // New dreams cannot inject preselected "cached" cards to skip metering.
        const decodedInsights = parsed.data.decodedInsights
          ? preserveTarotCache(null, parsed.data.decodedInsights)
          : parsed.data.decodedInsights;
        const [created] = await tx.insert(dreamsTable).values({
          ...parsed.data, decodedInsights, userId,
        }).returning();
        return created;
      });
      res.status(201).json({ ...dream, isFirstDream });
    } catch (error) {
      if (error instanceof DailyLimitError) {
        return res.status(429).json({ error: error.message, code: "DAILY_DREAM_LIMIT" });
      }
      res.status(500).json({ error: "Failed to create dream" });
    }
  });

  app.patch("/api/dreams/:id", async (req, res) => {
    try {
      const parsed = updateDreamSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const dream = await storage.updateDream(currentUserId(res), req.params.id, parsed.data);
      if (!dream) {
        return res.status(404).json({ error: "Dream not found" });
      }
      res.json(dream);
    } catch (error) {
      res.status(500).json({ error: "Failed to update dream" });
    }
  });

  app.delete("/api/dreams/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDream(currentUserId(res), req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Dream not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete dream" });
    }
  });

  app.get("/api/prompts", async (req, res) => {
    try {
      const prompts = await storage.getPrompts();
      res.json(prompts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prompts" });
    }
  });

  app.get("/api/prompts/daily", async (req, res) => {
    try {
      const prompt = await storage.getDailyPrompt();
      res.json(prompt);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily prompt" });
    }
  });

  app.get("/api/prompts/:id", async (req, res) => {
    try {
      const prompt = await storage.getPrompt(req.params.id);
      if (!prompt) {
        return res.status(404).json({ error: "Prompt not found" });
      }
      res.json(prompt);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prompt" });
    }
  });

  app.post("/api/prompts", async (req, res) => {
    try {
      const parsed = insertWritingPromptSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const prompt = await storage.createPrompt(parsed.data);
      res.status(201).json(prompt);
    } catch (error) {
      res.status(500).json({ error: "Failed to create prompt" });
    }
  });

  app.get("/api/saved-prompts", async (_req, res) => {
    try {
      res.json(await storage.getSavedPrompts(currentUserId(res)));
    } catch {
      res.status(500).json({ error: "Failed to fetch saved prompts" });
    }
  });

  app.post("/api/saved-prompts", async (req, res) => {
    const parsed = insertSavedWritingPromptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    try {
      const saved = await storage.savePrompt(currentUserId(res), parsed.data);
      res.status(201).json(saved);
    } catch {
      res.status(500).json({ error: "Failed to save prompt" });
    }
  });

  app.delete("/api/saved-prompts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSavedPrompt(currentUserId(res), req.params.id);
      if (!deleted) return res.status(404).json({ error: "Saved prompt not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Failed to remove saved prompt" });
    }
  });

  app.get("/api/writing-responses", async (_req, res) => {
    try {
      res.json(await storage.getWritingResponses(currentUserId(res)));
    } catch {
      res.status(500).json({ error: "Failed to fetch writing responses" });
    }
  });

  app.post("/api/writing-responses", async (req, res) => {
    const parsed = insertWritingResponseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    try {
      const response = await storage.createWritingResponse(
        currentUserId(res),
        parsed.data,
      );
      res.status(201).json(response);
    } catch {
      res.status(500).json({ error: "Failed to save writing response" });
    }
  });

  app.patch("/api/writing-responses/:id", async (req, res) => {
    const responseText = z.string().trim().min(1).max(20000).safeParse(req.body?.response);
    if (!responseText.success) {
      return res.status(400).json({ error: "Writing response is required" });
    }
    try {
      const response = await storage.updateWritingResponse(
        currentUserId(res),
        req.params.id,
        responseText.data,
      );
      if (!response) {
        return res.status(404).json({ error: "Writing response not found" });
      }
      res.json(response);
    } catch {
      res.status(500).json({ error: "Failed to update writing response" });
    }
  });

  app.get("/api/celestial", async (req, res) => {
    try {
      const data = await storage.getCelestialData();
      res.json(celestialDataSchema.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch celestial data" });
    }
  });

  app.post("/api/dreams/decode", async (req, res) => {
    try {
      if (!(await requireDreamAiConsent(currentUserId(res), res))) return;
      const { content, moonPhase } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Dream content is required" });
      }
      const phase: MoonPhase = moonPhase || "new_moon";
      const decoding = await storage.decodeDream(content, phase);
      res.json(decoding);
    } catch (error) {
      console.error("Basic dream decode failed:", error);
      res.status(500).json({ error: "Failed to decode dream" });
    }
  });

  app.post("/api/dreams/enhanced-decode", async (req, res) => {
    try {
      if (!(await requireDreamAiConsent(currentUserId(res), res))) return;
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Dream content is required" });
      }
      const interpretation = await storage.enhancedDecodeDream(content);
      res.json(interpretation);
    } catch (error) {
      console.error("Enhanced dream decode failed:", error);
      res.status(500).json({ error: "Failed to decode dream" });
    }
  });

  app.post("/api/dreams/:id/enhanced-decode", async (req, res) => {
    try {
      const userId = currentUserId(res);
      if (!(await requireDreamAiConsent(userId, res))) return;
      const dream = await storage.getDream(userId, req.params.id);
      if (!dream) {
        return res.status(404).json({ error: "Dream not found" });
      }

      const startedAt = Date.now();
      const interpretation = await storage.enhancedDecodeDream(dream.content);
      const reflection =
        typeof req.body?.reflection === "string" ? req.body.reflection : "";
      const normalizedSymbols = new Map<string, string>();
      interpretation.keySymbols.forEach(({ symbol }) => {
        const display = symbol.trim().replace(/\s+/g, " ");
        const normalized = display.normalize("NFKC").toLocaleLowerCase("en-US");
        if (normalized && !normalizedSymbols.has(normalized)) {
          normalizedSymbols.set(normalized, display);
        }
      });
      await storage.updateDream(userId, dream.id, {
        decodedInsights: JSON.stringify({ interpretation, reflection }),
        symbols: Array.from(normalizedSymbols.values()),
      });
      console.log(`Dream ${dream.id} decoded and saved in ${Date.now() - startedAt}ms`);
      res.json(interpretation);
    } catch (error) {
      console.error("Saved dream decode failed:", error);
      res.status(500).json({ error: "Failed to decode dream" });
    }
  });

  app.get("/api/lunar-calendar", async (req, res) => {
    try {
      const year = Number(req.query.year);
      const month = Number(req.query.month);
      if (
        !Number.isInteger(year) ||
        year < 1900 ||
        year > 2100 ||
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12
      ) {
        return res.status(400).json({ error: "A valid year and month are required" });
      }
      const calendar = await storage.getMonthlyLunarCalendar(year, month);
      res.json(monthlyLunarCalendarSchema.parse(calendar));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lunar calendar" });
    }
  });

  app.get("/api/lunar-events", async (req, res) => {
    try {
      const year = parseInt(req.query.year as string);
      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        return res.status(400).json({ error: "A valid year is required" });
      }
      res.json(lunarEventSchema.array().parse(getLunarEventsForYear(year)));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lunar events" });
    }
  });

  app.get("/api/numerology", async (req, res) => {
    try {
      const profile = await storage.getNumerologyProfile(currentUserId(res));
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch numerology profile" });
    }
  });

  app.post("/api/numerology", async (req, res) => {
    try {
      const parsed = insertNumerologySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const profile = await storage.createNumerologyProfile(currentUserId(res), parsed.data);
      res.status(201).json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to create numerology profile" });
    }
  });

  // Mood entries
  app.get("/api/moods", async (req, res) => {
    try {
      const moods = await storage.getMoodEntries(currentUserId(res));
      res.json(moods);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mood entries" });
    }
  });

  app.post("/api/moods", async (req, res) => {
    try {
      const mood = await storage.createMoodEntry(currentUserId(res), req.body);
      res.status(201).json(mood);
    } catch (error) {
      res.status(500).json({ error: "Failed to create mood entry" });
    }
  });

  // Sleep intentions
  app.get("/api/intentions", async (req, res) => {
    try {
      const intentions = await storage.getSleepIntentions(currentUserId(res));
      res.json(intentions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch intentions" });
    }
  });

  app.post("/api/intentions", async (req, res) => {
    try {
      const validated = insertIntentionSchema.parse(req.body);
      const intention = await storage.createSleepIntention(currentUserId(res), validated);
      res.status(201).json(intention);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid intention data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create intention" });
    }
  });

  app.get("/api/intentions/:id", async (req, res) => {
    try {
      const intention = await storage.getSleepIntention(currentUserId(res), req.params.id);
      if (!intention) {
        return res.status(404).json({ error: "Intention not found" });
      }
      res.json(intention);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch intention" });
    }
  });

  app.patch("/api/intentions/:id", async (req, res) => {
    try {
      const validated = updateIntentionSchema.parse(req.body);
      const intention = await storage.updateSleepIntention(currentUserId(res), req.params.id, validated);
      if (!intention) {
        return res.status(404).json({ error: "Intention not found" });
      }
      res.json(intention);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update intention" });
    }
  });

  app.delete("/api/intentions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSleepIntention(currentUserId(res), req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Intention not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete intention" });
    }
  });

  // Dream dictionary
  app.get("/api/dream-symbols", async (req, res) => {
    try {
      const query = req.query.q as string;
      const symbols = query 
        ? storage.searchDreamSymbols(query)
        : storage.getDreamSymbols();
      res.json(symbols);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dream symbols" });
    }
  });

  return httpServer;
}
