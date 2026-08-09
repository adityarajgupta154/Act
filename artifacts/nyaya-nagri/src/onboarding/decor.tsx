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
/** One gold laurel branch, as on the reference crests. Mirror with -scale-x-100. */
export function Laurel({ className }: { className?: string }) {
  const leaves: Array<[number, number, number]> = [
    [34, 78, -26],
    [26, 62, -32],
    [20, 46, -40],
    [16, 31, -50],
    [15, 17, -62],
    [40, 62, 34],
    [33, 45, 26],
    [29, 29, 16],
  ];
  return (
    <svg viewBox="0 0 52 96" className={className} aria-hidden="true" focusable="false">
      <path
        d="M44 92C29 80 18 60 15 30"
        fill="none"
        stroke="#c9902b"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {leaves.map(([cx, cy, rot], i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx="12"
          ry="6.2"
          transform={`rotate(${rot} ${cx} ${cy})`}
          fill={i % 2 ? '#e7b64a' : '#f2cc6c'}
        />
      ))}
    </svg>
  );
}

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
