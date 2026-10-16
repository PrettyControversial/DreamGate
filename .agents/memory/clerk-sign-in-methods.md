---
name: DreamGate sign-in methods
description: The app's supported end-user sign-in experience and provider decision.
---

DreamGate keeps email/password sign-in and adds native Sign in with Apple on iOS only. Other social-provider controls stay hidden; browser/Android login remains unchanged.

**Why:** Google sign-in was unreliable for this app. The user explicitly requested Apple sign-in for the iOS App Store submission, without changing other features, design, or data.

**How to apply:** Preserve the branded email/password and password-recovery flows. Do not expose other providers or expand Apple login to other platforms without an explicit request. Let Clerk verify native Apple identity tokens and link accounts; never match or merge app users by email locally. Custom password recovery uses the future sign-in resource's factor-specific reset methods.