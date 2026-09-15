---
name: Mobile asset budget
description: Safe media-size targets and path-preserving optimization rules for DreamGate's Capacitor bundle.
---

Keep bundled client images around 500 KB or less and long meditation audio around 2–3 MB or less when practical. For iOS/WebView audio, AAC in M4A at a voice-appropriate bitrate is preferred over high-bitrate MP3.

**Why:** iOS WebProcess crashes can present as repeated WEBP decoder failures when the native web bundle carries too much high-resolution media.

**How to apply:** Keep direct Vite imports and runtime lookup paths synchronized when changing formats; preserving the logical asset role matters more than preserving the old extension. Rebuild and run Capacitor sync after asset changes.