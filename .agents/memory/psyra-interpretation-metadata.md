---
name: Psyra interpretation metadata
description: Persistence and aggregation rule for archetype analysis attached to dream interpretations.
---

Store Psyra's structured archetype analysis in the same saved interpretation envelope as the Jungian reading, while treating that field as optional when reading historical dreams.

**Why:** Existing journal records predate Psyra and must remain readable without a destructive migration. Aggregating stored metadata also avoids sending private dream text back through AI every time the psyche profile loads.

**How to apply:** New interpretations must include validated archetype IDs, Jungian dimension scores, evidence, and a reflection question. Profile and trend views should parse that stored metadata and skip older records that do not have it.