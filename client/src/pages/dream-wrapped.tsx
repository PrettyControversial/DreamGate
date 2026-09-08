import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { type DreamStats, type Dream } from "@shared/schema";
import { 
  Gift, 
  BookOpen, 
  Heart, 
  Sparkles, 
  TrendingUp,
  Calendar,
  Moon,
  Star,
  ChevronRight,
  ChevronLeft,
  Share2
} from "lucide-react";
import { DreamGateFunctionSymbol } from "@/components/dreamgate-function-symbol";

const slides = [
  "intro",
  "total_dreams",
  "top_emotions",
  "top_themes",
  "monthly_breakdown",
  "memorable",
  "summary"
];

export default function DreamWrapped() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const currentYear = new Date().getFullYear();

  const { data: stats, isLoading: statsLoading } = useQuery<DreamStats>({
    queryKey: ["/api/dreams/stats"],
  });

  const { data: dreams, isLoading: dreamsLoading } = useQuery<Dream[]>({
    queryKey: ["/api/dreams"],
  });

  const isLoading = statsLoading || dreamsLoading;

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const recentDreams = dreams?.slice(0, 3) || [];
  const progress = ((currentSlide + 1) / slides.length) * 100;

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const renderSlide = () => {
    switch (slides[currentSlide]) {
      case "intro":
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto">
              <Gift className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-4xl font-bold">
                Your {currentYear}
              </h2>
              <h3 className="font-display text-5xl font-bold text-primary mt-2">
                Dream Wrapped
              </h3>
            </div>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              A journey through your dreams, emotions, and the patterns that emerged this year
            </p>
          </div>
        );

      case "total_dreams":
        return (
          <div className="text-center space-y-8">
            <div className="space-y-2">
              <p className="text-muted-foreground text-lg">This year, you recorded</p>
              <div className="font-display text-8xl font-bold text-primary">
                {stats?.dreamsThisYear || 0}
              </div>
              <p className="text-2xl font-medium">dreams</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-display text-2xl font-bold">{stats?.dreamsThisMonth || 0}</p>
                <p className="text-xs text-muted-foreground">this month</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-display text-2xl font-bold">{stats?.dreamsThisWeek || 0}</p>
                <p className="text-xs text-muted-foreground">this week</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-display text-2xl font-bold">{stats?.totalDreams || 0}</p>
                <p className="text-xs text-muted-foreground">all time</p>
              </div>
            </div>
          </div>
        );

      case "top_emotions":
        return (
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <Heart className="h-12 w-12 text-secondary mx-auto" />
              <h2 className="font-display text-3xl font-bold">Your Dream Emotions</h2>
              <p className="text-muted-foreground">The feelings that filled your dreamscape</p>
            </div>
            
            <div className="space-y-3 max-w-md mx-auto">
              {stats?.topEmotions?.slice(0, 5).map((emotion, index) => (
                <div key={emotion.emotion} className="flex items-center gap-4">
                  <span className="font-display text-2xl font-bold text-muted-foreground w-8">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium capitalize">{emotion.emotion}</span>
                      <span className="text-muted-foreground">{emotion.count}x</span>
                    </div>
                    <Progress value={(emotion.count / (stats?.topEmotions?.[0]?.count || 1)) * 100} className="h-2" />
                  </div>
                </div>
              ))}
              {(!stats?.topEmotions || stats.topEmotions.length === 0) && (
                <p className="text-muted-foreground">No emotions recorded yet</p>
              )}
            </div>
          </div>
        );

      case "top_themes":
        return (
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <Sparkles className="h-12 w-12 text-primary mx-auto" />
              <h2 className="font-display text-3xl font-bold">Recurring Themes</h2>
              <p className="text-muted-foreground">Patterns that emerged in your dreams</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 max-w-lg mx-auto">
              {stats?.topThemes?.slice(0, 8).map((theme, index) => (
                <Badge 
                  key={theme.theme}
                  variant={index === 0 ? "default" : "secondary"}
                  className="text-base px-4 py-2 capitalize"
                >
                  {theme.theme} ({theme.count})
                </Badge>
              ))}
              {(!stats?.topThemes || stats.topThemes.length === 0) && (
                <p className="text-muted-foreground">No themes recorded yet</p>
              )}
            </div>

            {stats?.topSymbols && stats.topSymbols.length > 0 && (
              <div className="pt-6 border-t border-border mt-6">
                <p className="text-sm text-muted-foreground mb-3">Top Symbols</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {stats.topSymbols.slice(0, 5).map((symbol) => (
                    <Badge key={symbol.symbol} variant="outline" className="capitalize">
                      <Star className="h-3 w-3 mr-1" />
                      {symbol.symbol}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "monthly_breakdown":
        return (
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <DreamGateFunctionSymbol kind="calendar" className="h-12 w-12 mx-auto" />
              <h2 className="font-display text-3xl font-bold">Monthly Journey</h2>
              <p className="text-muted-foreground">Your dream activity throughout the year</p>
            </div>
            
            <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
              {stats?.dreamsByMonth?.map((month) => {
                const maxCount = Math.max(...(stats.dreamsByMonth?.map(m => m.count) || [1]));
                const intensity = month.count / maxCount;
                return (
                  <div 
                    key={month.month}
                    className="p-3 rounded-lg text-center"
                    style={{
                      backgroundColor: `hsl(var(--primary) / ${0.1 + intensity * 0.4})`
                    }}
                  >
                    <p className="text-xs text-muted-foreground">{month.month.slice(0, 3)}</p>
                    <p className="font-display font-bold">{month.count}</p>
                  </div>
                );
              })}
              {(!stats?.dreamsByMonth || stats.dreamsByMonth.length === 0) && (
                <p className="col-span-4 text-muted-foreground">No monthly data yet</p>
              )}
            </div>
          </div>
        );

      case "memorable":
        return (
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <Moon className="h-12 w-12 text-primary mx-auto" />
              <h2 className="font-display text-3xl font-bold">Memorable Dreams</h2>
              <p className="text-muted-foreground">Some highlights from your dreamscape</p>
            </div>
            
            <div className="space-y-3 max-w-md mx-auto">
              {recentDreams.map((dream) => (
                <Card key={dream.id} className="text-left">
                  <CardContent className="p-4">
                    <h3 className="font-display font-semibold">{dream.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {dream.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {recentDreams.length === 0 && (
                <p className="text-muted-foreground">No dreams recorded yet</p>
              )}
            </div>
          </div>
        );

      case "summary":
        return (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center mx-auto">
                <TrendingUp className="h-12 w-12 text-primary" />
              </div>
              <h2 className="font-display text-4xl font-bold">Keep Dreaming</h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Your dream journey continues. Every night brings new insights and discoveries.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <BookOpen className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="font-display text-2xl font-bold">{stats?.totalDreams || 0}</p>
                <p className="text-xs text-muted-foreground">Total Dreams</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                <Heart className="h-6 w-6 text-secondary mx-auto mb-2" />
                <p className="font-display text-2xl font-bold">{stats?.topEmotions?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Emotions Felt</p>
              </div>
            </div>

            <Button variant="outline" className="gap-2" data-testid="button-share-wrapped">
              <Share2 className="h-4 w-4" />
              Share Your Wrapped
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <Progress value={progress} className="h-1 mb-8" />
        
        <Card className="min-h-[500px] flex flex-col justify-center bg-gradient-to-br from-card via-card to-primary/5 border-primary/10">
          <CardContent className="p-8">
            {renderSlide()}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mt-6">
          <Button
            variant="ghost"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            data-testid="button-prev-slide"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back
          </Button>
          
          <div className="flex gap-1">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-primary' : 'bg-muted'
                }`}
                data-testid={`button-slide-${index}`}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            data-testid="button-next-slide"
          >
            Next
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
