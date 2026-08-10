/**
 * Shared data hook for the adult insights pages (teacher / parent / report).
 *
 * - Deterministic layer: subscribes to the progress store and re-runs the
 *   pure analyzer — always available, works fully offline.
 * - AI narrative layer (spec §18 batching): ONE server call per data
 *   fingerprint + language + audience, cached inside the progress store's
 *   insightsMeta. Dashboards call refresh() automatically only when the
 *   fingerprint changed; a manual refresh button re-uses the same guard.
 *   The AI narrative is decoration on top of the deterministic stats —
 *   its absence never hides any insight.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  insightsAnalyze,
  type InsightsAnalyzeInput,
  type InsightsAnalyzeReply,
} from '@workspace/api-client-react';
import { progressStore } from '@/data/progressStore';
import type { Language } from '@/data/settingsStore';
import { analyzeProgress, type LearningAnalysis } from './analyzer';
import { insightsFingerprint } from './track';

export type InsightsAudience = 'teacher' | 'parent';

/** Compact anonymous aggregates — the ONLY thing the AI route receives. */
export function buildAnalyzeInput(
  analysis: LearningAnalysis,
  language: Language,
  audience: InsightsAudience,
): InsightsAnalyzeInput {
  const o = analysis.overall;
  const e = analysis.evidence;
  return {
    language,
    audience,
    totals: {
      questionsAnswered: e.totalMeasured,
      sessions: e.totalSessions,
      activeDays: e.activeDays,
      ...(o.accuracyPct !== null ? { accuracyPct: o.accuracyPct } : {}),
      timeSpentMinutes: Math.min(100000, Math.round(o.timeSpentMs / 60000)),
      zonesCompleted: o.zonesCompleted,
      zonesTotal: o.zonesTotal,
      levelsDone: Math.min(1000, o.levelsDone),
      badges: Math.min(99, o.badges),
      practiceReplays: Math.min(100000, o.practiceReplays),
      streakDays: Math.min(10000, o.streakDays),
    },
    topics: analysis.topics
      .filter((t) => t.attempts > 0 || t.practiceAttempts > 0)
      .slice(0, 10)
      .map((t) => ({
        zoneId: t.zoneId,
        attempts: t.attempts,
        ...(t.accuracyPct !== null ? { accuracyPct: t.accuracyPct } : {}),
        label: t.label,
        practiceAttempts: t.practiceAttempts,
        sessions: t.sessions,
        ...(t.trendDeltaPct !== null ? { trendDeltaPct: t.trendDeltaPct } : {}),
      })),
    trendSeries: analysis.trend.points.slice(-12).map((p) => ({
      session: p.session,
      accuracyPct: p.accuracyPct,
      attempts: Math.min(1000, p.attempts),
    })),
    trendDirection: analysis.trend.direction,
    behavior: {
      recapCount: Math.min(100000, analysis.behavior.recapParticipation),
      ...(analysis.behavior.continuesAfterIncorrectPct !== null
        ? { continuesAfterIncorrectPct: analysis.behavior.continuesAfterIncorrectPct }
        : {}),
      engagement: analysis.behavior.engagement,
    },
  };
}

export interface AiNarrative {
  data: InsightsAnalyzeReply | null;
  generatedAt: number | null;
  loading: boolean;
  error: 'unavailable' | 'error' | null;
  /** True when there is enough data but no cache for the current state. */
  stale: boolean;
  refresh: () => void;
}

/** Cross-instance guard: never two identical in-flight AI calls. */
let inflightKey: string | null = null;

export function useInsightsData(audience: InsightsAudience, language: Language) {
  const [progress, setProgress] = useState(() => progressStore.getState());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<'unavailable' | 'error' | null>(null);
  useEffect(() => progressStore.subscribe(setProgress), []);

  const fingerprint = insightsFingerprint(progress);
  const analysis = useMemo(() => analyzeProgress(progress), [progress]);

  const cacheKey = `${language}:${audience}`;
  const cache = progress.insightsMeta.aiCache[cacheKey] ?? null;
  const cacheValid = cache !== null && cache.fingerprint === fingerprint;
  const aiData = cacheValid ? (cache.data as InsightsAnalyzeReply) : null;
  const stale = analysis.evidence.hasMinimumData && !cacheValid;

  const refresh = useCallback(() => {
    const key = `${fingerprint}:${language}:${audience}`;
    if (inflightKey === key || !analysis.evidence.hasMinimumData) return;
    inflightKey = key;
    setLoading(true);
    setError(null);
    insightsAnalyze(buildAnalyzeInput(analysis, language, audience))
      .then((reply) => {
        const s = progressStore.getState();
        progressStore.update({
          insightsMeta: {
            ...s.insightsMeta,
            aiCache: {
              ...s.insightsMeta.aiCache,
              [cacheKey]: { fingerprint, generatedAt: Date.now(), data: reply },
            },
          },
        });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        setError(/503/.test(msg) ? 'unavailable' : 'error');
      })
      .finally(() => {
        if (inflightKey === key) inflightKey = null;
        setLoading(false);
      });
  }, [analysis, audience, fingerprint, language]);

  // Batch trigger: once per page visit, and only when the data changed
  // since the cached narrative was generated (spec §18 — never per click).
  const autoTried = useRef(false);
  useEffect(() => {
    if (autoTried.current || !stale || loading) return;
    autoTried.current = true;
    refresh();
  }, [stale, loading, refresh]);

  const ai: AiNarrative = {
    data: aiData,
    generatedAt: cacheValid ? cache.generatedAt : null,
    loading,
    error,
    stale,
    refresh,
  };

  return { progress, analysis, fingerprint, ai };
}
