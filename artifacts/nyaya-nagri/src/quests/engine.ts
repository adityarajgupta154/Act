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
import type { Quest, QuestLevel, ChoiceOutcome } from './schema';
import { getRecap, type RecapItem } from './recaps';
import {
  advanceStreak,
  awardForLevel,
  newlyUnlockedTitles,
  todayString,
} from '@/economy/economy';

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
  /**
   * Task 15: which level of quest.levels this session is scoped to.
   * Null = classic full-quest session (Tasks 3-14 behavior, unchanged).
   */
  levelIndex: number | null;
  /**
   * Task 15: Practice/Replay of an already-completed level. A practice
   * session NEVER writes scores/progress — see finalizeLevel().
   */
  practice: boolean;
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
    levelIndex: null,
    practice: false,
  };
}

/** The QuestLevel a session is scoped to (null for full-quest sessions). */
export function getSessionLevel(session: QuestSession): QuestLevel | null {
  return session.levelIndex === null
    ? null
    : session.quest.levels[session.levelIndex] ?? null;
}

/**
 * Task 15: start a single LEVEL of a quest.
 * - Level 1 (story) begins with the silent pre-quiz (the literacy baseline
 *   must still be measured BEFORE any content is seen), then its scenes.
 * - Decision levels are scenes only, starting at the level's entry scene.
 * - The quiz level is the checkpoint: post-quiz + adaptive recap. It gets
 *   the pre-quiz answers recorded when Level 1 finished (priorPreAnswers)
 *   so the recap logic behaves exactly as in the classic flow.
 * - practice: replay of a completed level — the pre-quiz is skipped for
 *   story levels (the baseline is already recorded and must never be
 *   re-measured or overwritten).
 */
export function startLevel(
  quest: Quest,
  levelIndex: number,
  opts: { practice?: boolean; priorPreAnswers?: number[] } = {},
): QuestSession {
  const level = quest.levels[levelIndex];
  if (!level) throw new Error(`Quest ${quest.questId}: no level #${levelIndex}`);
  const practice = opts.practice ?? false;
  const base: QuestSession = { ...startQuest(quest), levelIndex, practice };

  if (level.kind === 'quiz') {
    return {
      ...base,
      phase: 'post-quiz',
      preAnswers: opts.priorPreAnswers ?? [],
    };
  }
  const isFirstPlayOfStory = level.kind === 'story' && !practice;
  return isFirstPlayOfStory
    ? base // pre-quiz first, scenes follow (entry scene set on transition)
    : { ...base, phase: 'scenes', currentSceneId: level.entryScene ?? null };
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
    // Level sessions start their scenes at the level's entry scene;
    // full-quest sessions start at the first scene (unchanged).
    const entryScene =
      getSessionLevel(session)?.entryScene ?? quest.scenes[0].sceneId;
    return isLast
      ? {
          ...session,
          preAnswers,
          phase: 'scenes',
          quizIndex: 0,
          currentSceneId: entryScene,
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

/**
 * Acknowledge scene feedback → next scene, or the phase after the scenes.
 * Full-quest sessions continue to the post-quiz (unchanged). Level
 * sessions COMPLETE when the story crosses the level border — the next
 * scene belongs to the next level and is never shown early.
 */
export function acknowledgeSceneFeedback(session: QuestSession): QuestSession {
  if (session.phase !== 'scenes' || !session.pendingFeedback) return session;
  const next = session.pendingFeedback.nextSceneId;
  const nextExists = next && session.quest.scenes.some((s) => s.sceneId === next);
  const level = getSessionLevel(session);
  const staysInLevel = !level || (next && level.sceneIds?.includes(next));

  if (nextExists && staysInLevel) {
    return { ...session, pendingFeedback: null, currentSceneId: next! };
  }
  if (level) {
    // Scene levels end here — the quiz only lives in the quiz level.
    return { ...session, pendingFeedback: null, currentSceneId: null, phase: 'complete' };
  }
  return {
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

/** Storage key for a level's progress/replay entries: "zone1:level2". */
export function levelKey(zoneId: string, levelId: string): string {
  return `${zoneId}:${levelId}`;
}

export interface LevelResult {
  /** Task 16: XP awarded (0 for practice/replays). */
  xpAwarded: number;
  /** Task 16: Coins awarded (0 for practice/replays). */
  coinsAwarded: number;
  /** Task 16: title ids newly unlocked by this completion (private). */
  newTitles: string[];
  questId: string;
  zoneId: string;
  levelId: string;
  levelIndex: number;
  kind: QuestLevel['kind'];
  /** False for Practice/Replay — nothing was written to recorded progress. */
  recorded: boolean;
  /** True only when this finalization completed the whole zone. */
  zoneCompleted: boolean;
  /** Post-quiz score, present for quiz-level sessions (shown even in practice). */
  postScore: number | null;
  total: number;
  badgeId: string | null;
}

/**
 * Task 15: the ONLY side-effectful step for level sessions.
 * - First completion of a level marks it complete; the QUIZ (final) level
 *   additionally records the post score, awards the zone badge, and marks
 *   the zone complete — which is what unlocks the next zone via Task 1's
 *   untouched lock rules. Story-level completion stores the silent
 *   pre-quiz baseline (score + answer indices for the adaptive recap).
 * - Practice/Replay (or re-finalizing an already-completed level) NEVER
 *   overwrites recorded scores/progress — it only bumps the separate
 *   replayCounts (Task 9 analytics stay pristine).
 */
export function finalizeLevel(session: QuestSession): LevelResult {
  const { quest } = session;
  const level = getSessionLevel(session);
  if (!level || session.levelIndex === null) {
    throw new Error('finalizeLevel called on a non-level session');
  }
  const key = levelKey(quest.zoneId, level.levelId);
  const state = progressStore.getState();
  const alreadyComplete =
    !!state.levelProgress[key] || !!state.completedZones[quest.zoneId];
  const isQuizLevel = level.kind === 'quiz';
  const postScore = isQuizLevel ? scoreAnswers(quest, session.postAnswers) : null;

  if (session.practice || alreadyComplete) {
    progressStore.update({
      replayCounts: { ...state.replayCounts, [key]: (state.replayCounts[key] ?? 0) + 1 },
      // Practice still counts as "played today" for the gentle streak —
      // but NEVER awards XP/Coins (no practice grinding, Task 16).
      streak: advanceStreak(state.streak, todayString()),
    });
    return {
      questId: quest.questId,
      zoneId: quest.zoneId,
      levelId: level.levelId,
      levelIndex: session.levelIndex,
      kind: level.kind,
      recorded: false,
      zoneCompleted: false,
      postScore,
      total: quest.quizQuestions.length,
      badgeId: null,
      xpAwarded: 0,
      coinsAwarded: 0,
      newTitles: [],
    };
  }

  const existing = state.quizScores[quest.questId];
  const patch: Parameters<typeof progressStore.update>[0] = {
    levelProgress: { ...state.levelProgress, [key]: true },
  };

  if (level.kind === 'story') {
    // Baseline measured before any content — stored for the quiz level's
    // adaptive recap and the Task 9 literacy-delta analytics.
    const preScore = scoreAnswers(quest, session.preAnswers);
    patch.preAnswersByQuest = {
      ...state.preAnswersByQuest,
      [quest.questId]: [...session.preAnswers],
    };
    patch.quizScores = {
      ...state.quizScores,
      [quest.questId]: { pre: preScore, post: existing?.post ?? null },
    };
  }

  let zoneCompleted = false;
  let badgeId: string | null = null;
  if (isQuizLevel) {
    // The quiz level is validated to be LAST — passing it completes the
    // zone (Task 1 lock rules unlock the next zone off completedZones).
    const preScore = existing?.pre ?? scoreAnswers(quest, session.preAnswers);
    badgeId = `${quest.zoneId}_star`;
    zoneCompleted = true;
    patch.quizScores = {
      ...state.quizScores,
      [quest.questId]: { pre: preScore, post: postScore },
    };
    patch.badges = { ...state.badges, [badgeId]: true };
    patch.completedZones = { ...state.completedZones, [quest.zoneId]: true };
  }

  // Task 16 economy — awarded ONLY on this recorded path, so XP/Coins keep
  // the same single-write-authority guarantee as scores and badges. Rank is
  // derived from XP at render time and never stored.
  const award = awardForLevel(level.kind, zoneCompleted);
  patch.xp = state.xp + award.xp;
  patch.coins = state.coins + award.coins;
  patch.streak = advanceStreak(state.streak, todayString());

  // Titles: evaluate milestone predicates against the post-completion state.
  const postState = { ...state, ...patch };
  const newTitles = newlyUnlockedTitles(state.titles, postState);
  if (newTitles.length > 0) {
    patch.titles = {
      ...state.titles,
      ...Object.fromEntries(newTitles.map((id) => [id, true])),
    };
  }

  progressStore.update(patch);
  return {
    questId: quest.questId,
    zoneId: quest.zoneId,
    levelId: level.levelId,
    levelIndex: session.levelIndex,
    kind: level.kind,
    recorded: true,
    zoneCompleted,
    postScore,
    total: quest.quizQuestions.length,
    badgeId,
    xpAwarded: award.xp,
    coinsAwarded: award.coins,
    newTitles,
  };
}
