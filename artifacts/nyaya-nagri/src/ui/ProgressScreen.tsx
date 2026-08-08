/**
 * Nyaya Nagri — Progress dashboard (Task 9)
 *
 * Two strictly separated views in one overlay:
 *
 * 1. Child-facing "My Progress" (default): zones completed, badges earned,
 *    and a friendly encouraging summary. NO raw scores, NO percentages —
 *    only warm counts like "3 out of 6 Rights Quests".
 *
 * 2. Teacher/Parent summary (opt-in toggle, clearly labelled, off by
 *    default): aggregated pre-vs-post quiz percentages per zone for THIS
 *    device/session only — a learning-impact measure (PRD §5.2, §6.3).
 *    It never shows individual quiz answers or any story/scenario choices
 *    (the engine's choiceLog is never persisted anywhere), so nothing in
 *    it can reveal a real disclosure. Analytics are keyed by the
 *    pseudonymous session id only — no names, no PII (PRD §9.4).
 *
 * The persistent "Get Help Now" button (z-50) stays visible above this
 * overlay, as on every other screen.
 */
import React, { useEffect, useState } from 'react';
import { progressStore, type ProgressState } from '@/data/progressStore';
import { ZONES, isZoneUnlockedIn } from '@/world/zones';
import { getAllQuests } from '@/quests/registry';
import { useUIStore, closeProgress } from './uiStore';
import { useStrings, type UIStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';
import { Star, Lock, MapPin, X, Award, Users, Trophy, Coins, Flame } from 'lucide-react';
import { rankForXp, xpToNextRank, TITLE_IDS } from '@/economy/economy';

/** Aggregated pre/post literacy percentages for one zone (teacher view). */
export interface ZoneImpact {
  zoneId: string;
  zoneName: string;
  /** Pre-quiz percentage, 0-100 (rounded). */
  prePct: number;
  /** Post-quiz percentage, 0-100 (rounded). */
  postPct: number;
  /** postPct - prePct, in percentage points. */
  deltaPts: number;
}

/**
 * Aggregate quiz scores per zone from the progress state. Uses only the
 * stored pre/post totals — never individual answers or scene choices.
 */
export function computeZoneImpact(progress: ProgressState): ZoneImpact[] {
  const quests = getAllQuests();
  const impacts: ZoneImpact[] = [];

  for (const zone of ZONES) {
    let pre = 0;
    let post = 0;
    let total = 0;
    for (const quest of quests) {
      if (quest.zoneId !== zone.id) continue;
      const score = progress.quizScores[quest.questId];
      if (!score || score.pre === null || score.post === null) continue;
      pre += score.pre;
      post += score.post;
      total += quest.quizQuestions.length;
    }
    if (total === 0) continue;
    const prePct = Math.round((pre / total) * 100);
    const postPct = Math.round((post / total) * 100);
    impacts.push({
      zoneId: zone.id,
      zoneName: zone.name,
      prePct,
      postPct,
      deltaPts: postPct - prePct,
    });
  }
  return impacts;
}

function childZoneStates(progress: ProgressState) {
  // Same single-source lock rule as the 3D map (zones.ts): completed zones
  // are always replayable, otherwise first zone free + previous-complete.
  return ZONES.map((zone) => ({
    ...zone,
    completed: !!progress.completedZones[zone.id],
    unlocked: isZoneUnlockedIn(progress.completedZones, zone.id),
  }));
}

function encouragement(completedCount: number, t: UIStrings): string {
  if (completedCount === 0) {
    return t.encouragementStart;
  }
  if (completedCount < ZONES.length) {
    return t.encouragementMid;
  }
  return t.encouragementAll;
}

/**
 * Pure, prop-driven panel (also rendered headlessly by the dashboard smoke
 * test). State (toggle, subscriptions) lives in ProgressOverlay below.
 */
export function ProgressPanel({
  progress,
  teacherView,
  onToggleTeacherView,
  onClose,
}: {
  progress: ProgressState;
  teacherView: boolean;
  onToggleTeacherView: () => void;
  onClose: () => void;
}) {
  const t = useStrings();
  const zones = childZoneStates(progress);
  const completedCount = zones.filter((z) => z.completed).length;
  const badgeCount = Object.values(progress.badges).filter(Boolean).length;
  const impacts = teacherView ? computeZoneImpact(progress) : [];
  const avgDelta =
    impacts.length > 0
      ? Math.round(impacts.reduce((sum, i) => sum + i.deltaPts, 0) / impacts.length)
      : 0;

  return (
    <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full border border-slate-100 animate-in zoom-in-95 duration-300 pointer-events-auto flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="flex justify-between items-center p-6 md:p-8 pb-4 shrink-0">
        <h2 className="font-display font-bold text-3xl text-slate-800">{t.progressTitle}</h2>
        <button
          onClick={onClose}
          aria-label={t.closeProgress}
          className="text-slate-400 hover:text-slate-600 p-2 bg-slate-100 rounded-full transition-colors touch-manipulation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-y-auto min-h-0 px-6 md:px-8 pb-6 md:pb-8">
        {/* Child-facing summary — counts only, never scores or percentages */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100 mb-6 text-center">
          <p className="font-display font-bold text-2xl text-orange-600 mb-1">
            {t.completedXofY(completedCount, ZONES.length)}
          </p>
          <p className="text-lg text-slate-600 font-medium">{encouragement(completedCount, t)}</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-orange-200 shadow-sm">
            <Award className="w-5 h-5 text-orange-500 fill-orange-400" />
            <span className="font-bold text-slate-700">
              {t.badgesEarned(badgeCount)}
            </span>
          </div>
        </div>

        {/* Zone list */}
        <ul className="flex flex-col gap-3 mb-6">
          {zones.map((zone) => (
            <li
              key={zone.id}
              className={cn(
                'flex items-center gap-4 p-4 rounded-2xl border-2',
                zone.completed
                  ? 'bg-green-50 border-green-100'
                  : zone.unlocked
                    ? 'bg-sky-50 border-sky-100'
                    : 'bg-slate-50 border-slate-100 opacity-70',
              )}
            >
              <div
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm',
                  zone.completed ? 'bg-gradient-to-tr from-orange-400 to-amber-300' : zone.unlocked ? 'bg-sky-200' : 'bg-slate-200',
                )}
              >
                {zone.completed ? (
                  <Star className="w-6 h-6 text-white fill-white" />
                ) : zone.unlocked ? (
                  <MapPin className="w-5 h-5 text-sky-600" />
                ) : (
                  <Lock className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-lg text-slate-800 leading-tight">{t.zones[zone.id]?.name ?? zone.name}</p>
                <p
                  className={cn(
                    'text-sm font-bold',
                    zone.completed ? 'text-green-600' : zone.unlocked ? 'text-sky-600' : 'text-slate-400',
                  )}
                >
                  {zone.completed ? t.zoneComplete : zone.unlocked ? t.zoneReady : t.zoneLocked}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Player profile (Task 16) — PRIVATE economy summary: Player Rank
            (deliberately never called just "Level" — that word belongs to
            the in-zone levels), XP, Coins, the gentle streak, and titles.
            Titles are flavor text for the child only; nothing here is ever
            shared or shown to anyone else. */}
        <div className="bg-violet-50 rounded-2xl p-5 border border-violet-100 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-violet-500" />
            <h3 className="font-display font-bold text-xl text-slate-800">{t.profileHeading}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white rounded-xl border border-violet-100 p-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t.playerRankLabel}
              </p>
              <p className="font-display font-bold text-2xl text-violet-600">
                {rankForXp(progress.xp)}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {t.xpToNext(xpToNextRank(progress.xp))}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-violet-100 p-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t.totalXpLabel}
              </p>
              <p className="font-display font-bold text-2xl text-sky-600">{progress.xp}</p>
            </div>
            <div className="bg-white rounded-xl border border-violet-100 p-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t.coinsLabel}
              </p>
              <p className="font-display font-bold text-2xl text-amber-500 flex items-center gap-1.5">
                <Coins className="w-5 h-5" />
                {progress.coins}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-violet-100 p-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t.streakLabel}
              </p>
              <p className="font-display font-bold text-2xl text-orange-500 flex items-center gap-1.5">
                <Flame className="w-5 h-5" />
                {t.streakDays(progress.streak.count)}
              </p>
            </div>
          </div>
          {/* Gentle by design: a break never shows a warning or loss */}
          <p className="text-xs text-slate-500 font-medium mb-4">{t.streakNote}</p>

          <p className="font-bold text-slate-700 mb-2">{t.titlesHeading}</p>
          {TITLE_IDS.some((id) => progress.titles[id]) ? (
            <div className="flex flex-wrap gap-2">
              {TITLE_IDS.filter((id) => progress.titles[id]).map((id) => (
                <span
                  key={id}
                  className="bg-white border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full font-bold text-sm"
                >
                  {t.titleNames[id] ?? id}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 font-medium">{t.noTitlesYet}</p>
          )}
          <p className="text-xs text-slate-500 font-medium mt-2">{t.titlesPrivateNote}</p>
        </div>

        {/* Teacher/Parent opt-in section — clearly separated and labelled */}
        <div className="border-t-2 border-slate-100 pt-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-slate-500" />
              <div>
                <p className="font-bold text-slate-700">{t.teacherSection}</p>
                <p className="text-sm text-slate-500 font-medium">
                  {t.teacherSectionSub}
                </p>
              </div>
            </div>
            <button
              onClick={onToggleTeacherView}
              role="switch"
              aria-checked={teacherView}
              className={cn(
                'px-4 py-2 rounded-full font-bold text-sm border-2 transition-colors touch-manipulation',
                teacherView
                  ? 'bg-slate-700 border-slate-700 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400',
              )}
            >
              {teacherView ? t.hideSummary : t.showSummary}
            </button>
          </div>

          {teacherView && (
            <div className="mt-5 bg-slate-50 rounded-2xl p-5 border border-slate-200 animate-in fade-in duration-200">
              <h3 className="font-bold text-slate-700 mb-1">
                {t.teacherSummaryTitle}
              </h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4">
                {t.teacherPrivacyNote}
              </p>

              {impacts.length === 0 ? (
                <p className="text-slate-500 font-medium bg-white rounded-xl p-4 border border-slate-200">
                  {t.teacherEmpty}
                </p>
              ) : (
                <>
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="py-2 pr-2 font-bold">{t.colZone}</th>
                        <th className="py-2 pr-2 font-bold">{t.colBefore}</th>
                        <th className="py-2 pr-2 font-bold">{t.colAfter}</th>
                        <th className="py-2 font-bold">{t.colChange}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {impacts.map((impact) => (
                        <tr key={impact.zoneId} className="border-t border-slate-200">
                          <td className="py-2 pr-2 font-bold text-slate-700">{t.zones[impact.zoneId]?.name ?? impact.zoneName}</td>
                          <td className="py-2 pr-2 text-slate-600 font-medium">{impact.prePct}%</td>
                          <td className="py-2 pr-2 text-slate-600 font-medium">{impact.postPct}%</td>
                          <td
                            className={cn(
                              'py-2 font-bold',
                              impact.deltaPts > 0
                                ? 'text-green-600'
                                : impact.deltaPts < 0
                                  ? 'text-orange-600'
                                  : 'text-slate-500',
                            )}
                          >
                            {t.ptsChange(impact.deltaPts)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-sm font-bold text-slate-600 mb-3">
                    {t.avgImprovement}{' '}
                    <span className={avgDelta >= 0 ? 'text-green-600' : 'text-orange-600'}>
                      {t.ptsChange(avgDelta)}
                    </span>
                  </p>
                </>
              )}

              <p className="text-xs text-slate-400 font-medium">
                {t.sessionIdLabel} {progress.sessionId}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Connected overlay: subscribes to the stores and hosts the opt-in toggle. */
export function ProgressOverlay() {
  const { progressOpen } = useUIStore();
  const [progress, setProgress] = useState(() => progressStore.getState());
  // Teacher view is opt-in per opening — it always starts hidden.
  const [teacherView, setTeacherView] = useState(false);

  useEffect(() => progressStore.subscribe(setProgress), []);
  useEffect(() => {
    if (!progressOpen) setTeacherView(false);
  }, [progressOpen]);

  if (!progressOpen) return null;

  return (
    <div className="absolute inset-0 z-30 pointer-events-auto bg-slate-50/95 backdrop-blur-md flex items-center justify-center p-4 md:p-6">
      <ProgressPanel
        progress={progress}
        teacherView={teacherView}
        onToggleTeacherView={() => setTeacherView((v) => !v)}
        onClose={closeProgress}
      />
    </div>
  );
}
