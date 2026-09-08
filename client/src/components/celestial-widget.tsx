import { Card, CardContent } from "@/components/ui/card";
import { MoonPhaseVisual } from "@/components/moon-phase-visual";
import { ZodiacBadge } from "@/components/zodiac-badge";
import { getMoonPhaseName } from "@/lib/utils";
import { type CelestialData } from "@shared/schema";
import { Sun, Moon } from "lucide-react";

interface CelestialWidgetProps {
  data: CelestialData | undefined;
  isLoading?: boolean;
}

export function CelestialWidget({ data, isLoading }: CelestialWidgetProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-muted" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="overflow-hidden" data-testid="celestial-widget">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <MoonPhaseVisual phase={data.moonPhase} size="lg" />
          
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-display text-xl font-semibold" data-testid="text-moon-phase">
              {getMoonPhaseName(data.moonPhase)}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {Math.round(data.illumination * 100)}% illumination
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
              <div className="flex items-center gap-1.5">
                <Moon className="h-4 w-4 text-secondary" />
                <ZodiacBadge sign={data.moonSign} type="moon" />
              </div>
              <div className="flex items-center gap-1.5">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <ZodiacBadge sign={data.sunSign} type="sun" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
