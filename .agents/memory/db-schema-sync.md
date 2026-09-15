---
name: Development schema sync
description: How to handle Drizzle schema additions when push reports an interactive named-schema conflict.
---

When a new Drizzle table is absent but `drizzle-kit push` stops on a non-interactive named-schema prompt, inspect the development schema first and preserve existing tables; do not approve a blind destructive diff.

**Why:** The push command can require a TTY even when the intended change is additive, which makes unattended verification fail and can tempt a data-loss confirmation.

**How to apply:** Query the development schema, create only the missing additive table with the exact Drizzle column shape, then rerun the push with explicit approval so later schema checks reconcile cleanly.