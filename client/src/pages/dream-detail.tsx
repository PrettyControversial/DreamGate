import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { type Dream } from "@shared/schema";
import { ArrowLeft, Bookmark, Moon, Heart, Calendar } from "lucide-react";
import { format } from "date-fns";

import womanForestImage from "@assets/woman_entering_forest.jpg";
import mistMountainsImage from "@assets/stock_images/peaceful_nature_land_c97871d8.jpg";

type TabType = "overview" | "details" | "symbols";

function getMoodLabel(rating: number): string {
  if (rating >= 8) return "Blissful";
  if (rating >= 6) return "Peaceful";
  if (rating >= 4) return "Neutral";
  if (rating >= 2) return "Unsettled";
  return "Intense";
}

export default function DreamDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isBookmarked, setIsBookmarked] = useState(false);

  const { data: dream, isLoading } = useQuery<Dream>({
    queryKey: ["/api/dreams", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/dreams/${id}`);
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="w-full aspect-[4/3]" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!dream) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Dream not found</p>
          <Link href="/archive">
            <Button>Back to Archive</Button>
          </Link>
        </div>
      </div>
    );
  }

  const dreamDate = new Date(dream.date);
  const formattedDate = format(dreamDate, "MMMM d, yyyy");

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="hero-image-container">
        <img 
          src={womanForestImage}
          alt="Dream imagery"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        <div className="hero-overlay-controls">
          <button 
            onClick={() => navigate("/archive")}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center ${
              isBookmarked ? 'bg-primary text-primary-foreground' : 'bg-black/30 text-white'
            }`}
            data-testid="button-bookmark"
          >
            <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-6 -mt-16 relative z-10">
        <h1 
          className="font-display text-2xl md:text-3xl text-foreground mb-3"
          data-testid="text-dream-title"
        >
          {dream.title}
        </h1>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
          {dream.moonPhase && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Moon className="h-4 w-4" />
              <span>{dream.moonPhase.replace(/_/g, ' ')}</span>
            </div>
          )}
          {dream.emotions && dream.emotions.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Heart className="h-4 w-4" />
              <span>{dream.emotions[0]}</span>
            </div>
          )}
        </div>

        <div className="tab-switcher mb-6">
          {(["overview", "details", "symbols"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-switcher-item capitalize ${
                activeTab === tab ? 'tab-switcher-item-active' : 'tab-switcher-item-inactive'
              }`}
              data-testid={`tab-${tab}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="min-h-[200px]">
          {activeTab === "overview" && (
            <div className="space-y-4" data-testid="section-overview">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {dream.content}
              </p>
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-4" data-testid="section-details">
              {dream.emotions && dream.emotions.length > 0 && (
                <div>
                  <h3 className="font-display text-lg text-foreground mb-2">Emotions</h3>
                  <div className="flex flex-wrap gap-2">
                    {dream.emotions.map((emotion, i) => (
                      <span 
                        key={i}
                        className="px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground"
                      >
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {dream.themes && dream.themes.length > 0 && (
                <div>
                  <h3 className="font-display text-lg text-foreground mb-2">Themes</h3>
                  <div className="flex flex-wrap gap-2">
                    {dream.themes.map((theme, i) => (
                      <span 
                        key={i}
                        className="px-3 py-1.5 rounded-full bg-primary/10 text-sm text-primary"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {activeTab === "symbols" && (
            <div className="space-y-4" data-testid="section-symbols">
              {dream.symbols && dream.symbols.length > 0 ? (
                <div className="grid gap-3">
                  {dream.symbols.map((symbol, i) => (
                    <div 
                      key={i}
                      className="p-4 rounded-xl bg-card border border-border"
                    >
                      <h4 className="font-display text-foreground capitalize">{symbol}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Explore the meaning of this symbol in your dream dictionary
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No symbols identified in this dream yet
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-8">
          <Link href={`/decoder/${dream.id}`}>
            <button 
              className="cta-button-full bg-foreground text-background font-medium"
              data-testid="button-interpret"
            >
              Interpret This Dream
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}