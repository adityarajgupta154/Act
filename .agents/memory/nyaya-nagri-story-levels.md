---
name: Nyaya Nagri story level map
description: Level-map progression for Story Adventure — data-driven rules, celebration semantics, voice constraints when adding levels.
---

# Story Adventure level map (Candy-Crush progression)

**Rule:** The level map renders purely from `STORY_LEVELS`; the smoke bans level-id literals inside the map component. Adding Level N = storyData entry (5-slide arc, subtitle, HI twins) + art in `public/story/` + voice-manifest regen. No component edits.
**Why:** Task spec demanded zero per-level branches; smoke enforces it so it can't rot.
**How to apply:** If a new level seems to need map-component changes, the data model is wrong — extend `StoryLevelDef` instead.

**Celebration semantics:** unlock truth lives in progressStore (persistent); the cinematic is transient uiStore state (`celebrateStoryCompletion`), queued only on FRESH completion — overlay snapshots completed-at-entry to tell fresh from replay. Refresh after completion = cinematic skipped, unlock intact. This is by design, not a bug.

**Castle-gated unlock (Aug 2026; video era ENDED same month, user order):** `unlockRequires: {zoneId, videoId}` on a level DERIVES its unlock from `completedZones[zoneId] && videosWatched[videoId]` — never a stored boolean, so it survives refresh for free. `videosWatched` / `markVideoWatched` / `videoId` are HISTORICAL NAMES kept verbatim for save-compat: the learning video is DELETED and the gate is now EARNED by completing one full "Right or Wrong?" game run (`GameQuestFlow` onComplete → idempotent `markVideoWatched`; old video-earned saves keep their unlocks). `ZONE_GAME_FLOWS` (quests/gameFlows.ts) is the twin registry routing that zone's interior to GAME → final-quiz → unlock-card (`GameQuestFlow`); the story smoke cross-checks the two registries, enumerates src/ so the game callback stays the ONLY production write site, asserts fresh entry mounts the game (never the quiz), Continue `disabled={!gameDone`, and `public/video/` stays deleted. Re-entry with the flag set lands on a landing card (replay optional). The seek-proof watch-credit tracker died with the video — do not resurrect. Future castle zones = one registry entry — no UI edits.

**Teaser semantics:** `slides: []` = the level may show UNLOCKED on the map, but `openStory` refuses slide-less levels (fail-closed) — tap flashes a coming-soon chip (`mapNote: 'locked' | 'soon'` drives the two chip variants). Shipping the content later = fill slides + art + voice regen; zero flow edits.

**Voice constraints when adding levels/options:**
- Map + completion screens are SILENT by voice spec — never wire narration there.
- Option leads are word-form (One–Four) and THROW beyond 4; smoke caps every CHOICE slide at 2–4 options. Want 5+? Extend the lead words first.
- Shared spoken pools (reminders etc.) must stay option-COUNT-neutral ("dono" bug: a 2-option phrasing leaked into 3-option levels). Changing a shared line invalidates its cached clips for ALL levels — old WAVs become harmless orphans, new ids regenerate lazily.

**Lock rule:** `isStoryLevelUnlockedIn(snapshot, id)` is the ONLY gate — pure function over `{storyProgress, completedZones?, videosWatched?}` (progressStore state satisfies it structurally); `openStory` re-checks it AND refuses slide-less levels, so URL seams can't bypass either gate. `celebrateStoryCompletion` deliberately bypasses the map-open guard chain (story is closing at that instant) — keep it that way.
