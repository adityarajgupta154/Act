/**
 * Nyaya Nagri — Audio narration via the Web Speech API (Task 10, PRD §6.4)
 *
 * Reads quest narration, choices, and quiz text aloud in the selected
 * language so non-readers and visually impaired children can play by ear.
 * Fully client-side, nothing is recorded or sent anywhere.
 *
 * Voice availability differs by browser/OS: hi-IN speech uses the device's
 * installed Hindi voice when present and the browser default otherwise.
 */
import type { Language } from '@/data/settingsStore';

const LANG_TAGS: Record<Language, string> = { en: 'en-IN', hi: 'hi-IN' };

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null;
}

/** True when the browser supports speech synthesis at all. */
export function narrationSupported(): boolean {
  return synth() !== null;
}

function pickVoice(langTag: string): SpeechSynthesisVoice | null {
  const s = synth();
  if (!s) return null;
  const voices = s.getVoices();
  return (
    voices.find((v) => v.lang === langTag) ??
    voices.find((v) => v.lang.startsWith(langTag.split('-')[0])) ??
    null
  );
}

/**
 * Speak the given text, cancelling anything currently being spoken.
 * Longer content can be passed as multiple paragraphs; a small pause is
 * inserted between them by queueing separate utterances.
 */
export function speak(parts: string | string[], language: Language): void {
  const s = synth();
  if (!s) return;
  s.cancel();
  const langTag = LANG_TAGS[language];
  const voice = pickVoice(langTag);
  const list = (Array.isArray(parts) ? parts : [parts])
    .map((p) => p.trim())
    .filter(Boolean);
  for (const part of list) {
    const utterance = new SpeechSynthesisUtterance(part);
    utterance.lang = langTag;
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    s.speak(utterance);
  }
}

/** Stop any ongoing narration immediately. */
export function stopSpeaking(): void {
  synth()?.cancel();
}
