/**
 * Nyaya Nagri — Accessibility & language settings store (Task 10, PRD §6.4)
 *
 * Holds the child's device-level preferences: language (English/Hindi),
 * audio narration, dyslexia-friendly font, high-contrast mode, and text
 * size. Persisted in localStorage under a fixed key — settings only, never
 * PII, never progress data. Falls back to in-memory when storage is
 * unavailable (embedded/incognito contexts).
 *
 * Task 13 (DPDP consent gating): like progress, settings are NOT written to
 * device storage until the guardian consent screen is accepted — before
 * that (e.g. picking a language during onboarding) they live in memory
 * only. OnboardingFlow calls settingsStore.flush() right after consent so
 * the choices made during onboarding are persisted at that moment.
 *
 * The store also applies the visual settings to <html> as data attributes
 * so plain CSS (index.css) can implement the font / contrast / size modes
 * without touching every component.
 */
import { useSyncExternalStore } from 'react';

import { hasRecordedConsent } from './progressStore';

export type Language = 'en' | 'hi';
export type TextSize = 'small' | 'medium' | 'large';

export interface SettingsState {
  language: Language;
  /** Read narration, choices, and quiz text aloud via the Web Speech API. */
  narration: boolean;
  dyslexiaFont: boolean;
  highContrast: boolean;
  textSize: TextSize;
  /** Calm ambient background music loop (Task 13); mutable any time. */
  ambientSound: boolean;
}

const STORAGE_KEY = 'nn-settings-v1';

const DEFAULTS: SettingsState = {
  language: 'en',
  // ON by default (Story Adventure voice guide): the target child (~8)
  // may not read comfortably, so narration must work without finding a
  // settings toggle first. The Settings panel + in-story control can turn
  // it off any time; an explicitly stored "false" is always respected.
  narration: true,
  dyslexiaFont: false,
  highContrast: false,
  textSize: 'medium',
  ambientSound: true,
};

function loadStored(): SettingsState {
  try {
    if (typeof localStorage === 'undefined') return { ...DEFAULTS };
    // Consent-gated: settings are only ever persisted after guardian
    // consent, so without recorded consent there is nothing valid to read.
    if (!hasRecordedConsent()) return { ...DEFAULTS };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    return {
      language: parsed.language === 'hi' ? 'hi' : 'en',
      // Missing key (pre-voice-guide save) inherits the new ON default;
      // only an explicit false (the child turned it off) stays off.
      narration: parsed.narration !== false,
      dyslexiaFont: parsed.dyslexiaFont === true,
      highContrast: parsed.highContrast === true,
      textSize:
        parsed.textSize === 'small' || parsed.textSize === 'large'
          ? parsed.textSize
          : 'medium',
      ambientSound: parsed.ambientSound !== false,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function persist(state: SettingsState): void {
  try {
    // Consent-gated (Task 13): nothing touches device storage before the
    // guardian consent screen is accepted.
    if (!hasRecordedConsent()) return;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Storage unavailable — settings stay in memory for this session.
  }
}

/** Reflect visual/language settings onto <html> for CSS + screen readers. */
function applyToDocument(state: SettingsState): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.lang = state.language === 'hi' ? 'hi' : 'en';
  root.dataset.font = state.dyslexiaFont ? 'dyslexic' : 'default';
  root.dataset.contrast = state.highContrast ? 'high' : 'default';
  root.dataset.textsize = state.textSize;
}

type Listener = (state: SettingsState) => void;

class SettingsStore {
  private state: SettingsState;
  private listeners = new Set<Listener>();

  constructor() {
    this.state = loadStored();
    applyToDocument(this.state);
  }

  getState(): SettingsState {
    return this.state;
  }

  update(patch: Partial<SettingsState>): void {
    this.state = { ...this.state, ...patch };
    persist(this.state);
    applyToDocument(this.state);
    this.listeners.forEach((l) => l(this.state));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Persist the current settings now. Called by the onboarding flow right
   * AFTER guardian consent is recorded, so choices made during onboarding
   * (e.g. language) reach device storage only at that point.
   */
  flush(): void {
    persist(this.state);
  }
}

export const settingsStore = new SettingsStore();

/** React hook: subscribe to the settings state. */
export function useSettings(): SettingsState {
  return useSyncExternalStore(
    (cb) => settingsStore.subscribe(() => cb()),
    () => settingsStore.getState(),
    () => settingsStore.getState(),
  );
}
