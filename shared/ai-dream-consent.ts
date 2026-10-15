export const AI_DREAM_CONSENT_VERSION = "v1";
export const AI_DREAM_CONSENT_METADATA_KEY = "psyraDreamAiConsent";
export const AI_DREAM_CONSENT_TITLE = "How Psyra reads your dreams";
export const AI_DREAM_CONSENT_TEXT =
  "To interpret your dream, Psyra sends the text you write to OpenAI, a third-party AI provider. Your dreams are used only to create your interpretation and are not used to train AI models. You can delete your dreams or your account anytime.";

export type PrivateMetadata = Readonly<Record<string, unknown>>;

export function hasAcceptedDreamAiConsent(
  metadata: PrivateMetadata | null | undefined,
): boolean {
  if (!metadata) return false;
  const consent = metadata[AI_DREAM_CONSENT_METADATA_KEY];
  if (!consent || typeof consent !== "object" || Array.isArray(consent)) {
    return false;
  }
  const value = consent as Record<string, unknown>;
  return (
    value.version === AI_DREAM_CONSENT_VERSION &&
    typeof value.acceptedAt === "string" &&
    value.acceptedAt.length > 0
  );
}

export function withDreamAiConsent<T extends object>(
  metadata: T | null | undefined,
  acceptedAt: string,
): T & {
  psyraDreamAiConsent: {
    version: typeof AI_DREAM_CONSENT_VERSION;
    acceptedAt: string;
  };
} {
  return {
    ...metadata,
    [AI_DREAM_CONSENT_METADATA_KEY]: {
      version: AI_DREAM_CONSENT_VERSION,
      acceptedAt,
    },
  } as T & {
    psyraDreamAiConsent: {
      version: typeof AI_DREAM_CONSENT_VERSION;
      acceptedAt: string;
    };
  };
}
