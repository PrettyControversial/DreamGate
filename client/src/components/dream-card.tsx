import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoonPhaseVisual } from "@/components/moon-phase-visual";
import { formatShortDate, formatTime, truncateText, getMoonPhaseName } from "@/lib/utils";
import { type Dream } from "@shared/schema";
import { Sparkles, Pencil, Clock } from "lucide-react";
import { DreamGateFunctionSymbol } from "@/components/dreamgate-function-symbol";

interface DreamCardProps {
  dream: Dream;
  onArchive?: (id: string) => void;
  compact?: boolean;
}

export function DreamCard({ dream, onArchive, compact = false }: DreamCardProps) {
  return (
    <Card className="group hover-elevate overflow-visible" data-testid={`card-dream-${dream.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-semibold tracking-tight truncate text-foreground" data-testid={`text-dream-title-${dream.id}`}>
            {dream.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{formatShortDate(dream.date)}</span>
            <span className="text-muted-foreground/50">at</span>
            <span>{formatTime(dream.date)}</span>
          </div>
        </div>
        {dream.moonPhase && (
          <div className="flex flex-col items-center gap-1">
            <MoonPhaseVisual phase={dream.moonPhase} size="sm" />
            <span className="text-xs text-muted-foreground">
              {getMoonPhaseName(dream.moonPhase)}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {truncateText(dream.content, compact ? 100 : 200)}
        </p>

        {dream.emotions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {dream.emotions.slice(0, 4).map((emotion) => (
              <Badge key={emotion} variant="secondary" className="text-xs capitalize bg-secondary/10 text-secondary">
                {emotion}
              </Badge>
            ))}
            {dream.emotions.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{dream.emotions.length - 4}
              </Badge>
            )}
          </div>
        )}

        {dream.themes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {dream.themes.slice(0, 3).map((theme) => (
              <Badge key={theme} variant="outline" className="text-xs capitalize border-border text-muted-foreground">
                {theme}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between gap-2 pt-2 border-t border-border/50">
        <Link href={`/decoder/${dream.id}`}>
          <Button variant="ghost" size="sm" data-testid={`button-decode-${dream.id}`}>
            <Sparkles className="h-4 w-4 mr-1.5" />
            Decode
          </Button>
        </Link>
        
        <div className="flex gap-1">
          <Link href={`/decoder/${dream.id}`}>
            <Button variant="ghost" size="icon" data-testid={`button-edit-${dream.id}`}>
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          {onArchive && !dream.isArchived && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onArchive(dream.id)}
              data-testid={`button-archive-${dream.id}`}
            >
              <DreamGateFunctionSymbol kind="archive" className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
