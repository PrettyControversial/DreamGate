import assert from "node:assert/strict";
import test from "node:test";
import { DAILY_LIMITS, DAILY_LIMIT_MESSAGES, INTERPRETATION_LIMIT_HEADING } from "./daily-limits";
import { PAYWALL_ENABLED } from "./subscription";

test("interpretation allowance is five daily, with the exact non-commercial copy", () => {
  assert.equal(DAILY_LIMITS.interpretations, 5);
  assert.equal(INTERPRETATION_LIMIT_HEADING, "That's all for tonight");
  assert.equal(DAILY_LIMIT_MESSAGES.interpretations,
    "You've received 5 dream interpretations today. Come back tomorrow for more insight ✨");
  assert.doesNotMatch(`${INTERPRETATION_LIMIT_HEADING} ${DAILY_LIMIT_MESSAGES.interpretations}`,
    /\b(free|premium|upgrade|unlock|purchase)\b/i);
  assert.equal(PAYWALL_ENABLED, false);
});
