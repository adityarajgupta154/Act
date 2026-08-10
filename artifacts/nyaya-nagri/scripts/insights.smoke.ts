/**
 * Learning-insights smoke — analyzer thresholds, evidence gates, practice
 * exclusion, trend direction, fingerprint stability, non-diagnostic
 * language scan (EN+HI), and structural file greps (single flush path,
 * capped log, server route + filter wiring, PIN hashing, 14 report
 * sections). No network, no DOM.
 *
 * Run from artifacts/nyaya-nagri:  pnpm exec tsx scripts/insights.smoke.ts
 */
import { readFileSync } from 'node:fs';
import {
  analyzeProgress,
  MIN_OVERALL_EVENTS,
  MIN_OVERALL_SESSIONS,
  MIN_TOPIC_EVENTS,
  STRONG_PCT,
} from '../src/insights/analyzer';
import type { LearningAnalysis } from '../src/insights/analyzer';
import { insightsFingerprint } from '../src/insights/track';
import { MAX_ACTIVITY_EVENTS, type ActivityEvent, type ActivityKind } from '../src/insights/types';
import type { ProgressState } from '../src/data/progressStore';
import { getStrings } from '../src/i18n/strings';

let failures = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    console.log(`  ok  ${name}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${name}`);
  }
}

/* ---------------- fixtures ---------------- */

const BASE_TS = Date.UTC(2026, 7, 1, 9, 0, 0);
const DAY = 24 * 60 * 60 * 1000;
let seq = 0;

function ev(over: {
  zoneId: string;
  kind?: ActivityKind;
  isCorrect?: boolean;
  session?: number;
  practice?: boolean;
  timestamp?: number;
  responseTime?: number;
}): ActivityEvent {
  seq += 1;
  const isCorrect = over.isCorrect ?? true;
  return {
    questionId: `q-${seq}`,
    zoneId: over.zoneId,
    topic: over.zoneId,
    difficulty: 'checkpoint',
    selectedAnswer: 0,
    correctAnswer: isCorrect ? 0 : 1,
    isCorrect,
    attempts: 1,
    responseTime: over.responseTime ?? 5000,
    hintsUsed: 0,
    completed: true,
    timestamp: over.timestamp ?? BASE_TS + (over.session ?? 1) * DAY + seq * 60_000,
    score: isCorrect ? 1 : 0,
    retryCount: 0,
    kind: over.kind ?? 'quiz-post',
    session: over.session ?? 1,
    practice: over.practice ?? false,
  };
}

function mkState(events: ActivityEvent[]): ProgressState {
  return {
    activityLog: events,
    insightsMeta: {
      timeSpentMs: events.reduce((s, e) => s + e.responseTime, 0),
      aiCache: {},
    },
    completedZones: {},
    badges: {},
    certificates: {},
    levelProgress: {},
    replayCounts: {},
    streak: { count: 0, lastDay: null },
  } as unknown as ProgressState;
}

function allFindings(a: LearningAnalysis) {
  return [...a.strengths, ...a.practiceAreas, ...a.recommendations];
}

/* ---------------- 1. evidence gates ---------------- */

console.log('— Evidence gates (pattern-over-time, never one-off) —');
{
  const a = analyzeProgress(mkState([]));
  check('empty log → no minimum data', !a.evidence.hasMinimumData);
  check('empty log → overall accuracy null', a.overall.accuracyPct === null);
  check(
    'empty log → every topic insufficient',
    a.topics.every((t) => t.label === 'insufficient'),
  );
  check(
    'empty log → no strengths / practice findings',
    a.strengths.length === 0 && a.practiceAreas.length === 0,
  );
}
{
  // 7 events in ONE session — below both floors (needs 8 events + 2 sessions).
  const events = Array.from({ length: MIN_OVERALL_EVENTS - 1 }, () =>
    ev({ zoneId: 'zone3', session: 1 }),
  );
  const a = analyzeProgress(mkState(events));
  check(
    `${MIN_OVERALL_EVENTS - 1} events / 1 session → still gated`,
    !a.evidence.hasMinimumData,
  );
}
{
  // Same volume split across 2 sessions but still under the event floor.
  const events = [
    ...Array.from({ length: 4 }, () => ev({ zoneId: 'zone3', session: 1 })),
    ...Array.from({ length: 3 }, () => ev({ zoneId: 'zone3', session: 2 })),
  ];
  const a = analyzeProgress(mkState(events));
  check('7 events / 2 sessions → still gated (event floor)', !a.evidence.hasMinimumData);
}
{
  // Regression: 8 scored answers in ONE sitting plus a practice-only later
  // session must NOT unlock overall judgements — the session gate counts
  // MEASURED sessions only.
  const events = [
    ...Array.from({ length: 8 }, () => ev({ zoneId: 'zone3', session: 1 })),
    ev({ zoneId: 'zone3', session: 2, practice: true }),
    ev({ zoneId: 'zone3', session: 2, practice: true }),
  ];
  const a = analyzeProgress(mkState(events));
  check('practice-only 2nd session does NOT satisfy the session gate', !a.evidence.hasMinimumData);
  check('evidence counts measured sessions only', a.evidence.totalSessions === 1);
}

/* ---------------- 2. topic labels + confidence ---------------- */

console.log('— Topic labels, confidence tiers —');
{
  // zone3: 6 measured events, 5 correct (83% ≥ STRONG_PCT) over 2 sessions;
  // zone1: only 2 events — must stay "insufficient" (below topic floor).
  const events = [
    ev({ zoneId: 'zone3', session: 1 }),
    ev({ zoneId: 'zone3', session: 1 }),
    ev({ zoneId: 'zone3', session: 1, isCorrect: false }),
    ev({ zoneId: 'zone3', session: 2 }),
    ev({ zoneId: 'zone3', session: 2 }),
    ev({ zoneId: 'zone3', session: 2 }),
    ev({ zoneId: 'zone1', session: 1 }),
    ev({ zoneId: 'zone1', session: 2 }),
  ];
  const a = analyzeProgress(mkState(events));
  const z3 = a.topics.find((t) => t.zoneId === 'zone3');
  const z1 = a.topics.find((t) => t.zoneId === 'zone1');
  check('8 events / 2 sessions → gate passes', a.evidence.hasMinimumData);
  check(`zone3 (5/6 ≥ ${STRONG_PCT}%) → strong`, z3?.label === 'strong');
  check('zone3 at 6 events → medium confidence (not high)', z3?.confidence === 'medium');
  check(`zone1 (${2} < ${MIN_TOPIC_EVENTS} events) → insufficient`, z1?.label === 'insufficient');
  check(
    'strength-topic finding for zone3 with evidence counts',
    a.strengths.some(
      (f) => f.id === 'strength-topic' && f.zoneId === 'zone3' && f.evidence.questions === 6,
    ),
  );
  check(
    'no finding ever references the insufficient zone1',
    allFindings(a).every((f) => f.zoneId !== 'zone1'),
  );
}
{
  // 12 events / 3 sessions, 11 correct → high confidence strong topic.
  const events = [
    ...Array.from({ length: 4 }, () => ev({ zoneId: 'zone3', session: 1 })),
    ...Array.from({ length: 4 }, () => ev({ zoneId: 'zone3', session: 2 })),
    ...Array.from({ length: 3 }, () => ev({ zoneId: 'zone3', session: 3 })),
    ev({ zoneId: 'zone3', session: 3, isCorrect: false }),
  ];
  const a = analyzeProgress(mkState(events));
  const z3 = a.topics.find((t) => t.zoneId === 'zone3');
  check('12 events / 3 sessions → high confidence', z3?.confidence === 'high');
}
{
  // 25% accuracy over the floor → needs-practice + replay recommendation.
  const events = [
    ...Array.from({ length: 4 }, (_, i) =>
      ev({ zoneId: 'zone1', session: 1, isCorrect: i === 0 }),
    ),
    ...Array.from({ length: 4 }, (_, i) =>
      ev({ zoneId: 'zone1', session: 2, isCorrect: i === 0 }),
    ),
  ];
  const a = analyzeProgress(mkState(events));
  const z1 = a.topics.find((t) => t.zoneId === 'zone1');
  check('25% topic → needs-practice label', z1?.label === 'needs-practice');
  check(
    'practice-topic finding emitted',
    a.practiceAreas.some((f) => f.id === 'practice-topic' && f.zoneId === 'zone1'),
  );
  check(
    'rec-replay-zone recommendation emitted',
    a.recommendations.some((f) => f.id === 'rec-replay-zone' && f.zoneId === 'zone1'),
  );
}

/* ---------------- 3. practice exclusion ---------------- */

console.log('— Practice replays never count against the child —');
{
  const scored = [
    ...Array.from({ length: 3 }, () => ev({ zoneId: 'zone3', session: 1 })),
    ...Array.from({ length: 2 }, () => ev({ zoneId: 'zone3', session: 2 })),
    ev({ zoneId: 'zone3', session: 2, isCorrect: false }),
    ev({ zoneId: 'zone2', session: 1 }),
    ev({ zoneId: 'zone2', session: 2 }),
  ];
  const withPractice = [
    ...scored,
    ...Array.from({ length: 10 }, () =>
      ev({ zoneId: 'zone3', session: 3, practice: true, isCorrect: false }),
    ),
  ];
  const base = analyzeProgress(mkState(scored));
  const after = analyzeProgress(mkState(withPractice));
  const b3 = base.topics.find((t) => t.zoneId === 'zone3');
  const a3 = after.topics.find((t) => t.zoneId === 'zone3');
  check(
    '10 wrong PRACTICE answers leave topic accuracy untouched',
    b3?.accuracyPct === a3?.accuracyPct && a3?.accuracyPct === 83,
  );
  check('practice attempts tracked separately', (a3?.practiceAttempts ?? 0) >= 10);
}

/* ---------------- 4. trend direction ---------------- */

console.log('— Trend: sessions over time, supportive wording —');
{
  const events = [
    ...Array.from({ length: 5 }, (_, i) => ev({ zoneId: 'zone3', session: 1, isCorrect: i < 2 })),
    ...Array.from({ length: 5 }, (_, i) => ev({ zoneId: 'zone3', session: 2, isCorrect: i < 3 })),
    ...Array.from({ length: 5 }, () => ev({ zoneId: 'zone3', session: 3, isCorrect: true })),
  ];
  const a = analyzeProgress(mkState(events));
  check('40% → 60% → 100% → improving', a.trend.direction === 'improving');
  check(
    'strength-improving finding emitted',
    a.strengths.some((f) => f.id === 'strength-improving'),
  );
}
{
  const events = [
    ...Array.from({ length: 5 }, () => ev({ zoneId: 'zone3', session: 1, isCorrect: true })),
    ...Array.from({ length: 5 }, (_, i) => ev({ zoneId: 'zone3', session: 2, isCorrect: i < 3 })),
    ...Array.from({ length: 5 }, (_, i) => ev({ zoneId: 'zone3', session: 3, isCorrect: i < 2 })),
  ];
  const a = analyzeProgress(mkState(events));
  check('100% → 60% → 40% → declining', a.trend.direction === 'declining');
  check(
    'recent-dip pattern surfaces somewhere (gently)',
    allFindings(a).some((f) => f.id === 'pattern-recent-dip'),
  );
}

/* ---------------- 5. fingerprint ---------------- */

console.log('— AI-cache fingerprint —');
{
  const events = Array.from({ length: 9 }, (_, i) =>
    ev({ zoneId: 'zone3', session: 1 + (i % 2) }),
  );
  const s1 = mkState(events);
  const f1 = insightsFingerprint(s1);
  const f1again = insightsFingerprint(mkState([...events]));
  const f2 = insightsFingerprint(mkState([...events, ev({ zoneId: 'zone2', session: 2 })]));
  check('same data → same fingerprint', f1 === f1again);
  check('new event → new fingerprint', f1 !== f2);
  check('fingerprint is versioned (v2)', f1.startsWith('v2:'));
  const s3 = { ...s1, streak: { count: 5, lastDay: null } } as typeof s1;
  check(
    'non-event AI inputs (streak) also rotate the fingerprint',
    insightsFingerprint(s3) !== f1,
  );
}

/* ---------------- 6. non-diagnostic language scan (EN + HI) ---------------- */

console.log('— Finding templates: supportive, never diagnostic (EN+HI) —');
{
  const BANNED = [
    'adhd',
    'autism',
    'disorder',
    'diagnos',
    'depression',
    'anxiety',
    'slow learner',
    'weak child',
    'dyslexia',
    'therapy',
    'intelligence',
    'mental illness',
    'मानसिक बीमारी',
    'मंदबुद्धि',
    'कमज़ोर बच्चा',
    'अवसाद',
    'विकार',
    'निदान',
  ];
  for (const lang of ['en', 'hi'] as const) {
    const t = getStrings(lang);
    const rendered = [
      t.insLabelStrong,
      t.insLabelDeveloping,
      t.insLabelNeedsPractice,
      t.insLabelInsufficient,
      t.insTrendImproving,
      t.insTrendSteady,
      t.insTrendDeclining,
      t.insTrendInsufficient,
      t.insEngagementGood,
      t.insEngagementBuilding,
      t.insEngagementLow,
      t.insFindStrengthTopic('Safe Zone', 85),
      t.insFindImproving(40, 80),
      t.insFindPersistence(75),
      t.insFindPracticeTopic('Safe Zone', 45),
      t.insFindPracticeTopicDeveloping('Safe Zone', 60),
      t.insFindRecentDip(12),
      t.insRecReplayZone('Safe Zone'),
      t.insRecContinueZone('Safe Zone'),
      t.insRecRegular,
      t.insMiniAnswered(12),
      t.insMiniStrong('Safe Zone'),
      t.insMiniPractice('Safe Zone'),
      t.insMiniKeepGoing,
      t.insMiniEmpty,
      t.insNotEnoughData,
      t.parentWhatItMeansBody === undefined ? '' : '', // (explicit negations excluded)
    ].join(' | ');
    const lower = rendered.toLowerCase();
    const hit = BANNED.find((b) => lower.includes(b));
    check(`${lang.toUpperCase()} finding/child templates carry no diagnostic terms`, hit === undefined);
  }
}

/* ---------------- 7. structural greps ---------------- */

console.log('— Structural invariants (files) —');
{
  const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');

  const engine = read('../src/quests/engine.ts');
  const flushCalls = (engine.match(/flushActivityEvents\(/g) ?? []).length;
  // finalizeQuest + finalizeLevel practice branch + finalizeLevel recorded
  // branch — the ONLY append paths; nothing flushes mid-quest.
  check('engine: exactly 3 flush call sites (finalize paths only)', flushCalls === 3);

  check('types: activity log hard cap is 400', MAX_ACTIVITY_EVENTS === 400);

  const gate = read('../src/insights/adultGate.ts');
  check('adultGate: PIN is salted + SHA-256 hashed', gate.includes('SHA-256'));
  check(
    'adultGate: never stores the raw PIN',
    !/setItem\([^)]*,\s*pin\s*\)/.test(gate),
  );

  const report = read('../src/pages/adults/InsightsReport.tsx');
  const missing = Array.from({ length: 14 }, (_, i) => `reportS${i + 1}`).filter(
    (k) => !report.includes(k),
  );
  check(`report: all 14 spec sections present${missing.length ? ` (missing ${missing.join(',')})` : ''}`, missing.length === 0);

  const app = read('../src/App.tsx');
  check(
    'routes: /adults + teacher/parent/report registered',
    ['"/adults"', '"/adults/teacher"', '"/adults/parent"', '"/adults/report"'].every((r) =>
      app.includes(r),
    ),
  );

  const openapi = read('../../../lib/api-spec/openapi.yaml');
  check('openapi: /insights/analyze path defined', openapi.includes('/insights/analyze'));

  const serverIndex = read('../../api-server/src/routes/index.ts');
  check('api-server: insights router registered', serverIndex.includes('insights'));

  const filter = read('../../api-server/src/routes/insights/filter.ts');
  check(
    'api-server filter: EN word-boundary + HI substring lists exist',
    filter.includes('\\b') && filter.includes('मानसिक बीमारी'),
  );

  const insightsRoute = read('../../api-server/src/routes/insights/index.ts');
  check(
    'api-server route: server-side minimum-evidence gate present',
    insightsRoute.includes('questionsAnswered') && insightsRoute.includes('sessions'),
  );

  const hook = read('../src/insights/useInsightsData.ts');
  check(
    'client hook: AI narrative cached by fingerprint (batch, not per click)',
    hook.includes('aiCache') && hook.includes('fingerprint'),
  );
}

if (failures > 0) {
  console.error(`\n${failures} insights smoke check(s) FAILED`);
  process.exit(1);
}
console.log('\nAll insights smoke checks passed.');
