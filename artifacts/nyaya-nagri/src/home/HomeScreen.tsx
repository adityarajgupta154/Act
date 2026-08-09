/**
 * Nyaya Nagri — Home / landing screen (entry PRESENTATION layer).
 *
 * Redesign brief: a static ILLUSTRATED landing screen rebuilt from the
 * reference image — one pre-rendered city backdrop + HTML/CSS UI overlays.
 * Strictly NO Three.js / R3F / procedural 3D here; the real 3D world starts
 * only after entering (and is lazy-loaded by HomePage).
 *
 * It changes the entry EXPERIENCE only — never the flow logic:
 * - "Enter Nyaya Nagri" simply dismisses this screen; the HUD then shows
 *   the EXISTING onboarding (language first) for new users, or the world
 *   for returning users ({!onboarded && <OnboardingFlow/>} is untouched).
 * - "Explore Nyaya Nagri" does the same — it can never bypass language,
 *   age-band or guardian-consent steps.
 * - "How It Works" opens the SAME HowItWorksContent used by onboarding.
 * - Settings / Accessibility reuse the existing SettingsPanel + ui store
 *   (accessibility controls live inside Settings).
 * - Get Help Now stays on-screen (PRD §9.1) via the SAME HelpDialog and
 *   the same shared help screen — here as a card that also shows the two
 *   helpline numbers: Childline 1098, Cyber Crime 155260.
 *
 * No PII, no text inputs, no emojis (wave ICON instead of the reference's
 * wave emoji — PRD §9 house rule).
 */
import React, { useState } from 'react';
import { useStrings } from '@/i18n/strings';
import { SettingsPanel } from '@/ui/SettingsPanel';
import { AvatarEditOverlay } from '@/player/AvatarEditOverlay';
import { HelpDialog } from '@/ui/HelpDialog';
import { JusticeCrest } from '@/ui/JusticeCrest';
import { HowItWorksContent } from '@/onboarding/HowItWorksContent';
import { HomeBackground } from './HomeBackground';
import { BrandHeader } from './BrandHeader';
import { TopControls } from './TopControls';
import { WelcomeBubble } from './WelcomeBubble';
import { PrimaryCta } from './PrimaryCta';
import { SecondaryActions } from './SecondaryActions';
import { InfoDialog } from './InfoDialog';

export function HomeScreen({ onEnter }: { onEnter: () => void }) {
  const t = useStrings();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);

  return (
    <div className="relative w-full min-h-[100dvh] overflow-hidden bg-sky-200">
      <HomeBackground />
      <BrandHeader />
      <TopControls onAbout={() => setAboutOpen(true)} />

      {/* Desktop speech bubble — left side, above the guide boy, tail pointing
          down at him. It is parked in the sky/hillside band ABOVE the painted
          zone signboards: under `object-cover` those signs always land around
          40–48% of viewport height, so anything lower would cover the artwork's
          "SAFE ZONE" / "RIGHT TO CHILDHOOD" labels. Shown from `md` up, i.e.
          exactly where the boy sprite is shown. */}
      <WelcomeBubble
        className="hidden md:block absolute left-[2%] bottom-[60%] z-20 w-60 lg:w-64 xl:w-72"
        hey={t.homeWelcomeHey}
        title={t.welcomeTitle}
        body={t.welcomeBody}
      />

      {/* Bottom action column. Desktop: CTA cluster centred and lifted off the
          bottom edge so it sits over the plaza as in the reference, with help
          pinned bottom-right. Mobile: bubble + CTAs + help stacked. */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2.5 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:gap-4 md:p-5 md:pb-[5%] xl:gap-5 xl:pb-[7%]">
        <WelcomeBubble
          className="md:hidden self-start ml-1 max-w-[260px]"
          hey={t.homeWelcomeHey}
          title={t.welcomeTitle}
          body={t.welcomeBody}
        />

        <PrimaryCta onEnter={onEnter} />
        <SecondaryActions onExplore={onEnter} onHowItWorks={() => setHowOpen(true)} />

        {/* Get Help Now — same shared help screen (PRD §9.1), card shows the numbers */}
        <div className="w-full pt-1 xl:absolute xl:bottom-6 xl:right-6 xl:w-auto xl:pt-0">
          <HelpDialog variant="card" />
        </div>
      </div>

      {/* Existing overlays, reused as-is (AvatarEditOverlay so the Settings
          panel's "Edit Avatar" action works on Home too, not just in-game) */}
      <SettingsPanel />
      <AvatarEditOverlay />

      <InfoDialog open={howOpen} onOpenChange={setHowOpen} title={t.howItWorksTitle} closeLabel={t.close}>
        <div className="pt-6">
          <HowItWorksContent />
        </div>
      </InfoDialog>

      <InfoDialog open={aboutOpen} onOpenChange={setAboutOpen} title={t.homeAboutTitle} closeLabel={t.close}>
        <div className="flex flex-col items-center pt-2 text-center">
          <JusticeCrest className="w-16 md:w-20" />
          <h2 className="mt-3 font-display font-bold text-2xl text-slate-800 md:text-3xl">{t.homeAboutTitle}</h2>
          <p className="mt-1 font-display font-semibold text-sm text-orange-600">{t.homeTagline}</p>
          <div className="mt-4 space-y-3 text-left">
            {t.homeAboutBody.map((paragraph, i) => (
              <p key={i} className="text-sm md:text-[15px] font-medium leading-relaxed text-slate-600">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </InfoDialog>
    </div>
  );
}
