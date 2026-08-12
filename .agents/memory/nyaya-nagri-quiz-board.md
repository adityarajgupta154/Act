---
name: Nyaya Nagri quiz game-board chrome
description: Single game-board chrome for quiz/recap/scene phases, doodle backdrop placement, and layout rules from the architect review
---

# Quiz game-board chrome (Aug 2026, user-approved)

- `GameQuizShell` + `GameAnswerButton` (top of `QuestPlayer.tsx`) are the ONE chrome for pre-quiz, post-quiz, recap AND story-scene phases. The activity phase (memory/hidden/sorting/scenario/authorities) still uses the old plain white card — proposed as a follow-up task; do not restyle unasked.
- Backdrop: `src/assets/ui/quiz-doodle-bg.webp` (in-house generated, no stock art) lives on the HUD **zone-interior overlay**, so LevelSelect + QuestPlayer + VideoQuestFlow all share it. It is NOT per-phase.
- **Why:** user asked for a colorful game look matching their reference image; all art must be CSS/in-house (watermark ban). Home-art history shows same-day rollbacks when visuals change unasked — keep this style stable.

**How to apply** (rules from the architect review, for any future board work):
- Shell height `h-[82dvh] max-h-[min(100%,780px)]` — NEVER a fixed px min-h (a `min-h-[500px]` clipped sub-540px-tall phones until removed).
- Ribbon/kicker labels come from `strings.ts` (`ribbonQuestion`/`ribbonReview`/`ribbonRecap`; scenes reuse `whatWillYouDo`); values stay sentence-case, CSS uppercases. Never hardcode EN/HI ternaries in QuestPlayer.
- Controls need ≥44px touch targets (`min-h-11`) + explicit `focus-visible` rings (leave button, answer buttons).
- The overlapping ribbon needs generous panel top padding (`pt-11 md:pt-12`) — recheck clearance whenever ribbon or panel padding changes.
