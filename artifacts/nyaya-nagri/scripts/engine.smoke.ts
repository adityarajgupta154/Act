/**
 * Quest Engine + content smoke test (run: pnpm dlx tsx scripts/engine.smoke.ts)
 * Content-agnostic: walks EVERY registered zone1 quest (all three age bands)
 * through the full state machine and asserts scores, unlock, and badge, plus
 * the Task 4 content rules (Childline 1098 present, no emojis).
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
import { progressStore, type AgeBand } from '../src/data/progressStore';
import { isZoneUnlocked } from '../src/world/zones';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok - ${msg}`);
}

const BANDS: AgeBand[] = ['8-11', '12-15', '16-18'];
const seenQuestIds = new Set<string>();

for (const band of BANDS) {
  const quest = resolveQuest('zone1', band);
  assert(!!quest && quest.ageBand === band, `zone1/${band} resolves to exact-band quest`);
  seenQuestIds.add(quest!.questId);

  // Content rules (Task 4): 1098 mentioned, no emoji, non-empty feedback.
  const text = JSON.stringify(quest);
  assert(text.includes('1098'), `${quest!.questId} mentions Childline 1098`);
  assert(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text), `${quest!.questId} has no emojis`);

  let s = startQuest(quest!);
  assert(s.phase === 'pre-quiz', `${quest!.questId} starts in pre-quiz`);

  // Pre-quiz: always pick option 0, silently.
  for (let i = 0; i < quest!.quizQuestions.length; i++) {
    s = answerQuizQuestion(s, 0);
    assert(s.lastQuizFeedback === null, `${quest!.questId} pre-quiz q${i + 1} stays silent`);
  }
  assert(s.phase === 'scenes', `${quest!.questId} pre-quiz done -> scenes`);

  // Scenes: always pick the correct choice, follow branches to the end.
  let steps = 0;
  while (s.phase === 'scenes' && steps++ < 25) {
    const scene = getCurrentScene(s);
    assert(!!scene, `${quest!.questId} active scene exists`);
    const idx = scene!.choices.findIndex((c) => c.outcome === 'correct');
    assert(idx >= 0, `${quest!.questId}/${scene!.sceneId} has a correct choice`);
    s = chooseSceneOption(s, idx);
    assert(s.pendingFeedback?.outcome === 'correct', `${quest!.questId}/${scene!.sceneId} feedback shown`);
    s = acknowledgeSceneFeedback(s);
  }
  assert(s.phase === 'post-quiz', `${quest!.questId} scenes terminate -> post-quiz (${steps} scenes)`);

  // Post-quiz: answer everything correctly.
  for (const q of quest!.quizQuestions) {
    s = answerQuizQuestion(s, q.correctIndex);
    assert(s.lastQuizFeedback?.correct === true, `${quest!.questId} post-quiz feedback correct`);
    s = acknowledgeQuizFeedback(s);
  }
  assert(s.phase === 'complete', `${quest!.questId} post-quiz done -> complete`);

  const result = finalizeQuest(s);
  assert(
    result.postScore === result.total && result.total === quest!.quizQuestions.length,
    `${quest!.questId} post score ${result.postScore}/${result.total}`,
  );
  const state = progressStore.getState();
  assert(state.quizScores[quest!.questId]?.post === result.total, `${quest!.questId} score stored`);
}

assert(seenQuestIds.size === 3, 'three distinct quests for zone1 (one per band)');
assert(resolveQuest('zone2', '12-15') === null, 'zone2 has no content yet');
assert(progressStore.getState().completedZones['zone1'] === true, 'zone1 complete');
assert(progressStore.getState().badges['zone1_star'] === true, 'badge awarded');
assert(isZoneUnlocked('zone2'), 'zone2 unlocked');
assert(!isZoneUnlocked('zone3'), 'zone3 still locked');

console.log('\nAll engine + content smoke tests passed.');
