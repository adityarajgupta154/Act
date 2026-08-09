/**
 * Nyaya Nagri — Welcome + language-selection scene (onboarding step 0).
 *
 * PRESENTATION ONLY. Every behaviour still lives in OnboardingFlow:
 * language state comes from settingsStore, the copy comes from the i18n
 * strings, and "Next" is the same step advance as before. Nothing here
 * reads, stores, or asks for personal data — there is not a single text
 * input on this screen (PRD §9.4).
 *
 * The screen is composed as a 3D game scene rather than a form: a carved
 * cream sign-board on a stone plinth standing in the Nyaya Nagri plaza,
 * with the guide character beside it. It renders inside the onboarding
 * z-20 layer, so the z-50 "Get Help Now" button stays visible and tappable
 * on the very first screen (PRD §9.1).
 */
import React from 'react';
import { ArrowRight, Globe } from 'lucide-react';
import type { Language } from '@/data/settingsStore';
import { useStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';
import { JusticeCrest } from '@/ui/JusticeCrest';
import { StepDots, StarRule } from './decor';
import plazaBackdrop from '@/assets/onboarding/plaza-bg.jpg';
import guideCharacter from '@/assets/onboarding/guide-boy.png';

interface WelcomeSceneProps {
  /** Currently selected UI language (owned by settingsStore). */
  language: Language;
  /** Same handler the old flat buttons used. */
  onSelectLanguage: (language: Language) => void;
  /** Advance to onboarding step 1. */
  onNext: () => void;
  /** Step indicator state, shared with the rest of the flow. */
  step: number;
  stepCount: number;
}

export function WelcomeScene({
  language,
  onSelectLanguage,
  onNext,
  step,
  stepCount,
}: WelcomeSceneProps) {
  const t = useStrings();

  const languageButton = (value: Language, label: string) => {
    const active = language === value;
    return (
      <button
        onClick={() => onSelectLanguage(value)}
        aria-pressed={active}
        lang={value}
        className={cn(
          'flex items-center gap-2.5 rounded-full px-6 md:px-8 py-3 md:py-3.5 font-bold text-lg md:text-xl',
          'border-b-4 transition-all duration-150 active:translate-y-0.5 active:border-b-2 touch-manipulation',
          active
            ? 'bg-gradient-to-b from-orange-400 to-orange-600 text-white border-orange-800 shadow-[0_8px_18px_-6px_rgba(194,65,12,0.8)] ring-2 ring-white/60'
            : 'bg-gradient-to-b from-white to-amber-50 text-slate-700 border-amber-300 shadow-[0_6px_14px_-6px_rgba(120,80,20,0.55)] ring-2 ring-amber-200/70 hover:to-amber-100',
        )}
      >
        <Globe className={cn('w-5 h-5 md:w-6 md:h-6 shrink-0', active ? 'text-white' : 'text-blue-700')} />
        {label}
      </button>
    );
  };

  return (
    <div className="absolute inset-0 z-20 pointer-events-auto overflow-y-auto overscroll-contain">
      {/* Plaza backdrop — the Nyaya Nagri city seen from the courthouse steps */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${plazaBackdrop})` }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 bg-gradient-to-b from-sky-950/10 via-transparent to-slate-950/30"
        aria-hidden="true"
      />

      <div className="relative min-h-full flex flex-col items-center px-3 py-4 md:px-6 md:py-5">
        {/* Step dots (same 5-step indicator, legible over the sky) */}
        <StepDots step={step} stepCount={stepCount} />

        {/* Stage: guide character beside the sign-board */}
        <div className="flex-1 w-full flex items-center justify-center py-4 md:py-6">
          <div className="flex items-end justify-center w-full max-w-5xl">
            <img
              src={guideCharacter}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="hidden md:block relative z-20 w-[26%] max-w-[290px] -mr-[5%] mb-2 select-none pointer-events-none drop-shadow-[0_28px_22px_rgba(15,23,42,0.35)]"
            />

            <div className="relative w-full max-w-xl md:max-w-2xl pb-10 md:pb-12">
              {/* Stone plinth the board stands on */}
              <div
                className="absolute inset-x-[3%] bottom-5 md:bottom-6 h-24 rounded-[1.5rem] bg-gradient-to-b from-slate-400 via-slate-500 to-slate-700 shadow-[0_28px_45px_-18px_rgba(15,23,42,0.8)]"
                aria-hidden="true"
              />

              {/* Carved sign-board: dark frame, gold bevel, cream face */}
              <div className="relative rounded-[2.75rem] p-2 md:p-2.5 bg-gradient-to-b from-[#8d6a3d] via-[#77532c] to-[#513718] shadow-[0_30px_60px_-20px_rgba(15,23,42,0.75)]">
                <div className="rounded-[2.35rem] p-1.5 bg-gradient-to-b from-[#f8dc95] via-[#e2b458] to-[#c08e30]">
                  <div className="relative rounded-[2rem] bg-gradient-to-b from-[#fdf5e0] via-[#faedd2] to-[#f0dcb4] px-5 pt-12 pb-9 md:px-12 md:pt-16 md:pb-11 text-center shadow-[inset_0_3px_0_rgba(255,255,255,0.95),inset_0_-14px_28px_rgba(176,134,72,0.28)]">
                    {/* Crest on the top rail */}
                    <JusticeCrest className="absolute left-1/2 -translate-x-1/2 -top-9 md:-top-12 w-16 md:w-20 drop-shadow-[0_10px_12px_rgba(15,23,42,0.45)]" />

                    {/* Brand ribbon */}
                    <div className="relative w-fit mx-auto mb-1">
                      <span
                        className="absolute -left-3 top-1/2 -translate-y-1/2 h-9 w-9 rotate-45 rounded bg-[#12275c]"
                        aria-hidden="true"
                      />
                      <span
                        className="absolute -right-3 top-1/2 -translate-y-1/2 h-9 w-9 rotate-45 rounded bg-[#12275c]"
                        aria-hidden="true"
                      />
                      <div className="relative rounded-2xl bg-gradient-to-b from-[#3a78d8] to-[#1b3f92] px-7 md:px-10 py-2 md:py-2.5 ring-2 ring-white/25 shadow-[0_10px_20px_-10px_rgba(15,23,42,0.8),inset_0_2px_0_rgba(255,255,255,0.3)]">
                        <span className="font-display font-bold text-3xl md:text-[2.6rem] leading-tight tracking-tight text-orange-400 drop-shadow-[0_2px_2px_rgba(9,20,52,0.6)]">
                          Nyaya <span className="text-white">Nagri</span>
                        </span>
                      </div>
                    </div>

                    <StarRule />

                    <h1 className="font-display font-bold text-2xl md:text-4xl text-[#15346f] mb-3 md:mb-4 text-balance">
                      {t.welcomeTitle}
                    </h1>
                    <p className="text-base md:text-xl font-medium text-slate-700 leading-snug max-w-md mx-auto text-balance">
                      {t.welcomeBody}
                    </p>

                    {/* Choose your language */}
                    <div className="flex items-center justify-center gap-3 mt-6 md:mt-8 mb-4 md:mb-5">
                      <span className="h-[3px] flex-1 max-w-[70px] rounded-full bg-gradient-to-r from-transparent to-amber-400/80" aria-hidden="true" />
                      <p
                        className={cn(
                          'font-display font-bold text-sm md:text-base text-[#1b3f92] whitespace-nowrap',
                          // Devanagari reads badly when letter-spaced, so the
                          // caps treatment applies to the Latin label only.
                          language === 'en' && 'uppercase tracking-[0.14em]',
                        )}
                      >
                        {t.chooseLanguage}
                      </p>
                      <span className="h-[3px] flex-1 max-w-[70px] rounded-full bg-gradient-to-l from-transparent to-amber-400/80" aria-hidden="true" />
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                      {languageButton('en', t.languageEnglish)}
                      {languageButton('hi', t.languageHindi)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Next — straddles the board rim and the plinth, as in the scene */}
              <div className="absolute inset-x-0 bottom-0 flex justify-center">
                <button
                  onClick={onNext}
                  className="flex items-center gap-3 rounded-full bg-gradient-to-b from-[#4cb653] to-[#1f7c2f] text-white font-display font-bold text-xl md:text-3xl px-10 md:px-14 py-3 md:py-3.5 ring-2 ring-white/40 border-b-4 border-[#14532d] shadow-[0_16px_30px_-12px_rgba(15,23,42,0.85)] transition-all duration-150 hover:from-[#54c25b] hover:to-[#238834] active:translate-y-0.5 active:border-b-2 touch-manipulation"
                >
                  {t.next}
                  <ArrowRight className="w-6 h-6 md:w-8 md:h-8" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
