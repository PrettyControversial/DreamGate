---
name: Mobile asset budget
description: Safe media-size targets and path-preserving optimization rules for DreamGate's Capacitor bundle.
---

Keep bundled client images around 500 KB or less and long meditation audio around 2–3 MB or less when practical.

**Why:** iOS WebProcess crashes can present as repeated WEBP decoder failures when the native web bundle carries too much high-resolution media.

**How to apply:** Optimize media in place while preserving filenames and extensions because DreamGate uses direct Vite imports and extension-specific `import.meta.glob` patterns. Rebuild and run Capacitor sync after asset changes.