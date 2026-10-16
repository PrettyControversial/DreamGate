---
name: DreamGate sign-in methods
description: The app's supported end-user sign-in experience and provider decision.
---

DreamGate keeps email/password sign-in and adds native Sign in with Apple on iOS only. Other social-provider controls stay hidden; browser/Android login remains unchanged.

**Why:** Google sign-in was unreliable for this app. The user explicitly requested Apple sign-in for the iOS App Store submission, without changing other features, design, or data.

**How to apply:** Preserve the branded email/password and password-recovery flows. Do not expose other providers or expand Apple login to other platforms without an explicit request. Let Clerk verify native Apple identity tokens and link accounts; never match or merge app users by email locally. Custom password recovery uses the future sign-in resource's factor-specific reset methods.

Apple account deletion must distinguish deleting the Clerk identity from
revoking Apple's authorization. An Apple identity JWT is not a revocable
access/refresh token.

**Why:** Native identity-token authentication does not itself give the app a
stored revocable provider token. Apple TN3194 requires explicit revocation when
a usable token is available, and still requires account deletion plus manual
revocation guidance when one is unavailable.

**How to apply:** Preserve the native deletion reauthorization and explicit
manual fallback. Never claim successful Apple revocation just because Clerk
deleted a user, and do not prevent deletion indefinitely solely because no
usable Apple credential exists.