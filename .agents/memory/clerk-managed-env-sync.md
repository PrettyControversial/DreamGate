---
name: Managed Clerk environment sync
description: Recovery path when a Replit-managed Clerk app reports a session refresh redirect loop.
---

When Replit-managed Clerk reports an infinite session-refresh redirect loop, verify the code wiring first, then rerun the managed Clerk setup synchronization instead of manually editing or exposing Clerk secrets.

**Why:** The published or preview runtime can hold mismatched managed key material even while all expected secret names exist; synchronization refreshes the coordinated values safely.

**How to apply:** Confirm management status is `managed`, use the managed setup callback, restart the application workflow, and verify both the landing page and `/sign-in`. Treat development-key warnings as expected.