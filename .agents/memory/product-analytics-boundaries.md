---
name: Product analytics boundaries
description: Privacy and accuracy rules for DreamGate product-event instrumentation.
---

Track events only at confirmed actions or successful outcomes. Event properties must be bounded operational metadata such as source, placement, tool ID, plan, spread, and counts; never send dream/search/intention text, identity, account IDs, or payment details.

**Why:** DreamGate handles unusually private reflection content, and route renders or optimistic clicks can inflate funnels without proving that a user completed the action.

**How to apply:** Use the shared safe analytics wrapper, emit completion events only after persistence/playback/interpretation succeeds, derive first-dream status from authenticated persisted data, and keep any cross-route attribution session-scoped with a short expiry.