/**
 * Nyaya Nagri — Progress Store (Task 0)
 *
 * A simple in-memory state/progress store with a save/load interface.
 * Browser storage can be restricted in embedded contexts, so this uses an
 * in-memory JS object behind an interface that can be swapped for real
 * persistence (backend/localStorage) in a later task without changing callers.
 */

export type AgeBand = '8-11' | '12-15' | '16-18';

export interface ProgressState {
  /** Selected age band; chosen during onboarding (Task 13). */
  ageBand: AgeBand;
  /**
   * True once the onboarding flow (intro, age band, guardian consent) has
   * been completed on this device (Task 13). Device persistence only BEGINS
   * after consent — see createInitialAdapter().
   */
  onboarded: boolean;
  /** Zone completion flags keyed by zone id (e.g. "zone1"). */
  completedZones: Record<string, boolean>;
  /** Badges earned, keyed by badge id. */
  badges: Record<string, boolean>;
  /** Quiz scores keyed by quest id: { pre, post } for literacy-delta analytics. */
  quizScores: Record<string, { pre: number | null; post: number | null }>;
  /** Pseudonymous session id — never a real name or any PII. */
  sessionId: string;
  /** Arbitrary key-value slot for future tasks (settings, avatar config, etc.). */
  extras: Record<string, unknown>;
}

function generateSessionId(): string {
  // Pseudonymous, non-identifying session id.
  return `nn-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function defaultState(): ProgressState {
  return {
    ageBand: '12-15',
    onboarded: false,
    completedZones: {},
    badges: {},
    quizScores: {},
    sessionId: generateSessionId(),
    extras: {},
  };
}

/** Persistence adapter interface — swap the in-memory adapter for a real one later. */
export interface StorageAdapter {
  save(state: ProgressState): void;
  load(): ProgressState | null;
}

/** In-memory adapter (Task 0 default). Survives within a page session only. */
class InMemoryAdapter implements StorageAdapter {
  private snapshot: ProgressState | null = null;

  save(state: ProgressState): void {
    // Deep copy so callers can't mutate the saved snapshot.
    this.snapshot = JSON.parse(JSON.stringify(state)) as ProgressState;
  }

  load(): ProgressState | null {
    return this.snapshot
      ? (JSON.parse(JSON.stringify(this.snapshot)) as ProgressState)
      : null;
  }
}

/**
 * Task 13 — device persistence (DPDP-aware, PRD §9.4).
 *
 * Progress holds ZERO PII: age band, language-independent quest progress,
 * badges, quiz scores, and a random pseudonymous session id. Even so, the
 * app follows data minimization: nothing is written to device storage until
 * a parent/guardian/teacher accepts the consent screen. Before consent the
 * store runs purely in memory; completeOnboarding() swaps in this adapter.
 */
const PROGRESS_STORAGE_KEY = 'nn-progress-v1';

class LocalStorageAdapter implements StorageAdapter {
  save(state: ProgressState): void {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage may be unavailable (embedded/incognito) — progress then
      // simply lives for the session, same as the in-memory adapter.
    }
  }

  load(): ProgressState | null {
    try {
      const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<ProgressState>;
      // Merge over defaults so states saved by older versions stay valid.
      return { ...defaultState(), ...parsed };
    } catch {
      return null;
    }
  }
}

/**
 * Was guardian consent recorded on this device? Pure localStorage read, so
 * other stores (settings) can gate THEIR persistence on the same consent
 * without import cycles. False when storage is unavailable.
 */
export function hasRecordedConsent(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    return !!raw && (JSON.parse(raw) as Partial<ProgressState>).onboarded === true;
  } catch {
    return false;
  }
}

/** Consent-gated boot: only read device storage if consent was recorded. */
function createInitialAdapter(): StorageAdapter {
  return hasRecordedConsent() ? new LocalStorageAdapter() : new InMemoryAdapter();
}

type Listener = (state: ProgressState) => void;

class ProgressStore {
  private state: ProgressState;
  private adapter: StorageAdapter;
  private listeners = new Set<Listener>();

  constructor(adapter: StorageAdapter = new InMemoryAdapter()) {
    this.adapter = adapter;
    this.state = this.adapter.load() ?? defaultState();
  }

  /** Read-only snapshot of the current state. */
  getState(): ProgressState {
    return this.state;
  }

  /** Merge a partial update, notify subscribers, and auto-save. */
  update(patch: Partial<ProgressState>): void {
    this.state = { ...this.state, ...patch };
    this.save();
    this.listeners.forEach((l) => l(this.state));
  }

  /** Persist current state via the adapter. */
  save(): void {
    this.adapter.save(this.state);
  }

  /** Reload state from the adapter (no-op fallback to current state). */
  load(): ProgressState {
    const loaded = this.adapter.load();
    if (loaded) {
      this.state = loaded;
      this.listeners.forEach((l) => l(this.state));
    }
    return this.state;
  }

  /** Swap the persistence adapter (future task: real persistence). */
  setAdapter(adapter: StorageAdapter): void {
    this.adapter = adapter;
    this.save();
  }

  /** Subscribe to state changes; returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // -- Convenience helpers for future tasks --

  markZoneComplete(zoneId: string): void {
    this.update({
      completedZones: { ...this.state.completedZones, [zoneId]: true },
    });
  }

  isZoneComplete(zoneId: string): boolean {
    return !!this.state.completedZones[zoneId];
  }

  setAgeBand(ageBand: AgeBand): void {
    this.update({ ageBand });
  }

  /**
   * Task 13: called when the guardian accepts the consent screen. Records
   * the chosen age band + onboarded flag and — only now — switches from
   * in-memory to device (localStorage) persistence.
   */
  completeOnboarding(ageBand: AgeBand): void {
    this.update({ ageBand, onboarded: true });
    this.setAdapter(new LocalStorageAdapter());
  }
}

/** Singleton store instance used across the app. */
export const progressStore = new ProgressStore(createInitialAdapter());
