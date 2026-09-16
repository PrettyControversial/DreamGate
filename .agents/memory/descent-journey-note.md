---
name: Descent Journey Note
description: Persistence behavior for the Descent page’s Tonight’s Intention writing interaction.
---

The Descent’s Tonight’s Intention is a Journey Note: hydrate the latest saved intention when the page opens, let the user edit it in place, and update that record when saved. Only create a new intention when no saved record exists.

**Why:** Users expect the writing box to reopen with their note and editing it should not fill the archive with duplicate copies of the same nightly intention.

**How to apply:** Keep the note interaction aligned with Guided Journey’s Journey Note styling and use the existing intention API’s create-or-update behavior. Do not reintroduce a separate mood field into this section.