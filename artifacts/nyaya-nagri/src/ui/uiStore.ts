import { useSyncExternalStore } from 'react';
import { getZone, isZoneUnlocked } from '@/world/zones';
import { getStoryLevel, isStoryLevelUnlockedIn } from '@/story/storyData';
import { primeStoryAudioInGesture } from '@/story/storyAdventureVoice';
import { progressStore } from '@/data/progressStore';
import type { LevelKind } from '@/quests/schema';

export type UIState = {
  nearbyZoneId: string | null;
  activeZoneId: string | null;
  isTransitioning: boolean;
  fadeOpacity: number;
  helpPulse: boolean;
  /** Progress dashboard overlay (Task 9). */
  progressOpen: boolean;
  /** Settings panel overlay (Task 10). */
  settingsOpen: boolean;
  /** Community screen overlay (Task 11). */
  communityOpen: boolean;
  /**
   * Get Help Now screen (Task 12). Controlled centrally so ANY surface can
   * open the SAME screen: the always-visible button, quest-end safety
   * reminder cards, and the avatar's distress escalation path (PRD §9.1).
   */
  helpOpen: boolean;
  /** Player avatar editor overlay, opened from Settings (Task 14). */
  avatarEditOpen: boolean;
  /** Avatar Shop overlay (Task 16) — cosmetic Coins shop, no real money. */
  shopOpen: boolean;
  /** Full-screen Map modal (reference redesign) — opened from the minimap. */
  mapOpen: boolean;
  /**
   * Story Adventure LEVEL MAP (Candy-Crush-style progression screen): the
   * house door opens THIS, and individual stories start from its nodes.
   * Movement freezes while open, like activeStory.
   */
  storyMapOpen: boolean;
  /**
   * Set when a story level is completed FRESH (first time ever) as the
   * player leaves the RESULT screen — the level map picks it up and plays
   * the unlock cinematic, then clears it. Transient UI state by design:
   * the unlock itself lives in progressStore.storyProgress, so a refresh
   * skips only the show, never the unlock.
   */
  storyCelebration: { completedId: string } | null;
  /**
   * Story Adventure (Aug 2026): id of the story level whose house door the
   * player is standing at (proximity prompt), else null. Set by WorldScene
   * exactly like nearbyZoneId.
   */
  nearbyStoryId: string | null;
  /**
   * The open Story Adventure overlay: level id + starting slide (0 outside
   * the DEV screenshot seam). Null when no story is open. Movement freezes
   * while set, like activeZoneId.
   */
  activeStory: { id: string; initialSlide: number } | null;
  /**
   * Task 15: the level currently being played inside the active zone, so
   * the AI companion can greet level entry (like it greets zone entry).
   * Null while on the Level-Select screen or outside a zone.
   */
  activeLevel: { zoneId: string; levelIndex: number; kind: LevelKind } | null;
  /**
   * Task 27: zone id whose certificate is open in the viewer, else null.
   * Central so BOTH My Progress and the zone-complete celebration open the
   * same viewer.
   */
  certificateZoneId: string | null;
  /**
   * "Right or Wrong?" playable mini-game overlay (Aug 2026 — jury feedback:
   * the app needed a REAL game loop, not another quiz). Pure 2D DOM overlay;
   * mounts above the Map overlay so it can be launched from the map.
   */
  rightWrongOpen: boolean;
};

let state: UIState = {
  nearbyZoneId: null,
  activeZoneId: null,
  isTransitioning: false,
  fadeOpacity: 0,
  helpPulse: false,
  progressOpen: false,
  settingsOpen: false,
  communityOpen: false,
  helpOpen: false,
  avatarEditOpen: false,
  shopOpen: false,
  mapOpen: false,
  storyMapOpen: false,
  storyCelebration: null,
  nearbyStoryId: null,
  activeStory: null,
  activeLevel: null,
  certificateZoneId: null,
  rightWrongOpen: false,
};

const listeners = new Set<() => void>();

export const uiStore = {
  getState: () => state,
  set: (patch: Partial<UIState>) => {
    state = { ...state, ...patch };
    listeners.forEach(l => l());
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};

export function useUIStore() {
  return useSyncExternalStore(uiStore.subscribe, uiStore.getState);
}

// Mutable ref for player position to avoid React re-renders on every frame
export const playerPosition = { x: 0, z: 0 };

export function enterZone(zoneId: string) {
  if (state.isTransitioning) return;
  // Enforce zone-lock rules here too, so UI checks are never the only
  // boundary — future tasks (quests) may call this directly.
  if (!getZone(zoneId) || !isZoneUnlocked(zoneId)) return;
  uiStore.set({ isTransitioning: true, fadeOpacity: 1 });
  
  setTimeout(() => {
    uiStore.set({ activeZoneId: zoneId, fadeOpacity: 0 });
    setTimeout(() => {
      uiStore.set({ isTransitioning: false });
    }, 300);
  }, 300);
}

export function enterLevel(zoneId: string, levelIndex: number, kind: LevelKind) {
  uiStore.set({ activeLevel: { zoneId, levelIndex, kind } });
}

export function clearLevel() {
  uiStore.set({ activeLevel: null });
}

export function exitZone() {
  if (state.isTransitioning) return;
  uiStore.set({ isTransitioning: true, fadeOpacity: 1, activeLevel: null });
  
  setTimeout(() => {
    uiStore.set({ activeZoneId: null, fadeOpacity: 0 });
    setTimeout(() => {
      uiStore.set({ isTransitioning: false });
    }, 300);
  }, 300);
}

/**
 * Leave the zone interior AND land on the Story Adventure map in one
 * gesture (the video-flow unlock CTA). Mirrors exitZone()'s fade exactly;
 * the map opens mid-fade so the reveal rides the same transition, while
 * openStoryMap()'s guard chain stays intact for every other caller.
 */
export function exitZoneToStoryMap() {
  if (state.isTransitioning) return;
  uiStore.set({ isTransitioning: true, fadeOpacity: 1, activeLevel: null });

  setTimeout(() => {
    uiStore.set({ activeZoneId: null, fadeOpacity: 0, storyMapOpen: true });
    setTimeout(() => {
      uiStore.set({ isTransitioning: false });
    }, 300);
  }, 300);
}

/**
 * Story Adventure entry (Aug 2026). Lock rules are enforced HERE too —
 * exactly like enterZone — so no UI path (including URL/state seams) can
 * open a locked or slide-less story level. The overlay itself animates in;
 * there is no black world-fade for the house door.
 */
export function openStory(storyId: string, initialSlide = 0) {
  if (state.isTransitioning || state.activeZoneId || state.activeStory) return;
  const level = getStoryLevel(storyId);
  if (!level || level.slides.length === 0) return;
  if (!isStoryLevelUnlockedIn(progressStore.getState(), storyId)) return;
  // Still inside the tap/E-key gesture here: unlock the ONE story audio
  // path for iOS/Safari (the Gemini clip element — the only story voice)
  // BEFORE the overlay's first auto-narration effect runs outside of it.
  primeStoryAudioInGesture();
  uiStore.set({ activeStory: { id: storyId, initialSlide } });
}

export function closeStory() {
  uiStore.set({ activeStory: null });
}

/**
 * Story Adventure LEVEL MAP (Candy-Crush-style progression): the house
 * door opens THIS selection screen — never a story directly. Same guard
 * chain as openStory; harmless to call while already open.
 */
export function openStoryMap() {
  if (state.isTransitioning || state.activeZoneId || state.activeStory) return;
  uiStore.set({ storyMapOpen: true });
}

export function closeStoryMap() {
  uiStore.set({ storyMapOpen: false, storyCelebration: null });
}

/**
 * FRESH story completion → return to the level map WITH the unlock
 * cinematic queued. Called only by StoryOverlay's leave path; replays of
 * already-completed levels never come here.
 */
export function celebrateStoryCompletion(completedId: string) {
  uiStore.set({ storyMapOpen: true, storyCelebration: { completedId } });
}

export function clearStoryCelebration() {
  uiStore.set({ storyCelebration: null });
}

export function openProgress() {
  uiStore.set({ progressOpen: true });
}

export function closeProgress() {
  uiStore.set({ progressOpen: false });
}

export function openSettings() {
  uiStore.set({ settingsOpen: true });
}

export function closeSettings() {
  uiStore.set({ settingsOpen: false });
}

export function openCommunity() {
  uiStore.set({ communityOpen: true });
}

export function closeCommunity() {
  uiStore.set({ communityOpen: false });
}

export function openHelp() {
  uiStore.set({ helpOpen: true });
}

export function closeHelp() {
  uiStore.set({ helpOpen: false });
}

export function openAvatarEdit() {
  uiStore.set({ avatarEditOpen: true });
}

export function closeAvatarEdit() {
  uiStore.set({ avatarEditOpen: false });
}

export function openMap() {
  uiStore.set({ mapOpen: true });
}

export function closeMap() {
  uiStore.set({ mapOpen: false });
}

/**
 * "Right or Wrong?" mini-game. Same guard chain as openStoryMap so no seam
 * or button can stack it over a zone interior or an open story.
 */
export function openRightWrong() {
  if (state.isTransitioning || state.activeZoneId || state.activeStory) return;
  uiStore.set({ rightWrongOpen: true });
}

export function closeRightWrong() {
  uiStore.set({ rightWrongOpen: false });
}

export function openShop() {
  uiStore.set({ shopOpen: true });
}

export function closeShop() {
  uiStore.set({ shopOpen: false });
}

export function openCertificate(zoneId: string) {
  uiStore.set({ certificateZoneId: zoneId });
}

export function closeCertificate() {
  uiStore.set({ certificateZoneId: null });
}

// DEV-ONLY test seam: the e2e browser cannot render WebGL, so it cannot
// walk the 3D world to a zone gate. Expose zone entry for tests. Stripped
// from production builds (import.meta.env.DEV is false there).
if (import.meta.env?.DEV && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__nnDebug = {
    enterZone,
    exitZone,
    openStory,
    closeStory,
    openStoryMap,
    closeStoryMap,
  };
}

export function triggerHelpPulse() {
  uiStore.set({ helpPulse: true });
  setTimeout(() => {
    uiStore.set({ helpPulse: false });
  }, 3000);
}
