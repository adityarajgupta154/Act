/**
 * Nyaya Nagri — "How it works" scene (onboarding step 1).
 *
 * Rebuilt from zero against the user's reference frame. PRESENTATION ONLY:
 * step state and navigation still live in OnboardingFlow (onBack/onNext are
 * the same setStep handlers), every string still comes from i18n, the shared
 * five-step indicator is unchanged, and the z-50 "Get Help Now" control stays
 * reachable above this z-20 layer (PRD §9.1).
 *
 * Reference geometry, measured off the frame and held here as viewport
 * fractions so the composition survives any desktop size:
 *   panel   x 31.7-70.8% (w ~39.8%), centred, mid-line at 53.2% of the height,
 *           natural height ~75% (top ~16%, bottom ~91%)
 *   crest   ~12.5% of the height, ~2/3 of it above the panel's top rail, which
 *           leaves the step-dots pill clear air above it
 *   boy     left ~3%, feet ~5% off the bottom, ~51% of the height, and never
 *           wide enough to touch the panel (width is clamped against it)
 *   rows    4 light rows, icon disc ~72% of the row height, chevron right
 * Type and spacing inside the panel scale with viewport HEIGHT (the reference
 * proportions), so the panel keeps its height share instead of leaving a pool
 * of empty cream on tall screens or overflowing short ones. Heights are pinned
 * to 100dvh rather than percentage chains, which collapse on auto-height
 * parents and drag the panel off the reference mid-line.
 * The panel keeps its own copy of the row markup (the shared HowItWorksContent
 * stays as-is for the Home dialog) — same i18n strings, reference styling.
 */
import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  ChevronRight,
  Map as MapIcon,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  Star,
} from 'lucide-react';
import { useStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';
import { JusticeCrest } from '@/ui/JusticeCrest';
import { BrandHeader } from '@/home/BrandHeader';
import { TopControls } from '@/home/TopControls';
import { InfoDialog } from '@/home/InfoDialog';
import { AboutContent } from '@/home/AboutContent';
import { Laurel, StepDots } from './decor';
import plazaBackdrop from '@/assets/onboarding/plaza-bg.jpg';
import guideCharacter from '@/assets/onboarding/guide-boy-bench.png';

/** Crest size, and how far it lifts above the panel's top rail. */
const CREST_SIZE = 'min(12.5vh, 14vw)';
const CREST_LIFT = `calc(${CREST_SIZE} * -0.62)`;
/**
 * Boy width: the reference proportion (~51vh tall on a 0.86 aspect asset),
 * then clamped by the distance to the panel's left edge so he can never reach
 * it, whatever the window shape. 15rem is half the panel's minimum width.
 */
const BOY_WIDTH = 'min(25vw, 44vh, calc(45vw - 15rem))';

interface HowItWorksSceneProps {
  /** Return to the language scene (same setStep handler as before). */
  onBack: () => void;
  /** Advance to age-band selection (same setStep handler as before). */
  onNext: () => void;
  /** Step indicator state, shared with the rest of the flow. */
  step: number;
  stepCount: number;
}

export function HowItWorksScene({ onBack, onNext, step, stepCount }: HowItWorksSceneProps) {
  const t = useStrings();
  const [aboutOpen, setAboutOpen] = useState(false);

  const iconClass = 'h-6 w-6 lg:h-[clamp(1.2rem,3.45vh,2.2rem)] lg:w-[clamp(1.2rem,3.45vh,2.2rem)]';
  const icons = [
    <MapIcon key="map" className={iconClass} />,
    <Award key="award" className={iconClass} />,
    <MessageCircle key="chat" className={iconClass} />,
    <ShieldAlert key="shield" className={iconClass} />,
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

        {/* Guide boy: lower-left, seated on his bench, books and bulb with him.
            Absolutely placed so the composition holds; width clamped so he
            never reaches the panel. Hidden below lg, where there is no room
            for him beside a readable panel. */}
        <img
          src={guideCharacter}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{ width: BOY_WIDTH }}
          className="pointer-events-none absolute bottom-[5vh] left-[3vw] hidden h-auto select-none drop-shadow-[0_22px_18px_rgba(15,23,42,0.32)] lg:block"
        />

        {/* Panel column — centred, then nudged to the reference mid-line (53.2vh) */}
        <div className="flex min-h-[100dvh] justify-center px-4 py-6">
          <div className="relative my-auto w-full max-w-lg lg:w-[clamp(30rem,39.8vw,48rem)] lg:max-w-none lg:translate-y-[3.2vh]">
            {/* Shield crest with laurels, sitting on the panel's top rail */}
            <div
              className="absolute left-1/2 z-10 flex -translate-x-1/2 items-end justify-center drop-shadow-[0_10px_10px_rgba(15,23,42,0.4)]"
              style={{ height: CREST_SIZE, top: CREST_LIFT }}
            >
              <Laurel className="h-[74%] w-auto -mr-[9%] -scale-x-100" />
              <JusticeCrest className="h-full w-auto" />
              <Laurel className="h-[74%] w-auto -ml-[9%]" />
            </div>

            <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-300">
              {/* Blue rim → gold border → cream face */}
              <div className="rounded-[2.6rem] bg-gradient-to-b from-[#2f63bb] to-[#153a80] p-[3px] pb-[9px] shadow-[0_28px_54px_-20px_rgba(15,23,42,0.75)]">
                <div className="rounded-[2.45rem] bg-gradient-to-b from-[#fbdf92] to-[#dfa631] p-[7px]">
                  <div className="flex flex-col rounded-[2.1rem] bg-gradient-to-b from-[#fffdf8] to-[#f9efdb] px-5 pb-4 pt-6 lg:min-h-[74.4vh] shadow-[inset_0_2px_0_rgba(255,255,255,0.9)] lg:px-[clamp(1rem,2.7vw,3rem)] lg:pb-[clamp(0.7rem,2.6vh,1.7rem)] lg:pt-[clamp(1rem,4.45vh,2.7rem)]">
                    {/* Title + star rule */}
                    <div className="flex items-center justify-center gap-2.5 lg:gap-[clamp(0.5rem,1.6vh,1.2rem)]">
                      <Sparkles
                        className="h-5 w-5 shrink-0 fill-amber-400 text-amber-500 drop-shadow-sm lg:h-[clamp(1rem,3.1vh,2rem)] lg:w-[clamp(1rem,3.1vh,2rem)]"
                        aria-hidden="true"
                      />
                      <h2 className="font-display text-3xl font-bold leading-tight text-[#15346f] text-balance lg:text-[clamp(1.85rem,5.5vh,3.6rem)]">
                        {t.howItWorksTitle}
                      </h2>
                      <Sparkles
                        className="h-5 w-5 shrink-0 fill-amber-400 text-amber-500 drop-shadow-sm lg:h-[clamp(1rem,3.1vh,2rem)] lg:w-[clamp(1rem,3.1vh,2rem)]"
                        aria-hidden="true"
                      />
                    </div>
                    <div
                      className="my-2 flex items-center justify-center gap-2 lg:my-[clamp(0.35rem,1.35vh,0.9rem)] lg:gap-[clamp(0.35rem,1vh,0.8rem)]"
                      aria-hidden="true"
                    >
                      <span className="h-[3px] w-10 rounded-full bg-gradient-to-r from-transparent to-amber-400/85 lg:w-[clamp(2.2rem,6.2vh,4.5rem)]" />
                      <Star className="h-4 w-4 fill-amber-400 text-amber-500 lg:h-[clamp(0.8rem,2.2vh,1.6rem)] lg:w-[clamp(0.8rem,2.2vh,1.6rem)]" />
                      <span className="h-[3px] w-10 rounded-full bg-gradient-to-l from-transparent to-amber-400/85 lg:w-[clamp(2.2rem,6.2vh,4.5rem)]" />
                    </div>

                    {/* Four information rows */}
                    <ul className="flex flex-col justify-between space-y-2.5 text-left lg:flex-1 lg:space-y-[clamp(0.45rem,1.5vh,1rem)]">
                      {t.howItWorksCards.map((card, i) => {
                        const danger = i === 3;
                        return (
                          <li
                            key={i}
                            style={{ animationDelay: `${i * 70}ms` }}
                            className={cn(
                              'flex items-center gap-3 rounded-[1.25rem] border bg-white px-3 py-2.5',
                              'lg:gap-[clamp(0.55rem,1.5vh,1rem)] lg:rounded-[1.5rem] lg:px-[clamp(0.65rem,1.5vh,1.25rem)] lg:py-[clamp(0.4rem,1.1vh,0.85rem)]',
                              'shadow-[0_8px_16px_-12px_rgba(21,52,111,0.55)]',
                              danger ? 'border-[#f6dcdc]' : 'border-[#dde8f8]',
                              'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both motion-safe:duration-300',
                            )}
                          >
                            <span
                              className={cn(
                                'grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-b from-white to-[#eef5ff] ring-1',
                                'lg:h-[clamp(2.4rem,7vh,4.6rem)] lg:w-[clamp(2.4rem,7vh,4.6rem)]',
                                'shadow-[0_6px_12px_-8px_rgba(21,52,111,0.6)]',
                                danger ? 'text-red-500 ring-red-100' : 'text-blue-600 ring-[#dbe8fb]',
                              )}
                            >
                              {icons[i]}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className="font-display text-base font-bold leading-tight text-[#15346f] lg:text-[clamp(1rem,2.5vh,1.6rem)]">
                                {card.title}
                              </span>
                              <span className="text-[13px] font-medium leading-snug text-slate-600 lg:text-[clamp(0.8rem,2.03vh,1.2rem)]">
                                {card.body}
                              </span>
                            </span>
                            <ChevronRight
                              className={cn(
                                'h-5 w-5 shrink-0 lg:h-[clamp(1rem,2.65vh,1.7rem)] lg:w-[clamp(1rem,2.65vh,1.7rem)]',
                                danger ? 'text-red-300' : 'text-[#9dbdf0]',
                              )}
                              aria-hidden="true"
                            />
                          </li>
                        );
                      })}
                    </ul>

                    {/* Back / Next — the SAME step handlers the flow always used */}
                    <div className="mt-3.5 flex items-center justify-between gap-3 lg:mt-[clamp(0.45rem,1.5vh,1rem)]">
                      <button
                        onClick={onBack}
                        className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-display text-base font-bold text-[#15346f] shadow-[0_8px_16px_-10px_rgba(21,52,111,0.6)] ring-1 ring-[#dde8f8] transition-all duration-150 hover:bg-[#f6fafe] active:translate-y-0.5 touch-manipulation lg:gap-[clamp(0.35rem,1vh,0.8rem)] lg:px-[clamp(1.1rem,3vh,2.4rem)] lg:py-[clamp(0.45rem,1.33vh,0.9rem)] lg:text-[clamp(0.95rem,2.35vh,1.5rem)]"
                      >
                        <ArrowLeft className="h-5 w-5 lg:h-[clamp(0.95rem,2.3vh,1.45rem)] lg:w-[clamp(0.95rem,2.3vh,1.45rem)]" />
                        {t.back}
                      </button>
                      <button
                        onClick={onNext}
                        className="flex items-center gap-2 rounded-full bg-gradient-to-b from-[#ffa03f] to-[#f0711a] px-7 py-2.5 font-display text-base font-bold text-white shadow-[0_12px_20px_-10px_rgba(194,65,12,0.9)] ring-1 ring-white/50 transition-all duration-150 hover:brightness-105 active:translate-y-0.5 touch-manipulation lg:gap-[clamp(0.35rem,1vh,0.8rem)] lg:px-[clamp(1.3rem,3.55vh,2.75rem)] lg:py-[clamp(0.45rem,1.33vh,0.9rem)] lg:text-[clamp(0.95rem,2.35vh,1.5rem)]"
                      >
                        {t.next}
                        <ArrowRight className="h-5 w-5 lg:h-[clamp(0.95rem,2.3vh,1.45rem)] lg:w-[clamp(0.95rem,2.3vh,1.45rem)]" />
                      </button>
                    </div>
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
