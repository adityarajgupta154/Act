/**
 * Learning & Development Insights — deterministic analysis engine.
 *
 * PURE functions over the consent-gated progress state. This layer alone
 * decides labels, trends, confidence, and recommendations — the optional AI
 * narrative (server route) only rephrases what this layer computed, so a
 * child is never assessed by a language model.
 *
 * SAFETY RULES (task spec + PRD §9):
 *   - patterns over time, never single events (minimum-evidence gates);
 *   - game-based learning indicators only — NEVER psychological, medical,
 *     psychiatric, personality, or intelligence judgements;
 *   - insufficient data is stated as exactly that, at LOW confidence;
 *   - findings carry ids + params — display text lives in the i18n bundles
 *     (EN + HI, compile-time completeness), never generated here.
 */

import type { ProgressState } from '@/data/progressStore';
import { ZONES } from '@/world/zones';
import type { ActivityEvent } from './types';

/* ------------------------------------------------------------------ */
/* Minimum-evidence gates (spec: DO NOT ANALYZE SINGLE EVENTS)          */
/* ------------------------------------------------------------------ */

export const MIN_TOPIC_EVENTS = 6;
export const MIN_TOPIC_SESSIONS = 2;
export const MIN_OVERALL_EVENTS = 8;
export const MIN_OVERALL_SESSIONS = 2;

/** Confidence tiers (spec: AI CONFIDENCE) — evidence-derived. */
export const HIGH_EVIDENCE = { events: 12, sessions: 3 };
export const MEDIUM_EVIDENCE = { events: MIN_TOPIC_EVENTS, sessions: MIN_TOPIC_SESSIONS };

export type Confidence = 'high' | 'medium' | 'low';
export type TopicLabel = 'strong' | 'developing' | 'needs-practice' | 'insufficient';
export type TrendDirection = 'improving' | 'steady' | 'declining' | 'insufficient';
export type Engagement = 'good' | 'building' | 'low';

/** Label thresholds ("Strong" / "Developing" / "Needs Practice"). */
export const STRONG_PCT = 80;
export const DEVELOPING_PCT = 55;
/** Trend must move at least this much to leave "steady". */
export const TREND_DELTA_PCT = 8;

export interface TopicStat {
  zoneId: string;
  /** Recorded (non-practice) measured events. */
  attempts: number;
  correct: number;
  accuracyPct: number | null;
  avgResponseMs: number | null;
  /** Practice-run events in this topic (persistence signal). */
  practiceAttempts: number;
  /** Adaptive-recap answers in this topic (guided-revisit signal). */
  recapCount: number;
  sessions: number;
  /** Recent-half accuracy minus first-half accuracy (needs evidence). */
  trendDeltaPct: number | null;
  label: TopicLabel;
  confidence: Confidence;
  levelsDone: number;
  zoneCompleted: boolean;
}

export interface TrendPoint {
  session: number;
  accuracyPct: number;
  attempts: number;
}

/**
 * One insight finding. `id` selects the i18n template; params fill it.
 * Every finding carries its evidence counts so the UI can always answer
 * "why?" ("Observed across N questions over M sessions").
 */
export interface InsightFinding {
  id: string;
  zoneId?: string;
  params: Record<string, number>;
  confidence: Confidence;
  evidence: { questions: number; sessions: number };
}

export interface LearningAnalysis {
  evidence: {
    totalMeasured: number;
    totalEvents: number;
    totalSessions: number;
    activeDays: number;
    hasMinimumData: boolean;
  };
  overall: {
    progressPct: number;
    zonesCompleted: number;
    zonesTotal: number;
    levelsDone: number;
    accuracyPct: number | null;
    avgResponseMs: number | null;
    badges: number;
    certificates: number;
    streakDays: number;
    timeSpentMs: number;
    practiceReplays: number;
  };
  topics: TopicStat[];
  trend: {
    points: TrendPoint[];
    direction: TrendDirection;
    deltaPct: number | null;
    firstPct: number | null;
    lastPct: number | null;
  };
  behavior: {
    recapParticipation: number;
    practiceReplays: number;
    /** % of wrong answers followed by continuing in the same session. */
    continuesAfterIncorrectPct: number | null;
    incorrectSampleSize: number;
    engagement: Engagement;
    hintsUsed: 0;
  };
  social: {
    /** Story-decision accuracy (fairness/empathy/cooperation scenarios). */
    scenarioAttempts: number;
    scenarioAccuracyPct: number | null;
  };
  strengths: InsightFinding[];
  practiceAreas: InsightFinding[];
  recommendations: InsightFinding[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const pct = (num: number, den: number): number | null =>
  den > 0 ? Math.round((num / den) * 100) : null;

function confidenceFor(events: number, sessions: number): Confidence {
  if (events >= HIGH_EVIDENCE.events && sessions >= HIGH_EVIDENCE.sessions) return 'high';
  if (events >= MEDIUM_EVIDENCE.events && sessions >= MEDIUM_EVIDENCE.sessions) return 'medium';
  return 'low';
}

/** Measured events = non-practice learning measurements. */
const isMeasured = (e: ActivityEvent): boolean => !e.practice;

function distinct<T>(values: T[]): number {
  return new Set(values).size;
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/* ------------------------------------------------------------------ */
/* Analysis                                                            */
/* ------------------------------------------------------------------ */

export function analyzeProgress(state: ProgressState): LearningAnalysis {
  const log = state.activityLog;
  const measured = log.filter(isMeasured);
  // Sessions are counted from MEASURED events only — practice-only sessions
  // must not satisfy the "pattern across sessions" evidence gate (otherwise
  // 8 scored answers in ONE sitting + a later replay would unlock an
  // overall judgement drawn from a single measured session).
  const totalSessions = distinct(measured.map((e) => e.session));
  const activeDays = distinct(log.map((e) => dayKey(e.timestamp)));
  const hasMinimumData =
    measured.length >= MIN_OVERALL_EVENTS && totalSessions >= MIN_OVERALL_SESSIONS;

  const zonesCompleted = Object.values(state.completedZones).filter(Boolean).length;
  const levelsDone = Object.values(state.levelProgress).filter(Boolean).length;
  const practiceReplays = Object.values(state.replayCounts).reduce((a, b) => a + b, 0);

  /* ---- per-topic (zone) stats ---- */
  const topics: TopicStat[] = ZONES.map((zone) => {
    const zoneEvents = log.filter((e) => e.topic === zone.id);
    const zoneMeasured = zoneEvents.filter(isMeasured);
    const correct = zoneMeasured.filter((e) => e.isCorrect).length;
    const sessions = distinct(zoneMeasured.map((e) => e.session));
    const accuracyPct = pct(correct, zoneMeasured.length);
    const enoughEvidence =
      zoneMeasured.length >= MIN_TOPIC_EVENTS && sessions >= MIN_TOPIC_SESSIONS;

    let trendDeltaPct: number | null = null;
    if (enoughEvidence && zoneMeasured.length >= MIN_TOPIC_EVENTS) {
      const half = Math.floor(zoneMeasured.length / 2);
      const firstPct = pct(
        zoneMeasured.slice(0, half).filter((e) => e.isCorrect).length,
        half,
      );
      const lastPct = pct(
        zoneMeasured.slice(half).filter((e) => e.isCorrect).length,
        zoneMeasured.length - half,
      );
      if (firstPct !== null && lastPct !== null) trendDeltaPct = lastPct - firstPct;
    }

    const label: TopicLabel = !enoughEvidence
      ? 'insufficient'
      : (accuracyPct ?? 0) >= STRONG_PCT
        ? 'strong'
        : (accuracyPct ?? 0) >= DEVELOPING_PCT
          ? 'developing'
          : 'needs-practice';

    const responseTimes = zoneMeasured.map((e) => e.responseTime).filter((t) => t > 0);
    return {
      zoneId: zone.id,
      attempts: zoneMeasured.length,
      correct,
      accuracyPct,
      avgResponseMs:
        responseTimes.length > 0
          ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
          : null,
      practiceAttempts: zoneEvents.length - zoneMeasured.length,
      recapCount: zoneEvents.filter((e) => e.kind === 'recap').length,
      sessions,
      trendDeltaPct,
      label,
      confidence: confidenceFor(zoneMeasured.length, sessions),
      levelsDone: Object.keys(state.levelProgress).filter(
        (k) => k.startsWith(`${zone.id}:`) && state.levelProgress[k],
      ).length,
      zoneCompleted: !!state.completedZones[zone.id],
    };
  });

  /* ---- overall improvement timeline (session-bucketed accuracy) ---- */
  const bySession = new Map<number, ActivityEvent[]>();
  for (const e of measured) {
    const list = bySession.get(e.session) ?? [];
    list.push(e);
    bySession.set(e.session, list);
  }
  const points: TrendPoint[] = [...bySession.entries()]
    .filter(([, events]) => events.length >= 3) // no single-event points
    .sort(([a], [b]) => a - b)
    .map(([session, events]) => ({
      session,
      accuracyPct: pct(events.filter((e) => e.isCorrect).length, events.length) ?? 0,
      attempts: events.length,
    }));

  let direction: TrendDirection = 'insufficient';
  let deltaPct: number | null = null;
  const firstPct = points[0]?.accuracyPct ?? null;
  const lastPct = points[points.length - 1]?.accuracyPct ?? null;
  if (hasMinimumData && points.length >= 2 && firstPct !== null && lastPct !== null) {
    deltaPct = lastPct - firstPct;
    direction =
      deltaPct >= TREND_DELTA_PCT
        ? 'improving'
        : deltaPct <= -TREND_DELTA_PCT
          ? 'declining'
          : 'steady';
  }

  /* ---- behavior / self-regulation signals ---- */
  const incorrect = measured.filter((e) => !e.isCorrect);
  let continued = 0;
  for (const e of incorrect) {
    const idx = log.indexOf(e);
    const next = log[idx + 1];
    if (next && next.session === e.session) continued += 1;
  }
  const continuesAfterIncorrectPct =
    incorrect.length >= 3 ? pct(continued, incorrect.length) : null;

  const engagement: Engagement =
    (totalSessions >= 3 && measured.length >= 15) || state.streak.count >= 3
      ? 'good'
      : measured.length >= MIN_OVERALL_EVENTS
        ? 'building'
        : 'low';

  /* ---- social / community scenario signal ---- */
  const scenario = measured.filter((e) => e.kind === 'scene-choice');
  const scenarioAccuracyPct =
    scenario.length >= MIN_TOPIC_EVENTS
      ? pct(scenario.filter((e) => e.isCorrect).length, scenario.length)
      : null;

  /* ---- findings (deterministic, template ids only) ---- */
  const strengths: InsightFinding[] = [];
  const practiceAreas: InsightFinding[] = [];
  const recommendations: InsightFinding[] = [];

  const evidenced = topics.filter((t) => t.label !== 'insufficient');
  const strongTopics = evidenced
    .filter((t) => t.label === 'strong')
    .sort((a, b) => (b.accuracyPct ?? 0) - (a.accuracyPct ?? 0));
  const weakTopics = evidenced
    .filter((t) => t.label !== 'strong')
    .sort((a, b) => (a.accuracyPct ?? 0) - (b.accuracyPct ?? 0));

  for (const t of strongTopics.slice(0, 2)) {
    strengths.push({
      id: 'strength-topic',
      zoneId: t.zoneId,
      params: { accuracyPct: t.accuracyPct ?? 0 },
      confidence: t.confidence,
      evidence: { questions: t.attempts, sessions: t.sessions },
    });
  }
  if (direction === 'improving' && firstPct !== null && lastPct !== null) {
    strengths.push({
      id: 'strength-improving',
      params: { fromPct: firstPct, toPct: lastPct },
      confidence: confidenceFor(measured.length, totalSessions),
      evidence: { questions: measured.length, sessions: totalSessions },
    });
  }
  if (
    continuesAfterIncorrectPct !== null &&
    continuesAfterIncorrectPct >= 70 &&
    incorrect.length >= 5
  ) {
    strengths.push({
      id: 'strength-persistence',
      params: { continuePct: continuesAfterIncorrectPct },
      confidence: confidenceFor(incorrect.length, totalSessions),
      evidence: { questions: incorrect.length, sessions: totalSessions },
    });
  }

  for (const t of weakTopics.slice(0, 2)) {
    practiceAreas.push({
      id: t.label === 'needs-practice' ? 'practice-topic' : 'practice-topic-developing',
      zoneId: t.zoneId,
      params: { accuracyPct: t.accuracyPct ?? 0 },
      confidence: t.confidence,
      evidence: { questions: t.attempts, sessions: t.sessions },
    });
  }
  if (direction === 'declining' && deltaPct !== null) {
    practiceAreas.push({
      id: 'pattern-recent-dip',
      params: { deltaPct: Math.abs(deltaPct) },
      confidence: confidenceFor(measured.length, totalSessions),
      evidence: { questions: measured.length, sessions: totalSessions },
    });
  }

  // Recommendations: practice the weakest evidenced topic, then continue
  // the journey, then a gentle regularity nudge. Max 3, all deterministic.
  const weakest = weakTopics[0];
  if (weakest) {
    recommendations.push({
      id: 'rec-replay-zone',
      zoneId: weakest.zoneId,
      params: {},
      confidence: weakest.confidence,
      evidence: { questions: weakest.attempts, sessions: weakest.sessions },
    });
  }
  const nextZone = ZONES.find((z) => !state.completedZones[z.id]);
  if (nextZone) {
    recommendations.push({
      id: 'rec-continue-zone',
      zoneId: nextZone.id,
      params: {},
      confidence: 'high', // pure progress fact, not an inference
      evidence: { questions: measured.length, sessions: totalSessions },
    });
  }
  if (engagement !== 'good' && recommendations.length < 3) {
    recommendations.push({
      id: 'rec-regular-practice',
      params: {},
      confidence: 'medium',
      evidence: { questions: measured.length, sessions: totalSessions },
    });
  }

  const overallResponseTimes = measured.map((e) => e.responseTime).filter((t) => t > 0);
  return {
    evidence: {
      totalMeasured: measured.length,
      totalEvents: log.length,
      totalSessions,
      activeDays,
      hasMinimumData,
    },
    overall: {
      progressPct: Math.min(100, Math.round((zonesCompleted / ZONES.length) * 100)),
      zonesCompleted,
      zonesTotal: ZONES.length,
      levelsDone,
      accuracyPct: hasMinimumData
        ? pct(measured.filter((e) => e.isCorrect).length, measured.length)
        : null,
      avgResponseMs:
        overallResponseTimes.length > 0
          ? Math.round(
              overallResponseTimes.reduce((a, b) => a + b, 0) / overallResponseTimes.length,
            )
          : null,
      badges: Object.values(state.badges).filter(Boolean).length,
      certificates: Object.values(state.certificates).length,
      streakDays: state.streak.count,
      timeSpentMs: state.insightsMeta.timeSpentMs,
      practiceReplays,
    },
    topics,
    trend: { points, direction, deltaPct, firstPct, lastPct },
    behavior: {
      recapParticipation: log.filter((e) => e.kind === 'recap').length,
      practiceReplays,
      continuesAfterIncorrectPct,
      incorrectSampleSize: incorrect.length,
      engagement,
      hintsUsed: 0,
    },
    social: {
      scenarioAttempts: scenario.length,
      scenarioAccuracyPct,
    },
    strengths: strengths.slice(0, 3),
    practiceAreas: practiceAreas.slice(0, 3),
    recommendations: recommendations.slice(0, 3),
  };
}
