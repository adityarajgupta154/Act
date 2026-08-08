/**
 * Nyaya Nagri — Quest Engine (Task 3)
 *
 * Pure, framework-agnostic state machine so it can be unit-tested and
 * reused by every zone. Flow:
 *
 *   pre-quiz (silent — answers recorded, NO right/wrong shown)
 *     → scenes (narration + branching choices, immediate feedback)
 *       → post-quiz (same questions, feedback + score shown)
 *         → complete (scores stored, zone unlocked, badge awarded)
 *
 * The pre/post pair measures literacy improvement (PRD §5.2/§5.4).
 * All side effects live in finalizeQuest() — the reducer stays pure.
 */

import { progressStore } from '@/data/progressStore';
import type { Quest, ChoiceOutcome } from './schema';
import { getRecap, type RecapItem } from './recaps';

export type QuestPhase = 'pre-quiz' | 'scenes' | 'post-quiz' | 'recap' | 'complete';

/**
 * Adaptive difficulty (Task 9): a pre-quiz score strictly below this share
 * of the total counts as "very low" and triggers the "let's revisit" recap
 * phase after the post-quiz, before the quest-complete screen.
 */
export const RECAP_TRIGGER_RATIO = 0.5;

export interface SceneFeedback {
  outcome: ChoiceOutcome;
  feedback: string;
  /** Scene the accepted choice leads to (undefined = scenes finished). */
  nextSceneId?: string;
}

export interface QuestSession {
  quest: Quest;
  phase: QuestPhase;
  /** Index of the current question within the active quiz phase. */
  quizIndex: number;
  preAnswers: number[];
  postAnswers: number[];
  /** For the post-quiz only: feedback for the question just answered. */
  lastQuizFeedback: { correct: boolean; explanation: string } | null;
  /**
   * Adaptive recap (Task 9): quiz-question indices the player answered wrong
   * in the SILENT pre-quiz, queued for a friendly revisit after the
   * post-quiz. Populated only when the pre-quiz score was very low. The UI
   * must never present this as "you got these wrong" — pre-quiz results
   * stay unrevealed; the recap is framed as one more look at big ideas.
   */
  recapQueue: number[];
  /** Position within recapQueue during the 'recap' phase. */
  recapIndex: number;
  /** Feedback for the recap question just answered (awaiting acknowledge). */
  recapFeedback: { correct: boolean; explanation: string } | null;
  currentSceneId: string | null;
  /** Feedback awaiting acknowledgement for the last scene choice. */
  pendingFeedback: SceneFeedback | null;
  choiceLog: Array<{ sceneId: string; choiceIndex: number; outcome: ChoiceOutcome }>;
}

export function startQuest(quest: Quest): QuestSession {
  return {
    quest,
    phase: 'pre-quiz',
    quizIndex: 0,
    preAnswers: [],
    postAnswers: [],
    lastQuizFeedback: null,
    recapQueue: [],
    recapIndex: 0,
    recapFeedback: null,
    currentSceneId: null,
    pendingFeedback: null,
    choiceLog: [],
  };
}

export function scoreAnswers(quest: Quest, answers: number[]): number {
  return quest.quizQuestions.reduce(
    (score, q, i) => (answers[i] === q.correctIndex ? score + 1 : score),
    0,
  );
}

/** Answer the current quiz question (works for both pre and post phases). */
export function answerQuizQuestion(
  session: QuestSession,
  optionIndex: number,
): QuestSession {
  const { quest, phase, quizIndex } = session;
  if (phase !== 'pre-quiz' && phase !== 'post-quiz') return session;
  const question = quest.quizQuestions[quizIndex];
  if (!question || optionIndex < 0 || optionIndex >= question.options.length) {
    return session;
  }

  const isLast = quizIndex === quest.quizQuestions.length - 1;

  if (phase === 'pre-quiz') {
    // Silent: record only, never reveal correctness (that is the point of
    // the baseline measurement).
    const preAnswers = [...session.preAnswers, optionIndex];
    return isLast
      ? {
          ...session,
          preAnswers,
          phase: 'scenes',
          quizIndex: 0,
          currentSceneId: quest.scenes[0].sceneId,
        }
      : { ...session, preAnswers, quizIndex: quizIndex + 1 };
  }

  // post-quiz: show correctness + explanation; advance on acknowledge.
  const postAnswers = [...session.postAnswers, optionIndex];
  return {
    ...session,
    postAnswers,
    lastQuizFeedback: {
      correct: optionIndex === question.correctIndex,
      explanation: question.explanation,
    },
  };
}

/**
 * Which quiz-question indices qualify for the recap phase: only when the
 * pre-quiz score was very low, and only questions answered wrong in the
 * pre-quiz that have hard-coded recap content.
 */
export function buildRecapQueue(session: QuestSession): number[] {
  const { quest, preAnswers } = session;
  const total = quest.quizQuestions.length;
  const preScore = scoreAnswers(quest, preAnswers);
  if (preScore >= total * RECAP_TRIGGER_RATIO) return [];
  return quest.quizQuestions
    .map((q, i) => i)
    .filter(
      (i) =>
        preAnswers[i] !== quest.quizQuestions[i].correctIndex &&
        getRecap(quest.questId, i, quest.language ?? 'en') !== null,
    );
}

/** Acknowledge post-quiz feedback and move to the next question / finish. */
export function acknowledgeQuizFeedback(session: QuestSession): QuestSession {
  if (session.phase !== 'post-quiz' || !session.lastQuizFeedback) return session;
  const isLast = session.quizIndex === session.quest.quizQuestions.length - 1;
  if (!isLast) {
    return { ...session, lastQuizFeedback: null, quizIndex: session.quizIndex + 1 };
  }
  // Adaptive step: a very low pre-quiz baseline earns a friendly revisit of
  // those concepts before the quest wraps up; otherwise proceed directly.
  const recapQueue = buildRecapQueue(session);
  return recapQueue.length > 0
    ? { ...session, lastQuizFeedback: null, phase: 'recap', recapQueue, recapIndex: 0 }
    : { ...session, lastQuizFeedback: null, phase: 'complete' };
}

/** The recap item currently on screen during the 'recap' phase. */
export function getActiveRecap(session: QuestSession): RecapItem | null {
  if (session.phase !== 'recap') return null;
  const questionIndex = session.recapQueue[session.recapIndex];
  if (questionIndex === undefined) return null;
  return getRecap(session.quest.questId, questionIndex, session.quest.language ?? 'en');
}

/** Answer the reinforcing question of the current recap item. */
export function answerRecapQuestion(
  session: QuestSession,
  optionIndex: number,
): QuestSession {
  if (session.phase !== 'recap' || session.recapFeedback) return session;
  const item = getActiveRecap(session);
  if (!item || optionIndex < 0 || optionIndex >= item.options.length) return session;
  return {
    ...session,
    recapFeedback: {
      correct: optionIndex === item.correctIndex,
      explanation: item.explanation,
    },
  };
}

/**
 * Acknowledge recap feedback → next recap item, or complete when done.
 * One pass only: right or wrong, the player always moves forward — the
 * recap reinforces, it never traps.
 */
export function acknowledgeRecapFeedback(session: QuestSession): QuestSession {
  if (session.phase !== 'recap' || !session.recapFeedback) return session;
  const isLast = session.recapIndex === session.recapQueue.length - 1;
  return isLast
    ? { ...session, recapFeedback: null, phase: 'complete' }
    : { ...session, recapFeedback: null, recapIndex: session.recapIndex + 1 };
}

export function getCurrentScene(session: QuestSession) {
  return session.quest.scenes.find((s) => s.sceneId === session.currentSceneId) ?? null;
}

/** Pick a choice in the current scene; feedback becomes pending. */
export function chooseSceneOption(
  session: QuestSession,
  choiceIndex: number,
): QuestSession {
  if (session.phase !== 'scenes' || session.pendingFeedback) return session;
  const scene = getCurrentScene(session);
  const choice = scene?.choices[choiceIndex];
  if (!scene || !choice) return session;

  return {
    ...session,
    pendingFeedback: {
      outcome: choice.outcome,
      feedback: choice.feedback,
      nextSceneId: choice.nextScene,
    },
    choiceLog: [
      ...session.choiceLog,
      { sceneId: scene.sceneId, choiceIndex, outcome: choice.outcome },
    ],
  };
}

/** Acknowledge scene feedback → next scene, or post-quiz when scenes end. */
export function acknowledgeSceneFeedback(session: QuestSession): QuestSession {
  if (session.phase !== 'scenes' || !session.pendingFeedback) return session;
  const next = session.pendingFeedback.nextSceneId;
  const nextExists = next && session.quest.scenes.some((s) => s.sceneId === next);

  return nextExists
    ? { ...session, pendingFeedback: null, currentSceneId: next }
    : {
        ...session,
        pendingFeedback: null,
        currentSceneId: null,
        phase: 'post-quiz',
        quizIndex: 0,
      };
}

export interface QuestResult {
  questId: string;
  zoneId: string;
  preScore: number;
  postScore: number;
  total: number;
  badgeId: string;
}

/**
 * The ONLY side-effectful step: store pre/post scores, mark the zone
 * complete (which unlocks the next zone via Task 1's lock rules), and
 * award the zone badge.
 */
export function finalizeQuest(session: QuestSession): QuestResult {
  const { quest } = session;
  const preScore = scoreAnswers(quest, session.preAnswers);
  const postScore = scoreAnswers(quest, session.postAnswers);
  const badgeId = `${quest.zoneId}_star`;

  const state = progressStore.getState();
  progressStore.update({
    quizScores: {
      ...state.quizScores,
      [quest.questId]: { pre: preScore, post: postScore },
    },
    badges: { ...state.badges, [badgeId]: true },
    completedZones: { ...state.completedZones, [quest.zoneId]: true },
  });

  return {
    questId: quest.questId,
    zoneId: quest.zoneId,
    preScore,
    postScore,
    total: quest.quizQuestions.length,
    badgeId,
  };
}
