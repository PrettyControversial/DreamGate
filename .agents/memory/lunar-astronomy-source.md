---
name: Lunar astronomy source
description: Accuracy and data-contract rules for Moon phases, events, eclipses, and Western zodiac positions.
---

Use one deterministic Astronomy Engine calculation path for current and calendar lunar data. Represent exact events with full ISO UTC instants, sample calendar days at a documented UTC instant, and derive Western signs from geocentric tropical ecliptic longitude in 30-degree segments.

**Why:** Mixing network phase dates, rough lunar-cycle arithmetic, hard-coded eclipse lists, and local-time date construction caused contradictory values and malformed calendar responses.

**How to apply:** Validate celestial, event, and monthly responses through shared schemas on both server and client. Keep source language factual, suppress duplicate phase notifications on eclipse dates, and never add an independent fallback engine that can disagree with the primary model.