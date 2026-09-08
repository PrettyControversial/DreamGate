---
name: DreamGate response budget
description: Performance target and loading rules for DreamGate web and Capacitor surfaces.
---

The first usable DreamGate screen should appear in under two seconds on normal mobile conditions.

**Why:** The user explicitly identified longer waits as unacceptable, especially in the Xcode/Capacitor app.

**How to apply:** Keep intro transitions below the budget, avoid eager-loading decorative media, lazy-load below-fold images, and let essential controls render before videos and collage artwork.