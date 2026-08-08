/**
 * Task 16 smoke — Game economy (run: pnpm dlx tsx scripts/economy.smoke.ts)
 *
 * Proves the PRD §7.3 economy layer with the §9.6/§9.7 safety rules:
 *  - XP/Coins awarded ONLY on first-time (recorded) level completions —
 *    never on Practice/Replay, never on already-complete replays;
 *  - Player Rank derived from XP (never stored); zone-complete bonus paid
 *    exactly once, with the quiz level;
 *  - gentle Daily Streak across simulated day changes: same-day idempotent,
 *    consecutive days +1, a gap QUIETLY restarts at 1 (no penalty state);
 *  - Avatar Shop: cosmetic-only purchases with in-game Coins; insufficient
 *    coins and double-buys rejected; total earnable Coins comfortably cover
 *    the full catalogue; ownership enforced at EVERY avatar ingress (load
 *    and setAvatar) so un-bought cosmetics can never be equipped;
 *  - Titles unlock at the right milestones (first level, each zone, all
 *    zones) and are additive to the Task 9 badges;
 *  - Leaderboard is cohort-only demo data, pseudonymous, opt-in DEFAULT OFF;
 *  - all new EN/HI strings exist, are emoji-free, use Western numerals.
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

// Seed a consented save containing JUNK economy fields, FORGED-but-valid
// economy fields (architect round: hand-edited xp/coins/owned with NO
// matching recorded progress), and an avatar wearing shop cosmetics — the
// store must sanitize every field, clamp the forged values back to what the
// (empty) progress can justify, and strip un-owned cosmetics on load.
backing.set(
  'nn-progress-v1',
  JSON.stringify({
    onboarded: true,
    ageBand: '12-15',
    avatar: {
      base: 'sunny', skinTone: '#F2C9A0', hair: 'short', outfit: 'kurta',
      nickname: 'SmokeKid',
      accessories: ['glasses', 'crown', 'cape'], // both shop items un-earned
    },
    xp: 5000, // forged: shape-valid, nothing completed
    coins: 'lots', // junk: wrong type
    ownedAccessories: ['crown', 'hacked_item', 42], // crown forged, rest junk
    streak: { count: -3, lastDay: 'not-a-date' },
    titles: { zone1_guardian: 'yes', made_up: true }, // titles are derived
    leaderboardOptIn: 'yes',
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
  const {
    startLevel, answerQuizQuestion, acknowledgeQuizFeedback,
    chooseSceneOption, acknowledgeSceneFeedback, getCurrentScene, finalizeLevel,
    getActiveRecap, answerRecapQuestion, acknowledgeRecapFeedback, levelKey,
    completeActivity, activityTotal,
  } = await import('../src/quests/engine');
  type QuestSession = import('../src/quests/engine').QuestSession;
  const { resolveQuest } = await import('../src/quests/registry');
  const { getPriorPreAnswers } = await import('../src/quests/levels');
  const {
    LEVEL_XP, LEVEL_COINS, ZONE_COMPLETE_BONUS, awardForLevel,
    rankForXp, xpToNextRank, XP_PER_RANK,
    advanceStreak, sanitizeStreak, todayString,
    SHOP_ITEMS, getShopItem, shopCatalogueMatchesConfig,
    TITLE_IDS, computeUnlockedTitles,
  } = await import('../src/economy/economy');
  const {
    ACCESSORIES, FREE_ACCESSORIES, SHOP_ACCESSORIES, filterToOwnedAccessories,
  } = await import('../src/player/avatarConfig');
  const { DEMO_COHORT } = await import('../src/community/leaderboard');
  const { getStrings } = await import('../src/i18n/strings');
  type Quest = import('../src/quests/schema').Quest;

  // ---------- 0. Load-time sanitization of the seeded junk+forged save ----------
  {
    const s = progressStore.getState();
    assert(s.xp === 0, 'load clamps forged xp (no recorded progress) to 0');
    assert(s.coins === 0, 'load resets non-numeric coins to 0');
    assert(
      JSON.stringify(s.ownedAccessories) === JSON.stringify([]),
      'load clears owned cosmetics the recorded progress cannot justify',
    );
    assert(
      s.streak.count === 0 && s.streak.lastDay === null,
      'load resets malformed streak',
    );
    assert(
      JSON.stringify(s.titles) === JSON.stringify({}),
      'load recomputes titles from milestones (forged/unknown titles dropped)',
    );
    assert(s.leaderboardOptIn === false, 'load coerces non-boolean opt-in to FALSE');
    assert(
      JSON.stringify(s.avatar?.accessories) === JSON.stringify(['glasses']),
      'load strips BOTH un-earned shop cosmetics from the equipped avatar',
    );
  }

  const resetProgress = () =>
    progressStore.update({
      completedZones: {}, badges: {}, quizScores: {},
      levelProgress: {}, replayCounts: {}, preAnswersByQuest: {},
      xp: 0, coins: 0, ownedAccessories: [],
      streak: { count: 0, lastDay: null }, titles: {}, leaderboardOptIn: false,
    });
  resetProgress();

  // ---------- 1. Pure award/rank rules ----------
  assert(
    JSON.stringify(awardForLevel('story', false)) ===
      JSON.stringify({ xp: LEVEL_XP.story, coins: LEVEL_COINS.story }),
    'story award = base story XP/Coins',
  );
  assert(
    awardForLevel('quiz', true).xp === LEVEL_XP.quiz + ZONE_COMPLETE_BONUS.xp &&
      awardForLevel('quiz', true).coins === LEVEL_COINS.quiz + ZONE_COMPLETE_BONUS.coins,
    'zone-completing quiz gets the one-time bonus',
  );
  assert(rankForXp(0) === 1 && rankForXp(XP_PER_RANK - 1) === 1, 'rank 1 below the first threshold');
  assert(rankForXp(XP_PER_RANK) === 2, 'rank 2 exactly at the threshold');
  assert(rankForXp(900) === 1 + Math.floor(900 / XP_PER_RANK), 'full-game XP rank');
  assert(rankForXp(-10 as number) === 1 && rankForXp(NaN as number) === 1, 'garbage XP still rank 1');
  assert(xpToNextRank(0) === XP_PER_RANK && xpToNextRank(XP_PER_RANK - 10) === 10, 'xp-to-next-rank math');

  // ---------- 1b. Reconciliation clamps forged saves, passes honest ones ----------
  {
    const { earnedTotals, reconcileEconomy } = await import('../src/economy/economy');
    const zone1Done = {
      levelProgress: { 'zone1:level1': true, 'zone1:level2': true, 'zone1:level3': true },
      completedZones: { zone1: true },
    };
    const earned = earnedTotals(zone1Done);
    // Task 18: the reconciliation CEILING for a completed zone includes the
    // zone's wired activity level (zone1 = scenario) for every band —
    // progress keys are band-blind and the clamp is a maximum.
    assert(
      earned.xp ===
        LEVEL_XP.story + LEVEL_XP.decision + LEVEL_XP.scenario + LEVEL_XP.quiz + ZONE_COMPLETE_BONUS.xp &&
        earned.coins ===
          LEVEL_COINS.story + LEVEL_COINS.decision + LEVEL_COINS.scenario + LEVEL_COINS.quiz + ZONE_COMPLETE_BONUS.coins,
      'earnedTotals for a full zone includes its wired activity level',
    );
    // Pre-Task-15 saves: zone complete but NO level entries — fully credited.
    const legacy = earnedTotals({ levelProgress: {}, completedZones: { zone1: true } });
    assert(legacy.xp === earned.xp && legacy.coins === earned.coins,
      'pre-Task-15 saves (zone complete, no level map) keep full credit');
    // Honest state passes through untouched.
    const honest = reconcileEconomy(
      { xp: earned.xp, coins: earned.coins - 30, ownedAccessories: ['bow'] },
      zone1Done,
    );
    assert(
      honest.xp === earned.xp && honest.coins === earned.coins - 30 &&
        JSON.stringify(honest.ownedAccessories) === JSON.stringify(['bow']),
      'honest save passes reconciliation unchanged',
    );
    // Forged coins/xp clamp down to what the progress justifies.
    const forged = reconcileEconomy(
      { xp: 99999, coins: 99999, ownedAccessories: ['bow'] },
      zone1Done,
    );
    assert(forged.xp === earned.xp && forged.coins === earned.coins - 30,
      'forged xp/coins clamp to earnable totals (minus justified spend)');
    // Owned items the earnings cannot cover are cleared entirely.
    const fake = reconcileEconomy(
      { xp: 0, coins: 0, ownedAccessories: ['cape', 'crown'] },
      zone1Done, // earned coins (87 with the activity allowance) < 140 spend
    );
    assert(fake.ownedAccessories.length === 0, 'unaffordable forged ownership is cleared');
    assert(fake.titles.zone1_guardian === true && fake.titles.first_level === true,
      'titles recomputed from milestones during reconciliation');
  }

  // ---------- 2. Gentle streak (pure, simulated days) ----------
  {
    let st = { count: 0, lastDay: null as string | null };
    st = advanceStreak(st, '2026-08-01');
    assert(st.count === 1 && st.lastDay === '2026-08-01', 'first play starts streak at 1');
    st = advanceStreak(st, '2026-08-01');
    assert(st.count === 1, 'same-day play is idempotent');
    st = advanceStreak(st, '2026-08-02');
    assert(st.count === 2, 'consecutive day increments');
    st = advanceStreak(st, '2026-08-03');
    assert(st.count === 3, 'third consecutive day = 3');
    st = advanceStreak(st, '2026-08-07');
    assert(st.count === 1 && st.lastDay === '2026-08-07', 'gap QUIETLY restarts at 1 (no penalty state)');
    st = advanceStreak(st, 'garbage');
    assert(st.count === 1 && st.lastDay === '2026-08-07', 'malformed date ignored');
    // Month boundary
    st = advanceStreak({ count: 5, lastDay: '2026-08-31' }, '2026-09-01');
    assert(st.count === 6, 'streak continues across a month boundary');
    assert(
      JSON.stringify(sanitizeStreak({ count: 9, lastDay: '2026-13-99' })) ===
        JSON.stringify({ count: 0, lastDay: null }),
      'sanitizeStreak resets an invalid lastDay',
    );
    assert(/^\d{4}-\d{2}-\d{2}$/.test(todayString()), 'todayString is YYYY-MM-DD');
  }

  // ---------- 3. Store-level streak across simulated day changes ----------
  progressStore.touchDailyStreak('2026-08-01');
  progressStore.touchDailyStreak('2026-08-01');
  assert(progressStore.getState().streak.count === 1, 'store streak idempotent per day');
  progressStore.touchDailyStreak('2026-08-02');
  assert(progressStore.getState().streak.count === 2, 'store streak increments next day');
  progressStore.touchDailyStreak('2026-08-05');
  assert(progressStore.getState().streak.count === 1, 'store streak quietly restarts after a gap');
  progressStore.update({ streak: { count: 0, lastDay: null } });

  // ---------- helpers to drive real level sessions ----------
  const playScenes = (session: QuestSession): QuestSession => {
    let s = session;
    while (s.phase === 'scenes') {
      getCurrentScene(s)!;
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
  const wrongIndex = (q: Quest, i: number) => (q.quizQuestions[i].correctIndex === 0 ? 1 : 0);
  // Task 18: plays EVERY level generically — some 12-15 quests now carry an
  // extra activity level between the decision and the quiz.
  const completeZone = (zoneId: string) => {
    const quest = resolveQuest(zoneId, '12-15', 'en')!;
    const results = quest.levels.map((level, li) => {
      let s = startLevel(
        quest, li,
        level.kind === 'quiz' ? { priorPreAnswers: getPriorPreAnswers(quest.questId) } : undefined,
      );
      if (s.phase === 'pre-quiz') s = answerAll(s, (i) => wrongIndex(quest, i)); // baseline 0
      if (s.phase === 'scenes') s = playScenes(s);
      if (s.phase === 'activity') s = completeActivity(s, activityTotal(level));
      if (s.phase === 'post-quiz') {
        s = answerAll(s, (i) => quest.quizQuestions[i].correctIndex);
        while (s.phase === 'recap') {
          const item = getActiveRecap(s)!;
          s = answerRecapQuestion(s, item.correctIndex);
          s = acknowledgeRecapFeedback(s);
        }
      }
      return finalizeLevel(s);
    });
    return { quest, r1: results[0], r2: results[1], r3: results[results.length - 1], results };
  };

  // ---------- 4. Awards land ONLY via the engine's recorded path ----------
  const { quest: q1, r1, r2, r3 } = completeZone('zone1');
  assert(
    r1.recorded && r1.xpAwarded === LEVEL_XP.story && r1.coinsAwarded === LEVEL_COINS.story,
    'L1 story pays story XP/Coins',
  );
  assert(
    JSON.stringify(r1.newTitles) === JSON.stringify(['first_level']),
    'first level completion unlocks the first_level title',
  );
  assert(
    r2.xpAwarded === LEVEL_XP.decision && r2.coinsAwarded === LEVEL_COINS.decision,
    'L2 decision pays decision XP/Coins',
  );
  assert(
    r3.zoneCompleted &&
      r3.xpAwarded === LEVEL_XP.quiz + ZONE_COMPLETE_BONUS.xp &&
      r3.coinsAwarded === LEVEL_COINS.quiz + ZONE_COMPLETE_BONUS.coins,
    'zone-completing quiz pays quiz + bonus',
  );
  assert(
    r3.newTitles.includes('zone1_guardian'),
    'completing zone1 unlocks the Safe Zone Guardian title',
  );
  const ZONE_TOTAL_XP =
    LEVEL_XP.story + LEVEL_XP.decision + LEVEL_XP.quiz + ZONE_COMPLETE_BONUS.xp;
  const ZONE_TOTAL_COINS =
    LEVEL_COINS.story + LEVEL_COINS.decision + LEVEL_COINS.quiz + ZONE_COMPLETE_BONUS.coins;
  {
    const s = progressStore.getState();
    assert(s.xp === ZONE_TOTAL_XP && s.coins === ZONE_TOTAL_COINS, 'zone1 totals accumulate in the store');
    assert(s.titles.first_level === true && s.titles.zone1_guardian === true, 'titles persisted');
    assert(s.badges[`zone1_star`] === true, 'Task 9 badge still awarded (economy is additive)');
    assert(s.streak.count >= 1 && s.streak.lastDay === todayString(), 'completions count for today\'s streak');
  }

  // ---------- 5. No grinding: practice + already-complete pay nothing ----------
  {
    const before = progressStore.getState();
    let s = startLevel(q1, 0, { practice: true });
    s = playScenes(s);
    const rp = finalizeLevel(s);
    assert(!rp.recorded && rp.xpAwarded === 0 && rp.coinsAwarded === 0 && rp.newTitles.length === 0,
      'practice replay awards NOTHING');
    // Non-practice replay of an already-complete level is also unpaid.
    let s2 = startLevel(q1, 0);
    s2 = answerAll(s2, (i) => wrongIndex(q1, i));
    s2 = playScenes(s2);
    const rr = finalizeLevel(s2);
    assert(!rr.recorded && rr.xpAwarded === 0 && rr.coinsAwarded === 0,
      'already-complete replay awards NOTHING');
    const after = progressStore.getState();
    assert(after.xp === before.xp && after.coins === before.coins, 'xp/coins unchanged by replays');
    assert(
      JSON.stringify(after.quizScores) === JSON.stringify(before.quizScores),
      'recorded quiz scores untouched by replays (Task 15 invariant)',
    );
  }

  // ---------- 6. Avatar Shop: cosmetic-only, validated purchases ----------
  assert(shopCatalogueMatchesConfig(), 'shop catalogue exactly covers SHOP_ACCESSORIES');
  assert(SHOP_ITEMS.every((i) => Number.isInteger(i.price) && i.price > 0), 'all prices are positive Coins');
  {
    const coins0 = progressStore.getState().coins; // 75 after one zone
    const bow = getShopItem('bow')!;
    assert(bow.price <= coins0, 'one zone earns enough for the cheapest item');
    assert(progressStore.purchaseAccessory('bow') === true, 'buying bow succeeds');
    const s1 = progressStore.getState();
    assert(s1.coins === coins0 - bow.price, 'price deducted');
    assert(s1.ownedAccessories.includes('bow'), 'bow owned');
    assert(progressStore.purchaseAccessory('bow') === false, 'double-buy rejected');
    assert(progressStore.purchaseAccessory('cape') === false, 'insufficient Coins rejected');
    assert(progressStore.purchaseAccessory('glasses' as any) === false, 'free accessories are not purchasable');
    assert(progressStore.getState().coins === coins0 - bow.price, 'failed buys never deduct');

    // Ownership ingress at setAvatar: cape (un-owned) silently dropped.
    progressStore.setAvatar({
      base: 'sunny', skinTone: '#F2C9A0', hair: 'short', outfit: 'kurta',
      nickname: 'SmokeKid', accessories: ['bow', 'cape', 'glasses'] as any,
    });
    const worn = progressStore.getState().avatar!.accessories;
    assert(
      JSON.stringify(worn) === JSON.stringify(['bow', 'glasses']),
      'setAvatar keeps owned shop + free items, drops un-owned shop items',
    );
    assert(
      JSON.stringify(filterToOwnedAccessories(['crown', 'cap'] as any, [])) ===
        JSON.stringify(['cap']),
      'filterToOwnedAccessories pure check',
    );
    assert(ACCESSORIES.length === FREE_ACCESSORIES.length + SHOP_ACCESSORIES.length,
      'accessory id spaces partition cleanly');
  }

  // ---------- 7. Full game: titles, champion, catalogue affordability ----------
  for (const z of ['zone0', 'zone2', 'zone3', 'zone4', 'zone5']) completeZone(z);
  {
    const s = progressStore.getState();
    const earned = computeUnlockedTitles(s);
    assert(
      JSON.stringify(earned) === JSON.stringify(TITLE_IDS),
      'all titles earned after finishing every zone (incl. all_zones_champion)',
    );
    assert(TITLE_IDS.every((id) => s.titles[id] === true), 'every title persisted by the engine');
    // Task 18: a full 12-15 EN run also plays zone3's memory and zone5's
    // sorting levels (zone1 scenario is 16-18, zone2 hidden is 8-11).
    const FULL_XP = 6 * ZONE_TOTAL_XP + LEVEL_XP.memory + LEVEL_XP.sorting;
    const FULL_COINS = 6 * ZONE_TOTAL_COINS + LEVEL_COINS.memory + LEVEL_COINS.sorting;
    assert(s.xp === FULL_XP, 'full-game XP total (incl. Task 18 activity levels)');
    const spent = getShopItem('bow')!.price;
    assert(s.coins === FULL_COINS - spent, 'full-game Coins total (minus the bow)');
    const cataloguePrice = SHOP_ITEMS.reduce((sum, i) => sum + i.price, 0);
    assert(6 * ZONE_TOTAL_COINS >= cataloguePrice,
      'normal play earns enough Coins for the ENTIRE catalogue (no real-money pressure)');
    assert(rankForXp(s.xp) === 1 + Math.floor(FULL_XP / XP_PER_RANK), 'final Player Rank derived');
    assert(levelKey('zone1', 'level1') in s.levelProgress, 'level progress map intact');
    assert(
      s.activityScores[levelKey('zone3', 'level_memory')]?.total ===
        activityTotal(resolveQuest('zone3', '12-15', 'en')!.levels[2]) &&
        s.activityScores[levelKey('zone5', 'level_sorting')]?.total ===
          activityTotal(resolveQuest('zone5', '12-15', 'en')!.levels[2]),
      'activity scores recorded for the two 12-15 activity levels',
    );
  }

  // ---------- 8. Leaderboard: cohort-only, pseudonymous, opt-in OFF ----------
  {
    assert(progressStore.getState().leaderboardOptIn === false, 'opt-in DEFAULT OFF even after full game');
    progressStore.setLeaderboardOptIn(true);
    assert(progressStore.getState().leaderboardOptIn === true, 'child can opt in');
    progressStore.setLeaderboardOptIn(false);
    assert(progressStore.getState().leaderboardOptIn === false, 'child can opt back out');
    assert(DEMO_COHORT.length >= 3, 'demo cohort has enough sample rows to look like a class');
    for (const e of DEMO_COHORT) {
      assert(/^[A-Za-z]+[A-Za-z]*_\d{2}$/.test(e.handle),
        `demo handle "${e.handle}" is a pseudonymous game-style handle`);
      assert(Number.isInteger(e.xp) && e.xp >= 0 && e.xp <= 6 * ZONE_TOTAL_XP,
        `demo xp for "${e.handle}" is in the real economy range`);
    }
  }

  // ---------- 9. Strings: EN/HI parity, no emojis, Western numerals ----------
  {
    const langs = ['en', 'hi'] as const;
    for (const lang of langs) {
      const t = getStrings(lang);
      const samples: string[] = [
        t.playerRankChip(3), t.coinsChip(45), t.openShopLabel, t.streakChip(2),
        t.streakNote, t.rewardsLine(30, 10), t.titleUnlocked(t.titleNames.first_level),
        t.avatarShopTitle, t.shopIntro, t.shopNoRealMoney, t.shopBuy, t.shopOwned,
        t.shopConfirm(t.accessoryNames[6], 30), t.shopYesBuy, t.shopNotNow,
        t.shopNotEnough, t.shopEquipHint, t.coinPrice(30),
        t.profileHeading, t.playerRankLabel, t.totalXpLabel, t.coinsLabel,
        t.streakLabel, t.streakDays(2), t.xpToNext(120), t.titlesHeading,
        t.titlesPrivateNote, t.noTitlesYet,
        t.tabLeaderboard, t.leaderboardTitle, t.leaderboardIntro,
        t.leaderboardOptInLabel, t.leaderboardOffNote, t.leaderboardDemoNote,
        t.leaderboardYouTag, t.leaderboardNeverPublic, t.leaderboardXp(500),
        ...TITLE_IDS.map((id) => t.titleNames[id] ?? ''),
        ...t.accessoryNames,
      ];
      for (const s of samples) {
        assert(typeof s === 'string' && s.length > 0, `${lang}: string present ("${s.slice(0, 24)}...")`);
        assert(!EMOJI.test(s), `${lang}: no emoji in "${s.slice(0, 32)}"`);
        assert(!DEVANAGARI_DIGITS.test(s), `${lang}: Western numerals only in "${s.slice(0, 32)}"`);
      }
      assert(t.accessoryNames.length === ACCESSORIES.length,
        `${lang}: accessory names cover every accessory id`);
      assert(TITLE_IDS.every((id) => typeof t.titleNames[id] === 'string'),
        `${lang}: every title id has a display name`);
      // The "Player Rank" label must be distinct from the in-zone level word.
      assert(t.playerRankChip(2) !== t.levelN(2), `${lang}: Player Rank never reads like a zone level`);
    }
    // Gentle-streak rule (§9.6): no guilt words anywhere in streak copy.
    const en = getStrings('en');
    for (const bad of ['lose', 'lost', 'miss', 'broken', 'don\u2019t break', 'hurry']) {
      assert(!en.streakNote.toLowerCase().includes(bad), `streak copy avoids "${bad}"`);
      assert(!en.streakChip(3).toLowerCase().includes(bad), `streak chip avoids "${bad}"`);
    }
  }

  console.log('\nECONOMY SMOKE: ALL CHECKS PASSED');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
