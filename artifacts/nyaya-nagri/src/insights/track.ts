/**
 * Learning & Development Insights — event builders + the single append path.
 *
 * The quest engine stays a pure state machine: transitions BUILD events into
 * session.pendingEvents, and only finalizeQuest()/finalizeLevel() — the
 * engine's existing single side-effect points — flush them here. A session
 * abandoned mid-level therefore records nothing, exactly like every other
 * progress write in the game (single-write-authority rule, Task 15).
 */

import { progressStore, type ProgressState } from '@/data/progressStore';
import type { QuestSession } from '@/quests/engine';
import type { QuizQuestion } from '@/quests/schema';
import type { RecapItem } from '@/quests/recaps';
import {
  MAX_ACTIVITY_EVENTS,
  MAX_RESPONSE_TIME_MS,
  SESSION_GAP_MS,
  type ActivityDifficulty,
  type ActivityEvent,
  type ActivityKind,
} from './types';

/** Active answer time: question shown -> answered, clamped to sane bounds. */
export function elapsedSince(shownAt: number): number {
  const ms = Date.now() - shownAt;
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.min(Math.floor(ms), MAX_RESPONSE_TIME_MS);
}

function baseEvent(
  session: QuestSession,
  kind: ActivityKind,
  difficulty: ActivityDifficulty,
): Pick<
  ActivityEvent,
  'zoneId' | 'topic' | 'kind' | 'difficulty' | 'attempts' | 'hintsUsed' | 'timestamp' | 'retryCount' | 'session' | 'practice'
> {
  return {
    zoneId: session.quest.zoneId,
    topic: session.quest.zoneId, // zones ARE the topics (single source)
    kind,
    difficulty,
    attempts: 1, // engine is single-shot per question (honest)
    hintsUsed: 0, // no hint mechanic exists (honest)
    timestamp: Date.now(),
    retryCount: 0, // filled at flush time from replayCounts
    session: 0, // filled at flush time from the stored log
    practice: false, // filled at flush time from the session flag
  };
}

/** A pre/post quiz answer. */
export function buildQuizEvent(
  session: QuestSession,
  question: QuizQuestion,
  quizIndex: number,
  optionIndex: number,
  kind: 'quiz-pre' | 'quiz-post',
): ActivityEvent {
  return {
    ...baseEvent(session, kind, kind === 'quiz-pre' ? 'baseline' : 'checkpoint'),
    questionId: `${session.quest.questId}:quiz:q${quizIndex}`,
    selectedAnswer: optionIndex,
    correctAnswer: question.correctIndex,
    isCorrect: optionIndex === question.correctIndex,
    responseTime: elapsedSince(session.questionShownAt),
    completed: true,
    score: optionIndex === question.correctIndex ? 1 : 0,
  };
}

/** An adaptive-recap reinforcing answer (the game's "guided revisit"). */
export function buildRecapEvent(
  session: QuestSession,
  item: RecapItem,
  questionIndex: number,
  optionIndex: number,
): ActivityEvent {
  return {
    ...baseEvent(session, 'recap', 'practice'),
    questionId: `${session.quest.questId}:recap:q${questionIndex}`,
    selectedAnswer: optionIndex,
    correctAnswer: item.correctIndex,
    isCorrect: optionIndex === item.correctIndex,
    responseTime: elapsedSince(session.questionShownAt),
    completed: true,
    score: optionIndex === item.correctIndex ? 1 : 0,
  };
}

/**
 * A story decision. Neutral choices are navigation, not measurement — the
 * caller must skip them (only correct/incorrect outcomes reach here).
 */
export function buildSceneChoiceEvent(
  session: QuestSession,
  sceneId: string,
  choiceIndex: number,
  correctChoiceIndex: number | null,
  isCorrect: boolean,
): ActivityEvent {
  return {
    ...baseEvent(session, 'scene-choice', 'scenario'),
    questionId: `${session.quest.questId}:${sceneId}:choice`,
    selectedAnswer: choiceIndex,
    correctAnswer: correctChoiceIndex,
    isCorrect,
    responseTime: elapsedSince(session.questionShownAt),
    completed: true,
    score: isCorrect ? 1 : 0,
  };
}

/** One event per finished mini-game activity (gentle scores, Task 18). */
export function buildActivityEvent(
  session: QuestSession,
  levelId: string,
  score: number,
  total: number,
): ActivityEvent {
  return {
    ...baseEvent(session, 'activity', 'mini-game'),
    questionId: `${session.quest.questId}:${levelId}:activity`,
    selectedAnswer: null,
    correctAnswer: null,
    isCorrect: total > 0 && score >= total,
    responseTime: elapsedSince(session.questionShownAt),
    completed: true,
    score: Math.max(0, Math.min(50, Math.floor(score))),
  };
}

/**
 * THE single append path: called only from finalizeQuest()/finalizeLevel().
 * Stamps session ordinal (30-min gap rule), practice flag and retryCount,
 * enforces the rolling cap, and accumulates active-time bookkeeping.
 */
export function flushActivityEvents(
  events: ActivityEvent[],
  opts: { practice: boolean; retryCount: number },
): void {
  if (events.length === 0) return;
  const state = progressStore.getState();
  const log = state.activityLog;
  const last = log[log.length - 1];
  const now = events[0]?.timestamp ?? Date.now();
  const sessionOrdinal =
    last === undefined
      ? 1
      : now - last.timestamp > SESSION_GAP_MS
        ? last.session + 1
        : last.session;

  const stamped = events.map((e) => ({
    ...e,
    session: sessionOrdinal,
    practice: opts.practice,
    retryCount: Math.max(0, Math.floor(opts.retryCount)),
  }));
  const activeMs = stamped.reduce((sum, e) => sum + e.responseTime, 0);

  progressStore.update({
    activityLog: [...log, ...stamped].slice(-MAX_ACTIVITY_EVENTS),
    insightsMeta: {
      ...state.insightsMeta,
      timeSpentMs: state.insightsMeta.timeSpentMs + activeMs,
    },
  });
}

/**
 * Cache key for the AI narrative (spec §18): changes only when the data a
 * report is built from changes.
 */
export function insightsFingerprint(
  s: ProgressState = progressStore.getState(),
): string {
  const log = s.activityLog;
  const last = log[log.length - 1];
  const zonesDone = Object.values(s.completedZones).filter(Boolean).length;
  const levelsDone = Object.values(s.levelProgress).filter(Boolean).length;
  // v2: also covers every non-event input the AI summary is built from
  // (badges, replay counts, streak) so the cache can never serve a
  // narrative computed from different numbers than the dashboard shows.
  const badges = Object.values(s.badges).filter(Boolean).length;
  const replays = Object.values(s.replayCounts).reduce((a, b) => a + b, 0);
  return `v2:${log.length}:${last?.timestamp ?? 0}:${zonesDone}:${levelsDone}:${badges}:${replays}:${s.streak.count}`;
}
