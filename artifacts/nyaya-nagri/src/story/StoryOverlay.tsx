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
 * is never recreated or generated). The RESULT slide is a completion
 * screen with the level's own art as a large hero card (cover-cropped
 * gently on desktop, full 5:4 on phones), the gold badge bridging the
 * card's bottom edge, and a green-check learning summary — when the image
 * is missing it degrades to the badge-only layout (no-image fallback rule).
 *
 * Completion persists via progressStore.completeStoryLevel() the moment
 * the RESULT slide appears — a refresh right after the reward can never
 * lose it. Leaving the completion screen after a FRESH completion returns
 * to the LEVEL MAP with the unlock cinematic queued
 * (celebrateStoryCompletion); replays and mid-story exits just close.
 *
 * Voice guide (Aug 2026): useStoryNarrator + the storyAdventureVoice engine
 * — the ONE Gemini story voice controller, with NO fallback engine (strict
 * single-voice spec) — give every slide automatic spoken guidance for
 * pre-readers: narration, question + options read-out, gentle varied
 * reminders, and spoken feedback — all from the SAME fixed strings the
 * screen shows (nothing generated). Every navigation handler calls
 * storyAdventureVoice.stop() first so audio can never bleed across slides;
 * the top-bar Volume control writes settings.narration (shared with quest
 * narration) and the replay button re-reads the current slide. When Gemini
 * narration is unavailable the amber RETRY CHIP renders under the top bar
 * (tap = retry Gemini — never a robotic substitute voice, spec §6/§7).
 * The UI never depends on audio: with voice off or unsupported, everything
 * works exactly as before.
 */
import React, { useEffect, useState } from 'react';
import { X, BookOpen, Award, Sparkles, ArrowRight, ArrowLeft, Check, ChevronRight, Leaf, Loader2, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useUIStore, openStory, closeStory, celebrateStoryCompletion } from '@/ui/uiStore';
import { progressStore } from '@/data/progressStore';
import { useSettings, settingsStore } from '@/data/settingsStore';
import { useStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';
import { getStoryLevel, type StoryLevelDef } from './storyData';
import { storyAdventureVoice } from './storyAdventureVoice';
import { useStoryNarrator } from './useStoryNarrator';

/**
 * DEV-only deep-link params (?story=open&level=<id>&slide=N&pick=correct|
 * wrong) for the headless capture browser, which cannot walk or click.
 * `&view=map` belongs to the LEVEL MAP's own seam — the overlay stands
 * down for it. Same spirit as ?map=open; always null in production builds.
 */
function devSeamParams(): {
  level: string;
  slide: number;
  pick: string | null;
  voice: string | null;
} | null {
  if (!import.meta.env?.DEV || typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search);
  if (p.get('story') !== 'open' || p.get('view') === 'map') return null;
  return {
    level: p.get('level') ?? 'right-to-childhood',
    slide: Number(p.get('slide') ?? '0') || 0,
    pick: p.get('pick'),
    voice: p.get('voice'),
  };
}

export function StoryOverlay() {
  const { activeStory } = useUIStore();

  // DEV-only screenshot/e2e seam: ?story=open opens the overlay on boot,
  // optionally at a specific slide. Stripped from production builds.
  useEffect(() => {
    const seam = devSeamParams();
    if (!seam) return;
    // &voice=down simulates a dead Gemini upstream so the retry chip can
    // be screenshotted/e2e-tested deterministically (DEV builds only).
    if (seam.voice === 'down') storyAdventureVoice.simulateOutage();
    // openStory re-checks lock rules — a locked `&level=` stays shut unless
    // `&done=` (main.tsx seam) pre-completed its predecessors.
    openStory(seam.level, seam.slide);
  }, []);

  if (!activeStory) return null;
  const level = getStoryLevel(activeStory.id);
  if (!level || level.slides.length === 0) return null;
  // Unmount on close resets all player state; re-entry starts fresh.
  return <StoryPlayer level={level} initialSlide={activeStory.initialSlide} />;
}

function StoryPlayer({ level, initialSlide }: { level: StoryLevelDef; initialSlide: number }) {
  const t = useStrings();
  const settings = useSettings();
  const { language } = settings;
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

  // Was this level already completed when the player entered? Replays must
  // never re-trigger the unlock cinematic (or reset anything) — only a
  // FRESH completion queues the level-map celebration on leave.
  const [wasCompletedAtEntry] = useState(
    () => !!progressStore.getState().storyProgress[level.id],
  );

  const slide = level.slides[index];
  const choices = slide.choices ?? [];
  const picked = choices.find((c) => c.id === pickedId) ?? null;
  // CHOICE slides are deliberately image-free (storyData: the question IS
  // the game screen) — for them the illustration frame AND its "art coming
  // soon" placeholder are skipped entirely, and the decision content
  // centers in the freed space. Narration slides keep the placeholder
  // until their art ships (art is user-supplied, never generated).
  const showIllustration = slide.type !== 'CHOICE' || !!slide.image;
  // Forward is GATED on the choice slide until the correct pick is made —
  // the only path to the result slide runs through the right choice.
  const canNext = index < total - 1 && (slide.type !== 'CHOICE' || picked?.correct === true);
  // Single source of truth for the ONE right-side action in the bottom bar
  // (task rule: never two Next buttons, never a duplicated Try Again):
  // idle → disabled Next, wrong → Try Again, correct → enabled Next.
  const actionState: 'idle' | 'wrong' | 'correct' =
    slide.type !== 'CHOICE' || !picked ? 'idle' : picked.correct ? 'correct' : 'wrong';

  // Voice guide — settings.narration is the ONE master switch (shared
  // with quest narration); the top-bar control writes the same setting.
  const { replay, retryVoice, speaking, supported, voiceUnavailable, voicePreparing } =
    useStoryNarrator({
      level,
      slide,
      picked,
      language,
      enabled: settings.narration,
    });

  const goto = (next: number, d: 'fwd' | 'back') => {
    storyAdventureVoice.stop(); // instant cut — audio never bleeds across slides
    setDir(d);
    setPickedId(null);
    setIndex(clamp(next));
  };

  // Leaving = instant silence (strict spec §8/TEST 9): cut story audio in
  // the same tick as the tap/keypress, then close (the narrator's unmount
  // cleanup double-stops — belt and braces, both idempotent).
  const leave = () => {
    storyAdventureVoice.stop();
    // FRESH completion → back to the LEVEL MAP with the unlock cinematic
    // queued (progress was already persisted when RESULT appeared). Replays
    // and mid-story exits just close — if the map sits beneath, it shows
    // again by itself.
    if (slide.type === 'RESULT' && !wasCompletedAtEntry) {
      celebrateStoryCompletion(level.id);
    }
    closeStory();
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
        leave();
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
      <div
        className={cn(
          'h-full mx-auto flex flex-col p-4 md:p-6 overflow-y-auto',
          // The completion screen gets a wider column so the hero image can
          // dominate (task: ~850-950px card); story slides keep max-w-3xl.
          slide.type === 'RESULT' ? 'max-w-4xl' : 'max-w-3xl',
        )}
      >
        {/* Top bar: leave, level title, slide counter */}
        <div className="flex items-center justify-between gap-3 pb-3 md:pb-4 shrink-0">
          <button
            onClick={leave}
            aria-label={t.storyExit}
            className="bg-white p-2.5 rounded-full shadow-md border border-slate-100 text-slate-400 hover:text-slate-600 transition-colors active:scale-95 touch-manipulation shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="font-display font-bold text-base md:text-xl text-[#0b2a52] text-center leading-tight min-w-0 truncate">
            {t.levelN(level.number)} — {level.title[language]}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {supported && (
              <>
                <button
                  onClick={() => settingsStore.update({ narration: !settings.narration })}
                  aria-pressed={settings.narration}
                  aria-label={settings.narration ? t.storyVoiceOff : t.storyVoiceOn}
                  title={settings.narration ? t.storyVoiceOff : t.storyVoiceOn}
                  className={cn(
                    'p-2.5 rounded-full shadow-md border transition-colors active:scale-95 touch-manipulation',
                    settings.narration
                      ? 'bg-sky-100 border-sky-200 text-sky-600'
                      : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600',
                  )}
                >
                  {settings.narration ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                {settings.narration && (
                  <button
                    onClick={replay}
                    // §13: while THIS read's audio is still being prepared,
                    // extra taps must not stack extra Gemini requests.
                    disabled={voicePreparing}
                    aria-label={t.storyVoiceReplay}
                    title={t.storyVoiceReplay}
                    className={cn(
                      'p-2.5 rounded-full shadow-md border bg-white transition-colors active:scale-95 touch-manipulation disabled:opacity-50 disabled:active:scale-100',
                      speaking
                        ? 'border-sky-200 text-sky-600 motion-safe:animate-pulse'
                        : 'border-slate-100 text-slate-400 hover:text-slate-600',
                    )}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
            <span className="bg-white px-3 py-1.5 rounded-full shadow-md border border-slate-100 text-sm font-bold text-slate-500">
              {t.storySlideOf(index + 1, total)}
            </span>
          </div>
        </div>

        {/* Gemini-unavailable retry chip (spec §6/§7): voice failed → stay
            SILENT and offer a child-friendly Gemini retry. Never a fallback
            voice. Hidden on the RESULT slide (that screen is silent anyway). */}
        {supported && settings.narration && voiceUnavailable && slide.type !== 'RESULT' && (
          <button
            onClick={retryVoice}
            className="mb-3 md:mb-4 mx-auto flex items-center gap-2 bg-amber-50 border-2 border-amber-300 text-amber-800 px-5 py-2.5 rounded-full font-bold text-sm md:text-base shadow-sm transition-transform active:scale-95 touch-manipulation animate-in fade-in slide-in-from-top-2 duration-300 shrink-0"
          >
            <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            {t.storyVoiceRetry}
          </button>
        )}

        {/* §12 neutral loading state: Gemini audio for THIS read is still
            being prepared (cold cache / live generation). NOT an error —
            the retry chip above always wins if the voice actually failed,
            and this hides the instant audio starts. Never a fallback
            voice, just patience. */}
        {supported &&
          settings.narration &&
          !voiceUnavailable &&
          voicePreparing &&
          slide.type !== 'RESULT' && (
            <div
              role="status"
              className="mb-3 md:mb-4 mx-auto flex items-center gap-2 bg-sky-50 border-2 border-sky-200 text-sky-800 px-5 py-2.5 rounded-full font-bold text-sm md:text-base shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 shrink-0"
            >
              <Loader2 className="w-4 h-4 shrink-0 motion-safe:animate-spin" aria-hidden="true" />
              {t.storyVoicePreparing}
            </div>
          )}

        {/* Slide body — keyed so every change replays the 300ms fade+slide */}
        {slide.type === 'RESULT' ? (
          <div
            key={index}
            className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-4 animate-in fade-in slide-in-from-right-6 duration-300"
          >
            {/* Hero story image — the level's own art is the focal element.
                Desktop: wide cover-cropped card (position biased upward so
                no face is ever cut); phones: full 5:4, uncropped. Subtle
                sparkle/leaf accents around the card, per the reference. */}
            {slide.image && (
              // Coherent 16:9 on desktop: the WIDTH is capped from the height
              // budget (78vh ≈ 44vh × 16/9), so short viewports shrink the
              // card proportionally instead of stretching it ultra-wide and
              // over-cropping the art. Accents live on this wrapper so they
              // always hug the card edges.
              <div className="relative w-full md:max-w-[78vh] mx-auto">
                <span className="absolute -top-4 left-2 md:-left-3 text-amber-400 z-10" aria-hidden="true">
                  <Sparkles className="w-6 h-6" />
                </span>
                <span className="absolute -top-2 right-8 text-orange-300 z-10" aria-hidden="true">
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="absolute top-12 -right-1 md:-right-3 text-lime-600/60 rotate-45 z-10" aria-hidden="true">
                  <Leaf className="w-5 h-5" />
                </span>
                <span className="absolute bottom-20 -left-1 md:-left-3 text-emerald-600/50 -rotate-45 z-10" aria-hidden="true">
                  <Leaf className="w-5 h-5" />
                </span>
                <div className="w-full aspect-[5/4] md:aspect-video rounded-[28px] overflow-hidden border-[6px] border-white shadow-xl bg-gradient-to-br from-amber-50 to-sky-50">
                  <img
                    src={slide.image}
                    alt={`${level.title[language]} — ${t.storySlideOf(index + 1, total)}`}
                    className="w-full h-full object-cover object-[center_32%]"
                  />
                </div>
              </div>
            )}

            {/* Gold badge bridges the hero card's bottom edge (reference
                look); laurel leaves + gentle ping sparkles, no fireworks.
                Without an image it falls back to the plain centered badge. */}
            <div className={cn('relative z-10', slide.image && '-mt-14 md:-mt-16')}>
              <span
                className="absolute top-1/2 -translate-y-1/2 -left-11 text-emerald-600/70 -rotate-[30deg] scale-x-[-1]"
                aria-hidden="true"
              >
                <Leaf className="w-7 h-7" />
              </span>
              <span
                className="absolute top-1/2 -translate-y-1/2 -right-11 text-emerald-600/70 rotate-[30deg]"
                aria-hidden="true"
              >
                <Leaf className="w-7 h-7" />
              </span>
              <span className="absolute -top-3 -right-7 text-amber-400 motion-safe:animate-ping" aria-hidden="true">
                <Sparkles className="w-4 h-4" />
              </span>
              <span
                className="absolute -bottom-2 -left-7 text-orange-400 motion-safe:animate-ping"
                style={{ animationDelay: '500ms' }}
                aria-hidden="true"
              >
                <Sparkles className="w-4 h-4" />
              </span>
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-tr from-orange-400 to-amber-300 grid place-content-center ring-4 ring-white shadow-[0_0_50px_rgba(251,146,60,0.5)] animate-in zoom-in-50 duration-500">
                <Award className="w-11 h-11 md:w-12 md:h-12 text-white" />
              </div>
            </div>
            <h3 className="font-display font-bold text-3xl md:text-4xl text-[#0b2a52]">
              {t.storyRewardUnlocked(level.reward[language])}
            </h3>
            <div className="bg-white rounded-2xl border border-orange-100 shadow-md px-5 py-4 md:px-6 max-w-xl flex items-center gap-3 text-left">
              <span className="w-8 h-8 rounded-full bg-green-500 grid place-content-center shrink-0" aria-hidden="true">
                <Check className="w-5 h-5 text-white" strokeWidth={3} />
              </span>
              <p className="text-base md:text-lg font-medium text-[#0b2a52] leading-relaxed">
                {slide.caption[language]}
              </p>
            </div>
            <button
              onClick={leave}
              className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white pl-8 pr-6 py-4 rounded-full font-bold text-lg shadow-md transition-transform active:scale-95 touch-manipulation flex items-center gap-2"
            >
              {wasCompletedAtEntry ? t.storyContinueExploring : t.storyMapContinueCta}
              <ChevronRight className="w-5 h-5" />
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
              // Image-free CHOICE screen: center the question + options in
              // the space the frame used to occupy. Safe with the outer
              // scroll column — the body keeps its natural min-height, so
              // overflowing content still starts at the top and scrolls.
              !showIllustration && 'justify-center',
            )}
          >
            {/* Illustration frame — the child's own art; placeholder until
                the slide's image is supplied (never generated art). Skipped
                entirely on the image-free CHOICE screen (showIllustration):
                the placeholder is a "art not shipped yet" affordance, and
                showing it on a deliberately artless question slide read as
                a bug (user report, Aug 2026). */}
            {showIllustration && (
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
            )}

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
                      onClick={() => {
                        // Spec hard rule: the tap itself kills reminders +
                        // any current voice THIS instant (the narrator
                        // effect then speaks the feedback).
                        storyAdventureVoice.stop();
                        setPickedId(c.id);
                      }}
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
                onClick={() => {
                  storyAdventureVoice.stop();
                  setPickedId(null);
                }}
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
