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

## Entrance door is LOCKED too (user order, Aug 2026)
The world's Story Adventure house starts locked and is not a free surface.
**Rule:** one pure predicate in the story data module — "some level done OR some level playable" — decides the entrance; on a fresh save the castle-gated first level keeps it false, so the door shows the monuments' red padlock (shared baked texture) and the HUD prompt renders the ProximityPrompt-style locked card (no CTA).
**Why:** user order ("story adventure ko lock kr do") right after they made zone2 always-unlocked — the intended first stop is the Right to Childhood castle, not the story house.
**How to apply:** enforcement lives in the story-map opener (same boundary role as enterZone) so house tap, E key, HUD button AND dev seams all fail closed; the castle-exit CTA re-checks at reveal time and falls back to a plain world exit. Screenshot seams must seed `&zones=zone2&watched=right-to-childhood` to photograph the open map. Never add a second lock check UI-side that could drift — derive.
