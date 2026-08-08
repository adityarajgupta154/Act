/**
 * Nyaya Nagri — Progress dashboard (Task 9)
 *
 * Two strictly separated views in one overlay:
 *
 * 1. Child-facing "My Progress" (default): zones completed, badges earned,
 *    and a friendly encouraging summary. NO raw scores, NO percentages —
 *    only warm counts like "3 out of 5 Rights Quests".
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
import { ZONES } from '@/world/zones';
import { getAllQuests } from '@/quests/registry';
import { useUIStore, closeProgress } from './uiStore';
import { cn } from '@/lib/utils';
import { Star, Lock, MapPin, X, Award, Users } from 'lucide-react';

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
  return ZONES.map((zone) => {
    const completed = !!progress.completedZones[zone.id];
    const previous = ZONES.find((z) => z.order === zone.order - 1);
    const unlocked = zone.order === 1 || !!(previous && progress.completedZones[previous.id]);
    return { ...zone, completed, unlocked };
  });
}

function encouragement(completedCount: number): string {
  if (completedCount === 0) {
    return 'Your adventure is just beginning. The Safe Zone is waiting for you!';
  }
  if (completedCount < ZONES.length) {
    return 'Amazing work! Keep exploring, the next zone is ready for you.';
  }
  return 'Incredible! You explored every zone. You are a true Rights Champion!';
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
        <h2 className="font-display font-bold text-3xl text-slate-800">My Progress</h2>
        <button
          onClick={onClose}
          aria-label="Close progress"
          className="text-slate-400 hover:text-slate-600 p-2 bg-slate-100 rounded-full transition-colors touch-manipulation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-y-auto min-h-0 px-6 md:px-8 pb-6 md:pb-8">
        {/* Child-facing summary — counts only, never scores or percentages */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100 mb-6 text-center">
          <p className="font-display font-bold text-2xl text-orange-600 mb-1">
            You've completed {completedCount} out of {ZONES.length} Rights Quests!
          </p>
          <p className="text-lg text-slate-600 font-medium">{encouragement(completedCount)}</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-orange-200 shadow-sm">
            <Award className="w-5 h-5 text-orange-500 fill-orange-400" />
            <span className="font-bold text-slate-700">
              {badgeCount === 1 ? '1 star badge earned' : `${badgeCount} star badges earned`}
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
                <p className="font-display font-bold text-lg text-slate-800 leading-tight">{zone.name}</p>
                <p
                  className={cn(
                    'text-sm font-bold',
                    zone.completed ? 'text-green-600' : zone.unlocked ? 'text-sky-600' : 'text-slate-400',
                  )}
                >
                  {zone.completed ? 'Complete! Star earned' : zone.unlocked ? 'Ready to explore' : 'Locked for now'}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Teacher/Parent opt-in section — clearly separated and labelled */}
        <div className="border-t-2 border-slate-100 pt-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-slate-500" />
              <div>
                <p className="font-bold text-slate-700">For Teachers and Parents</p>
                <p className="text-sm text-slate-500 font-medium">
                  Optional learning summary (hidden by default)
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
              {teacherView ? 'Hide summary' : 'Show summary'}
            </button>
          </div>

          {teacherView && (
            <div className="mt-5 bg-slate-50 rounded-2xl p-5 border border-slate-200 animate-in fade-in duration-200">
              <h3 className="font-bold text-slate-700 mb-1">
                Learning summary for this device
              </h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4">
                Aggregated quiz improvement (before the quest vs after) per zone, for
                measuring learning impact only. This view never shows individual
                answers or any story choices, and it is not a tool for monitoring a
                child's personal situation. Data is stored under a pseudonymous
                session ID only — no names, no personal details.
              </p>

              {impacts.length === 0 ? (
                <p className="text-slate-500 font-medium bg-white rounded-xl p-4 border border-slate-200">
                  No quests completed on this device yet — the summary will appear
                  after the first completed quest.
                </p>
              ) : (
                <>
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="py-2 pr-2 font-bold">Zone</th>
                        <th className="py-2 pr-2 font-bold">Before</th>
                        <th className="py-2 pr-2 font-bold">After</th>
                        <th className="py-2 font-bold">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {impacts.map((impact) => (
                        <tr key={impact.zoneId} className="border-t border-slate-200">
                          <td className="py-2 pr-2 font-bold text-slate-700">{impact.zoneName}</td>
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
                            {impact.deltaPts > 0 ? `+${impact.deltaPts}` : impact.deltaPts} pts
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-sm font-bold text-slate-600 mb-3">
                    Average improvement across played zones:{' '}
                    <span className={avgDelta >= 0 ? 'text-green-600' : 'text-orange-600'}>
                      {avgDelta > 0 ? `+${avgDelta}` : avgDelta} pts
                    </span>
                  </p>
                </>
              )}

              <p className="text-xs text-slate-400 font-medium">
                Pseudonymous session ID: {progress.sessionId}
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
