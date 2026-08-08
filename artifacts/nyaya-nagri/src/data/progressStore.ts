/**
 * Nyaya Nagri — Progress Store (Task 0)
 *
 * A simple in-memory state/progress store with a save/load interface.
 * Browser storage can be restricted in embedded contexts, so this uses an
 * in-memory JS object behind an interface that can be swapped for real
 * persistence (backend/localStorage) in a later task without changing callers.
 */

import { sanitizeAvatar, type PlayerAvatarConfig } from '@/player/avatarConfig';

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
  /**
   * The child's own playable character (Task 14, PRD §7.2). Cartoon config
   * ids + game nickname only (never a real name) — COSMETIC ONLY, never
   * read by the quest engine/content. Null until built during onboarding.
   */
  avatar: PlayerAvatarConfig | null;
  /** Zone completion flags keyed by zone id (e.g. "zone1"). */
  completedZones: Record<string, boolean>;
  /** Badges earned, keyed by badge id. */
  badges: Record<string, boolean>;
  /** Quiz scores keyed by quest id: { pre, post } for literacy-delta analytics. */
  quizScores: Record<string, { pre: number | null; post: number | null }>;
  /**
   * Task 15: completed levels, keyed "zoneId:levelId" (e.g. "zone1:level2").
   * Language- and band-independent, like completedZones. A zone flagged in
   * completedZones counts as ALL its levels complete (pre-Task-15 saves).
   */
  levelProgress: Record<string, boolean>;
  /**
   * Task 15: Practice/Replay attempt counts, keyed "zoneId:levelId".
   * Kept SEPARATE from quizScores on purpose — replays never touch the
   * recorded pre/post analytics scores (Task 9).
   */
  replayCounts: Record<string, number>;
  /**
   * Task 15: silent pre-quiz answer indices per quest id, recorded when
   * Level 1 finishes so the final quiz level (a separate session) can build
   * the same adaptive recap as before. Answer indices only — no PII.
   */
  preAnswersByQuest: Record<string, number[]>;
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
    avatar: null,
    completedZones: {},
    badges: {},
    quizScores: {},
    levelProgress: {},
    replayCounts: {},
    preAnswersByQuest: {},
    sessionId: generateSessionId(),
    extras: {},
  };
}

/** Keep only entries of the expected primitive shape (load-time hygiene). */
function sanitizeRecord<T>(
  value: unknown,
  isValid: (v: unknown) => v is T,
): Record<string, T> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (isValid(v)) out[k] = v;
  }
  return out;
}

const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const isCount = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isAnswerList = (v: unknown): v is number[] =>
  Array.isArray(v) && v.every((n) => typeof n === 'number' && Number.isInteger(n));

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
      // The avatar is re-validated on every load: a malformed/edited saved
      // config must degrade to null (no avatar) instead of crashing the
      // renderer with unknown ids (Task 14).
      return {
        ...defaultState(),
        ...parsed,
        avatar: sanitizeAvatar(parsed.avatar),
        // Task 15 maps re-validated on load, same ingress rule as the avatar:
        // malformed entries are dropped, never allowed to reach the UI.
        levelProgress: sanitizeRecord(parsed.levelProgress, isBool),
        replayCounts: sanitizeRecord(parsed.replayCounts, isCount),
        preAnswersByQuest: sanitizeRecord(parsed.preAnswersByQuest, isAnswerList),
      };
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

  // NOTE (Task 15 review): the old markZoneComplete(zoneId) helper was
  // REMOVED — it was an unrestricted write path that could mark a zone
  // complete without passing the final quiz level. Zone completion is now
  // written ONLY by the quest engine's finalization (engine.finalizeLevel /
  // finalizeQuest), which enforce the level and scoring rules.

  isZoneComplete(zoneId: string): boolean {
    return !!this.state.completedZones[zoneId];
  }

  setAgeBand(ageBand: AgeBand): void {
    this.update({ ageBand });
  }

  /**
   * Task 14: save the player's cosmetic avatar (builder + Edit Avatar).
   * Always sanitized at this ingress — an invalid config is dropped rather
   * than persisted, so storage can never hold a config that would crash
   * the SVG renderer.
   */
  setAvatar(avatar: PlayerAvatarConfig): void {
    const clean = sanitizeAvatar(avatar);
    if (!clean) return;
    this.update({ avatar: clean });
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
