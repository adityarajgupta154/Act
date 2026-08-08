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
} from '../src/quests/engine';
import { progressStore, type AgeBand } from '../src/data/progressStore';
import { isZoneUnlocked } from '../src/world/zones';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok - ${msg}`);
}

const BANDS: AgeBand[] = ['8-11', '12-15', '16-18'];
const ALL_ZONES = ['zone1', 'zone2', 'zone3', 'zone4', 'zone5'];

// Zones with content so far (Task 4: zone1, Task 5: zone2, Task 6: zone3).
const CONTENT_ZONES = ALL_ZONES.filter((z) => resolveQuest(z, '12-15') !== null);
assert(
  JSON.stringify(CONTENT_ZONES) === JSON.stringify(['zone1', 'zone2', 'zone3', 'zone4']),
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

console.log('\nAll engine + content smoke tests passed.');
