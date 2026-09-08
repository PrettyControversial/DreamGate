import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoonPhaseVisual } from "@/components/moon-phase-visual";
import { apiRequest } from "@/lib/queryClient";
import { type DreamSymbol } from "@shared/schema";
import { Search, Sparkles, Moon, Brain, ArrowUpRight } from "lucide-react";
import { DreamGateFunctionSymbol } from "@/components/dreamgate-function-symbol";
import { PsyraMappedArtwork } from "@/components/psyra-archetype-card";
import { psycheDimensions } from "@shared/psyra";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const categoryColors: Record<string, string> = {
  Elements: "border-border bg-transparent text-foreground",
  Actions: "border-border bg-transparent text-foreground",
  Body: "border-border bg-transparent text-foreground",
  Places: "border-border bg-transparent text-foreground",
  Animals: "border-border bg-transparent text-foreground",
  Events: "border-border bg-transparent text-foreground",
  People: "border-border bg-transparent text-foreground",
  Objects: "border-border bg-transparent text-foreground",
  Celestial: "border-border bg-transparent text-foreground",
  Nature: "border-border bg-transparent text-foreground",
  Vehicles: "border-border bg-transparent text-foreground",
  States: "border-border bg-transparent text-foreground",
  Weather: "border-border bg-transparent text-foreground",
};

interface MoonPhaseInfo {
  phase: string;
  name: string;
  keywords: string[];
  coreMeaning: string;
  dreamInfluence: string;
  ritualSuggestion: string;
}

const moonPhases: MoonPhaseInfo[] = [
  {
    phase: "new_moon",
    name: "New Moon",
    keywords: ["new beginnings", "intention setting", "darkness", "potential"],
    coreMeaning: "The New Moon represents the void before creation—pure potential waiting to take form. This is the darkest night, when the sky is a blank canvas and your inner world becomes the primary source of light. It is a time of introspection, planting seeds, and setting intentions for the cycle ahead.",
    dreamInfluence: "Dreams during the New Moon often feel mysterious or harder to remember, as if the unconscious is working in deeper, less accessible layers. You may dream of darkness, caves, empty rooms, or searching for something unseen. These dreams speak to what wants to emerge but hasn't yet taken shape.",
    ritualSuggestion: "Before sleep, write down one intention for the coming lunar cycle. Place it under your pillow and ask your dreams to show you the first step."
  },
  {
    phase: "waxing_crescent",
    name: "Waxing Crescent",
    keywords: ["hope", "growth", "determination", "first steps"],
    coreMeaning: "The first sliver of light returns, signaling that something new has begun. This is the phase of commitment—your intention has been set, and now you must take your first steps. There is vulnerability in this beginning, but also tremendous hope.",
    dreamInfluence: "Dreams become more vivid as the moon grows. You may dream of small things growing—seedlings, babies, new projects taking shape. Pay attention to dreams about first attempts, learning new skills, or embarking on journeys. These reflect your waking intentions finding their legs.",
    ritualSuggestion: "As you fall asleep, visualize your intention as a tiny seedling. Ask your dreams to show you what it needs to grow."
  },
  {
    phase: "first_quarter",
    name: "First Quarter",
    keywords: ["action", "challenges", "decisions", "courage"],
    coreMeaning: "The moon is half-illuminated, and you face a crossroads. This phase demands action and often presents obstacles that test your commitment. It's a time to push through resistance and make decisive moves toward your goals.",
    dreamInfluence: "Dreams during the First Quarter often feature conflicts, challenges, or decisions that must be made. You may dream of crossroads, battles, competitions, or situations requiring courage. These dreams are processing the friction between where you are and where you're trying to go.",
    ritualSuggestion: "Before bed, identify one challenge you're facing. Ask your dreams to reveal what you need to overcome it."
  },
  {
    phase: "waxing_gibbous",
    name: "Waxing Gibbous",
    keywords: ["refinement", "patience", "adjustment", "anticipation"],
    coreMeaning: "The moon is almost full, but not quite—this is the phase of final preparations. Something is about to culminate, and you may need to make adjustments. Practice patience and trust that what you've been building is nearly ready to be revealed.",
    dreamInfluence: "Dreams during this phase often involve waiting, preparing, or making final touches. You may dream of being almost ready—packing for a trip, preparing for a performance, or approaching a destination. These dreams reflect the anticipation of fruition.",
    ritualSuggestion: "Review what you've been working toward. Ask your dreams to show you what final adjustment is needed before the Full Moon."
  },
  {
    phase: "full_moon",
    name: "Full Moon",
    keywords: ["illumination", "culmination", "emotions", "clarity"],
    coreMeaning: "The moon is fully illuminated, and so is everything it touches. This is the peak of the cycle—a time of heightened emotions, revelations, and the fruition of what was seeded at the New Moon. Whatever has been hidden comes to light.",
    dreamInfluence: "Full Moon dreams are often the most vivid and memorable of the entire cycle. Emotions run high in the dreamscape. You may dream in bright colors, experience intense encounters, or receive clear messages. This is when the unconscious speaks most loudly.",
    ritualSuggestion: "Keep a notepad by your bed—Full Moon dreams are worth capturing. Before sleep, ask your dreams to illuminate what you most need to see."
  },
  {
    phase: "waning_gibbous",
    name: "Waning Gibbous",
    keywords: ["gratitude", "sharing", "teaching", "integration"],
    coreMeaning: "The light begins to recede, and with it comes reflection on what the Full Moon revealed. This is a time for gratitude, for sharing what you've learned, and for integrating the insights you received. Give back what you've been given.",
    dreamInfluence: "Dreams during this phase often involve teaching, sharing, or giving something away. You may dream of conversations, gatherings, or passing knowledge to others. These dreams help you process and integrate what the Full Moon illuminated.",
    ritualSuggestion: "Reflect on what the Full Moon showed you. Ask your dreams to reveal how you can share this wisdom or apply it in your life."
  },
  {
    phase: "last_quarter",
    name: "Last Quarter",
    keywords: ["release", "forgiveness", "letting go", "transition"],
    coreMeaning: "The moon is half-dark again, but this time the light is departing rather than arriving. This is the phase of release—letting go of what no longer serves you, forgiving what must be forgiven, and making space for the next cycle.",
    dreamInfluence: "Dreams during the Last Quarter often involve endings, farewells, or the release of burdens. You may dream of cleaning, discarding objects, saying goodbye, or leaving places behind. These dreams are processing what you're ready to release.",
    ritualSuggestion: "Before sleep, name one thing you're ready to release. Ask your dreams to show you how to let it go completely."
  },
  {
    phase: "waning_crescent",
    name: "Waning Crescent",
    keywords: ["rest", "reflection", "wisdom", "surrender"],
    coreMeaning: "The final sliver of light—the moon is almost gone, and soon the cycle will begin again. This is a time for deep rest, quiet reflection, and surrender. The wisdom of the entire cycle becomes available if you're still enough to receive it.",
    dreamInfluence: "Dreams during the Waning Crescent are often soft, healing, and deeply introspective. You may dream of water, floating, being held, or returning to places of comfort. These dreams offer restoration before the next New Moon.",
    ritualSuggestion: "Allow yourself extra rest. Ask your dreams to show you the deepest wisdom of this lunar cycle before it ends."
  }
];

function SymbolCard({ symbol }: { symbol: DreamSymbol }) {
  const colorClass = categoryColors[symbol.category] || "bg-muted text-muted-foreground";

  return (
    <Card className="hover-elevate overflow-visible" data-testid={`card-symbol-${symbol.symbol.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            {symbol.symbol}
          </CardTitle>
          <Badge variant="secondary" className={colorClass}>
            {symbol.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">{symbol.meaning}</p>
        <div className="flex flex-wrap gap-1.5">
          {symbol.keywords.map((keyword, i) => (
            <Badge key={i} variant="outline" className="text-xs text-muted-foreground">
              {keyword}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MoonPhaseCard({ moonPhase }: { moonPhase: MoonPhaseInfo }) {
  return (
    <Card className="hover-elevate overflow-visible" data-testid={`card-moon-${moonPhase.phase}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          <MoonPhaseVisual phase={moonPhase.phase} size="md" />
          <div>
            <CardTitle className="font-display text-lg">{moonPhase.name}</CardTitle>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {moonPhase.keywords.map((keyword, i) => (
                <Badge key={i} variant="outline" className="text-xs text-muted-foreground">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            Meaning
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{moonPhase.coreMeaning}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
            <Moon className="h-3.5 w-3.5 text-secondary" />
            Dream Influence
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{moonPhase.dreamInfluence}</p>
        </div>
        <div className="pt-3 border-t">
          <h4 className="text-sm font-medium mb-1.5">Before Sleep Ritual</h4>
          <p className="text-sm italic text-muted-foreground">{moonPhase.ritualSuggestion}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DreamDictionary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("symbols");
  const [selectedDimensionId, setSelectedDimensionId] = useState<string | null>(null);

  const { data: symbols, isLoading } = useQuery<DreamSymbol[]>({
    queryKey: ["/api/dream-symbols", searchQuery],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/dream-symbols?q=${encodeURIComponent(searchQuery)}`
        : "/api/dream-symbols";
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });

  const categories = symbols 
    ? Array.from(new Set(symbols.map(s => s.category))).sort()
    : [];

  const filteredMoonPhases = searchQuery 
    ? moonPhases.filter(phase => 
        phase.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phase.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
        phase.coreMeaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phase.dreamInfluence.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : moonPhases;

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3" data-testid="text-dictionary-title">
          <DreamGateFunctionSymbol kind="dictionary" className="h-8 w-8" />
          Dream Dictionary
        </h1>
        <p className="text-muted-foreground mt-1">
          Discover the meaning behind dream symbols and lunar phases
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search symbols, moon phases, or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-base"
          data-testid="input-symbol-search"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
         <TabsList className="grid w-full grid-cols-3 gap-1 rounded-none px-1 py-1">
           <TabsTrigger value="symbols" className="min-h-11 min-w-0 gap-1 px-1 text-xs sm:gap-2 sm:px-3 sm:text-sm" data-testid="tab-symbols">
            <Sparkles className="h-4 w-4" />
             Dreams
          </TabsTrigger>
           <TabsTrigger value="moon-phases" className="min-h-11 min-w-0 gap-1 px-1 text-xs sm:gap-2 sm:px-3 sm:text-sm" data-testid="tab-moon-phases">
            <Moon className="h-4 w-4" />
             Moon
          </TabsTrigger>
           <TabsTrigger value="jung" className="min-h-11 min-w-0 gap-1 px-1 text-xs sm:gap-2 sm:px-3 sm:text-sm" data-testid="tab-jung">
            <Brain className="h-4 w-4" />
             Jung
          </TabsTrigger>
        </TabsList>

        <TabsContent value="symbols" className="space-y-6 mt-6">
          {searchQuery && symbols && (
            <p className="text-sm text-muted-foreground">
              Found {symbols.length} {symbols.length === 1 ? "symbol" : "symbols"} matching "{searchQuery}"
            </p>
          )}

          {!searchQuery && categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <Badge 
                  key={cat} 
                  variant="secondary" 
                  className={`${categoryColors[cat] || ""} cursor-pointer`}
                  onClick={() => setSearchQuery(cat)}
                  data-testid={`badge-category-${cat.toLowerCase()}`}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {symbols?.map((symbol) => (
              <SymbolCard key={symbol.symbol} symbol={symbol} />
            ))}
          </div>

          {symbols?.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <DreamGateFunctionSymbol kind="dictionary" className="h-12 w-12 mx-auto mb-4" />
                <p className="text-muted-foreground">No symbols found matching your search.</p>
                <p className="text-sm text-muted-foreground mt-2">Try different keywords or browse all symbols.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="moon-phases" className="space-y-6 mt-6">
          <Card className="bg-gradient-to-br from-secondary/10 to-primary/5">
            <CardContent className="p-6">
              <h2 className="font-display text-lg font-semibold mb-2">Understanding Lunar Influence</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The moon has guided dreamers for millennia. Each phase carries its own energy and influences both the 
                quality and content of your dreams. Understanding these cycles can help you work with your dreams more 
                intentionally—knowing when to plant seeds of intention, when to seek insight, and when to rest and integrate.
              </p>
            </CardContent>
          </Card>

          {searchQuery && (
            <p className="text-sm text-muted-foreground">
              Found {filteredMoonPhases.length} {filteredMoonPhases.length === 1 ? "phase" : "phases"} matching "{searchQuery}"
            </p>
          )}

          <div className="grid grid-cols-1 gap-4">
            {filteredMoonPhases.map((phase) => (
              <MoonPhaseCard key={phase.phase} moonPhase={phase} />
            ))}
          </div>

          {filteredMoonPhases.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Moon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No moon phases found matching your search.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

         <TabsContent value="jung" className="mt-6 space-y-6">
          <Card className="border-primary/30 bg-gradient-to-br from-secondary/10 to-primary/5">
            <CardContent className="p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Learn Dream Interpretation</p>
               <h2 className="mt-2 font-display text-2xl">The Jung Psyche</h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Jungian dream work treats the psyche as larger than the waking personality. These four ideas offer
                different ways to notice what a dream may be bringing into relationship—without reducing an image to
                one fixed meaning.
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {psycheDimensions.map((dimension) => (
              <button
                key={dimension.id}
                type="button"
                onClick={() => setSelectedDimensionId(dimension.id)}
                className="group text-left"
                data-testid={`button-jung-dimension-${dimension.id}`}
              >
                <Card className="h-full overflow-hidden transition-opacity group-hover:opacity-80">
                  <PsyraMappedArtwork
                    expectedFileName={dimension.expectedFileName}
                    alt={`${dimension.name} Jungian psyche artwork`}
                    fallbackLabel={dimension.name}
                    className="aspect-[16/9] w-full object-cover"
                  />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="font-display text-xl">{dimension.name}</CardTitle>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {dimension.shortDescription}
                        </p>
                      </div>
                      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(selectedDimensionId)}
        onOpenChange={(open) => !open && setSelectedDimensionId(null)}
      >
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
          {selectedDimensionId && (() => {
            const dimension = psycheDimensions.find((item) => item.id === selectedDimensionId);
            if (!dimension) return null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display text-3xl">{dimension.name}</DialogTitle>
                  <DialogDescription>{dimension.shortDescription}</DialogDescription>
                </DialogHeader>
                <PsyraMappedArtwork
                  expectedFileName={dimension.expectedFileName}
                  alt={`${dimension.name} Jungian psyche artwork`}
                  fallbackLabel={dimension.name}
                  className="aspect-[16/9] w-full object-cover"
                />
                <div className="space-y-5 text-sm leading-relaxed">
                  <p>{dimension.detail}</p>
                  <div className="border-l-2 border-current pl-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">In dreams</p>
                    <p className="mt-2">{dimension.dreamRole}</p>
                  </div>
                  <div className="border-t pt-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Reflect</p>
                    <p className="mt-2 font-display text-xl italic">{dimension.reflectionPrompt}</p>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
