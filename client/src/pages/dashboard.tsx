import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useEffect, useState, useMemo, useCallback } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DreamCard } from "@/components/dream-card";
import { DreamgateIntro } from "@/components/dreamgate-intro";
import { HomeCollage } from "@/components/home-collage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type Dream, type DreamStats, type CelestialData, type WritingPrompt } from "@shared/schema";
import { BookOpen, Calendar, Moon, Sparkles, Search, Archive, Layers, Heart, Flame, Trophy, Star, Target, Zap } from "lucide-react";
import { achievementSymbols } from "@/data/achievement-symbols";
import { markTarotEntrySource } from "@/lib/analytics";


import dreamDictionaryImage from "@assets/dreamgate_cards/dream-dictionary.webp";
import restRestoreImage from "@assets/dreamgate_cards/rest-restore.webp";
import tarotReadingImage from "@assets/dreamgate_cards/tarot-reading-hand.webp";
import moonCalendarImage from "@assets/dreamgate_cards/moon-calendar.webp";
import dreamDecoderImage from "@assets/dreamgate_cards/dream-decoder.webp";
import writingPromptsImage from "@assets/dreamgate_cards/writing-prompts.webp";
import dreamArchiveImage from "@assets/dreamgate_cards/dream-archive.webp";
import nightMapImage from "@assets/dreamgate_cards/night-map.webp";
import dreamJournalAwaitsIcon from "@assets/dreamgate_icons/dream-journal-icon.webp";
import mirrorPortalImage from "@assets/night-map-portal.webp";
import greetingVideo from "@assets/dreamgate_backgrounds/good-evening-video.mp4";
import afternoonBackgroundImage from "@assets/dreamgate_backgrounds/good-afternoon.webp";
import tarotSymbol from "@assets/dreamgate_symbols/footer/54.webp";
import {
  DreamGateFunctionSymbol,
  type DreamGateFunctionSymbolKind,
} from "@/components/dreamgate-function-symbol";

// Capitalize first letter of each word
function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

// Streak tracking utilities - uses dream dates from actual log entries
function getStreakData(): { currentStreak: number; longestStreak: number; lastProcessedDreamCount: number } {
  try {
    const data = localStorage.getItem('dreamstate_streak');
    if (data) return JSON.parse(data);
  } catch {}
  return { currentStreak: 0, longestStreak: 0, lastProcessedDreamCount: 0 };
}

function calculateStreakFromDreams(dreams: Dream[]): { currentStreak: number; longestStreak: number } {
  if (!dreams || dreams.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }
  
  // Get unique dates when dreams were logged (sorted newest first)
  const dreamDates = Array.from(new Set(
    dreams.map(d => new Date(d.date).toDateString())
  )).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  if (dreamDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const mostRecentDream = new Date(dreamDates[0]);
  mostRecentDream.setHours(0, 0, 0, 0);
  
  // Check if streak is still active (dream logged today or yesterday)
  const daysSinceLastDream = Math.floor((today.getTime() - mostRecentDream.getTime()) / (1000 * 60 * 60 * 24));
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  
  // Calculate streaks from dream dates
  for (let i = 0; i < dreamDates.length - 1; i++) {
    const current = new Date(dreamDates[i]);
    const next = new Date(dreamDates[i + 1]);
    current.setHours(0, 0, 0, 0);
    next.setHours(0, 0, 0, 0);
    
    const diff = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  
  // Current streak only counts if dream was logged today or yesterday
  if (daysSinceLastDream <= 1) {
    tempStreak = 1;
    for (let i = 0; i < dreamDates.length - 1; i++) {
      const current = new Date(dreamDates[i]);
      const next = new Date(dreamDates[i + 1]);
      current.setHours(0, 0, 0, 0);
      next.setHours(0, 0, 0, 0);
      
      const diff = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff === 1) {
        tempStreak++;
      } else {
        break;
      }
    }
    currentStreak = tempStreak;
  }
  
  return { currentStreak, longestStreak };
}

function saveStreakData(currentStreak: number, longestStreak: number, dreamCount: number) {
  localStorage.setItem('dreamstate_streak', JSON.stringify({
    currentStreak,
    longestStreak,
    lastProcessedDreamCount: dreamCount
  }));
}

// Achievement definitions
const achievements = [
  { id: 'first_dream', name: 'Dream Seeker', description: 'Log your first dream', icon: Star, symbol: achievementSymbols.ring, threshold: 1, type: 'dreams' },
  { id: 'week_warrior', name: 'Week Warrior', description: 'Log 7 dreams', icon: Target, symbol: achievementSymbols.blackTag, threshold: 7, type: 'dreams' },
  { id: 'dream_weaver', name: 'Dream Weaver', description: 'Log 30 dreams', icon: Zap, symbol: achievementSymbols.leaf, threshold: 30, type: 'dreams' },
  { id: 'dream_master', name: 'Dream Master', description: 'Log 100 dreams', icon: Trophy, symbol: achievementSymbols.leafSprig, threshold: 100, type: 'dreams' },
  { id: 'streak_3', name: 'On Fire', description: '3 day streak', icon: Flame, symbol: achievementSymbols.stone, threshold: 3, type: 'streak' },
  { id: 'streak_7', name: 'Weekly Ritual', description: '7 day streak', icon: Flame, symbol: achievementSymbols.seatedStone, threshold: 7, type: 'streak' },
  { id: 'streak_30', name: 'Moon Cycle', description: '30 day streak', icon: Moon, symbol: achievementSymbols.flower, threshold: 30, type: 'streak' },
];

function getUnlockedAchievements(totalDreams: number, longestStreak: number) {
  return achievements.filter(a => {
    if (a.type === 'dreams') return totalDreams >= a.threshold;
    if (a.type === 'streak') return longestStreak >= a.threshold;
    return false;
  });
}

function getNextAchievement(totalDreams: number, longestStreak: number) {
  const dreamAchievement = achievements.find(a => a.type === 'dreams' && totalDreams < a.threshold);
  const streakAchievement = achievements.find(a => a.type === 'streak' && longestStreak < a.threshold);
  
  if (!dreamAchievement) return streakAchievement;
  if (!streakAchievement) return dreamAchievement;
  
  const dreamProgress = totalDreams / dreamAchievement.threshold;
  const streakProgress = longestStreak / streakAchievement.threshold;
  
  return dreamProgress > streakProgress ? dreamAchievement : streakAchievement;
}

// Motivational messages based on activity
function getMotivationalMessage(totalDreams: number, currentStreak: number, dreamsThisWeek: number): string {
  if (totalDreams === 0) {
    return "Every great journey begins with a single step. Log your first dream today.";
  }
  if (currentStreak >= 7) {
    return "Incredible dedication! Your dream practice is becoming a powerful ritual.";
  }
  if (currentStreak >= 3) {
    return "You're building momentum! Keep your streak alive.";
  }
  if (dreamsThisWeek >= 5) {
    return "Amazing week! Your dream recall is getting stronger.";
  }
  if (dreamsThisWeek === 0 && totalDreams > 0) {
    return "Ready to continue your journey? A new dream awaits.";
  }
  if (totalDreams >= 30) {
    return "You've unlocked deep dream wisdom. The patterns are revealing themselves.";
  }
  if (totalDreams >= 10) {
    return "Your dream journal is growing beautifully. Keep exploring.";
  }
  return "The subconscious speaks in dreams. What will you discover?";
}

function getTimeBasedGreeting(): { greeting: string; subtitle: string } {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return {
      greeting: "Good morning",
      subtitle: "Ready to capture last night's visions?"
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: "Good afternoon",
      subtitle: "Reflect on your dreams and find meaning"
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      greeting: "Good evening",
      subtitle: "The night approaches, prepare for dreams"
    };
  } else {
    return {
      greeting: "Sweet dreams",
      subtitle: "May your dreams reveal hidden truths"
    };
  }
}

const fallbackDailyDreamPrompt =
  "What emotion do you feel most often in your dreams? Explore why.";

interface FeatureCardProps {
  title: string;
  subtitle: string;
  image: string;
  href: string;
  badge?: string;
  testId: string;
}

function FeatureCard({ title, subtitle, image, href, badge, testId }: FeatureCardProps) {
  return (
    <Link
      href={href}
      onClick={() => {
        if (href === "/tarot") {
          markTarotEntrySource("home", "feature_carousel");
        }
      }}
    >
      <div 
        className="carousel-card cursor-pointer group"
        data-testid={testId}
      >
        <img src={image} alt={title} loading="lazy" decoding="async" />
        <div className="carousel-card-overlay" />
        {badge && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 text-[10px] font-accent uppercase tracking-wider bg-primary text-muted-foreground-foreground rounded-full">
              {badge}
            </span>
          </div>
        )}
        <div className="carousel-card-content">
          <h3 className="font-display text-lg text-white leading-tight">{title}</h3>
          <p className="text-white/70 text-xs mt-1">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

type CategoryTab = "featured" | "dreams" | "wellness" | "explore";

function CategoryTabs({ activeTab, onTabChange }: { activeTab: CategoryTab; onTabChange: (tab: CategoryTab) => void }) {
  const tabs: { id: CategoryTab; label: string }[] = [
    { id: "featured", label: "Featured" },
    { id: "dreams", label: "Dreams" },
    { id: "wellness", label: "Wellness" },
    { id: "explore", label: "Explore" },
  ];
  
  return (
    <div className="carousel-scroll py-2" data-testid="tabs-category">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`home-capsule-button whitespace-nowrap no-default-hover-elevate no-default-active-elevate ${
            activeTab === tab.id ? 'home-capsule-button--solid' : 'home-capsule-button--outline'
          }`}
          data-testid={`tab-${tab.id}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface QuickLinkProps {
  icon: DreamGateFunctionSymbolKind;
  label: string;
  href: string;
  testId: string;
}

function QuickLink({ icon, label, href, testId }: QuickLinkProps) {
  return (
    <Link href={href}>
      <div 
        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card/50 hover:bg-card transition-colors cursor-pointer card-hover-lift"
        data-testid={testId}
      >
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <DreamGateFunctionSymbol kind={icon} className="h-8 w-8" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </Link>
  );
}

// Streak Widget Component
function StreakWidget({ currentStreak, longestStreak }: { currentStreak: number; longestStreak: number }) {
  if (currentStreak === 0 && longestStreak === 0) return null;
  
  return (
    <div 
      className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/20"
      data-testid="widget-streak"
    >
      <div className={`flex items-center gap-1.5 ${currentStreak >= 3 ? 'animate-streak-fire' : ''}`}>
        <Flame className="h-5 w-5 text-orange-400" />
        <span className="font-display text-lg text-orange-300">{currentStreak}</span>
      </div>
      <div className="text-xs text-white/80">
        {currentStreak === 1 ? 'day streak' : 'day streak'}
        {longestStreak > currentStreak && (
          <span className="ml-1 text-white/60">Best: {longestStreak}</span>
        )}
      </div>
    </div>
  );
}

// Achievement Progress Component
function AchievementProgress({ totalDreams, longestStreak }: { totalDreams: number; longestStreak: number }) {
  const unlocked = getUnlockedAchievements(totalDreams, longestStreak);
  const next = getNextAchievement(totalDreams, longestStreak);
  
  if (!next && unlocked.length === 0) return null;
  
  const progress = next 
    ? next.type === 'dreams' 
      ? Math.min((totalDreams / next.threshold) * 100, 100)
      : Math.min((longestStreak / next.threshold) * 100, 100)
    : 100;
  
  const current = next?.type === 'dreams' ? totalDreams : longestStreak;
  
  return (
    <div className="space-y-3" data-testid="widget-achievements">
      {/* Unlocked badges */}
      {unlocked.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {unlocked.slice(-3).map((achievement) => {
            const Icon = achievement.icon;
            return (
              <div
                key={achievement.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full achievement-badge text-white text-xs"
                title={achievement.description}
                data-testid={`badge-${achievement.id}`}
              >
                <img
                  src={achievement.symbol}
                  alt=""
                  className="h-5 w-5 object-contain"
                />
                <span>{achievement.name}</span>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Next achievement progress */}
      {next && (
        <div className="max-w-xs mx-auto">
          <div className="flex items-center justify-between text-xs text-white/70 mb-1">
            <span className="flex items-center gap-1">
              <next.icon className="h-3 w-3" />
              Next: {next.name}
            </span>
            <span>{current}/{next.threshold}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full animate-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface HeroSectionProps {
  celestial?: CelestialData;
  isLoading: boolean;
  stats?: DreamStats;
  currentStreak: number;
  longestStreak: number;
}

function HeroSection({ celestial, isLoading, stats, currentStreak, longestStreak }: HeroSectionProps) {
  const { greeting, subtitle } = getTimeBasedGreeting();
  const moonPhase = capitalizeWords(celestial?.moonPhase?.replace(/_/g, ' ') || 'New Moon');
  const totalDreams = stats?.totalDreams || 0;
  const dreamsThisWeek = stats?.dreamsThisWeek || 0;
  
  const motivationalMessage = useMemo(
    () => getMotivationalMessage(totalDreams, currentStreak, dreamsThisWeek),
    [totalDreams, currentStreak, dreamsThisWeek]
  );
  
  return (
    <div className="space-y-4">
      <div className="home-greeting-hero relative overflow-hidden rounded-2xl p-6">
        {greeting === "Good afternoon" ? (
          <img
            className="home-greeting-image"
            src={afternoonBackgroundImage}
            alt=""
            aria-hidden="true"
            decoding="async"
            fetchPriority="high"
          />
        ) : (
          <video
            className="home-greeting-video"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster={mirrorPortalImage}
            aria-hidden="true"
          >
            <source src={greetingVideo} type="video/mp4" />
          </video>
        )}
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/85 flex items-center gap-2">
                <Moon className="h-3 w-3" />
                {isLoading ? "Loading..." : moonPhase}
              </p>
              <h1 
                className="font-display text-3xl md:text-4xl text-white mt-2" 
                data-testid="text-welcome"
              >
                {greeting}
              </h1>
            </div>
            <StreakWidget currentStreak={currentStreak} longestStreak={longestStreak} />
          </div>
          
          <p className="text-white/90 mt-3 text-sm max-w-lg" data-testid="text-motivation">
            {motivationalMessage}
          </p>
          
          <div className="mt-3">
            <AchievementProgress totalDreams={totalDreams} longestStreak={longestStreak} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsRow({ stats, isLoading }: { stats?: DreamStats; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  const statItems = [
    { label: "Total Dreams", value: stats?.totalDreams || 0 },
    { label: "This Week", value: stats?.dreamsThisWeek || 0 },
    { label: "This Month", value: stats?.dreamsThisMonth || 0 },
    { label: "This Year", value: stats?.dreamsThisYear || 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <div 
          key={item.label} 
          className="p-4 rounded-xl bg-card border border-border card-hover-lift transition-all duration-300"
          data-testid={`stat-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <p className="text-3xl font-display text-foreground">{item.value}</p>
          <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

function EmptyDreamsState() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 md:p-12">
      <div className="flex flex-col items-center text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <img
            src={dreamJournalAwaitsIcon}
            alt=""
            className="h-14 w-14 object-contain dark:invert"
          />
        </div>
        
        <h3 className="font-display text-2xl text-foreground mb-3">
          Your dream journal awaits
        </h3>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          What did you see last night? Begin your journey into the realm of dreams and unlock the wisdom of your subconscious.
        </p>
        
        <Link href="/decoder">
          <Button
            size="lg"
            className="home-capsule-button home-capsule-button--solid no-default-hover-elevate no-default-active-elevate"
            data-testid="button-first-dream"
          >
            <DreamGateFunctionSymbol kind="new-entry" className="h-5 w-5 mr-2" />
            Record Your First Dream
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("featured");
  
  const { data: dreams, isLoading: dreamsLoading } = useQuery<Dream[]>({
    queryKey: ["/api/dreams"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DreamStats>({
    queryKey: ["/api/dreams/stats"],
  });

  const { data: celestial, isLoading: celestialLoading } = useQuery<CelestialData>({
    queryKey: ["/api/celestial"],
  });

  const { data: prompt } = useQuery<WritingPrompt>({
    queryKey: ["/api/prompts/daily"],
  });
  const dailyDreamPrompt = prompt?.prompt || fallbackDailyDreamPrompt;

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/dreams/${id}`, { isArchived: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dreams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dreams/stats"] });
    },
  });

  const recentDreams = dreams?.filter(d => !d.isArchived).slice(0, 4) || [];
  const introSeenKey = "dreamgate-intro-seen-v3";
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return sessionStorage.getItem(introSeenKey) !== "true";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!showIntro) return;

    try {
      sessionStorage.setItem(introSeenKey, "true");
    } catch {
      // The intro should still be shown when session storage is unavailable.
    }
  }, [showIntro]);
  
  // Streak tracking - calculated from actual dream dates
  const [streakData, setStreakData] = useState(() => getStreakData());
  
  // Calculate streak when dreams load
  useEffect(() => {
    if (dreams && !dreamsLoading) {
      const calculated = calculateStreakFromDreams(dreams);
      const stored = getStreakData();
      
      // Only update if dream count changed (new dream logged)
      if (dreams.length !== stored.lastProcessedDreamCount) {
        saveStreakData(calculated.currentStreak, calculated.longestStreak, dreams.length);
      }
      
      setStreakData({ 
        currentStreak: calculated.currentStreak, 
        longestStreak: Math.max(calculated.longestStreak, stored.longestStreak),
        lastProcessedDreamCount: dreams.length
      });
    }
  }, [dreams, dreamsLoading]);

  const featuredCards = [
    { title: "Ask Psyra", subtitle: "Jungian dream analysis", image: dreamDecoderImage, href: "/decoder", testId: "card-decoder" },
    { title: "Moon Calendar", subtitle: "Lunar rhythms", image: moonCalendarImage, href: "/lunar-calendar", testId: "card-calendar" },
    { title: "Tarot Reading", subtitle: "Divine guidance", image: tarotReadingImage, href: "/tarot", badge: "New", testId: "card-tarot" },
    { title: "Night Map", subtitle: "Track patterns", image: nightMapImage, href: "/night-map", testId: "card-night-map" },
    { title: "Guided Journey", subtitle: "Guided meditations for lucid dreaming, sleep, and emotional calm", image: restRestoreImage, href: "/meditation", testId: "card-meditation" },
  ];

  const dreamsCards = [
    { title: "Ask Psyra", subtitle: "Jungian dream analysis", image: dreamDecoderImage, href: "/decoder", testId: "card-decoder" },
    { title: "Dream Archive", subtitle: "Your journal", image: dreamArchiveImage, href: "/archive", testId: "card-archive" },
    { title: "Writing Prompts", subtitle: "Get inspired", image: writingPromptsImage, href: "/prompts", testId: "card-prompts" },
  ];

  const wellnessCards = [
    { title: "Tarot Reading", subtitle: "Divine guidance", image: tarotReadingImage, href: "/tarot", badge: "New", testId: "card-tarot-2" },
    { title: "Guided Journey", subtitle: "Guided meditations for lucid dreaming, sleep, and emotional calm", image: restRestoreImage, href: "/meditation", testId: "card-meditation-2" },
  ];

  const exploreCards = [
    { title: "Dream Dictionary", subtitle: "Symbol meanings", image: dreamDictionaryImage, href: "/dictionary", testId: "card-dictionary" },
    { title: "Night Map", subtitle: "Track patterns", image: nightMapImage, href: "/night-map", testId: "card-tracker" },
    { title: "Moon Calendar", subtitle: "Lunar rhythms", image: moonCalendarImage, href: "/lunar-calendar", testId: "card-calendar-2" },
  ];

  const getActiveCards = () => {
    switch (activeCategory) {
      case "dreams": return dreamsCards;
      case "wellness": return wellnessCards;
      case "explore": return exploreCards;
      default: return featuredCards;
    }
  };

  return (
    <div className="home-dashboard min-h-screen bg-background relative overflow-x-hidden">
      {showIntro && (
        <DreamgateIntro
          onComplete={() => setShowIntro(false)}
          onError={() => setShowIntro(false)}
        />
      )}
      <HomeCollage />
      
      <div className="relative z-10 max-w-6xl mx-auto spacing-generous space-y-6 pb-24 animate-fade-in-up">
        <HeroSection 
          celestial={celestial} 
          isLoading={celestialLoading}
          stats={stats}
          currentStreak={streakData.currentStreak}
          longestStreak={streakData.longestStreak}
        />

        <section className="space-y-4">
          <h2 className="font-display text-xl text-foreground" data-testid="text-popular">
            Popular on DreamGate
          </h2>
          <CategoryTabs activeTab={activeCategory} onTabChange={setActiveCategory} />
          <div className="carousel-scroll -mx-4 px-4">
            {getActiveCards().map((card) => (
              <FeatureCard
                key={card.testId}
                title={card.title}
                subtitle={card.subtitle}
                image={card.image}
                href={card.href}
                badge={(card as { badge?: string }).badge}
                testId={card.testId}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4" data-testid="section-todays-dailies">
          <div className="quick-access-heading" data-testid="heading-todays-dailies">
            <h2 className="font-display text-xl text-foreground" data-testid="text-todays-dailies">
              Today's Dailies
            </h2>
            <svg
              className="quick-access-squiggle"
              viewBox="0 0 112 12"
              role="img"
              aria-label=""
            >
              <path d="M2 7.5C10 1 17 11 25 6.5S40 2 48 7s15 5 23 0 15-4 22 0 12 3 17-2" />
            </svg>
          </div>
          <div className="grid gap-4">
            <Link href="/meditation">
              <div 
                className="relative overflow-hidden rounded-2xl bg-card border border-border p-5 hover-elevate cursor-pointer"
                data-testid="daily-meditation"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 border border-border bg-transparent flex items-center justify-center flex-shrink-0">
                      <DreamGateFunctionSymbol kind="home" className="h-7 w-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">Daily Meditation</h3>
                    <p className="text-sm text-muted-foreground">5 min sound healing session</p>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href="/decoder">
              <div
                className="relative overflow-hidden rounded-2xl bg-card border border-border p-5 hover-elevate cursor-pointer"
                data-testid="daily-prompt"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <DreamGateFunctionSymbol kind="prompts" className="h-7 w-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">Daily Dream Prompt</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      "{dailyDreamPrompt}"
                    </p>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link
              href="/tarot"
              onClick={() =>
                markTarotEntrySource("home", "daily_card")
              }
            >
              <div 
                className="relative overflow-hidden rounded-2xl bg-card border border-border p-5 hover-elevate cursor-pointer"
                data-testid="daily-tarot"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center flex-shrink-0">
                    <img
                      src={tarotSymbol}
                      alt=""
                      aria-hidden="true"
                      className="dreamgate-nav-symbol h-7 w-7 object-contain"
                      draggable={false}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">Daily Tarot Card</h3>
                    <p className="text-sm text-muted-foreground">Draw your card for today</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        <StatsRow stats={stats} isLoading={statsLoading} />

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-foreground" data-testid="text-recent-dreams-heading">
              Recent Dreams
            </h2>
            <Link href="/archive">
              <button
                className="home-capsule-button home-capsule-button--outline text-sm no-default-hover-elevate no-default-active-elevate"
                data-testid="link-view-all"
              >
                View All
              </button>
            </Link>
          </div>

          {dreamsLoading ? (
            <div className="carousel-scroll -mx-4 px-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="carousel-card" />
              ))}
            </div>
          ) : recentDreams.length > 0 ? (
            <div className="space-y-3">
              {recentDreams.map((dream) => (
                <DreamCard
                  key={dream.id}
                  dream={dream}
                  onArchive={(id) => archiveMutation.mutate(id)}
                  compact
                />
              ))}
            </div>
          ) : (
            <EmptyDreamsState />
          )}
        </section>

        <section>
          <div className="quick-access-heading mb-4">
            <h2 className="font-display text-xl text-foreground">Quick Access</h2>
            <svg
              className="quick-access-squiggle"
              viewBox="0 0 112 12"
              role="img"
              aria-label=""
            >
              <path d="M2 7.5C10 1 17 11 25 6.5S40 2 48 7s15 5 23 0 15-4 22 0 12 3 17-2" />
            </svg>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <QuickLink icon="decode" label="Decode" href="/decoder" testId="quick-decoder" />
            <QuickLink icon="prompts" label="Prompts" href="/prompts" testId="quick-prompts" />
            <QuickLink icon="archive" label="Archive" href="/archive" testId="quick-archive" />
            <QuickLink icon="calendar" label="Calendar" href="/lunar-calendar" testId="quick-calendar" />
          </div>
        </section>
      </div>
    </div>
  );
}
