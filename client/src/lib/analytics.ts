type AnalyticsData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track(name: string, data?: AnalyticsData): void;
    };
  }
}

const DISCOVER_TOOL_STORAGE_KEY = "dreamgate_analytics_discover_tool";
const TAROT_ENTRY_STORAGE_KEY = "dreamgate_analytics_tarot_entry";
const ATTRIBUTION_TTL_MS = 30 * 60 * 1000;

export function trackEvent(name: string, data?: AnalyticsData): void {
  if (typeof window === "undefined") return;

  try {
    window.umami?.track(name, data);
  } catch {
    // Analytics must never interrupt a user's DreamGate experience.
  }
}

export function trackDreamSaved(
  source: string,
  firstDream?: boolean,
): void {
  trackEvent("dream_saved", {
    source,
    ...(typeof firstDream === "boolean" ? { first_dream: firstDream } : {}),
  });
}

export function markDiscoverToolSelected(toolId: string): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(
      DISCOVER_TOOL_STORAGE_KEY,
      JSON.stringify({ toolId, selectedAt: Date.now() }),
    );
  } catch {
    // Selection analytics still works when session storage is unavailable.
  }
}

export function trackDiscoverToolCompleted(
  acceptedToolIds: string[],
  action: string,
): void {
  if (typeof window === "undefined") return;

  try {
    const stored = sessionStorage.getItem(DISCOVER_TOOL_STORAGE_KEY);
    if (!stored) return;

    const value = JSON.parse(stored) as {
      toolId?: unknown;
      selectedAt?: unknown;
    };
    if (
      typeof value.toolId !== "string" ||
      typeof value.selectedAt !== "number" ||
      Date.now() - value.selectedAt > ATTRIBUTION_TTL_MS
    ) {
      sessionStorage.removeItem(DISCOVER_TOOL_STORAGE_KEY);
      return;
    }
    if (!acceptedToolIds.includes(value.toolId)) return;

    trackEvent("discover_tool_completed", {
      tool_id: value.toolId,
      action,
    });
    sessionStorage.removeItem(DISCOVER_TOOL_STORAGE_KEY);
  } catch {
    // Completion events must never interrupt the feature being measured.
  }
}

export function markTarotEntrySource(
  source: "home" | "discover",
  placement: string,
): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(
      TAROT_ENTRY_STORAGE_KEY,
      JSON.stringify({ source, placement, selectedAt: Date.now() }),
    );
  } catch {
    // The Tarot page can still record a direct open without this context.
  }
}

export function consumeTarotEntrySource(): {
  source: string;
  placement: string;
} {
  if (typeof window === "undefined") {
    return { source: "direct", placement: "route" };
  }

  try {
    const stored = sessionStorage.getItem(TAROT_ENTRY_STORAGE_KEY);
    sessionStorage.removeItem(TAROT_ENTRY_STORAGE_KEY);
    if (!stored) return { source: "direct", placement: "route" };

    const value = JSON.parse(stored) as {
      source?: unknown;
      placement?: unknown;
      selectedAt?: unknown;
    };
    if (
      (value.source === "home" || value.source === "discover") &&
      typeof value.placement === "string" &&
      typeof value.selectedAt === "number" &&
      Date.now() - value.selectedAt <= ATTRIBUTION_TTL_MS
    ) {
      return { source: value.source, placement: value.placement };
    }
  } catch {
    // Invalid or unavailable storage falls back to a direct route open.
  }

  return { source: "direct", placement: "route" };
}