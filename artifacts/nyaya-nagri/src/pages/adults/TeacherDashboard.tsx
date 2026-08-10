/**
 * Teacher dashboard — the full insights view for the single local learner.
 *
 * Layout: learner card (pseudonymous) → overview stats → charts (topic
 * accuracy bar, session trend line) → topic table → behaviour signals →
 * deterministic strengths / practice / recommendations → AI panel →
 * disclaimer. Every pattern shows its evidence counts; below the
 * minimum-evidence gate the dashboard says so instead of guessing.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Link } from 'wouter';
import { FileText, UserRound } from 'lucide-react';
import { useStrings } from '@/i18n/strings';
import { useSettings } from '@/data/settingsStore';
import { useInsightsData } from '@/insights/useInsightsData';
import {
  AdultShell,
  AiPanel,
  ConfidenceBadge,
  FindingList,
  LABEL_COLORS,
  LabelBadge,
  RequireAdult,
  SectionCard,
  StatTile,
  labelText,
  trendText,
  zoneNameFor,
} from './shared';

export default function TeacherDashboard() {
  return (
    <RequireAdult>
      <TeacherInner />
    </RequireAdult>
  );
}

function TeacherInner() {
  const t = useStrings();
  const { language } = useSettings();
  const { progress, analysis, ai } = useInsightsData('teacher', language);
  const e = analysis.evidence;
  const o = analysis.overall;

  const topicData = analysis.topics
    .filter((tp) => tp.attempts > 0)
    .map((tp) => ({
      name: zoneNameFor(t, tp.zoneId),
      accuracyPct: tp.accuracyPct ?? 0,
      label: tp.label,
    }));
  const trendData = analysis.trend.points.map((p) => ({
    name: `S${p.session}`,
    accuracyPct: p.accuracyPct,
  }));

  const overallConfidence =
    e.totalMeasured >= 12 && e.totalSessions >= 3
      ? ('high' as const)
      : e.hasMinimumData
        ? ('medium' as const)
        : ('low' as const);

  return (
    <AdultShell t={t} title={t.adultTeacherCard} subtitle={t.adultAreaIntro} backTo="hub">
      {/* Learner card — the "student list" of this single-device prototype */}
      <SectionCard>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <UserRound className="w-6 h-6 text-indigo-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-extrabold text-slate-700 leading-tight">
              {progress.avatar?.nickname || t.insLearnerTitle}
            </h2>
            <p className="text-sm text-slate-500 font-medium leading-snug mt-0.5">
              {t.insLearnerSub}
            </p>
            <p className="text-xs text-slate-400 font-medium mt-1.5">
              {t.sessionIdLabel} {progress.sessionId}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <ConfidenceBadge t={t} confidence={overallConfidence} />
            <p className="text-xs text-slate-400 font-medium">
              {t.insEvidenceLine(e.totalMeasured, e.totalSessions)}
            </p>
          </div>
        </div>
      </SectionCard>

      {!e.hasMinimumData && (
        <SectionCard className="border-amber-200 bg-amber-50">
          <p className="font-bold text-amber-800 leading-relaxed">{t.insNotEnoughData}</p>
        </SectionCard>
      )}

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 mb-4">
        <StatTile label={t.insStatQuestions} value={String(e.totalMeasured)} />
        <StatTile label={t.insStatSessions} value={String(e.totalSessions)} />
        <StatTile label={t.insStatActiveDays} value={String(e.activeDays)} />
        <StatTile
          label={t.insStatAccuracy}
          value={o.accuracyPct !== null ? `${o.accuracyPct}%` : '—'}
        />
        <StatTile
          label={t.insStatTime}
          value={t.insMinutes(Math.round(o.timeSpentMs / 60000))}
        />
        <StatTile label={t.insStatLevels} value={String(o.levelsDone)} />
        <StatTile label={t.insStatBadges} value={String(o.badges)} />
        <StatTile label={t.insStatStreak} value={String(o.streakDays)} />
        <StatTile label={t.insStatPractice} value={String(o.practiceReplays)} />
        <StatTile
          label={t.insTrendChartTitle}
          value={trendText(t, analysis.trend.direction)}
        />
      </div>

      {/* Charts */}
      {topicData.length > 0 && (
        <SectionCard title={t.insTopicChartTitle}>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicData} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={52}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, t.insColAccuracy]}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="accuracyPct" radius={[6, 6, 0, 0]} maxBarSize={44}>
                  {topicData.map((d) => (
                    <Cell key={d.name} fill={LABEL_COLORS[d.label]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 flex-wrap mt-2">
            {(['strong', 'developing', 'needs-practice', 'insufficient'] as const).map((l) => (
              <span key={l} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: LABEL_COLORS[l] }}
                />
                {labelText(t, l)}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {trendData.length >= 2 && (
        <SectionCard title={t.insTrendChartTitle} sub={t.insTrendChartSub}>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
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
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {/* Topic table */}
      {topicData.length > 0 && (
        <SectionCard title={t.insColTopic}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
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
        </SectionCard>
      )}

      {/* Behaviour signals */}
      <SectionCard title={t.insBehaviorTitle}>
        <ul className="space-y-2 text-slate-700 font-medium">
          <li>• {t.insBehaviorRecap(analysis.behavior.recapParticipation)}</li>
          {analysis.behavior.continuesAfterIncorrectPct !== null && (
            <li>• {t.insBehaviorPersistence(analysis.behavior.continuesAfterIncorrectPct)}</li>
          )}
          <li>• {t.insBehaviorPracticeReplays(analysis.behavior.practiceReplays)}</li>
          <li>
            • {t.insEngagement}:{' '}
            <span className="font-extrabold">
              {analysis.behavior.engagement === 'good'
                ? t.insEngagementGood
                : analysis.behavior.engagement === 'building'
                  ? t.insEngagementBuilding
                  : t.insEngagementLow}
            </span>
          </li>
        </ul>
      </SectionCard>

      {/* Deterministic findings */}
      {analysis.strengths.length > 0 && (
        <SectionCard title={t.insStrengthsTitle}>
          <FindingList t={t} findings={analysis.strengths} />
        </SectionCard>
      )}
      {analysis.practiceAreas.length > 0 && (
        <SectionCard title={t.insPracticeTitle}>
          <FindingList t={t} findings={analysis.practiceAreas} />
        </SectionCard>
      )}
      {analysis.recommendations.length > 0 && (
        <SectionCard title={t.insRecsTitle}>
          <FindingList t={t} findings={analysis.recommendations} />
        </SectionCard>
      )}

      {/* AI narrative — only meaningful once the evidence gate passes */}
      {e.hasMinimumData && <AiPanel t={t} ai={ai} />}

      <Link
        href="/adults/report"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-emerald-200 bg-emerald-50 text-sm font-bold text-emerald-700 hover:border-emerald-400 touch-manipulation mb-4"
      >
        <FileText className="w-4 h-4" /> {t.adultReportCard}
      </Link>

      <p className="text-xs text-slate-400 font-medium leading-relaxed">{t.insDisclaimer}</p>
    </AdultShell>
  );
}
