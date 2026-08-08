/**
 * Quest Engine + content smoke test (run: pnpm dlx tsx scripts/engine.smoke.ts)
 * Content-agnostic: walks EVERY zone that has registered content, across all
 * three age bands, through the full state machine and asserts scores, badges,
 * and sequential unlocks, plus the standing content rules from Task 4 onward
 * (Childline 1098 present, no emojis).
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
  buildRecapQueue,
  getActiveRecap,
  answerRecapQuestion,
  acknowledgeRecapFeedback,
  RECAP_TRIGGER_RATIO,
  type QuestSession,
} from '../src/quests/engine';
import { RECAPS } from '../src/quests/recaps';
import { progressStore, type AgeBand } from '../src/data/progressStore';
import { isZoneUnlocked } from '../src/world/zones';
import type { Quest } from '../src/quests/schema';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok - ${msg}`);
}

const BANDS: AgeBand[] = ['8-11', '12-15', '16-18'];
const ALL_ZONES = ['zone1', 'zone2', 'zone3', 'zone4', 'zone5'];

// Zones with content so far (Task 4: zone1, Task 5: zone2, Task 6: zone3).
const CONTENT_ZONES = ALL_ZONES.filter((z) => resolveQuest(z, '12-15') !== null);
assert(
  JSON.stringify(CONTENT_ZONES) === JSON.stringify(['zone1', 'zone2', 'zone3', 'zone4', 'zone5']),
  `zones with content: ${CONTENT_ZONES.join(', ')}`,
);

const seenQuestIds = new Set<string>();

for (const zoneId of CONTENT_ZONES) {
  assert(isZoneUnlocked(zoneId), `${zoneId} is unlocked before playing it`);

  for (const band of BANDS) {
    const quest = resolveQuest(zoneId, band);
    assert(!!quest && quest.ageBand === band, `${zoneId}/${band} resolves to exact-band quest`);
    seenQuestIds.add(quest!.questId);

    // Standing content rules: 1098 mentioned, no emoji.
    const text = JSON.stringify(quest);
    assert(text.includes('1098'), `${quest!.questId} mentions Childline 1098`);
    assert(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text), `${quest!.questId} has no emojis`);

    // Task 9: every quiz question has aligned, valid recap content (also emoji-free).
    const recaps = RECAPS[quest!.questId];
    assert(
      !!recaps && recaps.length === quest!.quizQuestions.length,
      `${quest!.questId} recap coverage ${recaps?.length ?? 0}/${quest!.quizQuestions.length}`,
    );
    for (const [ri, item] of recaps!.entries()) {
      assert(
        item.summary.length > 0 &&
          item.question.length > 0 &&
          item.options.length >= 2 &&
          item.correctIndex >= 0 &&
          item.correctIndex < item.options.length &&
          item.explanation.length > 0,
        `${quest!.questId} recap #${ri} well-formed`,
      );
    }
    const recapText = JSON.stringify(recaps);
    assert(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(recapText), `${quest!.questId} recaps have no emojis`);

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

    // Task 9: a very low pre-quiz baseline (pre-quiz above always picked
    // option 0) routes through the recap phase before complete; otherwise
    // the quest completes directly. Walk whichever path applies.
    if (s.phase === 'recap') {
      assert(s.recapQueue.length > 0, `${quest!.questId} recap queue non-empty in recap phase`);
      let recapSteps = 0;
      while (s.phase === 'recap' && recapSteps++ < 10) {
        const item = getActiveRecap(s);
        assert(!!item, `${quest!.questId} active recap item exists`);
        s = answerRecapQuestion(s, item!.correctIndex);
        assert(s.recapFeedback?.correct === true, `${quest!.questId} recap feedback correct`);
        s = acknowledgeRecapFeedback(s);
      }
    }
    assert(s.phase === 'complete', `${quest!.questId} post-quiz (+recap if low pre) -> complete`);

    const result = finalizeQuest(s);
    assert(
      result.postScore === result.total && result.total === quest!.quizQuestions.length,
      `${quest!.questId} post score ${result.postScore}/${result.total}`,
    );
    const state = progressStore.getState();
    assert(state.quizScores[quest!.questId]?.post === result.total, `${quest!.questId} score stored`);
  }

  assert(progressStore.getState().completedZones[zoneId] === true, `${zoneId} complete`);
  assert(progressStore.getState().badges[`${zoneId}_star`] === true, `${zoneId} badge awarded`);
}

assert(
  seenQuestIds.size === CONTENT_ZONES.length * BANDS.length,
  `one distinct quest per zone+band (${seenQuestIds.size})`,
);

// Sequential unlocks: the zone after the last completed one is open, the next is not.
const nextZone = ALL_ZONES[CONTENT_ZONES.length];
const zoneAfter = ALL_ZONES[CONTENT_ZONES.length + 1];
if (nextZone) {
  assert(isZoneUnlocked(nextZone), `${nextZone} unlocked after completing ${CONTENT_ZONES.join('+')}`);
  assert(resolveQuest(nextZone, '12-15') === null, `${nextZone} has no content yet`);
}
if (zoneAfter) {
  assert(!isZoneUnlocked(zoneAfter), `${zoneAfter} still locked`);
}

// ---------------------------------------------------------------------------
// Task 9: adaptive recap trigger tests (pure engine walks, no finalize).
// ---------------------------------------------------------------------------

function walkToPostQuiz(quest: Quest, preAnswerFor: (qi: number) => number): QuestSession {
  let s = startQuest(quest);
  for (let i = 0; i < quest.quizQuestions.length; i++) {
    s = answerQuizQuestion(s, preAnswerFor(i));
  }
  let steps = 0;
  while (s.phase === 'scenes' && steps++ < 25) {
    const scene = getCurrentScene(s)!;
    const idx = scene.choices.findIndex((c) => c.outcome === 'correct');
    s = chooseSceneOption(s, idx);
    s = acknowledgeSceneFeedback(s);
  }
  for (const q of quest.quizQuestions) {
    s = answerQuizQuestion(s, q.correctIndex);
    s = acknowledgeQuizFeedback(s);
  }
  return s;
}

const recapQuest = resolveQuest('zone1', '12-15')!;
const wrongOption = (qi: number) =>
  recapQuest.quizQuestions[qi].correctIndex === 0 ? 1 : 0;

// 1. All pre-quiz answers wrong (score 0) -> recap covers every question.
let low = walkToPostQuiz(recapQuest, wrongOption);
assert(low.phase === 'recap', 'low pre-quiz score triggers recap phase');
assert(
  low.recapQueue.length === recapQuest.quizQuestions.length,
  `recap covers all ${low.recapQueue.length} pre-quiz misses`,
);
// A wrong recap answer still moves forward (reinforce, never trap) …
const firstItem = getActiveRecap(low)!;
low = answerRecapQuestion(low, firstItem.correctIndex === 0 ? 1 : 0);
assert(low.recapFeedback?.correct === false, 'recap shows gentle feedback on wrong answer');
low = acknowledgeRecapFeedback(low);
assert(
  (low.phase === 'recap' && low.recapIndex === 1) || low.phase === 'complete',
  'wrong recap answer still advances',
);
while (low.phase === 'recap') {
  const item = getActiveRecap(low)!;
  low = answerRecapQuestion(low, item.correctIndex);
  low = acknowledgeRecapFeedback(low);
}
assert(low.phase === 'complete', 'recap path ends in complete');

// 2. Perfect pre-quiz -> no recap, straight to complete.
const high = walkToPostQuiz(recapQuest, (qi) => recapQuest.quizQuestions[qi].correctIndex);
assert(high.phase === 'complete', 'high pre-quiz score skips recap');
assert(buildRecapQueue(high).length === 0, 'no recap queue for high pre score');

// 3. Boundary: exactly 50% pre score does NOT trigger (threshold is strict).
const boundaryQuest = resolveQuest('zone5', '12-15')!; // 4 questions
assert(boundaryQuest.quizQuestions.length % 2 === 0, 'boundary quest has even question count');
const boundary = walkToPostQuiz(boundaryQuest, (qi) =>
  qi < boundaryQuest.quizQuestions.length / 2
    ? boundaryQuest.quizQuestions[qi].correctIndex
    : boundaryQuest.quizQuestions[qi].correctIndex === 0
      ? 1
      : 0,
);
assert(boundary.phase === 'complete', `exactly ${RECAP_TRIGGER_RATIO * 100}% pre score skips recap`);

console.log('\nAll engine + content smoke tests passed.');
