---
name: Clerk transport by platform
description: Authentication transport boundary between DreamGate's browser and Capacitor builds.
---

Use Clerk session cookies for browser API requests and Clerk bearer tokens only in native Capacitor webviews.

**Why:** Browser builds share the same-origin Clerk cookie with Express, while bundled native webviews do not share that browser cookie jar. Applying one transport globally makes one platform unreliable.

**How to apply:** Keep platform detection at the API-client boundary. Do not add authorization headers to normal web requests, and do not remove native token support when changing Clerk wiring.

Web Clerk provider values must keep the managed canonical shape: derive the publishable key from the browser hostname with the injected key as fallback, and pass the injected proxy URL directly. Branch only the native values.

**Why:** Letting native fallback logic alter browser `publishableKey` or `proxyUrl` can leave the published sign-in screen waiting forever even while development auth works.

**How to apply:** When adding Capacitor support, preserve an explicit web branch that uses the managed environment values verbatim. Put API-host-derived proxy fallback only in the native branch.

Native Capacitor bundles must also be built with `VITE_API_BASE_URL` set to DreamGate's published HTTPS URL; `capacitor://localhost` is the local app shell, not the Express backend.

**Why:** Relative API calls work in the browser because frontend and backend share an origin, but an iOS webview cannot reach the server through its device-local origin.

**How to apply:** Publish the backend first, use the verified production URL for the native build-time API base, and validate it as an absolute HTTP(S) URL before calling fetch. Browser builds must ignore this override and keep using their current origin. Malformed native values must produce a designed connection error, never a raw Safari URL exception.

Clerk route callbacks in Capacitor can arrive as `capacitor://localhost/...` URLs; normalize those callbacks to pathname, query, and hash before passing them to the client router.

**Why:** Wouter and Clerk's web redirect validation expect web paths, while forwarding the custom Capacitor scheme produces an invalid-protocol warning and can send auth recovery back to `/`.

**How to apply:** Keep this normalization at the Clerk `routerPush`/`routerReplace` boundary so browser URLs remain unchanged and native sign-in, password reset, and verification stay inside the app.

Protected queries must not render until Clerk reports `isLoaded`; this applies to browsers as well as native builds.

**Why:** Rendering the authenticated app during Clerk session restoration can send the first API requests without a valid session and surface misleading 401 errors.

**How to apply:** Gate the shared authenticated query/router provider on both the native token bridge and Clerk's loaded state, while keeping browser requests cookie-based.