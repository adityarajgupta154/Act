/**
 * Shared building blocks for the adult insights pages (hub, teacher,
 * parent, report): the session guard, the page shell, label/confidence
 * badges, deterministic finding rendering, and the AI narrative panel.
 *
 * All display text comes from the i18n bundles (EN+HI compile-checked);
 * finding TEMPLATES are chosen here from the analyzer's stable ids.
 */
import type { ReactNode } from 'react';
import { Link, Redirect, useLocation } from 'wouter';
import { ArrowLeft, Lock, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UIStrings } from '@/i18n/strings';
import type {
  Confidence,
  InsightFinding,
  TopicLabel,
  TrendDirection,
} from '@/insights/analyzer';
import { isUnlocked, lockNow } from '@/insights/adultGate';
import type { AiNarrative } from '@/insights/useInsightsData';

export function zoneNameFor(t: UIStrings, zoneId: string | undefined): string {
  if (!zoneId) return '';
  return t.zones[zoneId]?.name ?? zoneId;
}

/** Route guard: the adult area needs a PIN unlock for this browser session. */
export function RequireAdult({ children }: { children: ReactNode }) {
  if (!isUnlocked()) return <Redirect to="/adults" replace />;
  return <>{children}</>;
}

/** Common page chrome for the adult pages. */
export function AdultShell({
  t,
  title,
  subtitle,
  backTo,
  children,
}: {
  t: UIStrings;
  title: string;
  subtitle?: string;
  backTo?: 'hub';
  children: ReactNode;
}) {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
        <header className="flex items-start justify-between gap-3 mb-6 print:hidden">
          <div className="min-w-0">
            {backTo === 'hub' ? (
              <Link
                href="/adults"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 mb-2"
              >
                <ArrowLeft className="w-4 h-4" /> {t.adultBackToHub}
              </Link>
            ) : (
              <a
                href={import.meta.env.BASE_URL}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 mb-2"
              >
                <ArrowLeft className="w-4 h-4" /> {t.adultBackToGame}
              </a>
            )}
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-500 font-medium mt-1 max-w-2xl">{subtitle}</p>
            )}
          </div>
          <button
            onClick={() => {
              lockNow();
              navigate('/adults');
            }}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full border-2 border-slate-200 bg-white text-sm font-bold text-slate-600 hover:border-slate-400 touch-manipulation"
          >
            <Lock className="w-4 h-4" /> {t.adultLock}
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  sub,
  children,
  className,
}: {
  title?: string;
  sub?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'bg-white rounded-3xl border-2 border-slate-100 p-5 md:p-6 mb-4',
        className,
      )}
    >
      {title && <h2 className="font-extrabold text-slate-700 text-lg leading-tight">{title}</h2>}
      {sub && <p className="text-sm text-slate-500 font-medium mt-1 mb-3">{sub}</p>}
      {!sub && title && <div className="mb-3" />}
      {children}
    </section>
  );
}

export const LABEL_COLORS: Record<TopicLabel, string> = {
  strong: '#10b981',
  developing: '#f59e0b',
  'needs-practice': '#f97316',
  insufficient: '#cbd5e1',
};

export function labelText(t: UIStrings, label: TopicLabel): string {
  switch (label) {
    case 'strong':
      return t.insLabelStrong;
    case 'developing':
      return t.insLabelDeveloping;
    case 'needs-practice':
      return t.insLabelNeedsPractice;
    default:
      return t.insLabelInsufficient;
  }
}

export function trendText(t: UIStrings, direction: TrendDirection): string {
  switch (direction) {
    case 'improving':
      return t.insTrendImproving;
    case 'steady':
      return t.insTrendSteady;
    case 'declining':
      return t.insTrendDeclining;
    default:
      return t.insTrendInsufficient;
  }
}

export function LabelBadge({ t, label }: { t: UIStrings; label: TopicLabel }) {
  return (
    <span
      className={cn(
        'inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border',
        label === 'strong' && 'bg-emerald-50 border-emerald-200 text-emerald-700',
        label === 'developing' && 'bg-amber-50 border-amber-200 text-amber-700',
        label === 'needs-practice' && 'bg-orange-50 border-orange-200 text-orange-700',
        label === 'insufficient' && 'bg-slate-50 border-slate-200 text-slate-500',
      )}
    >
      {labelText(t, label)}
    </span>
  );
}

export function confidenceText(t: UIStrings, c: Confidence): string {
  return c === 'high'
    ? t.insConfidenceHigh
    : c === 'medium'
      ? t.insConfidenceMedium
      : t.insConfidenceLow;
}

export function ConfidenceBadge({ t, confidence }: { t: UIStrings; confidence: Confidence }) {
  return (
    <span
      className={cn(
        'inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border',
        confidence === 'high' && 'bg-emerald-50 border-emerald-200 text-emerald-700',
        confidence === 'medium' && 'bg-amber-50 border-amber-200 text-amber-700',
        confidence === 'low' && 'bg-slate-50 border-slate-200 text-slate-500',
      )}
    >
      {t.insConfidence}: {confidenceText(t, confidence)}
    </span>
  );
}

/** Render a deterministic finding via its i18n template. */
export function findingText(t: UIStrings, f: InsightFinding): string {
  const zone = zoneNameFor(t, f.zoneId);
  switch (f.id) {
    case 'strength-topic':
      return t.insFindStrengthTopic(zone, f.params.accuracyPct ?? 0);
    case 'strength-improving':
      return t.insFindImproving(f.params.fromPct ?? 0, f.params.toPct ?? 0);
    case 'strength-persistence':
      return t.insFindPersistence(f.params.continuePct ?? 0);
    case 'practice-topic':
      return t.insFindPracticeTopic(zone, f.params.accuracyPct ?? 0);
    case 'practice-topic-developing':
      return t.insFindPracticeTopicDeveloping(zone, f.params.accuracyPct ?? 0);
    case 'pattern-recent-dip':
      return t.insFindRecentDip(f.params.deltaPct ?? 0);
    case 'rec-replay-zone':
      return t.insRecReplayZone(zone);
    case 'rec-continue-zone':
      return t.insRecContinueZone(zone);
    case 'rec-regular-practice':
      return t.insRecRegular;
    default:
      return '';
  }
}

/** Bullet list of findings, each with its evidence line (traceability). */
export function FindingList({ t, findings }: { t: UIStrings; findings: InsightFinding[] }) {
  return (
    <ul className="space-y-3">
      {findings.map((f, i) => (
        <li key={`${f.id}-${f.zoneId ?? i}`} className="flex gap-2.5">
          <span className="mt-1.5 w-2 h-2 rounded-full bg-slate-300 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-slate-700 leading-snug">{findingText(t, f)}</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {t.insEvidenceLine(f.evidence.questions, f.evidence.sessions)} ·{' '}
              {t.insConfidence.toLowerCase()}: {confidenceText(t, f.confidence).toLowerCase()}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** AI narrative panel — batch-generated, cached, filtered server-side. */
export function AiPanel({ t, ai }: { t: UIStrings; ai: AiNarrative }) {
  const d = ai.data;
  return (
    <SectionCard>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <h2 className="font-extrabold text-slate-700 text-lg inline-flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" /> {t.insAiTitle}
        </h2>
        <button
          onClick={ai.refresh}
          disabled={ai.loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-indigo-200 bg-indigo-50 text-sm font-bold text-indigo-600 hover:border-indigo-400 disabled:opacity-50 touch-manipulation print:hidden"
        >
          <RefreshCw className={cn('w-4 h-4', ai.loading && 'animate-spin')} />
          {t.insAiRefresh}
        </button>
      </div>
      <p className="text-sm text-slate-500 font-medium mb-1">{t.insAiSub}</p>
      <p className="text-xs text-slate-400 font-medium mb-4">{t.insAiCachedNote}</p>

      {ai.loading && <p className="text-slate-500 font-medium animate-pulse">{t.insAiLoading}</p>}
      {!ai.loading && ai.error === 'unavailable' && (
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4 font-medium text-sm">
          {t.insAiUnavailable}
        </p>
      )}
      {!ai.loading && ai.error === 'error' && (
        <p className="text-orange-700 bg-orange-50 border border-orange-200 rounded-xl p-4 font-medium text-sm">
          {t.insAiError}
        </p>
      )}
      {!ai.loading && !ai.error && !d && (
        <p className="text-slate-500 font-medium text-sm">{t.insAiEmpty}</p>
      )}

      {d && !ai.loading && (
        <div className="space-y-4">
          {d.filtered && (
            <p className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              {t.insAiFilteredNote}
            </p>
          )}
          {d.strengths.length > 0 && (
            <AiItemGroup t={t} heading={t.insAiStrengths} items={d.strengths} tone="emerald" />
          )}
          {d.practiceAreas.length > 0 && (
            <AiItemGroup t={t} heading={t.insAiPractice} items={d.practiceAreas} tone="amber" />
          )}
          {d.trendComment && (
            <div>
              <h3 className="text-sm font-extrabold text-slate-600 mb-1">{t.insAiTrendLabel}</h3>
              <p className="text-slate-700 font-medium leading-snug">{d.trendComment}</p>
            </div>
          )}
          {d.recommendations.length > 0 && (
            <AiItemGroup
              t={t}
              heading={t.insAiRecommendations}
              items={d.recommendations}
              tone="indigo"
            />
          )}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <h3 className="text-sm font-extrabold text-indigo-600 mb-1">
              {t.insAiEncouragementLabel}
            </h3>
            <p className="text-slate-700 font-medium leading-snug">{d.encouragement}</p>
          </div>
          <p className="text-xs text-slate-400 font-medium leading-relaxed border-t border-slate-100 pt-3">
            {d.disclaimer}
          </p>
        </div>
      )}
    </SectionCard>
  );
}

function AiItemGroup({
  t,
  heading,
  items,
  tone,
}: {
  t: UIStrings;
  heading: string;
  items: { text: string; zoneId?: string }[];
  tone: 'emerald' | 'amber' | 'indigo';
}) {
  return (
    <div>
      <h3 className="text-sm font-extrabold text-slate-600 mb-1.5">{heading}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5">
            <span
              className={cn(
                'mt-1.5 w-2 h-2 rounded-full shrink-0',
                tone === 'emerald' && 'bg-emerald-400',
                tone === 'amber' && 'bg-amber-400',
                tone === 'indigo' && 'bg-indigo-400',
              )}
            />
            <p className="font-medium text-slate-700 leading-snug min-w-0">
              {item.zoneId && (
                <span className="font-extrabold">{zoneNameFor(t, item.zoneId)}: </span>
              )}
              {item.text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Small labelled stat tile for the overview grids. */
export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-3.5">
      <p className="text-xs font-bold text-slate-400 leading-tight">{label}</p>
      <p className="text-lg font-extrabold text-slate-700 mt-0.5 leading-tight">{value}</p>
    </div>
  );
}
