---
name: DreamGate sign-in methods
description: The app's supported end-user sign-in experience and provider decision.
---

DreamGate uses email/password sign-in only in its embedded Clerk UI; social sign-in controls are intentionally hidden.

**Why:** Google sign-in was unreliable for this app and the desired recovery path is Clerk's built-in forgot-password flow.

**How to apply:** Preserve the branded email/password sign-in screen and do not re-enable social buttons without an explicit product decision. With the current Clerk React SDK, custom password recovery uses the future sign-in resource's factor-specific reset methods rather than legacy first-factor calls.