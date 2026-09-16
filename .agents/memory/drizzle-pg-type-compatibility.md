---
name: Drizzle PostgreSQL type compatibility
description: How to avoid Pool type conflicts when Drizzle and the app resolve different pg type declarations.
---

When Drizzle’s node-postgres adapter rejects an otherwise valid `pg` Pool because the app and Drizzle resolve different `@types/pg` shapes, prefer Drizzle’s connection-config initialization with a validated `DATABASE_URL` instead of casting the Pool or upgrading packages.

**Why:** A transitive package can leave the root `@types/pg` older than the declaration Drizzle uses, producing a compile-time incompatibility without a runtime database problem.

**How to apply:** Confirm the installed versions first. If the mismatch is only in type declarations, use the installed adapter’s supported `connection` form and fail explicitly when `DATABASE_URL` is missing; do not add a migration or dependency upgrade for this issue.