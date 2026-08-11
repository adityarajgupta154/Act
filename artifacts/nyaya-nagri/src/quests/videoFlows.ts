/**
 * Video-first zone flows (Aug 2026) — data-driven registry, one entry per
 * zone whose interior runs VIDEO → final quiz instead of the level-select
 * screen (the Right to Childhood castle). Adding a future zone's video
 * lesson is data here + an mp4 under public/video/ — no UI change (same
 * registry ethos as ZONES/STORY_LEVELS).
 *
 * The videoId doubles as the progressStore.videosWatched key and pairs
 * with the story level's unlockRequires; the story smoke cross-checks the
 * two registries so they can never drift apart. The video file is static
 * fixed content served verbatim from public/ (like public/story/ art) —
 * never fetched from an API, never AI-generated at runtime (PRD §9.8).
 */
export interface ZoneVideoFlow {
  /** Zone whose interior runs the video-first flow. */
  zoneId: string;
  /** progressStore.videosWatched key — NOT necessarily the zone id. */
  videoId: string;
  /** File under public/video/, served verbatim. */
  videoFile: string;
  /** Story Adventure level this flow unlocks (storyData unlockRequires). */
  storyLevelId: string;
}

export const ZONE_VIDEO_FLOWS: ZoneVideoFlow[] = [
  {
    zoneId: 'zone2',
    videoId: 'right-to-childhood',
    videoFile: 'right-to-childhood.mp4',
    storyLevelId: 'right-to-childhood',
  },
];

export function getZoneVideoFlow(zoneId: string): ZoneVideoFlow | null {
  return ZONE_VIDEO_FLOWS.find((f) => f.zoneId === zoneId) ?? null;
}

/** URL under public/video/ (BASE_URL optional-chained for the tsx smoke). */
export function zoneVideoUrl(flow: ZoneVideoFlow): string {
  return `${import.meta.env?.BASE_URL ?? '/'}video/${flow.videoFile}`;
}

/**
 * Watch-credit tracker (pure — the story smoke unit-tests it directly).
 * "Watched" must mean the child actually SAW the lesson: native controls
 * stay (pause/replay/volume are kid-friendly), but credit accrues only
 * during real playback. Seeks re-baseline without credit, and timeupdate
 * jumps bigger than WATCH_TICK_MAX_S earn nothing even if the seeking
 * event was swallowed — so dragging to the end + onEnded unlocks nothing.
 * Completion = accumulated playback >= duration - WATCH_END_TOLERANCE_S
 * (timeupdate granularity must not cost a legitimate watcher the flag).
 */
export const WATCH_TICK_MAX_S = 2;
export const WATCH_END_TOLERANCE_S = 3;

export interface WatchTracker {
  /** Feed every timeupdate (and a final pass on ended); true = completed. */
  onTime(currentTime: number, duration: number): boolean;
  /** Feed seeking so jumps re-baseline without credit. */
  onSeek(currentTime: number): void;
  watchedSeconds(): number;
}

export function createWatchTracker(): WatchTracker {
  let last: number | null = null;
  let credit = 0;
  return {
    onTime(currentTime, duration) {
      if (last != null) {
        const dt = currentTime - last;
        if (dt > 0 && dt <= WATCH_TICK_MAX_S) credit += dt;
      }
      last = currentTime;
      return (
        Number.isFinite(duration) &&
        duration > 0 &&
        credit >= Math.max(0, duration - WATCH_END_TOLERANCE_S)
      );
    },
    onSeek(currentTime) {
      last = currentTime;
    },
    watchedSeconds: () => credit,
  };
}
