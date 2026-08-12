---
name: Safe Path Adventure (zone1)
description: zone1 POCSO maze game — architecture, content-safety copy rules, asset/placeholder state, and verification seams.
---

# Safe Path Adventure — zone1 game

- `src/games/safepath/`: `content.ts` (pure bilingual data, no imports), `logic.ts` (pure engine), `data.ts` (webp bindings + DEV missing-binding check), `SafePathGame.tsx` (phases intro → maze → success → quiz → result).
- Flow: zone1 entry in `gameFlows.ts` uses `continueTo: 'levels'` + `storyLevelId: null` — game-first gate, Continue opens LevelSelect (zone2 castle keeps `'quiz'` + story unlock). Gate credit = the ONE `markVideoWatched` literal in GameQuestFlow; smokes pin these.
- Verification: `scripts/safepath.smoke.ts` (~951 checks: BFS grid invariants, deterministic L1 walkthrough end-score 550/2-star, wiring greps, asset >1000B). Dev seams: `/?zone=zone1` fresh → game mounts; `&watched=safe-path-adventure` → landing card.

## Content-safety copy rule (architect-enforced, PRD §9.6)
Questions and answer OPTIONS must never use scared/scary/blame/trouble/fault language — even as *wrong* options (no "You will get into trouble", no "Think it is your fault"). Wrong options = neutral silence/secrecy choices; correct options = affirmative safe-action.
**Why:** child-facing POCSO copy must not model threat or self-blame; architect review FAILED the first version on this.
**How to apply:** "never your fault" reassurance is RETAINED but only in explanations/learnings (2 spots in content.ts). Sweep grep before shipping copy: `scared|scary|blame|trouble|मुसीबत|दोष|डर` must return nothing in `src/games/safepath/`.

## Completion screen (success phase — reference-image recreation, 2026-08-12)
- Pure DOM/CSS scene (clouds/bunting/balloon/school/sign built in CSS+SVG) over the SAME app cast: park bg + home guide-boy + assistant robot (re-exported as SP_HERO/SP_MASCOT in data.ts). No screenshot-as-bg, no new art — same-cast rule holds.
- Safe Choices stat is ATTEMPT-based BY DESIGN: `safeDecisions/(safe+wrong)`. Architect suggested level-total-obstacles denominator — REJECTED, do not "fix".
  **Why:** the label means "of choices MADE, how many safe"; a level-total denominator under-reports whenever an obstacle isn't on the taken path, and attempt-based can never show a false perfect.
- `spDidItSub` carries ONE `|SZ|` marker per language; component splits on it to color the Safe Zone word (HI word order differs). Smoke pins exactly-one-marker — translators must keep it.
- DEV seam `?zone=zone1&spphase=success`: import.meta.env.DEV-gated (ungated = prod shortcut past the game into the quiz). Seeds a display-only demo session (NOT a fully valid terminal SpSession — success view reads only score/safe/wrong; keep it that way or build a real terminal state).

## Asset state (as of 2026-08-12)
Only 3 of 13 webps are real art (path tile, park bg, trusted-adult card); other 10 are styled placeholder gradients that pass smokes. Gemini image quota was exhausted across 3 waves; retry-once protocol done — regenerate remaining 10 when quota recovers. Convert recipes: cards `-resize 640x640^ -gravity center -extent 640x640 -quality 82`; player/safezone `-fuzz 6% -transparent white -trim +repage -resize 420x560`/`640`; banner `-resize 1600x -gravity center -extent 1600x600`; bg `-resize 1600x`. L2 card ids reuse L1 art via SP_ART map.
