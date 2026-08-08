/**
 * Nyaya Nagri — Puzzle/Sorting activity (Task 18)
 *
 * Sort scenario cards into "Safe" / "Tell a Trusted Adult" / "Emergency —
 * Call Childline 1098". One card at a time, tap-to-place (deliberately not
 * pointer-drag: works identically for touch, mouse, and switch access).
 * Bucket labels are hard-coded i18n strings — the emergency bucket carries
 * the canonical Childline wording, never content-JSON text.
 *
 * One placement per card with immediate, gentle feedback: a misplaced card
 * shows where it belongs and why — no retry loop, no guilt (PRD §9.6). The
 * recorded score counts first-try correct placements.
 */
import React, { useRef, useState } from 'react';
import type { SortingLevelContent, SortBucketId } from '../schema';
import { SORT_BUCKET_IDS } from '../schema';
import type { UIStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';
import { CheckCircle2, Lightbulb, ArrowRight, ShieldCheck, Users, PhoneCall } from 'lucide-react';

const BUCKET_STYLES: Record<SortBucketId, { base: string; icon: React.ReactNode }> = {
  safe: {
    base: 'border-green-200 bg-green-50 hover:bg-green-100 active:bg-green-200 text-green-800',
    icon: <ShieldCheck className="w-6 h-6 text-green-600" />,
  },
  tell: {
    base: 'border-sky-200 bg-sky-50 hover:bg-sky-100 active:bg-sky-200 text-sky-800',
    icon: <Users className="w-6 h-6 text-sky-600" />,
  },
  emergency: {
    base: 'border-red-200 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-800',
    icon: <PhoneCall className="w-6 h-6 text-red-600" />,
  },
};

export function SortingLevel({
  content,
  t,
  narrate,
  onComplete,
}: {
  content: SortingLevelContent;
  t: UIStrings;
  narrate: (parts: string[]) => void;
  onComplete: (score: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  // Synchronous lock: two rapid taps land before React rerenders, so the
  // state-based `feedback` guard alone would let a card score twice.
  const placedRef = useRef(false);

  const total = content.cards.length;
  const done = index >= total;
  const card = done ? null : content.cards[index];

  const place = (bucket: SortBucketId) => {
    if (!card || feedback || placedRef.current) return;
    placedRef.current = true;
    const correct = bucket === card.bucket;
    if (correct) setScore((s) => s + 1);
    const heading = correct
      ? t.sortingRightPlace
      : t.sortingBelongsIn(t.sortingBucketNames[card.bucket]);
    setFeedback({ correct, text: card.feedback });
    narrate([heading, card.feedback]);
  };

  const next = () => {
    placedRef.current = false;
    setFeedback(null);
    setIndex((i) => i + 1);
  };

  if (done) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center animate-in zoom-in-95 duration-200">
        <p className="text-lg font-bold text-green-700 mb-4 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-6 h-6" /> {t.youGotXofY(score, total)}
        </p>
        <button
          onClick={() => onComplete(score)}
          className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-8 py-3.5 rounded-full font-bold text-lg transition-transform active:scale-95 shadow-md touch-manipulation"
        >
          {t.activityFinish}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {index === 0 && !feedback && (
        <div className="bg-amber-50 rounded-2xl p-4 md:p-5 border border-amber-100">
          <p className="text-base md:text-lg font-medium text-slate-800 leading-relaxed">
            {content.intro}
          </p>
        </div>
      )}

      <span className="self-start text-sm font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wide">
        {t.sortingCardXofY(index + 1, total)}
      </span>

      {/* The card being sorted */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
        <p className="text-lg md:text-xl font-medium text-slate-800 leading-relaxed">
          {card!.text}
        </p>
      </div>

      {!feedback ? (
        <>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            {t.whereDoesThisGo}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SORT_BUCKET_IDS.map((bucket) => (
              <button
                key={bucket}
                onClick={() => place(bucket)}
                className={cn(
                  'rounded-2xl border-2 p-4 font-bold text-base text-left sm:text-center flex sm:flex-col items-center gap-3 sm:gap-2 transition-all active:scale-95 touch-manipulation shadow-sm',
                  BUCKET_STYLES[bucket].base,
                )}
              >
                {BUCKET_STYLES[bucket].icon}
                <span className="leading-snug">{t.sortingBucketNames[bucket]}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div
          className={cn(
            'p-5 rounded-2xl border-2 animate-in zoom-in-95 duration-200',
            feedback.correct ? 'bg-green-50 border-green-200' : 'bg-sky-50 border-sky-200',
          )}
        >
          <div className="flex items-start gap-3 mb-4">
            {feedback.correct ? (
              <CheckCircle2 className="w-7 h-7 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <Lightbulb className="w-7 h-7 text-sky-500 shrink-0 mt-0.5" />
            )}
            <div>
              <h4
                className={cn(
                  'font-bold text-lg mb-1',
                  feedback.correct ? 'text-green-700' : 'text-sky-700',
                )}
              >
                {feedback.correct
                  ? t.sortingRightPlace
                  : t.sortingBelongsIn(t.sortingBucketNames[card!.bucket])}
              </h4>
              <p className="text-slate-700 font-medium leading-relaxed">{feedback.text}</p>
            </div>
          </div>
          <button
            onClick={next}
            className={cn(
              'px-6 py-3 rounded-full font-bold text-white shadow-sm flex items-center gap-2 transition-transform active:scale-95 touch-manipulation',
              feedback.correct ? 'bg-green-600 hover:bg-green-700' : 'bg-sky-500 hover:bg-sky-600',
            )}
          >
            {t.continueLabel} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
