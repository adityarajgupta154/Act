/**
 * Nyaya Nagri — Scenario Selection activity (Task 18)
 *
 * A single-screen, one-decision scenario with immediate feedback — the
 * distilled version of the branching decision levels. Exactly one option is
 * correct (validated); the recorded score is 1/0 for the first pick, and
 * incorrect feedback always teaches the safe action rather than scolding
 * (PRD §9.6).
 */
import React, { useRef, useState } from 'react';
import type { ScenarioLevelContent } from '../schema';
import type { UIStrings } from '@/i18n/strings';
import type { ChoiceOutcome } from '../schema';
import { cn } from '@/lib/utils';
import { CheckCircle2, Lightbulb, Zap, ArrowRight } from 'lucide-react';

function feedbackColor(outcome: ChoiceOutcome) {
  switch (outcome) {
    case 'correct':
      return 'bg-green-50 border-green-200';
    case 'incorrect':
      return 'bg-orange-50 border-orange-200';
    case 'neutral':
      return 'bg-sky-50 border-sky-200';
  }
}

export function ScenarioLevel({
  content,
  t,
  narrate,
  onComplete,
}: {
  content: ScenarioLevelContent;
  t: UIStrings;
  narrate: (parts: string[]) => void;
  onComplete: (score: number) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  // Synchronous lock: a rapid second tap lands before React rerenders and
  // would otherwise replace the first (scored) choice.
  const pickedRef = useRef(false);
  const chosen = picked === null ? null : content.options[picked];

  const pick = (idx: number) => {
    if (picked !== null || pickedRef.current) return;
    pickedRef.current = true;
    setPicked(idx);
    narrate([content.options[idx].feedback]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-amber-50 rounded-2xl p-5 md:p-6 border border-amber-100">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold mb-3 uppercase tracking-wide">
          <Zap className="w-4 h-4" /> {t.levelKindNames.scenario}
        </span>
        <p className="text-lg md:text-xl font-medium text-slate-800 leading-relaxed">
          {content.prompt}
        </p>
      </div>

      {!chosen ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            {t.whatWillYouDo}
          </h3>
          {content.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => pick(idx)}
              className="text-left w-full p-4 md:p-5 rounded-2xl border-2 border-slate-100 hover:border-orange-300 hover:bg-orange-50 active:bg-orange-100 transition-all text-lg font-medium text-slate-700 shadow-sm touch-manipulation"
            >
              {opt.text}
            </button>
          ))}
        </div>
      ) : (
        <div
          className={cn(
            'p-5 md:p-6 rounded-2xl border-2 animate-in zoom-in-95 duration-200',
            feedbackColor(chosen.outcome),
          )}
        >
          <div className="flex items-start gap-3 mb-4">
            {chosen.outcome === 'correct' ? (
              <CheckCircle2 className="w-7 h-7 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <Lightbulb className="w-7 h-7 text-orange-500 shrink-0 mt-0.5" />
            )}
            <p className="text-lg text-slate-700 font-medium leading-relaxed">{chosen.feedback}</p>
          </div>
          <button
            onClick={() => onComplete(chosen.outcome === 'correct' ? 1 : 0)}
            className={cn(
              'px-6 py-3 rounded-full font-bold text-white shadow-sm flex items-center gap-2 transition-transform active:scale-95 touch-manipulation',
              chosen.outcome === 'correct'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-orange-500 hover:bg-orange-600',
            )}
          >
            {t.activityFinish} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
