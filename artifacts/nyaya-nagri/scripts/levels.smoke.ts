/**
 * Task 15 smoke — Levels inside zones (run: pnpm dlx tsx scripts/levels.smoke.ts)
 *
 * Proves, for EVERY zone and age band:
 *  - levels are a safe regrouping of the Tasks 4-8 content (validated
 *    partition; playing levels in order shows the exact same scenes in the
 *    exact same order as the classic full-quest flow);
 *  - sequential lock/unlock inside a zone; the zone completes (and the next
 *    zone unlocks, Task 1 rules untouched) ONLY when the final quiz level
 *    is passed;
 *  - the silent pre-quiz baseline still happens FIRST (level 1) and the
 *    adaptive recap still works across sessions (Task 9);
 *  - Practice/Replay never overwrites recorded scores (replays counted
 *    separately);
 *  - pre-Task-15 saves (zone complete, no level entries) show all levels
 *    complete;
 *  - malformed persisted level maps are dropped at load (ingress rule);
 *  - new EN/HI strings + level greetings exist, are emoji-free, and use
 *    Western numerals only.
 */

// ---- localStorage shim MUST exist before any app module loads (all app ----
// ---- imports below are dynamic, inside main(), for exactly this reason) ----
const backing = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => backing.get(k) ?? null,
  setItem: (k: string, v: string) => void backing.set(k, String(v)),
  removeItem: (k: string) => void backing.delete(k),
  clear: () => backing.clear(),
};

// Seed a consented save containing JUNK level maps — the store must drop
// every malformed entry on load, keeping only well-formed ones.
backing.set(
  'nn-progress-v1',
  JSON.stringify({
    onboarded: true,
    ageBand: '12-15',
    levelProgress: { 'zone1:level1': 'yes', 'zone9:levelX': true },
    replayCounts: { bad: -2, alsoBad: 'many', ok: 3 },
    preAnswersByQuest: { junk: [1, 'x'], ok: [0, 2, 1] },
    // Task 18: junk activity scores — only well-formed pairs may survive.
    activityScores: {
      overTotal: { score: 5, total: 2 },
      negative: { score: -1, total: 3 },
      hugeTotal: { score: 1, total: 99 },
      fraction: { score: 1.5, total: 3 },
      ok: { score: 2, total: 3 },
    },
  }),
);

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok - ${msg}`);
}

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const DEVANAGARI_DIGITS = /[\u0966-\u096F]/;

async function main() {
  const { progressStore } = await import('../src/data/progressStore');
  const { resolveQuest, getAllQuests } = await import('../src/quests/registry');
  const {
    startLevel, startQuest, answerQuizQuestion, acknowledgeQuizFeedback,
    chooseSceneOption, acknowledgeSceneFeedback, getCurrentScene, finalizeLevel,
    getActiveRecap, answerRecapQuestion, acknowledgeRecapFeedback,
    levelKey, completeActivity, activityTotal,
  } = await import('../src/quests/engine');
  type QuestSession = import('../src/quests/engine').QuestSession;
  const { getLevelStatuses, isLevelUnlocked, getPriorPreAnswers, getReplayCount } =
    await import('../src/quests/levels');
  const { isZoneUnlocked } = await import('../src/world/zones');
  const { getStrings } = await import('../src/i18n/strings');
  const { getLevelGreeting } = await import('../src/i18n/greetings');
  const { validateLevels, validateTranslationParity } = await import('../src/quests/schema');
  type Quest = import('../src/quests/schema').Quest;

  // ---------- 0. Load-time sanitization of the seeded junk save ----------
  {
    const s = progressStore.getState();
    assert(
      JSON.stringify(s.levelProgress) === JSON.stringify({ 'zone9:levelX': true }),
      'load drops non-boolean levelProgress entries',
    );
    assert(
      JSON.stringify(s.replayCounts) === JSON.stringify({ ok: 3 }),
      'load drops negative/non-numeric replayCounts entries',
    );
    assert(
      JSON.stringify(s.preAnswersByQuest) === JSON.stringify({ ok: [0, 2, 1] }),
      'load drops non-integer-array preAnswersByQuest entries',
    );
    assert(
      JSON.stringify(s.activityScores) === JSON.stringify({ ok: { score: 2, total: 3 } }),
      'load drops malformed activityScores entries (over-total/negative/huge/fractional)',
    );
  }

  const resetProgress = () =>
    progressStore.update({
      completedZones: {}, badges: {}, quizScores: {},
      levelProgress: {}, replayCounts: {}, preAnswersByQuest: {},
      activityScores: {},
    });
  resetProgress();

  // ---------- 1. Every quest (EN + HI) has a valid level structure ----------
  // Task 18: four quests carry ONE extra activity level between the decision
  // and the quiz; Task 20 adds the zone6 "Meet the Authorities" hub to all
  // three family_shield quests. Every other quest keeps the 3-level shape.
  const ACTIVITY_BY_QUEST: Record<string, { levelId: string; kind: string }> = {
    school_rights_12_15: { levelId: 'level_memory', kind: 'memory' },
    right_childhood_8_11: { levelId: 'level_hidden', kind: 'hidden' },
    digital_safety_12_15: { levelId: 'level_sorting', kind: 'sorting' },
    safe_zone_16_18: { levelId: 'level_scenario', kind: 'scenario' },
    family_shield_8_11: { levelId: 'level_authorities', kind: 'authorities' },
    family_shield_12_15: { levelId: 'level_authorities', kind: 'authorities' },
    family_shield_16_18: { levelId: 'level_authorities', kind: 'authorities' },
  };
  const BANDS = ['8-11', '12-15', '16-18'] as const;
  const ZONES_SEQ = ['zone0', 'zone1', 'zone2', 'zone3', 'zone4', 'zone5', 'zone6'];
  let checked = 0;
  for (const zoneId of ZONES_SEQ) {
    for (const band of BANDS) {
      for (const lang of ['en', 'hi'] as const) {
        const q = resolveQuest(zoneId, band, lang)!;
        assert(!!q, `${zoneId}/${band}/${lang} resolves`);
        validateLevels(q); // throws on any structural violation
        const extra = ACTIVITY_BY_QUEST[q.questId];
        const wantKinds = extra
          ? ['story', 'decision', extra.kind, 'quiz']
          : ['story', 'decision', 'quiz'];
        assert(
          JSON.stringify(q.levels.map((l) => l.kind)) === JSON.stringify(wantKinds),
          `${q.questId}/${lang} level kinds are ${wantKinds.join('/')}`,
        );
        if (extra) {
          assert(q.levels[2].levelId === extra.levelId,
            `${q.questId}/${lang} activity level id is ${extra.levelId}`);
        }
        checked++;
      }
    }
  }
  assert(checked === 42, 'all 42 quest files (21 EN + 21 HI) level-checked');

  // HI level STRUCTURE identical to EN (text differs; full structural parity
  // — pair counts, cue geometry, bucket/outcome sequences — is enforced by
  // validateTranslationParity at registry load and re-checked in section 5c).
  for (const q of getAllQuests()) {
    const hi = resolveQuest(q.zoneId, q.ageBand, 'hi')!;
    const shape = (x: Quest) =>
      JSON.stringify(x.levels.map((l) => [l.levelId, l.kind, l.sceneIds ?? null, l.entryScene ?? null]));
    assert(shape(hi) === shape(q), `${q.questId} HI level structure identical to EN`);
  }

  // ---------- helpers to drive sessions ----------
  const playScenes = (session: QuestSession, seen: string[]): QuestSession => {
    let s = session;
    while (s.phase === 'scenes') {
      const scene = getCurrentScene(s)!;
      seen.push(scene.sceneId);
      s = chooseSceneOption(s, 0);
      s = acknowledgeSceneFeedback(s);
    }
    return s;
  };
  const answerAll = (session: QuestSession, pick: (i: number) => number): QuestSession => {
    let s = session;
    const n = s.quest.quizQuestions.length;
    for (let i = 0; i < n; i++) {
      s = answerQuizQuestion(s, pick(i));
      if (s.phase === 'post-quiz' && s.lastQuizFeedback) s = acknowledgeQuizFeedback(s);
    }
    return s;
  };
  const wrongIndex = (q: Quest, i: number) =>
    q.quizQuestions[i].correctIndex === 0 ? 1 : 0;

  // ---------- 2. Full level flow, EVERY zone, chained unlocks ----------
  // Band/language varied per zone to cover all combinations across the run.
  for (const [zi, zoneId] of ZONES_SEQ.entries()) {
    const band = BANDS[zi % 3];
    const lang = zi % 2 === 0 ? 'en' : 'hi';
    const quest = resolveQuest(zoneId, band, lang)!;
    const next = ZONES_SEQ[zi + 1];

    assert(isZoneUnlocked(zoneId), `${zoneId} unlocked when its turn comes`);
    if (next) assert(!isZoneUnlocked(next), `${next} locked before ${zoneId} done`);

    const nLevels = quest.levels.length; // 3, or 4 where an activity level is wired
    assert(
      JSON.stringify(getLevelStatuses(quest)) ===
        JSON.stringify(['unlocked', ...Array(nLevels - 1).fill('locked')]),
      `${zoneId}: initial statuses = first unlocked, all later levels locked`,
    );
    for (let li = 1; li < nLevels; li++) {
      assert(!isLevelUnlocked(quest, li), `${zoneId}: L${li + 1} locked initially`);
    }

    // --- Level 1 (story): silent pre-quiz FIRST, then only L1 scenes ---
    let s = startLevel(quest, 0);
    assert(s.phase === 'pre-quiz', `${zoneId}/L1 starts with the silent pre-quiz`);
    s = answerAll(s, (i) => wrongIndex(quest, i)); // all wrong -> baseline 0
    assert(s.phase === 'scenes' && s.currentSceneId === quest.levels[0].entryScene,
      `${zoneId}/L1 scenes start at the level entry`);
    const seen1: string[] = [];
    s = playScenes(s, seen1);
    assert(s.phase === 'complete', `${zoneId}/L1 completes at the level border`);
    assert(
      JSON.stringify(seen1) === JSON.stringify(quest.levels[0].sceneIds),
      `${zoneId}/L1 shows exactly its own scenes, in order`,
    );
    let r = finalizeLevel(s);
    assert(r.recorded && !r.zoneCompleted, `${zoneId}/L1 recorded, zone NOT complete`);
    const st1 = progressStore.getState();
    assert(st1.levelProgress[levelKey(zoneId, 'level1')] === true, `${zoneId}/L1 progress stored`);
    assert(st1.quizScores[quest.questId]?.pre === 0 && st1.quizScores[quest.questId]?.post === null,
      `${zoneId}: pre baseline recorded (0), post still null`);
    assert(getPriorPreAnswers(quest.questId).length === quest.quizQuestions.length,
      `${zoneId}: pre-quiz answers stored for the recap`);
    assert(!st1.completedZones[zoneId], `${zoneId} not complete after L1`);

    // --- Level 2 (decision): remaining scenes only ---
    assert(
      JSON.stringify(getLevelStatuses(quest)) ===
        JSON.stringify(['completed', 'unlocked', ...Array(nLevels - 2).fill('locked')]),
      `${zoneId}: L2 unlocked after L1, later levels still locked`,
    );
    s = startLevel(quest, 1);
    assert(s.phase === 'scenes' && s.currentSceneId === quest.levels[1].entryScene,
      `${zoneId}/L2 starts at its entry scene (no quiz)`);
    const seen2: string[] = [];
    s = playScenes(s, seen2);
    assert(s.phase === 'complete', `${zoneId}/L2 completes after its scenes`);
    assert(
      JSON.stringify(seen2) === JSON.stringify(quest.levels[1].sceneIds),
      `${zoneId}/L2 shows exactly its own scenes, in order`,
    );
    // Levels together = the classic full-quest scene order, nothing lost.
    assert(
      JSON.stringify([...seen1, ...seen2]) === JSON.stringify(quest.scenes.map((x) => x.sceneId)),
      `${zoneId}: L1+L2 replay the original scene order exactly`,
    );
    r = finalizeLevel(s);
    assert(r.recorded && !r.zoneCompleted && !progressStore.getState().completedZones[zoneId],
      `${zoneId} still not complete after L2`);
    if (next) assert(!isZoneUnlocked(next), `${next} STILL locked before the quiz level`);

    // --- Task 18: any activity level between the decision and the quiz ---
    for (let li = 2; li < nLevels - 1; li++) {
      const lvl = quest.levels[li];
      s = startLevel(quest, li);
      assert(s.phase === 'activity', `${zoneId}/L${li + 1} (${lvl.kind}) starts in the activity phase`);
      s = completeActivity(s, activityTotal(lvl));
      assert(s.phase === 'complete', `${zoneId}/L${li + 1} completes via completeActivity`);
      r = finalizeLevel(s);
      assert(r.recorded && !r.zoneCompleted, `${zoneId}/L${li + 1} recorded, zone STILL not complete`);
      const rec = progressStore.getState().activityScores[levelKey(zoneId, lvl.levelId)];
      assert(rec?.score === activityTotal(lvl) && rec?.total === activityTotal(lvl),
        `${zoneId}/L${li + 1} activity score recorded`);
      if (next) assert(!isZoneUnlocked(next), `${next} still locked before the quiz level`);
    }

    // --- Final level (quiz): post-quiz + adaptive recap, completes the zone ---
    s = startLevel(quest, nLevels - 1, { priorPreAnswers: getPriorPreAnswers(quest.questId) });
    assert(s.phase === 'post-quiz', `${zoneId}/L3 is the quiz checkpoint`);
    s = answerAll(s, (i) => quest.quizQuestions[i].correctIndex); // all correct
    // Baseline was 0 (< half) -> the recap must trigger, exactly as before.
    assert(s.phase === 'recap' && s.recapQueue.length > 0,
      `${zoneId}/L3 adaptive recap triggers from the L1 baseline`);
    while (s.phase === 'recap') {
      const item = getActiveRecap(s)!;
      s = answerRecapQuestion(s, item.correctIndex);
      s = acknowledgeRecapFeedback(s);
    }
    assert(s.phase === 'complete', `${zoneId}/L3 completes after the recap`);
    r = finalizeLevel(s);
    assert(r.recorded && r.zoneCompleted && r.badgeId === `${zoneId}_star`,
      `${zoneId}/L3 completes the ZONE and awards the badge`);
    const st3 = progressStore.getState();
    assert(st3.quizScores[quest.questId]?.pre === 0 &&
      st3.quizScores[quest.questId]?.post === quest.quizQuestions.length,
      `${zoneId}: recorded scores pre=0, post=full`);
    assert(st3.completedZones[zoneId] === true, `${zoneId} complete after final level`);
    if (next) assert(isZoneUnlocked(next), `${next} unlocks ONLY now (Task 1 rules intact)`);
    assert(
      JSON.stringify(getLevelStatuses(quest)) === JSON.stringify(Array(nLevels).fill('completed')),
      `${zoneId}: all levels completed`,
    );
  }

  // ---------- 3. Practice/Replay never touches recorded analytics ----------
  {
    const quest = resolveQuest('zone1', '8-11', 'en')!;
    const before = JSON.stringify(progressStore.getState().quizScores);
    const beforePre = JSON.stringify(progressStore.getState().preAnswersByQuest);

    // Practice a story level: pre-quiz must be SKIPPED (baseline stays).
    let s = startLevel(quest, 0, { practice: true });
    assert(s.phase === 'scenes', 'practice of L1 skips the pre-quiz (baseline preserved)');
    s = playScenes(s, []);
    let r = finalizeLevel(s);
    assert(!r.recorded, 'practice result is marked not-recorded');
    assert(getReplayCount(quest, 0) === 1, 'replay attempt counted separately (1)');

    // Practice the quiz level with all-wrong answers: score shown, not stored.
    s = startLevel(quest, 2, { practice: true, priorPreAnswers: getPriorPreAnswers(quest.questId) });
    s = answerAll(s, (i) => wrongIndex(quest, i));
    while (s.phase === 'recap') {
      const item = getActiveRecap(s)!;
      s = answerRecapQuestion(s, item.correctIndex);
      s = acknowledgeRecapFeedback(s);
    }
    assert(s.phase === 'complete', 'practice quiz completes');
    r = finalizeLevel(s);
    assert(!r.recorded && r.postScore === 0 && !r.zoneCompleted,
      'practice quiz: score shown in result, zone/badge untouched');

    // Defensive: finalizing an already-completed level WITHOUT the practice
    // flag must also refuse to overwrite (UI always sets it, engine guards anyway).
    s = startLevel(quest, 1);
    s = playScenes(s, []);
    r = finalizeLevel(s);
    assert(!r.recorded, 're-finalizing a completed level is treated as practice');

    assert(JSON.stringify(progressStore.getState().quizScores) === before,
      'recorded quiz scores UNCHANGED by all replays');
    assert(JSON.stringify(progressStore.getState().preAnswersByQuest) === beforePre,
      'stored pre-quiz baseline UNCHANGED by all replays');
    assert(getReplayCount(quest, 2) === 1 && getReplayCount(quest, 1) === 1,
      'each replay tracked under its own level key');
  }

  // ---------- 3b. Task 18: activity engine flow, clamping, single write path ----------
  {
    resetProgress();
    const quest = resolveQuest('zone3', '12-15', 'en')!;
    const lvl = quest.levels[2];
    assert(lvl.kind === 'memory' && lvl.levelId === 'level_memory',
      'zone3/12-15 carries the memory level at index 2');
    const total = activityTotal(lvl);
    assert(total === lvl.memory!.pairs.length && total >= 4 && total <= 6,
      'activityTotal derives the memory total from content');

    // Practice first: full flow, ZERO writes.
    let s = startLevel(quest, 2, { practice: true });
    assert(s.phase === 'activity', 'activity level starts in the activity phase (practice too)');
    let r = finalizeLevel(completeActivity(s, 2));
    assert(!r.recorded && r.activityScore?.score === 2 && r.activityScore?.total === total,
      'practice activity returns its score but is NOT recorded');
    assert(Object.keys(progressStore.getState().activityScores).length === 0 &&
      Object.keys(progressStore.getState().levelProgress).length === 0,
      'practice activity writes NOTHING (scores, progress)');

    // Clamping: UI can never inflate or corrupt the score.
    s = startLevel(quest, 2);
    assert(completeActivity(s, 999).activityResult!.score === total, 'score clamps down to total');
    assert(completeActivity(s, -5).activityResult!.score === 0, 'negative score clamps to 0');
    assert(completeActivity(s, 2.9).activityResult!.score === 2, 'fractional score floors to an int');
    const done = completeActivity(s, total);
    assert(completeActivity(done, 1) === done, 'completeActivity is a no-op outside the activity phase');

    // First recorded completion writes score + progress via finalizeLevel only.
    r = finalizeLevel(completeActivity(s, total - 1));
    assert(r.recorded && r.activityScore?.score === total - 1 && r.xpAwarded > 0,
      'recorded activity completion pays XP and reports the score');
    const key = levelKey('zone3', 'level_memory');
    const st = progressStore.getState();
    assert(st.activityScores[key]?.score === total - 1 && st.activityScores[key]?.total === total,
      'activityScores written under the level key');
    assert(st.levelProgress[key] === true, 'activity level progress stored');

    // Replays (practice or not) never overwrite the recorded score.
    r = finalizeLevel(completeActivity(startLevel(quest, 2, { practice: true }), total));
    assert(!r.recorded, 'activity replay not recorded');
    r = finalizeLevel(completeActivity(startLevel(quest, 2), total));
    assert(!r.recorded, 'non-practice replay of a completed activity treated as practice');
    assert(progressStore.getState().activityScores[key]?.score === total - 1,
      'recorded activity score UNCHANGED by replays');
    resetProgress();
  }

  // ---------- 3c. Task 18: content validation rejects unsafe/malformed shapes ----------
  {
    const clone = (q: Quest): Quest => JSON.parse(JSON.stringify(q));
    const memQ = resolveQuest('zone3', '12-15', 'en')!;
    const hidQ = resolveQuest('zone2', '8-11', 'en')!;
    const sortQ = resolveQuest('zone5', '12-15', 'en')!;
    const scenQ = resolveQuest('zone1', '16-18', 'en')!;
    const rejects = (q: Quest, msg: string) => {
      let threw = false;
      try { validateLevels(q); } catch { threw = true; }
      assert(threw, msg);
    };

    let t = clone(hidQ);
    (t as { ageBand: string }).ageBand = '12-15';
    rejects(t, 'hidden-object level rejected outside the 8-11 band');

    t = clone(hidQ);
    (t.levels[2].hidden as { sceneKey: string }).sceneKey = 'ghost_scene';
    rejects(t, 'unknown hidden sceneKey rejected');

    t = clone(memQ);
    t.levels[2].memory!.pairs[1].term = t.levels[2].memory!.pairs[0].term;
    rejects(t, 'duplicate memory terms rejected');

    t = clone(sortQ);
    for (const c of t.levels[2].sorting!.cards) if (c.bucket === 'emergency') c.bucket = 'tell';
    rejects(t, 'sorting content that skips a bucket rejected');

    t = clone(scenQ);
    t.levels[2].scenario!.options[1].outcome = 'correct';
    rejects(t, 'scenario with two correct options rejected');

    t = clone(memQ);
    t.levels[2].sceneIds = ['scene1'];
    t.levels[2].entryScene = 'scene1';
    rejects(t, 'activity level carrying sceneIds rejected');

    // Parity: HI must mirror EN structure exactly (bucket order included).
    const sortHi = resolveQuest('zone5', '12-15', 'hi')!;
    validateTranslationParity(sortQ, sortHi); // the real twins must pass
    assert(true, 'translation parity accepts the real HI sorting twin');
    const th = clone(sortHi);
    th.levels[2].sorting!.cards[0].bucket = 'tell';
    let threwP = false;
    try { validateTranslationParity(sortQ, th); } catch { threwP = true; }
    assert(threwP, 'translation parity rejects a bucket-sequence mismatch');
  }

  // ---------- 4. Pre-Task-15 saves: completed zone => all levels complete ----------
  {
    resetProgress();
    progressStore.update({ completedZones: { zone1: true } });
    const quest = resolveQuest('zone1', '12-15', 'en')!;
    assert(
      JSON.stringify(getLevelStatuses(quest)) === JSON.stringify(['completed', 'completed', 'completed']),
      'old save (zone complete, no level entries) counts all levels complete',
    );
    resetProgress();
  }

  // ---------- 4b. Task 19 migration: pre-Zone-0 saves keep completed zones open ----------
  // A child who finished Zone 1 before Zone 0 existed must never find their
  // completed zone locked for replay; only genuinely new zones follow the
  // Zone 0-first sequence.
  {
    resetProgress();
    progressStore.update({ completedZones: { zone1: true } });
    assert(isZoneUnlocked('zone0'), 'legacy save: zone0 (new first zone) is open');
    assert(isZoneUnlocked('zone1'), 'legacy save: completed zone1 stays replayable without zone0');
    assert(isZoneUnlocked('zone2'), 'legacy save: zone2 still unlocked by completed zone1');
    assert(!isZoneUnlocked('zone3'), 'legacy save: zone3 still locked (zone2 not done)');
    resetProgress();
  }

  // ---------- 5. Classic full-quest engine mode still intact ----------
  {
    const quest = resolveQuest('zone3', '12-15', 'en')!;
    let s = startQuest(quest);
    assert(s.levelIndex === null && !s.practice, 'full-quest session is unscoped');
    s = answerAll(s, (i) => quest.quizQuestions[i].correctIndex);
    const seen: string[] = [];
    s = playScenes(s, seen);
    assert(s.phase === 'post-quiz', 'full-quest mode still runs scenes -> post-quiz');
    assert(JSON.stringify(seen) === JSON.stringify(quest.scenes.map((x) => x.sceneId)),
      'full-quest mode still walks every scene');
  }

  // ---------- 5b. Review fixes: no bypass write path, strict partition ----------
  {
    // The old progressStore.markZoneComplete() helper let ANY caller mark a
    // zone complete without passing the final quiz level — it must be gone.
    assert(
      typeof (progressStore as unknown as Record<string, unknown>).markZoneComplete === 'undefined',
      'progressStore has NO public markZoneComplete bypass',
    );

    // validateLevels must reject a partition naming a nonexistent scene
    // (which would otherwise mask an omitted real scene of the same count).
    const quest = resolveQuest('zone1', '8-11', 'en')!;
    const tampered: Quest = JSON.parse(JSON.stringify(quest));
    tampered.levels[0].sceneIds = ['ghost_scene', ...tampered.levels[0].sceneIds!.slice(1)];
    tampered.levels[0].entryScene = 'ghost_scene';
    let threw = false;
    try {
      validateLevels(tampered);
    } catch {
      threw = true;
    }
    assert(threw, 'validateLevels rejects a level naming a nonexistent scene');
  }

  // ---------- 6. New strings + level greetings: parity, no emojis ----------
  {
    for (const lang of ['en', 'hi'] as const) {
      const t = getStrings(lang);
      const all = [
        t.chooseLevel, t.levelN(2), t.completePreviousLevel, t.startLevelLabel,
        t.practiceReplay, t.practiceNote, t.levelCompletedTag, t.levelComplete,
        t.practiceComplete, t.nextLevelUnlocked('X'), t.backToLevels,
        ...Object.values(t.levelKindNames),
        // Task 18 activity strings
        t.memoryPairsFound(2, 6), t.memoryMatchFound, t.memoryNotAMatch,
        t.hiddenFoundXofY(1, 3), t.hiddenKeepLooking, t.hiddenAllFound,
        ...Object.values(t.sortingBucketNames),
        t.sortingCardXofY(1, 6), t.sortingRightPlace,
        t.sortingBelongsIn(t.sortingBucketNames.tell), t.whereDoesThisGo,
        t.activityFinish,
      ];
      assert(all.every((x) => typeof x === 'string' && x.trim().length > 0),
        `${lang}: all level + activity strings present`);
      assert(all.every((x) => !EMOJI.test(x)), `${lang}: level + activity strings emoji-free`);
      assert(all.every((x) => !DEVANAGARI_DIGITS.test(x)),
        `${lang}: level + activity strings use Western numerals`);
      assert(Object.keys(t.levelKindNames).length === 8,
        `${lang}: all 8 level kinds have display names`);
      assert(t.sortingBucketNames.emergency.includes('1098'),
        `${lang}: emergency bucket carries the canonical Childline 1098 wording`);
      for (const kind of ['story', 'decision', 'quiz', 'memory', 'hidden', 'sorting', 'scenario'] as const) {
        const g = getLevelGreeting(2, kind, t.zones.zone1.name, lang);
        assert(g.length > 0 && !EMOJI.test(g), `${lang}/${kind} level greeting exists, emoji-free`);
        assert(g.includes('2'), `${lang}/${kind} greeting carries the level number`);
        assert(!DEVANAGARI_DIGITS.test(g), `${lang}/${kind} greeting uses Western numerals`);
      }
      assert(!DEVANAGARI_DIGITS.test(JSON.stringify([t.levelN(3)])), `${lang}: levelN uses Western numerals`);
    }
  }

  console.log('\nALL LEVEL SMOKE TESTS PASSED');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
