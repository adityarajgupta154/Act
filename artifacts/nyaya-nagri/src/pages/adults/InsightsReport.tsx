/**
 * Detailed learning report — the spec's 14 sections, in order:
 * 1 Student Overview · 2 Learning Summary · 3 Zone Progress · 4 Question
 * Performance · 5 Topic Performance · 6 Strengths · 7 Areas for Practice ·
 * 8 Improvement Timeline · 9 Engagement Summary · 10 Recommended
 * Activities · 11 Badges · 12 Certificates · 13 AI-Generated Learning
 * Insights · 14 Disclaimer (+ sources & the observed-vs-reference split).
 *
 * Printable: the header chrome hides in print, charts use fixed widths,
 * and sections avoid page breaks. "Save as PDF" is the browser's print
 * dialog — no extra dependency.
 */
import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { Printer } from 'lucide-react';
import { useStrings, type UIStrings } from '@/i18n/strings';
import { useSettings } from '@/data/settingsStore';
import { useInsightsData } from '@/insights/useInsightsData';
import { ZONES } from '@/world/zones';
import {
  DEVELOPMENT_REFERENCE_NAME,
  DEVELOPMENT_REFERENCE_URL,
  INDIA_CODE_NAME,
  INDIA_CODE_URL,
  legalActForZone,
} from '@/insights/legalMap';
import {
  AdultShell,
  AiPanel,
  ConfidenceBadge,
  FindingList,
  LabelBadge,
  RequireAdult,
  StatTile,
  trendText,
  zoneNameFor,
} from './shared';

export default function InsightsReport() {
  return (
    <RequireAdult>
      <ReportInner />
    </RequireAdult>
  );
}

function ReportInner() {
  const t = useStrings();
  const { language } = useSettings();
  const { progress, analysis, ai } = useInsightsData('teacher', language);
  const e = analysis.evidence;
  const o = analysis.overall;
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';
  const dateOpts = { day: 'numeric', month: 'short', year: 'numeric' } as const;
  const today = new Date().toLocaleDateString(locale, dateOpts);

  // Section 4 aggregates — measured (non-practice) answer events only.
  const qp = useMemo(() => {
    const measured = progress.activityLog.filter(
      (ev) => !ev.practice && ev.kind !== 'scene-choice' && ev.kind !== 'activity',
    );
    const acc = (kind: string) => {
      const rows = measured.filter((ev) => ev.kind === kind);
      if (rows.length === 0) return null;
      return Math.round((rows.filter((ev) => ev.isCorrect).length / rows.length) * 100);
    };
    const avgSecs =
      measured.length > 0
        ? Math.round(
            measured.reduce((sum, ev) => sum + ev.responseTime, 0) / measured.length / 1000,
          )
        : null;
    return { pre: acc('quiz-pre'), post: acc('quiz-post'), recap: acc('recap'), avgSecs };
  }, [progress.activityLog]);

  const trendData = analysis.trend.points.map((p) => ({
    name: `S${p.session}`,
    accuracyPct: p.accuracyPct,
  }));

  const badges = Object.keys(progress.badges).filter((k) => progress.badges[k]);
  const certificates = Object.entries(progress.certificates);
  const overallConfidence =
    e.totalMeasured >= 12 && e.totalSessions >= 3
      ? ('high' as const)
      : e.hasMinimumData
        ? ('medium' as const)
        : ('low' as const);

  return (
    <AdultShell t={t} title={t.adultReportCard} backTo="hub">
      <style>{`@media print { @page { margin: 12mm; } body { background: #fff; } }`}</style>

      {/* Printable title block */}
      <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 mb-4 print:border-0 print:rounded-none print:p-0 print:mb-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 leading-tight">
              {t.reportTitle}
            </h1>
            <p className="text-sm text-slate-500 font-bold mt-1">Nyaya Nagri</p>
            <p className="text-xs text-slate-400 font-medium mt-1">{t.reportGeneratedOn(today)}</p>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-700 text-white text-sm font-extrabold hover:bg-slate-800 touch-manipulation print:hidden"
          >
            <Printer className="w-4 h-4" /> {t.reportPrint}
          </button>
        </div>
      </div>

      {/* 1. Student Overview */}
      <ReportSection n={1} title={t.reportS1} tag={t.reportObservedTag}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
          <StatTile
            label={t.insLearnerTitle}
            value={progress.avatar?.nickname || '—'}
          />
          <StatTile label={t.insStatActiveDays} value={String(e.activeDays)} />
          <StatTile label={t.insStatStreak} value={String(o.streakDays)} />
          <StatTile
            label={t.parentJourney(o.zonesCompleted, o.zonesTotal)}
            value={`${o.zonesCompleted}/${o.zonesTotal}`}
          />
        </div>
        <p className="text-xs text-slate-400 font-medium">
          {t.sessionIdLabel} {progress.sessionId}
        </p>
        <p className="text-sm text-slate-500 font-medium mt-1.5">{t.insLearnerSub}</p>
      </ReportSection>

      {/* 2. Learning Summary */}
      <ReportSection n={2} title={t.reportS2} tag={t.reportObservedTag}>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <ConfidenceBadge t={t} confidence={overallConfidence} />
          <span className="text-xs text-slate-400 font-medium">
            {t.insEvidenceLine(e.totalMeasured, e.totalSessions)}
          </span>
        </div>
        {!e.hasMinimumData ? (
          <p className="font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-4 leading-relaxed">
            {t.insNotEnoughData}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <StatTile
              label={t.insStatAccuracy}
              value={o.accuracyPct !== null ? `${o.accuracyPct}%` : '—'}
            />
            <StatTile
              label={t.insStatTime}
              value={t.insMinutes(Math.round(o.timeSpentMs / 60000))}
            />
            <StatTile label={t.insStatLevels} value={String(o.levelsDone)} />
            <StatTile
              label={t.insTrendChartTitle}
              value={trendText(t, analysis.trend.direction)}
            />
          </div>
        )}
      </ReportSection>

      {/* 3. Zone Progress — with the legal traceability column */}
      <ReportSection n={3} title={t.reportS3} tag={t.reportObservedTag}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-2 font-bold">{t.insColTopic}</th>
                <th className="py-2 pr-2 font-bold">{t.insColAnswered}</th>
                <th className="py-2 pr-2 font-bold">{t.insColLabel}</th>
                <th className="py-2 font-bold">{t.reportColAct}</th>
              </tr>
            </thead>
            <tbody>
              {ZONES.map((zone) => {
                const topic = analysis.topics.find((tp) => tp.zoneId === zone.id);
                const act = legalActForZone(zone.id);
                const completed = Boolean(progress.completedZones[zone.id]);
                return (
                  <tr key={zone.id} className="border-t border-slate-100 align-top">
                    <td className="py-2.5 pr-2 font-bold text-slate-700">
                      {zoneNameFor(t, zone.id)} {completed && <span aria-hidden>✓</span>}
                    </td>
                    <td className="py-2.5 pr-2 text-slate-600 font-medium">
                      {topic?.attempts ?? 0}
                    </td>
                    <td className="py-2.5 pr-2">
                      <LabelBadge t={t} label={topic?.label ?? 'insufficient'} />
                    </td>
                    <td className="py-2.5 text-xs text-slate-500 font-medium leading-snug">
                      {act ?? t.reportLegalUnverified}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* 4. Question Performance */}
      <ReportSection n={4} title={t.reportS4} tag={t.reportObservedTag}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <StatTile
            label={t.reportQpBaseline}
            value={qp.pre !== null ? `${qp.pre}%` : '—'}
          />
          <StatTile
            label={t.reportQpCheckpoint}
            value={qp.post !== null ? `${qp.post}%` : '—'}
          />
          <StatTile
            label={t.reportQpRecap}
            value={qp.recap !== null ? `${qp.recap}%` : '—'}
          />
          <StatTile
            label={t.reportQpAvgTime}
            value={qp.avgSecs !== null ? t.reportSeconds(qp.avgSecs) : '—'}
          />
        </div>
      </ReportSection>

      {/* 5. Topic Performance */}
      <ReportSection n={5} title={t.reportS5} tag={t.reportObservedTag}>
        {analysis.topics.filter((tp) => tp.attempts > 0).length === 0 ? (
          <p className="text-slate-500 font-medium">{t.insNotEnoughData}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[460px]">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-2 font-bold">{t.insColTopic}</th>
                  <th className="py-2 pr-2 font-bold">{t.insColAnswered}</th>
                  <th className="py-2 pr-2 font-bold">{t.insColAccuracy}</th>
                  <th className="py-2 pr-2 font-bold">{t.insColSessions}</th>
                  <th className="py-2 font-bold">{t.insColLabel}</th>
                </tr>
              </thead>
              <tbody>
                {analysis.topics
                  .filter((tp) => tp.attempts > 0)
                  .map((tp) => (
                    <tr key={tp.zoneId} className="border-t border-slate-100">
                      <td className="py-2.5 pr-2 font-bold text-slate-700">
                        {zoneNameFor(t, tp.zoneId)}
                      </td>
                      <td className="py-2.5 pr-2 text-slate-600 font-medium">{tp.attempts}</td>
                      <td className="py-2.5 pr-2 text-slate-600 font-medium">
                        {tp.accuracyPct !== null ? `${tp.accuracyPct}%` : '—'}
                      </td>
                      <td className="py-2.5 pr-2 text-slate-600 font-medium">{tp.sessions}</td>
                      <td className="py-2.5">
                        <LabelBadge t={t} label={tp.label} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>

      {/* 6. Strengths */}
      <ReportSection n={6} title={t.reportS6} tag={t.reportObservedTag}>
        {analysis.strengths.length > 0 ? (
          <FindingList t={t} findings={analysis.strengths} />
        ) : (
          <p className="text-slate-500 font-medium">{t.insNotEnoughData}</p>
        )}
      </ReportSection>

      {/* 7. Areas for Practice */}
      <ReportSection n={7} title={t.reportS7} tag={t.reportObservedTag}>
        {analysis.practiceAreas.length > 0 ? (
          <FindingList t={t} findings={analysis.practiceAreas} />
        ) : (
          <p className="text-slate-500 font-medium">{t.insNotEnoughData}</p>
        )}
      </ReportSection>

      {/* 8. Improvement Timeline */}
      <ReportSection n={8} title={t.reportS8} tag={t.reportObservedTag}>
        <p className="text-sm text-slate-500 font-medium mb-3">{t.insTrendChartSub}</p>
        {trendData.length >= 2 ? (
          <div className="overflow-x-auto">
            <LineChart
              width={620}
              height={220}
              data={trendData}
              margin={{ top: 8, right: 8, left: -14, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip
                formatter={(value: number) => [`${value}%`, t.insColAccuracy]}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
              />
              <Line
                type="monotone"
                dataKey="accuracyPct"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4, fill: '#6366f1' }}
              />
            </LineChart>
          </div>
        ) : (
          <p className="text-slate-500 font-medium">{t.insNotEnoughData}</p>
        )}
        {analysis.trend.direction !== 'insufficient' && (
          <p className="text-sm font-bold text-slate-600 mt-2">
            {t.insAiTrendLabel}: {trendText(t, analysis.trend.direction)}
          </p>
        )}
      </ReportSection>

      {/* 9. Engagement Summary */}
      <ReportSection n={9} title={t.reportS9} tag={t.reportObservedTag}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
          <StatTile label={t.insStatSessions} value={String(e.totalSessions)} />
          <StatTile label={t.insStatActiveDays} value={String(e.activeDays)} />
          <StatTile
            label={t.insStatTime}
            value={t.insMinutes(Math.round(o.timeSpentMs / 60000))}
          />
          <StatTile
            label={t.insEngagement}
            value={
              analysis.behavior.engagement === 'good'
                ? t.insEngagementGood
                : analysis.behavior.engagement === 'building'
                  ? t.insEngagementBuilding
                  : t.insEngagementLow
            }
          />
        </div>
        <ul className="space-y-1.5 text-sm text-slate-600 font-medium">
          <li>• {t.insBehaviorRecap(analysis.behavior.recapParticipation)}</li>
          {analysis.behavior.continuesAfterIncorrectPct !== null && (
            <li>• {t.insBehaviorPersistence(analysis.behavior.continuesAfterIncorrectPct)}</li>
          )}
          <li>• {t.insBehaviorPracticeReplays(analysis.behavior.practiceReplays)}</li>
        </ul>
      </ReportSection>

      {/* 10. Recommended Activities */}
      <ReportSection n={10} title={t.reportS10} tag={t.reportObservedTag}>
        {analysis.recommendations.length > 0 ? (
          <FindingList t={t} findings={analysis.recommendations} />
        ) : (
          <p className="text-slate-500 font-medium">{t.insNotEnoughData}</p>
        )}
      </ReportSection>

      {/* 11. Badges */}
      <ReportSection n={11} title={t.reportS11} tag={t.reportObservedTag}>
        {badges.length === 0 ? (
          <p className="text-slate-500 font-medium">{t.reportNoBadges}</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {badges.map((badgeId) => (
              <span
                key={badgeId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-sm font-bold text-amber-700"
              >
                ★ {zoneNameFor(t, badgeId.replace(/_star$/, ''))}
              </span>
            ))}
          </div>
        )}
      </ReportSection>

      {/* 12. Certificates */}
      <ReportSection n={12} title={t.reportS12} tag={t.reportObservedTag}>
        {certificates.length === 0 ? (
          <p className="text-slate-500 font-medium">{t.reportNoCertificates}</p>
        ) : (
          <ul className="space-y-2">
            {certificates.map(([zoneId, cert]) => (
              <li key={zoneId} className="flex items-center gap-3 flex-wrap">
                <span className="font-bold text-slate-700">{zoneNameFor(t, zoneId)}</span>
                <span className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                  {cert.certificateId}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(cert.completedAt).toLocaleDateString(locale, dateOpts)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ReportSection>

      {/* 13. AI-Generated Learning Insights */}
      <ReportSection n={13} title={t.reportS13}>
        {e.hasMinimumData ? (
          <AiPanel t={t} ai={ai} />
        ) : (
          <p className="text-slate-500 font-medium">{t.insNotEnoughData}</p>
        )}
      </ReportSection>

      {/* 14. Disclaimer + sources & the observed/reference split */}
      <ReportSection n={14} title={t.reportS14}>
        <p className="font-bold text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
          {t.insDisclaimer}
        </p>
        <div className="space-y-3 text-sm">
          <p className="text-slate-600 font-medium leading-relaxed">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wide text-slate-500 border border-slate-300 rounded-full px-2 py-0.5 mr-2">
              {t.reportObservedTag}
            </span>
            {t.insTrendChartSub}
          </p>
          <p className="text-slate-600 font-medium leading-relaxed">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wide text-indigo-500 border border-indigo-300 rounded-full px-2 py-0.5 mr-2">
              {t.reportDevRefTag}
            </span>
            {t.reportDevRefBody}{' '}
            <a
              href={DEVELOPMENT_REFERENCE_URL}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 underline break-all"
            >
              {DEVELOPMENT_REFERENCE_NAME}
            </a>
          </p>
          <div>
            <h3 className="font-extrabold text-slate-700 mb-1">{t.reportSourcesTitle}</h3>
            <p className="text-slate-600 font-medium leading-relaxed mb-2">
              {t.reportSourceLegalIntro}{' '}
              <a
                href={INDIA_CODE_URL}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 underline break-all"
              >
                {INDIA_CODE_NAME}
              </a>
            </p>
            <ul className="space-y-1 text-xs text-slate-500 font-medium">
              {ZONES.map((zone) => (
                <li key={zone.id}>
                  {zoneNameFor(t, zone.id)} — {legalActForZone(zone.id) ?? t.reportLegalUnverified}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ReportSection>
    </AdultShell>
  );
}

function ReportSection({
  n,
  title,
  tag,
  children,
}: {
  n: number;
  title: string;
  tag?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-3xl border-2 border-slate-100 p-5 md:p-6 mb-4 break-inside-avoid print:rounded-none print:border-x-0 print:border-t-0 print:border-b print:px-0">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
        <h2 className="font-extrabold text-slate-700 text-lg leading-tight">
          {n}. {title}
        </h2>
        {tag && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">
            {tag}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}
