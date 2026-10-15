import assert from "node:assert/strict";
import test from "node:test";
import {
  AI_DREAM_CONSENT_METADATA_KEY,
  AI_DREAM_CONSENT_TEXT,
  AI_DREAM_CONSENT_TITLE,
  AI_DREAM_CONSENT_VERSION,
  hasAcceptedDreamAiConsent,
  withDreamAiConsent,
} from "./ai-dream-consent";

test("the first-interpretation notice matches the approved disclosure", () => {
  assert.equal(AI_DREAM_CONSENT_TITLE, "How Psyra reads your dreams");
  assert.equal(
    AI_DREAM_CONSENT_TEXT,
    "To interpret your dream, Psyra sends the text you write to OpenAI, a third-party AI provider. Your dreams are used only to create your interpretation and are not used to train AI models. You can delete your dreams or your account anytime.",
  );
});

test("new accounts and malformed or outdated records require consent", () => {
  assert.equal(hasAcceptedDreamAiConsent(undefined), false);
  assert.equal(hasAcceptedDreamAiConsent({}), false);
  assert.equal(
    hasAcceptedDreamAiConsent({
      [AI_DREAM_CONSENT_METADATA_KEY]: { version: "old", acceptedAt: "2026-10-14" },
    }),
    false,
  );
  assert.equal(
    hasAcceptedDreamAiConsent({
      [AI_DREAM_CONSENT_METADATA_KEY]: { version: AI_DREAM_CONSENT_VERSION },
    }),
    false,
  );
});

test("consent is account metadata and adding it preserves unrelated private metadata", () => {
  const metadata = withDreamAiConsent({ is_demo: true }, "2026-10-14T12:00:00.000Z");
  assert.equal(metadata.is_demo, true);
  assert.equal(hasAcceptedDreamAiConsent(metadata), true);
});
