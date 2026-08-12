---
name: Right or Wrong? mini-game
description: "Aug 2026 playable mini-game overlay — pure DOM, no WebGL; game loop, scoring, streak, confetti, end screen"
---

# "Right or Wrong?" mini-game

## Architecture
- **`src/games/rightwrong/logic.ts`** — pure game engine, zero React, zero timers; injectable rng for deterministic smoke tests
- **`src/games/rightwrong/data.ts`** — hard-coded round content (PRD §9.8: never AI-generated); imports webp assets via Vite
- **`src/games/rightwrong/RightWrongGame.tsx`** — main overlay component (GameShell + SceneCard + end screen)
- **`src/games/rightwrong/ConfettiPop.tsx`** — 14-piece CSS-var confetti burst, no canvas/library
- **`src/games/rightwrong/sfx.ts`** — WebAudio chimes, lazy context, silent fallback

## Wiring
- `uiStore.rightWrongOpen: boolean` + `openRightWrong()` / `closeRightWrong()`
- Guard in `openRightWrong()`: no-op if transitioning / activeZoneId / activeStory (same pattern as openStoryMap)
- `HUD.tsx`: imports `RightWrongGame`, mounts `{rightWrongOpen && <RightWrongGame />}` after `<StoryOverlay />`
- `MapScreen.tsx`: purple "Right or Wrong? — Play" button above legend; calls `closeMap(); openRightWrong()`
- `main.tsx`: dev seam `?game=rightwrong` boots onboarded + opens game (same pattern as `?story=open`)
- `pages/HomePage.tsx`: seam param added to `skipLanding` check
- `progressStore.rightWrongBest: { score, stars } | null` — persisted personal best; validated at load (isRwBest); NOT in reconcileEconomy (intentional — game-local, never inflates XP/coins)
- `strings.ts`: ~25 keys added to UIStrings + both EN and HI objects (rwTitle, rwHeading, rwRound, rwOr, rwGreatChoice, rwTryAgain, rwStreakBonus, rwLawChipLabel, rwYouDidIt, rwRightsProtected, rwPlayAgain, rwBackHome, rwPlayCta, etc.)
- CSS animations in `index.css`: `rw-shake`, `rw-pop`, `rw-confetti`, `rw-float`, `rw-star-pop`

## Castle quest embedding (Aug 2026 — video era ENDED)
- zone2's interior mounts the SAME component game-FIRST via `GameQuestFlow` (`quests/gameFlows.ts` registry); the castle learning video + `public/video/` are DELETED on user order — never re-add (story smoke asserts the dir stays gone).
- Optional props `{onComplete, onContinue, onExit}` — standalone default stays `closeRightWrong`; quest complete-screen swaps buttons to Continue (primary) + Play Again.
- `onComplete` fires once in the complete-phase effect → `progressStore.markVideoWatched` (historical name, save-compat). Story smoke enumerates src/ so that stays the ONLY production write site — a second caller fails it by design.
- Seams: `?game=rightwrong` standalone; `?zone=zone2` fresh = game mounts immediately; `&watched=right-to-childhood` = landing card, Continue enabled.

## Assets
- 11 webp illustrations in `src/assets/games/rightwrong/`: `rw-{edu,play,protect,health,family}-{right,wrong}.webp` + `rw-bg.webp`
- Generated in-house (generateImage, no stock/watermark); resized to ≤800×600 at q82

## Content (5 rounds)
| id | PRD §4 act | Right scene | Wrong scene |
|----|---|---|---|
| education | Art. 21A + RTE Act 2009 | Classroom learning | Child carrying bricks |
| play | Art. 24 + Child Labour Act | Playground fun | Child washing dishes all day |
| protection | JJ Act 2015 | Safe with trusted adult | Child alone at dusk |
| health | Art. 21 + Art. 39 | Doctor checkup | Sick child alone |
| family | Art. 39(f) | Family dinner | Child ignored and alone |

## Game rules
- Score: +100 first-try correct; optional streak bonus +50 every 3rd consecutive
- Wrong pick: shake + orange border + "Try again!"; streak resets; NO score deduction (PRD §9.6 no guilt)
- After correct: 1.4s auto-advance; law fact shown; confetti + sound
- End screen: stars = first-try corrects (0–5); personal best persisted

## Smoke test
- `scripts/rightwrong.smoke.ts` — 125 checks; mocks webp imports inline (tsx can't parse binary assets as ES modules)
- Dev seam: `?game=rightwrong`

## PRD compliance
- §9.1: Get Help Now (z-50 HelpDialog) always visible above the overlay
- §9.5: wrong scenes by implication only (tired/lonely, no injury/violence)
- §9.6: no streak-guilt, no real money
- §9.8: law facts hard-coded in data.ts, never AI-generated
- DPDP: best score persisted only after consent (rides progressStore consent gate)

**Why separate from XP/coins:** deliberately outside reconcileEconomy so game-local score can never be exploited to inflate the main economy.
