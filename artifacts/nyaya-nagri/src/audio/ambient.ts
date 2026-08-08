/**
 * Nyaya Nagri — Ambient background audio (Task 13)
 *
 * Plays a single calm, instrumental loop (public/audio/ambient.mp3) at low
 * volume under the whole experience. Design rules:
 *  - Non-distracting: quiet volume, gentle instrumental content only.
 *  - Mutable any time via the Settings panel (settings.ambientSound).
 *  - Browser autoplay policies block audio before a user gesture, so
 *    playback only starts after the first pointer/key interaction — the
 *    onboarding buttons naturally provide that gesture.
 *  - Fails silently: missing file / blocked audio never breaks the app.
 */
import { settingsStore } from '@/data/settingsStore';

const AMBIENT_URL = `${import.meta.env.BASE_URL}audio/ambient.mp3`;
const AMBIENT_VOLUME = 0.12;

let audio: HTMLAudioElement | null = null;
let gestureSeen = false;
let initialized = false;

function ensureAudio(): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null;
  if (!audio) {
    audio = new Audio(AMBIENT_URL);
    audio.loop = true;
    audio.volume = AMBIENT_VOLUME;
    audio.preload = 'auto';
  }
  return audio;
}

function sync(): void {
  if (!gestureSeen) return;
  const a = ensureAudio();
  if (!a) return;
  if (settingsStore.getState().ambientSound) {
    // play() can reject (autoplay policy, missing file) — never surface it.
    void a.play().catch(() => {});
  } else {
    a.pause();
  }
}

/** Call once at app boot (main.tsx). Safe in non-browser contexts. */
export function initAmbientAudio(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const onFirstGesture = () => {
    gestureSeen = true;
    sync();
  };
  window.addEventListener('pointerdown', onFirstGesture, { once: true });
  window.addEventListener('keydown', onFirstGesture, { once: true });

  settingsStore.subscribe(() => sync());
}
