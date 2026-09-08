---
name: Managed AI completion shape
description: Non-obvious behavior observed when using Replit-managed GPT-5 chat completions for structured dream analysis.
---

For structured Dream Decoder responses, allow enough completion budget for both reasoning and visible output, normalize fenced or alternate JSON shapes, and treat empty content as an explicit retryable failure rather than returning generic interpretation text.

**Why:** A managed GPT-5-mini request completed successfully but spent its available completion budget on reasoning and returned no visible content. A separate successful request returned valid JSON under an unexpected `answer` key. The old behavior silently discarded both outcomes and showed generic filler as though decoding had succeeded.

**How to apply:** Any future structured managed-AI feature should validate required semantic content, accept harmless response-shape variations, and expose genuine failures to the user instead of substituting generic success data.