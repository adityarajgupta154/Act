/**
 * Nyaya Nagri — Home secondary actions: "Explore Nyaya Nagri" + "How It Works".
 * Explore uses the SAME enter handler as the primary CTA — it can never
 * bypass language, age-band or guardian-consent steps.
 */
import React from 'react';
import { Map as MapIcon, Play } from 'lucide-react';
import { useStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';

const secondaryButtonClass = cn(
  'flex items-center gap-2 rounded-full font-bold text-slate-700',
  'bg-gradient-to-b from-white to-amber-50 hover:to-amber-100',
  'border-b-4 border-amber-300 ring-1 ring-amber-200/80',
  'px-5 py-2.5 text-sm md:px-6 md:py-3 md:text-base xl:px-8 xl:py-3.5 xl:text-lg',
  'shadow-[0_10px_20px_-10px_rgba(120,80,20,0.6)]',
  'transition-all duration-150 active:translate-y-0.5 active:border-b-2 touch-manipulation',
);

export function SecondaryActions({ onExplore, onHowItWorks }: { onExplore: () => void; onHowItWorks: () => void }) {
  const t = useStrings();

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 md:gap-4">
      <button onClick={onExplore} className={secondaryButtonClass}>
        <MapIcon className="h-5 w-5 text-blue-700" aria-hidden="true" />
        {t.homeExplore}
      </button>
      <button onClick={onHowItWorks} className={secondaryButtonClass}>
        <Play className="h-5 w-5 fill-blue-700 text-blue-700" aria-hidden="true" />
        {t.howItWorksTitle}
      </button>
    </div>
  );
}
