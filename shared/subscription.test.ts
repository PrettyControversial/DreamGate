import assert from "node:assert/strict";
import test from "node:test";
import {
  FREE_AI_LIMIT_MESSAGE,
  SUBSCRIPTION_CONFIG,
  freeInterpretationCountForMonth,
} from "./subscription";

test("free interpretation allowance remains three and rolls over by calendar month", () => {
  assert.equal(SUBSCRIPTION_CONFIG.freeAskPsyraLimit, 3);
  assert.equal(freeInterpretationCountForMonth(2, "2026-10", "2026-10"), 2);
  assert.equal(freeInterpretationCountForMonth(3, "2026-09", "2026-10"), 0);
  assert.equal(freeInterpretationCountForMonth(2, undefined, "2026-10"), 2);
  assert.equal(
    FREE_AI_LIMIT_MESSAGE,
    "You've used this month's free readings. More readings unlock next month.",
  );
});
