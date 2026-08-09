/**
 * Nyaya Nagri — Home welcome speech bubble (IMAGE 4 reference composition:
 * left side, beside the guide boy, tail pointing RIGHT at him on desktop).
 * A wave ICON stands in for the reference image's wave emoji — the project's
 * hard no-emoji rule (PRD §9 house rules) applies to all UI text.
 *
 * The brand name inside the title is highlighted orange exactly like the
 * reference. It is located by substring so the highlight works in every
 * language ("Nyaya Nagri" / "न्याय नगरी") without per-locale markup; any
 * punctuation straight after the brand ("!") stays highlighted with it.
 */
import React from 'react';
import { Hand } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WelcomeBubble({
  className,
  tail = 'right',
  hey,
  title,
  brand,
  body,
}: {
  className?: string;
  /** Which side the pointer sits on: 'right' (desktop, toward the boy) or 'bottom'. */
  tail?: 'right' | 'bottom';
  hey: string;
  title: string;
  /** Localized brand name used to color the matching part of `title`. */
  brand: string;
  body: string;
}) {
  const idx = title.indexOf(brand);
  let pre = title;
  let mark = '';
  let post = '';
  if (idx !== -1) {
    pre = title.slice(0, idx);
    let end = idx + brand.length;
    while (end < title.length && '!！'.includes(title[end])) end += 1;
    mark = title.slice(idx, end);
    post = title.slice(end);
  }

  return (
    <div
      className={cn(
        'relative rounded-2xl bg-[#fdf6e3]/95 p-3.5 md:p-4 ring-1 ring-amber-200/80',
        'shadow-[0_16px_30px_-14px_rgba(15,23,42,0.7)] backdrop-blur-[2px]',
        className,
      )}
    >
      {tail === 'right' ? (
        <span
          className="absolute -right-1.5 top-[58%] h-3.5 w-3.5 rotate-45 bg-[#fdf6e3]/95 ring-1 ring-amber-200/80 [clip-path:polygon(0_0,100%_0,100%_100%)]"
          aria-hidden="true"
        />
      ) : (
        <span
          className="absolute -bottom-1.5 right-8 h-3.5 w-3.5 rotate-45 bg-[#fdf6e3]/95 ring-1 ring-amber-200/80 [clip-path:polygon(100%_0,100%_100%,0_100%)]"
          aria-hidden="true"
        />
      )}
      <p className="flex items-center gap-1.5 font-display font-bold text-base text-amber-500">
        {hey}
        <Hand className="w-5 h-5 -rotate-[20deg] text-amber-500 fill-amber-200" aria-hidden="true" />
      </p>
      <p className="mt-1 font-display font-bold text-[15px] md:text-base leading-snug text-[#15346f]">
        {pre}
        {mark && <span className="text-orange-600">{mark}</span>}
        {post}
      </p>
      <p className="mt-1.5 text-[12.5px] md:text-[13px] font-semibold leading-snug text-slate-600">{body}</p>
    </div>
  );
}
