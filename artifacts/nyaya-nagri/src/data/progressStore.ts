/**
 * Nyaya Nagri — Progress Store (Task 0)
 *
 * A simple in-memory state/progress store with a save/load interface.
 * Browser storage can be restricted in embedded contexts, so this uses an
 * in-memory JS object behind an interface that can be swapped for real
 * persistence (backend/localStorage) in a later task without changing callers.
 */

import {
  filterToOwnedAccessories,
  sanitizeAvatar,
  SHOP_ACCESSORIES,
  type Accessory,
  type PlayerAvatarConfig,
} from '@/player/avatarConfig';
import {
  advanceStreak,
  getShopItem,
  reconcileEconomy,
  sanitizeStreak,
  todayString,
  type DailyStreak,
} from '@/economy/economy';
import {
  reconcileCertificates,
  type CertificateRecord,
} from '@/certificates/certificates';
import {
  defaultInsightsMeta,
  sanitizeActivityLog,
  sanitizeInsightsMeta,
  type ActivityEvent,
  type InsightsMeta,
} from '@/insights/types';

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
   * Story Adventure completions (Aug 2026), keyed by story level id (e.g.
   * "right-to-life"). Same boolean-map shape and load-time sanitizing as
   * completedZones; written only by completeStoryLevel().
   */
  storyProgress: Record<string, boolean>;
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
  /**
   * Task 18: recorded activity-level results, keyed "zoneId:levelId" like
   * levelProgress. Written exactly once by finalizeLevel() on the first
   * recorded completion — practice replays never touch it. Scores are
   * gentle by design (memory/hidden are completion-based).
   */
  activityScores: Record<string, { score: number; total: number }>;
  /**
   * Task 16 economy (PRD §7.3) — ADDITIVE to badges/stars, never replaces
   * them. XP/Coins are earned in-game only; no real-money path exists.
   */
  xp: number;
  /** Virtual Coins — spendable ONLY on cosmetic avatar accessories. */
  coins: number;
  /** Shop accessory ids bought with Coins (cosmetic only). */
  ownedAccessories: string[];
  /** Gentle daily streak — a gap quietly restarts it, no guilt state. */
  streak: DailyStreak;
  /** Unlocked title ids (private flavor text — never shared publicly). */
  titles: Record<string, boolean>;
  /**
   * Cohort leaderboard opt-in (PRD §7.3/§9.7) — DEFAULT FALSE. Only ever
   * scopes to the child's own classroom group; no global board exists.
   */
  leaderboardOptIn: boolean;
  /**
   * Task 27: zone completion certificates - DERIVED from completedZones
   * (engine-only write path) and reconciled at every ingress: stable
   * certificate id + first-completion date only, never any name (PRD 9.4).
   */
  certificates: Record<string, CertificateRecord>;
  /** Pseudonymous session id — never a real name or any PII. */
  sessionId: string;
  /**
   * Learning-insights activity log (capped rolling window). Option indices
   * and derived stats ONLY — never free text or PII. Rides the same
   * consent-gated persistence as everything else (see src/insights/types).
   */
  activityLog: ActivityEvent[];
  /** Insights bookkeeping + cached AI narrative (spec §18 batching). */
  insightsMeta: InsightsMeta;
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
    storyProgress: {},
    replayCounts: {},
    preAnswersByQuest: {},
    activityScores: {},
    xp: 0,
    coins: 0,
    ownedAccessories: [],
    streak: { count: 0, lastDay: null },
    titles: {},
    leaderboardOptIn: false,
    certificates: {},
    sessionId: generateSessionId(),
    activityLog: [],
    insightsMeta: defaultInsightsMeta(),
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
/** Task 18: a stored activity score must be a sane {score, total} pair. */
const isScorePair = (v: unknown): v is { score: number; total: number } => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const p = v as { score?: unknown; total?: unknown };
  return (
    typeof p.score === 'number' &&
    typeof p.total === 'number' &&
    Number.isInteger(p.score) &&
    Number.isInteger(p.total) &&
    p.total > 0 &&
    p.total <= 50 &&
    p.score >= 0 &&
    p.score <= p.total
  );
};

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
      // Task 16 economy fields re-validated on load (same ingress rule).
      const ownedAccessories = Array.isArray(parsed.ownedAccessories)
        ? parsed.ownedAccessories.filter(
            (a): a is string =>
              typeof a === 'string' && (SHOP_ACCESSORIES as readonly string[]).includes(a),
          )
        : [];
      const avatar = sanitizeAvatar(parsed.avatar);
      // Task 15 maps re-validated on load, same ingress rule as the avatar:
      // malformed entries are dropped, never allowed to reach the UI.
      const levelProgress = sanitizeRecord(parsed.levelProgress, isBool);
      const completedZones = sanitizeRecord(parsed.completedZones, isBool);
      // Architect round (Task 16): shape-valid but FORGED economy fields
      // (hand-edited xp/coins/ownedAccessories) are clamped to what the
      // recorded progress can justify; titles are recomputed (derived data).
      const economy = reconcileEconomy(
        {
          xp: isCount(parsed.xp) ? Math.floor(parsed.xp) : 0,
          coins: isCount(parsed.coins) ? Math.floor(parsed.coins) : 0,
          ownedAccessories,
        },
        { levelProgress, completedZones },
      );
      return {
        ...defaultState(),
        ...parsed,
        // Ownership ingress (Task 16): an equipped shop cosmetic that was
        // never bought is quietly dropped from the loaded avatar.
        avatar: avatar
          ? { ...avatar, accessories: filterToOwnedAccessories(avatar.accessories, economy.ownedAccessories) }
          : null,
        levelProgress,
        completedZones,
        storyProgress: sanitizeRecord(parsed.storyProgress, isBool),
        replayCounts: sanitizeRecord(parsed.replayCounts, isCount),
        preAnswersByQuest: sanitizeRecord(parsed.preAnswersByQuest, isAnswerList),
        activityScores: sanitizeRecord(parsed.activityScores, isScorePair),
        xp: economy.xp,
        coins: economy.coins,
        ownedAccessories: economy.ownedAccessories,
        streak: sanitizeStreak(parsed.streak),
        titles: economy.titles,
        leaderboardOptIn: parsed.leaderboardOptIn === true,
        // Task 27 ingress: certificates the recorded completions justify -
        // forged entries dropped, legacy completed zones backfilled.
        certificates: reconcileCertificates(
          parsed.certificates,
          completedZones,
          new Date().toISOString(),
        ),
        // Insights ingress: malformed/hand-edited events are dropped, the
        // rolling cap is re-enforced, and the AI cache must be shape-valid.
        activityLog: sanitizeActivityLog(parsed.activityLog),
        insightsMeta: sanitizeInsightsMeta(parsed.insightsMeta),
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
    const loaded = this.adapter.load();
    this.state = loaded ?? defaultState();
    // Task 27 architect round: load() REPAIRS saved state in memory
    // (backfilled certificates, clamped economy, sanitized maps) but never
    // wrote the repaired state back - so a legacy save would be issued a
    // brand-new certificate id/date on EVERY reload until some unrelated
    // update() happened to persist one. Persisting the canonical state at
    // boot makes the first backfill durable. No-op for fresh sessions, and
    // the pre-consent in-memory adapter keeps device storage untouched.
    if (loaded) this.adapter.save(this.state);
  }

  /** Read-only snapshot of the current state. */
  getState(): ProgressState {
    return this.state;
  }

  /** Merge a partial update, notify subscribers, and auto-save. */
  update(patch: Partial<ProgressState>): void {
    const next = { ...this.state, ...patch };
    // Task 27: certificates are derived from zone completion - reconciled in
    // the SAME update that changes completedZones, so the engine marking a
    // zone complete and its certificate issue are one atomic write (the
    // saved completion moment IS the certificate date, stable forever).
    if (patch.completedZones) {
      next.certificates = reconcileCertificates(
        next.certificates,
        next.completedZones,
        new Date().toISOString(),
      );
    }
    this.state = next;
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

  /**
   * Story Adventure completion (Aug 2026, deterministic slide levels).
   * Reaching the RESULT slide is the only caller — and the only way there
   * runs through the hard-coded correct choice (PRD §9.8). The reward
   * badge rides the SAME atomic write, so the badge counter and the house
   * done-tick always agree. Idempotent: replays never double-award.
   */
  completeStoryLevel(storyId: string): void {
    if (this.state.storyProgress[storyId]) return;
    this.update({
      storyProgress: { ...this.state.storyProgress, [storyId]: true },
      badges: { ...this.state.badges, [`story-${storyId}`]: true },
    });
  }

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
    // Task 16 ownership ingress: shop cosmetics must be bought to be worn.
    clean.accessories = filterToOwnedAccessories(
      clean.accessories,
      this.state.ownedAccessories,
    );
    this.update({ avatar: clean });
  }

  /**
   * Task 16: buy a cosmetic shop accessory with in-game Coins. The ONLY
   * way to own a shop cosmetic — there is no real-money path anywhere.
   * Returns true when the purchase succeeded.
   */
  purchaseAccessory(id: Accessory): boolean {
    const item = getShopItem(id);
    if (!item) return false; // not a shop item (free ones need no purchase)
    if (this.state.ownedAccessories.includes(id)) return false; // already owned
    if (this.state.coins < item.price) return false; // gentle no — UI explains
    this.update({
      coins: this.state.coins - item.price,
      ownedAccessories: [...this.state.ownedAccessories, id],
    });
    return true;
  }

  /** Task 16: cohort leaderboard opt-in (PRD §9.7) — default stays false. */
  setLeaderboardOptIn(on: boolean): void {
    this.update({ leaderboardOptIn: on === true });
  }

  /**
   * Task 16: record "played today" for the gentle daily streak. Idempotent
   * per local calendar day; a gap simply restarts the count at 1 — there is
   * deliberately NO penalty state or guilt messaging (PRD §9.6).
   */
  touchDailyStreak(today: string = todayString()): void {
    const next = advanceStreak(this.state.streak, today);
    if (next.count !== this.state.streak.count || next.lastDay !== this.state.streak.lastDay) {
      this.update({ streak: next });
    }
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
