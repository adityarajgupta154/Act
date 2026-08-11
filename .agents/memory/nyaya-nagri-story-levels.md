---
name: Nyaya Nagri story level map
description: Level-map progression for Story Adventure — data-driven rules, celebration semantics, voice constraints when adding levels.
---

# Story Adventure level map (Candy-Crush progression)

**Rule:** The level map renders purely from `STORY_LEVELS`; the smoke bans level-id literals inside the map component. Adding Level N = storyData entry (5-slide arc, subtitle, HI twins) + art in `public/story/` + voice-manifest regen. No component edits.
**Why:** Task spec demanded zero per-level branches; smoke enforces it so it can't rot.
**How to apply:** If a new level seems to need map-component changes, the data model is wrong — extend `StoryLevelDef` instead.

**Celebration semantics:** unlock truth lives in progressStore (persistent); the cinematic is transient uiStore state (`celebrateStoryCompletion`), queued only on FRESH completion — overlay snapshots completed-at-entry to tell fresh from replay. Refresh after completion = cinematic skipped, unlock intact. This is by design, not a bug.

**Voice constraints when adding levels/options:**
- Map + completion screens are SILENT by voice spec — never wire narration there.
- Option leads are word-form (One–Four) and THROW beyond 4; smoke caps every CHOICE slide at 2–4 options. Want 5+? Extend the lead words first.
- Shared spoken pools (reminders etc.) must stay option-COUNT-neutral ("dono" bug: a 2-option phrasing leaked into 3-option levels). Changing a shared line invalidates its cached clips for ALL levels — old WAVs become harmless orphans, new ids regenerate lazily.

**Lock rule:** `isStoryLevelUnlockedIn` is the ONLY gate (same pattern as zones); `openStory` re-checks it, so URL seams can't bypass. `celebrateStoryCompletion` deliberately bypasses the map-open guard chain (story is closing at that instant) — keep it that way.
