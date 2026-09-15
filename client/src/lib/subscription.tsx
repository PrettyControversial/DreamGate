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
import {
  isPremiumEntitlement,
  SUBSCRIPTION_CONFIG,
  type SubscriptionEntitlement,
  type SubscriptionFeature,
  type SubscriptionPlanId,
} from "@shared/subscription";

export const isDevelopmentBuild = import.meta.env.DEV;

const DEV_SUBSCRIPTION_STORAGE_KEY = "dreamgate-development-subscription";
const LEGACY_ASK_PSYRA_USAGE_STORAGE_KEY = "dreamgate-ask-psyra-usage";
const FREE_USAGE_STORAGE_KEY = "dreamgate-free-usage";

interface FreeUsageState {
  askPsyraCount: number;
  atlasLocations: string[];
  tarotPullCount: number;
  meditationSessions: string[];
}

const emptyFreeUsage: FreeUsageState = {
  askPsyraCount: 0,
  atlasLocations: [],
  tarotPullCount: 0,
  meditationSessions: [],
};

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
  provider: "development-mock" | "storekit";
  isPremium: boolean;
  freeAskPsyraRemaining: number;
  freeAtlasLocationsRemaining: number;
  freeTarotPullsRemaining: number;
  freeMeditationSessionsRemaining: number;
  canAccess: (feature: SubscriptionFeature) => boolean;
  canAccessAtlasLocation: (locationName: string) => boolean;
  canAccessMeditationSession: (sessionId: string) => boolean;
  recordAtlasLocation: (locationName: string) => void;
  recordMeditationSession: (sessionId: string) => void;
  recordAskPsyraInterpretation: () => void;
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
        askPsyraCount:
          typeof parsed.askPsyraCount === "number"
            ? Math.max(0, parsed.askPsyraCount)
            : 0,
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

    // Preserve the earlier Ask Psyra counter when an existing browser first
    // moves to the per-user usage record.
    const legacy = localStorage.getItem(LEGACY_ASK_PSYRA_USAGE_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as { count?: number };
      return {
        ...emptyFreeUsage,
        askPsyraCount:
          typeof parsed.count === "number" ? Math.max(0, parsed.count) : 0,
      };
    }
  } catch {
    return emptyFreeUsage;
  }
  return emptyFreeUsage;
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
  const [developmentState, setDevelopmentState] = useState(loadDevelopmentState);
  const [freeUsage, setFreeUsage] = useState(() => loadFreeUsage(userScope));
  const [paywallRequest, setPaywallRequest] =
    useState<PaywallRequest | null>(null);

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

  const recordAskPsyraInterpretation = useCallback(() => {
    if (isPremiumEntitlement(developmentState.entitlement)) {
      return;
    }
    updateFreeUsage((current) => ({
      ...current,
      askPsyraCount: current.askPsyraCount + 1,
    }));
  }, [developmentState.entitlement, updateFreeUsage]);

  const recordTarotPull = useCallback(() => {
    if (isPremiumEntitlement(developmentState.entitlement)) {
      return;
    }
    updateFreeUsage((current) => ({
      ...current,
      tarotPullCount: current.tarotPullCount + 1,
    }));
  }, [developmentState.entitlement, updateFreeUsage]);

  const recordAtlasLocation = useCallback(
    (locationName: string) => {
      if (isPremiumEntitlement(developmentState.entitlement)) {
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
    [developmentState.entitlement, updateFreeUsage],
  );

  const recordMeditationSession = useCallback(
    (sessionId: string) => {
      if (isPremiumEntitlement(developmentState.entitlement)) {
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
    [developmentState.entitlement, updateFreeUsage],
  );

  const canAccess = useCallback(
    (feature: SubscriptionFeature) => {
      if (isPremiumEntitlement(developmentState.entitlement)) return true;
      if (feature === "askPsyraInterpretation") {
        return freeUsage.askPsyraCount < SUBSCRIPTION_CONFIG.freeAskPsyraLimit;
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
    [developmentState.entitlement, freeUsage],
  );

  const canAccessAtlasLocation = useCallback(
    (locationName: string) =>
      isPremiumEntitlement(developmentState.entitlement) ||
      freeUsage.atlasLocations.includes(locationName) ||
      freeUsage.atlasLocations.length <
        SUBSCRIPTION_CONFIG.freeAtlasLocationLimit,
    [developmentState.entitlement, freeUsage],
  );

  const canAccessMeditationSession = useCallback(
    (sessionId: string) =>
      isPremiumEntitlement(developmentState.entitlement) ||
      freeUsage.meditationSessions.includes(sessionId) ||
      freeUsage.meditationSessions.length <
        SUBSCRIPTION_CONFIG.freeMeditationSessionLimit,
    [developmentState.entitlement, freeUsage],
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
      isDevelopmentBuild,
      provider: isDevelopmentBuild ? "development-mock" : "storekit",
      isPremium: isPremiumEntitlement(developmentState.entitlement),
      freeAskPsyraRemaining: Math.max(
        0,
         SUBSCRIPTION_CONFIG.freeAskPsyraLimit - freeUsage.askPsyraCount,
       ),
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
      recordAskPsyraInterpretation,
       recordTarotPull,
      setSelectedPlan: (plan) => updateDevelopmentState({ selectedPlan: plan }),
      setDevelopmentEntitlement: (entitlement) =>
        updateDevelopmentState({ entitlement }),
      setDevelopmentTrialEligibility: (eligible) =>
        updateDevelopmentState({ trialEligible: eligible }),
      purchaseSelectedPlan,
      restorePurchases,
      paywallRequest,
      openPaywall: (request = {}) => setPaywallRequest(request),
      closePaywall: () => setPaywallRequest(null),
    }),
    [
      canAccess,
       canAccessAtlasLocation,
       canAccessMeditationSession,
      developmentState,
       freeUsage,
      paywallRequest,
      purchaseSelectedPlan,
       recordAtlasLocation,
       recordMeditationSession,
      recordAskPsyraInterpretation,
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