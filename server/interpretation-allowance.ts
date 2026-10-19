import { DAILY_LIMITS, type InterpretationAllowance } from "../shared/daily-limits";
import { hasDemoPremium, type DemoIdentity } from "../shared/demo";
import { withDailyUsage, type UsageTransaction } from "./daily-usage";

export function isDevelopmentInterpretationPreview(
  nodeEnv: string | undefined,
  deployed: string | undefined,
  entitlement: string | undefined,
): boolean {
  return nodeEnv === "development" && deployed !== "1" &&
    (entitlement === "PSYRA_PLUS" || entitlement === "DEVELOPMENT_PREMIUM");
}

function isExempt(user: DemoIdentity, developmentEntitlement?: string) {
  return hasDemoPremium(user) || isDevelopmentInterpretationPreview(
    process.env.NODE_ENV, process.env.REPLIT_DEPLOYMENT, developmentEntitlement,
  );
}

/**
 * Production exemptions come ONLY from server-fetched Clerk identity/metadata.
 * Preserve the existing preview simulation exclusively on development servers.
 */
export async function interpretationAllowance(
  user: DemoIdentity,
  timeZone: unknown,
  developmentEntitlement?: string,
): Promise<InterpretationAllowance> {
  return withDailyUsage(user.id, timeZone, async quota => ({
    ...quota.interpretationStatus(),
    limit: DAILY_LIMITS.interpretations,
    exempt: isExempt(user, developmentEntitlement),
    remaining: isExempt(user, developmentEntitlement) ? null : quota.interpretationStatus().remaining,
  }));
}

export async function withInterpretationAllowance<T>(
  user: DemoIdentity,
  timeZone: unknown,
  interpret: (tx: UsageTransaction) => Promise<{ value: T; successfulAi?: boolean }>,
  developmentEntitlement?: string,
): Promise<T> {
  return withDailyUsage(user.id, timeZone, async (quota, tx) => {
    const exempt = isExempt(user, developmentEntitlement);
    if (!exempt) quota.assertAvailable("interpretations", 1);
    const result = await interpret(tx);
    // Basic keyword fallback is not a successful AI interpretation.
    // Exceptions, including failed saves, roll back this entire transaction.
    if (!exempt && result.successfulAi !== false) {
      await quota.consume("interpretations", 1);
    }
    return result.value;
  });
}
