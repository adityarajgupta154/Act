/**
 * Nyaya Nagri — Story Adventure overlay (slide-show story player).
 *
 * A deterministic, cinematic slide player for the house-entrance story
 * levels (storyData.ts). NOTHING here is AI-generated or fetched: the
 * captions, choices, correct answer and all feedback are fixed data
 * (PRD §9.8 / spec §20). A wrong choice gets gentle, blame-free feedback
 * and a Try Again loop — there is no fail state and no completion without
 * the correct choice (PRD §9.6). The bottom bar OWNS the single right-side
 * action (idle = disabled Next, wrong = Try Again, correct = Next, via
 * actionState); the feedback card is text-only, so duplicate or
 * overlapping action buttons cannot render.
 *
 * Slides show the child's own uploaded artwork once it ships; while a
 * slide's `image` is null the soft placeholder frame renders instead (art
 * is never recreated or generated). The RESULT slide is built purely from
 * the game's existing card styling, per the spec's no-image fallback rule.
 *
 * Completion persists via progressStore.completeStoryLevel() the moment
 * the RESULT slide appears — a refresh right after the reward can never
 * lose it — and "Continue Exploring" simply returns to the map.
 */
import React, { useEffect, useState } from 'react';
import { X, BookOpen, Award, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { useUIStore, openStory, closeStory } from '@/ui/uiStore';
import { progressStore } from '@/data/progressStore';
import { useSettings } from '@/data/settingsStore';
import { useStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';
import { getStoryLevel, type StoryLevelDef } from './storyData';

/**
 * DEV-only deep-link params (?story=open&slide=N&pick=correct|wrong) for
 * the headless capture browser, which cannot walk or click. Same spirit
 * as ?map=open; always null in production builds.
 */
function devSeamParams(): { slide: number; pick: string | null } | null {
  if (!import.meta.env?.DEV || typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search);
  if (p.get('story') !== 'open') return null;
  return { slide: Number(p.get('slide') ?? '0') || 0, pick: p.get('pick') };
}

export function StoryOverlay() {
  const { activeStory } = useUIStore();

  // DEV-only screenshot/e2e seam: ?story=open opens the overlay on boot,
  // optionally at a specific slide. Stripped from production builds.
  useEffect(() => {
    const seam = devSeamParams();
    if (seam) openStory('right-to-life', seam.slide);
  }, []);

  if (!activeStory) return null;
  const level = getStoryLevel(activeStory.id);
  if (!level || level.slides.length === 0) return null;
  // Unmount on close resets all player state; re-entry starts fresh.
  return <StoryPlayer level={level} initialSlide={activeStory.initialSlide} />;
}

function StoryPlayer({ level, initialSlide }: { level: StoryLevelDef; initialSlide: number }) {
  const t = useStrings();
  const { language } = useSettings();
  const total = level.slides.length;
  const clamp = (n: number) => Math.max(0, Math.min(total - 1, n));

  const [index, setIndex] = useState(() => clamp(initialSlide));
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd');
  // CHOICE slide: the picked choice id (feedback renders beneath). The DEV
  // seam can pre-pick so feedback states can be photographed headlessly.
  const [pickedId, setPickedId] = useState<string | null>(() => {
    const seam = devSeamParams();
    const choiceSlide = level.slides.find((s) => s.type === 'CHOICE');
    if (!seam?.pick || !choiceSlide?.choices) return null;
    return (
      choiceSlide.choices.find((c) => (seam.pick === 'correct') === c.correct)?.id ?? null
    );
  });

  const slide = level.slides[index];
  const choices = slide.choices ?? [];
  const picked = choices.find((c) => c.id === pickedId) ?? null;
  // Forward is GATED on the choice slide until the correct pick is made —
  // the only path to the result slide runs through the right choice.
  const canNext = index < total - 1 && (slide.type !== 'CHOICE' || picked?.correct === true);
  // Single source of truth for the ONE right-side action in the bottom bar
  // (task rule: never two Next buttons, never a duplicated Try Again):
  // idle → disabled Next, wrong → Try Again, correct → enabled Next.
  const actionState: 'idle' | 'wrong' | 'correct' =
    slide.type !== 'CHOICE' || !picked ? 'idle' : picked.correct ? 'correct' : 'wrong';

  const goto = (next: number, d: 'fwd' | 'back') => {
    setDir(d);
    setPickedId(null);
    setIndex(clamp(next));
  };

  // Reaching the RESULT slide IS completion (correct choice is the only
  // way here). Idempotent write — replays never double-award.
  useEffect(() => {
    if (slide.type === 'RESULT') progressStore.completeStoryLevel(level.id);
  }, [slide.type, level.id]);

  // Keyboard: Escape leaves, Enter/ArrowRight advances (when allowed),
  // ArrowLeft goes back. Leaving the result screen stays a deliberate
  // button press so the reward moment is never skipped by accident.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeStory();
        return;
      }
      if (slide.type === 'RESULT') return;
      if ((e.key === 'Enter' || e.key === 'ArrowRight') && canNext) goto(index + 1, 'fwd');
      if (e.key === 'ArrowLeft' && index > 0) goto(index - 1, 'back');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, canNext, slide.type, total]);

  return (
    <div className="absolute inset-0 z-30 pointer-events-auto bg-[#fff8ee]/95 backdrop-blur-md">
      <div className="h-full max-w-3xl mx-auto flex flex-col p-4 md:p-6 overflow-y-auto">
        {/* Top bar: leave, level title, slide counter */}
        <div className="flex items-center justify-between gap-3 pb-3 md:pb-4 shrink-0">
          <button
            onClick={closeStory}
            aria-label={t.storyExit}
            className="bg-white p-2.5 rounded-full shadow-md border border-slate-100 text-slate-400 hover:text-slate-600 transition-colors active:scale-95 touch-manipulation shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="font-display font-bold text-base md:text-xl text-[#0b2a52] text-center leading-tight min-w-0 truncate">
            {t.levelN(level.number)} — {level.title[language]}
          </p>
          <span className="bg-white px-3 py-1.5 rounded-full shadow-md border border-slate-100 text-sm font-bold text-slate-500 shrink-0">
            {t.storySlideOf(index + 1, total)}
          </span>
        </div>

        {/* Slide body — keyed so every change replays the 300ms fade+slide */}
        {slide.type === 'RESULT' ? (
          <div
            key={index}
            className="flex-1 flex flex-col items-center justify-center gap-5 md:gap-6 text-center py-6 animate-in fade-in slide-in-from-right-6 duration-300"
          >
            {/* Reward moment — subtle glow + sparkles, no fireworks. Built
                from existing game styling; the optional 5th illustration
                slots in above if it ever ships. */}
            {slide.image && (
              <div className="aspect-[5/4] h-[22vh] md:h-[26vh] rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-amber-50 to-sky-50">
                <img
                  src={slide.image}
                  alt={`${level.title[language]} — ${t.storySlideOf(index + 1, total)}`}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="relative mt-2">
              <span className="absolute -top-3 -left-7 text-amber-400 motion-safe:animate-ping" aria-hidden="true">
                <Sparkles className="w-5 h-5" />
              </span>
              <span
                className="absolute -bottom-1 -right-8 text-orange-400 motion-safe:animate-ping"
                style={{ animationDelay: '400ms' }}
                aria-hidden="true"
              >
                <Sparkles className="w-4 h-4" />
              </span>
              <span
                className="absolute -top-6 right-1 text-amber-300 motion-safe:animate-ping"
                style={{ animationDelay: '800ms' }}
                aria-hidden="true"
              >
                <Sparkles className="w-4 h-4" />
              </span>
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-orange-400 to-amber-300 grid place-content-center ring-4 ring-amber-200 shadow-[0_0_60px_rgba(251,146,60,0.45)] animate-in zoom-in-50 duration-500">
                <Award className="w-12 h-12 md:w-14 md:h-14 text-white" />
              </div>
            </div>
            <h3 className="font-display font-bold text-2xl md:text-3xl text-[#0b2a52]">
              {t.storyRewardUnlocked(level.reward[language])}
            </h3>
            <div className="bg-white rounded-2xl border border-orange-100 shadow-md px-5 py-4 md:px-7 md:py-5 max-w-xl">
              <p className="text-lg md:text-xl font-medium text-[#0b2a52] leading-relaxed">
                {slide.caption[language]}
              </p>
            </div>
            <button
              onClick={closeStory}
              className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-md transition-transform active:scale-95 touch-manipulation"
            >
              {t.storyContinueExploring}
            </button>
          </div>
        ) : (
          <div
            key={index}
            className={cn(
              // Natural min-height (no min-h-0): when the slide content is
              // taller than the viewport, the outer column scrolls instead of
              // the body painting over the bottom bar (overlap fix).
              'flex-1 flex flex-col gap-4 md:gap-5 animate-in fade-in duration-300',
              dir === 'fwd' ? 'slide-in-from-right-6' : 'slide-in-from-left-6',
            )}
          >
            {/* Illustration frame — the child's own art; placeholder until
                the slide's image is supplied (never generated art). */}
            <div
              className={cn(
                'relative rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-amber-50 via-orange-50 to-sky-50',
                // The child's art is 5:4 — on phones, lock the frame to that
                // aspect so the picture fills it edge-to-edge; on desktop the
                // frame takes the free column height (soft letterbox).
                slide.image
                  ? 'w-full max-h-[46vh] aspect-[5/4] flex-none mx-auto md:max-h-none md:aspect-auto md:flex-1 md:min-h-[38vh]'
                  : 'flex-1 min-h-[30vh] md:min-h-[38vh]',
              )}
            >
              {slide.image ? (
                <img
                  src={slide.image}
                  alt={`${level.title[language]} — ${t.storySlideOf(index + 1, total)}`}
                  className="absolute inset-0 w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <span className="w-16 h-16 rounded-2xl bg-white/80 border border-amber-100 shadow-sm grid place-content-center">
                    <BookOpen className="w-8 h-8 text-orange-400" />
                  </span>
                  <p className="font-display font-bold text-slate-400">
                    {t.storyAdventure}
                  </p>
                </div>
              )}
            </div>

            {/* Caption card */}
            <div className="bg-white rounded-2xl border border-orange-100 shadow-md px-5 py-4 md:px-7 md:py-5 shrink-0">
              <p className="text-center text-lg md:text-xl font-medium text-[#0b2a52] leading-relaxed">
                {slide.caption[language]}
              </p>
            </div>

            {/* Decision — two large, distinct options. The feedback card
                below is TEXT-ONLY: the Try Again / Next action lives solely
                in the global bottom bar (single button ownership). */}
            {slide.type === 'CHOICE' && (
              <div className="flex flex-col gap-3 w-full max-w-xl mx-auto shrink-0">
                {choices.map((c) => {
                  const isPicked = pickedId === c.id;
                  return (
                    <button
                      key={c.id}
                      disabled={!!picked}
                      onClick={() => setPickedId(c.id)}
                      className={cn(
                        'w-full text-left px-5 py-4 rounded-2xl border-2 font-bold text-base md:text-lg transition-all touch-manipulation',
                        !isPicked &&
                          'bg-white border-slate-200 text-[#0b2a52] hover:border-orange-300 hover:bg-orange-50/60 active:scale-[0.99]',
                        isPicked && c.correct && 'bg-green-50 border-green-300 text-green-700',
                        isPicked && !c.correct && 'bg-amber-50 border-amber-300 text-amber-700',
                        picked && !isPicked && 'opacity-60',
                      )}
                    >
                      {c.label[language]}
                    </button>
                  );
                })}
                {picked && (
                  <div
                    className={cn(
                      'rounded-2xl border-2 px-5 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300',
                      picked.correct
                        ? 'bg-green-50 border-green-200'
                        : 'bg-amber-50 border-amber-200',
                    )}
                  >
                    <p
                      className={cn(
                        'text-center font-medium leading-relaxed',
                        picked.correct ? 'text-green-800' : 'text-amber-800',
                      )}
                    >
                      {picked.feedback[language]}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom bar (hidden on the result): back, progress dots, and the
            ONE right-side action driven by actionState. pr on phones keeps
            the action clear of the floating Get Help Now shield. */}
        {slide.type !== 'RESULT' && (
          <div className="flex items-center justify-between gap-3 pt-4 pr-14 md:pr-0 shrink-0">
            <button
              onClick={() => goto(index - 1, 'back')}
              disabled={index === 0}
              className={cn(
                'flex items-center gap-2 px-5 py-3 rounded-full font-bold border transition-transform touch-manipulation',
                index === 0
                  ? 'invisible'
                  : 'bg-white border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95',
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              {t.back}
            </button>
            <div className="flex items-center gap-2" aria-hidden="true">
              {level.slides.map((s, i) => (
                <span
                  key={s.id}
                  className={cn(
                    'rounded-full transition-all duration-300',
                    i === index ? 'w-3 h-3 bg-orange-500' : 'w-2.5 h-2.5',
                    i < index && 'bg-orange-300',
                    i > index && 'bg-slate-200',
                  )}
                />
              ))}
            </div>
            {actionState === 'wrong' ? (
              <button
                onClick={() => setPickedId(null)}
                className="px-5 py-3 rounded-full font-bold whitespace-nowrap bg-white border-2 border-amber-300 text-amber-700 shadow-sm transition-transform active:scale-95 touch-manipulation"
              >
                {t.storyTryAgain}
              </button>
            ) : (
              <button
                onClick={() => goto(index + 1, 'fwd')}
                disabled={!canNext}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-transform touch-manipulation',
                  canNext
                    ? 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-md active:scale-95'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed',
                )}
              >
                {t.next}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
