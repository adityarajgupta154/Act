---
name: Nyaya Nagri build protocol
description: How the user drives this project — strict task-by-task flow with PRD re-reads and non-negotiable safety rules.
---

The user pastes ONE task prompt at a time (Task 0 → 24) from `attached_assets/Replit_ClaudeFable_Build_Prompts_MASTER_*.md`. Do not skip ahead or rebuild earlier work.

**Why:** the user explicitly demanded this structure to prevent drift across a 25-task build for a Smart India Hackathon prototype.

**How to apply, before every task:**
1. Re-read `attached_assets/PRD_NyayaNagri_MASTER_*.md` §9 (ethical/safety) always, and §4 (legal content matrix) whenever the task touches legal content — do not rely on memory of a prior read.
2. After each task, report: (a) PRD sections referenced, (b) what was built/tested, (c) any task-vs-PRD conflicts.
3. Non-negotiable, every task: "Get Help Now" button (Childline 1098 | Cyber Crime 155260) visible + instant on every screen; zero PII ever (no real names/photos/camera); every AI character escalates to Childline 1098/Get Help on real distress disclosure — never counsels; no unmoderated chat; no real money; sensitive topics by implication only, always empowering resolution; AI-generated variation must never alter legal facts, answer correctness, quiz content, or helpline text.
4. UI consistency self-check at end of every task: same palette, type scale, spacing, interaction style as earlier tasks (theme lives in `artifacts/nyaya-nagri/src/index.css`; fonts: Fredoka display + Nunito body; warm amber/orange primary, sky blue + green accents).
5. The original prompts assume plain JS/Three.js; this repo maps them onto the react-vite artifact `artifacts/nyaya-nagri` with R3F, folders `src/world|avatar|quests|ui|i18n|data`, progress store singleton at `src/data/progressStore.ts` (in-memory adapter, swap-able). Claude API tasks (Task 2+) should use Replit AI integration server-side via `artifacts/api-server`.
