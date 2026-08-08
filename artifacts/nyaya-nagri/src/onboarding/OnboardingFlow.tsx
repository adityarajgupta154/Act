/**
 * Nyaya Nagri — Onboarding flow (Task 13, PRD §6 "age-band selection at
 * onboarding", §9.4 guardian consent + data minimization / DPDP Act, 2023)
 *
 * Four steps, zero PII collected anywhere:
 *   0. Welcome + language choice (EN / HI)
 *   1. "How it works" intro
 *   2. Age-band selection (8-11 / 12-15 / 16-18)
 *   3. Guardian consent — plain-language list of exactly what is stored
 *      (device-only, no names/photos/PII), a single checkbox, and Start.
 *
 * UX-flow prototype only: consent is recorded as a local flag, no backend
 * auth (per the task brief). Device persistence of progress BEGINS only
 * after this consent (progressStore.completeOnboarding).
 *
 * The overlay sits at z-20: BELOW the z-50 layer, so the Get Help Now
 * button stays visible and tappable during onboarding too (PRD §9.1).
 * There are no text inputs here — choices and a checkbox only.
 */
import React, { useState } from 'react';
import {
  Landmark,
  Map as MapIcon,
  MessageCircle,
  ShieldAlert,
  Award,
  Check,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { progressStore, type AgeBand } from '@/data/progressStore';
import { settingsStore, useSettings, type Language } from '@/data/settingsStore';
import { useStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';
import { AvatarBuilder } from '@/player/AvatarBuilder';
import { createDefaultAvatar, type PlayerAvatarConfig } from '@/player/avatarConfig';

const STEP_COUNT = 5;

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [band, setBand] = useState<AgeBand | null>(null);
  const [avatar, setAvatar] = useState<PlayerAvatarConfig>(() => createDefaultAvatar());
  const [consented, setConsented] = useState(false);
  const settings = useSettings();
  const t = useStrings();

  const bands: Array<{ value: AgeBand; desc: string }> = [
    { value: '8-11', desc: t.ageBandDesc811 },
    { value: '12-15', desc: t.ageBandDesc1215 },
    { value: '16-18', desc: t.ageBandDesc1618 },
  ];

  const introIcons = [
    <MapIcon key="map" className="w-5 h-5" />,
    <Award key="award" className="w-5 h-5" />,
    <MessageCircle key="chat" className="w-5 h-5" />,
    <ShieldAlert key="shield" className="w-5 h-5" />,
  ];

  const setLanguage = (language: Language) => settingsStore.update({ language });

  const start = () => {
    if (!band || !consented || !avatar.nickname.trim()) return;
    // Avatar goes into the store first (in-memory pre-consent), then
    // consent is recorded and settings flushed — device persistence
    // (progress AND settings) begins only at that moment.
    progressStore.update({ avatar: { ...avatar, nickname: avatar.nickname.trim() } });
    progressStore.completeOnboarding(band);
    settingsStore.flush();
  };

  return (
    <div className="absolute inset-0 z-20 pointer-events-auto bg-gradient-to-b from-amber-50 via-orange-50 to-sky-100 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-orange-100 w-full max-w-lg my-auto p-6 md:p-8 animate-in zoom-in-95 duration-300">
        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-6" aria-hidden="true">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2.5 rounded-full transition-all duration-300',
                i === step ? 'w-8 bg-orange-500' : 'w-2.5 bg-orange-100',
              )}
            />
          ))}
        </div>

        {/* Step 0 — Welcome + language */}
        {step === 0 && (
          <div className="text-center animate-in fade-in duration-300">
            <div className="mx-auto bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mb-5">
              <Landmark className="w-10 h-10 text-orange-500" />
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-slate-800 mb-3">
              {t.welcomeTitle}
            </h1>
            <p className="text-lg text-slate-600 font-medium mb-6">{t.welcomeBody}</p>

            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
              {t.chooseLanguage}
            </p>
            <div className="flex justify-center gap-3 mb-8">
              <button
                onClick={() => setLanguage('en')}
                aria-pressed={settings.language === 'en'}
                lang="en"
                className={cn(
                  'px-6 py-3 rounded-full font-bold text-lg border-2 transition-colors touch-manipulation',
                  settings.language === 'en'
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300',
                )}
              >
                {t.languageEnglish}
              </button>
              <button
                onClick={() => setLanguage('hi')}
                aria-pressed={settings.language === 'hi'}
                lang="hi"
                className={cn(
                  'px-6 py-3 rounded-full font-bold text-lg border-2 transition-colors touch-manipulation',
                  settings.language === 'hi'
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300',
                )}
              >
                {t.languageHindi}
              </button>
            </div>
          </div>
        )}

        {/* Step 1 — How it works */}
        {step === 1 && (
          <div className="animate-in fade-in duration-300">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-slate-800 mb-6 text-center">
              {t.howItWorksTitle}
            </h2>
            <ul className="space-y-4 mb-8">
              {t.howItWorksPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div
                    className={cn(
                      'p-2.5 rounded-xl shrink-0',
                      i === 3 ? 'bg-red-50 text-red-500' : 'bg-sky-50 text-sky-600',
                    )}
                  >
                    {introIcons[i]}
                  </div>
                  <p className="text-slate-700 font-medium leading-relaxed mt-1">{point}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Step 2 — Age band */}
        {step === 2 && (
          <div className="animate-in fade-in duration-300">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-slate-800 mb-2 text-center">
              {t.howOldAreYou}
            </h2>
            <p className="text-slate-500 font-medium text-center mb-6">{t.ageWhy}</p>
            <div className="flex flex-col gap-3 mb-8" role="group" aria-label={t.howOldAreYou}>
              {bands.map((b) => (
                <button
                  key={b.value}
                  onClick={() => setBand(b.value)}
                  aria-pressed={band === b.value}
                  className={cn(
                    'flex items-center gap-4 w-full p-4 md:p-5 rounded-2xl border-2 text-left transition-all touch-manipulation',
                    band === b.value
                      ? 'border-orange-400 bg-orange-50 shadow-md'
                      : 'border-slate-100 bg-white hover:border-orange-200 shadow-sm',
                  )}
                >
                  <span
                    className={cn(
                      'font-display font-bold text-2xl px-4 py-2 rounded-xl shrink-0',
                      band === b.value ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {b.value}
                  </span>
                  <span className="text-slate-600 font-medium">{b.desc}</span>
                  {band === b.value && (
                    <Check className="w-6 h-6 text-orange-500 ml-auto shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Player avatar builder (Task 14, PRD §7.2): cartoon
            assets only, game nickname only (never a real name) */}
        {step === 3 && (
          <div className="animate-in fade-in duration-300">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-slate-800 mb-1 text-center">
              {t.buildAvatarTitle}
            </h2>
            <p className="text-slate-500 font-medium text-center mb-5">{t.buildAvatarHint}</p>
            <div className="mb-6">
              <AvatarBuilder value={avatar} onChange={setAvatar} />
            </div>
          </div>
        )}

        {/* Step 4 — Guardian consent (DPDP-aware, no PII collected: the
            only free text anywhere is the game nickname above) */}
        {step === 4 && (
          <div className="animate-in fade-in duration-300">
            <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-slate-800 mb-2 text-center">
              {t.guardianTitle}
            </h2>
            <p className="text-slate-500 font-medium text-center mb-5">{t.guardianIntro}</p>

            <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 md:p-5 mb-4">
              <p className="font-bold text-sky-700 text-sm mb-2">{t.whatIsStoredTitle}</p>
              <ul className="space-y-1.5">
                {t.storedPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                    <Check className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-slate-600 font-medium border-t border-sky-100 pt-3">
                {t.notStoredNote}
              </p>
            </div>

            <label className="flex items-start gap-3 bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-3 cursor-pointer touch-manipulation">
              <input
                type="checkbox"
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="w-6 h-6 mt-0.5 accent-green-600 shrink-0 touch-compact"
              />
              <span className="text-slate-700 font-bold leading-snug">{t.consentCheckbox}</span>
            </label>
            <p className="text-xs text-slate-400 font-medium text-center mb-6">{t.prototypeNote}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-5 py-3 rounded-full font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors active:scale-95 touch-manipulation"
            >
              <ArrowLeft className="w-5 h-5" />
              {t.back}
            </button>
          ) : (
            <span />
          )}

          {step < STEP_COUNT - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={(step === 2 && !band) || (step === 3 && !avatar.nickname.trim())}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-7 py-3 rounded-full font-bold text-lg transition-transform active:scale-95 shadow-md touch-manipulation"
            >
              {t.next}
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={start}
              disabled={!consented || !band}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-slate-200 disabled:text-slate-400 text-white px-7 py-3 rounded-full font-bold text-lg transition-transform active:scale-95 shadow-md touch-manipulation"
            >
              {t.startPlaying}
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
