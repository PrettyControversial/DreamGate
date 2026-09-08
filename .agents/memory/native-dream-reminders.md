---
name: Native dream reminders
description: Cross-platform and privacy rules for DreamGate’s scheduled journaling prompts.
---

Use Capacitor local notifications for fixed morning dream-journal and evening sleep-intention reminders. Keep schedules and wall-clock times per user on the device, and use generic copy that never contains journal content.

**Why:** These reminders must work when the installed iPhone app is closed, but they do not need remote push infrastructure or any private reflection data to leave the device.

**How to apply:** Request permission only after a user enables a reminder, clear and rebuild stable schedules when preferences change, resync after authentication/app startup, await cleanup during logout, and state clearly that the web version cannot guarantee background delivery.