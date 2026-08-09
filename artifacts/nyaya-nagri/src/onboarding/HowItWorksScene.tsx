/**
 * Nyaya Nagri — "How it works" scene (onboarding step 1).
 *
 * PRESENTATION ONLY, exactly like WelcomeScene: step state and navigation
 * stay in OnboardingFlow (onBack/onNext are the same setStep handlers the
 * old modal buttons called), and the copy is the SAME shared
 * HowItWorksContent the Home dialog renders. Nothing here stores anything.
 *
 * Composition follows the reference image: the same plaza backdrop and
 * carved cream board as the language scene, the guide boy presenting from
 * the left, Home's brand block + About/Accessibility/Settings pills as the
 * top chrome, and Back/Next on the board's bottom rail. It renders in the
 * onboarding z-20 layer, so the z-50 "Get Help Now" control stays visible
 * and tappable here too (PRD §9.1).
 */
import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useStrings } from '@/i18n/strings';
import { JusticeCrest } from '@/ui/JusticeCrest';
import { BrandHeader } from '@/home/BrandHeader';
import { TopControls } from '@/home/TopControls';
import { InfoDialog } from '@/home/InfoDialog';
import { AboutContent } from '@/home/AboutContent';
import { HowItWorksContent } from './HowItWorksContent';
import { StepDots } from './decor';
import plazaBackdrop from '@/assets/onboarding/plaza-bg.jpg';
import guideCharacter from '@/assets/onboarding/guide-boy.png';

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

  return (
    <div className="absolute inset-0 z-20 pointer-events-auto overflow-y-auto overscroll-contain">
      {/* Same plaza backdrop + scrim as the language scene — one world */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${plazaBackdrop})` }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 bg-gradient-to-b from-sky-950/10 via-transparent to-slate-950/30"
        aria-hidden="true"
      />

      {/* Reference top chrome — the EXISTING Home components, not copies */}
      <BrandHeader />
      <TopControls onAbout={() => setAboutOpen(true)} />

      <div className="relative min-h-full flex flex-col items-center px-3 pb-4 pt-16 md:px-6 md:py-5">
        <StepDots step={step} stepCount={stepCount} />

        {/* Stage: guide boy presenting the info board */}
        <div className="flex-1 w-full flex items-center justify-center py-4 md:py-6">
          <div className="flex items-end justify-center w-full max-w-5xl">
            <img
              src={guideCharacter}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="nn-guide-idle hidden md:block relative z-20 w-[24%] max-w-[275px] -mr-[4.5%] mb-1 select-none pointer-events-none drop-shadow-[0_28px_22px_rgba(15,23,42,0.35)]"
            />

            <div className="relative w-full max-w-xl md:max-w-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-300">
              {/* Carved board: same dark frame, gold bevel, cream face */}
              <div className="relative rounded-[2.75rem] p-2 md:p-2.5 bg-gradient-to-b from-[#8d6a3d] via-[#77532c] to-[#513718] shadow-[0_30px_60px_-20px_rgba(15,23,42,0.75)]">
                <div className="rounded-[2.35rem] p-1.5 bg-gradient-to-b from-[#f8dc95] via-[#e2b458] to-[#c08e30]">
                  <div className="relative rounded-[2rem] bg-gradient-to-b from-[#fdf5e0] via-[#faedd2] to-[#f0dcb4] px-4 pt-10 pb-5 md:px-8 md:pt-11 md:pb-6 shadow-[inset_0_3px_0_rgba(255,255,255,0.95),inset_0_-14px_28px_rgba(176,134,72,0.28)]">
                    {/* Crest on the top rail */}
                    <JusticeCrest className="absolute left-1/2 -translate-x-1/2 -top-9 md:-top-11 w-16 md:w-[4.5rem] drop-shadow-[0_10px_12px_rgba(15,23,42,0.45)]" />

                    <HowItWorksContent />

                    {/* Back / Next — the SAME step handlers the flow always used */}
                    <div className="mt-4 flex items-center justify-between gap-3 md:mt-5">
                      <button
                        onClick={onBack}
                        className="flex items-center gap-2 rounded-full border-b-4 border-amber-300 bg-gradient-to-b from-white to-amber-50 px-5 py-2.5 font-display text-base font-bold text-[#15346f] ring-2 ring-amber-200/70 shadow-[0_6px_14px_-6px_rgba(120,80,20,0.55)] transition-all duration-150 hover:to-amber-100 active:translate-y-0.5 active:border-b-2 touch-manipulation md:px-7 md:py-3 md:text-lg"
                      >
                        <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
                        {t.back}
                      </button>
                      <button
                        onClick={onNext}
                        className="flex items-center gap-2 rounded-full border-b-4 border-orange-800 bg-gradient-to-b from-orange-400 to-orange-600 px-7 py-2.5 font-display text-lg font-bold text-white ring-2 ring-white/60 shadow-[0_8px_18px_-6px_rgba(194,65,12,0.8)] transition-all duration-150 hover:to-orange-500 active:translate-y-0.5 active:border-b-2 touch-manipulation md:px-9 md:py-3 md:text-xl"
                      >
                        {t.next}
                        <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
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
