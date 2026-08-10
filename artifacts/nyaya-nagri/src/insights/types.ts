/**
 * Learning & Development Insights — data types + load-time sanitizers.
 *
 * ActivityEvent is the single tracked unit (spec: CHILD ACTIVITY TRACKING).
 * Field names follow the task spec verbatim (questionId, zoneId, topic,
 * difficulty, selectedAnswer, correctAnswer, isCorrect, attempts,
 * responseTime, hintsUsed, completed, timestamp, score, retryCount).
 *
 * PRIVACY (spec §13 + PRD §9.4 data minimization):
 *   - events hold ONLY option INDICES and derived stats — never free text,
 *     never a name, never anything typed by the child;
 *   - `topic` is the stable zone id (zones ARE the topics in this game);
 *   - everything lives in the SAME consent-gated progress store as the rest
 *     of the game state (nothing persists before guardian consent);
 *   - the log is hard-capped; lifetime totals beyond the cap are not kept.
 *
 * HONESTY NOTES (deliberate, disclosed):
 *   - attempts is always 1: the quiz engine is single-shot per question.
 *   - hintsUsed is always 0: no hint mechanic exists in the game today.
 *     The adaptive RECAP phase and practice REPLAYS are the real "guided
 *     help" behaviors, tracked as their own kinds — the analyzer surfaces
 *     those instead of fabricating hint counts.
 */

export type ActivityKind =
  | 'quiz-pre'
  | 'quiz-post'
  | 'recap'
  | 'scene-choice'
  | 'activity';

/** Derived, honest difficulty tags — never a judgement of the child. */
export type ActivityDifficulty =
  | 'baseline' // silent pre-quiz measurement
  | 'checkpoint' // scored post/boss quiz (completes the zone)
  | 'practice' // adaptive recap revisit
  | 'scenario' // in-story decision
  | 'mini-game'; // memory/hidden/sorting/authorities activities

export interface ActivityEvent {
  questionId: string;
  zoneId: string;
  /** Stable topic key — the zone id (zone names are the topics). */
  topic: string;
  difficulty: ActivityDifficulty;
  /** Option index the child picked (never option text). */
  selectedAnswer: number | null;
  /** Correct option index, when the item has a single correct option. */
  correctAnswer: number | null;
  isCorrect: boolean;
  /** Always 1 today — the engine is single-shot per question (honest). */
  attempts: number;
  /** Active answer time in ms (shown -> answered), clamped. */
  responseTime: number;
  /** Always 0 today — no hint mechanic exists (honest; see recap/replay). */
  hintsUsed: number;
  completed: boolean;
  timestamp: number;
  /** 1/0 for questions; activity score for mini-games. */
  score: number;
  /** Practice replays of this level recorded BEFORE this event. */
  retryCount: number;
  kind: ActivityKind;
  /** Device-local session ordinal (a >30 min gap starts a new session). */
  session: number;
  /** True when the event came from a practice/replay run. */
  practice: boolean;
}

/** Insights bookkeeping stored alongside the log (same consent gating). */
export interface InsightsMeta {
  /** Sum of event responseTimes — "active learning time", not wall clock. */
  timeSpentMs: number;
  /**
   * Cached AI narratives (spec §18: batch + cache, never per click), keyed
   * `${language}:${audience}` so teacher and parent views never evict each
   * other (≤4 real keys). The fingerprint ties each entry to the exact
   * data it was generated from.
   */
  aiCache: Record<string, InsightsAiCacheEntry>;
}

export interface InsightsAiCacheEntry {
  fingerprint: string;
  generatedAt: number;
  data: unknown;
}

/** Hard cap — the log is a rolling window, oldest events drop first. */
export const MAX_ACTIVITY_EVENTS = 400;
/** A gap of 30+ minutes between events starts a new learning session. */
export const SESSION_GAP_MS = 30 * 60 * 1000;
/** responseTime clamp: 0 .. 30 minutes (anything longer = left open). */
export const MAX_RESPONSE_TIME_MS = 30 * 60 * 1000;

export function defaultInsightsMeta(): InsightsMeta {
  return { timeSpentMs: 0, aiCache: {} };
}

const KINDS: ReadonlySet<string> = new Set([
  'quiz-pre',
  'quiz-post',
  'recap',
  'scene-choice',
  'activity',
]);
const DIFFICULTIES: ReadonlySet<string> = new Set([
  'baseline',
  'checkpoint',
  'practice',
  'scenario',
  'mini-game',
]);

const isIndex = (v: unknown): v is number | null =>
  v === null || (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 50);
const isCount = (v: unknown, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;

/** Load-time ingress (same rule as every other store field): drop garbage. */
export function sanitizeActivityLog(value: unknown): ActivityEvent[] {
  if (!Array.isArray(value)) return [];
  const out: ActivityEvent[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const e = raw as Record<string, unknown>;
    if (
      typeof e.questionId !== 'string' ||
      e.questionId.length === 0 ||
      e.questionId.length > 120 ||
      typeof e.zoneId !== 'string' ||
      e.zoneId.length > 24 ||
      typeof e.topic !== 'string' ||
      e.topic.length > 24 ||
      typeof e.difficulty !== 'string' ||
      !DIFFICULTIES.has(e.difficulty) ||
      typeof e.kind !== 'string' ||
      !KINDS.has(e.kind) ||
      !isIndex(e.selectedAnswer ?? null) ||
      !isIndex(e.correctAnswer ?? null) ||
      typeof e.isCorrect !== 'boolean' ||
      typeof e.completed !== 'boolean' ||
      typeof e.practice !== 'boolean' ||
      !isCount(e.attempts, 99) ||
      !isCount(e.responseTime, MAX_RESPONSE_TIME_MS) ||
      !isCount(e.hintsUsed, 99) ||
      !isCount(e.timestamp, 4102444800000) || // sane epoch-ms upper bound (2100)
      !isCount(e.score, 50) ||
      !isCount(e.retryCount, 9999) ||
      !isCount(e.session, 100000)
    ) {
      continue;
    }
    out.push({
      questionId: e.questionId,
      zoneId: e.zoneId,
      topic: e.topic,
      difficulty: e.difficulty as ActivityDifficulty,
      selectedAnswer: (e.selectedAnswer ?? null) as number | null,
      correctAnswer: (e.correctAnswer ?? null) as number | null,
      isCorrect: e.isCorrect,
      attempts: Math.floor(e.attempts as number),
      responseTime: Math.floor(e.responseTime as number),
      hintsUsed: Math.floor(e.hintsUsed as number),
      completed: e.completed,
      timestamp: Math.floor(e.timestamp as number),
      score: Math.floor(e.score as number),
      retryCount: Math.floor(e.retryCount as number),
      kind: e.kind as ActivityKind,
      session: Math.floor(e.session as number),
      practice: e.practice,
    });
  }
  return out.slice(-MAX_ACTIVITY_EVENTS);
}

export function sanitizeInsightsMeta(value: unknown): InsightsMeta {
  const base = defaultInsightsMeta();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return base;
  const m = value as Record<string, unknown>;
  if (isCount(m.timeSpentMs, 1000 * 60 * 60 * 24 * 365)) {
    base.timeSpentMs = Math.floor(m.timeSpentMs as number);
  }
  // Record keyed `${language}:${audience}`; each entry validated on its
  // own, garbage (including the legacy single-object cache shape) dropped.
  const c = m.aiCache;
  if (c && typeof c === 'object' && !Array.isArray(c)) {
    for (const [key, raw] of Object.entries(c as Record<string, unknown>)) {
      if (Object.keys(base.aiCache).length >= 8) break;
      if (key.length === 0 || key.length > 32) continue;
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
      const entry = raw as Record<string, unknown>;
      if (
        typeof entry.fingerprint === 'string' &&
        entry.fingerprint.length <= 200 &&
        isCount(entry.generatedAt, 4102444800000) &&
        entry.data !== null &&
        typeof entry.data === 'object' &&
        !Array.isArray(entry.data)
      ) {
        base.aiCache[key] = {
          fingerprint: entry.fingerprint,
          generatedAt: Math.floor(entry.generatedAt as number),
          data: entry.data,
        };
      }
    }
  }
  return base;
}
