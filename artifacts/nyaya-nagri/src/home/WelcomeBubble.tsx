/**
 * Nyaya Nagri — Home welcome speech bubble (near the guide boy).
 * A wave ICON stands in for the reference image's wave emoji — the project's
 * hard no-emoji rule (PRD §9 house rules) applies to all UI text.
 */
import React from 'react';
import { Hand } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WelcomeBubble({
  className,
  hey,
  title,
  body,
}: {
  className?: string;
  hey: string;
  title: string;
  body: string;
}) {
  return (
    <div
      className={cn(
        'relative rounded-2xl bg-[#fdf5e0]/95 p-3.5 md:p-4 ring-1 ring-amber-300/70',
        'shadow-[0_16px_30px_-14px_rgba(15,23,42,0.7)] backdrop-blur-[2px]',
        'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700',
        className,
      )}
    >
      <span
        className="absolute -bottom-1.5 right-8 h-3.5 w-3.5 rotate-45 bg-[#fdf5e0]/95 ring-1 ring-amber-300/70 [clip-path:polygon(100%_0,100%_100%,0_100%)]"
        aria-hidden="true"
      />
      <p className="flex items-center gap-1.5 font-display font-bold text-base text-amber-600">
        <Hand className="w-5 h-5 -rotate-[20deg] text-amber-500 fill-amber-200" aria-hidden="true" />
        {hey}
      </p>
      <p className="mt-0.5 font-display font-bold text-[15px] md:text-base leading-snug text-[#15346f]">{title}</p>
      <p className="mt-1 text-[13px] md:text-sm font-medium leading-snug text-slate-600">{body}</p>
    </div>
  );
}
