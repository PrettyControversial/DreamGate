import { Badge } from "@/components/ui/badge";
import { cn, capitalizeFirst } from "@/lib/utils";

interface ZodiacBadgeProps {
  sign: string;
  type: "moon" | "sun";
  className?: string;
}

const zodiacSymbols: Record<string, string> = {
  aries: "♈",
  taurus: "♉",
  gemini: "♊",
  cancer: "♋",
  leo: "♌",
  virgo: "♍",
  libra: "♎",
  scorpio: "♏",
  sagittarius: "♐",
  capricorn: "♑",
  aquarius: "♒",
  pisces: "♓"
};

export function ZodiacBadge({ sign, type, className }: ZodiacBadgeProps) {
  const symbol = zodiacSymbols[sign] || "✨";
  
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-accent text-sm gap-1.5 px-3 py-1",
        type === "sun" 
          ? "border-primary/50 text-muted-foreground" 
          : "border-secondary/50 text-secondary",
        className
      )}
      data-testid={`badge-${type}-sign`}
    >
      <span className="text-base">{symbol}</span>
      <span>{capitalizeFirst(sign)}</span>
    </Badge>
  );
}
