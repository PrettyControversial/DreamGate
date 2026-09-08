import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Sparkles, 
  Send, 
  Loader2, 
  BookOpen, 
  Clock, 
  ChevronRight,
  Moon,
  PenLine
} from "lucide-react";
import type { Dream } from "@shared/schema";
import dreamJournalEmptyIcon from "@assets/dreamgate_icons/dream-journal-crow.webp";
import dreamgatePageTexture from "@assets/texture__(3)_1788397809454.jpeg";
import { DreamGateFunctionSymbol } from "@/components/dreamgate-function-symbol";
import { VoiceInputButton } from "@/components/voice-input-button";
import {
  trackDiscoverToolCompleted,
  trackDreamSaved,
} from "@/lib/analytics";

export default function DreamPage() {
  const [dreamText, setDreamText] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: dreams = [], isLoading: dreamsLoading } = useQuery<Dream[]>({
    queryKey: ["/api/dreams"],
  });

  const decodeMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/dreams", {
        content: text,
        title: text.slice(0, 50) + (text.length > 50 ? "..." : ""),
        date: new Date().toISOString(),
        emotions: [],
        themes: [],
        symbols: [],
      });
      return response.json();
    },
    onSuccess: (data) => {
      trackDreamSaved("ask_psyra", data.isFirstDream);
      trackDiscoverToolCompleted(["prompts"], "dream_saved");
      queryClient.invalidateQueries({ queryKey: ["/api/dreams"] });
      setDreamText("");
      toast({
        title: "Dream saved!",
        description: "Your dream has been recorded.",
      });
      if (data.id) {
        navigate(`/decoder/${data.id}`);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save dream. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDecode = () => {
    if (!dreamText.trim()) return;
    decodeMutation.mutate(dreamText);
  };

  const recentDreams = dreams.slice(0, 5);
  const characterCount = dreamText.length;
  const maxCharacters = 5000;

  return (
    <div
      className="dream-decoder-light-surface min-h-screen px-4 py-6 space-y-8"
      style={{ backgroundImage: `url(${dreamgatePageTexture})` }}
      data-testid="dream-page"
    >
      <div className="text-center space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your Dreams</p>
        <h1 className="text-3xl md:text-4xl font-display">Ask Psyra</h1>
        <p className="text-muted-foreground text-sm">
          Describe your dream and receive AI-powered insights
        </p>
      </div>

      <Card className="rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Textarea
            placeholder="Describe your dream in detail..."
            value={dreamText}
            onChange={(e) => setDreamText(e.target.value.slice(0, maxCharacters))}
            className="min-h-[200px] max-h-[400px] border-0 rounded-none resize-none text-base focus-visible:ring-0"
            data-testid="input-dream-text"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <VoiceInputButton
                value={dreamText}
                onChange={(value) => setDreamText(value.slice(0, maxCharacters))}
                data-testid="button-voice-dream"
              />
              <span className="text-xs text-muted-foreground">
                {characterCount}/{maxCharacters}
              </span>
            </div>
            <Button
              onClick={handleDecode}
              disabled={!dreamText.trim() || decodeMutation.isPending}
              className="home-capsule-button home-capsule-button--ink no-default-hover-elevate no-default-active-elevate"
              data-testid="button-decode-dream"
            >
              {decodeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Psyra is listening...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Ask Psyra
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Link href="/decoder">
          <Card className="rounded-xl hover-elevate cursor-pointer h-full border-primary/40 bg-primary/5">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <DreamGateFunctionSymbol kind="new-entry" className="h-5 w-5" />
              <span className="text-xs font-medium">New Entry</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/prompts">
          <Card className="rounded-xl hover-elevate cursor-pointer h-full border-primary/40 bg-primary/5">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <DreamGateFunctionSymbol kind="prompts" className="h-5 w-5" />
              <span className="text-xs font-medium">Prompts</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dictionary">
          <Card className="rounded-xl hover-elevate cursor-pointer h-full border-primary/40 bg-primary/5">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <DreamGateFunctionSymbol kind="dictionary" className="h-5 w-5" />
              <span className="text-xs font-medium">Dictionary</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Dream Journal
          </h2>
          <Link href="/archive">
            <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        {dreamsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : recentDreams.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-8 text-center">
              <img
                src={dreamJournalEmptyIcon}
                alt=""
                className="h-20 w-20 object-contain mx-auto mb-4"
              />
              <p className="text-muted-foreground">
                No dreams recorded yet. Start by describing your dream above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentDreams.map((dream) => (
              <Link key={dream.id} href={`/decoder/${dream.id}`}>
                <Card 
                  className="rounded-2xl hover-elevate cursor-pointer"
                  data-testid={`dream-entry-${dream.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {dream.title || "Untitled Dream"}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {dream.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="rounded-full text-xs">
                            {new Date(dream.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </Badge>
                          {dream.decodedInsights && (
                            <Badge variant="outline" className="rounded-full text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Interpreted
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-2" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
