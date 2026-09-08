---
name: Moon calendar module boundary
description: The source-level failure mode to watch for when the lunar calendar page is edited or merged.
---

Keep the moon calendar page as one complete TypeScript/TSX module with a single export and imports only at the top level. Appending another copy of the page after its JSX return makes Vite fail before the application can open, even though the Express server may still report that it is listening.

**Why:** The dev server can appear healthy on port 5000 while the browser-side transform fails on a malformed page module, which surfaces as a failed or blank artifact rather than a server crash.

**How to apply:** After changes to the lunar calendar page, run the production build or an equivalent TSX parse check before restarting the workflow.