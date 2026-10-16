---
name: Native release boundaries
description: User-directed Git workflow and native configuration boundaries for the iOS release.
---

Pull the latest `origin/codex/dream-atlas-redesign` before code changes and keep
work on that branch. Push requested changes to the same branch. Do not change
the app ID `com.ninebynine.psyra`. Do not edit anything inside `ios/`; give the
user the required Xcode steps instead.

**Why:** The user maintains the native project in Xcode and explicitly chose to
apply Apple sign-in capability changes themselves. They separately updated the
bundle identity and required it to remain unchanged.

**How to apply:** Shared web/TypeScript and dependency changes can be made here.
Do not run Capacitor sync/copy commands here, since they modify `ios/`. Authorized
upstream native changes can be brought in unchanged by a requested pull; do not
edit them locally.
