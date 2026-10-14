---
name: Dream-based Tarot
description: Product rules and privacy/cost decisions for choosing Tarot cards from saved interpretations.
---

Tarot uses the current user's newest dated dream with usable saved interpretation data, not their newest uninterpreted entry or another user's journal. Use the existing deck and unchanged spread positions; send a whitelist of saved interpretation fields, not raw dream text or personal reflections.

**Why:** The user requested personal card connections without paying to reinterpret dreams or sending raw journal content again.

**How to apply:** Cache separately by dream and spread because the available spreads have different card counts and positions. Keep reasons and reversed orientations stable. Reopening or reinterpreting the same dream must not generate another spread; a newer interpreted dream is the trigger. Save failed AI selections as random fallbacks too, so opening repeatedly during an outage does not repeatedly call AI.

Do not charge another free pull or record another draw event when restoring a saved spread.

**Why:** Viewing an existing reading is not a new draw.

**How to apply:** Preserve the server's cached spreads when updating an interpretation or reflection on that dream. Deleting the interpretation intentionally removes its associated cache.

Do not automatically associate legacy ownerless Tarot history with the currently signed-in user.

**Why:** A shared device may have history belonging to a different person, and the old format contains no reliable owner.

**How to apply:** Keep new personal reading history isolated by authenticated account; do not copy the old global history into an account.
