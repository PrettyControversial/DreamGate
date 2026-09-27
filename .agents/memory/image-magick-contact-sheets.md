---
name: ImageMagick contact sheets
description: Font availability can break montage and annotated image previews in this workspace.
---

ImageMagick's `montage` may report an unavailable font even when no explicit label was requested. For simple unlabeled preview grids, combine rows with `+append` and rows together with `-append` instead.

**Why:** The installed ImageMagick build tried to resolve an empty font during a contact-sheet preview; replacing `montage` with append composition succeeded without a font dependency.

**How to apply:** Use the append approach for future image contact sheets here when labels are not needed. If labels matter, first inspect installed fonts rather than retrying `montage` with arbitrary font names.