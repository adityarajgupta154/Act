/**
 * Nyaya Nagri — Memory Cards activity (Task 18)
 *
 * Flip-and-match: pair each right/law name with its short meaning. Content
 * is static and reformatted from the zone's existing story text — never new
 * legal claims. Gentle by design (PRD §9.6): no timer, no move counter, no
 * failure — the recorded score is completion (all pairs found).
 *
 * Term cards and meaning cards use two different tints on purpose: a term
 * always matches a meaning, which keeps the game fair and readable for the
 * text-heavy meaning cards.
 */
import React, { useEffect, useRef, useState } from 'react';
import type { MemoryLevelContent } from '../schema';
import type { UIStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';
import { CheckCircle2, Layers, Sparkles } from 'lucide-react';

interface MemoryCard {
  id: number;
  pairIndex: number;
  side: 'term' | 'match';
  text: string;
}

function buildDeck(content: MemoryLevelContent): MemoryCard[] {
  const cards: MemoryCard[] = content.pairs.flatMap((p, i) => [
    { id: i * 2, pairIndex: i, side: 'term' as const, text: p.term },
    { id: i * 2 + 1, pairIndex: i, side: 'match' as const, text: p.match },
  ]);
  // Fisher-Yates — shuffled once per session (state initializer).
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function MemoryLevel({
  content,
  t,
  narrate,
  onComplete,
}: {
  content: MemoryLevelContent;
  t: UIStrings;
  narrate: (parts: string[]) => void;
  onComplete: (score: number) => void;
}) {
  const [deck] = useState<MemoryCard[]>(() => buildDeck(content));
  const [faceUp, setFaceUp] = useState<number[]>([]); // card ids, max 2
  const [matched, setMatched] = useState<Set<number>>(new Set()); // pairIndexes
  const [banner, setBanner] = useState<'match' | 'miss' | null>(null);
  const flipBackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Synchronous mirror of faceUp: rapid taps land before React rerenders,
  // and the stale state would let a second tap overwrite the first flip.
  const faceUpRef = useRef<number[]>([]);
  const setUp = (ids: number[]) => {
    faceUpRef.current = ids;
    setFaceUp(ids);
  };

  useEffect(
    () => () => {
      if (flipBackTimer.current) clearTimeout(flipBackTimer.current);
    },
    [],
  );

  const total = content.pairs.length;
  const allFound = matched.size === total;

  const tapCard = (card: MemoryCard) => {
    const up = faceUpRef.current;
    if (matched.has(card.pairIndex)) return;
    if (up.includes(card.id)) return;
    if (up.length === 2) return; // waiting for the flip-back

    const nextUp = [...up, card.id];
    setUp(nextUp);
    if (nextUp.length < 2) return;

    const [a, b] = nextUp.map((id) => deck.find((c) => c.id === id)!);
    if (a.pairIndex === b.pairIndex && a.side !== b.side) {
      setMatched((prev) => new Set(prev).add(card.pairIndex));
      setBanner('match');
      setUp([]);
      narrate([t.memoryMatchFound, content.pairs[card.pairIndex].term, content.pairs[card.pairIndex].match]);
    } else {
      setBanner('miss');
      flipBackTimer.current = setTimeout(() => {
        setUp([]);
        setBanner(null);
      }, 1400);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-amber-50 rounded-2xl p-4 md:p-5 border border-amber-100">
        <p className="text-base md:text-lg font-medium text-slate-800 leading-relaxed">
          {content.intro}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wide">
          {t.memoryPairsFound(matched.size, total)}
        </span>
        {banner === 'match' && (
          <span className="text-sm font-bold text-green-700 flex items-center gap-1.5 animate-in fade-in duration-200">
            <Sparkles className="w-4 h-4" /> {t.memoryMatchFound}
          </span>
        )}
        {banner === 'miss' && (
          <span className="text-sm font-bold text-sky-700 animate-in fade-in duration-200">
            {t.memoryNotAMatch}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {deck.map((card) => {
          const isMatched = matched.has(card.pairIndex);
          const isUp = isMatched || faceUp.includes(card.id);
          return (
            <button
              key={card.id}
              onClick={() => tapCard(card)}
              disabled={isMatched || allFound}
              aria-pressed={isUp}
              className={cn(
                'relative min-h-24 md:min-h-28 rounded-2xl border-2 p-2.5 text-left transition-all touch-manipulation flex items-center justify-center',
                !isUp && 'bg-slate-100 border-slate-200 hover:border-sky-300 active:scale-95 cursor-pointer',
                isUp && card.side === 'term' && 'bg-orange-50 border-orange-200',
                isUp && card.side === 'match' && 'bg-sky-50 border-sky-200',
                isMatched && 'opacity-80',
              )}
            >
              {isUp ? (
                <span
                  className={cn(
                    'font-medium leading-snug',
                    card.side === 'term'
                      ? 'text-orange-800 font-bold text-sm md:text-base text-center'
                      : 'text-slate-700 text-xs md:text-sm',
                  )}
                >
                  {card.text}
                </span>
              ) : (
                <Layers className="w-7 h-7 text-slate-400" />
              )}
              {isMatched && (
                <CheckCircle2 className="absolute top-1.5 right-1.5 w-5 h-5 text-green-500" />
              )}
            </button>
          );
        })}
      </div>

      {allFound && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 text-center animate-in zoom-in-95 duration-200">
          <p className="text-lg font-bold text-green-700 mb-4">{t.memoryPairsFound(total, total)}</p>
          <button
            onClick={() => onComplete(total)}
            className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-8 py-3.5 rounded-full font-bold text-lg transition-transform active:scale-95 shadow-md touch-manipulation"
          >
            {t.activityFinish}
          </button>
        </div>
      )}
    </div>
  );
}
