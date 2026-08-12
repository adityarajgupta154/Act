/**
 * "Right or Wrong?" — pure game logic (no React, no DOM, no timers).
 *
 * Jury feedback drove this feature: the app needed a REAL game loop, not
 * another quiz. This module is the loop's brain: rounds are shuffled, the
 * correct card lands on a random side, picks score points and build streaks,
 * and the session completes after the last round.
 *
 * PRD §9.8: every scenario, law fact, and feedback line is hard-coded in
 * data.ts — this module never generates or alters content. Scoring has no
 * real-money mechanics and no streak-guilt (PRD §9.6): streaks only ever ADD
 * a small bonus; breaking one never subtracts or scolds.
 *
 * Kept UI-free so `scripts/rightwrong.smoke.ts` can drive full sessions
 * deterministically (injectable rng).
 */

export const POINTS_CORRECT = 100;
export const STREAK_EVERY = 3;
export const STREAK_BONUS = 50;

export type CardKind = 'right' | 'wrong';

export type RwOutcome = 'correct' | 'correct-after-wrong' | 'wrong' | null;

export interface RwSession {
  /** Indexes into the rounds array, shuffled once per session. */
  order: number[];
  /** Per played round: true = the RIGHT card renders first (left / top). */
  rightFirst: boolean[];
  /** 0-based position inside `order`. */
  roundIndex: number;
  score: number;
  /** Consecutive first-try corrects (resets on a wrong pick). */
  streak: number;
  firstTryCorrect: number;
  wrongAttempts: number;
  /** The child already tapped the wrong card this round (no points now). */
  triedWrongThisRound: boolean;
  /** Feedback of the most recent pick; cleared when the round advances. */
  outcome: RwOutcome;
  /** Streak bonus granted with the last correct pick (0 when none). */
  lastBonus: number;
  phase: 'playing' | 'complete';
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

export function newRwSession(roundCount: number, rng: () => number = Math.random): RwSession {
  const order = shuffle([...Array(roundCount).keys()], rng);
  return {
    order,
    rightFirst: order.map(() => rng() < 0.5),
    roundIndex: 0,
    score: 0,
    streak: 0,
    firstTryCorrect: 0,
    wrongAttempts: 0,
    triedWrongThisRound: false,
    outcome: null,
    lastBonus: 0,
    phase: 'playing',
  };
}

/**
 * The child taps a card. Pure transition:
 * - wrong (first time)  → gentle feedback, streak resets, wrong card locks;
 * - wrong (again)       → no-op (card is already locked);
 * - right (first try)   → +100, streak grows, every 3rd streak adds +50;
 * - right (after wrong) → positive feedback, no points (stars stay honest);
 * - any tap during the correct-feedback window or after completion → no-op.
 */
export function pickCard(s: RwSession, pick: CardKind): RwSession {
  if (s.phase !== 'playing') return s;
  if (s.outcome === 'correct' || s.outcome === 'correct-after-wrong') return s;

  if (pick === 'wrong') {
    if (s.triedWrongThisRound) return s;
    return {
      ...s,
      triedWrongThisRound: true,
      wrongAttempts: s.wrongAttempts + 1,
      streak: 0,
      outcome: 'wrong',
      lastBonus: 0,
    };
  }

  if (s.triedWrongThisRound) {
    return { ...s, outcome: 'correct-after-wrong', lastBonus: 0 };
  }

  const streak = s.streak + 1;
  const bonus = streak % STREAK_EVERY === 0 ? STREAK_BONUS : 0;
  return {
    ...s,
    streak,
    score: s.score + POINTS_CORRECT + bonus,
    firstTryCorrect: s.firstTryCorrect + 1,
    outcome: 'correct',
    lastBonus: bonus,
  };
}

/** UI calls this after the correct-feedback pause; completes after the last round. */
export function advanceRound(s: RwSession): RwSession {
  if (s.outcome !== 'correct' && s.outcome !== 'correct-after-wrong') return s;
  const next = s.roundIndex + 1;
  if (next >= s.order.length) {
    return { ...s, phase: 'complete', outcome: null, triedWrongThisRound: false };
  }
  return { ...s, roundIndex: next, outcome: null, lastBonus: 0 };
}

/** Dismiss the gentle try-again feedback so the other card can be chosen calmly. */
export function clearWrongFeedback(s: RwSession): RwSession {
  return s.outcome === 'wrong' ? { ...s, outcome: null } : s;
}

/** Stars = rounds solved on the first try (0..roundCount). */
export function starsEarned(s: RwSession): number {
  return s.firstTryCorrect;
}

/** Best achievable score for a session of `roundCount` rounds. */
export function maxScore(roundCount: number): number {
  return roundCount * POINTS_CORRECT + Math.floor(roundCount / STREAK_EVERY) * STREAK_BONUS;
}
