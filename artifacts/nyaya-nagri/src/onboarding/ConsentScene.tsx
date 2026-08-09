/**
 * Nyaya Nagri — Onboarding step 4: "A grown-up needs to agree"
 * (guardian consent), restyled to the soft-gradient reference card
 * (PRD §9.4 — guardian consent + data minimization, DPDP Act, 2023).
 *
 * Presentation only: consent state and the gated start() stay in
 * OnboardingFlow — this scene renders `consented` and reports changes up.
 * The single checkbox is the ONLY control here (no free text anywhere,
 * §9.4), and the scene sits at z-20 so the global z-50 "Get Help Now"
 * button stays visible and tappable throughout (§9.1).
 *
 * Desktop sizing follows the same vh-clamp discipline as the sibling
 * scenes so the card fits ~800px-tall laptops without scrolling; below
 * lg the base rem sizes apply and the page scrolls naturally.
 */
import React from 'react';
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Sparkles, Sprout } from 'lucide-react';
import { useSettings, type Language } from '@/data/settingsStore';
import { useStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';

interface ConsentSceneProps {
  consented: boolean;
  onConsentChange: (consented: boolean) => void;
  onBack: () => void;
  onStart: () => void;
  startDisabled: boolean;
  step: number;
  stepCount: number;
}

/* The reference tints the words for the consenting adults green inside the
   checkbox sentence. The copy itself stays byte-identical — these are
   PRESENTATION spans wrapped around exact substrings of the existing
   string, per language. */
const HIGHLIGHT_WORDS: Record<Language, string[]> = {
  en: ['parent', 'guardian'],
  hi: ['माता-पिता', 'अभिभावक'],
};

function highlightWords(text: string, words: string[]): React.ReactNode {
  if (words.length === 0) return text;
  const re = new RegExp(`(${words.join('|')})`, 'g');
  return text.split(re).map((part, i) =>
    words.includes(part) ? (
      <strong key={i} className="font-extrabold text-green-700">
        {part}
      </strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

export function ConsentScene({
  consented,
  onConsentChange,
  onBack,
  onStart,
  startDisabled,
  step,
  stepCount,
}: ConsentSceneProps) {
  const t = useStrings();
  const settings = useSettings();
  const consentText = highlightWords(t.consentCheckbox, HIGHLIGHT_WORDS[settings.language]);

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto pointer-events-auto bg-[linear-gradient(178deg,#fdf8ee_0%,#fcecd8_42%,#d9e9fa_100%)]">
      <div className="flex min-h-[100dvh] justify-center px-4 py-4 lg:py-[1.4vh]">
        <section
          aria-labelledby="consent-scene-title"
          className="my-auto w-full max-w-lg lg:max-w-[clamp(31rem,41.5vw,42rem)] rounded-[1.6rem] border border-orange-100/80 bg-white px-5 py-6 shadow-[0_30px_70px_-28px_rgba(30,58,138,0.4)] animate-in zoom-in-95 duration-300 sm:px-8 lg:rounded-[clamp(1.3rem,3vh,2rem)] lg:px-[clamp(2rem,4.6vh,3.2rem)] lg:py-[clamp(1.1rem,2.6vh,1.8rem)]"
        >
          {/* Step dots — 5 steps, current highlighted orange */}
          <div
            className="mb-5 flex justify-center gap-2 lg:mb-[clamp(0.7rem,1.8vh,1.25rem)]"
            aria-hidden="true"
          >
            {Array.from({ length: stepCount }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2.5 rounded-full transition-all duration-300',
                  i === step ? 'w-8 bg-orange-500' : 'w-2.5 bg-orange-200',
                )}
              />
            ))}
          </div>

          {/* Shield-check crest with sparkles */}
          <div className="relative mx-auto mb-4 w-fit lg:mb-[clamp(0.7rem,1.8vh,1.25rem)]">
            <div className="grid h-20 w-20 place-content-center rounded-full bg-green-100 lg:h-[clamp(4.4rem,10.5vh,5.6rem)] lg:w-[clamp(4.4rem,10.5vh,5.6rem)]">
              <ShieldCheck
                className="h-10 w-10 text-green-600 lg:h-[clamp(2.2rem,5.2vh,2.8rem)] lg:w-[clamp(2.2rem,5.2vh,2.8rem)]"
                aria-hidden="true"
              />
            </div>
            <Sparkles
              className="absolute -right-6 top-1 h-4 w-4 text-amber-400"
              aria-hidden="true"
            />
            <Sparkles
              className="absolute -left-6 bottom-3 h-3 w-3 text-amber-300"
              aria-hidden="true"
            />
          </div>

          <h2
            id="consent-scene-title"
            className="mb-2 text-center font-display text-2xl font-bold text-[#0b2a52] md:text-3xl lg:mb-[clamp(0.3rem,0.9vh,0.55rem)] lg:text-[clamp(1.45rem,3.4vh,1.95rem)]"
          >
            {t.guardianTitle}
          </h2>
          <p className="mx-auto mb-5 max-w-md text-center text-sm font-medium text-slate-500 md:text-base lg:mb-[clamp(0.7rem,2vh,1.35rem)] lg:max-w-[85%] lg:text-[clamp(0.84rem,1.9vh,1.02rem)] lg:leading-snug">
            {t.guardianIntro}
          </p>

          {/* What this app saves (device-only) — content unchanged */}
          <div className="mb-4 rounded-2xl border border-sky-100 bg-sky-50 p-4 sm:p-5 lg:mb-[clamp(0.7rem,1.8vh,1.2rem)] lg:p-[clamp(0.95rem,2.3vh,1.45rem)]">
            <p className="mb-2 text-sm font-bold text-sky-700 lg:mb-[clamp(0.35rem,1vh,0.65rem)] lg:text-[clamp(0.8rem,1.8vh,0.98rem)]">
              {t.whatIsStoredTitle}
            </p>
            <ul className="space-y-1.5 lg:space-y-[clamp(0.28rem,0.8vh,0.5rem)]">
              {t.storedPoints.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm font-medium text-slate-600 lg:text-[clamp(0.78rem,1.75vh,0.95rem)] lg:leading-snug"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-sky-100 pt-3 text-sm font-medium text-slate-600 lg:mt-[clamp(0.55rem,1.4vh,0.9rem)] lg:pt-[clamp(0.55rem,1.4vh,0.9rem)] lg:text-[clamp(0.74rem,1.62vh,0.9rem)] lg:leading-snug">
              {t.notStoredNote}
            </p>
          </div>

          {/* Consent checkbox — soft green row, large accessible box */}
          <label className="mb-3 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-green-200 bg-green-50 p-4 transition-all hover:border-green-300 hover:bg-green-100/70 active:scale-[0.99] touch-manipulation lg:mb-[clamp(0.45rem,1.2vh,0.8rem)] lg:gap-[clamp(0.7rem,1.6vh,1rem)] lg:p-[clamp(0.8rem,1.9vh,1.25rem)]">
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => onConsentChange(e.target.checked)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="grid h-7 w-7 shrink-0 place-content-center rounded-md border-2 border-slate-300 bg-white transition-colors peer-checked:border-green-600 peer-checked:bg-green-600 peer-checked:[&>svg]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-green-500 peer-focus-visible:ring-offset-2 lg:h-[clamp(1.6rem,3.6vh,1.95rem)] lg:w-[clamp(1.6rem,3.6vh,1.95rem)]"
            >
              <Check className="h-5 w-5 text-white opacity-0 transition-opacity" strokeWidth={3.5} />
            </span>
            <span className="flex-1 text-sm font-bold leading-snug text-slate-700 sm:text-base lg:text-[clamp(0.84rem,1.9vh,1.02rem)]">
              {consentText}
            </span>
            <Sprout
              className="hidden h-8 w-8 shrink-0 self-center text-green-500 sm:block lg:h-[clamp(1.8rem,4vh,2.25rem)] lg:w-[clamp(1.8rem,4vh,2.25rem)]"
              aria-hidden="true"
            />
          </label>

          <p className="mx-auto mb-5 max-w-md text-center text-xs font-medium text-slate-500 lg:mb-[clamp(0.7rem,1.8vh,1.2rem)] lg:max-w-[88%] lg:text-[clamp(0.66rem,1.45vh,0.82rem)]">
            {t.prototypeNote}
          </p>

          {/* Back / Start rail */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 active:scale-95 touch-manipulation lg:px-[clamp(1.1rem,2.6vh,1.6rem)] lg:py-[clamp(0.48rem,1.35vh,0.8rem)] lg:text-[clamp(0.85rem,1.9vh,1.02rem)]"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              {t.back}
            </button>
            <button
              type="button"
              onClick={onStart}
              disabled={startDisabled}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-7 py-3 text-lg font-bold text-white shadow-md transition-transform hover:bg-blue-700 active:bg-blue-800 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none touch-manipulation lg:px-[clamp(1.4rem,3.2vh,2rem)] lg:py-[clamp(0.48rem,1.35vh,0.8rem)] lg:text-[clamp(0.95rem,2.1vh,1.15rem)]"
            >
              {t.startPlaying}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
