---
name: Task 26 level-flow rollout
description: Zone3 (School Rights) is the approved reference for the 4-level zone flow; remaining 6 zones pend user confirmation. Transform recipe + content rules.
---

**Status:** zone3 (all 3 bands, EN+HI) restructured and verified as the Task 26 reference. The OTHER 6 zones must NOT be touched until the user explicitly confirms the reference.

**Target flow per zone:** L1 story = pure narration (zero-choice scenes advanced by `next`, single Continue button) -> L2 decision = ALL original branching scenes -> L3 mini-game -> L4 quiz (quiz UI only here; passing completes zone).

**Transform recipe (per quest JSON, EN + hi/ mirror):**
- Prepend 2 NEW narration intro scenes `intro1`->`intro2`->`scene1` (`choices: []`, framing only — ZERO new legal claims; facts for any new activity cards must be derived from existing scenes/quiz).
- levels: `level1` story = [intro1,intro2]; `level2` decision = all original scenes (entry scene1, original internal links stay valid); existing activity level kept VERBATIM if present, else add one; `level3` quiz stays last.
- **Why keep old levelIds (level1/level2/level3):** levelProgress keys `zoneN:levelX` in old saves keep their semantics; completed zones stay completed.
- HI mirror: same sceneIds/next/bucket order, informal-tum Devanagari, Western numerals.

**Engine/schema rules now enforced (do not regress):**
- Story/decision levels ALWAYS start phase `scenes`; classic `startQuest` keeps pre/post measurement; quiz with no baseline: pre=null (never fake 0), no recap; old saves with baseline still recap.
- Narration `next`: same link rules as choices + must move FORWARD in level scene order + every level scene reachable from entry (validator rejects self-cycle/backward/stranded — architect-mandated, negative tests in levels.smoke 3c).

**Disclosed deviations (user-accepted framing for zone3, reuse for others):** activity variety intra-zone OK (memory vs sorting); sorting buckets FIXED safe/tell/emergency (labels in i18n, not JSON); L2 = multiple existing decision scenes, not one decision point; quiz completion stays gentle (no pass threshold).

**How to apply:** when user confirms, run the same transform for the 6 remaining zones (script pattern was /tmp/task26_transform.mjs — regenerate; embed per-zone intro content, keep existing activity levels verbatim, add activities only where a band has 3 levels).
