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
6. AI chat safety architecture (established Task 2, REUSE for every future AI persona per PRD §7.4): server-side route in `artifacts/api-server/src/routes/avatar/` with (a) deterministic INPUT gate scanning ALL client text (message + history, English + Hinglish + Devanagari lexicon in safety.ts) before any model call, (b) OUTPUT gate replacing any model reply that mentions a helpline with the hard-coded ESCALATION_REPLY, (c) client history never forwarded as real conversation turns — quoted as labelled untrusted data in a single user message. Stateless, no chat persistence (DPDP data minimization). Known accepted limitation: ageBand/zoneId are client-supplied (no auth system by design); safe because all zone scopes are pre-approved content.
7. Quest Engine architecture (Task 3, REUSE for all zone content Tasks 4+): pure reducer state machine in `src/quests/engine.ts` (pre-quiz silent baseline → scenes → post-quiz → complete; finalizeQuest is the ONLY side-effect and only write path — quitting records nothing). Content = static JSON per zone+ageBand in `src/quests/content/`, registered in `registry.ts` (exact band match, temporary any-band fallback until all 15 quests exist — then remove fallback per review). Never show the pre-quiz score/correctness to the child; per PRD §9.8 quest content stays hard-coded, never AI-generated. Smoke test: `pnpm dlx tsx scripts/engine.smoke.ts`.
8. The Screenshot tool's headless browser CANNOT create a WebGL context — screenshots of this app always show "Error creating WebGL context". Do not treat that as an app bug and do not retry screenshots of 3D routes; verify via typecheck + the user's browser console logs instead (the user's real browser renders WebGL fine).

## Task 13+ standing invariant: consent gates ALL device persistence
Guardian consent (onboarding) gates every localStorage write — progress AND
settings (even language picked during onboarding stays in memory until
consent; settingsStore.flush() runs right after completeOnboarding()).
Consent copy must disclose the external AI service for guide messages and
ask guardians to remind children not to share personal details. Any new
persisted store in Tasks 14-24 must gate on hasRecordedConsent().
**Why:** architect review failed Task 13 for a pre-consent settings write and
an incomplete disclosure — DPDP data-minimization is a hard PRD §9.4 rule.
