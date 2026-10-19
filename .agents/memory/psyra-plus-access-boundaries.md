---
name: Psyra+ access boundaries
description: Architectural and safety constraints for subscription and premium feature work.
---

Keep the paywall presentation, entitlement decisions, and platform purchase provider separate. Development-only premium simulation must be impossible to activate in a production build.

**Why:** StoreKit will be connected later, while product UI and access rules need to remain testable now without creating a production purchase bypass.

**How to apply:** Route every premium feature through the centralized entitlement manager. Keep mock purchase and entitlement mutation guarded by the development build, and replace the provider behind that interface when native StoreKit support is added.

During the first App Store release, usage limits are cost controls, not an
opportunity to advertise a purchase. Meditation and archetype access stay
available while the paywall is disabled.

**Why:** The user postponed subscriptions for the first submission and
explicitly requires non-commercial exhaustion messages.

**How to apply:** Do not reintroduce upgrade or unlock prompts when a usage cap
is reached. Preserve the dormant purchase code for later activation.

Production AI allowance exemptions must come from the authenticated server
identity, never from development mock state or a client-supplied entitlement.

**Why:** Client-only simulation is useful for previewing paid surfaces but
cannot authorize real AI spending. No production subscription provider is
connected yet; the explicit review-demo exception remains separate.

**How to apply:** Keep the demo exception server-verified. Preserve mock controls
for other development-only feature previews, without treating them as a
production account exemption.

The App Review demo is an explicit production-only business exception: the verified, fixed demo identity may receive permanent premium access from a server-controlled private account flag. This must never become an email-only check, a public/client-editable flag, or a production development-mock override.

**Why:** The user requires complete screenshots and review access while keeping every real user's paywall and pricing unchanged.

**How to apply:** Grant access through the central entitlement manager, using only an authenticated server decision. Use the real interpretation and profile aggregation pipeline for the demo's ten sample dreams; never hardcode its dominant archetype or dimension percentages. Review login credentials are shared with Apple, so they must never authorize administrative reseeding—keep that authority separate.