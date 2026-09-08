import { cn } from "@/lib/utils";

interface SacredGeometryProps {
  isPlaying?: boolean;
  className?: string;
}

export function SacredGeometry({ isPlaying = false, className }: SacredGeometryProps) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 200 200"
        className={cn(
          "w-64 h-64 md:w-80 md:h-80",
          isPlaying ? "animate-pulse-geometry" : "animate-breathe-geometry"
        )}
        style={{
          filter: "drop-shadow(0 0 8px rgba(242, 240, 237, 0.3))",
        }}
      >
        <defs>
          <linearGradient id="geometryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(242, 240, 237, 0.8)" />
            <stop offset="50%" stopColor="rgba(201, 169, 97, 0.6)" />
            <stop offset="100%" stopColor="rgba(242, 240, 237, 0.8)" />
          </linearGradient>
        </defs>
        
        <g
          fill="none"
          stroke="url(#geometryGradient)"
          strokeWidth="0.5"
          opacity="0.9"
        >
          <circle cx="100" cy="100" r="30" />
          
          <circle cx="100" cy="70" r="30" />
          <circle cx="100" cy="130" r="30" />
          
          <circle cx="74" cy="85" r="30" />
          <circle cx="126" cy="85" r="30" />
          
          <circle cx="74" cy="115" r="30" />
          <circle cx="126" cy="115" r="30" />
          
          <circle cx="100" cy="100" r="60" strokeWidth="0.3" opacity="0.5" />
        </g>
      </svg>
    </div>
  );
}
