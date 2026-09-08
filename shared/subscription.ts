export type SubscriptionEntitlement =
  | "FREE"
  | "PSYRA_PLUS"
  | "DEVELOPMENT_PREMIUM";

export type SubscriptionPlanId = "annual" | "monthly";

export type SubscriptionFeature =
  | "askPsyraInterpretation"
  | "fullJungianAnalysis"
  | "archetypeReveals"
  | "yourPsyche"
  | "longitudinalPatterns"
  | "archetypeHistory"
  | "monthlyPsycheInsights"
  | "fullMeditationLibrary"
  | "premiumTarot";

export const SUBSCRIPTION_CONFIG = {
  productIds: {
    monthly: "PSYRA_MONTHLY_PRODUCT_ID",
    annual: "PSYRA_ANNUAL_PRODUCT_ID",
  },
  freeAskPsyraLimit: 3,
  legalLinks: {
    termsOfUse: "",
    privacyPolicy: "",
  },
  plans: {
    annual: {
      id: "annual" as const,
      label: "Annual",
      price: "$49.99",
      period: "/ year",
      monthlyEquivalent: "$4.17/month",
      savings: "Save 48%",
      trialLabel: "7-Day Free Trial",
    },
    monthly: {
      id: "monthly" as const,
      label: "Monthly",
      price: "$7.99",
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
];

export const isPremiumEntitlement = (
  entitlement: SubscriptionEntitlement,
): boolean =>
  entitlement === "PSYRA_PLUS" || entitlement === "DEVELOPMENT_PREMIUM";