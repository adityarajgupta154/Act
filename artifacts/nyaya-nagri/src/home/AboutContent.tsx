/**
 * Nyaya Nagri — shared About panel body. Rendered by the Home screen's
 * About dialog AND the onboarding how-it-works scene's About pill, so the
 * project description exists exactly once.
 */
import React from 'react';
import { useStrings } from '@/i18n/strings';
import { JusticeCrest } from '@/ui/JusticeCrest';

export function AboutContent() {
  const t = useStrings();

  return (
    <div className="flex flex-col items-center pt-2 text-center">
      <JusticeCrest className="w-16 md:w-20" />
      <h2 className="mt-3 font-display font-bold text-2xl text-slate-800 md:text-3xl">
        {t.homeAboutTitle}
      </h2>
      <p className="mt-1 font-display font-semibold text-sm text-orange-600">{t.homeTagline}</p>
      <div className="mt-4 space-y-3 text-left">
        {t.homeAboutBody.map((paragraph, i) => (
          <p key={i} className="text-sm md:text-[15px] font-medium leading-relaxed text-slate-600">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
