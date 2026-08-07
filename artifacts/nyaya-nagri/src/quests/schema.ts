/**
 * Nyaya Nagri — Quest schema (Task 3)
 *
 * JSON-based quest format that every zone's content plugs into from Task 4
 * onward. Per PRD §9.8 all quest content (narration, choice correctness,
 * quiz questions, explanations) is static, hard-coded data — never
 * AI-generated at runtime.
 */

import type { AgeBand } from '@/data/progressStore';

export type ChoiceOutcome = 'correct' | 'incorrect' | 'neutral';

export interface QuestChoice {
  text: string;
  outcome: ChoiceOutcome;
  /** Short, empowering explanation shown right after the choice. */
  feedback: string;
  /** Scene to go to next; omit (or point nowhere) to finish the scenes. */
  nextScene?: string;
}

export interface QuestScene {
  sceneId: string;
  narration: string;
  choices: QuestChoice[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quest {
  questId: string;
  /** Which zone this quest belongs to (zone1..zone5). */
  zoneId: string;
  ageBand: AgeBand;
  title: string;
  scenes: QuestScene[];
  /** 3-5 questions; used for BOTH the silent pre-quiz and the scored post-quiz. */
  quizQuestions: QuizQuestion[];
}

/**
 * Runtime sanity check for quest content files. Throws with a descriptive
 * message so content mistakes surface immediately in development.
 */
export function validateQuest(q: Quest): Quest {
  if (!q.questId || !q.zoneId || !q.title) {
    throw new Error(`Quest ${q.questId ?? '?'}: missing questId/zoneId/title`);
  }
  if (!q.scenes.length) throw new Error(`Quest ${q.questId}: no scenes`);
  if (q.quizQuestions.length < 3 || q.quizQuestions.length > 5) {
    throw new Error(`Quest ${q.questId}: quiz must have 3-5 questions`);
  }
  const sceneIds = new Set(q.scenes.map((s) => s.sceneId));
  if (sceneIds.size !== q.scenes.length) {
    throw new Error(`Quest ${q.questId}: duplicate sceneIds`);
  }
  for (const scene of q.scenes) {
    if (!scene.choices.length) {
      throw new Error(`Quest ${q.questId}/${scene.sceneId}: no choices`);
    }
    for (const c of scene.choices) {
      if (c.nextScene && !sceneIds.has(c.nextScene)) {
        throw new Error(
          `Quest ${q.questId}/${scene.sceneId}: nextScene "${c.nextScene}" does not exist`,
        );
      }
    }
  }
  for (const [i, qq] of q.quizQuestions.entries()) {
    if (qq.correctIndex < 0 || qq.correctIndex >= qq.options.length) {
      throw new Error(`Quest ${q.questId}: quiz #${i} correctIndex out of range`);
    }
  }
  return q;
}
