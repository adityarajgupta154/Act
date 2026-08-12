---
name: Right to Childhood drag-drop game
description: "Aug 2026 castle game (replaced Right or Wrong?): architecture, framer drag mechanics, content conventions, seams, removal guard"
---

# "Right to Childhood" drag-and-drop game (zone2 castle)

Fully REPLACED the "Right or Wrong?" tap game on user order (Aug 2026): old module/assets/uiStore state/map+home entries/`?game=rightwrong` seam/`rightWrongBest` persistence/rw* strings/rw-* css/its smoke are ALL deleted. Old saves carrying a stray `rightWrongBest` key still load (progressStore picks fields explicitly; strays drop silently). The game now lives ONLY inside the castle flow — no standalone/map entry, by design.

## Architecture (src/games/childhood/)
- **content.ts** — PURE TEXT (zero image imports) so the smoke imports REAL content under tsx. 3 rounds × 3 right-slots × 4 options, EXACTLY one distractor (`correctRight: null`) per round carrying a gentle law `note`; one LAW record per right id (education repeats across rounds deliberately).
- **logic.ts** — pure engine, injectable rng: +100/correct, +100 round bonus (max 1200), NO deductions ever (PRD §9.6), the distractor structurally cannot enter `placed`, hints (3/session) only point (never place), stars 3/2/1 — never 0.
- **data.ts** — the ONE module binding webps; convention `ch-<optionId>.webp` (smoke asserts a file per option id); DEV-only loud check for missing bindings.
- **RightToChildhoodGame.tsx** — framer-motion drag (FIRST framer usage in this app): `drag dragSnapToOrigin dragMomentum={false}` + whileDrag scale/shadow + `touchAction:'none'`; slot hit-test = getBoundingClientRect at drag end (clientX / changedTouches fallback); hover highlight during onDrag; TAP-TO-SELECT fallback (tap card → tap slot) keeps it playable where dragging is awkward. Required props `{onComplete, onContinue, onExit}`. Playing screen has NO bottom bar (removed on user order, Aug 2026): the Hint button (badge + disabled state) sits IN the top round/score row, and the amber "Think carefully!" encouragement pill + its `chEncourage` string are deleted — don't resurrect either.
- **SparkleBurst.tsx** small by spec (no heavy confetti); **sfx.ts** moved verbatim from the old game (playCorrect/playWrong/playComplete API).

## Castle wiring (contract unchanged from rightwrong era)
- GameQuestFlow game stage mounts it; `onComplete={() => progressStore.markVideoWatched(flow.videoId)}` EXACT literal (story smoke enumerates write sites). Complete-phase effect fires once per run; Play Again → a second markVideoWatched is an idempotent map write, harmless.
- Seams: fresh `?zone=zone2` = game mounts immediately (playingGame initial state in GameQuestFlow); `&watched=right-to-childhood` = landing card with Play again + Continue enabled.
- Landing card reuses CH_BG_URL + chTitle/chSubtitle/chPlayCta/chPlayAgain.

## Content/i18n/art conventions
- 26 `ch*` keys in UIStrings + EN + HI (Devanagari, Western numerals, no emojis). Laws hard-coded (§9.8). Distractor scenes implication-only (§9.5): tired/alone child, muted dusk palette — matches the old wrong-scene mood. Helpline digits banned in game copy (smoke regex 1098|155260|112|100).
- Illustrations: 8 old rw-* webps renamed to ch-* + 5 new generated (kites/crossing/meal/reading/selling), all 800×600 webp q82. House style = warm storybook watercolor, Indian children, NO text baked in — the generator LOVES adding shop signs/book-cover text; demand "all signboards completely blank" and expect a regen, or paint over tiny artifacts (`magick -draw "circle ..."` fixed a STOP paddle).
- CSS keyframes `ch-shake/pop/sparkle/float/star-pop/hint-pulse/score-pop` + prefers-reduced-motion off-switch.

## Smoke (scripts/childhood.smoke.ts)
Seeded-rng engine drive + content invariants + per-option asset check + REMOVAL guard: walks src/ + scripts/ asserting no /rightwrong/i anywhere (excluding itself) and no `\brw[A-Z]` keys left in strings.ts — resurrecting the old game fails the suite by design.
