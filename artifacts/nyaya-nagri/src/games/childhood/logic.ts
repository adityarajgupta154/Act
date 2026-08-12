/**
 * "Right to Childhood" drag-and-drop game — pure logic (no React, no DOM,
 * no timers). Replaces the "Right or Wrong?" tap game as the zone2 castle
 * lesson (user order, Aug 2026): OBSERVE → DRAG → DROP → MATCH → FEEDBACK
 * → SCORE → COMPLETE.
 *
 * Rules of the loop:
 *  - Each round shows 3 right slots + 4 scenario cards (3 correct + ONE
 *    distractor). Slot order and tray order shuffle per round (injectable
 *    rng — deterministic in scripts/childhood.smoke.ts).
 *  - A correct drop locks the card into its slot (+100). Filling all 3
 *    slots clears the round (+100 bonus) — max 400 per round.
 *  - A wrong drop never subtracts points (PRD §9.6 — no guilt) and the
 *    card simply returns to the tray.
 *  - The distractor (`correctRight: null`) can NEVER be placed — dropping
 *    it anywhere yields the gentle "doesn't belong" feedback. Structural:
 *    there is no code path that writes a null-right option into `placed`.
 *  - Hints are limited; a hint only points AT the target slot, it never
 *    places a card.
 *  - Stars stay encouraging: completing the game always earns at least 1.
 *
 * PRD §9.8: scenarios and law facts are hard-coded in content.ts — this
 * module never generates or alters content.
 */

export const POINTS_CORRECT = 100;
export const ROUND_BONUS = 100;
export const HINTS_TOTAL = 3;
/** wrongAttempts thresholds: 0 → 3 stars, ≤ this → 2 stars, else 1 star. */
export const STARS_TWO_MAX_WRONG = 3;

/** Minimal structural shape logic needs — content.ts satisfies it. */
export interface ChRoundLike {
  rights: ReadonlyArray<{ id: string }>;
  options: ReadonlyArray<{ id: string; correctRight: string | null }>;
}

export type ChFeedback =
  | {
      kind: 'correct';
      rightId: string;
      optionId: string;
      /** Points granted by this drop (includes the bonus on a clear). */
      gained: number;
      roundCleared: boolean;
    }
  | { kind: 'wrong'; rightId: string; optionId: string }
  | { kind: 'distractor'; rightId: string; optionId: string }
  | null;

export interface ChSession {
  /** 0-based index into the rounds array (authored order — no shuffle). */
  roundIndex: number;
  /** Per round: right ids in display order (shuffled once per session). */
  slotOrder: string[][];
  /** Per round: option ids in display order (shuffled once per session). */
  trayOrder: string[][];
  /** Current round only: rightId → optionId. Distractors never appear. */
  placed: Record<string, string>;
  score: number;
  /** Gentle counter for the star rating — never subtracts points. */
  wrongAttempts: number;
  hintsLeft: number;
  /** Transient hint target (UI pulses the slot, then clears it). */
  hint: { optionId: string; rightId: string } | null;
  feedback: ChFeedback;
  phase: 'playing' | 'roundClear' | 'complete';
}

/** Fisher-Yates shuffle with an injectable rng (deterministic in smokes). */
function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function newChSession(
  rounds: readonly ChRoundLike[],
  rng: () => number = Math.random,
): ChSession {
  return {
    roundIndex: 0,
    slotOrder: rounds.map((r) => shuffle(r.rights.map((x) => x.id), rng)),
    trayOrder: rounds.map((r) => shuffle(r.options.map((x) => x.id), rng)),
    placed: {},
    score: 0,
    wrongAttempts: 0,
    hintsLeft: HINTS_TOTAL,
    hint: null,
    feedback: null,
    phase: 'playing',
  };
}

/**
 * The child drops a card onto a slot. Pure transition:
 *  - matching right     → lock (+100; +bonus when the round clears);
 *  - belongs elsewhere  → gentle "not quite" feedback, card returns;
 *  - the distractor     → "doesn't belong" feedback, card returns —
 *                         it can never lock (core lesson);
 *  - filled slot, placed card, or non-playing phase → no-op.
 */
export function dropOption(
  rounds: readonly ChRoundLike[],
  s: ChSession,
  optionId: string,
  rightId: string,
): ChSession {
  if (s.phase !== 'playing') return s;
  const round = rounds[s.roundIndex];
  if (!round) return s;
  if (s.placed[rightId]) return s;
  if (Object.values(s.placed).includes(optionId)) return s;
  const option = round.options.find((o) => o.id === optionId);
  if (!option || !round.rights.some((r) => r.id === rightId)) return s;

  if (option.correctRight === rightId) {
    const placed = { ...s.placed, [rightId]: optionId };
    const cleared = Object.keys(placed).length === round.rights.length;
    const gained = POINTS_CORRECT + (cleared ? ROUND_BONUS : 0);
    return {
      ...s,
      placed,
      score: s.score + gained,
      hint: null,
      feedback: { kind: 'correct', rightId, optionId, gained, roundCleared: cleared },
      phase: cleared ? 'roundClear' : 'playing',
    };
  }

  return {
    ...s,
    wrongAttempts: s.wrongAttempts + 1,
    feedback: {
      kind: option.correctRight === null ? 'distractor' : 'wrong',
      rightId,
      optionId,
    },
  };
}

/** UI calls this after the round-clear pause; completes after the last round. */
export function nextRound(
  rounds: readonly ChRoundLike[],
  s: ChSession,
): ChSession {
  if (s.phase !== 'roundClear') return s;
  const next = s.roundIndex + 1;
  if (next >= rounds.length) {
    return { ...s, phase: 'complete', feedback: null, hint: null };
  }
  return { ...s, roundIndex: next, placed: {}, feedback: null, hint: null, phase: 'playing' };
}

/** Dismiss transient feedback (shake/toast) so play continues calmly. */
export function clearFeedback(s: ChSession): ChSession {
  return s.feedback ? { ...s, feedback: null } : s;
}

/**
 * Spend one hint: points at the FIRST unplaced non-distractor card (tray
 * order) and its target slot. Never places anything (spec §15).
 */
export function useHint(
  rounds: readonly ChRoundLike[],
  s: ChSession,
): ChSession {
  if (s.phase !== 'playing' || s.hintsLeft <= 0) return s;
  const round = rounds[s.roundIndex];
  if (!round) return s;
  const placedIds = new Set(Object.values(s.placed));
  const targetId = s.trayOrder[s.roundIndex]?.find((id) => {
    if (placedIds.has(id)) return false;
    const o = round.options.find((x) => x.id === id);
    return !!o && o.correctRight !== null;
  });
  if (!targetId) return s;
  const rightId = round.options.find((o) => o.id === targetId)!.correctRight!;
  return { ...s, hintsLeft: s.hintsLeft - 1, hint: { optionId: targetId, rightId } };
}

/** UI clears the pulse after its moment (the hint itself is spent). */
export function clearHint(s: ChSession): ChSession {
  return s.hint ? { ...s, hint: null } : s;
}

/** Stars stay encouraging: never 0 for a finished game (PRD §9.6). */
export function starsEarned(s: ChSession): number {
  if (s.wrongAttempts === 0) return 3;
  return s.wrongAttempts <= STARS_TWO_MAX_WRONG ? 2 : 1;
}

/** Best achievable score: every card correct = 3×100 + 100 per round. */
export function maxScore(rounds: readonly ChRoundLike[]): number {
  return rounds.reduce(
    (sum, r) => sum + r.rights.length * POINTS_CORRECT + ROUND_BONUS,
    0,
  );
}
