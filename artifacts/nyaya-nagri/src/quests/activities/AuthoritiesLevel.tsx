/**
 * Nyaya Nagri — "Meet the Authorities" hub activity (Task 20, Zone 6)
 *
 * A tap-through gallery of the real child-protection bodies (PRD §4.2 CPCR
 * Act row, §4.3 directory): tap each card to reveal a one-line explainer of
 * what that body does for children. Completion-based by gentle design —
 * viewing every card completes the level; there is no wrong answer and no
 * score pressure (PRD §9.6).
 *
 * The "Childline 1098 first" reminder under the cards comes from the i18n
 * bundles (t.authoritiesRememberLine) — helpline text stays hard-coded in
 * strings, never in content JSON (PRD §9.8), exactly like the sorting
 * activity's bucket labels.
 */
import React, { useRef, useState } from 'react';
import type { AuthoritiesLevelContent } from '../schema';
import type { UIStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';
import { Landmark, CheckCircle2, ChevronDown, ArrowRight, PhoneCall } from 'lucide-react';

export function AuthoritiesLevel({
  content,
  t,
  narrate,
  onComplete,
}: {
  content: AuthoritiesLevelContent;
  t: UIStrings;
  narrate: (parts: string[]) => void;
  onComplete: (score: number) => void;
}) {
  const [viewed, setViewed] = useState<Set<string>>(new Set());
  // Synchronous guard against double-fire of the final button.
  const finishedRef = useRef(false);
  const total = content.authorities.length;
  const allViewed = viewed.size === total;

  const view = (authorityId: string) => {
    if (viewed.has(authorityId)) return;
    const card = content.authorities.find((a) => a.authorityId === authorityId);
    setViewed((prev) => new Set(prev).add(authorityId));
    if (card) narrate([card.name, card.role]);
  };

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onComplete(viewed.size);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-teal-50 rounded-2xl p-5 md:p-6 border border-teal-100">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-bold mb-3 uppercase tracking-wide">
          <Landmark className="w-4 h-4" /> {t.levelKindNames.authorities}
        </span>
        <p className="text-lg md:text-xl font-medium text-slate-800 leading-relaxed">
          {content.intro}
        </p>
        <p className="text-sm font-bold text-teal-700 mt-3">{t.authoritiesTapHint}</p>
      </div>

      <div className="flex flex-col gap-3">
        {content.authorities.map((card) => {
          const open = viewed.has(card.authorityId);
          return (
            <button
              key={card.authorityId}
              onClick={() => view(card.authorityId)}
              aria-expanded={open}
              className={cn(
                'text-left w-full p-4 md:p-5 rounded-2xl border-2 transition-all shadow-sm touch-manipulation',
                open
                  ? 'border-teal-200 bg-teal-50'
                  : 'border-slate-100 bg-white hover:border-teal-300 hover:bg-teal-50/50 active:bg-teal-50',
              )}
            >
              <span className="flex items-center gap-3">
                {open ? (
                  <CheckCircle2 className="w-6 h-6 text-teal-600 shrink-0" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-slate-400 shrink-0" />
                )}
                <span className="text-lg font-bold text-slate-800">{card.name}</span>
              </span>
              {open && (
                <span className="block mt-2 pl-9 text-lg text-slate-700 font-medium leading-relaxed animate-in fade-in duration-200">
                  {card.role}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-start gap-3">
        <PhoneCall className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-600 font-medium leading-relaxed">
          {t.authoritiesRememberLine}
        </p>
      </div>

      {allViewed && (
        <button
          onClick={finish}
          className="self-start px-6 py-3 rounded-full font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm flex items-center gap-2 transition-transform active:scale-95 touch-manipulation animate-in zoom-in-95 duration-200"
        >
          {t.activityFinish} <ArrowRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
