---
name: DreamGate visual source of truth
description: Durable visual hierarchy and exclusions for future DreamGate interface work.
---

Use the current Discover section as the source of truth for authenticated DreamGate surfaces: Playfair Display headings, Raleway body and controls, cream/near-black inversion, thin square borders, transparent editorial panels, and minimal shadow.

**Why:** The user explicitly wants the app to feel like one tactile editorial publication rather than separate wellness-style screens.

**How to apply:** Reuse Discover’s tokens and shared primitives across authenticated pages. Keep the public Welcome/Login composition and the post-login Home intro video visually isolated unless the user explicitly asks to change them.

Authenticated pages use a clean, solid cream Day Mode surface with no wallpaper, texture, grain, pattern, or gradient behind functional content. The Home collage is the exception: preserve its decorative subjects as transparent cut-outs, never as rectangular image tiles. Discover and the bottom navigation remain near-black with cream typography and controls, while the navigation stays in normal page flow rather than floating over content.

**Why:** The user replaced the scheduled app-wide Night Mode with a readability-first system where dark styling is an intentional contrast reserved for Discover and the navigation anchor.

**How to apply:** New authenticated pages inherit #F6F3EC surfaces and #0E0C06 text/borders. Keep decorative art away from reading-heavy content; on Home, retain the established collage placement and use alpha-transparent assets. Preserve the public Welcome/Login and post-login intro styling.

Night Map artwork must be assembled from a few visible foreground collage objects that sit on top of the cream or black surface. Each object should be recognizable, surrounded by negative space, and visually separated from text; never tile, repeat, or fade symbols into a page-wide background.

**Why:** The user specifically corrected the earlier faded-symbol treatment: the reference is an isolated key-like object within an editorial composition, not wallpaper or a low-opacity pattern.

**How to apply:** Keep each decorative asset pointer-events-none and responsive, but place it in its own foreground stage between sections or slightly overlapping a card edge. Use full visibility, varied alignment, and breathing room without reducing readability.

The numbered dream glyph system is the approved decorative language: background glyphs use #62, #55, #59, #85, #96, #126, #141, and #150; footer glyphs map Home #16, Dream #38, Tarot #54, and Stats #139.

**Why:** The user wants symbolic markings that feel embedded in DreamGate rather than generic iconography or rectangular image tiles.

**How to apply:** Keep glyph files alpha-transparent, subtle, varied in scale/rotation/position, and behind readable content. Keep the Discover footer item unchanged unless a replacement glyph is explicitly supplied.

Functional navigation and action surfaces reuse the same transparent quick-access symbols: #96 for Decode, #62 for Prompts, #54 for Archive, and #55 for Calendar.

**Why:** Reusing the exact symbols across Quick Access, navigation, Discover, archive actions, and calendar views makes each DreamGate function recognizable across pages.

**How to apply:** Use the shared function-symbol component for prominent functional icons; keep tiny date metadata and unrelated dictionary/moon indicators conventional for legibility.

The approved functional symbol mapping also includes Home as the eye symbol #76, Dictionary as the mountain symbol #33, and New Entry as the three-line symbol #41.

**Why:** These symbols give the app’s core actions a recognizable visual vocabulary instead of mixing generic navigation glyphs with the DreamGate artwork.

**How to apply:** Reuse the transparent function symbols for Home, Dictionary, and New Entry buttons across navigation, shortcuts, empty states, and entry prompts; preserve ordinary metadata icons where the artwork would be too detailed.