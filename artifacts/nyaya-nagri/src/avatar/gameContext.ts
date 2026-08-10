/**
 * Nyaya AI — safe game-context builder (PRD §9 data minimization).
 *
 * Collects ONLY what the assistant may know about the player:
 *   - stable zone IDS (mapped to display names server-side, single source),
 *   - counts (progress %, badges) instead of free-text lists,
 *   - the fun game nickname (avatarConfig guarantees it is never a real
 *     name) and the current quest title (app content, not user text).
 *
 * Never included: real names, contact details, quiz answers, coins/XP
 * balances, or anything not needed to personalize an educational answer.
 */
import { progressStore, type ProgressState } from '@/data/progressStore';
import { settingsStore } from '@/data/settingsStore';
import { uiStore } from '@/ui/uiStore';
import { ZONES } from '@/world/zones';
import { resolveQuest } from '@/quests/registry';
import { analyzeProgress } from '@/insights/analyzer';
import { insightsFingerprint } from '@/insights/track';

export interface NyayaAiGameContext {
  nickname?: string;
  currentZoneId?: string;
  nearbyZoneId?: string;
  completedZoneIds?: string[];
  progressPct?: number;
  badgeCount?: number;
  currentLessonTitle?: string;
  currentLevelNumber?: number;
  learnQuestionsAnswered?: number;
  learnAccuracyPct?: number;
  learnTrend?: 'improving' | 'steady' | 'declining';
  strongZoneId?: string;
  practiceZoneId?: string;
}

/**
 * Learning stats for "How am I doing?" questions — computed by the SAME
 * deterministic analyzer as the dashboards (single source of truth) and
 * memoized by activity fingerprint so chat sends stay cheap. Accuracy,
 * trend, and zone picks are only included once the analyzer's
 * minimum-evidence gate passes (patterns over time, never single events).
 */
type LearnStats = Pick<
  NyayaAiGameContext,
  | 'learnQuestionsAnswered'
  | 'learnAccuracyPct'
  | 'learnTrend'
  | 'strongZoneId'
  | 'practiceZoneId'
>;
let learnCache: { fp: string; stats: LearnStats } | null = null;

function buildLearnStats(p: ProgressState): LearnStats {
  const fp = insightsFingerprint(p);
  if (learnCache && learnCache.fp === fp) return learnCache.stats;

  const analysis = analyzeProgress(p);
  const stats: LearnStats = {};
  if (analysis.evidence.totalMeasured > 0) {
    stats.learnQuestionsAnswered = analysis.evidence.totalMeasured;
  }
  if (analysis.evidence.hasMinimumData) {
    if (analysis.overall.accuracyPct !== null) {
      stats.learnAccuracyPct = analysis.overall.accuracyPct;
    }
    if (analysis.trend.direction !== 'insufficient') {
      stats.learnTrend = analysis.trend.direction;
    }
    const strong = analysis.strengths.find((s) => s.id === 'strength-topic');
    if (strong?.zoneId) stats.strongZoneId = strong.zoneId;
    const practice = analysis.recommendations.find((r) => r.id === 'rec-replay-zone');
    if (practice?.zoneId) stats.practiceZoneId = practice.zoneId;
  }
  learnCache = { fp, stats };
  return stats;
}

export function buildGameContext(): NyayaAiGameContext {
  const p = progressStore.getState();
  const ui = uiStore.getState();

  const completedZoneIds = Object.keys(p.completedZones)
    .filter((z) => p.completedZones[z])
    .slice(0, 8);
  const badgeCount = Object.values(p.badges).filter(Boolean).length;
  const progressPct = Math.min(
    100,
    Math.round((completedZoneIds.length / ZONES.length) * 100),
  );

  let currentLessonTitle: string | undefined;
  let currentLevelNumber: number | undefined;
  if (ui.activeLevel) {
    try {
      const quest = resolveQuest(
        ui.activeLevel.zoneId,
        p.ageBand,
        settingsStore.getState().language,
      );
      currentLessonTitle = quest?.title?.slice(0, 120) || undefined;
      currentLevelNumber = ui.activeLevel.levelIndex + 1;
    } catch {
      // Lesson context is best-effort — never block a chat on quest lookup.
    }
  }

  return {
    nickname: p.avatar?.nickname?.trim().slice(0, 24) || undefined,
    currentZoneId: ui.activeZoneId || undefined,
    nearbyZoneId: ui.nearbyZoneId || undefined,
    completedZoneIds: completedZoneIds.length > 0 ? completedZoneIds : undefined,
    progressPct,
    badgeCount,
    currentLessonTitle,
    currentLevelNumber,
    ...buildLearnStats(p),
  };
}
