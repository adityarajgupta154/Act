---
name: Nyaya Nagri dev testing
description: How to curl-test the api-server, the full smoke suite, tsx smoke quirks, e2e tester limits, and zone-surface checklist.
---

**Rule:** To curl-test `/api/avatar/chat` in development, hit the api-server directly on its own port (read `PORT=` from the workflow process env, e.g. `http://localhost:8080/api/avatar/chat`). The shared preview proxy path (`http://localhost:80/api-server/...`) returns 404 for this service.

**Why:** Cost several probing steps in the Task 10 session; the Express app mounts routes at `/api` with no artifact base-path prefix, so proxied paths don't match.

**How to apply:** `PID=$(pgrep -f "api-server.*run dev")` → read `/proc/<child>/environ` for `PORT`, or check the workflow log ("Server listening, port: NNNN"), then curl `localhost:<port>/api/...`.

**Also:** The avatar output gate is fail-closed by design — any model reply that phrases helpline guidance (digits, "childline", "हेल्पलाइन", "कॉल करो", etc.) is replaced with the canonical escalation reply. A model answer to "पॉक्सो क्या है?" that volunteers 1098 gets replaced; this is intentional, not a bug.

## Smoke suite — SEVEN smokes, not six
From `artifacts/nyaya-nagri`: `pnpm dlx tsx scripts/{engine,levels,economy,onboarding,help,community}.smoke.ts` **plus `scripts/dashboard.render.smoke.tsx`** (headless ProgressPanel render). Run ALL seven after zone/economy/i18n changes.
**Why:** dashboard.render was left off the checklist and silently rotted for several tasks — its `ProgressState` fixture went stale when economy fields were added, and nothing noticed until an architect review.
- `scripts/` are NOT in the typecheck project and tsx is transpile-only — smoke fixtures/asserts get zero static checking, so they rot silently when interfaces grow. After changing `ProgressState` or zone counts, grep the scripts dir for stale fixtures.
- Under tsx, `import.meta.env` is undefined (Vite-only injection). App modules imported by smokes must use `import.meta.env?.DEV` (optional chaining), or the smoke dies at import time.

## Zone-surface checklist (when adding/renumbering zones)
Zone logic hides in more surfaces than the obvious per-zone files: besides zones.ts/registry/greetings/strings/economy/Map marker/recaps/api prompt scope/smokes, **grep `src/ui/` for zone assumptions** (ProgressScreen had its own duplicated unlock calc and hardcoded-copy references to the old first zone). The pure rule `isZoneUnlockedIn(completedZones, zoneId)` in zones.ts is the single lock source — never reimplement it per surface. Completed zones are ALWAYS unlocked (replay + legacy-save migration).

## E2E tester + WebGL
- The headless test browser exhausts WebGL contexts after repeated reloads in one session ("THREE.WebGLRenderer: Error creating WebGL context"). Tell the tester to start EACH flow in a completely fresh browser context; all quest/onboarding UI is DOM above the canvas, so flows still work despite canvas errors.
- When a flow targets a mid-quest level, spell out the navigation (pre-quiz MCQs are part of L1; later levels unlock sequentially) or the tester stops mid-Level-1 and reports the feature missing.
- The tester does not know entering a zone opens a LEVEL SELECT panel (not an auto-started quest) — say "the level-select panel appearing = pass, then click the first level card" or it reports the quest as missing.
- Subagent followups: `sendFollowup({ name, message })` — a `task` param fails validation.
