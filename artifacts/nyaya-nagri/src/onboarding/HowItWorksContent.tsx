/**
 * "How it works" — the SINGLE shared screen content (PRD §6 intro).
 * Rendered by onboarding step 1 AND by the Home screen's "How It Works"
 * dialog, so the explanation is never duplicated and never drifts.
 * Presentation only: strings come from i18n, nothing is stored.
 */
import React from 'react';
import { Map as MapIcon, MessageCircle, ShieldAlert, Award } from 'lucide-react';
import { useStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';

export function HowItWorksContent() {
  const t = useStrings();

  const introIcons = [
    <MapIcon key="map" className="w-5 h-5" />,
    <Award key="award" className="w-5 h-5" />,
    <MessageCircle key="chat" className="w-5 h-5" />,
    <ShieldAlert key="shield" className="w-5 h-5" />,
  ];

  return (
    <div>
      <h2 className="font-display font-bold text-2xl md:text-3xl text-slate-800 mb-6 text-center">
        {t.howItWorksTitle}
      </h2>
      <ul className="space-y-4 mb-8">
        {t.howItWorksPoints.map((point, i) => (
          <li key={i} className="flex items-start gap-3">
            <div
              className={cn(
                'p-2.5 rounded-xl shrink-0',
                i === 3 ? 'bg-red-50 text-red-500' : 'bg-sky-50 text-sky-600',
              )}
            >
              {introIcons[i]}
            </div>
            <p className="text-slate-700 font-medium leading-relaxed mt-1">{point}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
