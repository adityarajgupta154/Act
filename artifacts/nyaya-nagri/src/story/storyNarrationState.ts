/**
 * Nyaya Nagri — Story Adventure narration STATE (no audio engine here).
 *
 * The tiny pub-sub store shared by the story voice stack and the two UI
 * surfaces that react to it (the story overlay controls + the assistant
 * bubble). Extracted from the old storyVoice.ts when the device-voice
 * (browser TTS) engine was REMOVED: Story Adventure speaks through
 * exactly ONE engine — the Gemini controller in storyAdventureVoice.ts —
 * and this module is deliberately engine-free so nothing else can ever
 * grow a second voice path around it (strict single-voice spec §1/§16).
 *
 * State:
 *  - speaking:    true while a Gemini story clip is playing (avatar pulse,
 *                 replay-button pulse).
 *  - suspended:   true while the Nyaya AI chat panel is open — the
 *                 assistant owns the speakers then; the story engine
 *                 registers via onNarrationSuspended and hard-stops.
 *  - unavailable: true after Gemini narration failed (fetch dead, quota
 *                 cooldown, autoplay-blocked). The overlay shows the
 *                 child-friendly "tap to retry" chip while this is set —
 *                 NEVER a fallback voice (strict spec §6/§7).
 */
import { useSyncExternalStore } from 'react';

export type NarrationVoiceState = {
  /** True while a story clip is being spoken (drives the avatar pulse). */
  speaking: boolean;
  /**
   * True while the Nyaya AI chat panel is open: the assistant's own voice
   * owns the speakers then, so story narration stops and stays quiet
   * until the panel closes (ONE voice at a time, ever).
   */
  suspended: boolean;
  /**
   * True after the Gemini story voice failed to produce audio. The story
   * overlay renders the retry chip; a successful clip start clears it.
   */
  unavailable: boolean;
  /**
   * True while the FIRST Gemini clip of the current read is still being
   * fetched/generated (strict spec §12): the overlay shows a NEUTRAL
   * "voice is being prepared" chip — never the error chip — during this
   * window. Cleared the moment audio starts, fails, or is superseded.
   */
  preparing: boolean;
};

let voiceState: NarrationVoiceState = {
  speaking: false,
  suspended: false,
  unavailable: false,
  preparing: false,
};
const listeners = new Set<() => void>();

function publish(patch: Partial<NarrationVoiceState>): void {
  voiceState = { ...voiceState, ...patch };
  listeners.forEach((l) => l());
}

/** Subscribe-able narration state for the overlay + assistant bubble. */
export function useNarrationVoiceState(): NarrationVoiceState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => voiceState,
    () => voiceState,
  );
}

const suspendListeners = new Set<(suspended: boolean) => void>();

/**
 * The Gemini story controller registers here so a chat-open suspend
 * hard-stops it immediately (the store itself never touches audio).
 * Returns an unsubscribe.
 */
export function onNarrationSuspended(cb: (suspended: boolean) => void): () => void {
  suspendListeners.add(cb);
  return () => suspendListeners.delete(cb);
}

/** Current suspend flag (true while the chat panel owns the speakers). */
export function isNarrationSuspended(): boolean {
  return voiceState.suspended;
}

/** Current speaking flag (the Gemini controller's isSpeaking source). */
export function isStorySpeaking(): boolean {
  return voiceState.speaking;
}

/**
 * INTERNAL to the story voice subsystem: the Gemini controller publishes
 * its playback into this flag, so the overlay pulse and the assistant
 * bubble keep their single subscription.
 */
export function setStorySpeaking(speaking: boolean): void {
  if (voiceState.speaking !== speaking) publish({ speaking });
}

/**
 * INTERNAL to the story voice subsystem: the Gemini controller flags a
 * failed narration here (and clears it when audio actually starts).
 */
export function setStoryVoiceUnavailable(unavailable: boolean): void {
  if (voiceState.unavailable !== unavailable) publish({ unavailable });
}

/**
 * INTERNAL to the story voice subsystem: the Gemini controller publishes
 * the §12 "audio being prepared" window here (neutral loading chip).
 */
export function setStoryVoicePreparing(preparing: boolean): void {
  if (voiceState.preparing !== preparing) publish({ preparing });
}

/** The chat panel calls this on open/close (and cleanup on unmount). */
export function setNarrationSuspended(suspended: boolean): void {
  if (voiceState.suspended === suspended) return;
  publish({ suspended });
  // Registered engines stop themselves — state stays engine-free.
  suspendListeners.forEach((cb) => cb(suspended));
}
