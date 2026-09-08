import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  trend = "neutral",
  className 
}: StatsCardProps) {
  const testId = `stats-card-${title.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <Card className={cn("hover-elevate overflow-visible bg-card border-border", className)} data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">
              {title}
            </p>
            <p className="text-2xl font-display font-bold mt-1 text-foreground" data-testid={`${testId}-value`}>
              {value}
            </p>
            {subtitle && (
              <p className={cn(
                "text-xs mt-1",
                trend === "up" && "text-chart-2",
                trend === "down" && "text-destructive",
                trend === "neutral" && "text-muted-foreground"
              )}>
                {subtitle}
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
