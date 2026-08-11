---
name: Nyaya story voice guide
description: Story Adventure narration is GEMINI-ONLY — engine rules, failure/retry-chip semantics, state-store split, quota discipline
---

# Story Adventure voice — GEMINI-ONLY (strict)

**Rule: exactly ONE story voice engine — the Gemini clip controller (`storyAdventureVoice`). No speechSynthesis / browser TTS / fallback voice in the story path, EVER.**
**Why:** the original design had a device-TTS fallback for Gemini quota windows; the user heard the robotic voice and explicitly rejected the whole fallback concept ("no fallback voice ever — retry chip instead"). Any reintroduction, even "temporary", violates an explicit user spec.
**How to apply:** on any story-voice failure, stay SILENT and surface the amber retry chip; never reach for another engine. Story smoke enforces zero Web Speech literals in `src/story/*` (even comments) and that `storyVoice.ts` stays deleted.

## Failure semantics (deliberate, spec-aligned)
- Fetch-fail → 60s degrade cooldown + `markUnavailable` + warn log; **NO onDone** — reminder timers never arm while voice is down (no silent babbling loop).
- Play/autoplay-fail → `markUnavailable` **without** cooldown: the chip tap doubles as the iOS/Safari unlocking gesture, so retry must be immediate.
- Headless env (no `window.Audio`, tsx smokes) → silent + onDone FIRES (state machine must advance; silence ≠ second voice).
- Suspended (chat open) → silent, no onDone. Chat-open suspends story voice via the suspend-listener registry.
- `retryVoice()` = clear cooldown+flag, re-prime clip element inside the click gesture, replay current session.

## Architecture split
- `storyNarrationState.ts` = engine-free pub-sub {speaking, suspended, unavailable}. **Never add `new Audio(`/`fetch(` there** — smoke asserts it stays engine-free so a second voice path can't grow back.
- Assistant read-aloud (AvatarWidget speechSynthesis) is a SEPARATE protected surface — story/assistant separation via activeStory gates, not engine sharing.
- Quest a11y narrator (`src/a11y/narrator.ts`) is also separate, non-story.

## Chip + UX invariants
- Chip gating: `supported && settings.narration && voiceUnavailable && slide.type !== 'RESULT'`. RESULT/congrats slide is ALWAYS fully silent (hard-stop before sequence build).
- Chip strings (`storyVoiceRetry`) are UI-only, digit-free, never spoken ⇒ no TTS manifest regen when they change.
- Reminder cadence: flat 5s after question narration completes; rotates the 6-line pool; only arms after a successful onDone.

## Ops / evidence patterns
- Free-tier Gemini TTS ~5 req/min: api logs full of 429 WARN (prewarm) + fast 503s = EXPECTED, not a bug. Disk cache serves 200s alongside.
- DEV seams: `?story=open&slide=N[&pick=...][&voice=down]` — `voice=down` calls `simulateOutage()` for deterministic chip screenshots.
- `[story-voice]` console.debug lines (DEV only) via Screenshot tool = headless behavioral evidence (e.g. "RESULT slide — silent by spec").

## Prewarm priority + generated play order (quota starvation lesson)
- Free-tier 429 starvation means GENERATION ORDER decides which slides speak. Priority rule: **whatever completes the PLAYABLE interaction first** — chrome CTAs/yourturn (engine dies at first missing clip, so these gate every read + both feedback branches) -> level blocks in play order (L1 en, L1 hi, ...) -> reminders -> reward/result LAST. Reminders BELOW level blocks is deliberate: the client arms reminders only after a successful question read, so nudge clips are worthless while the question can't speak (the slide-4-silent bug: 12 reminders front-ran L1's question cluster).
- Live cache MISS re-anchors the prewarm onto that level+lang block (demandKey; chrome misses don't re-anchor) — the story being PLAYED fills first. Boot log's `next:` ids = order proof.
- The 429 text "check your plan and billing" = DAILY cap dead — nothing generates until quota reset (Pacific midnight); no code conjures quota, only paid tier does. Diagnose cache-vs-code in one shot: tsx script hashing `voice|lang|text` per manifest entry against .story-voice-cache lists exactly which ids are missing.
- The manifest FILE is alphabetically sorted, so play order ships as a separate GENERATED export STORY_LEVEL_ORDER (captured from enumeration order before the sort). Never derive level order from manifest encounter order.
- TRAP: story.smoke extracts the manifest by byte markers (first "= [" / last "] as const") — nothing after the manifest array in that file may contain either sequence, EVEN IN COMMENTS (a generated comment containing the literal marker crashed the smoke once).
