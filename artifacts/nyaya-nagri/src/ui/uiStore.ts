import { useSyncExternalStore } from 'react';
import { getZone, isZoneUnlocked } from '@/world/zones';

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

export function exitZone() {
  if (state.isTransitioning) return;
  uiStore.set({ isTransitioning: true, fadeOpacity: 1 });
  
  setTimeout(() => {
    uiStore.set({ activeZoneId: null, fadeOpacity: 0 });
    setTimeout(() => {
      uiStore.set({ isTransitioning: false });
    }, 300);
  }, 300);
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

export function triggerHelpPulse() {
  uiStore.set({ helpPulse: true });
  setTimeout(() => {
    uiStore.set({ helpPulse: false });
  }, 3000);
}
