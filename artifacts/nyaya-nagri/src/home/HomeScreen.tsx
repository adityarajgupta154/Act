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
          dvh centre would geometrically collide with the floating
          bottom-right assistant + Get Help group (~11rem tall incl.
          padding) — the 13rem cap is intentionally UNCHANGED: those tiny
          viewports keep the proven safe placement, and the compact group
          simply gains clear air there. pointer-events are
          scoped to the button so the full-width centring strip can never
          swallow clicks. */}
      <div className="pointer-events-none absolute inset-x-0 top-[min(67dvh,calc(100dvh_-_13rem))] z-20 flex -translate-y-1/2 justify-center px-3">
        <div className="pointer-events-auto">
          <PrimaryCta onEnter={onEnter} />
        </div>
      </div>

      {/* Nyaya AI + Get Help Now — ONE compact floating safety/assistant
          group (Aug 2026 compact-widget spec). A single shared bottom-right
          container (flex column, items-end) stacks the robot DIRECTLY above
          the Get Help card with a fixed small gap (8px, md+ 10px) on every
          breakpoint — no more independent viewport coordinates, so the two
          always read as one connected widget and the robot can never "fly
          up". Same components, same behavior: AvatarWidget (Gemini chat +
          voice) and the shared HelpDialog screen (PRD §9.1) with Childline
          1098 / Cyber Crime 155260 on the card. */}
      <div className="pointer-events-none absolute bottom-0 right-0 z-20 flex flex-col items-end gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:gap-2.5 md:p-5 xl:p-6">
        <AvatarWidget />
        <HelpDialog variant="card" />
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
