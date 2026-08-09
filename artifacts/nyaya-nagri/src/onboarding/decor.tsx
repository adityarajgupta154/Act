/**
 * Nyaya Nagri — shared onboarding scene decorations.
 * The step-dots pill and the gold star rule used by the plaza sign-board
 * scenes (language selection, how-it-works). One source, so the indicator
 * and trim can never drift between steps of the same journey.
 */
import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/** The 5-step onboarding indicator, legible over the sky. */
export function StepDots({ step, stepCount }: { step: number; stepCount: number }) {
  return (
    <div
      className="flex justify-center gap-2 rounded-full bg-slate-900/25 px-3.5 py-2 backdrop-blur-sm ring-1 ring-white/25"
      aria-hidden="true"
    >
      {Array.from({ length: stepCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-2.5 rounded-full transition-all duration-300',
            i === step ? 'w-8 bg-orange-400' : 'w-2.5 bg-white/70',
          )}
        />
      ))}
    </div>
  );
}

/** Gold rule with a star in the middle, as on the reference sign-board. */
export function StarRule({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex items-center justify-center gap-3 my-3 md:my-4', className)}
      aria-hidden="true"
    >
      <span className="h-[3px] w-16 md:w-24 rounded-full bg-gradient-to-r from-transparent to-amber-400/80" />
      <Star className="w-5 h-5 md:w-6 md:h-6 text-amber-500 fill-amber-400 drop-shadow-sm" />
      <span className="h-[3px] w-16 md:w-24 rounded-full bg-gradient-to-l from-transparent to-amber-400/80" />
    </div>
  );
}
