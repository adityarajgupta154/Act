---
name: Agent platform quirks
description: Durable-runtime and subagent-pool gotchas (not project-specific).
---

- Durable (top-level) CodeExecution scope has NO `setTimeout` — wrap sleeps/polling loops in a `"use impure"` async function.
- `generateImage` callback: the file param is `outputPath` (NOT `path`) — `path` fails schema validation instantly and the printed jobId is dead. Aspect ratio may be ignored (squares come back); design for square.
- The testing-subagent pool is 1-concurrent, and a zombie job from a PREVIOUS session can wedge it: `waitForJob` AND `cancelJob` both bounce with "already running". No self-serve fix found — after a couple of cancel attempts, proceed without e2e and disclose it instead of burning retries.
- `requestSecrets` for an ALREADY-EXISTING secret can silently no-op: the form lets the user "confirm" without changing the value, and "added or confirmed" fires anyway (saw 4 no-ops in a row, Aug 2026). Verify with an 8-char sha256 fingerprint of the env value from a fresh shell — never print values. A secret name that does NOT exist yet forces real value entry, so deleting-then-re-adding (or a fresh name) breaks the loop.
- NEVER advise users to fix a key by RENAMING a secret in the pane — a fumbled rename deleted the only valid key's value permanently. Safer ladder: (1) fresh key at the provider into a fresh-named/deleted-then-readded secret, (2) careful paste. Also: validate key FORMAT server-side (39-char `AIza…` shape) to separate bad-paste from provider-revoked.
- `@google/genai` SDK warns "Both GOOGLE_API_KEY and GEMINI_API_KEY are set. Using GOOGLE_API_KEY" whenever both env vars exist — explicit `apiKey` args still win, but any future implicit construction would grab GOOGLE_API_KEY. Keep exactly ONE Google-key secret name in the workspace.

- Post-merge setup (scripts/post-merge.sh) deliberately skips the drizzle db push (removed Aug 2026): nothing imports @workspace/db and the stored SUPABASE_DATABASE_URL secret is NOT a valid postgres URL (93 chars, no scheme, no `@` — pg fails with ENOTFOUND "base"), so the push can only fail. **Why:** it broke a task merge. **How to apply:** if Supabase persistence ever becomes real, request a correct connection string first, then restore the push step.
- Workflow restarts can strand a PORTLESS zombie server (api-server logs EADDRINUSE, wrapper exits, but an older `node dist/index.mjs` survives on running timers). Fix: `pgrep -f dist/index.mjs` → kill → restart the workflow. `ss` is NOT installed; check ports another way or just restart.
