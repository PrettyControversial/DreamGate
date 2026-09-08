import { Card, CardContent } from "@/components/ui/card";
import { ZodiacBadge } from "@/components/zodiac-badge";
import { getMoonPhaseName } from "@/lib/utils";
import { type CelestialData } from "@shared/schema";
import { Sun, Moon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroMoonWidgetProps {
  data: CelestialData | undefined;
  isLoading?: boolean;
}

function HeroMoonVisual({ phase }: { phase: string }) {
  const getMoonGradient = (phase: string) => {
    switch (phase) {
      case "new_moon":
        return "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900";
      case "waxing_crescent":
        return "bg-gradient-to-l from-amber-100 via-slate-700 to-slate-900";
      case "first_quarter":
        return "bg-gradient-to-l from-amber-100 via-amber-50 to-slate-700";
      case "waxing_gibbous":
        return "bg-gradient-to-l from-amber-100 via-amber-50 to-slate-600";
      case "full_moon":
        return "bg-gradient-to-br from-amber-50 via-amber-100 to-amber-50";
      case "waning_gibbous":
        return "bg-gradient-to-r from-amber-100 via-amber-50 to-slate-600";
      case "last_quarter":
        return "bg-gradient-to-r from-amber-100 via-amber-50 to-slate-700";
      case "waning_crescent":
        return "bg-gradient-to-r from-amber-100 via-slate-700 to-slate-900";
      default:
        return "bg-gradient-to-br from-amber-100 to-amber-200";
    }
  };

  const getGlowIntensity = (phase: string) => {
    switch (phase) {
      case "full_moon":
        return "0 0 60px rgba(251, 191, 36, 0.5), 0 0 120px rgba(251, 191, 36, 0.3), 0 0 180px rgba(251, 191, 36, 0.1)";
      case "waxing_gibbous":
      case "waning_gibbous":
        return "0 0 40px rgba(251, 191, 36, 0.4), 0 0 80px rgba(251, 191, 36, 0.2)";
      case "first_quarter":
      case "last_quarter":
        return "0 0 30px rgba(251, 191, 36, 0.3), 0 0 60px rgba(251, 191, 36, 0.15)";
      case "waxing_crescent":
      case "waning_crescent":
        return "0 0 20px rgba(251, 191, 36, 0.2), 0 0 40px rgba(139, 92, 246, 0.1)";
      case "new_moon":
        return "0 0 30px rgba(139, 92, 246, 0.3), 0 0 60px rgba(139, 92, 246, 0.1)";
      default:
        return "0 0 30px rgba(251, 191, 36, 0.3)";
    }
  };

  return (
    <div className="relative">
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-50"
        style={{
          background: phase === "full_moon" 
            ? "radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)",
          transform: "scale(1.5)",
        }}
      />
      <div
        className={cn(
          "w-32 h-32 md:w-40 md:h-40 rounded-full relative z-10 transition-all duration-500",
          getMoonGradient(phase)
        )}
        style={{
          boxShadow: getGlowIntensity(phase),
        }}
        data-testid={`hero-moon-visual-${phase}`}
      />
    </div>
  );
}

export function HeroMoonWidget({ data, isLoading }: HeroMoonWidgetProps) {
  if (isLoading) {
    return (
      <div className="relative p-1 rounded-2xl bg-gradient-to-br from-secondary/30 via-secondary/20 to-primary/30">
        <Card className="border-0 rounded-2xl overflow-visible">
          <CardContent className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-center gap-8 animate-pulse">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-muted/20" />
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="h-8 w-48 bg-muted/20 rounded mx-auto md:mx-0" />
                <div className="h-4 w-32 bg-muted/20 rounded mx-auto md:mx-0" />
                <div className="flex gap-4 justify-center md:justify-start">
                  <div className="h-10 w-28 bg-muted/20 rounded-full" />
                  <div className="h-10 w-28 bg-muted/20 rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div 
      className="relative p-[2px] rounded-2xl overflow-visible"
      style={{
        background: "linear-gradient(135deg, hsl(var(--secondary) / 0.5) 0%, hsl(var(--secondary) / 0.3) 50%, hsl(var(--primary) / 0.4) 100%)",
      }}
      data-testid="hero-moon-widget"
    >
      <Card className="bg-card border-0 rounded-2xl overflow-visible">
        <CardContent className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <HeroMoonVisual phase={data.moonPhase} />
            
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-sm font-accent text-primary/80 uppercase tracking-wider">
                    Tonight's Moon
                  </span>
                </div>
                <h2 
                  className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight"
                  data-testid="text-moon-phase-name"
                >
                  {getMoonPhaseName(data.moonPhase)}
                </h2>
                <p className="text-lg text-muted-foreground mt-1 font-accent">
                  {Math.round(data.illumination * 100)}% illumination
                </p>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-secondary/20">
                  <Moon className="h-5 w-5 text-secondary" />
                  <span className="text-sm text-foreground">Moon in</span>
                  <ZodiacBadge sign={data.moonSign} type="moon" />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-primary/20">
                  <Sun className="h-5 w-5 text-primary" />
                  <span className="text-sm text-foreground">Sun in</span>
                  <ZodiacBadge sign={data.sunSign} type="sun" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
