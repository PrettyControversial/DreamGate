import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  isPremiumEntitlement,
  SUBSCRIPTION_CONFIG,
  type SubscriptionEntitlement,
  type SubscriptionFeature,
  type SubscriptionPlanId,
} from "@shared/subscription";

export const isDevelopmentBuild = import.meta.env.DEV;

const DEV_SUBSCRIPTION_STORAGE_KEY = "dreamgate-development-subscription";
const DEV_USAGE_STORAGE_KEY = "dreamgate-ask-psyra-usage";

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
  canAccess: (feature: SubscriptionFeature) => boolean;
  recordAskPsyraInterpretation: () => void;
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

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

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

function loadAskPsyraUsage() {
  if (!isDevelopmentBuild) return 0;

  try {
    const stored = localStorage.getItem(DEV_USAGE_STORAGE_KEY);
    if (!stored) return 0;
    const parsed = JSON.parse(stored) as { month?: string; count?: number };
    return parsed.month === currentMonthKey() && typeof parsed.count === "number"
      ? Math.max(0, parsed.count)
      : 0;
  } catch {
    return 0;
  }
}

function saveDevelopmentState(state: DevelopmentSubscriptionState) {
  if (!isDevelopmentBuild) return;
  try {
    localStorage.setItem(DEV_SUBSCRIPTION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The in-memory state remains usable when browser storage is blocked.
  }
}

function saveAskPsyraUsage(count: number) {
  if (!isDevelopmentBuild) return;
  try {
    localStorage.setItem(
      DEV_USAGE_STORAGE_KEY,
      JSON.stringify({ month: currentMonthKey(), count }),
    );
  } catch {
    // The in-memory state remains usable when browser storage is blocked.
  }
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [developmentState, setDevelopmentState] = useState(loadDevelopmentState);
  const [askPsyraUsage, setAskPsyraUsage] = useState(loadAskPsyraUsage);
  const [paywallRequest, setPaywallRequest] =
    useState<PaywallRequest | null>(null);

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
    if (!isDevelopmentBuild || isPremiumEntitlement(developmentState.entitlement)) {
      return;
    }
    setAskPsyraUsage((current) => {
      const next = current + 1;
      saveAskPsyraUsage(next);
      return next;
    });
  }, [developmentState.entitlement]);

  const canAccess = useCallback(
    (feature: SubscriptionFeature) => {
      if (isPremiumEntitlement(developmentState.entitlement)) return true;
      if (feature === "askPsyraInterpretation") {
        return askPsyraUsage < SUBSCRIPTION_CONFIG.freeAskPsyraLimit;
      }
      return false;
    },
    [askPsyraUsage, developmentState.entitlement],
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
        SUBSCRIPTION_CONFIG.freeAskPsyraLimit - askPsyraUsage,
      ),
      canAccess,
      recordAskPsyraInterpretation,
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
      askPsyraUsage,
      canAccess,
      developmentState,
      paywallRequest,
      purchaseSelectedPlan,
      recordAskPsyraInterpretation,
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