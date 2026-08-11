/**
 * Nyaya Nagri — Home primary CTA: "ENTER NYAYA NAGRI". Pure HTML/CSS
 * (3D-style depth via shadows only, brief §9).
 *
 * Aug 2026 simplification (user reference image): the journey chip and
 * the secondary buttons are GONE — ENTER is Home's single CTA.
 *
 * Aug 2026 CTA-shrink task: every size tier ~15–20% smaller (padding,
 * type, arrow) so the button stops dominating the central building. All
 * design traits are deliberately verbatim — orange gradient, pill shape,
 * white uppercase display type, border-b depth, white ring, shadow and
 * hover/active motion (spec: resize + reposition only, no redesign).
 */
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';

export function PrimaryCta({ onEnter }: { onEnter: () => void }) {
  const t = useStrings();

  return (
    <button
      onClick={onEnter}
      className={cn(
        'flex items-center gap-3 rounded-full font-display font-bold uppercase tracking-wide text-white',
        'bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-400 hover:to-orange-500',
        'border-b-4 border-orange-800 ring-2 ring-white/60',
        'px-7 py-3 text-xl md:px-12 md:py-3.5 md:text-2xl xl:px-16 xl:py-4 xl:text-3xl',
        'shadow-[0_18px_35px_-12px_rgba(194,65,12,0.9)]',
        'transition-all duration-150 motion-safe:hover:scale-[1.02] motion-safe:hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2 touch-manipulation',
      )}
    >
      {t.homeEnterCta}
      <ArrowRight className="h-6 w-6 md:h-7 md:w-7 xl:h-8 xl:w-8" aria-hidden="true" />
    </button>
  );
}
