---
name: Daily usage timezone boundaries
description: Why quota timezones are pinned per account rather than changed on each device request.
---

Keep the account's quota timezone stable across requests and devices. Do not
reset usage simply because a request reports a different timezone.

**Why:** There is no trusted account-timezone setting in the current product.
Accepting each device/request timezone independently would let users obtain
multiple daily allowances by switching zones or calling the API directly.
The first valid reported IANA zone establishes the account's quota calendar;
missing/invalid reports use UTC. IANA rules retain daylight-saving transitions.

**How to apply:** Any future timezone/travel setting must explicitly preserve
already-consumed allowance during a transition rather than silently starting
a new day. Keep logging and interpretation allowances independent even when
their numeric limits match: saving a journal entry is not proof that an AI
interpretation succeeded. Failed AI calls must not consume an interpretation.
