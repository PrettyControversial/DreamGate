---
name: Psyra+ access boundaries
description: Architectural and safety constraints for subscription and premium feature work.
---

Keep the paywall presentation, entitlement decisions, and platform purchase provider separate. Development-only premium simulation must be impossible to activate in a production build.

**Why:** StoreKit will be connected later, while product UI and access rules need to remain testable now without creating a production purchase bypass.

**How to apply:** Route every premium feature through the centralized entitlement manager. Keep mock purchase and entitlement mutation guarded by the development build, and replace the provider behind that interface when native StoreKit support is added.

The free tier is intentionally a bounded product sample: three Ask Psyra interpretations, one Dream Atlas location, three Tarot pulls, and one Guided Journey audio session. Core journaling stays available; repeat use and deeper pattern exploration belong to Psyra+.

**Why:** The product should demonstrate its value before asking for payment, while reserving the recurring discovery loop that makes a subscription valuable.

**How to apply:** New premium surfaces should offer one meaningful preview where possible, then route the next repeat or deeper view through the paywall. Keep exhaustion states explicit and user-scoped.

Premium feature surfaces must use the same entitlement state for access checks and status copy. Do not show a free quota or unlock action while a premium entitlement is active.

**Why:** Showing free-tier messaging after access is granted makes a valid entitlement look blocked and can lead users back into the paywall.

**How to apply:** When a premium state changes, update the gate, explanatory copy, and CTA together. Prefer an explicit active state over leaving the free-tier UI visible.