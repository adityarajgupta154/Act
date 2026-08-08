/**
 * Nyaya Nagri — Accessibility & language settings store (Task 10, PRD §6.4)
 *
 * Holds the child's device-level preferences: language (English/Hindi),
 * audio narration, dyslexia-friendly font, high-contrast mode, and text
 * size. Persisted in localStorage under a fixed key — settings only, never
 * PII, never progress data. Falls back to in-memory when storage is
 * unavailable (embedded/incognito contexts).
 *
 * The store also applies the visual settings to <html> as data attributes
 * so plain CSS (index.css) can implement the font / contrast / size modes
 * without touching every component.
 */
import { useSyncExternalStore } from 'react';

export type Language = 'en' | 'hi';
export type TextSize = 'small' | 'medium' | 'large';

export interface SettingsState {
  language: Language;
  /** Read narration, choices, and quiz text aloud via the Web Speech API. */
  narration: boolean;
  dyslexiaFont: boolean;
  highContrast: boolean;
  textSize: TextSize;
}

const STORAGE_KEY = 'nn-settings-v1';

const DEFAULTS: SettingsState = {
  language: 'en',
  narration: false,
  dyslexiaFont: false,
  highContrast: false,
  textSize: 'medium',
};

function loadStored(): SettingsState {
  try {
    if (typeof localStorage === 'undefined') return { ...DEFAULTS };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    return {
      language: parsed.language === 'hi' ? 'hi' : 'en',
      narration: parsed.narration === true,
      dyslexiaFont: parsed.dyslexiaFont === true,
      highContrast: parsed.highContrast === true,
      textSize:
        parsed.textSize === 'small' || parsed.textSize === 'large'
          ? parsed.textSize
          : 'medium',
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function persist(state: SettingsState): void {
  try {
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
