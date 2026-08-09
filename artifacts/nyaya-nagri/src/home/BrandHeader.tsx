/** Nyaya Nagri — Home brand block (top-left): crest + wordmark + tagline. */
import React from 'react';
import { useStrings } from '@/i18n/strings';
import { JusticeCrest } from '@/ui/JusticeCrest';

export function BrandHeader() {
  const t = useStrings();

  return (
    <header className="absolute left-3 top-3 z-20 md:left-5 md:top-4">
      {/* IMAGE 4 reference: crest + stacked wordmark side by side, tagline on
          its own line UNDER the whole lockup, starting at the crest's edge. */}
      <div className="flex items-center gap-2.5 md:gap-3.5">
        <JusticeCrest className="w-12 drop-shadow-[0_6px_8px_rgba(15,23,42,0.45)] md:w-16" />
        <h1 className="font-display font-bold leading-[0.95] tracking-tight">
          <span className="block text-2xl text-orange-500 drop-shadow-[0_1px_0_rgba(255,255,255,0.85)] md:text-4xl">
            NYAYA
          </span>
          <span className="block text-2xl text-[#15346f] drop-shadow-[0_1px_0_rgba(255,255,255,0.85)] md:text-4xl">
            NAGRI
          </span>
        </h1>
      </div>
      <p className="mt-1 hidden text-xs font-bold text-slate-800/90 drop-shadow-[0_1px_0_rgba(255,255,255,0.75)] sm:block md:mt-1.5 md:text-sm">
        {t.homeTagline}
      </p>
    </header>
  );
}
