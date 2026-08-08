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
  /**
   * Optional process-map label (Task 7, Zone 4 "Justice System Simulator").
   * When present, the player renders it as a stage chip above the narration,
   * e.g. "Step 2 of 5: The First 24 Hours" — used for flowchart-style
   * walkthrough quests. Purely presentational; static content per PRD §9.8.
   */
  stageLabel?: string;
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
  /**
   * Content language (Task 10). Omitted in the original English files
   * (defaults to 'en'); Hindi translations set 'hi'. Same questId across
   * languages — progress is language-independent.
   */
  language?: 'en' | 'hi';
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

/**
 * Task 10: verify a translated quest is STRUCTURALLY identical to its
 * English source — same ids, same branching, same choice outcomes, same
 * correct answers. Only display strings may differ. This guarantees a
 * translation can never change the legal meaning of which answer is
 * correct or where a choice leads.
 */
export function validateTranslationParity(source: Quest, translated: Quest): Quest {
  const ctx = `Translation ${translated.questId} (${translated.language ?? '?'})`;
  if (translated.questId !== source.questId) {
    throw new Error(`${ctx}: questId differs from source`);
  }
  if (translated.zoneId !== source.zoneId || translated.ageBand !== source.ageBand) {
    throw new Error(`${ctx}: zoneId/ageBand differs from source`);
  }
  if (translated.scenes.length !== source.scenes.length) {
    throw new Error(`${ctx}: scene count differs`);
  }
  source.scenes.forEach((srcScene, sIdx) => {
    const trScene = translated.scenes[sIdx];
    if (trScene.sceneId !== srcScene.sceneId) {
      throw new Error(`${ctx}: scene #${sIdx} id differs (${trScene.sceneId})`);
    }
    if (trScene.choices.length !== srcScene.choices.length) {
      throw new Error(`${ctx}/${srcScene.sceneId}: choice count differs`);
    }
    srcScene.choices.forEach((srcChoice, cIdx) => {
      const trChoice = trScene.choices[cIdx];
      if (trChoice.outcome !== srcChoice.outcome) {
        throw new Error(`${ctx}/${srcScene.sceneId}: choice #${cIdx} outcome differs`);
      }
      if ((trChoice.nextScene ?? null) !== (srcChoice.nextScene ?? null)) {
        throw new Error(`${ctx}/${srcScene.sceneId}: choice #${cIdx} nextScene differs`);
      }
    });
  });
  if (translated.quizQuestions.length !== source.quizQuestions.length) {
    throw new Error(`${ctx}: quiz question count differs`);
  }
  source.quizQuestions.forEach((srcQ, qIdx) => {
    const trQ = translated.quizQuestions[qIdx];
    if (trQ.options.length !== srcQ.options.length) {
      throw new Error(`${ctx}: quiz #${qIdx} option count differs`);
    }
    if (trQ.correctIndex !== srcQ.correctIndex) {
      throw new Error(`${ctx}: quiz #${qIdx} correctIndex differs`);
    }
  });
  return translated;
}
