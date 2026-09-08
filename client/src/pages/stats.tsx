import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Flame, 
  Trophy, 
  Target, 
  Clock, 
  Moon, 
  Sparkles,
  Share2,
  ChevronLeft,
  ChevronRight,
  Star,
  Lock
  ,Repeat2
} from "lucide-react";
import type { Dream, DreamStats, EnhancedDreamInterpretation } from "@shared/schema";
import { useState, useMemo } from "react";
import { achievementSymbols } from "@/data/achievement-symbols";
import { DreamGateFunctionSymbol } from "@/components/dreamgate-function-symbol";
import { PsyraArchetypeCard } from "@/components/psyra-archetype-card";
import { getArchetype } from "@shared/psyra";

function readInterpretation(value?: string | null): EnhancedDreamInterpretation | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as {
      interpretation?: EnhancedDreamInterpretation;
      dreamOverview?: string;
    };
    return parsed.interpretation ?? (
      typeof parsed.dreamOverview === "string"
        ? (parsed as EnhancedDreamInterpretation)
        : undefined
    );
  } catch {
    return undefined;
  }
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  testId: string;
}

function StatCard({ icon, value, label, testId }: StatCardProps) {
  return (
    <Card className="rounded-2xl" data-testid={testId}>
      <CardContent className="p-5 flex flex-col items-center text-center gap-2">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-3xl font-display font-bold">{value}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}

const achievements = [
  { id: "first_dream", name: "Dream Seeker", symbol: achievementSymbols.ring, requirement: { type: "dreams", value: 1 } },
  { id: "streak_7", name: "7-Day Streak", symbol: achievementSymbols.blackTag, requirement: { type: "streak", value: 7 } },
  { id: "streak_30", name: "30-Day Streak", symbol: achievementSymbols.leaf, requirement: { type: "streak", value: 30 } },
  { id: "dreams_10", name: "Dream Explorer", symbol: achievementSymbols.leafSprig, requirement: { type: "dreams", value: 10 } },
  { id: "dreams_50", name: "Dream Master", symbol: achievementSymbols.stone, requirement: { type: "dreams", value: 50 } },
  { id: "tarot_10", name: "Card Reader", symbol: achievementSymbols.seatedStone, requirement: { type: "tarot", value: 10 } },
  { id: "tarot_25", name: "Tarot Master", symbol: achievementSymbols.flower, requirement: { type: "tarot", value: 25 } },
];

export default function Stats() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showBadgePreview, setShowBadgePreview] = useState(false);
  
  const { data: dreams = [], isLoading } = useQuery<Dream[]>({
    queryKey: ["/api/dreams"],
  });
  const { data: dreamStats, isLoading: dreamStatsLoading } = useQuery<DreamStats>({
    queryKey: ["/api/dreams/stats"],
  });

  const stats = useMemo(() => {
    const dreamDates = dreams.map(d => new Date(d.date).toDateString());
    const uniqueDates = Array.from(new Set(dreamDates));
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    
    const sortedDates = uniqueDates
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());
    
    if (sortedDates.length > 0) {
      const todayStr = today.toDateString();
      const yesterdayDate = new Date(today);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = yesterdayDate.toDateString();
      
      if (sortedDates[0].toDateString() === todayStr || 
          sortedDates[0].toDateString() === yesterdayStr) {
        currentStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const prev = sortedDates[i - 1];
          const curr = sortedDates[i];
          const diffDays = Math.floor((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    sortedDates.forEach((date, i) => {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = sortedDates[i - 1];
        const diffDays = Math.floor((prev.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    });
    longestStreak = Math.max(longestStreak, tempStreak);

    const tarotReadings = parseInt(localStorage.getItem("tarotReadings") || "0");
    const totalMinutes = dreams.length * 5;

    return {
      currentStreak,
      longestStreak,
      totalSessions: dreams.length + tarotReadings,
      totalMinutes,
      dreamsDecoded: dreams.length,
      tarotReadings,
      activeDates: uniqueDates,
    };
  }, [dreams]);

  const unlockedAchievements = useMemo(() => {
    return achievements.filter(a => {
      const { type, value } = a.requirement;
      if (type === "streak") return stats.longestStreak >= value;
      if (type === "dreams") return stats.dreamsDecoded >= value;
      if (type === "tarot") return stats.tarotReadings >= value;
      return false;
    });
  }, [stats]);

  const psycheProfile = useMemo(() => {
    const analyses = dreams
      .map((dream) => readInterpretation(dream.decodedInsights)?.archetypeAnalysis)
      .filter((analysis): analysis is NonNullable<typeof analysis> => Boolean(analysis));
    const counts = new Map<string, number>();
    const dimensions = { shadow: 0, ego: 0, self: 0, persona: 0 };
    for (const analysis of analyses) {
      counts.set(
        analysis.primaryArchetype,
        (counts.get(analysis.primaryArchetype) ?? 0) + 1,
      );
      for (const key of Object.keys(dimensions) as Array<keyof typeof dimensions>) {
        dimensions[key] += analysis.jungianDimensions[key];
      }
    }
    const dominantId = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    const divisor = analyses.length || 1;
    return {
      total: analyses.length,
      dominantId,
      counts,
      dimensions: Object.fromEntries(
        Object.entries(dimensions).map(([key, value]) => [key, value / divisor]),
      ) as typeof dimensions,
    };
  }, [dreams]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: { date: Date | null; hasActivity: boolean }[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, hasActivity: false });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const hasActivity = stats.activeDates.includes(date.toDateString());
      days.push({ date, hasActivity });
    }

    return days;
  }, [currentMonth, stats.activeDates]);

  const handleShare = async () => {
      const text = `My DreamGate Stats:\n- Current Streak: ${stats.currentStreak} days\n- Longest Streak: ${stats.longestStreak} days\n- Dreams Interpreted: ${stats.dreamsDecoded}\n- Tarot Readings: ${stats.tarotReadings}`;
    
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-8" data-testid="stats-page">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your Journey</p>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-display">My Progress</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShare}
            className="rounded-full"
            data-testid="button-share-stats"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          Track your dream journey and unlock achievements
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={<Flame className="h-8 w-8" />}
          value={stats.currentStreak}
          label="Current Streak"
          testId="stat-current-streak"
        />
        <StatCard
          icon={<Trophy className="h-8 w-8" />}
          value={stats.longestStreak}
          label="Longest Streak"
          testId="stat-longest-streak"
        />
        <StatCard
          icon={<Target className="h-8 w-8" />}
          value={stats.totalSessions}
          label="Total Sessions"
          testId="stat-total-sessions"
        />
        <StatCard
          icon={<Clock className="h-8 w-8" />}
          value={stats.totalMinutes}
          label="Total Minutes"
          testId="stat-total-minutes"
        />
        <StatCard
          icon={<Moon className="h-8 w-8" />}
          value={stats.dreamsDecoded}
          label="Dreams Interpreted"
          testId="stat-dreams-decoded"
        />
        <StatCard
          icon={<Sparkles className="h-8 w-8" />}
          value={stats.tarotReadings}
          label="Tarot Readings"
          testId="stat-tarot-readings"
        />
      </div>

      <section className="space-y-5" data-testid="your-psyche-section">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Patterns Across Dreams</p>
          <h2 className="mt-2 font-display text-3xl">Your Psyche</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            An evolving view built from the structured patterns Psyra has identified in your interpreted dreams.
          </p>
        </div>
        {psycheProfile.total === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="font-display text-xl">Your pattern is still emerging.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Ask Psyra about a dream to begin discovering recurring archetypes and Jungian dimensions.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="overflow-hidden">
              <PsyraArchetypeCard archetypeId={psycheProfile.dominantId!} compact />
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Dominant Archetype</p>
                <p className="mt-2 text-sm leading-relaxed">
                  {getArchetype(psycheProfile.dominantId)?.shortDescription}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Appeared in {psycheProfile.counts.get(psycheProfile.dominantId!) ?? 0} of {psycheProfile.total} analyzed dreams.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-xl">Jungian Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {Object.entries(psycheProfile.dimensions).map(([name, value]) => (
                  <div key={name}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="capitalize">{name}</span>
                      <span className="text-muted-foreground">{Math.round(value * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted">
                      <div className="h-full bg-foreground" style={{ width: `${value * 100}%` }} />
                    </div>
                  </div>
                ))}
                <p className="pt-2 text-xs leading-relaxed text-muted-foreground">
                  These are reflective signals, not diagnoses. They shift as your dream journal grows.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      <section className="space-y-5" aria-labelledby="recurring-symbols-title" data-testid="recurring-symbols-card">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Patterns Across Dreams</p>
          <h2 id="recurring-symbols-title" className="mt-2 font-display text-3xl">Recurring symbols</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Notice what keeps returning. Repetition can be a quiet invitation from the dreaming mind.
          </p>
        </div>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">This month</p>
              <Repeat2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            {dreamStatsLoading ? (
              <Skeleton className="mt-5 h-20 w-full" />
            ) : (dreamStats?.recurringSymbolsThisMonth ?? []).length > 0 ? (
              <div className="mt-5 space-y-3">
                {dreamStats?.recurringSymbolsThisMonth.map(({ symbol, count }) => (
                  <div key={symbol} className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
                    <p className="text-sm leading-relaxed">
                      You have dreamed about <span className="font-semibold">{symbol}</span>{" "}
                      {count} {count === 1 ? "time" : "times"} this month.
                    </p>
                    <span className="font-display text-2xl">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                When a symbol appears in two or more dreams this month, its pattern will gather here.
              </p>
            )}
            <Link href="/dictionary" className="mt-5 inline-block text-xs font-semibold uppercase tracking-[0.14em] underline underline-offset-4">
              Explore dream symbols
            </Link>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <DreamGateFunctionSymbol kind="calendar" className="h-5 w-5" />
            Activity Calendar
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              data-testid="button-next-month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <span key={i} className="text-xs text-muted-foreground font-medium">
                {day}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, i) => (
              <div
                key={i}
                className={`
                  w-10 h-10 flex items-center justify-center rounded-full text-sm
                  ${!day.date ? "invisible" : ""}
                  ${day.hasActivity 
                    ? "bg-primary text-muted-foreground-foreground font-semibold" 
                    : "text-muted-foreground hover:bg-muted"
                  }
                  ${day.date?.toDateString() === new Date().toDateString() 
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                    : ""
                  }
                `}
                data-testid={day.date ? `calendar-day-${day.date.getDate()}` : undefined}
              >
                {day.date?.getDate()}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-display font-semibold">Achievement Badges</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBadgePreview((visible) => !visible)}
            data-testid="button-preview-badges"
          >
            <Sparkles className="h-4 w-4" />
            {showBadgePreview ? "Hide preview" : "Preview symbols"}
          </Button>
        </div>
        {showBadgePreview && (
          <p className="text-xs text-muted-foreground">
            Preview mode shows each badge in its unlocked state.
          </p>
        )}
        <div className="grid grid-cols-3 gap-4">
          {achievements.map((achievement) => {
            const isUnlocked = showBadgePreview || unlockedAchievements.some(a => a.id === achievement.id);
            return (
              <div
                key={achievement.id}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-2xl text-center
                  ${isUnlocked 
                    ? "bg-primary/10 border border-primary/20" 
                    : "bg-muted/50 opacity-50"
                  }
                `}
                data-testid={`achievement-${achievement.id}`}
              >
                <div className={`
                  w-14 h-14 rounded-full flex items-center justify-center
                  ${isUnlocked ? "bg-primary/20 text-muted-foreground" : "bg-muted text-muted-foreground grayscale"}
                `}>
                  {isUnlocked ? (
                    <img
                      src={achievement.symbol}
                      alt={`${achievement.name} symbol`}
                      className="h-12 w-12 object-contain"
                    />
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                </div>
                <span className="text-xs font-medium">{achievement.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
