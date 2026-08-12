/**
 * Game-first zone flows (Aug 2026) — data-driven registry, one entry per
 * zone whose interior runs the "Right or Wrong?" MINI-GAME → final quiz
 * instead of the level-select screen (the Right to Childhood castle). The
 * old learning-video stage is DELETED (user order, Aug 2026) — the game IS
 * the lesson now. Adding a future zone's game lesson is data here — no UI
 * change (same registry ethos as ZONES/STORY_LEVELS).
 *
 * The videoId field name is HISTORICAL: it is the key into
 * progressStore.videosWatched (kept verbatim for save-compat — an old save
 * that watched the video keeps its unlock) and pairs with the story
 * level's unlockRequires; the story smoke cross-checks the two registries
 * so they can never drift apart. Since Aug 2026 the flag is EARNED by
 * completing one full game run. Game content is hard-coded in
 * src/games/rightwrong/data.ts (PRD §9.8 — never AI-generated at runtime).
 */
export interface ZoneGameFlow {
  /** Zone whose interior runs the game-first flow. */
  zoneId: string;
  /** progressStore.videosWatched key (historical name — see header). */
  videoId: string;
  /** Story Adventure level this flow unlocks (storyData unlockRequires). */
  storyLevelId: string;
}

export const ZONE_GAME_FLOWS: ZoneGameFlow[] = [
  {
    zoneId: 'zone2',
    videoId: 'right-to-childhood',
    storyLevelId: 'right-to-childhood',
  },
];

export function getZoneGameFlow(zoneId: string): ZoneGameFlow | null {
  return ZONE_GAME_FLOWS.find((f) => f.zoneId === zoneId) ?? null;
}
