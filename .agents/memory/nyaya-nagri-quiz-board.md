---
name: Nyaya Nagri quiz game-board chrome
description: Single game-board chrome for quiz/recap/scene phases, doodle backdrop placement, and layout rules from the architect review
---

# Quiz game-board chrome (Aug 2026, user-approved)

## Quiz surfaces are SILENT (user order, Aug 2026)
- The QuestPlayer narration effect must NOT speak during `pre-quiz` / `post-quiz` / `recap` — no question, no options, no answer feedback. Those phases call `stopSpeaking()` and return; scenes, activity intros, and completion messages still narrate under the Settings toggle.
- **Why:** user reported the auto-voice reading the question at quiz start as a bug ("question padh ke batane lagta hai — fix karo"). PRD §6.4 narration wording ("quiz text aloud") is SUPERSEDED here — do not resurrect quiz auto-TTS from the PRD during future narration/a11y work; settings hint copy (EN+HI) now promises quizzes stay quiet.
- **How to apply:** any new question-style surface (recap variants, new quiz modes) joins the silent list; only explicit user-initiated read-aloud affordances may voice quiz text, and only if the user asks for them.

- `GameQuizShell` + `GameAnswerButton` (top of `QuestPlayer.tsx`) are the ONE chrome for pre-quiz, post-quiz, recap AND story-scene phases. The activity phase (memory/hidden/sorting/scenario/authorities) still uses the old plain white card — proposed as a follow-up task; do not restyle unasked.
- Backdrop: `src/assets/ui/quiz-doodle-bg.webp` (in-house generated, no stock art) lives on the HUD **zone-interior overlay**, so LevelSelect + QuestPlayer + VideoQuestFlow all share it. It is NOT per-phase.
- **Why:** user asked for a colorful game look matching their reference image; all art must be CSS/in-house (watermark ban). Home-art history shows same-day rollbacks when visuals change unasked — keep this style stable.

**How to apply** (rules from the architect review, for any future board work):
- Shell height `h-[82dvh] max-h-[min(100%,780px)]` — NEVER a fixed px min-h (a `min-h-[500px]` clipped sub-540px-tall phones until removed).
- Ribbon/kicker labels come from `strings.ts` (`ribbonQuestion`/`ribbonReview`/`ribbonRecap`; scenes reuse `whatWillYouDo`); values stay sentence-case, CSS uppercases. Never hardcode EN/HI ternaries in QuestPlayer.
- Controls need ≥44px touch targets (`min-h-11`) + explicit `focus-visible` rings (leave button, answer buttons).
- The overlapping ribbon needs generous panel top padding (`pt-11 md:pt-12`) — recheck clearance whenever ribbon or panel padding changes.
