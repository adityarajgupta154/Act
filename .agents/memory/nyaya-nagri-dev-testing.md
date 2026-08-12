---
name: Nyaya Nagri dev testing
description: How to curl-test the api-server, the full smoke suite, tsx smoke quirks, e2e tester limits, and zone-surface checklist.
---

**Rule:** To curl-test `/api/avatar/chat` in development, hit the api-server directly on its own port (read `PORT=` from the workflow process env, e.g. `http://localhost:8080/api/avatar/chat`). The shared preview proxy path (`http://localhost:80/api-server/...`) returns 404 for this service.

**Why:** Cost several probing steps in the Task 10 session; the Express app mounts routes at `/api` with no artifact base-path prefix, so proxied paths don't match.

**How to apply:** `PID=$(pgrep -f "api-server.*run dev")` → read `/proc/<child>/environ` for `PORT`, or check the workflow log ("Server listening, port: NNNN"), then curl `localhost:<port>/api/...`.

**Also:** The avatar output gate is fail-closed by design — any model reply that phrases helpline guidance (digits, "childline", "हेल्पलाइन", "कॉल करो", etc.) is replaced with the canonical escalation reply. A model answer to "पॉक्सो क्या है?" that volunteers 1098 gets replaced; this is intentional, not a bug.

## Smoke suite — TWELVE frontend smokes + api-server safety smoke
From `artifacts/nyaya-nagri`: `pnpm exec tsx scripts/{engine,levels,economy,onboarding,help,community,nyayaai,insights,story,childhood}.smoke.ts` **plus `scripts/dashboard.render.smoke.tsx` and `scripts/certificates.smoke.tsx`** (headless renders) — ELEVEN total. Run ALL after zone/economy/i18n/ProgressState changes. (`pnpm exec`, never `pnpm dlx` — dlx resolves a network copy.) A shell glob `scripts/*.smoke.ts` silently MISSES the two `.tsx` renders — glob `scripts/*.smoke.ts*` or list them explicitly.
Plus api-server: `cd artifacts/api-server && pnpm exec tsx scripts/safety.smoke.ts` (tsx is an api-server devDep now; trilingual EN/HI/GU safety gates + Nyaya AI prompt contract + insights banned-term filter + exact non-diagnosis refusal lines; deterministic, no network/key needed). Run it after ANY safety.ts, insights-filter, or AI-prompt change.
**Why:** dashboard.render was left off the checklist and silently rotted for several tasks — its `ProgressState` fixture went stale when economy fields were added, and nothing noticed until an architect review.
- `scripts/` are NOT in the typecheck project and tsx is transpile-only — smoke fixtures/asserts get zero static checking, so they rot silently when interfaces grow. After changing `ProgressState` or zone counts, grep the scripts dir for stale fixtures.
- dashboard.render child view bans raw score fractions via /[0-9]\s*\/\s*[0-9]/ over the HTML — opacity-suffixed Tailwind classes (`bg-amber-50/60`) trip it through the class attribute. Use solid tints in ProgressPanel markup.
- Under tsx, `import.meta.env` is undefined (Vite-only injection). App modules imported by smokes must use `import.meta.env?.DEV` (optional chaining), or the smoke dies at import time.
- Exact-line greps over SOURCE files false-fail on TS escapes (`child\'s` in source vs `child's` at runtime) — normalize (`.replace(/\\'/g, "'")`) or assert on built strings. Reviewer claims of "the exact line is missing" deserve the same suspicion before acting.

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
- WebGL can also fail **container-wide**, not just after reloads: a brand-new headless Chrome throws `Error creating WebGL context ... BindToCurrentSequence failed, VENDOR=0xffff` on the first paint. When that happens, the 3D canvas is unverifiable in this environment (report code posture + recommend a real-device check) but every DOM surface still renders and is testable.

## Map modal screenshots (permanent DEV seam, Aug 2026)
`?map=open` is a PERMANENT dev seam: main.tsx seeds `progressStore.update({onboarded, ageBand, completedZones zone0+zone1})` and HomePage skips the landing screen — headless capture lands straight on the Map modal with mixed completed/unlocked/locked states.
`?profile=open` (same recipe, Aug 2026): seeds onboarded + skips landing, and the left-rail PlayerProfile card boots its dropdown EXPANDED (DEV-gated inside the component) — the panel is otherwise unreachable headlessly (needs a click). Seeded state has no avatar config, so captures show the Star + "Player Profile" fallback face, not a nickname.
`?story=open` (same recipe, Aug 2026) lands straight in the Story Adventure overlay: `&slide=N` (0-4) jumps to that slide, `&pick=correct|wrong` pre-selects a CHOICE option so feedback/Try-Again states are screenshotable without clicks. Level-map era params: `&level=<id>` picks the story — but a LOCKED level silently falls back to the village (no error); pair it with `&done=<id,csv>` to unlock the chain first (e.g. `&level=right-to-health&done=right-to-life`). `&done=<id,csv>` pre-completes levels (unlocks + map states), `&view=map` opens the LEVEL MAP instead of a story, `&celebrate=<id>` replays the unlock cinematic (screenshot catches whichever beat is live). All story seam params are DEV-gated inside StoryOverlay. Boot-state seeding lesson: reuse the existing `?demoProgress`-style post-import `progressStore.update()` — do NOT build pre-hydration localStorage hacks (ES import hoisting defeats module-body ordering; a first-import side-effect module is the only way, and it's never needed).

## Get Help Now hub — seam (API-FREE since Aug 2026 places-removal task)
- `?help=open` PERMANENT dev seam (main.tsx seeds onboarded + calls openHelp; HomePage skips landing): headless capture lands on the open hub dialog in the idle nearby state. `&at=<lat>,<lng>` skips real geolocation and lands DIRECTLY in the 'located' state (Location found row + 3 Maps category buttons + Emergency Help + 112) — there are NO searching/results/api-error/empty states anymore. Geo-denied/timeout still need the e2e tester or a real browser. Dialog is tall: ~2600px-high viewport or the nearby section sits below the fold.
- The nearby section is API-FREE by explicit user spec (Aug 2026): browser geolocation → task-verbatim Google Maps deep links (`https://www.google.com/maps/search/?api=1&query=hospitals+near+LAT,LNG`, `medical+care+near+`, `children%27s+hospital+near+`, `emergency+hospital+near+`; coords toFixed(4)). NO /api/places routes exist (curl → plain Express-fallthrough 404), no Google Maps key anywhere in code (the secret sits unused in Replit env), and place data must NEVER be fabricated client-side. Do NOT reintroduce a places backend, place cards, manual text search, filter chips, or the key — the "fix the paid Maps key" thread is permanently dead. 112 renders in EVERY state including mid-lookup; geolocation failure states stay DISTINCT (denied/timeout/unavailable/unsupported).
- Curl-probing api-server liveness: `/api`, `/api/storyvoice/health` etc. 404 because those routes never existed — a 404 alone proves nothing. Positive control = pino request logs (every hit is logged with statusCode) or a real route like `/api/story-adventure-voice/tts` (its own handler answers 404 `{"error":"Unknown story segment"}` — a BODY means the server is alive).

## Headless voice-config verification (no mic/browser needed)
A REAL Live WS connect is testable headlessly: curl-mint a token (`POST localhost:8080/api/nyaya-ai/voice-token`), then a node script with `createRequire('<api-server>/package.json')` → `require('@google/genai')` → `ai.live.connect` using the CLIENT's mirrored config (v1alpha, token as apiKey, no audio sent). `onopen` + `setupComplete` + no reason-close within ~4s proves token constraints accept the client config — the exact thing tsc/curl can't check (constraint conflicts only surface at connect). uses:1 tokens burn per probe; mint fresh each time. Real-mic conversation still needs a device test.

**FULL round-trip probe (proven 2026-08-11):** extend the same script with real speech — read a cached story WAV from `artifacts/api-server/.story-voice-cache/*.wav` (24k PCM16 mono; parse to the `data` chunk), downsample to 16k (index step rate/16000), base64 2048-sample chunks via `sendRealtimeInput({audio:{data, mimeType:'audio/pcm;rate=16000'}})` at ~128ms intervals, then ~2s of zero-frames (trips the 600ms VAD), collect ~25s. PASS = `inputTranscription` text + model audio chunks + turnComplete. **Use real speech, not sine tones** (tones may never trip VAD/ASR → false "dead"). This definitively splits Google-side vs client-device: probe PASS + user sessions transcript-less ⇒ device mic problem. Client-side proof lives in DEV `[voice-latency]` logs: `mic-track ... muted=true` + `mic-level peak=0.0000 (SILENT)` ⇒ OS/hardware mute, not app code.

## Blanket safety literal-greps rot
When an APPROVED feature legitimately owns a banned literal (voice mic vs the `getUserMedia` ban; insights UI copy naming GEMINI_API_KEY), the smoke starts failing on OLD surfaces during unrelated tasks. Refine to the true invariant — file-scoped exemption + a STRONGER targeted assert (voice file must be audio-only: no `video:`/ImageCapture; key ban becomes an env-ACCESS regex everywhere + literal ban outside i18n copy) — never delete or blanket-weaken the check.

## Vite dev server after delete→recreate
Deleting a module file and recreating it later (even in a later session) leaves the RUNNING dev server with a stale module graph: fresh page loads log a 404 + `[vite] Failed to reload <file>` for that path while the UI still renders fine. Restart the artifact workflow after any delete-then-recreate before judging console cleanliness, or the e2e "zero console errors" check fails spuriously.
Related: a USER-reported runtime-error overlay naming a long-deleted identifier (e.g. a reverted TEMP harness component) means their TAB outlived dev-server restarts with a stale module graph — diagnose with `grep -rn <identifier> src/`; zero hits + clean fresh screenshot ⇒ nothing to fix in code, just restart workflows and have them hard-refresh (Ctrl+Shift+R).

## Home screen (post-redesign, Aug 2026)
Home is pure 2D/DOM — NO canvas until ENTER (3D world is a lazy chunk). WebGL overlays/context errors can only appear AFTER entering; homepage screenshots need no overlay-suppression hacks. The HI home visual difference is the baked plate itself, verifiable from the composite file without a browser language flip.

## Screenshotting the app when WebGL is dead
The runtime-error overlay from the Replit vite error-modal plugin covers the top ~380px of every screenshot, hiding the UI under test. Two temporary, must-revert dev tweaks make visual checks possible:
1. `server.hmr.overlay = false` in the artifact's `vite.config.ts` — also suppresses the runtime-error modal.
2. To capture a Hindi screen without a clickable browser, flip the `settingsStore` DEFAULTS `language` to `'hi'`, screenshot, flip back (a fresh screenshot browser has empty localStorage, so it always boots on the default).
**Why:** the Screenshot tool cannot click or press Esc, so neither the overlay nor the language toggle can be dismissed/switched from outside.
**How to apply:** make both edits, screenshot, revert, then confirm with `git diff --stat` on those two files before finishing.

## E2E screenshot pitfalls (learned Aug 2026, onboarding scene redesign)
- Tester screenshots can catch staggered entrance animations mid-flight (later cards look missing/faded). In e2e recipes: instruct "wait ~2s after reaching an animated screen before screenshotting or visual asserts". DOM-text asserts are unaffected.
- When a redesign replaces a similar-looking screen, give the tester DISTINGUISHING markers (what the OLD design looked like vs NEW) or they may misreport the new UI as the old one.
- Hindi flow: tester must switch language via the step-0 on-scene buttons, not Settings — say so explicitly.

## Source-grep smoke asserts vs props
- onboarding/help smokes assert literal mounts (e.g. '<HelpDialog />'). When adding props to an asserted mount, relax to a prop-tolerant regex like /<HelpDialog[^>]*\/>/ AND keep a negative guard against conditional mounting (/\{\s*!?onboarded\s*&&\s*<HelpDialog/). Don't weaken the invariant, just the literal.

## Screenshotting an onboarding step the tool cannot click to
The Screenshot tool has no clicks, and a fresh screenshot browser can still boot straight past onboarding, so a mid-flow scene is otherwise unreachable. Temporary, must-revert harness: (1) make the entry page render the onboarding flow directly instead of the home screen, (2) default the flow's step state to the step under test. Mark both with a `TEMP-SCREENSHOT` comment, then `grep -rn TEMP-SCREENSHOT src/` + `git status` before finishing — these are trivial to forget and they ship a broken entry point.
To screenshot the WORLD directly (landing hero + Enter click are in the way): same TEMP-SCREENSHOT pattern — route `/` to WorldRoot and call `progressStore.completeOnboarding('12-15')` at App module load. Fresh capture browsers have empty localStorage, so the seed always applies; revert App.tsx wholesale from the pre-harness read.

## Measuring a screen against a reference image
Screenshot, then scan one pixel column/row for the panel's distinctive face colour and compare fractions with the same scan of the reference file. `magick file -crop 1xH+X+0 +repage txt:-` gives `x,y: (r,g,b)` — fields parse as x,y,r,g,b; PIL is not installed and the binary is `magick`, not `convert`. Pick a colour unique to the element (cream face with a small r-b spread), not "blue" or "gold" — sky, pavement and artwork poison those and the scan silently reports the backdrop.

## Testing-subagent slot can be held by an orphan
Only one testing subagent may run at a time, and one left running by an earlier session blocks every new tester for the rest of the session ("1 testing subagents are already running"). There is no way to reclaim it from here — after a couple of retries, fall back to typecheck + smokes + screenshot evidence and say so in the report instead of burning turns.

## Architect reviews vs uncommitted multi-task diffs
`includeGitDiff: true` shows the reviewer ALL uncommitted work — including PRIOR tasks' approved rebuilds (this project rarely commits between pasted tasks), so "file X must be unchanged" constraints false-FAIL against earlier tasks.
**How to apply:** scope review constraints to "changes made for THIS task, listed here: ..."; treat "revert prior-task work" recommendations as diff-scoping artifacts — check task history before acting.

## Testing-subagent slot (recurring)
An orphaned tester can hold the single slot across sessions/compaction indefinitely. Retry once per task, no more; fallback loop = typecheck + eight smokes + harness screenshots, and say so in the report.

- Phaser world screenshots WORK in the headless capture browser: Phaser.AUTO falls back to Canvas2D there (WebGL is dead container-wide). Console proof: "Phaser v3.90.0 (Canvas | Web Audio)". The 3D-era "world cannot be screenshotted" limitation is gone for the 2D engine.
- generateImage may return square output even when the prompt asks for a different aspect ratio (zone territory art requested 3:2, got 1024x1024). Design world territory tiles as squares.

- Story smoke now also covers the VOICE GUIDE: engine no-op/suspend safety, reminder pacing windows, digit-free spoken lines, wiring literals, and a mocked-synth wedge regression (fake window.speechSynthesis injected mid-run, ~4s real-timer wait — smoke got slower by design; globals deleted after).

## Story TTS route (Aug 2026)
- Curl: `curl -s -o /tmp/x.wav -w '%{http_code} %{time_total}s' "http://localhost:8080/api/story-adventure-voice/tts?id=chrome%2Fcorrectlead%2Fen"` → 200 RIFF WAV in ms when cached; unknown id → 404; uncached during quota backoff → INSTANT 503 (designed fast-fail, not breakage). Ids = URL-encoded manifest ids (grep story-voice-manifest.ts for the real shapes — guessing them wrong looks like a 404 "bug").
- Cache: api-server cwd `.story-voice-cache/` (42 clips when full); `rm -rf` forces regeneration; prewarm refills slowly (quota-polite). 429 WARN spam in api logs during warmup is EXPECTED free-tier behavior — the client fallback keeps the story audible ([story-voice] warn in browser console = chain working).
- Catalog/strings edits → regen manifest (`pnpm exec tsx scripts/generate-story-voice-manifest.ts` from nyaya-nagri) or the story smoke's drift guard fails by design.

## Latency probing (chat + voice-token)
- Node probe against `http://localhost:8080/api` directly: chat-stream headers→first NDJSON delta→done (POST `/nyaya-ai/chat-stream` `{message, language}`), classic chat total. SPACE the two chat calls ~20s apart (free-tier ~5 req/min on the chat model). Aug 2026 healthy floors: stream first-delta ~1.1s, classic ~1.3-1.6s — TTFT is model floor, treat bigger numbers as regressions.
- In-browser stage timings come free in DEV console: `[voice-latency]` (tap→listening breakdown, per-turn user-final→first-audio) and `[chat-latency]` (send→first-delta→done, fallback marker) — ask for a copy-paste of these lines instead of guessing.

- Screenshot tool saves FULL-RES capture (e.g. 2400x2960 jpg) while the chat preview is downscaled — run `magick identify` on the saved file BEFORE cropping zoom-ins; crop coords eyeballed from the preview land in the wrong region.

## Aug 2026 addendum — seams & battery deltas
- Dev seams (main.tsx): `?zone=<id>` marks all PRIOR zones complete then enterZone (lock rules + fade still apply; HomePage skips landing on the param); `&watched=<id,csv>` also works on the zone seam and pre-earns the castle lesson gate (historical `videosWatched` name) by writing the map DIRECTLY — deliberately not via markVideoWatched, so the story smoke's write-site enumeration stays clean. `?zone=zone2` fresh = "Right to Childhood" drag-drop game mounts immediately (the `?game=rightwrong` standalone seam is DELETED with the old game); `?zone=zone2&watched=right-to-childhood` = landing card with Continue enabled. Story seam extras: `&zones=` (completedZones) + `&watched=` for the castle-gated unlock.
- Api battery is FOUR smokes (safety, avatar.safety, persona.safety, ratelimit). Ratelimit = clock-injected policy tests + wiring greps (admission mounted in app.ts BEFORE express.json; the route holds NO allow() call). Grep lesson: bare function names hit DEFINITIONS — match call sites (`await fn(`).
- Story smoke pins the GAME-FIRST castle policy (video + watch tracker DELETED Aug 2026): fresh entry mounts the game, src-wide enumeration keeps markVideoWatched( to store+flow only, Continue `disabled={!gameDone`, no `<video`, and `public/video/` must NOT exist.
- Voice-token mint probing is DEAD (Sarvam era; token routes mounted-but-unused). Sarvam route needs real audio to probe — prefer the browser `[voice-latency]` console lines.

## Unlock-rule + tuning-literal smoke refits (2026-08-12)
- `levels.smoke.ts` is now unlockAfter-AWARE: it derives each next zone's prerequisite from `ZONES` (mirroring `isZoneUnlockedIn`) instead of assuming strict order; the legacy-save section asserts zone2 waits for zone0 even with zone1 complete. Future `unlockAfter` changes are followed automatically.
- `nyayaai.smoke.ts` VAD + turn-timeout checks are RANGE-based (silence 300-900ms, min speech 100-400ms, record cap 10-30s, timeout 8-25s) — latency tuning no longer rots them. Lesson: when tuning constants change, refit smokes to the invariant RANGE, not the new literal.
- Turn-failure check asserts fail-closed (`this.fail('connect-failed')` + the friendly-retry comment) — the old "silent return to listening" behavior is intentionally gone.
