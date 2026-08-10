/**
 * Task 27 smoke — Zone completion certificates
 * (run: pnpm exec tsx scripts/certificates.smoke.tsx)
 *
 * Proves the §14-§17 certificate rules:
 *  - certificates are DERIVED from completedZones: no real completion, no
 *    certificate — forged records for uncompleted/unknown zones are
 *    stripped at every load, junk-shaped records dropped;
 *  - a VALID existing record for a genuinely completed zone is kept
 *    VERBATIM at load (stable id + date across sessions, even old years);
 *  - legacy saves (zone complete before certificates existed) are
 *    backfilled exactly once, dated at first load;
 *  - the engine's real zone completion issues the certificate ATOMICALLY
 *    (same store update as completedZones) and persists it;
 *  - practice replays and later zone completions never touch an earned
 *    certificate (id + date stable forever);
 *  - pure helpers: id format NYN-<CODE>-<YEAR>-<6 alnum>, EN/HI date
 *    formatting with WESTERN numerals, safe filename, recipient fallback;
 *  - EN/HI strings exist and are emoji-free;
 *  - the certificate document SSR-renders with recipient/zone/id/date and
 *    uses NO oklch()/var(--) colors (html2canvas cannot parse them).
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// ---- localStorage shim MUST exist before any app module loads (all app ----
// ---- imports below are dynamic, inside main(), for exactly this reason) ----
const backing = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => backing.get(k) ?? null,
  setItem: (k: string, v: string) => void backing.set(k, String(v)),
  removeItem: (k: string) => void backing.delete(k),
  clear: () => backing.clear(),
};

// Seed: zone1 + zone2 genuinely complete. zone1 carries a VALID old-year
// record (must be kept verbatim), zone2 has none (legacy backfill), zone5
// has a FORGED valid-shaped record for an uncompleted zone (strip), zone4
// a junk-shaped record (drop), and "zoneX" an unknown zone id (drop).
const KEPT_ID = 'NYN-SAF-2025-KEEPIT';
const KEPT_AT = '2025-12-01T09:30:00.000Z';
backing.set(
  'nn-progress-v1',
  JSON.stringify({
    onboarded: true,
    ageBand: '12-15',
    avatar: {
      base: 'sunny', skinTone: '#F2C9A0', hair: 'short', outfit: 'kurta',
      nickname: 'CertKid', accessories: [],
    },
    completedZones: { zone1: true, zone2: true },
    badges: { zone1_star: true, zone2_star: true },
    quizScores: { zone1: 3, zone2: 3 },
    certificates: {
      zone1: { certificateId: KEPT_ID, completedAt: KEPT_AT },
      zone5: { certificateId: 'NYN-DIG-2026-FORGED', completedAt: '2026-01-01T00:00:00.000Z' },
      zone4: { certificateId: 'HACK', completedAt: 42 },
      zoneX: { certificateId: 'NYN-JUS-2026-ABCDEF', completedAt: '2026-01-01T00:00:00.000Z' },
    },
  }),
);

let checks = 0;
function assert(cond: boolean, msg: string) {
  checks += 1;
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`ok - ${msg}`);
}

const DEVANAGARI_DIGITS = /[\u0966-\u096F]/;
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

async function main() {
  const { progressStore } = await import('../src/data/progressStore');
  const {
    ZONE_CERT_CODES, CERTIFICATE_ID_PATTERN, generateCertificateId,
    isCertificateRecord, reconcileCertificates,
    formatCertificateDate, certificateFileName, certificateRecipient,
  } = await import('../src/certificates/certificates');
  const {
    startLevel, answerQuizQuestion, acknowledgeQuizFeedback,
    chooseSceneOption, acknowledgeSceneFeedback, continueScene,
    getCurrentScene, finalizeLevel, getActiveRecap, answerRecapQuestion,
    acknowledgeRecapFeedback, completeActivity, activityTotal,
  } = await import('../src/quests/engine');
  type QuestSession = import('../src/quests/engine').QuestSession;
  const { resolveQuest } = await import('../src/quests/registry');
  const { getPriorPreAnswers } = await import('../src/quests/levels');
  const { getStrings } = await import('../src/i18n/strings');
  const { CertificateDoc } = await import('../src/certificates/CertificateDoc');

  const todayUtc = new Date().toISOString().slice(0, 10);
  const thisYear = String(new Date().getFullYear());

  // Architect round: the constructor write-back must make load-time repair
  // DURABLE - the seeded legacy save (zone2 completed WITHOUT a record) must
  // already have its backfilled certificate in device storage right now,
  // BEFORE any update() runs. Reload stability then follows from the
  // kept-verbatim check below: boot 1 persists, boot 2 keeps verbatim.
  {
    const persistedAtBoot = JSON.parse(backing.get("nn-progress-v1")!) as {
      certificates?: Record<string, unknown>;
    };
    assert(
      JSON.stringify(persistedAtBoot.certificates ?? null) ===
        JSON.stringify(progressStore.getState().certificates),
      "boot write-back: repaired certificates persisted at load, before any update",
    );
  }

  // ---------- 1. Load-time reconciliation of the seeded save ----------
  {
    const certs = progressStore.getState().certificates;
    assert(
      certs.zone1?.certificateId === KEPT_ID && certs.zone1?.completedAt === KEPT_AT,
      'valid old record for a completed zone is kept VERBATIM (id + date stable across sessions)',
    );
    assert(
      !!certs.zone2 && CERTIFICATE_ID_PATTERN.test(certs.zone2.certificateId),
      'legacy completed zone (no record) is backfilled with a well-formed id',
    );
    assert(
      certs.zone2!.certificateId.startsWith('NYN-CHD-'),
      'backfilled id carries the zone2 code (CHD)',
    );
    assert(
      certs.zone2!.completedAt.slice(0, 10) === todayUtc,
      'backfilled legacy record is dated at first load (disclosed limitation)',
    );
    assert(certs.zone5 === undefined, 'FORGED record for an uncompleted zone is stripped at load');
    assert(certs.zone4 === undefined, 'junk-shaped record is dropped at load');
    assert((certs as any).zoneX === undefined, 'record for an unknown zone id is dropped at load');
    assert(Object.keys(certs).length === 2, 'exactly the two justified certificates survive load');
  }

  // ---------- 2. Reset wipes certificates with their completions ----------
  progressStore.update({
    completedZones: {}, badges: {}, quizScores: {},
    levelProgress: {}, replayCounts: {}, preAnswersByQuest: {},
    xp: 0, coins: 0, ownedAccessories: [],
    streak: { count: 0, lastDay: null }, titles: {}, leaderboardOptIn: false,
  });
  assert(
    Object.keys(progressStore.getState().certificates).length === 0,
    'clearing completedZones clears the derived certificates too (no orphan certs)',
  );

  // ---------- 3. Real engine walk issues the certificate atomically ----------
  const playScenes = (session: QuestSession): QuestSession => {
    let s = session;
    while (s.phase === 'scenes') {
      const scene = getCurrentScene(s)!;
      if (scene.choices.length === 0) {
        s = continueScene(s); // Task 26: narration-only panel
        continue;
      }
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
  const completeZone = (zoneId: string) => {
    const quest = resolveQuest(zoneId, '12-15', 'en')!;
    return quest.levels.map((level, li) => {
      let s = startLevel(
        quest, li,
        level.kind === 'quiz' ? { priorPreAnswers: getPriorPreAnswers(quest.questId) } : undefined,
      );
      if (s.phase === 'pre-quiz') {
        s = answerAll(s, (i) => (quest.quizQuestions[i].correctIndex === 0 ? 1 : 0));
      }
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
  };

  assert(
    progressStore.getState().certificates.zone0 === undefined,
    'no certificate for zone0 before it is completed',
  );
  const zone0Results = completeZone('zone0');
  const zone0Final = zone0Results[zone0Results.length - 1];
  assert(
    zone0Final.recorded && zone0Final.zoneCompleted,
    'engine walk really completed zone0 (recorded quiz finish)',
  );
  const issued = progressStore.getState().certificates.zone0;
  assert(!!issued, 'certificate exists in the SAME update that marked zone0 complete');
  assert(
    CERTIFICATE_ID_PATTERN.test(issued!.certificateId) &&
      issued!.certificateId.startsWith(`NYN-KNW-${thisYear}-`),
    'issued id is well-formed with the zone0 code and current year',
  );
  assert(issued!.completedAt.slice(0, 10) === todayUtc, 'issued certificate is dated today');

  // Partial progress elsewhere must NOT issue anything.
  {
    const quest1 = resolveQuest('zone1', '12-15', 'en')!;
    let s = startLevel(quest1, 0);
    if (s.phase === 'scenes') s = playScenes(s);
    finalizeLevel(s);
    assert(
      progressStore.getState().certificates.zone1 === undefined,
      'completing only one level of a zone issues NO certificate',
    );
  }

  // ---------- 4. Stability: replays and later zones never touch it ----------
  const frozenId = issued!.certificateId;
  const frozenAt = issued!.completedAt;
  {
    const quest0 = resolveQuest('zone0', '12-15', 'en')!;
    let s = startLevel(quest0, 0); // practice replay of L1
    if (s.phase === 'scenes') s = playScenes(s);
    const replay = finalizeLevel(s);
    assert(!replay.recorded, 'replay of a done level is practice (not recorded)');
    const after = progressStore.getState().certificates.zone0!;
    assert(
      after.certificateId === frozenId && after.completedAt === frozenAt,
      'practice replay leaves the certificate VERBATIM',
    );
  }
  completeZone('zone1');
  {
    const certs = progressStore.getState().certificates;
    assert(
      !!certs.zone1 && certs.zone1.certificateId.startsWith('NYN-SAF-'),
      'completing zone1 issues its own certificate (SAF code)',
    );
    assert(
      certs.zone0!.certificateId === frozenId && certs.zone0!.completedAt === frozenAt,
      'earning a second certificate leaves the first VERBATIM (independence)',
    );
    assert(
      certs.zone0!.certificateId !== certs.zone1!.certificateId,
      'certificate ids are distinct per zone',
    );
  }

  // ---------- 5. Persistence: the records are really in the saved JSON ----------
  {
    const raw = JSON.parse(backing.get('nn-progress-v1')!);
    assert(
      raw.certificates?.zone0?.certificateId === frozenId &&
        raw.certificates?.zone0?.completedAt === frozenAt,
      'certificate record persists verbatim in the saved progress JSON',
    );
    assert(!!raw.certificates?.zone1, 'second certificate persisted too');
  }

  // ---------- 6. Pure helpers ----------
  {
    const zoneIds = ['zone0', 'zone1', 'zone2', 'zone3', 'zone4', 'zone5', 'zone6'];
    assert(
      JSON.stringify(Object.keys(ZONE_CERT_CODES).sort()) === JSON.stringify(zoneIds) &&
        new Set(Object.values(ZONE_CERT_CODES)).size === 7 &&
        Object.values(ZONE_CERT_CODES).every((c) => /^[A-Z]{3}$/.test(c)),
      'all 7 zones have unique 3-letter certificate codes',
    );
    const idA = generateCertificateId('zone5', new Date().toISOString());
    const idB = generateCertificateId('zone5', new Date().toISOString());
    assert(
      CERTIFICATE_ID_PATTERN.test(idA) && idA.startsWith('NYN-DIG-') && idA !== idB,
      'generateCertificateId: well-formed, zone-coded, non-repeating',
    );
    assert(
      !isCertificateRecord(null) && !isCertificateRecord('x') && !isCertificateRecord({}) &&
        !isCertificateRecord({ certificateId: 'NYN-SAF-2026-ABC123' }) &&
        !isCertificateRecord({ certificateId: 'bad', completedAt: KEPT_AT }) &&
        isCertificateRecord({ certificateId: 'NYN-SAF-2026-ABC123', completedAt: KEPT_AT }),
      'isCertificateRecord accepts only well-formed records',
    );
    const rec = reconcileCertificates(
      { zone3: { certificateId: 'NYN-SCH-2026-AAAAAA', completedAt: KEPT_AT } },
      { zone3: false },
      new Date().toISOString(),
    );
    assert(Object.keys(rec).length === 0, 'reconcile drops a record when completedZones says false');
    const enDate = formatCertificateDate('2026-08-10T05:00:00.000Z', 'en');
    const hiDate = formatCertificateDate('2026-08-10T05:00:00.000Z', 'hi');
    assert(
      enDate.includes('10') && enDate.includes('August') && enDate.includes('2026'),
      'EN certificate date is a long-form date',
    );
    assert(
      hiDate.includes('10') && hiDate.includes('अगस्त') && hiDate.includes('2026') &&
        !DEVANAGARI_DIGITS.test(hiDate),
      'HI certificate date uses Hindi month with WESTERN numerals',
    );
    const fname = certificateFileName('Digital Safety');
    assert(
      /^Nyaya-Nagri-.+-Certificate\.pdf$/.test(fname) && !/\s/.test(fname) && fname.includes('Digital'),
      'PDF filename is Nyaya-Nagri-<Zone>-Certificate.pdf with no spaces',
    );
    assert(
      certificateRecipient(undefined, 'FB') === 'FB' &&
        certificateRecipient('   ', 'FB') === 'FB' &&
        certificateRecipient('Asha', 'FB').includes('Asha'),
      'recipient uses the live nickname with a friendly fallback (no stored names)',
    );
  }

  // ---------- 7. EN/HI strings: present, emoji-free, Western numerals ----------
  for (const lang of ['en', 'hi'] as const) {
    const t = getStrings(lang);
    const all = [
      t.certificatesHeading, t.certificatesEarnHeading, t.certificateOfCompletion,
      t.certificateCompletedTag, t.viewCertificate, t.downloadCertificate,
      t.certificateDownloading, t.certificateDownloadFailed, t.certificateLockedHint,
      t.certificateLevelsDone(2, 5), t.certificateUnlockedToast,
      t.certificateUnlockedBody('Zone Name'), t.certificateClose, t.certBrandName,
      t.certBrandTagline, t.certPresentedTo, t.certForCompleting, t.certBodyLine,
      t.certCompletedOnLabel, t.certIdLabel, t.certRecipientFallback,
    ];
    assert(all.every((s) => typeof s === 'string' && s.trim().length > 0),
      `${lang}: every certificate string exists and is non-empty`);
    assert(all.every((s) => !EMOJI.test(s)), `${lang}: certificate strings are emoji-free`);
    const counts = t.certificateLevelsDone(2, 5);
    assert(
      counts.includes('2') && counts.includes('5') && !DEVANAGARI_DIGITS.test(counts),
      `${lang}: level counts use Western numerals`,
    );
    assert(
      t.certificateUnlockedBody('School Rights').includes('School Rights'),
      `${lang}: unlock body embeds the zone name`,
    );
  }
  assert(getStrings('en').certBrandName === 'NYAYA NAGRI', 'EN brand line is the product name');

  // ---------- 8. The certificate document itself (SSR) ----------
  for (const lang of ['en', 'hi'] as const) {
    const t = getStrings(lang);
    const zoneName = lang === 'en' ? 'School Rights' : 'स्कूल के अधिकार';
    const html = renderToStaticMarkup(
      <CertificateDoc
        zoneName={zoneName}
        recipientName="CertKid"
        dateText={formatCertificateDate(KEPT_AT, lang)}
        certificateId="NYN-SCH-2026-ABC123"
        t={t}
      />,
    );
    assert(
      html.includes('CertKid') && html.includes(zoneName) &&
        html.includes('NYN-SCH-2026-ABC123') && html.includes(t.certificateOfCompletion),
      `${lang}: certificate doc renders recipient, zone, id and title`,
    );
    assert(
      !html.includes('oklch') && !html.includes('var(--'),
      `${lang}: certificate doc uses only literal colors (html2canvas-safe)`,
    );
    assert(!EMOJI.test(html), `${lang}: certificate doc is emoji-free`);
    assert(
      html.includes("Noto Serif Devanagari") && html.includes("Noto Sans Devanagari"),
      `${lang}: certificate doc font stacks carry Devanagari-capable faces`,
    );
  }

  console.log(`\nAll ${checks} certificate checks passed (Task 27).`);
}

main().catch((err) => {
  console.error('SMOKE CRASHED:', err);
  process.exit(1);
});
