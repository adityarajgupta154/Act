/**
 * SpCompletionPanel — the "You did it!" achievement heart of the Safe Path
 * Adventure completion design (user's reference image, Aug 2026): park
 * scene card (headline + subtitle + live stat cards + SAFE ZONE sign +
 * celebrating guide boy), the Safety Champion ribbon, the Game-completed
 * status pill and the three action buttons.
 *
 * Shared by BOTH completion surfaces so they can never drift apart:
 *   - the in-game success phase (SafePathGame, right after the maze), and
 *   - zone1's landing card once the game gate is earned (GameQuestFlow).
 *
 * Pure presentational: everything arrives via props. stats may be null
 * (landing card before any run is recorded on this device) — the stat row
 * simply hides, everything else stays identical. No store/fetch/AI here —
 * same purity rule as the rest of src/games/safepath/.
 */
import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Map as MapIcon,
  RefreshCw,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { useStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';
import { SP_BG_URL, SP_HERO_URL } from './data';

/** One finished maze run's numbers (frozen the moment the goal is reached). */
export interface SpRunStats {
  score: number;
  safeDecisions: number;
  wrongDecisions: number;
  elapsedSec: number;
}

/** mm:ss (leading zeros) for the Time Taken card. */
export const fmtTime = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export function SpCompletionPanel({
  stats,
  onBackToMap,
  onContinue,
  onPlayAgain,
}: {
  /** Last finished run, or null → stat cards hide (rest stays identical). */
  stats: SpRunStats | null;
  onBackToMap: () => void;
  onContinue: () => void;
  onPlayAgain: () => void;
}) {
  const t = useStrings();
  const [didItSubA, didItSubB] = t.spDidItSub.split('|SZ|');
  const statCards = stats
    ? [
        {
          label: t.chScoreLabel,
          value: String(stats.score),
          unit: t.spPointsUnit,
          icon: <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500 fill-amber-400" aria-hidden />,
          border: 'border-amber-200',
          labelColor: 'text-amber-700',
        },
        {
          label: t.spStatChoices,
          value: `${stats.safeDecisions}/${Math.max(1, stats.safeDecisions + stats.wrongDecisions)}`,
          unit: t.spCorrectUnit,
          icon: <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-500 fill-rose-400" aria-hidden />,
          border: 'border-rose-200',
          labelColor: 'text-rose-700',
        },
        {
          label: t.spStatTime,
          value: fmtTime(stats.elapsedSec),
          unit: t.spMinutesUnit,
          icon: <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600" aria-hidden />,
          border: 'border-emerald-200',
          labelColor: 'text-emerald-700',
        },
      ]
    : null;

  return (
    <div className="w-full">
      {/* achievement scene */}
      <div className="relative overflow-hidden rounded-[1.4rem] md:rounded-[1.8rem] border-2 border-emerald-100 shadow-sm">
        <img
          src={SP_BG_URL}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover select-none"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/75 to-white/35" />
        <div className="relative grid md:grid-cols-[1fr_auto] gap-3 md:gap-5 p-4 md:p-6 pb-7 md:pb-9">
          <div>
            <h2 className="font-display font-extrabold text-2xl md:text-4xl text-violet-700 sp-pop">
              {t.spDidIt} <span aria-hidden>🎉</span>
            </h2>
            <p className="font-semibold text-slate-700 text-sm md:text-base mt-1.5 max-w-md">
              {didItSubA}
              <span className="font-extrabold text-emerald-600">{t.spSafeZoneWord}</span>
              {didItSubB}
            </p>
            {statCards && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 max-w-md">
                {statCards.map((sc, i) => (
                  <div
                    key={sc.label}
                    className={cn('bg-white/95 border-2 rounded-2xl px-3 py-2.5 text-center shadow-sm sp-pop', sc.border)}
                    style={{ animationDelay: `${0.15 + i * 0.12}s` }}
                  >
                    <p className={cn('flex items-center justify-center gap-1 text-[10px] md:text-xs font-extrabold uppercase tracking-wide', sc.labelColor)}>
                      {sc.icon}
                      {sc.label}
                    </p>
                    <p className="font-display font-extrabold text-xl md:text-2xl text-slate-800 tabular-nums mt-0.5">{sc.value}</p>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400">{sc.unit}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* victorious kid + glowing Safe Zone sign */}
          <div className="flex md:flex-col items-center justify-center gap-3 md:gap-1.5 md:self-end md:pr-1">
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-b from-emerald-500 to-emerald-700 text-white font-display font-extrabold text-xs md:text-sm px-3 py-1 rounded-lg shadow-md border-2 border-emerald-300/60 rotate-2 whitespace-nowrap">
                {t.spSafeZone}
              </div>
              <div className="relative mt-1.5">
                <div aria-hidden className="absolute inset-0 m-auto w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-300/70 blur-md sp-glow" />
                <div className="relative w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/90 border-2 border-emerald-300 shadow flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" aria-hidden />
                </div>
              </div>
            </div>
            <img
              src={SP_HERO_URL}
              alt=""
              aria-hidden
              draggable={false}
              className="h-32 md:h-48 object-contain drop-shadow-lg select-none sp-pop"
              style={{ animationDelay: '0.25s' }}
            />
          </div>
        </div>
      </div>

      {/* Safety Champion ribbon (overlaps the scene's bottom edge) */}
      <div className="relative z-10 flex justify-center -mt-4 md:-mt-5">
        <div className="relative">
          <div aria-hidden className="absolute -left-4 top-2 bottom-1 w-6 bg-violet-800 [clip-path:polygon(100%_0,100%_100%,0_100%,35%_50%,0_0)]" />
          <div aria-hidden className="absolute -right-4 top-2 bottom-1 w-6 bg-violet-800 [clip-path:polygon(0_0,0_100%,100%_100%,65%_50%,100%_0)]" />
          <p className="relative inline-flex items-center gap-2 bg-gradient-to-b from-violet-500 to-violet-700 text-white font-display font-extrabold text-sm md:text-lg px-5 md:px-7 py-1.5 md:py-2 rounded-xl shadow-lg border-2 border-violet-300/50">
            <Star className="w-4 h-4 text-amber-300 fill-amber-300" aria-hidden />
            {t.spYouAreChampion}
            <Star className="w-4 h-4 text-amber-300 fill-amber-300" aria-hidden />
          </p>
        </div>
      </div>

      {/* completion badge (status, not a button) */}
      <div className="flex justify-center mt-3 md:mt-4">
        <p role="status" className="inline-flex items-center gap-1.5 bg-emerald-50 border-2 border-emerald-300 text-emerald-700 font-bold text-sm md:text-base px-4 py-1.5 rounded-full">
          <CheckCircle2 className="w-4 h-4" aria-hidden />
          {t.spGameCompleted}
        </p>
      </div>

      {/* actions — Continue leads on mobile, centered row on desktop */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center md:justify-center gap-2.5 md:gap-4 mt-4 md:mt-5">
        <button
          type="button"
          onClick={onBackToMap}
          className="order-2 md:order-1 inline-flex items-center justify-center gap-2 bg-white hover:bg-sky-50 active:bg-sky-100 text-sky-600 border-2 border-sky-300 font-extrabold text-sm md:text-base px-5 py-3 rounded-full shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-95 touch-manipulation focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
        >
          <MapIcon className="w-4 h-4 md:w-5 md:h-5" aria-hidden />
          {t.spBackToMap}
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="order-1 md:order-2 inline-flex items-center justify-center gap-2 bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-600 text-white font-extrabold text-base md:text-lg px-8 py-3.5 rounded-full shadow-lg shadow-orange-500/30 transition-all duration-200 hover:scale-[1.03] hover:shadow-xl active:scale-95 touch-manipulation focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
        >
          {t.continueLabel}
          <ArrowRight className="w-5 h-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onPlayAgain}
          className="order-3 inline-flex items-center justify-center gap-2 bg-white hover:bg-violet-50 active:bg-violet-100 text-violet-600 border-2 border-violet-300 font-extrabold text-sm md:text-base px-5 py-3 rounded-full shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-95 touch-manipulation focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
        >
          <RefreshCw className="w-4 h-4 md:w-5 md:h-5" aria-hidden />
          {t.chPlayAgain}
        </button>
      </div>
    </div>
  );
}
