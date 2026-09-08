import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DreamGateFunctionSymbol } from "@/components/dreamgate-function-symbol";
import { MoonPhaseVisual } from "@/components/moon-phase-visual";
import { LunarNotificationSettings } from "@/components/lunar-notification-settings";
import { apiRequest } from "@/lib/queryClient";
import { capitalizeFirst, getMoonPhaseName } from "@/lib/utils";
import { celestialDataSchema, type CelestialData } from "@shared/schema";

function formatInstant(value: string, timeZone: string) {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(instant);
}

export default function MoonCalendar() {
  const [now, setNow] = useState(() => new Date());
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  useEffect(() => {
    const updateClock = () => setNow(new Date());
    const interval = window.setInterval(updateClock, 60_000);
    window.addEventListener("focus", updateClock);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", updateClock);
    };
  }, []);

  const {
    data: liveSky,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<CelestialData>({
    queryKey: ["/api/celestial"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/celestial");
        const payload: unknown = await response.json();
        const parsed = celestialDataSchema.safeParse(payload);
        if (!parsed.success) throw new Error("Invalid celestial response");
        return parsed.data;
      } catch (error) {
        console.error("Unable to load current celestial data:", error);
        throw error;
      }
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const localDateTime = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(now);

  return (
    <div className="lunar-calendar-page min-h-[calc(100dvh-4rem)] overflow-x-hidden bg-[#f6f3ec] px-4 py-7 text-[#0e0c06] dark:bg-[#0e0c06] dark:text-[#f6f3ec] md:px-8 md:py-10" data-testid="lunar-calendar-page">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="border-b border-current pb-6">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-current sm:h-14 sm:w-14">
              <DreamGateFunctionSymbol kind="calendar" className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-60">Cosmos / personal rhythm</p>
              <h1 className="mt-1 font-display text-[clamp(2rem,9vw,3.25rem)] leading-[0.92] tracking-tight">Current Sky</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed opacity-70">A small, live reading of the sky above your dream practice.</p>
            </div>
          </div>
        </header>

        <section className="w-full overflow-hidden border border-current p-4 sm:p-5" aria-labelledby="live-sky-title" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-current pb-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-60">Live sky now</p>
              <h2 id="live-sky-title" className="mt-1 font-display text-2xl">The Moon, here</h2>
            </div>
            <p className="pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] opacity-55">Refreshes every minute</p>
          </div>

          {isLoading ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-[5rem_minmax(0,1fr)]">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2"><Skeleton className="h-7 w-40 max-w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>
            </div>
          ) : liveSky ? (
            <div className="mt-5 grid min-w-0 gap-5 sm:grid-cols-[5rem_minmax(0,1fr)] sm:items-center">
              <MoonPhaseVisual phase={liveSky.moonPhase} size="lg" className="h-20 w-20" />
              <div className="min-w-0">
                <p className="font-display text-[clamp(1.6rem,7vw,2.1rem)] leading-none">{getMoonPhaseName(liveSky.moonPhase)}</p>
                <p className="mt-2 text-sm leading-relaxed opacity-75">
                  Moon in <span className="font-semibold">{capitalizeFirst(liveSky.moonSign)}</span> · {Math.round(liveSky.illumination * 100)}% illuminated
                </p>
                <p className="mt-2 break-words text-xs leading-relaxed opacity-60">{localDateTime} · {timeZone}</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="min-w-0 flex-1 text-sm leading-relaxed opacity-70">Current sky is temporarily unavailable.</p>
              <Button type="button" size="sm" variant="outline" className="home-capsule-button home-capsule-button--outline no-default-hover-elevate no-default-active-elevate shrink-0" onClick={() => void refetch()} data-testid="button-retry-current-sky">
                <RefreshCw className="h-3.5 w-3.5" />Try Again
              </Button>
            </div>
          )}

          {liveSky && (
            <div className="mt-5 grid min-w-0 gap-3 border-t border-current pt-4 text-xs leading-relaxed sm:grid-cols-2">
              <p className="min-w-0"><span className="font-semibold">Next new moon</span><br />{formatInstant(liveSky.nextNewMoon, timeZone)}</p>
              <p className="min-w-0 sm:border-l sm:border-current sm:pl-4"><span className="font-semibold">Next full moon</span><br />{formatInstant(liveSky.nextFullMoon, timeZone)}</p>
              <p className="min-w-0 break-words opacity-60 sm:col-span-2">Geocentric tropical position · {liveSky.moonLongitude.toFixed(2)}° lunar longitude{isFetching ? " · updating" : ""}</p>
            </div>
          )}
          {isError && !liveSky && <span className="sr-only">Live sky data could not be loaded.</span>}
        </section>

        <LunarNotificationSettings />
      </div>
    </div>
  );
}

/*
 * Duplicate module content was appended below this point by a stale merge.
 * It is temporarily retained as a comment so the canonical module above is
 * the only implementation compiled by Vite.
 *
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DreamGateFunctionSymbol } from "@/components/dreamgate-function-symbol";
import { MoonPhaseVisual } from "@/components/moon-phase-visual";
import { LunarNotificationSettings } from "@/components/lunar-notification-settings";
import { apiRequest } from "@/lib/queryClient";
import { capitalizeFirst, getMoonPhaseName } from "@/lib/utils";
import { celestialDataSchema, type CelestialData } from "@shared/schema";

function formatInstant(value: string, timeZone: string) {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(instant);
}

export default function MoonCalendar() {
  const [now, setNow] = useState(() => new Date());
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  useEffect(() => {
    const updateClock = () => setNow(new Date());
    const interval = window.setInterval(updateClock, 60_000);
    window.addEventListener("focus", updateClock);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", updateClock);
    };
  }, []);

  const {
    data: liveSky,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<CelestialData>({
    queryKey: ["/api/celestial"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/celestial");
        const payload: unknown = await response.json();
        const parsed = celestialDataSchema.safeParse(payload);
        if (!parsed.success) throw new Error("Invalid celestial response");
        return parsed.data;
      } catch (error) {
        console.error("Unable to load current celestial data:", error);
        throw error;
      }
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const localDateTime = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(now);

  return (
    <div className="lunar-calendar-page min-h-[calc(100dvh-4rem)] overflow-x-hidden bg-[#f6f3ec] px-4 py-7 text-[#0e0c06] dark:bg-[#0e0c06] dark:text-[#f6f3ec] md:px-8 md:py-10" data-testid="lunar-calendar-page">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="border-b border-current pb-6">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-current sm:h-14 sm:w-14">
              <DreamGateFunctionSymbol kind="calendar" className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-60">Cosmos / personal rhythm</p>
              <h1 className="mt-1 font-display text-[clamp(2rem,9vw,3.25rem)] leading-[0.92] tracking-tight">Current Sky</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed opacity-70">A small, live reading of the sky above your dream practice.</p>
            </div>
          </div>
        </header>

        <section className="w-full overflow-hidden border border-current p-4 sm:p-5" aria-labelledby="live-sky-title" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-current pb-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-60">Live sky now</p>
              <h2 id="live-sky-title" className="mt-1 font-display text-2xl">The Moon, here</h2>
            </div>
            <p className="pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] opacity-55">Refreshes every minute</p>
          </div>

          {isLoading ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-[5rem_minmax(0,1fr)]">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2"><Skeleton className="h-7 w-40 max-w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>
            </div>
          ) : liveSky ? (
            <div className="mt-5 grid min-w-0 gap-5 sm:grid-cols-[5rem_minmax(0,1fr)] sm:items-center">
              <MoonPhaseVisual phase={liveSky.moonPhase} size="lg" className="h-20 w-20" />
              <div className="min-w-0">
                <p className="font-display text-[clamp(1.6rem,7vw,2.1rem)] leading-none">{getMoonPhaseName(liveSky.moonPhase)}</p>
                <p className="mt-2 text-sm leading-relaxed opacity-75">
                  Moon in <span className="font-semibold">{capitalizeFirst(liveSky.moonSign)}</span> · {Math.round(liveSky.illumination * 100)}% illuminated
                </p>
                <p className="mt-2 break-words text-xs leading-relaxed opacity-60">{localDateTime} · {timeZone}</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="min-w-0 flex-1 text-sm leading-relaxed opacity-70">Current sky is temporarily unavailable.</p>
              <Button type="button" size="sm" variant="outline" className="home-capsule-button home-capsule-button--outline no-default-hover-elevate no-default-active-elevate shrink-0" onClick={() => void refetch()} data-testid="button-retry-current-sky">
                <RefreshCw className="h-3.5 w-3.5" />Try Again
              </Button>
            </div>
          )}

          {liveSky && (
            <div className="mt-5 grid min-w-0 gap-3 border-t border-current pt-4 text-xs leading-relaxed sm:grid-cols-2">
              <p className="min-w-0"><span className="font-semibold">Next new moon</span><br />{formatInstant(liveSky.nextNewMoon, timeZone)}</p>
              <p className="min-w-0 sm:border-l sm:border-current sm:pl-4"><span className="font-semibold">Next full moon</span><br />{formatInstant(liveSky.nextFullMoon, timeZone)}</p>
              <p className="min-w-0 break-words opacity-60 sm:col-span-2">Geocentric tropical position · {liveSky.moonLongitude.toFixed(2)}° lunar longitude{isFetching ? " · updating" : ""}</p>
            </div>
          )}
          {isError && !liveSky && <span className="sr-only">Live sky data could not be loaded.</span>}
        </section>

        <LunarNotificationSettings />
      </div>
    </div>
  );
}
*/