/**
 * "Safe Path Adventure" — pure game engine (no React, no DOM, no rng).
 *
 * Every rule lives here so scripts/safepath.smoke.ts can drive a REAL
 * deterministic walkthrough under tsx. The component (SafePathGame.tsx)
 * only renders sessions and forwards inputs.
 *
 * Rules (PRD §9.6 — no guilt patterns):
 *  - Wrong decisions NEVER subtract score; they cost one heart and walk
 *    the player back to the last checkpoint ("Think again" — no shaming).
 *  - Out of hearts = a gentle "let's try that path again" pause; Try Again
 *    refills hearts at the checkpoint. Progress (score, cleared spots) is
 *    kept — practice is never punished.
 *  - Stars are 3/2/1 and never 0.
 *  - The hint shows the next few steps of the cheapest route (it prefers
 *    avoiding undecided unsafe spots) — it never moves the player and
 *    never answers a decision card.
 */
import type { SpChoice, SpLevel, SpObstacle } from './content';

export const SP_POINTS_DECISION = 100;
export const SP_POINTS_CHECKPOINT = 50;
export const SP_POINTS_SAFE = 50;
export const SP_POINTS_GOAL = 200;
export const SP_LIVES = 3;
export const SP_HINTS = 2;
export const SP_HINT_STEPS = 6;
/** Dijkstra step cost over an undecided unsafe spot (vs 1 for open path). */
const UNSAFE_STEP_COST = 25;

export interface SpPos {
  r: number;
  c: number;
}

export type SpDir = 'up' | 'down' | 'left' | 'right';

export type SpEvent =
  | { type: 'none' }
  | { type: 'blocked' }
  | { type: 'moved' }
  | { type: 'obstacle'; ch: string }
  | { type: 'safe'; ch: string }
  | { type: 'checkpoint' }
  | { type: 'goal' }
  | { type: 'correct'; ch: string }
  | { type: 'wrong'; ch: string }
  | { type: 'lostLives'; ch: string }
  | { type: 'safeCollected'; ch: string };

export interface SpSession {
  levelId: string;
  pos: SpPos;
  /** Respawn anchor: start, last flag, or last collected safe spot. */
  checkpoint: SpPos;
  lives: number;
  score: number;
  hintsLeft: number;
  /** Unsafe spots answered correctly (grid char → true). */
  cleared: Record<string, boolean>;
  /** Safe spots collected (grid char → true). */
  collectedSafe: Record<string, boolean>;
  /** 'C' flags taken, keyed "r,c" (a flag never pays twice). */
  flagsTaken: Record<string, boolean>;
  /** Grid char of the card the player must answer before moving again. */
  pendingCh: string | null;
  safeDecisions: number;
  wrongDecisions: number;
  reachedGoal: boolean;
  outOfLives: boolean;
}

const DIRS: Record<SpDir, SpPos> = {
  up: { r: -1, c: 0 },
  down: { r: 1, c: 0 },
  left: { r: 0, c: -1 },
  right: { r: 0, c: 1 },
};

export function cellAt(grid: string[], r: number, c: number): string {
  if (r < 0 || r >= grid.length) return '#';
  const row = grid[r];
  if (c < 0 || c >= row.length) return '#';
  return row[c];
}

export function findCell(grid: string[], ch: string): SpPos {
  for (let r = 0; r < grid.length; r++) {
    const c = grid[r].indexOf(ch);
    if (c >= 0) return { r, c };
  }
  return { r: 0, c: 0 };
}

export function obstacleByCh(level: SpLevel, ch: string): SpObstacle | undefined {
  return level.obstacles.find((o) => o.ch === ch);
}

export function newSpSession(level: SpLevel): SpSession {
  const start = findCell(level.grid, 'S');
  return {
    levelId: level.id,
    pos: start,
    checkpoint: start,
    lives: SP_LIVES,
    score: 0,
    hintsLeft: SP_HINTS,
    cleared: {},
    collectedSafe: {},
    flagsTaken: {},
    pendingCh: null,
    safeDecisions: 0,
    wrongDecisions: 0,
    reachedGoal: false,
    outOfLives: false,
  };
}

/** One step. Decision cards, the goal and the try-again pause block moves. */
export function spMove(level: SpLevel, s: SpSession, dir: SpDir): { s: SpSession; event: SpEvent } {
  if (s.pendingCh || s.reachedGoal || s.outOfLives) return { s, event: { type: 'none' } };
  const d = DIRS[dir];
  const r = s.pos.r + d.r;
  const c = s.pos.c + d.c;
  const cell = cellAt(level.grid, r, c);
  if (cell === '#') return { s, event: { type: 'blocked' } };

  const pos = { r, c };
  const ob = obstacleByCh(level, cell);
  if (ob) {
    if (ob.kind === 'unsafe' && !s.cleared[cell]) {
      return { s: { ...s, pos, pendingCh: cell }, event: { type: 'obstacle', ch: cell } };
    }
    if (ob.kind === 'safe' && !s.collectedSafe[cell]) {
      return { s: { ...s, pos, pendingCh: cell }, event: { type: 'safe', ch: cell } };
    }
    return { s: { ...s, pos }, event: { type: 'moved' } };
  }
  if (cell === 'C') {
    const key = `${r},${c}`;
    if (!s.flagsTaken[key]) {
      return {
        s: {
          ...s,
          pos,
          checkpoint: pos,
          flagsTaken: { ...s.flagsTaken, [key]: true },
          score: s.score + SP_POINTS_CHECKPOINT,
        },
        event: { type: 'checkpoint' },
      };
    }
    return { s: { ...s, pos }, event: { type: 'moved' } };
  }
  if (cell === 'Z') {
    return {
      s: { ...s, pos, score: s.score + SP_POINTS_GOAL, reachedGoal: true },
      event: { type: 'goal' },
    };
  }
  return { s: { ...s, pos }, event: { type: 'moved' } };
}

/** Answer the open unsafe card. Wrong: one heart, back to the checkpoint. */
export function spDecide(
  level: SpLevel,
  s: SpSession,
  choiceId: string,
): { s: SpSession; event: SpEvent; choice: SpChoice | null } {
  const ch = s.pendingCh;
  const ob = ch ? obstacleByCh(level, ch) : undefined;
  if (!ch || !ob || ob.kind !== 'unsafe') return { s, event: { type: 'none' }, choice: null };
  const choice = (ob.choices ?? []).find((x) => x.id === choiceId) ?? null;
  if (!choice) return { s, event: { type: 'none' }, choice: null };

  if (choice.correct) {
    return {
      s: {
        ...s,
        pendingCh: null,
        cleared: { ...s.cleared, [ch]: true },
        score: s.score + SP_POINTS_DECISION,
        safeDecisions: s.safeDecisions + 1,
      },
      event: { type: 'correct', ch },
      choice,
    };
  }
  const lives = s.lives - 1;
  if (lives <= 0) {
    return {
      s: { ...s, pendingCh: null, lives: 0, wrongDecisions: s.wrongDecisions + 1, outOfLives: true },
      event: { type: 'lostLives', ch },
      choice,
    };
  }
  return {
    s: {
      ...s,
      pendingCh: null,
      lives,
      wrongDecisions: s.wrongDecisions + 1,
      pos: s.checkpoint,
    },
    event: { type: 'wrong', ch },
    choice,
  };
}

/** Close the open safe card: +bonus, and this spot becomes the checkpoint. */
export function spAckSafe(level: SpLevel, s: SpSession): { s: SpSession; event: SpEvent } {
  const ch = s.pendingCh;
  const ob = ch ? obstacleByCh(level, ch) : undefined;
  if (!ch || !ob || ob.kind !== 'safe') return { s, event: { type: 'none' } };
  return {
    s: {
      ...s,
      pendingCh: null,
      collectedSafe: { ...s.collectedSafe, [ch]: true },
      checkpoint: s.pos,
      score: s.score + SP_POINTS_SAFE,
    },
    event: { type: 'safeCollected', ch },
  };
}

/** Gentle reset after the hearts run out: refill, respawn, keep progress. */
export function spTryAgain(s: SpSession): SpSession {
  if (!s.outOfLives) return s;
  return { ...s, lives: SP_LIVES, pos: s.checkpoint, outOfLives: false };
}

/**
 * Hint: cheapest route to the Safe Zone (Dijkstra; undecided unsafe spots
 * cost extra so the "safest" branch wins). Returns the next few steps —
 * never moves the player, never answers a card.
 */
export function spUseHint(
  level: SpLevel,
  s: SpSession,
): { s: SpSession; path: SpPos[] } | null {
  if (s.hintsLeft <= 0 || s.pendingCh || s.reachedGoal || s.outOfLives) return null;
  const grid = level.grid;
  const R = grid.length;
  const C = grid[0]?.length ?? 0;
  const idx = (r: number, c: number) => r * C + c;
  const dist = new Array<number>(R * C).fill(Infinity);
  const prev = new Array<number>(R * C).fill(-1);
  const done = new Array<boolean>(R * C).fill(false);
  dist[idx(s.pos.r, s.pos.c)] = 0;
  const goal = findCell(grid, 'Z');

  for (;;) {
    // Deterministic: smallest distance, ties broken by cell index.
    let u = -1;
    for (let i = 0; i < dist.length; i++) {
      if (!done[i] && dist[i] < (u < 0 ? Infinity : dist[u])) u = i;
    }
    if (u < 0 || dist[u] === Infinity) break;
    done[u] = true;
    const ur = Math.floor(u / C);
    const uc = u % C;
    if (ur === goal.r && uc === goal.c) break;
    for (const d of [DIRS.up, DIRS.down, DIRS.left, DIRS.right]) {
      const r = ur + d.r;
      const c = uc + d.c;
      const cell = cellAt(grid, r, c);
      if (cell === '#') continue;
      const ob = obstacleByCh(level, cell);
      const stepCost =
        ob && ob.kind === 'unsafe' && !s.cleared[cell] ? UNSAFE_STEP_COST : 1;
      const v = idx(r, c);
      if (dist[u] + stepCost < dist[v]) {
        dist[v] = dist[u] + stepCost;
        prev[v] = u;
      }
    }
  }

  const path: SpPos[] = [];
  let cur = idx(goal.r, goal.c);
  if (dist[cur] === Infinity) return { s: { ...s, hintsLeft: s.hintsLeft - 1 }, path };
  while (cur >= 0 && cur !== idx(s.pos.r, s.pos.c)) {
    path.unshift({ r: Math.floor(cur / C), c: cur % C });
    cur = prev[cur];
  }
  return { s: { ...s, hintsLeft: s.hintsLeft - 1 }, path: path.slice(0, SP_HINT_STEPS) };
}

/** Stars: 3 = no wrong decisions, 2 = one or two, 1 = more. Never 0. */
export function spStars(s: SpSession): 1 | 2 | 3 {
  if (s.wrongDecisions === 0) return 3;
  if (s.wrongDecisions <= 2) return 2;
  return 1;
}

export function spMaxScore(level: SpLevel): number {
  const unsafe = level.obstacles.filter((o) => o.kind === 'unsafe').length;
  const safe = level.obstacles.filter((o) => o.kind === 'safe').length;
  const flags = level.grid.reduce(
    (n, row) => n + row.split('').filter((ch) => ch === 'C').length,
    0,
  );
  return (
    unsafe * SP_POINTS_DECISION +
    safe * SP_POINTS_SAFE +
    flags * SP_POINTS_CHECKPOINT +
    SP_POINTS_GOAL
  );
}
