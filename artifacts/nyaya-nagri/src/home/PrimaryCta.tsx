/**
 * Nyaya Nagri — Home primary CTA: "ENTER NYAYA NAGRI" + "Your journey begins
 * here" chip. Pure HTML/CSS (3D-style depth via shadows only, brief §9).
 */
import React from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { useStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';

export function PrimaryCta({ onEnter }: { onEnter: () => void }) {
  const t = useStrings();

  return (
    <>
      <button
        onClick={onEnter}
        className={cn(
          'flex items-center gap-3 rounded-full font-display font-bold uppercase tracking-wide text-white',
          'bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-400 hover:to-orange-500',
          'border-b-4 border-orange-800 ring-2 ring-white/60',
          'px-8 py-3.5 text-2xl md:px-14 md:py-4 md:text-3xl xl:px-20 xl:py-5 xl:text-4xl',
          'shadow-[0_18px_35px_-12px_rgba(194,65,12,0.9)]',
          'transition-all duration-150 motion-safe:hover:scale-[1.02] motion-safe:hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2 touch-manipulation',
        )}
      >
        {t.homeEnterCta}
        <ArrowRight className="h-7 w-7 md:h-8 md:w-8 xl:h-10 xl:w-10" aria-hidden="true" />
      </button>

      <p className="flex items-center gap-2 rounded-full bg-[#fdf5e0]/90 px-4 py-1 ring-1 ring-amber-300/70 shadow-md md:py-1.5 xl:px-6 xl:py-2">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500 xl:h-4 xl:w-4" aria-hidden="true" />
        <span className="font-display text-sm font-semibold text-[#8a5a18] md:text-base xl:text-lg">{t.homeJourney}</span>
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500 xl:h-4 xl:w-4" aria-hidden="true" />
      </p>
    </>
  );
}
