/**
 * StoryAdventureGeminiVoiceController (storyAdventureVoice) — the ONE and
 * ONLY voice engine for Story Adventure (strict single-voice spec).
 *
 * Plays the warm Gemini narrator voice served by the api-server's
 * /story-adventure-voice/tts route (segment-id in, audio/wav out — the
 * server only speaks manifest lines, never free text; no API key is ever
 * in the frontend). Every Story Adventure sound — slide narration, the
 * question + both options + "your turn" cue, feedback and the varied
 * reminders — flows through this controller and nothing else.
 *
 * HARD RULES (strict spec §1/§6/§12/§13):
 *  - NO fallback voice engine, EVER. Browser/device TTS is gone
 *    from the story path entirely. If Gemini audio cannot be produced or
 *    played, this controller goes SILENT, publishes `unavailable` into the
 *    shared narration state, and the overlay shows a child-friendly
 *    "tap to retry" chip. The retry re-attempts GEMINI — never another
 *    engine.
 *  - ONE audio output: speak() supersedes (epoch) and hard-stops whatever
 *    was playing; stale sequence callbacks are discarded by the epoch
 *    guard, so a previous slide can never speak over the next one.
 *  - stop() kills playback the same instant the child taps ANYTHING.
 *  - Chat panel open (setNarrationSuspended) hard-stops this engine via
 *    the narration-state suspend registry; suspended speak() calls are
 *    silent no-ops WITHOUT onDone (nothing advances behind the panel).
 *  - Headless / no-Audio environments (tsx smokes) complete silently but
 *    DO fire onDone, so the slide state machine stays testable — silence
 *    is not a second voice.
 *
 * Failure handling (spec §7): an active-sequence fetch failure starts a
 * short cooldown (no fetch storms against a dead upstream) and flags
 * `unavailable`; an autoplay-blocked play() flags `unavailable` without a
 * cooldown (the fetch path is healthy — only the element was blocked, and
 * the retry tap itself is the unlocking gesture). retryVoice() clears the
 * cooldown + flag and re-primes the element inside the tap.
 *
 * Performance: all segments of a sequence fetch in PARALLEL while playback
 * runs in order, a session Map caches decoded clips, and preload() warms
 * upcoming slides/feedback so taps feel instant (server also disk-caches,
 * so a warm server answers every fetch in milliseconds).
 */
import type { Language } from '@/data/settingsStore';
import {
  isNarrationSuspended,
  onNarrationSuspended,
  isStorySpeaking,
  setStorySpeaking,
  setStoryVoicePreparing,
  setStoryVoiceUnavailable,
} from './storyNarrationState';
import type { StorySegment } from './storyVoiceSegments';

const TTS_PATH = 'api/story-adventure-voice/tts';
const SEGMENT_GAP_MS = 600; // natural pause between segments
const FETCH_TIMEOUT_MS = 12_000;
const DEGRADE_COOLDOWN_MS = 60_000;
const PLAY_SAFETY_CAP_MS = 90_000;

/** ~100-byte silent WAV — used ONLY to unlock the element inside a gesture. */
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

type SpeakOptions = { onDone?: () => void };

let epoch = 0;
let gapTimer: ReturnType<typeof setTimeout> | null = null;
let audioEl: HTMLAudioElement | null = null;
let currentFinish: ((r: 'done' | 'stale' | 'failed') => void) | null = null;
let degradedUntil = 0;
let primed = false;
let prepTimer: ReturnType<typeof setTimeout> | null = null;
const clipCache = new Map<string, Promise<Blob | null>>();

/** DEV-only pipeline diagnostics (§1) — never logs keys or spoken text. */
const vlog = (...args: unknown[]) => {
  if (import.meta.env?.DEV) console.debug('[story-voice]', ...args);
};

function clearPrepTimer(): void {
  if (prepTimer !== null) clearTimeout(prepTimer);
  prepTimer = null;
}

/** Gemini audio path available at all (browser with Audio + fetch)? */
function hasAudioPath(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof Audio !== 'undefined' &&
    typeof fetch === 'function'
  );
}

function getAudioEl(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = 'auto';
    // iOS: keep playback inline (no fullscreen takeover for audio).
    audioEl.setAttribute('playsinline', 'true');
  }
  return audioEl;
}

function clearGap(): void {
  if (gapTimer !== null) clearTimeout(gapTimer);
  gapTimer = null;
}

function segmentUrl(id: string): string {
  const base = import.meta.env?.BASE_URL ?? '/';
  return `${base}${TTS_PATH}?id=${encodeURIComponent(id)}`;
}

async function fetchClipOnce(id: string): Promise<Blob | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(segmentUrl(id), { signal: controller.signal });
    if (!res.ok) {
      // §6: surface the ACTUAL upstream reason (quota, busy, missing id…)
      // instead of a silent generic failure.
      const body = await res.text().catch(() => '');
      vlog('clip fetch failed', id, `HTTP ${res.status}`, body.slice(0, 140));
      return null;
    }
    const blob = await res.blob();
    if (blob.size <= 44) {
      // must be more than a WAV header
      vlog('clip fetch returned empty audio', id, `${blob.size}B`);
      return null;
    }
    return blob;
  } catch (e) {
    vlog('clip fetch aborted/errored', id, e instanceof Error ? e.name : String(e));
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Cached fetch. The ACTIVE sequence retries a failed clip once (server
 * already retries upstream); preloads are single-shot so background
 * warming never doubles the load on a struggling upstream.
 */
function loadClip(id: string, retry: boolean): Promise<Blob | null> {
  const existing = clipCache.get(id);
  if (existing) return existing;
  const p = (async () => {
    const first = await fetchClipOnce(id);
    if (first) return first;
    if (!retry) {
      clipCache.delete(id);
      return null;
    }
    const second = await fetchClipOnce(id);
    if (!second) clipCache.delete(id); // never cache a failure
    return second;
  })();
  clipCache.set(id, p);
  return p;
}

/** Play one clip through the shared element; resolves when it ends. */
function playClip(blob: Blob, myEpoch: number): Promise<'done' | 'stale' | 'failed'> {
  return new Promise((resolve) => {
    const el = getAudioEl();
    const url = URL.createObjectURL(blob);
    let settled = false;
    let safety: ReturnType<typeof setTimeout> | null = null;
    const finish = (r: 'done' | 'stale' | 'failed') => {
      if (settled) return;
      settled = true;
      if (safety !== null) clearTimeout(safety);
      if (currentFinish === finish) currentFinish = null;
      el.onended = null;
      el.onerror = null;
      URL.revokeObjectURL(url);
      resolve(r);
    };
    currentFinish = finish;
    el.onended = () => finish(myEpoch === epoch ? 'done' : 'stale');
    el.onerror = () => finish(myEpoch === epoch ? 'failed' : 'stale');
    safety = setTimeout(() => finish('stale'), PLAY_SAFETY_CAP_MS);
    el.src = url;
    el.play().catch(() => finish(myEpoch === epoch ? 'failed' : 'stale'));
  });
}

/** Stop Gemini playback (the only story audio that exists). */
function stopPlayback(): void {
  epoch++;
  clearGap();
  clearPrepTimer();
  currentFinish?.('stale');
  if (audioEl) {
    audioEl.pause();
    audioEl.removeAttribute('src');
  }
  setStorySpeaking(false);
  setStoryVoicePreparing(false);
}

// Chat panel open → this engine goes quiet (ONE voice at a time).
onNarrationSuspended((suspended) => {
  if (suspended) stopPlayback();
});

/** Flag the outage for the overlay's retry chip. NEVER a fallback voice. */
function markUnavailable(): void {
  clearPrepTimer();
  setStoryVoicePreparing(false);
  setStorySpeaking(false);
  setStoryVoiceUnavailable(true);
}

export const storyAdventureVoice = {
  /**
   * Speak the segments in order (Gemini voice), superseding anything
   * playing. On failure the sequence STOPS SILENT and the retry chip
   * state is published — onDone is NOT fired for a failed sequence, so
   * reminder clocks never run while the voice is down (spec §6/§7/§11).
   */
  speak(segments: StorySegment[], language: Language, opts: SpeakOptions = {}): void {
    void language; // segment ids already carry the language twin
    const myEpoch = ++epoch;
    clearGap();
    currentFinish?.('stale');
    if (audioEl) audioEl.pause();
    const list = segments.filter((s) => s.text.trim().length > 0);
    if (list.length === 0) {
      setStorySpeaking(false);
      return;
    }
    if (isNarrationSuspended()) {
      setStorySpeaking(false);
      return; // suspended = silent, no onDone — nothing advances
    }
    if (!hasAudioPath()) {
      // Headless env (tsx smokes): complete silently so the slide state
      // machine still advances. Silence — not another voice engine.
      setStorySpeaking(false);
      opts.onDone?.();
      return;
    }
    if (Date.now() < degradedUntil) {
      // Cooling down after a dead upstream: stay silent, keep the retry
      // chip up. No fetch storm, no fallback voice, no onDone.
      markUnavailable();
      return;
    }
    // §12: neutral "voice is being prepared" indicator while the FIRST
    // clip is fetched/generated — published only if it actually takes a
    // moment (no flash on cache hits) and NEVER as an error state.
    clearPrepTimer();
    prepTimer = setTimeout(() => {
      if (myEpoch === epoch) setStoryVoicePreparing(true);
    }, 300);
    // Warm every fetch in parallel; play strictly in order.
    for (const s of list) void loadClip(s.id, true);
    const playFrom = async (i: number): Promise<void> => {
      if (myEpoch !== epoch) return;
      if (i >= list.length) {
        setStorySpeaking(false);
        opts.onDone?.();
        return;
      }
      const blob = await loadClip(list[i].id, true).catch(() => null);
      if (myEpoch !== epoch) return;
      if (!blob) {
        // Fetch (with retries) failed → cool down + retry chip. The
        // sequence ends HERE, silent — never a substitute voice (§6).
        degradedUntil = Date.now() + DEGRADE_COOLDOWN_MS;
        markUnavailable();
        console.warn(
          '[story-voice] Gemini narration unavailable — retry chip shown (no fallback voice by spec)',
        );
        return;
      }
      clearPrepTimer();
      setStoryVoicePreparing(false);
      setStorySpeaking(true);
      setStoryVoiceUnavailable(false); // audio really started — outage over
      vlog('playing', list[i].id);
      const result = await playClip(blob, myEpoch);
      if (myEpoch !== epoch || result === 'stale') return;
      if (result === 'failed') {
        // Playback refused (e.g. autoplay policy) — no cooldown: the
        // fetch path is healthy, only THIS element play was blocked.
        // The retry chip's tap is itself the gesture that unlocks it.
        markUnavailable();
        return;
      }
      setStorySpeaking(false);
      gapTimer = setTimeout(() => void playFrom(i + 1), SEGMENT_GAP_MS);
    };
    void playFrom(0);
  },

  /** Hard-stop story audio NOW (there is only the Gemini clip to stop). */
  stop(): void {
    stopPlayback();
  },

  /** Warm the cache for upcoming segments (next slide, feedback branches). */
  preload(segments: StorySegment[]): void {
    if (!hasAudioPath() || Date.now() < degradedUntil) return;
    for (const s of segments) void loadClip(s.id, false);
  },

  isSpeaking(): boolean {
    return isStorySpeaking();
  },

  /** True when the Gemini audio path can exist at all (browser). */
  available(): boolean {
    return hasAudioPath();
  },

  /**
   * Child tapped the retry chip: clear the cooldown + outage flag and
   * re-unlock the audio element inside THIS tap's gesture, then the
   * caller replays the current situation — through Gemini, only ever
   * Gemini (spec §7).
   */
  retryVoice(): void {
    degradedUntil = 0;
    setStoryVoiceUnavailable(false);
    primed = false;
    primeStoryAudioInGesture();
  },

  /**
   * DEV seam only (?story=open&voice=down): simulate a dead upstream so
   * the retry chip can be screenshotted/e2e-tested deterministically.
   */
  simulateOutage(): void {
    degradedUntil = Date.now() + DEGRADE_COOLDOWN_MS;
    setStoryVoiceUnavailable(true);
  },
};

/**
 * iOS/Safari unlock for the SHARED story audio element: programmatic
 * .play() outside a gesture is blocked until the element has played once
 * inside one. Called synchronously from the story-entry gesture
 * (uiStore.openStory) and from retryVoice()'s chip tap. The silent
 * data-URI clip is ~0s long and inaudible; nothing else is touched.
 */
export function primeStoryAudioInGesture(): void {
  if (primed || !hasAudioPath()) return;
  primed = true;
  try {
    const el = getAudioEl();
    el.muted = true;
    el.src = SILENT_WAV;
    const p = el.play();
    void p
      ?.catch(() => {
        /* blocked prime is fine — first real play simply needs a tap */
      })
      .finally(() => {
        el.muted = false;
      });
  } catch {
    /* priming must never break story entry */
  }
}
