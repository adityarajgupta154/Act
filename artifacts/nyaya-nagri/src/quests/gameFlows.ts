/**
 * Game-first zone flows (Aug 2026) — data-driven registry, one entry per
 * zone whose interior opens with a PLAYABLE GAME instead of the
 * level-select screen. zone2 is the "Right to Childhood" drag-and-drop
 * castle; zone1 (Safe Zone) is the "Safe Path Adventure" POCSO maze. The
 * old learning-video stage is DELETED (user order, Aug 2026) — the game IS
 * the lesson now. Adding a future zone's game lesson is data here — no UI
 * change (same registry ethos as ZONES/STORY_LEVELS).
 *
 * The videoId field name is HISTORICAL: it is the key into
 * progressStore.videosWatched (kept verbatim for save-compat — an old save
 * that watched the video keeps its unlock). Since Aug 2026 the flag is
 * EARNED by completing one full game run.
 *
 * storyLevelId pairs with the story level's unlockRequires when a flow
 * gates a Story Adventure level (zone2's castle); flows with NO story
 * reward use null — the story smoke cross-checks BOTH shapes so the
 * registries can never drift apart.
 *
 * continueTo picks what Continue unlocks after the game run: 'quiz' jumps
 * straight to the zone's final quiz (zone2 — its quest is game + quiz
 * only), 'levels' opens the zone's full level-select arc (zone1 — story,
 * decision and quiz levels stay exactly as authored).
 *
 * Game content is hard-coded in src/games/<game>/content.ts (PRD §9.8 —
 * never AI-generated at runtime).
 */
export interface ZoneGameFlow {
  /** Zone whose interior runs the game-first flow. */
  zoneId: string;
  /** progressStore.videosWatched key (historical name — see header). */
  videoId: string;
  /** Story Adventure level this flow unlocks, or null (no story reward). */
  storyLevelId: string | null;
  /** What Continue opens once the game gate is earned. */
  continueTo: 'quiz' | 'levels';
}

export const ZONE_GAME_FLOWS: ZoneGameFlow[] = [
  {
    zoneId: 'zone2',
    videoId: 'right-to-childhood',
    storyLevelId: 'right-to-childhood',
    continueTo: 'quiz',
  },
  {
    zoneId: 'zone1',
    videoId: 'safe-path-adventure',
    storyLevelId: null,
    continueTo: 'levels',
  },
];

export function getZoneGameFlow(zoneId: string): ZoneGameFlow | null {
  return ZONE_GAME_FLOWS.find((f) => f.zoneId === zoneId) ?? null;
}
