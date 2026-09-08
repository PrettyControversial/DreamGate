---
name: Autoscale startup readiness
description: Deployment startup behavior needed for Replit autoscale health probes.
---

The HTTP server must bind before asynchronous route registration and Vite/static setup complete. During that short window, `/` should return a successful startup response and `/health` should remain available.

**Why:** Replit autoscale probes the root path immediately after launching the process; waiting to call `listen` until setup completes produces false 500 health failures and can cause the deployment to be terminated.

**How to apply:** Keep early listening and the startup root guard in the server entrypoint. Set readiness only after route and client-serving setup succeeds, and fail explicitly if initialization throws.