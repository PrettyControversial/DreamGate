---
name: Psyra+ access boundaries
description: Architectural and safety constraints for subscription and premium feature work.
---

Keep the paywall presentation, entitlement decisions, and platform purchase provider separate. Development-only premium simulation must be impossible to activate in a production build.

**Why:** StoreKit will be connected later, while product UI and access rules need to remain testable now without creating a production purchase bypass.

**How to apply:** Route every premium feature through the centralized entitlement manager. Keep mock purchase and entitlement mutation guarded by the development build, and replace the provider behind that interface when native StoreKit support is added.