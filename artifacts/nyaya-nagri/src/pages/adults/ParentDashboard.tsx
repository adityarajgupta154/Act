/**
 * Parent view — deliberately simple (spec §8): journey picture, friendly
 * stats, plain-words strengths/practice, the AI encouragement, and clear
 * "what this means / what it never means" framing. No tables, no jargon.
 */
import { Heart, MessageCircleQuestion, Sparkles } from 'lucide-react';
import { useStrings } from '@/i18n/strings';
import { useSettings } from '@/data/settingsStore';
import { useInsightsData } from '@/insights/useInsightsData';
import {
  AdultShell,
  FindingList,
  RequireAdult,
  SectionCard,
  StatTile,
} from './shared';

export default function ParentDashboard() {
  return (
    <RequireAdult>
      <ParentInner />
    </RequireAdult>
  );
}

function ParentInner() {
  const t = useStrings();
  const { language } = useSettings();
  const { progress, analysis, ai } = useInsightsData('parent', language);
  const e = analysis.evidence;
  const o = analysis.overall;
  const journeyPct = o.zonesTotal > 0 ? Math.round((o.zonesCompleted / o.zonesTotal) * 100) : 0;

  return (
    <AdultShell t={t} title={t.parentTitle} subtitle={t.parentIntro} backTo="hub">
      {/* Journey */}
      <SectionCard>
        <div className="flex items-center gap-3 mb-2">
          <Heart className="w-5 h-5 text-rose-500" />
          <p className="font-extrabold text-slate-700">
            {t.parentJourney(o.zonesCompleted, o.zonesTotal)}
          </p>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-rose-400 rounded-full transition-all"
            style={{ width: `${journeyPct}%` }}
          />
        </div>
      </SectionCard>

      {!e.hasMinimumData && (
        <SectionCard className="border-amber-200 bg-amber-50">
          <p className="font-bold text-amber-800 leading-relaxed">{t.insNotEnoughData}</p>
        </SectionCard>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <StatTile label={t.insStatQuestions} value={String(e.totalMeasured)} />
        <StatTile
          label={t.insStatTime}
          value={t.insMinutes(Math.round(o.timeSpentMs / 60000))}
        />
        <StatTile label={t.insStatBadges} value={String(o.badges)} />
        <StatTile label={t.insStatSessions} value={String(e.totalSessions)} />
      </div>

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

      {/* AI encouragement — the friendliest slice of the narrative */}
      {e.hasMinimumData && ai.data && (
        <SectionCard>
          <h2 className="font-extrabold text-slate-700 text-lg inline-flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-indigo-500" /> {t.insAiEncouragementLabel}
          </h2>
          <p className="text-slate-700 font-medium leading-relaxed">{ai.data.encouragement}</p>
          <p className="text-xs text-slate-400 font-medium leading-relaxed border-t border-slate-100 pt-3 mt-3">
            {ai.data.disclaimer}
          </p>
        </SectionCard>
      )}

      <SectionCard title={t.parentWhatItMeans} className="border-amber-100 bg-amber-50/60">
        <p className="text-slate-700 font-medium leading-relaxed">{t.parentWhatItMeansBody}</p>
      </SectionCard>

      <SectionCard className="border-indigo-100 bg-indigo-50/60">
        <h2 className="font-extrabold text-slate-700 text-lg inline-flex items-center gap-2 mb-2">
          <MessageCircleQuestion className="w-5 h-5 text-indigo-500" /> {t.parentTalkTitle}
        </h2>
        <p className="text-slate-700 font-medium leading-relaxed">{t.parentTalkBody}</p>
      </SectionCard>

      <p className="text-xs text-slate-400 font-medium leading-relaxed">{t.insDisclaimer}</p>
    </AdultShell>
  );
}
