export type SubscriptionEntitlement =
  | "FREE"
  | "PSYRA_PLUS"
  | "DEVELOPMENT_PREMIUM";

export type SubscriptionPlanId = "annual" | "monthly";

// Keep the subscription experience wired up, but disabled until paid plans ship.
export const PAYWALL_ENABLED = false;
export const FREE_AI_LIMIT_MESSAGE =
  "You've used this month's free readings. More readings unlock next month.";

export function freeInterpretationCountForMonth(
  count: number,
  recordedMonth: string | undefined,
  currentMonth: string,
): number {
  return recordedMonth && recordedMonth !== currentMonth
    ? 0
    : Math.max(0, count);
}

export type SubscriptionFeature =
  | "askPsyraInterpretation"
  | "fullJungianAnalysis"
  | "archetypeReveals"
  | "yourPsyche"
  | "longitudinalPatterns"
  | "archetypeHistory"
  | "monthlyPsycheInsights"
  | "fullMeditationLibrary"
  | "premiumTarot"
  | "dreamAtlasLocations";

export const SUBSCRIPTION_CONFIG = {
  productIds: {
    monthly: "PSYRA_MONTHLY_PRODUCT_ID",
    annual: "PSYRA_ANNUAL_PRODUCT_ID",
  },
  freeAskPsyraLimit: 3,
  freeAtlasLocationLimit: 1,
  freeTarotPullLimit: 3,
  freeMeditationSessionLimit: 1,
  legalLinks: {
    termsOfUse: "",
    privacyPolicy: "",
  },
  plans: {
    annual: {
      id: "annual" as const,
      label: "Annual",
      price: "$99.99",
      period: "/ year",
      monthlyEquivalent: "$8.33/month",
      savings: "Save 36%",
      trialLabel: "7-Day Free Trial",
    },
    monthly: {
      id: "monthly" as const,
      label: "Monthly",
      price: "$12.99",
      period: "/ month",
      monthlyEquivalent: "",
      savings: "",
      trialLabel: "",
    },
  },
} as const;

export const PREMIUM_FEATURES: SubscriptionFeature[] = [
  "askPsyraInterpretation",
  "fullJungianAnalysis",
  "archetypeReveals",
  "yourPsyche",
  "longitudinalPatterns",
  "archetypeHistory",
  "monthlyPsycheInsights",
  "fullMeditationLibrary",
  "premiumTarot",
  "dreamAtlasLocations",
];

export const isPremiumEntitlement = (
  entitlement: SubscriptionEntitlement,
): boolean =>
  entitlement === "PSYRA_PLUS" || entitlement === "DEVELOPMENT_PREMIUM";