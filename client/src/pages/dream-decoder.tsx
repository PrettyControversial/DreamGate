import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DreamGateFunctionSymbol } from "@/components/dreamgate-function-symbol";
import { PsyraArchetypeCard } from "@/components/psyra-archetype-card";
import { getArchetype } from "@shared/psyra";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/lib/subscription";
import { VoiceInputButton } from "@/components/voice-input-button";
import {
  trackDiscoverToolCompleted,
  trackDreamSaved,
  trackEvent,
} from "@/lib/analytics";
import { formatDate } from "@/lib/utils";
import { type Dream, type EnhancedDreamInterpretation } from "@shared/schema";
import dreamDecoderBackground from "@assets/dreamgate_backgrounds/dream-decoder-background.webp";
import dreamgatePageTexture from "@assets/texture__(3)_1788397809454.jpeg";
import recordDreamIcon from "@assets/IMG_3506_1788597855389.png";
import { 
  Sparkles, 
  Brain, 
  Eye, 
  Heart, 
  Key, 
  MessageSquare,
  ChevronLeft,
  Save,
  Lightbulb,
  Wand2,
  Loader2,
  Compass,
  BookOpen,
  HelpCircle,
  Moon,
  Zap,
  PenLine
} from "lucide-react";

interface StoredDecodedInsights {
  interpretation?: EnhancedDreamInterpretation;
  reflection: string;
}

const WRITING_PROMPT_SESSION_KEY = "dreamgate:writing-prompt:pending";

function isEnhancedInterpretation(
  value: unknown,
): value is EnhancedDreamInterpretation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<EnhancedDreamInterpretation>;
  return (
    typeof candidate.dreamOverview === "string" &&
    Array.isArray(candidate.keySymbols) &&
    Array.isArray(candidate.reflectionPrompts)
  );
}

function readStoredInsights(value?: string | null): StoredDecodedInsights {
  if (!value) return { reflection: "" };

  try {
    const parsed = JSON.parse(value) as {
      interpretation?: unknown;
      reflection?: unknown;
    };

    if (isEnhancedInterpretation(parsed)) {
      return { interpretation: parsed, reflection: "" };
    }

    return {
      interpretation: isEnhancedInterpretation(parsed.interpretation)
        ? parsed.interpretation
        : undefined,
      reflection:
        typeof parsed.reflection === "string" ? parsed.reflection : "",
    };
  } catch {
    return { reflection: value };
  }
}

function storeInsights(
  interpretation: EnhancedDreamInterpretation,
  reflection = "",
) {
  return JSON.stringify({ interpretation, reflection });
}

function HeroSection() {
  return (
    <div className="relative w-full h-48 md:h-64 overflow-hidden">
      <img
        src={dreamDecoderBackground}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white mb-2" data-testid="text-hero-title">
          Ask Psyra
        </h1>
        <p className="text-white/80 text-sm md:text-base max-w-md">
          Jung-inspired analysis of what your unconscious may be communicating
        </p>
      </div>
    </div>
  );
}

export default function DreamDecoder() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [insights, setInsights] = useState("");
  const [interpretation, setInterpretation] = useState<EnhancedDreamInterpretation | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [archetypeRevealed, setArchetypeRevealed] = useState(false);
  const [newDreamTitle, setNewDreamTitle] = useState("");
  const [newDreamContent, setNewDreamContent] = useState("");
  const [, navigate] = useLocation();
  const {
    canAccess,
    freeAskPsyraRemaining,
    isPremium,
    openPaywall,
    recordAskPsyraInterpretation,
  } = useSubscription();

  const requestInterpretationAccess = () => {
    if (canAccess("askPsyraInterpretation")) return true;
    openPaywall({
      feature: "askPsyraInterpretation",
      eyebrow: "Your free readings are complete",
      title: "Keep Exploring With Psyra",
      description:
        "Unlock unlimited Jungian dream interpretations and continue following the patterns unfolding across your dreams.",
    });
    return false;
  };

  const { data: dream, isLoading } = useQuery<Dream>({
    queryKey: ["/api/dreams", params.id],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/dreams/${encodeURIComponent(params.id)}`,
      );
      return response.json() as Promise<Dream>;
    },
    enabled: !!params.id,
  });

  const { data: dreams } = useQuery<Dream[]>({
    queryKey: ["/api/dreams"],
    enabled: !params.id,
  });

  const storedInsights = useMemo(
    () => readStoredInsights(dream?.decodedInsights),
    [dream?.decodedInsights],
  );

  useEffect(() => {
    if (storedInsights.interpretation) {
      setInterpretation(storedInsights.interpretation);
    }
  }, [storedInsights.interpretation]);

  useEffect(() => {
    setArchetypeRevealed(false);
  }, [dream?.id]);

  useEffect(() => {
    setInsights(storedInsights.reflection);
  }, [dream?.id, storedInsights.reflection]);

  useEffect(() => {
    if (params.id) return;
    const pendingPrompt = sessionStorage.getItem(WRITING_PROMPT_SESSION_KEY);
    if (!pendingPrompt) return;

    setNewDreamContent((currentContent) =>
      currentContent.trim() ? currentContent : pendingPrompt,
    );
    sessionStorage.removeItem(WRITING_PROMPT_SESSION_KEY);
  }, [params.id]);

  const decodeDream = async () => {
    if (!dream) return;
    if (!requestInterpretationAccess()) return;
    setIsDecoding(true);
    trackEvent("psyra_interpretation_started", {
      source: "saved_dream",
      tool_id: "ask_psyra",
    });
    try {
      const response = await apiRequest(
        "POST",
        `/api/dreams/${encodeURIComponent(dream.id)}/enhanced-decode`,
        {
          reflection: insights,
        },
      );
      const payload: unknown = await response.json();
      if (!isEnhancedInterpretation(payload)) {
        throw new Error("Psyra returned an unreadable interpretation.");
      }
      const result = payload;
      setInterpretation(result);
      recordAskPsyraInterpretation();
      trackEvent("psyra_interpretation_completed", {
        source: "saved_dream",
        tool_id: "ask_psyra",
      });
      trackDiscoverToolCompleted(["decoder"], "interpretation_completed");
      const encodedInsights = storeInsights(result, insights);
      queryClient.setQueryData<Dream>(
        ["/api/dreams", dream.id],
        (current) =>
          current
            ? { ...current, decodedInsights: encodedInsights }
            : current,
      );
      toast({
        title: "Psyra has responded",
        description: "Your dream interpretation and archetype are ready.",
      });
    } catch (error) {
      console.error("Psyra could not decode the saved dream:", error);
      toast({
        title: "Psyra is temporarily unavailable",
        description: "Your dream is safe. Please try the interpretation again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsDecoding(false);
    }
  };

  const createAndDecodeMutation = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      const now = new Date();
      const dateStr = now.toISOString();
      
      const createResponse = await apiRequest("POST", "/api/dreams", {
        title,
        content,
        date: dateStr,
        emotions: [],
        themes: [],
        symbols: [],
      });
      const newDream: unknown = await createResponse.json();
      if (
        !newDream ||
        typeof newDream !== "object" ||
        typeof (newDream as { id?: unknown }).id !== "string"
      ) {
        throw new Error("DreamGate returned an unreadable saved dream.");
      }
      const savedDream = newDream as {
        id: string;
        isFirstDream?: boolean;
      };
      
      let decodeResult = null;
      let decodeError = false;
      trackEvent("psyra_interpretation_started", {
        source: "new_dream",
        tool_id: "ask_psyra",
      });
      
      try {
        const decodeResponse = await apiRequest(
          "POST",
          `/api/dreams/${encodeURIComponent(savedDream.id)}/enhanced-decode`,
          { reflection: "" },
        );
        const payload: unknown = await decodeResponse.json();
        if (!isEnhancedInterpretation(payload)) {
          throw new Error("Psyra returned an unreadable interpretation.");
        }
        decodeResult = payload;
      } catch (err) {
        console.error("Psyra could not decode the newly saved dream:", err);
        decodeError = true;
      }
      
      return {
        dreamId: savedDream.id,
        isFirstDream: savedDream.isFirstDream,
        interpretation: decodeResult,
        decodeError,
      };
    },
    onSuccess: (result) => {
      trackDreamSaved("ask_psyra_decoder", result.isFirstDream);
      queryClient.invalidateQueries({ queryKey: ["/api/dreams"] });
      setNewDreamTitle("");
      setNewDreamContent("");
      
      if (result.decodeError) {
        toast({
          title: "Dream saved",
          description: "Your dream was saved but decoding failed. You can try decoding again.",
        });
      } else {
        setInterpretation(result.interpretation);
        recordAskPsyraInterpretation();
        trackEvent("psyra_interpretation_completed", {
          source: "new_dream",
          tool_id: "ask_psyra",
        });
        trackDiscoverToolCompleted(
          ["decoder", "prompts"],
          "interpretation_completed",
        );
        toast({
          title: "Dream saved and decoded",
          description: "Your dream has been logged and interpreted.",
        });
      }
      navigate(`/decoder/${result.dreamId}`);
    },
    onError: (error) => {
      console.error("Dream creation failed before Psyra could respond:", error);
      toast({
        title: "Dream could not be saved",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (decodedInsights: string) => {
      const value = interpretation
        ? storeInsights(interpretation, decodedInsights)
        : decodedInsights;
      await apiRequest("PATCH", `/api/dreams/${encodeURIComponent(params.id)}`, {
        decodedInsights: value,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dreams", params.id] });
      toast({
        title: "Insights saved",
        description: "Your dream interpretation has been saved.",
      });
    },
    onError: (error) => {
      console.error("Dream insight save failed:", error);
      toast({
        title: "Insights could not be saved",
        description: "Your writing is still here. Please try saving again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateAndDecode = () => {
    if (!newDreamTitle.trim() || !newDreamContent.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both a title and your dream content.",
        variant: "destructive",
      });
      return;
    }
    if (!requestInterpretationAccess()) return;
    createAndDecodeMutation.mutate({ title: newDreamTitle, content: newDreamContent });
  };

  const recentDreams = dreams?.filter(d => d.id !== params.id).slice(0, 5) || [];

  if (!params.id) {
    return (
      <div className="decoder-light-surface bg-background min-h-screen">
        <HeroSection />
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
          <Card className="border-primary/30 bg-card">
            <CardHeader>
              <CardTitle className="font-display text-xl flex items-center gap-2">
                <img
                  src={recordDreamIcon}
                  alt=""
                  aria-hidden="true"
                  className="h-5 w-7 shrink-0 object-contain"
                />
                <span className="underline decoration-primary/70 decoration-wavy underline-offset-4">
                  Record a Dream
                </span>
              </CardTitle>
              <CardDescription>
                Enter your dream for a personalized Jungian reading of its symbols, tensions, and unconscious message
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isPremium && (
                <p
                  className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground"
                  data-testid="text-free-psyra-remaining"
                >
                  {freeAskPsyraRemaining > 0
                    ? `${freeAskPsyraRemaining} free ${
                        freeAskPsyraRemaining === 1
                          ? "interpretation"
                          : "interpretations"
                      } remaining this month`
                    : "Your free interpretations for this month are complete."}
                </p>
              )}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Dream Title</label>
                <input
                  type="text"
                  value={newDreamTitle}
                  onChange={(e) => setNewDreamTitle(e.target.value)}
                  placeholder="Give your dream a title..."
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  data-testid="input-new-dream-title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Dream Content</label>
                <Textarea
                  value={newDreamContent}
                  onChange={(e) => setNewDreamContent(e.target.value)}
                  placeholder="Describe your dream in detail... What did you see, feel, or experience?"
                  className="min-h-[150px] resize-none"
                  data-testid="input-new-dream-content"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Prefer speaking? Your words will appear here as editable text.
                  </p>
                  <VoiceInputButton
                    value={newDreamContent}
                    onChange={setNewDreamContent}
                    data-testid="button-voice-new-dream"
                  />
                </div>
              </div>
              <Button 
                onClick={handleCreateAndDecode}
                disabled={createAndDecodeMutation.isPending || !newDreamTitle.trim() || !newDreamContent.trim()}
                className="w-full dark:text-white"
                size="lg"
                data-testid="button-decode-new-dream"
              >
                {createAndDecodeMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                     Psyra is listening...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                     Save & Ask Psyra
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {dreams && dreams.filter(d => !d.isArchived).length > 0 && (
            <div>
              <header className="mb-4">
                <h2 className="font-display text-xl font-bold tracking-tight text-foreground" data-testid="text-decoder-title">Previous Dreams</h2>
                <p className="text-muted-foreground text-sm mt-1">
                   Select a dream to view its interpretation or ask Psyra again
                </p>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dreams?.filter(d => !d.isArchived).map((d) => (
                  <Link key={d.id} href={`/decoder/${d.id}`}>
                    <Card className="hover-elevate cursor-pointer overflow-visible bg-card border-border hover:border-primary/50 transition-colors" data-testid={`card-decoder-dream-${d.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display font-semibold truncate text-foreground" data-testid={`text-decoder-dream-title-${d.id}`}>{d.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {d.content}
                            </p>
                            {d.decodedInsights && (
                              <Badge variant="secondary" className="mt-2">
                                <Sparkles className="h-3 w-3 mr-1" />
                                 Interpreted
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="decoder-light-surface bg-background min-h-screen">
        <HeroSection />
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!dream) {
    return (
      <div className="decoder-light-surface bg-background min-h-screen">
        <HeroSection />
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Dream not found</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="decoder-light-surface dream-decoder-light-surface relative min-h-screen pb-24 bg-background"
      style={{ backgroundImage: `url(${dreamgatePageTexture})` }}
    >
      <HeroSection />
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/decoder">
            <Button variant="ghost" size="icon" data-testid="button-back-decoder">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{dream.title}</h1>
            <p className="text-sm text-muted-foreground">{formatDate(dream.date)}</p>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <span className="text-primary">Dream Content</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {dream.content}
            </p>

            {dream.emotions.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2 text-foreground">Emotions felt:</p>
                <div className="flex flex-wrap gap-1.5">
                  {dream.emotions.map((emotion) => (
                    <Badge key={emotion} variant="secondary" className="capitalize">
                      {emotion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {dream.themes.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2 text-foreground">Themes:</p>
                <div className="flex flex-wrap gap-1.5">
                  {dream.themes.map((theme) => (
                    <Badge key={theme} variant="outline" className="capitalize border-primary/30">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {interpretation && (
          <div className="space-y-6">
            <Card className="border-primary/30 bg-muted">
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <span className="text-primary">Dream Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-foreground" data-testid="text-dream-overview">
                  {interpretation.dreamOverview}
                </p>
              </CardContent>
            </Card>

            {interpretation.keySymbols.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Key className="h-5 w-5 text-foreground" />
                    <span className="text-foreground">Key Symbols & Meanings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {interpretation.keySymbols.map((s, index) => (
                    <div key={index} className="p-4 rounded-lg bg-muted border border-border" data-testid={`symbol-item-${index}`}>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="h-4 w-4 text-secondary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium capitalize text-base text-foreground">{s.symbol}</p>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.meaning}</p>
                          {s.questions && (
                            <p className="text-sm mt-2 italic text-primary">
                              {s.questions}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {interpretation.coreThemes.length > 0 && (
              <Card className="min-w-0 overflow-hidden bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Compass className="h-5 w-5 text-foreground" />
                    <span className="text-foreground">Core Themes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="min-w-0">
                  <div className="flex w-full min-w-0 flex-wrap gap-2">
                    {interpretation.coreThemes.map((theme, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="h-auto min-w-0 max-w-full whitespace-normal break-words [overflow-wrap:anywhere] px-3 py-1.5 text-left text-sm leading-relaxed capitalize border-secondary/50 text-foreground"
                        data-testid={`theme-badge-${index}`}
                      >
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-primary/30 bg-card">
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span className="text-primary">Emotional Landscape</span>
                </CardTitle>
                <CardDescription>
                  Emotions present in this dream and what they reflect
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-foreground" data-testid="text-emotional-landscape">
                  {interpretation.emotionalLandscape}
                </p>
              </CardContent>
            </Card>

            <Card className="border-secondary/30 bg-card">
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Moon className="h-5 w-5 text-foreground" />
                  <span className="text-foreground">Shadow Elements</span>
                </CardTitle>
                <CardDescription>
                  Disowned parts of self seeking integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-foreground" data-testid="text-shadow-elements">
                  {interpretation.shadowElements}
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-muted">
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="text-primary">The Dream's Message</span>
                </CardTitle>
                <CardDescription>
                  What this dream is asking you to pay attention to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-foreground" data-testid="text-dreams-message">
                  {interpretation.dreamsMessage}
                </p>
              </CardContent>
            </Card>

            {interpretation.reflectionPrompts.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <DreamGateFunctionSymbol kind="prompts" className="h-5 w-5" />
                    <span className="text-foreground">Reflection Prompts</span>
                  </CardTitle>
                  <CardDescription>
                    Questions to explore in your journal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {interpretation.reflectionPrompts.map((prompt, index) => (
                    <div 
                      key={index} 
                      className="flex gap-3 p-4 rounded-lg bg-muted border border-border"
                      data-testid={`reflection-prompt-${index}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <HelpCircle className="h-3.5 w-3.5 text-secondary" />
                      </div>
                      <p className="text-sm leading-relaxed italic text-foreground">
                        "{prompt}"
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {interpretation.archetypeAnalysis && (
              <section className="border-y border-current py-8" data-testid="psyra-archetype-section">
                <div className="mx-auto max-w-3xl">
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                    Explore the Archetype of This Dream
                  </p>
                  {!archetypeRevealed ? (
                    <div className="py-12 text-center">
                      <p className="mx-auto max-w-xl font-display text-3xl md:text-4xl">
                        A pattern is waiting beneath the dream.
                      </p>
                      <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
                        Psyra selected this archetype from the dream’s images, emotions, and movement—not at random.
                      </p>
                      <Button
                        className="mt-8"
                        size="lg"
                        onClick={() => {
                          if (canAccess("archetypeReveals")) {
                            setArchetypeRevealed(true);
                            return;
                          }
                          openPaywall({
                            feature: "archetypeReveals",
                            eyebrow: "Archetype Reveal",
                            title: "Reveal the Archetype in This Dream",
                            description:
                              "Unlock Psyra+ to see the archetype Psyra selected from this dream and understand why it appeared.",
                          });
                        }}
                        data-testid="button-reveal-archetype"
                      >
                        Reveal Archetype
                      </Button>
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <PsyraArchetypeCard
                        archetypeId={interpretation.archetypeAnalysis.primaryArchetype}
                      />
                      <div className="border-x border-b border-current p-6 md:p-8">
                        {interpretation.archetypeAnalysis.secondaryInfluence && (
                          <p className="mb-5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Secondary influence:{" "}
                            {getArchetype(interpretation.archetypeAnalysis.secondaryInfluence)?.displayName}
                          </p>
                        )}
                        <h3 className="font-display text-2xl">Why Psyra Saw This</h3>
                        <p className="mt-3 leading-relaxed">
                          {interpretation.archetypeAnalysis.whyPsyraSawThis}
                        </p>
                        <div className="mt-8 border-l-2 border-current pl-5">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            A question to carry forward
                          </p>
                          <p className="mt-2 font-display text-xl italic">
                            {interpretation.archetypeAnalysis.reflectionQuestion}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        <Card className="border-secondary/30 bg-card">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <PenLine className="h-5 w-5 text-foreground" />
              <span className="text-foreground">Your Written Reflection</span>
            </CardTitle>
            <CardDescription>
              Write your personal reflections, thoughts, and responses to this interpretation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={insights}
              onChange={(e) => setInsights(e.target.value)}
              placeholder="What resonates with you from this interpretation? What connections do you see to your waking life? What emotions came up as you read the analysis? Take your time to explore and journal here..."
              className="min-h-[200px] resize-none"
              data-testid="textarea-insights"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                You can speak your reflection and edit it before saving.
              </p>
              <VoiceInputButton
                value={insights}
                onChange={setInsights}
                data-testid="button-voice-reflection"
              />
            </div>
            <Button
              onClick={() =>
                saveMutation.mutate(insights)
              }
              disabled={saveMutation.isPending}
              data-testid="button-save-insights"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Reflection"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {!interpretation && (
        <button
          onClick={decodeDream}
          disabled={isDecoding}
          className="fixed right-6 md:right-8 z-[80] flex items-center gap-2 px-6 py-3 rounded-full text-primary-foreground font-medium shadow-lg transition-all hover:scale-105 active:scale-95 bg-primary"
          style={{ 
            bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
            boxShadow: '0 0 20px hsl(var(--primary) / 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
          data-testid="button-floating-decode"
        >
          {isDecoding ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
               <span>Psyra is listening...</span>
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5" />
               <span>Ask Psyra</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
