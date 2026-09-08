import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DreamCard } from "@/components/dream-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { type Dream, type SleepIntention } from "@shared/schema";
import { Search, Filter, Calendar, Moon, PenLine, Sparkles, Star, Trash2 } from "lucide-react";
import { DreamGateFunctionSymbol } from "@/components/dreamgate-function-symbol";

const emotionFilters = [
  "joy", "fear", "sadness", "love", "anger", "confusion", 
  "excitement", "peace", "curiosity", "wonder"
];

type EntryType = "dreams" | "intentions";

function IntentionCard({ 
  intention, 
  onArchive, 
  onDelete,
  isArchived 
}: { 
  intention: SleepIntention; 
  onArchive: () => void;
  onDelete: () => void;
  isArchived: boolean;
}) {
  return (
    <Card className="hover-elevate" data-testid={`card-intention-${intention.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-display font-semibold text-foreground truncate">
                {intention.title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
              {intention.intention}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(intention.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              {intention.moonPhase && (
                <span className="flex items-center gap-1">
                  <Moon className="h-3 w-3" />
                  {intention.moonPhase.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onArchive}
              data-testid={`button-archive-intention-${intention.id}`}
            >
                <DreamGateFunctionSymbol kind="archive" className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              data-testid={`button-delete-intention-${intention.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DreamArchive() {
  const [entryType, setEntryType] = useState<EntryType>("dreams");
  const [searchQuery, setSearchQuery] = useState("");
  const [emotionFilter, setEmotionFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [showArchived, setShowArchived] = useState(false);
  const { toast } = useToast();

  const { data: dreams, isLoading: dreamsLoading } = useQuery<Dream[]>({
    queryKey: ["/api/dreams"],
  });

  const { data: intentions, isLoading: intentionsLoading } = useQuery<SleepIntention[]>({
    queryKey: ["/api/intentions"],
  });

  const archiveDreamMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/dreams/${id}`, { isArchived: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dreams"] });
      toast({
        title: "Dream archived",
        description: "The dream has been moved to archives.",
      });
    },
  });

  const unarchiveDreamMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/dreams/${id}`, { isArchived: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dreams"] });
      toast({
        title: "Dream restored",
        description: "The dream has been restored from archives.",
      });
    },
  });

  const archiveIntentionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/intentions/${id}`, { isArchived: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intentions"] });
      toast({
        title: "Intention archived",
        description: "The intention has been moved to archives.",
      });
    },
  });

  const unarchiveIntentionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/intentions/${id}`, { isArchived: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intentions"] });
      toast({
        title: "Intention restored",
        description: "The intention has been restored from archives.",
      });
    },
  });

  const deleteIntentionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/intentions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intentions"] });
      toast({
        title: "Intention deleted",
        description: "The intention has been permanently deleted.",
      });
    },
  });

  const isLoading = entryType === "dreams" ? dreamsLoading : intentionsLoading;

  let filteredDreams = dreams || [];
  let filteredIntentions = intentions || [];

  if (!showArchived) {
    filteredDreams = filteredDreams.filter(d => !d.isArchived);
    filteredIntentions = filteredIntentions.filter(i => !i.isArchived);
  } else {
    filteredDreams = filteredDreams.filter(d => d.isArchived);
    filteredIntentions = filteredIntentions.filter(i => i.isArchived);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredDreams = filteredDreams.filter(d => 
      d.title.toLowerCase().includes(query) ||
      d.content.toLowerCase().includes(query) ||
      d.themes.some(t => t.toLowerCase().includes(query)) ||
      d.symbols.some(s => s.toLowerCase().includes(query))
    );
    filteredIntentions = filteredIntentions.filter(i =>
      i.title.toLowerCase().includes(query) ||
      i.intention.toLowerCase().includes(query)
    );
  }

  if (emotionFilter !== "all" && entryType === "dreams") {
    filteredDreams = filteredDreams.filter(d => 
      d.emotions.includes(emotionFilter)
    );
  }

  filteredDreams = [...filteredDreams].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortBy === "newest" ? dateB - dateA : dateA - dateB;
  });

  filteredIntentions = [...filteredIntentions].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortBy === "newest" ? dateB - dateA : dateA - dateB;
  });

  const dreamsByMonth = filteredDreams.reduce((acc, dream) => {
    const monthYear = new Date(dream.date).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(dream);
    return acc;
  }, {} as Record<string, Dream[]>);

  const intentionsByMonth = filteredIntentions.reduce((acc, intention) => {
    const monthYear = new Date(intention.date).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(intention);
    return acc;
  }, {} as Record<string, SleepIntention[]>);

  const pageTitle = entryType === "dreams" ? "Dream Archive" : "Intentions Journal";
  const pageSubtitle = entryType === "dreams" 
    ? (showArchived ? "Archived dreams" : "Browse all your recorded dreams")
    : (showArchived ? "Archived intentions" : "Your sacred intentions and manifestations");

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight" data-testid="text-archive-title">
              {pageTitle}
            </h1>
            <p className="text-muted-foreground mt-1">
              {pageSubtitle}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={showArchived ? "default" : "outline"}
              onClick={() => setShowArchived(!showArchived)}
              data-testid="button-toggle-archived"
            >
              <DreamGateFunctionSymbol kind="archive" className="h-4 w-4 mr-2" />
              {showArchived ? "Viewing Archived" : "View Archived"}
            </Button>
          </div>
        </div>

        <Tabs value={entryType} onValueChange={(v) => setEntryType(v as EntryType)} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="dreams" data-testid="tab-dreams">
              <Moon className="h-4 w-4 mr-2" />
              Dreams
            </TabsTrigger>
            <TabsTrigger value="intentions" data-testid="tab-intentions">
              <Sparkles className="h-4 w-4 mr-2" />
              Intentions
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={entryType === "dreams" 
              ? "Search dreams, themes, symbols..." 
              : "Search intentions..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-archive"
          />
        </div>

        {entryType === "dreams" && (
          <Select value={emotionFilter} onValueChange={setEmotionFilter}>
            <SelectTrigger className="w-full md:w-40" data-testid="select-emotion-filter">
              <SelectValue placeholder="Emotion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Emotions</SelectItem>
              {emotionFilters.map((emotion) => (
                <SelectItem key={emotion} value={emotion} className="capitalize">
                  {emotion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as "newest" | "oldest")}>
          <SelectTrigger className="w-full md:w-32" data-testid="select-sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {entryType === "dreams" ? (
        filteredDreams.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(dreamsByMonth).map(([monthYear, monthDreams]) => (
              <section key={monthYear}>
                <div className="flex items-center gap-3 mb-4">
                  <DreamGateFunctionSymbol kind="calendar" className="h-5 w-5" />
                  <h2 className="font-display text-lg font-semibold">{monthYear}</h2>
                  <Badge variant="secondary" className="ml-2">
                    {monthDreams.length} {monthDreams.length === 1 ? 'dream' : 'dreams'}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {monthDreams.map((dream) => (
                    <DreamCard
                      key={dream.id}
                      dream={dream}
                      onArchive={showArchived 
                        ? () => unarchiveDreamMutation.mutate(dream.id) 
                        : () => archiveDreamMutation.mutate(dream.id)
                      }
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 rounded-lg border border-dashed border-border">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              {showArchived ? (
                <DreamGateFunctionSymbol kind="archive" className="h-8 w-8" />
              ) : (
                <Moon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="font-display text-lg font-semibold mb-2" data-testid="text-empty-state">
              {showArchived ? "No archived dreams" : "No dreams found"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {showArchived 
                ? "Dreams you archive will appear here"
                : searchQuery || emotionFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start your dream journal today"
              }
            </p>
            {!showArchived && !searchQuery && emotionFilter === "all" && (
              <Link href="/decoder">
                <Button data-testid="button-log-first-archive">
                  <PenLine className="h-4 w-4 mr-2" />
                  Log a Dream
                </Button>
              </Link>
            )}
          </div>
        )
      ) : (
        filteredIntentions.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(intentionsByMonth).map(([monthYear, monthIntentions]) => (
              <section key={monthYear}>
                <div className="flex items-center gap-3 mb-4">
                  <DreamGateFunctionSymbol kind="calendar" className="h-5 w-5" />
                  <h2 className="font-display text-lg font-semibold">{monthYear}</h2>
                  <Badge variant="secondary" className="ml-2">
                    {monthIntentions.length} {monthIntentions.length === 1 ? 'intention' : 'intentions'}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {monthIntentions.map((intention) => (
                    <IntentionCard
                      key={intention.id}
                      intention={intention}
                      isArchived={showArchived}
                      onArchive={showArchived 
                        ? () => unarchiveIntentionMutation.mutate(intention.id) 
                        : () => archiveIntentionMutation.mutate(intention.id)
                      }
                      onDelete={() => deleteIntentionMutation.mutate(intention.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 rounded-lg border border-dashed border-border">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              {showArchived ? (
                <DreamGateFunctionSymbol kind="archive" className="h-8 w-8" />
              ) : (
                <Sparkles className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="font-display text-lg font-semibold mb-2" data-testid="text-empty-intentions">
              {showArchived ? "No archived intentions" : "No intentions found"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {showArchived 
                ? "Intentions you archive will appear here"
                : searchQuery
                  ? "Try adjusting your search"
                  : "Set your first intention in the Night Map"
              }
            </p>
            {!showArchived && !searchQuery && (
              <Link href="/night-map">
                <Button data-testid="button-set-first-intention">
                  <Star className="h-4 w-4 mr-2" />
                  Set an Intention
                </Button>
              </Link>
            )}
          </div>
        )
      )}
    </div>
  );
}
