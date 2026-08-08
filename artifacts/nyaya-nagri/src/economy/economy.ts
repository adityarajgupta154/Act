/**
 * Nyaya Nagri — Game Economy (Task 16, PRD §7.3 + §9.6/§9.7)
 *
 * Pure, deterministic economy rules — NO side effects here. Hard rules:
 *  - XP and Coins are earned ONLY by playing (first-time level completions).
 *    There is no real-money path anywhere: nothing in this module (or the
 *    shop UI) can ever charge, request, or reference real money.
 *  - Coins buy COSMETIC avatar accessories only — never gameplay advantage,
 *    never content access (zero pay-to-win, §9.6).
 *  - The Daily Streak is gentle: a missed day quietly starts a new streak.
 *    No guilt messaging, no loss warnings, no notifications (§9.6).
 *  - "Player Rank" (from total XP) is a SEPARATE concept from the in-zone
 *    "Level X" (Task 15) — UI must always label them distinctly (§7.3).
 *  - Titles are private flavor text — never shared or shown publicly.
 *
 * Additive layer: the Task 9 badges/stars system is untouched.
 */

import type { ProgressState } from '@/data/progressStore';
import type { LevelKind } from '@/quests/schema';
import { SHOP_ACCESSORIES, type Accessory } from '@/player/avatarConfig';

// ---------------------------------------------------------------------------
// XP + Coins
// ---------------------------------------------------------------------------

/** XP per level kind, first-time completion only (practice awards nothing). */
export const LEVEL_XP: Record<LevelKind, number> = {
  story: 30,
  decision: 40,
  quiz: 60,
  // Task 18 activity levels — additive extras, worth a bit less than the
  // quiz checkpoint so the zone's weight stays on the learning loop.
  memory: 35,
  hidden: 35,
  sorting: 35,
  scenario: 35,
  // Task 20: zone6 "Meet the Authorities" hub — same weight as other extras.
  authorities: 35,
};

/** Coins per level kind, first-time completion only. */
export const LEVEL_COINS: Record<LevelKind, number> = {
  story: 10,
  decision: 15,
  quiz: 25,
  memory: 12,
  hidden: 12,
  sorting: 12,
  scenario: 12,
  authorities: 12,
};

/** One-time bonus when the final quiz level completes its whole zone. */
export const ZONE_COMPLETE_BONUS = { xp: 50, coins: 25 } as const;

export interface LevelAward {
  xp: number;
  coins: number;
}

/** Award for a FIRST-TIME level completion (call only on recorded results). */
export function awardForLevel(kind: LevelKind, zoneCompleted: boolean): LevelAward {
  return {
    xp: LEVEL_XP[kind] + (zoneCompleted ? ZONE_COMPLETE_BONUS.xp : 0),
    coins: LEVEL_COINS[kind] + (zoneCompleted ? ZONE_COMPLETE_BONUS.coins : 0),
  };
}

// ---------------------------------------------------------------------------
// Player Rank (derived from total XP — never stored, so it can't drift)
// ---------------------------------------------------------------------------

/**
 * XP needed per rank step. The base levels of all 7 zones total 1260 XP
 * (=> Rank 9); activity levels add 35 XP each on top (one to three per age
 * band, depending on which zones carry an activity for that band).
 */
export const XP_PER_RANK = 150;

export function rankForXp(xp: number): number {
  const safe = Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0;
  return Math.floor(safe / XP_PER_RANK) + 1;
}

/** XP still needed to reach the next rank (for a friendly progress hint). */
export function xpToNextRank(xp: number): number {
  const safe = Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0;
  return XP_PER_RANK - (safe % XP_PER_RANK);
}

// ---------------------------------------------------------------------------
// Daily Streak (gentle by design — §9.6: zero guilt patterns)
// ---------------------------------------------------------------------------

export interface DailyStreak {
  /** Consecutive days played, 0 = never played. */
  count: number;
  /** Local day the child last played, "YYYY-MM-DD", or null. */
  lastDay: string | null;
}

/** Local calendar day as "YYYY-MM-DD" (the child's own timezone). */
export function todayString(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Format AND calendar validity — "2026-13-99" must not pass. */
function isValidDay(day: unknown): day is string {
  if (typeof day !== 'string' || !DAY_RE.test(day)) return false;
  const d = new Date(`${day}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === day;
}

function nextDayOf(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Advance the streak for a play on `today`. Pure and idempotent per day:
 *  - same day again      -> unchanged
 *  - played yesterday    -> count + 1
 *  - gap or first play   -> quietly starts again at 1 (no penalty state,
 *    no "lost streak" flag — the UI simply shows the current number)
 */
export function advanceStreak(streak: DailyStreak, today: string): DailyStreak {
  if (!isValidDay(today)) return streak;
  const count = Number.isInteger(streak.count) && streak.count > 0 ? streak.count : 0;
  const lastDay = isValidDay(streak.lastDay) ? streak.lastDay : null;
  if (lastDay === today) return { count: Math.max(count, 1), lastDay };
  if (lastDay && nextDayOf(lastDay) === today) return { count: count + 1, lastDay: today };
  return { count: 1, lastDay: today };
}

/** Load-time hygiene for the persisted streak (ingress rule, Task 14). */
export function sanitizeStreak(raw: unknown): DailyStreak {
  if (!raw || typeof raw !== 'object') return { count: 0, lastDay: null };
  const r = raw as Partial<DailyStreak>;
  const count = Number.isInteger(r.count) && (r.count as number) > 0 ? (r.count as number) : 0;
  const lastDay = isValidDay(r.lastDay) ? r.lastDay : null;
  return lastDay ? { count: Math.max(count, 1), lastDay } : { count: 0, lastDay: null };
}

// ---------------------------------------------------------------------------
// Avatar Shop (cosmetic-only; Coins are virtual and earned in-game ONLY)
// ---------------------------------------------------------------------------

export interface ShopItem {
  id: Accessory;
  /** Price in in-game Coins. There is NO real-money price anywhere. */
  price: number;
}

/** Full catalogue. Prices are reachable from normal play (base zones yield 525 Coins; catalogue totals 210). */
export const SHOP_ITEMS: readonly ShopItem[] = [
  { id: 'bow', price: 30 },
  { id: 'medal', price: 40 },
  { id: 'crown', price: 60 },
  { id: 'cape', price: 80 },
];

export function getShopItem(id: string): ShopItem | null {
  return SHOP_ITEMS.find((s) => s.id === id) ?? null;
}

/** Sanity: the catalogue must exactly cover the shop accessory ids. */
export function shopCatalogueMatchesConfig(): boolean {
  const ids = SHOP_ITEMS.map((s) => s.id as string).sort();
  return JSON.stringify(ids) === JSON.stringify([...SHOP_ACCESSORIES].sort());
}

// ---------------------------------------------------------------------------
// Titles (private flavor text — §7.3: never shared publicly)
// ---------------------------------------------------------------------------

export type TitleId =
  | 'first_level'
  | 'zone0_pathfinder'
  | 'zone1_guardian'
  | 'zone2_champion'
  | 'zone3_scholar'
  | 'zone4_explorer'
  | 'zone5_defender'
  | 'zone6_shield_bearer'
  | 'all_zones_champion';

export const TITLE_IDS: readonly TitleId[] = [
  'first_level',
  'zone0_pathfinder',
  'zone1_guardian',
  'zone2_champion',
  'zone3_scholar',
  'zone4_explorer',
  'zone5_defender',
  'zone6_shield_bearer',
  'all_zones_champion',
];

const ALL_ZONES = ['zone0', 'zone1', 'zone2', 'zone3', 'zone4', 'zone5', 'zone6'];

/** The slice of progress that milestones and earnings derive from. */
export type ProgressMilestones = Pick<ProgressState, 'levelProgress' | 'completedZones'>;

/** Pure milestone predicates over the progress state. */
const TITLE_RULES: Record<TitleId, (s: ProgressMilestones) => boolean> = {
  first_level: (s) =>
    Object.values(s.levelProgress).some(Boolean) ||
    Object.values(s.completedZones).some(Boolean),
  zone0_pathfinder: (s) => !!s.completedZones.zone0,
  zone1_guardian: (s) => !!s.completedZones.zone1,
  zone2_champion: (s) => !!s.completedZones.zone2,
  zone3_scholar: (s) => !!s.completedZones.zone3,
  zone4_explorer: (s) => !!s.completedZones.zone4,
  zone5_defender: (s) => !!s.completedZones.zone5,
  zone6_shield_bearer: (s) => !!s.completedZones.zone6,
  all_zones_champion: (s) => ALL_ZONES.every((z) => !!s.completedZones[z]),
};

/** All title ids the given state has earned (derived, order = TITLE_IDS). */
export function computeUnlockedTitles(state: ProgressMilestones): TitleId[] {
  return TITLE_IDS.filter((id) => TITLE_RULES[id](state));
}

/** Titles newly earned by `after` that `before` did not have. */
export function newlyUnlockedTitles(
  before: Record<string, boolean>,
  after: ProgressState,
): TitleId[] {
  return computeUnlockedTitles(after).filter((id) => !before[id]);
}

// ---------------------------------------------------------------------------
// Load-time reconciliation (architect round: forged-but-valid saves)
//
// A device-local, no-backend prototype can never be tamper-PROOF: the save
// lives in the child's own browser and they can edit it. What we CAN do is
// make casual forgery pointless — every economy number is deterministic in
// the recorded progress, so at load we recompute the maximum honestly
// earnable totals and clamp everything to them. A hand-edited save with
// coins:99999 or ownedAccessories:['cape'] but no matching completed levels
// quietly collapses back to what was actually earned. This also means the
// local board row can never show forged XP. (A REAL shared leaderboard would
// still need a server-authoritative design — this local data is advisory.)
// ---------------------------------------------------------------------------

const ZONE_IDS = ['zone0', 'zone1', 'zone2', 'zone3', 'zone4', 'zone5', 'zone6'] as const;
const BASE_LEVEL_KIND_BY_ID: Record<string, LevelKind> = {
  level1: 'story',
  level2: 'decision',
  level3: 'quiz',
};

/**
 * Task 18: activity levels wired into specific zones. Only ONE age band per
 * zone actually carries the extra level, but progress keys are band-blind,
 * so the reconciliation ceiling includes them for every band. The clamp is
 * a MAXIMUM — bands whose quest lacks the extra level simply never earn it,
 * and honest saves stay untouched. This slight over-allowance is deliberate
 * and safer than under-crediting an honest completion.
 */
const EXTRA_LEVEL_KIND_BY_ZONE: Record<string, Record<string, LevelKind>> = {
  zone1: { level_scenario: 'scenario' },
  zone2: { level_hidden: 'hidden' },
  zone3: { level_memory: 'memory' },
  zone5: { level_sorting: 'sorting' },
  zone6: { level_authorities: 'authorities' },
};

function levelKindsForZone(zone: string): Record<string, LevelKind> {
  return { ...BASE_LEVEL_KIND_BY_ID, ...(EXTRA_LEVEL_KIND_BY_ZONE[zone] ?? {}) };
}

/**
 * Maximum XP/Coins honestly earnable from the recorded progress.
 * A completed zone credits all its levels + the bonus (this also keeps
 * pre-Task-15 saves — zone complete, no level entries — fully credited).
 */
export function earnedTotals(progress: ProgressMilestones): LevelAward {
  let xp = 0;
  let coins = 0;
  for (const zone of ZONE_IDS) {
    const kindsById = levelKindsForZone(zone);
    if (progress.completedZones[zone] === true) {
      for (const kind of Object.values(kindsById)) {
        xp += LEVEL_XP[kind];
        coins += LEVEL_COINS[kind];
      }
      xp += ZONE_COMPLETE_BONUS.xp;
      coins += ZONE_COMPLETE_BONUS.coins;
    } else {
      for (const [levelId, kind] of Object.entries(kindsById)) {
        if (progress.levelProgress[`${zone}:${levelId}`] === true) {
          xp += LEVEL_XP[kind];
          coins += LEVEL_COINS[kind];
        }
      }
    }
  }
  return { xp, coins };
}

export interface ReconciledEconomy {
  xp: number;
  coins: number;
  ownedAccessories: string[];
  titles: Record<string, boolean>;
}

/**
 * Clamp persisted economy fields to what the recorded progress can justify:
 *  - xp/coins never exceed the honestly earnable totals;
 *  - owned cosmetics whose combined price exceeds total earnings are cleared
 *    (they cannot all have been bought), and the coin balance never exceeds
 *    earnings minus what was spent on the (justified) owned items;
 *  - titles are recomputed from milestones — they are derived data.
 * Honest saves pass through unchanged; this only bites forged/corrupt ones.
 */
export function reconcileEconomy(
  raw: { xp: number; coins: number; ownedAccessories: string[] },
  progress: ProgressMilestones,
): ReconciledEconomy {
  const earned = earnedTotals(progress);
  let owned = raw.ownedAccessories;
  let spent = owned.reduce((sum, id) => sum + (getShopItem(id)?.price ?? 0), 0);
  if (spent > earned.coins) {
    owned = [];
    spent = 0;
  }
  const clamp = (value: number, max: number) =>
    Math.min(Math.max(0, Math.floor(value)), Math.max(0, max));
  const titles: Record<string, boolean> = {};
  for (const id of computeUnlockedTitles(progress)) titles[id] = true;
  return {
    xp: clamp(raw.xp, earned.xp),
    coins: clamp(raw.coins, earned.coins - spent),
    ownedAccessories: owned,
    titles,
  };
}
