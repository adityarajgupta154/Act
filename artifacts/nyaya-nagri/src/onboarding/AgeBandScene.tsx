/**
 * Nyaya Nagri — "How old are you?" scene (onboarding step 2).
 *
 * Rebuilt from zero against the user's reference frame. PRESENTATION ONLY:
 * band state lives in OnboardingFlow (onSelect/onBack/onNext are the same
 * handlers the inline card used), every string still comes from i18n
 * (EN + HI), the shared five-step indicator is unchanged, and the z-50
 * "Get Help Now" control stays reachable above this z-20 layer (PRD §9.1).
 * Zero PII: age band is a coarse bucket choice, no inputs (PRD §9.4).
 *
 * Reference geometry, measured off the frame and held as viewport fractions:
 *   panel   gold rim 16.7→~88% of the height; cream face 17.7→87% (~69vh),
 *           mid-line 52.4vh; x 29.9→72.9% (43vw wide, centre-right at 51.4vw)
 *   crest   ~10.3vh shield + laurels, just over half above the top rail
 *   cards   three rows ~10.5vh tall, ~2.2vh apart, badge disc ~7.6vh,
 *           blue / green / purple badge + matching chevron
 *   buttons ~6.25vh pills on the bottom rail of the panel
 *   boy     standing lower-left, ~57vh head-to-feet; the user-supplied PNG
 *           carries its own thought bubble (top-right of the canvas) and is
 *           used verbatim — width-capped at 24vw so the canvas can never
 *           reach the panel's left edge (~28vw at the panel's 30rem minimum)
 * Type/spacing scale with viewport HEIGHT (clamp vh + rem caps): the vh
 * coefficient rules ~800px-tall screens, the rem cap rules ~1080px ones.
 * Heights pin to 100dvh (percentage chains collapse on auto-height parents).
 */
import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight, Sparkles, Star } from 'lucide-react';
import type { AgeBand } from '@/data/progressStore';
import { useStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';
import { JusticeCrest } from '@/ui/JusticeCrest';
import { BrandHeader } from '@/home/BrandHeader';
import { TopControls } from '@/home/TopControls';
import { InfoDialog } from '@/home/InfoDialog';
import { AboutContent } from '@/home/AboutContent';
import { Laurel, StepDots } from './decor';
import plazaBackdrop from '@/assets/onboarding/plaza-bg.jpg';
import guideCharacter from '@/assets/onboarding/guide-boy-wondering.png';

/** Crest size and how far it lifts above the panel's top rail. */
const CREST_SIZE = 'min(10.3vh, 11vw)';
const CREST_LIFT = `calc(${CREST_SIZE} * -0.53)`;
/**
 * Boy width, derived from the uploaded 1024x1536 PNG (used verbatim):
 * the boy spans 88.8% of the canvas height (feet on the bottom edge, baked
 * thought bubble top-right). Reference boy = 57.6vh head-to-feet, so the
 * canvas renders at 57.6/0.888 = 64.9vh tall -> 64.9 x (1024/1536) = 43.3vh
 * wide. The 24vw cap keeps the whole canvas short of the panel's left edge
 * (>= ~28vw even at the panel's 30rem minimum width) at every lg size.
 */
const BOY_WIDTH = 'min(43.3vh, 24vw)';

/** Badge + chevron palette per band, from the reference cards. */
const BAND_STYLES = [
  { badge: 'bg-[#cbe5f9] text-[#0b2fb8]', chevron: 'text-[#2563eb]' },
  { badge: 'bg-[#d7f0de] text-[#0f7c52]', chevron: 'text-[#159a68]' },
  { badge: 'bg-[#f0e2fa] text-[#7a2fd0]', chevron: 'text-[#8b5cf6]' },
];

/** Gold rule under the title: tapered lines, tiny diamonds, centre star. */
function DiamondRule() {
  return (
    <div
      className="my-2 flex items-center justify-center gap-1.5 lg:my-[clamp(0.3rem,1.2vh,0.85rem)] lg:gap-[clamp(0.3rem,0.9vh,0.7rem)]"
      aria-hidden="true"
    >
      <span className="h-[3px] w-9 rounded-full bg-gradient-to-r from-transparent to-amber-400/85 lg:w-[clamp(2rem,5.4vh,4rem)]" />
      <span className="h-1.5 w-1.5 rotate-45 rounded-[1px] bg-amber-400 lg:h-[clamp(0.3rem,1vh,0.7rem)] lg:w-[clamp(0.3rem,1vh,0.7rem)]" />
      <Star className="h-4 w-4 fill-amber-400 text-amber-500 lg:h-[clamp(0.7rem,1.9vh,1.4rem)] lg:w-[clamp(0.7rem,1.9vh,1.4rem)]" />
      <span className="h-1.5 w-1.5 rotate-45 rounded-[1px] bg-amber-400 lg:h-[clamp(0.3rem,1vh,0.7rem)] lg:w-[clamp(0.3rem,1vh,0.7rem)]" />
      <span className="h-[3px] w-9 rounded-full bg-gradient-to-l from-transparent to-amber-400/85 lg:w-[clamp(2rem,5.4vh,4rem)]" />
    </div>
  );
}

interface AgeBandSceneProps {
  /** Currently selected band (state lives in OnboardingFlow, as before). */
  band: AgeBand | null;
  /** Same setBand handler the previous inline UI used. */
  onSelect: (band: AgeBand) => void;
  /** Return to "How it works" (same setStep handler as before). */
  onBack: () => void;
  /** Advance to the avatar builder — stays disabled until a band is chosen. */
  onNext: () => void;
  /** Step indicator state, shared with the rest of the flow. */
  step: number;
  stepCount: number;
}

export function AgeBandScene({ band, onSelect, onBack, onNext, step, stepCount }: AgeBandSceneProps) {
  const t = useStrings();
  const [aboutOpen, setAboutOpen] = useState(false);

  const bands: Array<{ value: AgeBand; desc: string }> = [
    { value: '8-11', desc: t.ageBandDesc811 },
    { value: '12-15', desc: t.ageBandDesc1215 },
    { value: '16-18', desc: t.ageBandDesc1618 },
  ];

  return (
    <div className="absolute inset-0 z-20 pointer-events-auto overflow-y-auto overscroll-contain">
      {/* Plaza backdrop — covers the viewport, never stretched */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${plazaBackdrop})` }}
        aria-hidden="true"
      />

      {/* Top chrome — the EXISTING Home components, unchanged */}
      <BrandHeader />
      <TopControls onAbout={() => setAboutOpen(true)} />

      <div className="relative min-h-[100dvh]">
        {/* Five-step indicator, top centre — the shared component, untouched */}
        <div className="absolute inset-x-0 top-[4.5rem] z-10 flex justify-center sm:top-2 lg:top-[1.4vh]">
          <StepDots step={step} stepCount={stepCount} />
        </div>

        {/* Guide boy, lower-left, wondering about his age band — the user's
            transparent PNG rendered verbatim (its thought bubble is part of
            the canvas). Feet sit 0.5% above the canvas bottom, so a 2.7vh
            offset puts them on the pavement at ~97vh; the body starts 25%
            into the canvas, so left 0.5vw lands the elbow near 6vw as on
            the reference. Hidden below lg, where there is no room. */}
        <div
          className="pointer-events-none absolute bottom-[2.7vh] left-[0.5vw] hidden select-none lg:block"
          style={{ width: BOY_WIDTH }}
          aria-hidden="true"
        >
          <img
            src={guideCharacter}
            alt=""
            draggable={false}
            className="h-auto w-full drop-shadow-[0_22px_18px_rgba(15,23,42,0.32)]"
          />
        </div>

        {/* Panel column — centred, nudged right and down to the reference
            position (centre-right, mid-line ~52.4vh) */}
        <div className="flex min-h-[100dvh] justify-center px-4 py-6">
          <div className="relative my-auto w-full max-w-lg lg:w-[clamp(30rem,43vw,52rem)] lg:max-w-none lg:translate-x-[1.4vw] lg:translate-y-[2.75vh]">
            {/* Shield crest with laurels on the panel's top rail */}
            <div
              className="absolute left-1/2 z-10 flex -translate-x-1/2 items-end justify-center drop-shadow-[0_9px_9px_rgba(15,23,42,0.38)]"
              style={{ height: CREST_SIZE, top: CREST_LIFT }}
            >
              <Laurel className="h-[70%] w-auto -mr-[9%] -scale-x-100" />
              <JusticeCrest className="h-full w-auto" />
              <Laurel className="h-[70%] w-auto -ml-[9%]" />
            </div>

            <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-300">
              {/* Gold rim → cream face with an inset hairline border */}
              <div className="rounded-[2.2rem] bg-gradient-to-b from-[#f2cd7e] via-[#e0ac45] to-[#c8871c] p-[7px] pb-[10px] shadow-[0_28px_54px_-20px_rgba(15,23,42,0.7)]">
                <div className="relative flex flex-col rounded-[1.9rem] bg-gradient-to-b from-[#fdf7eb] to-[#f4e4c8] px-5 pb-4 pt-6 shadow-[inset_0_2px_0_rgba(255,255,255,0.85)] lg:px-[clamp(1.2rem,2.9vw,3.4rem)] lg:pb-[clamp(0.8rem,2.7vh,2rem)] lg:pt-[clamp(1.2rem,5.8vh,4.1rem)] lg:min-h-[70vh]">
                  {/* Inset hairline border, as on the reference face */}
                  <div
                    className="pointer-events-none absolute inset-[9px] rounded-[1.55rem] border border-[#d9ae5e]/45 lg:inset-[clamp(0.5rem,1.4vh,1rem)]"
                    aria-hidden="true"
                  />

                  {/* Title + rule + subtitle */}
                  <div className="flex items-center justify-center gap-2.5 lg:gap-[clamp(0.5rem,1.6vh,1.2rem)]">
                    <Sparkles
                      className="h-5 w-5 shrink-0 fill-amber-400 text-amber-500 drop-shadow-sm lg:h-[clamp(0.95rem,2.9vh,2.1rem)] lg:w-[clamp(0.95rem,2.9vh,2.1rem)]"
                      aria-hidden="true"
                    />
                    <h2 className="font-display text-3xl font-bold leading-tight text-[#0b2a52] text-balance lg:text-[clamp(1.7rem,4.3vh,3.1rem)]">
                      {t.howOldAreYou}
                    </h2>
                    <Sparkles
                      className="h-5 w-5 shrink-0 fill-amber-400 text-amber-500 drop-shadow-sm lg:h-[clamp(0.95rem,2.9vh,2.1rem)] lg:w-[clamp(0.95rem,2.9vh,2.1rem)]"
                      aria-hidden="true"
                    />
                  </div>
                  <DiamondRule />
                  <p className="text-center text-sm font-semibold text-[#223c68] lg:text-[clamp(0.85rem,2.05vh,1.5rem)]">
                    {t.ageWhy}
                  </p>

                  {/* Three age-band cards — same handler + state as before */}
                  <ul
                    className="mt-4 space-y-2.5 text-left lg:mt-[clamp(0.6rem,2.3vh,1.7rem)] lg:space-y-[clamp(0.5rem,2.2vh,1.6rem)]"
                    role="group"
                    aria-label={t.howOldAreYou}
                  >
                    {bands.map((b, i) => {
                      const selected = band === b.value;
                      return (
                        <li
                          key={b.value}
                          style={{ animationDelay: `${i * 70}ms` }}
                          className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both motion-safe:duration-300"
                        >
                          <button
                            onClick={() => onSelect(b.value)}
                            aria-pressed={selected}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-[1.4rem] border bg-gradient-to-b from-[#fdf6ec] to-[#fbf0e0] px-3 py-2.5 text-left transition-all touch-manipulation',
                              'lg:min-h-[clamp(3.2rem,10.5vh,7.7rem)] lg:gap-[clamp(0.7rem,2.7vh,2rem)] lg:rounded-[clamp(1.2rem,3.9vh,2.8rem)] lg:px-[clamp(0.6rem,2.3vh,1.7rem)] lg:py-[clamp(0.4rem,1.45vh,1.05rem)]',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                              selected
                                ? 'border-orange-300 from-[#fff4dc] to-[#ffeecb] shadow-[0_10px_20px_-12px_rgba(194,65,12,0.65)] ring-2 ring-orange-400'
                                : 'border-[#ecdcbf] shadow-[0_8px_16px_-12px_rgba(101,67,10,0.55)] hover:border-amber-300 hover:shadow-md',
                            )}
                          >
                            <span
                              className={cn(
                                'grid h-14 w-14 shrink-0 place-items-center rounded-full font-display text-lg font-bold shadow-[inset_0_-3px_0_rgba(15,23,42,0.08)]',
                                'lg:h-[clamp(2.6rem,7.6vh,5.5rem)] lg:w-[clamp(2.6rem,7.6vh,5.5rem)] lg:text-[clamp(1.05rem,2.9vh,2.1rem)]',
                                BAND_STYLES[i].badge,
                              )}
                            >
                              {b.value.replace('-', '–')}
                            </span>
                            <span className="min-w-0 flex-1 font-display text-base font-bold leading-snug text-[#17356b] lg:text-[clamp(0.95rem,2.35vh,1.7rem)]">
                              {b.desc}
                            </span>
                            <ChevronRight
                              className={cn(
                                'h-5 w-5 shrink-0 lg:h-[clamp(1.05rem,2.7vh,1.9rem)] lg:w-[clamp(1.05rem,2.7vh,1.9rem)]',
                                BAND_STYLES[i].chevron,
                              )}
                              aria-hidden="true"
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Back / Next — the SAME handlers and gating as before:
                      Next stays disabled (subtle) until a band is chosen */}
                  <div className="mt-4 flex items-center justify-between gap-3 pt-1 lg:mt-auto lg:pt-[clamp(0.6rem,2vh,1.5rem)]">
                    <button
                      onClick={onBack}
                      className="flex items-center gap-2 rounded-full bg-[#f7f0de] px-5 py-2.5 font-display text-base font-bold text-[#4a3a22] shadow-[0_8px_16px_-10px_rgba(101,67,10,0.6)] ring-1 ring-[#e7d9ba] transition-all duration-150 hover:bg-[#fbf5e7] active:translate-y-0.5 touch-manipulation lg:gap-[clamp(0.35rem,1vh,0.8rem)] lg:px-[clamp(1.2rem,3.4vh,2.5rem)] lg:py-[clamp(0.5rem,1.66vh,1.2rem)] lg:text-[clamp(0.95rem,2.35vh,1.7rem)]"
                    >
                      <ArrowLeft className="h-5 w-5 lg:h-[clamp(0.95rem,2.3vh,1.6rem)] lg:w-[clamp(0.95rem,2.3vh,1.6rem)]" />
                      {t.back}
                    </button>
                    <button
                      onClick={onNext}
                      disabled={!band}
                      className="flex items-center gap-2 rounded-full bg-gradient-to-b from-[#ffa03f] to-[#f0711a] px-7 py-2.5 font-display text-base font-bold text-white shadow-[0_12px_20px_-10px_rgba(194,65,12,0.9)] ring-1 ring-white/50 transition-all duration-150 hover:brightness-105 active:translate-y-0.5 touch-manipulation disabled:cursor-not-allowed disabled:opacity-45 disabled:saturate-[.6] disabled:shadow-none lg:gap-[clamp(0.35rem,1vh,0.8rem)] lg:px-[clamp(1.4rem,3.9vh,2.9rem)] lg:py-[clamp(0.5rem,1.66vh,1.2rem)] lg:text-[clamp(0.95rem,2.35vh,1.7rem)]"
                    >
                      {t.next}
                      <ArrowRight className="h-5 w-5 lg:h-[clamp(0.95rem,2.3vh,1.6rem)] lg:w-[clamp(0.95rem,2.3vh,1.6rem)]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Same About dialog the Home screen opens — one description, one shell */}
      <InfoDialog
        open={aboutOpen}
        onOpenChange={setAboutOpen}
        title={t.homeAboutTitle}
        closeLabel={t.close}
      >
        <AboutContent />
      </InfoDialog>
    </div>
  );
}
