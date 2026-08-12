/**
 * Tiny WebAudio chimes for the "Right to Childhood" drag-and-drop game —
 * no audio assets, no external dependencies (keep sound modular).
 *
 * Every call is a silent no-op when audio is unavailable; sound must never
 * block or break gameplay. The context is created lazily INSIDE a user
 * gesture (a card tap), which satisfies browser autoplay policies.
 */

let ctx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
    return ctx;
  } catch {
    return null;
  }
}

/** One soft enveloped note. Peak volumes stay LOW — this is a children's app. */
function tone(
  c: AudioContext,
  freq: number,
  at: number,
  dur = 0.18,
  type: OscillatorType = 'sine',
  peak = 0.07,
) {
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  } catch {
    /* noop — sound is decorative */
  }
}

/** Cheerful rising chime (C5 → E5 → G5). */
export function playCorrect() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  tone(c, 523.25, t);
  tone(c, 659.25, t + 0.09);
  tone(c, 783.99, t + 0.18, 0.24);
}

/** Gentle "hmm, try again" — two soft low notes, nothing harsh. */
export function playWrong() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  tone(c, 220, t, 0.16, 'triangle', 0.05);
  tone(c, 196, t + 0.12, 0.2, 'triangle', 0.05);
}

/** Little completion fanfare (C5 E5 G5 C6). */
export function playComplete() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  tone(c, 523.25, t);
  tone(c, 659.25, t + 0.12);
  tone(c, 783.99, t + 0.24);
  tone(c, 1046.5, t + 0.36, 0.34, 'sine', 0.08);
}
