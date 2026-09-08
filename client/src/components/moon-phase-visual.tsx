import { cn } from "@/lib/utils";

interface MoonPhaseVisualProps {
  phase: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function MoonPhaseVisual({ phase, size = "md", className }: MoonPhaseVisualProps) {
  const sizeClasses = {
    xs: "w-5 h-5",
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32"
  };

  const phaseStyles: Record<string, { lit: string; path?: string; full?: boolean }> = {
    new_moon: { lit: "0%" },
    waxing_crescent: { lit: "25%", path: "M50 0A50 50 0 0 1 50 100A34 50 0 0 0 50 0Z" },
    first_quarter: { lit: "50%", path: "M50 0A50 50 0 0 1 50 100Z" },
    waxing_gibbous: { lit: "75%", path: "M50 0A50 50 0 0 1 50 100A24 50 0 0 1 50 0Z" },
    full_moon: { lit: "100%", full: true },
    waning_gibbous: { lit: "75%", path: "M50 0A50 50 0 0 0 50 100A24 50 0 0 0 50 0Z" },
    last_quarter: { lit: "50%", path: "M50 0A50 50 0 0 0 50 100Z" },
    waning_crescent: { lit: "25%", path: "M50 0A50 50 0 0 0 50 100A34 50 0 0 1 50 0Z" },
  };
  const values = phaseStyles[phase] ?? phaseStyles.new_moon;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border border-current/40",
        sizeClasses[size],
        className
      )}
      data-testid={`moon-visual-${phase}`}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true" className="h-full w-full">
        <circle cx="50" cy="50" r="50" fill="#171613" />
        {values.full && <circle cx="50" cy="50" r="50" fill="#eee5cf" />}
        {values.path && <path d={values.path} fill="#eee5cf" />}
      </svg>
      <span className="sr-only">{phase.replace(/_/g, " ")}, {values.lit} illuminated</span>
    </div>
  );
}
