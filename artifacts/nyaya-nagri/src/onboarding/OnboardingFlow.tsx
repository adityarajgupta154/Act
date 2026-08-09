/**
 * Nyaya Nagri — Onboarding flow (Task 13, PRD §6 "age-band selection at
 * onboarding", §9.4 guardian consent + data minimization / DPDP Act, 2023)
 *
 * Five steps, zero PII collected anywhere:
 *   0. Welcome + language choice (EN / HI)
 *   1. "How it works" intro
 *   2. Age-band selection (8-11 / 12-15 / 16-18)
 *   3. "Make your hero" — Boy/Girl character choice (both drafts kept
 *      while switching) + cartoon avatar builder + game nickname
 *   4. Guardian consent — plain-language list of exactly what is stored
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
import { progressStore, type AgeBand } from '@/data/progressStore';
import { settingsStore, useSettings, type Language } from '@/data/settingsStore';
import {
  createDefaultAvatar,
  type CharacterType,
  type PlayerAvatarConfig,
} from '@/player/avatarConfig';
import { WelcomeScene } from './WelcomeScene';
import { HowItWorksScene } from './HowItWorksScene';
import { AgeBandScene } from './AgeBandScene';
import { MakeHeroScene } from './MakeHeroScene';
import { ConsentScene } from './ConsentScene';

const STEP_COUNT = 5;

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [band, setBand] = useState<AgeBand | null>(null);
  // Boy/Girl hero drafts: BOTH are kept while the child flips between the
  // cards, so no customization is ever lost mid-flow (switch boy -> girl ->
  // back leaves each exactly as last edited). Boy stays the default; only
  // the SELECTED hero's config is saved at Start. The one game nickname is
  // shared — it travels across when switching.
  const [character, setCharacter] = useState<CharacterType>('boy');
  const [drafts, setDrafts] = useState<Record<CharacterType, PlayerAvatarConfig>>(() => ({
    boy: createDefaultAvatar('boy'),
    girl: createDefaultAvatar('girl'),
  }));
  const avatar = drafts[character];
  const setAvatar = (config: PlayerAvatarConfig) =>
    setDrafts((d) => ({ ...d, [character]: config }));
  const selectCharacter = (c: CharacterType) => {
    if (c === character) return;
    setDrafts((d) => ({ ...d, [c]: { ...d[c], nickname: d[character].nickname } }));
    setCharacter(c);
  };
  const [consented, setConsented] = useState(false);
  const settings = useSettings();

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

  // Step 0 — Welcome + language, presented as the plaza sign-board scene.
  // Same language handler, same strings, same step advance as before.
  if (step === 0) {
    return (
      <WelcomeScene
        language={settings.language}
        onSelectLanguage={setLanguage}
        onNext={() => setStep(1)}
        step={step}
        stepCount={STEP_COUNT}
      />
    );
  }

  // Step 1 — "How it works", presented as the plaza info-board scene
  // (reference redesign). Same shared content, same step handlers.
  if (step === 1) {
    return (
      <HowItWorksScene
        onBack={() => setStep(0)}
        onNext={() => setStep(2)}
        step={step}
        stepCount={STEP_COUNT}
      />
    );
  }

  // Step 2 — Age-band selection, presented as the plaza panel scene
  // (reference redesign). Same band state, same step handlers, Next
  // still gated on a chosen band.
  if (step === 2) {
    return (
      <AgeBandScene
        band={band}
        onSelect={setBand}
        onBack={() => setStep(1)}
        onNext={() => setStep(3)}
        step={step}
        stepCount={STEP_COUNT}
      />
    );
  }

  // Step 3 — "Make your hero", presented as the plaza panel scene
  // (reference redesign). Same dual-draft state, same character switch,
  // same nickname gating on Next; the plaza hero and the panel preview
  // both render the live draft.
  if (step === 3) {
    return (
      <MakeHeroScene
        value={avatar}
        onChange={setAvatar}
        onSelectCharacter={selectCharacter}
        drafts={drafts}
        onBack={() => setStep(2)}
        onNext={() => setStep(4)}
        nextDisabled={!avatar.nickname.trim()}
        step={step}
        stepCount={STEP_COUNT}
      />
    );
  }

  // Step 4 — Guardian consent, presented as the soft-gradient card scene
  // (reference redesign). Same single checkbox, same consent state, same
  // gated start(); Start stays disabled until the guardian agrees.
  return (
    <ConsentScene
      consented={consented}
      onConsentChange={setConsented}
      onBack={() => setStep(3)}
      onStart={start}
      startDisabled={!consented || !band}
      step={step}
      stepCount={STEP_COUNT}
    />
  );
}
