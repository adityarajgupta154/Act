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
 * - Aug 2026 simplification (user reference image): the journey chip and
 *   both secondary buttons (explore / how-it-works) are REMOVED from
 *   Home — ENTER is the single CTA, centred over the plaza at ~67dvh.
 *   The how-it-works content still exists inside the onboarding flow,
 *   which is untouched.
 * - Settings reuses the existing SettingsPanel + ui store (accessibility
 *   controls live inside Settings; the dedicated top-right accessibility
 *   pill was removed Aug 2026 on user request — functionality untouched).
 * - Get Help Now stays on-screen (PRD §9.1) via the SAME HelpDialog and
 *   the same shared help screen — here as a card that also shows the two
 *   helpline numbers: Childline 1098, Cyber Crime 155260.
 *
 * No PII, no text inputs, no emojis (PRD §9 house rule).
 */
import React, { useState } from 'react';
import { useStrings } from '@/i18n/strings';
import { SettingsPanel } from '@/ui/SettingsPanel';
import { AvatarEditOverlay } from '@/player/AvatarEditOverlay';
import { HelpDialog } from '@/ui/HelpDialog';
import { AvatarWidget } from '@/avatar/AvatarWidget';
import { HomeBackground } from './HomeBackground';
import { BrandHeader } from './BrandHeader';
import { TopControls } from './TopControls';
import { PrimaryCta } from './PrimaryCta';
import { InfoDialog } from './InfoDialog';
import { AboutContent } from './AboutContent';

export function HomeScreen({ onEnter }: { onEnter: () => void }) {
  const t = useStrings();
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="relative w-full min-h-[100dvh] overflow-hidden bg-sky-200">
      <HomeBackground />
      <BrandHeader />
      <TopControls onAbout={() => setAboutOpen(true)} />

      {/* Single primary CTA, horizontally centred in front of the central
          building entrance. Button CENTRE pinned to ~67dvh (Aug 2026
          CTA-shrink task: ~15–20% smaller button, centre dropped ~5dvh =
          roughly 38–54px lower on normal viewports — inside the task's
          35–60px band; dvh, never a fixed pixel offset, so every
          breakpoint scales proportionally and stays centred). The painted
          sign band ends ~48vh on wide screens, so moving DOWN only adds
          clearance to the central building art. The min() clamp is a
          DELIBERATE exception for short landscape phones, where a strict
          dvh centre would geometrically collide with the mobile in-flow
          bottom stack (Nyaya AI row + full-width Get Help bar, ~10rem) —
          the 13rem cap is intentionally UNCHANGED by the shrink task:
          those tiny viewports keep the proven safe placement, and the
          smaller button simply gains clear air there. pointer-events are
          scoped to the button so the full-width centring strip can never
          swallow clicks. */}
      <div className="pointer-events-none absolute inset-x-0 top-[min(67dvh,calc(100dvh_-_13rem))] z-20 flex -translate-y-1/2 justify-center px-3">
        <div className="pointer-events-auto">
          <PrimaryCta onEnter={onEnter} />
        </div>
      </div>

      {/* Bottom chrome only (the CTA cluster left this column with the
          Aug 2026 simplification — no reserved space remains). Mobile:
          Nyaya AI row + full-width Get Help bar stacked in-flow. Desktop:
          both pinned bottom-right as compact floating cards. */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2.5 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:gap-4 md:p-5">
        {/* Nyaya AI — the game's ONE assistant (robot guide, Gemini brain),
            reachable straight from Home. */}
        <div className="flex w-full justify-end pt-1 md:absolute md:bottom-44 md:right-5 md:w-auto md:pt-0 xl:bottom-48 xl:right-6">
          <AvatarWidget />
        </div>

        {/* Get Help Now — same shared help screen (PRD §9.1), card shows the
            numbers. From `md` up this is a COMPACT floating card pinned
            bottom-right, never a full-width bar. */}
        <div className="w-full pt-1 md:absolute md:bottom-5 md:right-5 md:w-auto md:pt-0 xl:bottom-6 xl:right-6">
          <HelpDialog variant="card" />
        </div>
      </div>

      {/* Existing overlays, reused as-is (AvatarEditOverlay so the Settings
          panel's "Edit Avatar" action works on Home too, not just in-game) */}
      <SettingsPanel />
      <AvatarEditOverlay />

      <InfoDialog open={aboutOpen} onOpenChange={setAboutOpen} title={t.homeAboutTitle} closeLabel={t.close}>
        <AboutContent />
      </InfoDialog>
    </div>
  );
}
