/**
 * Nyaya Nagri — Level-Select screen (redesigned Aug 2026)
 *
 * Full-screen immersive layout matching the reference zone-city design:
 * - Top bar: back (←), centered book icon, ⭐ Total Points badge
 * - Zone title + subtitle + "CHOOSE A LEVEL" sparkling divider
 * - Dashed vertical connector + green circle-star nodes aligned to each card
 * - Level cards: coloured kind thumbnail | LEVEL N kicker | title + desc |
 *   ✓ COMPLETED badge | Practice Again / Start button
 * - lg+: left decoration (wooden "Learn Rights Grow" sign + stacked books) and
 *   right decoration (guide-boy mascot)
 * - Always-visible encouragement banner at the bottom
 */
import React, { useState, useEffect } from 'react';
import type { Quest, LevelKind } from './schema';
import { getLevelStatuses, type LevelStatus } from './levels';
import { useStrings } from '@/i18n/strings';
import { exitZone } from '@/ui/uiStore';
import { progressStore } from '@/data/progressStore';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Star,
  Play,
  Lock,
  RotateCcw,
  BookOpen,
  Split,
  Award,
  Layers,
  Search,
  Inbox,
  Zap,
  Landmark,
  Trophy,
  CheckCircle2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

// ── Kind metadata ─────────────────────────────────────────────────────────────

const KIND_ICONS: Record<LevelKind, LucideIcon> = {
  story:       BookOpen,
  decision:    Split,
  quiz:        Award,
  memory:      Layers,
  hidden:      Search,
  sorting:     Inbox,
  scenario:    Zap,
  authorities: Landmark,
};

/** Gradient colours for the card thumbnail tile, one palette per kind. */
const KIND_THUMB: Record<LevelKind, { from: string; to: string; card: string }> = {
  story:       { from: 'from-amber-400',  to: 'to-orange-500',  card: 'bg-amber-50/80  border-amber-100'  },
  decision:    { from: 'from-sky-400',    to: 'to-blue-500',    card: 'bg-sky-50/80    border-sky-100'    },
  quiz:        { from: 'from-violet-500', to: 'to-purple-600',  card: 'bg-violet-50/80 border-violet-100' },
  memory:      { from: 'from-pink-400',   to: 'to-rose-500',    card: 'bg-pink-50/80   border-pink-100'   },
  hidden:      { from: 'from-yellow-400', to: 'to-amber-500',   card: 'bg-yellow-50/80 border-yellow-100' },
  sorting:     { from: 'from-teal-400',   to: 'to-green-500',   card: 'bg-teal-50/80   border-teal-100'   },
  scenario:    { from: 'from-orange-400', to: 'to-red-500',     card: 'bg-orange-50/80 border-orange-100' },
  authorities: { from: 'from-slate-500',  to: 'to-indigo-600',  card: 'bg-indigo-50/80 border-indigo-100' },
};

// ── Sub-components ────────────────────────────────────────────────────────────

/** Green circle node that rides the dashed connector on the left of each card. */
function LevelNode({ status }: { status: LevelStatus }) {
  return (
    <div
      className={cn(
        'w-12 h-12 rounded-full border-[3px] border-white flex items-center justify-center shrink-0 shadow-md z-10',
        status === 'completed' ? 'bg-gradient-to-tr from-green-400 to-emerald-300' :
        status === 'unlocked'  ? 'bg-gradient-to-tr from-amber-400 to-orange-400'  :
                                 'bg-slate-200',
      )}
    >
      {status === 'completed' && <Star  className="w-5 h-5 fill-white text-white" />}
      {status === 'unlocked'  && <Play  className="w-5 h-5 fill-white text-white" />}
      {status === 'locked'    && <Lock  className="w-4 h-4 text-slate-400"        />}
    </div>
  );
}

/** Coloured square tile used as a level-kind illustration thumbnail. */
function KindThumb({ kind }: { kind: LevelKind }) {
  const KindIcon = KIND_ICONS[kind];
  const { from, to } = KIND_THUMB[kind];
  return (
    <div
      className={cn(
        'w-16 h-16 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
        `bg-gradient-to-br ${from} ${to}`,
      )}
    >
      <KindIcon className="w-8 h-8 text-white drop-shadow" />
    </div>
  );
}

/** Left panel decorations: wooden sign + stacked books. Shown on lg+ only. */
function LeftDecor() {
  return (
    <div className="hidden lg:flex flex-col items-center gap-5 select-none pointer-events-none">
      {/* Wooden "Learn Rights Grow" sign */}
      <div className="relative">
        {/* Post */}
        <div className="mx-auto w-2.5 h-8 bg-amber-800 rounded-b mb-0" />
        {/* Sign face */}
        <div className="bg-amber-700 text-white font-display font-bold rounded-xl px-5 py-3 text-center shadow-xl border-[3px] border-amber-900 -rotate-2">
          <p className="text-sm leading-snug">Learn</p>
          <p className="text-sm leading-snug">Rights</p>
          <p className="text-sm leading-snug">Grow</p>
        </div>
      </div>
      {/* Stacked books */}
      <div className="flex flex-col items-start gap-0.5">
        <div className="h-4 w-14 rounded bg-blue-600 shadow-sm" />
        <div className="h-4 w-16 rounded bg-purple-600 shadow-sm" />
        <div className="h-4 w-12 rounded bg-green-600 shadow-sm" />
        <div className="h-4 w-16 rounded bg-rose-500 shadow-sm" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LevelSelect({
  quest,
  zoneName,
  zoneTheme,
  onStart,
}: {
  quest: Quest;
  zoneName: string;
  zoneTheme: string;
  /** practice=true replays a completed level without touching recorded scores. */
  onStart: (levelIndex: number, practice: boolean) => void;
}) {
  const t = useStrings();
  const statuses = getLevelStatuses(quest);

  // XP shown as "Total Points" — subscribe so the badge stays live.
  const [xp, setXp] = useState(() => progressStore.getState().xp);
  useEffect(() => progressStore.subscribe((s) => setXp(s.xp)), []);

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="relative flex items-center justify-between px-4 pt-4 pb-1 shrink-0">
        {/* Back button */}
        <button
          onClick={exitZone}
          aria-label={t.backToMap}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-md border border-white/60 hover:bg-white active:scale-95 transition-transform touch-manipulation pointer-events-auto"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>

        {/* Centred book icon */}
        <div className="absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-md border border-white/60">
          <BookOpen className="w-6 h-6 text-orange-500" />
        </div>

        {/* Total points badge */}
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur rounded-2xl px-3 py-1.5 shadow-md border border-white/60 pointer-events-none">
          <Star className="w-5 h-5 fill-amber-400 text-amber-400 shrink-0" />
          <div className="text-right">
            <p className="font-bold text-lg text-slate-800 leading-none">{xp}</p>
            <p className="text-[10px] font-semibold text-slate-500 leading-none mt-0.5 uppercase tracking-wide">
              {t.zoneTotalPoints}
            </p>
          </div>
        </div>
      </div>

      {/* ── Zone header ──────────────────────────────────────────────────── */}
      <div className="text-center px-6 pt-2 pb-1 shrink-0">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900 drop-shadow-sm">
          {zoneName}
        </h2>
        <p className="text-sm md:text-base text-slate-700 font-medium mt-1 leading-snug max-w-md mx-auto">
          {zoneTheme}
        </p>

        {/* "CHOOSE A LEVEL" divider */}
        <div className="flex items-center gap-2 mt-4">
          <div className="h-px flex-1 bg-slate-300/70" />
          <span className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-slate-500 uppercase">
            <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
            {t.chooseLevel}
            <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
          </span>
          <div className="h-px flex-1 bg-slate-300/70" />
        </div>
      </div>

      {/* ── Main scrollable area ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto relative min-h-0">
        {/* Left decoration (lg+) */}
        <div className="hidden lg:flex absolute left-6 top-1/2 -translate-y-1/2 flex-col items-center gap-4 z-0">
          <LeftDecor />
        </div>

        {/* Level cards column — centred, sits above decorations */}
        <div className="relative max-w-xl mx-auto px-4 py-4 z-10">

          {/* Dashed vertical connector — runs from centre of first to centre of last node */}
          {quest.levels.length > 1 && (
            <div
              className="absolute border-l-2 border-dashed border-green-400 pointer-events-none"
              style={{ left: 39, top: 24, bottom: 24 }}
            />
          )}

          <div className="flex flex-col gap-3">
            {quest.levels.map((level, i) => {
              const status = statuses[i];
              const { card } = KIND_THUMB[level.kind];
              const isLocked = status === 'locked';

              return (
                <div key={level.levelId} className="flex items-center gap-3">
                  {/* Circle node */}
                  <LevelNode status={status} />

                  {/* Card */}
                  <div
                    className={cn(
                      'flex-1 flex items-center gap-3 rounded-2xl border-2 p-3 overflow-hidden',
                      'shadow-md backdrop-blur-sm transition-opacity',
                      isLocked ? 'bg-white/50 border-slate-100 opacity-70' : card,
                    )}
                  >
                    {/* Kind thumbnail */}
                    <KindThumb kind={level.kind} />

                    {/* Text area */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-green-600 uppercase tracking-wider leading-none mb-0.5">
                        {t.levelN(i + 1)}
                      </p>
                      <p
                        className={cn(
                          'font-bold text-base leading-tight',
                          isLocked ? 'text-slate-400' : 'text-slate-800',
                        )}
                      >
                        {t.levelKindNames[level.kind]}
                      </p>
                      <p
                        className={cn(
                          'text-xs leading-snug mt-0.5',
                          isLocked ? 'text-slate-300' : 'text-slate-500',
                        )}
                      >
                        {isLocked
                          ? t.completePreviousLevel
                          : t.levelKindDescs[level.kind]}
                      </p>
                      {status === 'completed' && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-green-700 uppercase tracking-wide">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          {t.levelCompletedTag}
                        </span>
                      )}
                    </div>

                    {/* Action button */}
                    {status === 'unlocked' && (
                      <button
                        onClick={() => onStart(i, false)}
                        className="shrink-0 flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-4 py-2 rounded-full font-bold text-sm shadow-md transition-all touch-manipulation pointer-events-auto"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {t.startLevelLabel}
                      </button>
                    )}
                    {status === 'completed' && (
                      <button
                        onClick={() => onStart(i, true)}
                        className="shrink-0 flex items-center gap-1.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border-2 border-slate-300 px-3 py-2 rounded-full font-bold text-sm transition-all touch-manipulation pointer-events-auto"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {t.practiceReplay}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Encouragement banner ─────────────────────────────────────────── */}
      <div className="shrink-0 mx-4 mb-4 mt-2 bg-amber-50/95 backdrop-blur border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-md pointer-events-none">
        <Trophy className="w-8 h-8 text-amber-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 leading-tight">{t.zoneEncouragement}</p>
          <p className="text-sm text-slate-600 leading-tight">{t.zoneEncouragementSub}</p>
        </div>
        <Star className="w-8 h-8 fill-amber-400 text-amber-400 shrink-0" />
      </div>
    </div>
  );
}
