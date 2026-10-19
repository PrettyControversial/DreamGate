export const DAILY_LIMITS = { dreams: 5, tarot: 3, interpretations: 5 } as const;
export type DailyUsageKind = keyof typeof DAILY_LIMITS;
export const DAILY_LIMIT_MESSAGES = {
  dreams: "You've logged 5 dreams today. Your dream journal will be ready for more tomorrow. Sweet dreams ✨",
  tarot: "You've drawn your 3 cards for today. Come back tomorrow for new insight ✨",
  interpretations: "You've received 5 dream interpretations today. Come back tomorrow for more insight ✨",
} as const;
export const INTERPRETATION_LIMIT_HEADING = "That's all for tonight";

export interface InterpretationAllowance {
  limit: number;
  remaining: number | null;
  exempt: boolean;
  timeZone: string;
  day: string;
  resetsAt: string;
}

export class DailyLimitError extends Error {
  constructor(public readonly kind: DailyUsageKind) {
    super(DAILY_LIMIT_MESSAGES[kind]);
  }
}

export function dailyLimitMessage(error: unknown): string | undefined {
  const message = error instanceof Error ? error.message : "";
  return Object.values(DAILY_LIMIT_MESSAGES).find(value => message.includes(value));
}

export function canonicalTimeZone(value: unknown): string {
  if (typeof value !== "string" || value.length > 100) return "UTC";
  try {
    return new Intl.DateTimeFormat("en", { timeZone: value }).resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}
