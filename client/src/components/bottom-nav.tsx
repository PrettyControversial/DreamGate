import { useLocation, Link } from "wouter";
import { Compass, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import homeSymbol from "@assets/dreamgate_symbols/quick-access/home.webp";
import dreamSymbol from "@assets/dreamgate_symbols/footer/38.webp";
import tarotSymbol from "@assets/dreamgate_symbols/footer/54.webp";
import statsSymbol from "@assets/dreamgate_symbols/footer/139.webp";
import discoverSymbol from "@assets/dreamgate_symbols/footer/discover.webp";

type NavItem = {
  path: string;
  label: string;
  symbol?: string;
  icon?: LucideIcon;
};

const navItems: NavItem[] = [
  { path: "/user-portal", symbol: homeSymbol, label: "Home" },
  { path: "/dream", symbol: dreamSymbol, label: "Dream" },
  { path: "/tarot", symbol: tarotSymbol, label: "Tarot" },
  { path: "/stats", symbol: statsSymbol, label: "Stats" },
  { path: "/discover", symbol: discoverSymbol, label: "Discover" },
];

export function BottomNav() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/user-portal") return location === "/user-portal";
    return location.startsWith(path);
  };

  return (
    <nav 
      className={cn(
        "dreamgate-night-footer fixed inset-x-0 bottom-0 z-40 w-full shrink-0 border-t",
        (location === "/dream" || location.startsWith("/dream/") || location.startsWith("/decoder")) &&
          "dream-decoder-bottom-nav"
      )}
      aria-label="Primary navigation"
      data-testid="nav-bottom"
    >
      <div className="flex items-center justify-around h-full max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all duration-200",
                  active 
                    ? "text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                {item.symbol ? (
                  <img
                    src={item.symbol}
                    alt=""
                    className={cn(
                      "dreamgate-nav-symbol h-6 w-6 object-contain transition-transform duration-200",
                      active && "scale-110"
                    )}
                    draggable={false}
                  />
                ) : Icon ? (
                  <Icon className={cn(
                    "h-6 w-6 transition-transform duration-200",
                    active && "scale-110"
                  )} />
                ) : null}
                <span className={cn(
                  "text-xs font-accent tracking-wide",
                  active ? "font-semibold" : "font-normal"
                )}>
                  {item.label}
                </span>
                {active && (
                  <span className="absolute -bottom-1 left-1/2 h-px w-8 -translate-x-1/2 bg-primary" />
                )}
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
