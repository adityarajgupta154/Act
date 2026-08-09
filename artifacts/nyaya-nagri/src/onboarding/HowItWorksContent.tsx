/**
 * "How it works" — the SINGLE shared screen content (PRD §6 intro).
 * Rendered by onboarding step 1's plaza scene AND by the Home screen's
 * "How It Works" dialog, so the explanation is never duplicated and never
 * drifts. Presentation only: strings come from i18n, nothing is stored.
 *
 * Redesign (reference image): navy display title flanked by gold sparkles
 * over a star rule, then four cream info-board cards — a circular icon disc
 * (blue for explore/play/guide, red for safety) beside a bold heading and a
 * short description. Entrance is a subtle motion-safe stagger only.
 */
import React from 'react';
import { Map as MapIcon, MessageCircle, ShieldAlert, Award, Sparkles } from 'lucide-react';
import { useStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';
import { StarRule } from './decor';

export function HowItWorksContent() {
  const t = useStrings();

  const icons = [
    <MapIcon key="map" className="h-6 w-6 md:h-7 md:w-7" />,
    <Award key="award" className="h-6 w-6 md:h-7 md:w-7" />,
    <MessageCircle key="chat" className="h-6 w-6 md:h-7 md:w-7" />,
    <ShieldAlert key="shield" className="h-6 w-6 md:h-7 md:w-7" />,
  ];

  return (
    <div>
      <div className="mb-0.5 flex items-center justify-center gap-2.5 md:gap-3">
        <Sparkles
          className="h-5 w-5 shrink-0 fill-amber-400 text-amber-500 drop-shadow-sm md:h-6 md:w-6"
          aria-hidden="true"
        />
        <h2 className="font-display text-3xl font-bold leading-tight text-[#15346f] text-balance md:text-4xl">
          {t.howItWorksTitle}
        </h2>
        <Sparkles
          className="h-5 w-5 shrink-0 fill-amber-400 text-amber-500 drop-shadow-sm md:h-6 md:w-6"
          aria-hidden="true"
        />
      </div>
      <StarRule className="my-2 md:my-2.5" />
      <ul className="space-y-2.5 text-left md:space-y-3">
        {t.howItWorksCards.map((card, i) => (
          <li
            key={i}
            style={{ animationDelay: `${i * 80}ms` }}
            className={cn(
              'flex items-center gap-3 rounded-2xl p-2.5 pr-3.5 md:gap-4 md:p-3 md:pr-5',
              'border border-amber-200/80 bg-gradient-to-b from-[#fffdf7] to-[#fbf1da]',
              'shadow-[0_10px_18px_-14px_rgba(120,80,20,0.65),inset_0_1px_0_rgba(255,255,255,0.95)]',
              'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both motion-safe:duration-300',
            )}
          >
            <span
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white md:h-14 md:w-14',
                'shadow-[0_8px_14px_-8px_rgba(120,80,20,0.7),inset_0_-3px_6px_rgba(176,134,72,0.16)] ring-2',
                i === 3 ? 'text-red-500 ring-red-200' : 'text-blue-600 ring-sky-200',
              )}
            >
              {icons[i]}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-display text-base font-bold leading-tight text-[#15346f] md:text-lg">
                {card.title}
              </span>
              <span className="text-[13px] font-medium leading-snug text-slate-600 md:text-sm">
                {card.body}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
