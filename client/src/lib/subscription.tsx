import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "@clerk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  isPremiumEntitlement,
  PAYWALL_ENABLED,
  SUBSCRIPTION_CONFIG,
  type SubscriptionEntitlement,
  type SubscriptionFeature,
  type SubscriptionPlanId,
} from "@shared/subscription";
import { DAILY_LIMITS, type InterpretationAllowance } from "@shared/daily-limits";

export const isDevelopmentBuild = import.meta.env.DEV;

const DEV_SUBSCRIPTION_STORAGE_KEY = "dreamgate-development-subscription";
const FREE_USAGE_STORAGE_KEY = "dreamgate-free-usage";
const PAYWALL_DISABLED_FEATURES: SubscriptionFeature[] = [
  "fullJungianAnalysis",
  "archetypeReveals",
  "yourPsyche",
  "longitudinalPatterns",
  "archetypeHistory",
  "monthlyPsycheInsights",
  "fullMeditationLibrary",
];

interface FreeUsageState {
  atlasLocations: string[];
  tarotPullCount: number;
  meditationSessions: string[];
}

function emptyFreeUsage(): FreeUsageState {
  return {
    atlasLocations: [],
    tarotPullCount: 0,
    meditationSessions: [],
  };
}

export interface PaywallRequest {
  feature?: SubscriptionFeature;
  eyebrow?: string;
  title?: string;
  description?: string;
}

interface DevelopmentSubscriptionState {
  entitlement: SubscriptionEntitlement;
  selectedPlan: SubscriptionPlanId;
  trialEligible: boolean;
}

interface SubscriptionContextValue extends DevelopmentSubscriptionState {
  isDevelopmentBuild: boolean;
  provider: "development-mock" | "storekit" | "demo-account";
  isDemo: boolean;
  isPremium: boolean;
  hasPremiumEntitlement: boolean;
  interpretationsRemaining: number;
  interpretationAllowanceExempt: boolean;
  freeAtlasLocationsRemaining: number;
  freeTarotPullsRemaining: number;
  freeMeditationSessionsRemaining: number;
  canAccess: (feature: SubscriptionFeature) => boolean;
  canAccessAtlasLocation: (locationName: string) => boolean;
  canAccessMeditationSession: (sessionId: string) => boolean;
  recordAtlasLocation: (locationName: string) => void;
  recordMeditationSession: (sessionId: string) => void;
  refreshInterpretationAllowance: () => void;
  recordTarotPull: () => void;
  setSelectedPlan: (plan: SubscriptionPlanId) => void;
  setDevelopmentEntitlement: (entitlement: SubscriptionEntitlement) => void;
  setDevelopmentTrialEligibility: (eligible: boolean) => void;
  purchaseSelectedPlan: () => Promise<{ success: boolean; reason?: string }>;
  restorePurchases: () => Promise<{ success: boolean; reason?: string }>;
  paywallRequest: PaywallRequest | null;
  openPaywall: (request?: PaywallRequest) => void;
  closePaywall: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function loadDevelopmentState(): DevelopmentSubscriptionState {
  if (!isDevelopmentBuild) {
    return {
      entitlement: "FREE",
      selectedPlan: "annual",
      trialEligible: false,
    };
  }

  try {
    const stored = localStorage.getItem(DEV_SUBSCRIPTION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<DevelopmentSubscriptionState>;
      return {
        entitlement:
          parsed.entitlement === "PSYRA_PLUS" ||
          parsed.entitlement === "DEVELOPMENT_PREMIUM"
            ? parsed.entitlement
            : "FREE",
        selectedPlan: parsed.selectedPlan === "monthly" ? "monthly" : "annual",
        trialEligible: parsed.trialEligible !== false,
      };
    }
  } catch {
    // Development controls should fall back to a free state if storage is unavailable.
  }

  return {
    entitlement: "FREE",
    selectedPlan: "annual",
    trialEligible: true,
  };
}

function usageStorageKey(userScope: string) {
  return `${FREE_USAGE_STORAGE_KEY}:${userScope}`;
}

function loadFreeUsage(userScope: string): FreeUsageState {
  try {
    const stored = localStorage.getItem(usageStorageKey(userScope));
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<FreeUsageState>;
      return {
        atlasLocations: Array.isArray(parsed.atlasLocations)
          ? parsed.atlasLocations.filter(
              (location): location is string => typeof location === "string",
            )
          : [],
        tarotPullCount:
          typeof parsed.tarotPullCount === "number"
            ? Math.max(0, parsed.tarotPullCount)
            : 0,
        meditationSessions: Array.isArray(parsed.meditationSessions)
          ? parsed.meditationSessions.filter(
              (session): session is string => typeof session === "string",
            )
          : [],
      };
    }

  } catch {
    return emptyFreeUsage();
  }
  return emptyFreeUsage();
}

function saveDevelopmentState(state: DevelopmentSubscriptionState) {
  if (!isDevelopmentBuild) return;
  try {
    localStorage.setItem(DEV_SUBSCRIPTION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The in-memory state remains usable when browser storage is blocked.
  }
}

function saveFreeUsage(userScope: string, usage: FreeUsageState) {
  try {
    localStorage.setItem(
      usageStorageKey(userScope),
      JSON.stringify(usage),
    );
  } catch {
    // The in-memory state remains usable when browser storage is blocked.
  }
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const userScope = user?.id ?? "guest";
  const queryClient = useQueryClient();
  const { data: interpretationStatus } = useQuery<InterpretationAllowance>({
    queryKey: ["/api/account/interpretation-allowance", userScope],
    queryFn: async () =>
      (await apiRequest("GET", "/api/account/interpretation-allowance")).json(),
    enabled: Boolean(user),
    staleTime: 0,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const refreshInterpretationAllowance = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ["/api/account/interpretation-allowance", userScope],
    });
  }, [queryClient, userScope]);
  useEffect(() => {
    if (!interpretationStatus) return;
    const delay = Math.max(0, Date.parse(interpretationStatus.resetsAt) - Date.now()) + 100;
    const timer = window.setTimeout(refreshInterpretationAllowance, Math.min(delay, 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [interpretationStatus?.resetsAt, refreshInterpretationAllowance]);
  const [developmentState, setDevelopmentState] = useState(loadDevelopmentState);
  const [freeUsage, setFreeUsage] = useState(() => loadFreeUsage(userScope));
  const [paywallRequest, setPaywallRequest] =
    useState<PaywallRequest | null>(null);
  const { data: demoAccess } = useQuery<{ isDemo: boolean }>({
    queryKey: ["/api/account/demo-access", userScope],
    queryFn: async () => (await apiRequest("GET", "/api/account/demo-access")).json(),
    enabled: Boolean(user),
    staleTime: 30000,
    retry: false,
  });
  const isDemo = Boolean(user && demoAccess?.isDemo);
  const entitlement: SubscriptionEntitlement = isDemo ? "PSYRA_PLUS" : developmentState.entitlement;
  const hasPremiumEntitlement = isPremiumEntitlement(entitlement);
  useEffect(refreshInterpretationAllowance, [developmentState.entitlement, refreshInterpretationAllowance]);

  useEffect(() => {
    if (isDemo) setPaywallRequest(null);
  }, [isDemo]);

  useEffect(() => {
    setFreeUsage(loadFreeUsage(userScope));
  }, [userScope]);


  const updateFreeUsage = useCallback(
    (update: (current: FreeUsageState) => FreeUsageState) => {
      setFreeUsage((current) => {
        const next = update(current);
        saveFreeUsage(userScope, next);
        return next;
      });
    },
    [userScope],
  );

  const updateDevelopmentState = useCallback(
    (update: Partial<DevelopmentSubscriptionState>) => {
      if (!isDevelopmentBuild) return;
      setDevelopmentState((current) => {
        const next = { ...current, ...update };
        saveDevelopmentState(next);
        return next;
      });
    },
    [],
  );

  const recordTarotPull = useCallback(() => {
    if (isPremiumEntitlement(entitlement)) {
      return;
    }
    updateFreeUsage((current) => ({
      ...current,
      tarotPullCount: current.tarotPullCount + 1,
    }));
  }, [entitlement, updateFreeUsage]);

  const recordAtlasLocation = useCallback(
    (locationName: string) => {
      if (isPremiumEntitlement(entitlement)) {
        return;
      }
      updateFreeUsage((current) =>
        current.atlasLocations.includes(locationName) ||
        current.atlasLocations.length >= SUBSCRIPTION_CONFIG.freeAtlasLocationLimit
          ? current
          : {
              ...current,
              atlasLocations: [...current.atlasLocations, locationName],
            },
      );
    },
    [entitlement, updateFreeUsage],
  );

  const recordMeditationSession = useCallback(
    (sessionId: string) => {
      if (isPremiumEntitlement(entitlement)) {
        return;
      }
      updateFreeUsage((current) =>
        current.meditationSessions.includes(sessionId) ||
        current.meditationSessions.length >=
          SUBSCRIPTION_CONFIG.freeMeditationSessionLimit
          ? current
          : {
              ...current,
              meditationSessions: [...current.meditationSessions, sessionId],
            },
      );
    },
    [entitlement, updateFreeUsage],
  );

  const canAccess = useCallback(
    (feature: SubscriptionFeature) => {
      if (feature === "askPsyraInterpretation") {
        return (
          !interpretationStatus ||
          interpretationStatus.exempt ||
          (interpretationStatus.remaining ?? 0) > 0 ||
          Date.now() >= Date.parse(interpretationStatus.resetsAt)
        );
      }
      if (hasPremiumEntitlement) return true;
      if (!PAYWALL_ENABLED && PAYWALL_DISABLED_FEATURES.includes(feature)) {
        return true;
      }
      if (feature === "premiumTarot") {
        return freeUsage.tarotPullCount < SUBSCRIPTION_CONFIG.freeTarotPullLimit;
      }
      if (feature === "dreamAtlasLocations") {
        return (
          freeUsage.atlasLocations.length <
          SUBSCRIPTION_CONFIG.freeAtlasLocationLimit
        );
      }
      if (feature === "fullMeditationLibrary") {
        return (
          freeUsage.meditationSessions.length <
          SUBSCRIPTION_CONFIG.freeMeditationSessionLimit
        );
      }
      return false;
    },
    [hasPremiumEntitlement, freeUsage, interpretationStatus],
  );

  const canAccessAtlasLocation = useCallback(
    (locationName: string) =>
      hasPremiumEntitlement ||
      freeUsage.atlasLocations.includes(locationName) ||
      freeUsage.atlasLocations.length <
        SUBSCRIPTION_CONFIG.freeAtlasLocationLimit,
    [hasPremiumEntitlement, freeUsage],
  );

  const canAccessMeditationSession = useCallback(
    (sessionId: string) =>
      !PAYWALL_ENABLED ||
      hasPremiumEntitlement ||
      freeUsage.meditationSessions.includes(sessionId) ||
      freeUsage.meditationSessions.length <
        SUBSCRIPTION_CONFIG.freeMeditationSessionLimit,
    [hasPremiumEntitlement, freeUsage],
  );

  const purchaseSelectedPlan = useCallback(async () => {
    if (!isDevelopmentBuild) {
      return {
        success: false,
        reason: "StoreKit is not connected in this environment.",
      };
    }

    updateDevelopmentState({ entitlement: "DEVELOPMENT_PREMIUM" });
    return { success: true };
  }, [updateDevelopmentState]);

  const restorePurchases = useCallback(async () => {
    if (!isDevelopmentBuild) {
      return {
        success: false,
        reason: "StoreKit restore is not connected in this environment.",
      };
    }

    return {
      success: isPremiumEntitlement(developmentState.entitlement),
      reason: isPremiumEntitlement(developmentState.entitlement)
        ? undefined
        : "No development purchase is available to restore.",
    };
  }, [developmentState.entitlement]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      ...developmentState,
      entitlement,
      isDemo,
      isDevelopmentBuild,
      provider: isDemo ? "demo-account" : isDevelopmentBuild ? "development-mock" : "storekit",
      isPremium: hasPremiumEntitlement,
      hasPremiumEntitlement,
       interpretationsRemaining: interpretationStatus?.remaining ?? DAILY_LIMITS.interpretations,
       interpretationAllowanceExempt: interpretationStatus?.exempt ?? false,
       freeAtlasLocationsRemaining: Math.max(
         0,
         SUBSCRIPTION_CONFIG.freeAtlasLocationLimit -
           freeUsage.atlasLocations.length,
       ),
       freeTarotPullsRemaining: Math.max(
         0,
         SUBSCRIPTION_CONFIG.freeTarotPullLimit - freeUsage.tarotPullCount,
       ),
       freeMeditationSessionsRemaining: Math.max(
         0,
         SUBSCRIPTION_CONFIG.freeMeditationSessionLimit -
           freeUsage.meditationSessions.length,
      ),
      canAccess,
       canAccessAtlasLocation,
       canAccessMeditationSession,
       recordAtlasLocation,
       recordMeditationSession,
      refreshInterpretationAllowance,
       recordTarotPull,
      setSelectedPlan: (plan) => updateDevelopmentState({ selectedPlan: plan }),
      setDevelopmentEntitlement: (entitlement) =>
        updateDevelopmentState({ entitlement }),
      setDevelopmentTrialEligibility: (eligible) =>
        updateDevelopmentState({ trialEligible: eligible }),
      purchaseSelectedPlan,
      restorePurchases,
      paywallRequest: isDemo || !PAYWALL_ENABLED ? null : paywallRequest,
      openPaywall: (request = {}) => {
        if (PAYWALL_ENABLED && !isDemo) setPaywallRequest(request);
      },
      closePaywall: () => setPaywallRequest(null),
    }),
    [
      canAccess,
       canAccessAtlasLocation,
       canAccessMeditationSession,
      developmentState,
      entitlement,
      hasPremiumEntitlement,
      isDemo,
       freeUsage,
      paywallRequest,
      purchaseSelectedPlan,
       recordAtlasLocation,
       recordMeditationSession,
      refreshInterpretationAllowance,
      interpretationStatus,
       recordTarotPull,
      restorePurchases,
      updateDevelopmentState,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used inside SubscriptionProvider");
  }
  return context;
}