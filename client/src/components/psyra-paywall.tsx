import { useEffect, useRef, useState } from "react";
import {
  Check,
  LockKeyhole,
  RefreshCw,
  Sparkles,
  Star,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  isDevelopmentBuild,
  type PaywallRequest,
  useSubscription,
} from "@/lib/subscription";
import {
  SUBSCRIPTION_CONFIG,
  type SubscriptionEntitlement,
} from "@shared/subscription";
import dreamDecoderBackground from "@assets/dreamgate_backgrounds/dream-decoder-background.webp";
import { trackEvent } from "@/lib/analytics";

const premiumFeatures = [
  "Unlimited Ask Psyra dream interpretations",
  "Full Jungian dream analysis",
  "Archetype reveals",
  "Your Psyche insights",
  "Recurring dream patterns & symbols",
  "Archetype history and gallery",
  "Monthly Dream Psyche insights",
  "Full meditation library",
  "Premium Tarot experiences",
];

interface PsyraPaywallProps {
  open: boolean;
  request: PaywallRequest | null;
  onClose: () => void;
}

function LegalPlaceholder({
  label,
  href,
  testId,
}: {
  label: string;
  href: string;
  testId: string;
}) {
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-4 hover:text-white"
        data-testid={testId}
      >
        {label}
      </a>
    );
  }

  return (
    <span
      className="cursor-default underline decoration-dotted underline-offset-4"
      title="Add the production URL when it is available"
      data-testid={testId}
    >
      {label}
    </span>
  );
}

export function PsyraPaywall({
  open,
  request,
  onClose,
}: PsyraPaywallProps) {
  const {
    entitlement,
    provider,
    selectedPlan,
    trialEligible,
    isPremium,
    setSelectedPlan,
    purchaseSelectedPlan,
    restorePurchases,
    setDevelopmentEntitlement,
    setDevelopmentTrialEligibility,
  } = useSubscription();
  const [isWorking, setIsWorking] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const paywallWasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      setStatusMessage("");
      if (!paywallWasOpen.current) {
        trackEvent("psyra_paywall_viewed", {
          feature: request?.feature ?? "general",
        });
      }
    }
    paywallWasOpen.current = open;
  }, [open, request?.feature]);

  const isAnnualTrial = selectedPlan === "annual" && trialEligible;
  const plan = SUBSCRIPTION_CONFIG.plans[selectedPlan];
  const title = request?.title || "Go Deeper With Psyra";
  const description =
    request?.description ||
    "Your dreams don't exist in isolation. Psyra connects the patterns, symbols and archetypes that unfold across your inner world.";

  const handlePurchase = async () => {
    trackEvent("upgrade_selected", {
      plan: selectedPlan,
      provider,
      trial_eligible: isAnnualTrial,
      feature: request?.feature ?? "general",
    });
    setIsWorking(true);
    setStatusMessage("");
    const result = await purchaseSelectedPlan();
    setIsWorking(false);
    if (result.success) {
      onClose();
      return;
    }
    setStatusMessage(result.reason || "Purchases are not available yet.");
  };

  const handleRestore = async () => {
    setIsWorking(true);
    setStatusMessage("");
    const result = await restorePurchases();
    setIsWorking(false);
    setStatusMessage(
      result.success
        ? "Your Psyra+ access has been restored."
        : result.reason || "No purchases were found.",
    );
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        className="max-h-[min(92dvh,860px)] w-[calc(100%-1rem)] max-w-xl overflow-y-auto border-[#4d4850] bg-[#100e12] p-0 text-[#f6f1e9] shadow-2xl"
        data-testid="psyra-paywall"
      >
        <div className="relative overflow-hidden border-b border-white/10 px-6 pb-7 pt-8 sm:px-8">
          <img
            src={dreamDecoderBackground}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#100e12]/40 via-[#100e12]/75 to-[#100e12]" />
          <div className="relative">
            <div className="mb-5 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.28em] text-[#d8c7e8]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{request?.eyebrow || "Psyra+"}</span>
            </div>
            <DialogHeader className="space-y-3 text-left">
              <DialogTitle className="max-w-md font-display text-3xl leading-tight text-[#f6f1e9] sm:text-4xl">
                {title}
              </DialogTitle>
              <DialogDescription className="max-w-lg text-sm leading-relaxed text-[#d2ccd4]">
                {description}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6 sm:px-8">
          <div className="grid gap-2.5 bg-[#f6f1e9] text-[#3d3542] opacity-100 sm:grid-cols-2">
            {premiumFeatures.map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-2.5 text-sm leading-snug text-[#3d3542] opacity-100"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#9a62c7] opacity-100" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3" aria-label="Subscription plans">
            <button
              type="button"
              onClick={() => setSelectedPlan("annual")}
              aria-pressed={selectedPlan === "annual"}
              className={`relative w-full rounded-xl border p-4 text-left transition-colors ${
                selectedPlan === "annual"
                  ? "border-[#b88be0] bg-[#f6f1e9] text-[#17131a] ring-1 ring-[#b88be0]"
                  : "border-[#d4ccc0] bg-[#f6f1e9] text-[#17131a] hover:bg-[#fffaf0]"
              }`}
              data-testid="subscription-plan-annual"
            >
              <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#8d56bc] px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[#fffaf0]">
                <Star className="h-3 w-3" />
                Best Value
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#504651]">
                Annual
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-2xl text-[#17131a]">
                  {SUBSCRIPTION_CONFIG.plans.annual.price}
                </span>
                <span className="text-sm text-[#504651]">
                  {SUBSCRIPTION_CONFIG.plans.annual.period}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#504651]">
                <span>{SUBSCRIPTION_CONFIG.plans.annual.monthlyEquivalent}</span>
                <span>{SUBSCRIPTION_CONFIG.plans.annual.savings}</span>
                {trialEligible && (
                  <span className="font-semibold text-[#69418c]">
                    {SUBSCRIPTION_CONFIG.plans.annual.trialLabel}
                  </span>
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPlan("monthly")}
              aria-pressed={selectedPlan === "monthly"}
              className={`w-full rounded-xl border p-4 text-left transition-colors ${
                selectedPlan === "monthly"
                  ? "border-[#b88be0] bg-[#f6f1e9] text-[#17131a] ring-1 ring-[#b88be0]"
                  : "border-[#d4ccc0] bg-[#f6f1e9] text-[#17131a] hover:bg-[#fffaf0]"
              }`}
              data-testid="subscription-plan-monthly"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-[#504651]">
                Monthly
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-2xl text-[#17131a]">
                  {SUBSCRIPTION_CONFIG.plans.monthly.price}
                </span>
                <span className="text-sm text-[#504651]">
                  {SUBSCRIPTION_CONFIG.plans.monthly.period}
                </span>
              </div>
            </button>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              onClick={handlePurchase}
              disabled={isWorking || isPremium}
              className="h-12 w-full bg-[#f6f1e9] text-[#211b25] hover:bg-white"
              data-testid="button-subscribe"
            >
              {isPremium
                ? "Psyra+ Is Active"
                : isAnnualTrial
                  ? "Start My 7-Day Free Trial"
                  : "Continue with Psyra+"}
            </Button>
            {isPremium && (
              <p className="text-center text-xs text-[#cfc2d6]">
                You are previewing the unlocked Psyra+ experience.
              </p>
            )}
            <button
              type="button"
              onClick={handleRestore}
              disabled={isWorking}
              className="mx-auto flex items-center gap-2 text-xs text-[#d8c7e8] underline-offset-4 hover:underline disabled:opacity-50"
              data-testid="button-restore-purchases"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Restore Purchases
            </button>
            {statusMessage && (
              <p
                className="text-center text-xs text-[#e9d8b3]"
                aria-live="polite"
              >
                {statusMessage}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 text-[0.65rem] text-[#aaa1ad]">
            <LegalPlaceholder
              label="Terms of Use"
              href={SUBSCRIPTION_CONFIG.legalLinks.termsOfUse}
              testId="link-terms-of-use"
            />
            <span aria-hidden="true">•</span>
            <LegalPlaceholder
              label="Privacy Policy"
              href={SUBSCRIPTION_CONFIG.legalLinks.privacyPolicy}
              testId="link-privacy-policy"
            />
          </div>

          {isDevelopmentBuild && (
            <div className="space-y-3 rounded-xl border border-dashed border-[#82758d] bg-[#d8c7e8]/5 p-4">
              <div className="flex items-start gap-2">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#d8c7e8]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#e9e3e9]">
                    Development subscription controls
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#aaa1ad]">
                    Mock state only. StoreKit is not connected and this control
                    is excluded from production behavior.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["FREE", "DEVELOPMENT_PREMIUM", "PSYRA_PLUS"] as SubscriptionEntitlement[]).map(
                  (option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDevelopmentEntitlement(option)}
                      className={`rounded-lg border px-2 py-2 text-[0.65rem] ${
                        entitlement === option
                          ? "border-[#d8c7e8] bg-[#d8c7e8]/15 text-[#f6f1e9]"
                          : "border-white/15 text-[#aaa1ad]"
                      }`}
                      data-testid={`dev-entitlement-${option.toLowerCase()}`}
                    >
                      {option === "DEVELOPMENT_PREMIUM"
                        ? "Mock Psyra+"
                        : option === "PSYRA_PLUS"
                          ? "StoreKit ready"
                          : "Free"}
                    </button>
                  ),
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDevelopmentTrialEligibility(true)}
                  className={`rounded-lg border px-2.5 py-1.5 text-[0.65rem] ${
                    trialEligible
                      ? "border-[#e9d8b3] text-[#e9d8b3]"
                      : "border-white/15 text-[#aaa1ad]"
                  }`}
                  data-testid="dev-trial-eligible"
                >
                  Trial eligible
                </button>
                <button
                  type="button"
                  onClick={() => setDevelopmentTrialEligibility(false)}
                  className={`rounded-lg border px-2.5 py-1.5 text-[0.65rem] ${
                    !trialEligible
                      ? "border-[#e9d8b3] text-[#e9d8b3]"
                      : "border-white/15 text-[#aaa1ad]"
                  }`}
                  data-testid="dev-trial-ineligible"
                >
                  Trial not eligible
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}