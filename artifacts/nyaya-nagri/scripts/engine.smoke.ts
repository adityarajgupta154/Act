/**
 * Quest Engine smoke test (run with: pnpm dlx tsx scripts/engine.smoke.ts)
 * Walks a full session through the state machine and asserts the
 * progress-store side effects (scores, zone unlock, badge).
 */
import { resolveQuest } from '../src/quests/registry';
import {
  startQuest,
  answerQuizQuestion,
  acknowledgeQuizFeedback,
  chooseSceneOption,
  acknowledgeSceneFeedback,
  getCurrentScene,
  finalizeQuest,
} from '../src/quests/engine';
import { progressStore } from '../src/data/progressStore';
import { isZoneUnlocked } from '../src/world/zones';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok - ${msg}`);
}

const quest = resolveQuest('zone1', '8-11'); // no 8-11 file → fallback
assert(!!quest, 'resolveQuest falls back to any zone1 quest');
assert(resolveQuest('zone3', '12-15') === null, 'zone without content returns null');

let s = startQuest(quest!);
assert(s.phase === 'pre-quiz', 'starts in pre-quiz');

// Pre-quiz: answer all wrong (indices chosen wrong on purpose), silently.
s = answerQuizQuestion(s, 0); // q1 correct=1 → wrong
assert(s.lastQuizFeedback === null, 'pre-quiz never reveals correctness');
s = answerQuizQuestion(s, 0); // q2 correct=2 → wrong
s = answerQuizQuestion(s, 0); // q3 correct=1 → wrong
assert(s.phase === 'scenes' && s.currentSceneId === 'scene1', 'pre-quiz done -> scene1');

// Scene 1: pick incorrect choice, check feedback, advance.
s = chooseSceneOption(s, 1);
assert(s.pendingFeedback?.outcome === 'incorrect', 'scene1 feedback outcome recorded');
s = acknowledgeSceneFeedback(s);
assert(s.currentSceneId === 'scene2', 'branch followed to scene2');

// Scene 2: correct choice with empty nextScene -> post-quiz.
s = chooseSceneOption(s, 0);
assert(s.pendingFeedback?.outcome === 'correct', 'scene2 feedback outcome recorded');
s = acknowledgeSceneFeedback(s);
assert(s.phase === 'post-quiz' && s.quizIndex === 0, 'scenes done -> post-quiz');
assert(getCurrentScene(s) === null, 'no active scene in post-quiz');

// Post-quiz: all correct, with feedback each time.
for (const correct of [1, 2, 1]) {
  s = answerQuizQuestion(s, correct);
  assert(s.lastQuizFeedback?.correct === true, `post-quiz q${s.quizIndex + 1} feedback shown`);
  s = acknowledgeQuizFeedback(s);
}
assert(s.phase === 'complete', 'post-quiz done -> complete');

// Finalize: scores + unlock + badge.
assert(isZoneUnlocked('zone2') === false, 'zone2 locked before completion');
const result = finalizeQuest(s);
assert(result.preScore === 0 && result.postScore === 3 && result.total === 3, 'pre=0 post=3');

const state = progressStore.getState();
assert(state.quizScores['zone1_sample_placeholder']?.pre === 0, 'pre score stored');
assert(state.quizScores['zone1_sample_placeholder']?.post === 3, 'post score stored');
assert(state.completedZones['zone1'] === true, 'zone1 marked complete');
assert(state.badges['zone1_star'] === true, 'badge awarded');
assert(isZoneUnlocked('zone2') === true, 'zone2 unlocked after completion');
assert(isZoneUnlocked('zone3') === false, 'zone3 still locked');

console.log('\nAll engine smoke tests passed.');
