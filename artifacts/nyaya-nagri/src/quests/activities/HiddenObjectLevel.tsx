/**
 * Nyaya Nagri — Hidden Object activity (Task 18, 8-11 band ONLY)
 *
 * A static illustrated scene where the child taps the gentle "something is
 * not right here" cues. Follows the Task 4 trauma-sensitivity rules: cues
 * are everyday, non-graphic observations; every explanation says clearly
 * that it is never the working child's fault and points to a trusted
 * grown-up and Childline 1098. Tapping a wrong spot gives a soft "keep
 * looking" — there is no failure state, and the recorded score is
 * completion (all cues found).
 */
import React, { useEffect, useRef, useState } from 'react';
import type { HiddenObjectLevelContent } from '../schema';
import type { UIStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';
import { CheckCircle2, Search, ArrowRight } from 'lucide-react';
import { HiddenScene } from './hiddenScenes';

const VIEW_W = 100;
const VIEW_H = 62.5;

export function HiddenObjectLevel({
  content,
  t,
  narrate,
  onComplete,
}: {
  content: HiddenObjectLevelContent;
  t: UIStrings;
  narrate: (parts: string[]) => void;
  onComplete: (score: number) => void;
}) {
  const [found, setFound] = useState<Set<string>>(new Set());
  const [activeCue, setActiveCue] = useState<string | null>(null);
  const [missToast, setMissToast] = useState(false);
  const missTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (missTimer.current) clearTimeout(missTimer.current);
    },
    [],
  );

  const total = content.cues.length;
  const allFound = found.size === total;
  const active = content.cues.find((c) => c.cueId === activeCue) ?? null;

  const tapCue = (cueId: string) => {
    if (found.has(cueId) || activeCue) return;
    const cue = content.cues.find((c) => c.cueId === cueId);
    if (!cue) return;
    setFound((prev) => new Set(prev).add(cueId));
    setActiveCue(cueId);
    setMissToast(false);
    narrate([cue.label, cue.explanation]);
  };

  const tapBackground = () => {
    if (activeCue || allFound) return;
    setMissToast(true);
    if (missTimer.current) clearTimeout(missTimer.current);
    missTimer.current = setTimeout(() => setMissToast(false), 1800);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-amber-50 rounded-2xl p-4 md:p-5 border border-amber-100">
        <p className="text-base md:text-lg font-medium text-slate-800 leading-relaxed">
          {content.intro}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wide flex items-center gap-1.5">
          <Search className="w-4 h-4" />
          {t.hiddenFoundXofY(found.size, total)}
        </span>
        {missToast && (
          <span className="text-sm font-bold text-sky-700 animate-in fade-in duration-200">
            {t.hiddenKeepLooking}
          </span>
        )}
      </div>

      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full h-auto block touch-manipulation"
          role="img"
          onClick={tapBackground}
        >
          <HiddenScene sceneKey={content.sceneKey} />
          {/* Tappable cue hotspots — invisible until found, then ringed. */}
          {content.cues.map((cue) => {
            const isFound = found.has(cue.cueId);
            return (
              <g key={cue.cueId}>
                <circle
                  cx={cue.x}
                  cy={(cue.y / 100) * VIEW_H}
                  r={cue.r}
                  fill="transparent"
                  stroke={isFound ? '#F59E0B' : 'transparent'}
                  strokeWidth={isFound ? 1 : 0}
                  strokeDasharray={isFound ? '2.5 1.5' : undefined}
                  // Keyboard/switch access: each cue is a focusable target
                  // with a visible focus ring (CSS stroke overrides the
                  // transparent presentation attribute) and Enter/Space
                  // activation — the aria-label names the spot, which is
                  // the accessible equivalent of "finding" it by sight.
                  className="cursor-pointer focus:outline-none focus-visible:[stroke:#0EA5E9] focus-visible:[stroke-width:1] focus-visible:[stroke-dasharray:2.5_1.5]"
                  role="button"
                  tabIndex={isFound ? -1 : 0}
                  aria-label={cue.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    tapCue(cue.cueId);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      tapCue(cue.cueId);
                    }
                  }}
                />
                {isFound && (
                  <circle
                    cx={cue.x + cue.r * 0.7}
                    cy={(cue.y / 100) * VIEW_H - cue.r * 0.7}
                    r={2}
                    fill="#22C55E"
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Explanation card for the cue just found */}
      {active && (
        <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-5 animate-in zoom-in-95 duration-200">
          <p className="font-bold text-sky-800 text-lg mb-1.5">{active.label}</p>
          <p className="text-slate-700 font-medium leading-relaxed mb-4">{active.explanation}</p>
          <button
            onClick={() => setActiveCue(null)}
            className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white px-6 py-3 rounded-full font-bold shadow-sm flex items-center gap-2 transition-transform active:scale-95 touch-manipulation"
          >
            {t.continueLabel} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {allFound && !active && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 text-center animate-in zoom-in-95 duration-200">
          <p className="text-lg font-bold text-green-700 mb-4 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-6 h-6" /> {t.hiddenAllFound}
          </p>
          <button
            onClick={() => onComplete(total)}
            className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-8 py-3.5 rounded-full font-bold text-lg transition-transform active:scale-95 shadow-md touch-manipulation"
          >
            {t.activityFinish}
          </button>
        </div>
      )}
    </div>
  );
}
