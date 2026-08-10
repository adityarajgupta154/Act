---
name: Agent platform quirks
description: Durable-runtime and subagent-pool gotchas (not project-specific).
---

- Durable (top-level) CodeExecution scope has NO `setTimeout` — wrap sleeps/polling loops in a `"use impure"` async function.
- The testing-subagent pool is 1-concurrent, and a zombie job from a PREVIOUS session can wedge it: `waitForJob` AND `cancelJob` both bounce with "already running". No self-serve fix found — after a couple of cancel attempts, proceed without e2e and disclose it instead of burning retries.
