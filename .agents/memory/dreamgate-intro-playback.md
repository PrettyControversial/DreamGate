---
name: DreamGate intro playback
description: When the pre-home intro animation and sound should play.
---

The pre-home DreamGate intro plays once per authenticated browser session, does not replay when returning to Home, and plays during logout before the session redirect completes.

**Why:** Replaying the sound on every Dashboard mount was disruptive; the intended experience is an auth-boundary welcome rather than a page-navigation animation.

**How to apply:** Gate the intro with session-scoped state, clear that state when logout begins, and preserve the existing media asset and fade transition for both login-entry and logout flows.