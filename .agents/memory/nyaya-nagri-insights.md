---
name: Nyaya Nagri insights system
description: Non-negotiable rules for the child learning-insights feature — evidence gates, AI cache, banned-term filter, child/adult surfaces, disclosed deviations.
---

**Evidence gates count MEASURED sessions only.** The overall gate (≥8 events AND ≥2 sessions) and every confidence/evidence line derive sessions from non-practice events. **Why:** practice-only replays in a second sitting must never unlock judgements drawn from one measured session (architect-caught bypass). Regression lives in the insights smoke.

**Practice replays never count against accuracy** — they are tracked separately (practiceAttempts) and surfaced as persistence, not failure.

**AI-cache fingerprint must cover EVERY input the AI summary is built from.** v2 = events len/lastTs + zonesDone + levelsDone + badges + replay sum + streak count. **Why:** any summarized input missing from the fingerprint serves narratives computed from numbers the dashboard no longer shows. If the analyze payload grows, extend the fingerprint in lockstep (bump vN).

**aiCache is a record keyed `${language}:${audience}`** (≤4 real slots) so teacher/parent narratives never evict each other; sanitizer validates entries individually and silently drops the legacy single-object shape.

**Non-diagnostic guarantee is enforced server-side, fail-closed:** every model narrative field passes the banned-term filter (EN word-boundary stems incl. clinical conditions — schizophreni/bipolar/ocd/ptsd/deficit/…; HI substrings incl. इलाज/दवा/बाइपोलर); tripped items are DROPPED wholesale, encouragement falls back to a safe fixed line. The filter list must only ever grow. The exact refusal line lives in the Nyaya AI prompts (EN + HI) — safety smoke asserts both.

**Child surface stays non-numeric and warm** (glimpse card: counts of what they did, zone names, never percentages/labels). The pre-existing in-game "Show summary" toggle (PRD §7.8 aggregate pre/post per zone, opt-in, no per-question data) intentionally stays OUTSIDE the PIN — user-shipped feature; the per-student dashboards/report/AI live behind the PIN at /adults. The in-game summary now carries the non-diagnostic disclaimer too.

**Disclosed deviations (user-approved Option B, restate in reports):** local salted-SHA-256 PIN gate instead of backend RBAC; hintsUsed always 0 (no hint mechanic — recap/replays are the guided-help signals); attempts always 1 (single-shot engine); abandoned sessions record nothing; AI refresh only on dashboard open or manual button; server 503 only when no Gemini key.
