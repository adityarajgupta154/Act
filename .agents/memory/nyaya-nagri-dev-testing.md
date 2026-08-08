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

## New-level-KIND checklist (when adding an activity kind)
Typecheck catches `Record<LevelKind, ...>` maps (level greetings in i18n, LevelSelect kind icons) — but NOT these, which each bit once:
- `EXTRA_LEVEL_KIND_BY_ZONE` in economy.ts (string-keyed reconciliation map): a zone-wired activity level missing here means honest XP/coins get CLAMPED AWAY on the next saved-progress reload. Smokes test live-session math, not the reload/reconcile path — assert `earnedTotals({completedZones:{zoneN:true}})` includes the new kind's award.
- levels.smoke hardcodes the level-kind COUNT (`Object.keys(t.levelKindNames).length === N`).
**Quest JSON:** HI twin files MUST carry top-level `"language": "hi"` (EN files omit language) — engine parity assert `hi.language === 'hi'` fails without it, and the failure message ("resolves in Hindi") doesn't name the missing field.

## E2E zone unlock + recap timing
- `__nnDebug.enterZone` is fail-closed (guards `isZoneUnlocked`) — it does NOT bypass locks. Deterministic recipe for the tester: complete onboarding WITH guardian consent (persistence starts at consent), then in console merge booleans into the save and reload:
  `const k='nn-progress-v1'; const s=JSON.parse(localStorage.getItem(k)||'{}'); s.completedZones={...(s.completedZones||{}),zone0:true,...,zone5:true}; localStorage.setItem(k,JSON.stringify(s)); location.reload();` then call the seam AFTER reload. Ad-hoc injections with wrong shape/ids silently do nothing (store sanitizes to plain booleans).
- Recap cards appear only AFTER the whole quiz level finishes with score < 50% (RECAP_TRIGGER_RATIO) — tell the tester "answer ALL questions wrong, acknowledge each feedback; recap follows the LAST acknowledge", or they stop mid-quiz and report recap missing.

## E2E tester + WebGL
- The headless test browser exhausts WebGL contexts after repeated reloads in one session ("THREE.WebGLRenderer: Error creating WebGL context"). Tell the tester to start EACH flow in a completely fresh browser context; all quest/onboarding UI is DOM above the canvas, so flows still work despite canvas errors.
- When a flow targets a mid-quest level, spell out the navigation (pre-quiz MCQs are part of L1; later levels unlock sequentially) or the tester stops mid-Level-1 and reports the feature missing.
- The tester does not know entering a zone opens a LEVEL SELECT panel (not an auto-started quest) — say "the level-select panel appearing = pass, then click the first level card" or it reports the quest as missing.
- Subagent followups: `sendFollowup({ name, message })` — a `task` param fails validation.
