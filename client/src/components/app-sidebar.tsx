import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Gift,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { DreamGateLogo } from "@/components/dreamgate-logo";
import {
  DreamGateFunctionSymbol,
  type DreamGateFunctionSymbolKind,
} from "@/components/dreamgate-function-symbol";

function isWrappedSeasonActive(): boolean {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return month === 12 && day >= 25 && day <= 31;
}

type SidebarItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  symbol?: DreamGateFunctionSymbolKind;
};

const menuItems: SidebarItem[] = [
  {
    title: "Dashboard",
    url: "/user-portal",
    symbol: "home",
  },
  {
    title: "Ask Psyra",
    url: "/decoder",
    symbol: "psyra",
  },
  {
    title: "Prompts",
    url: "/prompts",
    symbol: "prompts",
  },
  {
    title: "Archive",
    url: "/archive",
    symbol: "archive",
  },
];

const trackerItems: SidebarItem[] = [
  {
    title: "Night Map",
    url: "/night-map",
    symbol: "night-map",
  },
  {
    title: "Moon Calendar",
    url: "/lunar-calendar",
    symbol: "calendar",
  },
  {
    title: "Dream Dictionary",
    url: "/dictionary",
    symbol: "dictionary",
  },
  {
    title: "Rest & Restore",
    url: "/meditation",
    symbol: "sound-healing",
  },
  {
    title: "Tarot",
    url: "/tarot",
    icon: Layers,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const [wrappedOpen, setWrappedOpen] = useState(false);
  const showWrapped = isWrappedSeasonActive();

  const renderItemIcon = (item: SidebarItem) => {
    if (item.symbol) {
      return <DreamGateFunctionSymbol kind={item.symbol} className="h-4 w-4" />;
    }
    if (item.icon) {
      const Icon = item.icon;
      return <Icon className="h-4 w-4" />;
    }
    return null;
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/user-portal" className="flex items-center gap-3">
            <DreamGateLogo className="h-10 w-10 rounded-lg" />
            <div className="flex flex-col">
              <span className="dreamgate-wordmark text-lg">
                DreamGate
              </span>
              <span className="text-xs text-muted-foreground">
                Your dream journal
              </span>
            </div>
          </Link>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-4">
              Journal
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                    >
                      <Link href={item.url}>
                        {renderItemIcon(item)}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-4">
              Insights
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {trackerItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                    >
                      <Link href={item.url}>
                        {renderItemIcon(item)}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {showWrapped && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setWrappedOpen(true)}
                      className="bg-gradient-to-r from-secondary/10 to-primary/10 hover:from-secondary/20 hover:to-primary/20"
                      data-testid="nav-wrapped"
                    >
                      <Gift className="h-4 w-4 text-secondary" />
                      <span className="font-medium">Your Dream Wrapped</span>
                      <Sparkles className="h-3 w-3 text-muted-foreground ml-auto" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <div className="text-xs text-muted-foreground text-center">
            Track your dreams, decode your mind
          </div>
        </SidebarFooter>
      </Sidebar>

      <WrappedDialog open={wrappedOpen} onOpenChange={setWrappedOpen} />
    </>
  );
}

function WrappedDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Gift className="h-6 w-6 text-secondary" />
            Your Dream Wrapped {new Date().getFullYear()}
          </DialogTitle>
        </DialogHeader>
        <WrappedContent />
      </DialogContent>
    </Dialog>
  );
}

function WrappedContent() {
  const { data: stats, isLoading } = useQuery<{
    totalDreams: number;
    topEmotions: { emotion: string; count: number }[];
    topThemes: { theme: string; count: number }[];
    topSymbols: { symbol: string; count: number }[];
    dreamsByMonth: { month: string; count: number }[];
  }>({
    queryKey: ["/api/dreams/stats"],
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading your dream journey...</div>;
  }

  if (!stats || stats.totalDreams === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You haven't logged any dreams this year.</p>
        <p className="text-sm text-muted-foreground mt-2">Start journaling to see your Wrapped next year!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center p-6 rounded-xl bg-gradient-to-br from-secondary/10 to-primary/10">
        <p className="text-5xl font-display font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
          {stats.totalDreams}
        </p>
        <p className="text-muted-foreground mt-2">dreams recorded this year</p>
      </div>

      {stats.topEmotions.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Your Top Emotions</h3>
          <div className="flex flex-wrap gap-2">
            {stats.topEmotions.slice(0, 5).map((e, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm">
                {e.emotion} ({e.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {stats.topThemes.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Recurring Themes</h3>
          <div className="flex flex-wrap gap-2">
            {stats.topThemes.slice(0, 5).map((t, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-primary/10 text-muted-foreground text-sm">
                {t.theme} ({t.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {stats.topSymbols.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Dream Symbols</h3>
          <div className="flex flex-wrap gap-2">
            {stats.topSymbols.slice(0, 5).map((s, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-primary/15 text-muted-foreground text-sm">
                {s.symbol} ({s.count})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="text-center pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Keep dreaming and journaling in {new Date().getFullYear() + 1}!
        </p>
      </div>
    </div>
  );
}
