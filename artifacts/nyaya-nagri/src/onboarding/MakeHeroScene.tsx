/**
 * Nyaya Nagri — "Make your hero" scene (onboarding step 3).
 *
 * Rebuilt against the user's plaza reference frame, PRESENTATION ONLY:
 * every piece of state (Boy/Girl drafts, selected character, nickname)
 * stays in OnboardingFlow exactly as before, the option rows are the same
 * shared AvatarBuilder (variant="scene"), Next keeps its nickname gating,
 * and the z-50 "Get Help Now" control stays reachable above this z-20
 * layer (PRD §9.1). Cartoon assets + game nickname only — no photos, no
 * real names (PRD §9.4).
 *
 * The reference's big boy standing on the plaza IS the live hero (task
 * brief: the preview must never be a static image), so he is the same
 * procedural SVG avatar rendered large — change a pill and both he and
 * the in-panel preview update instantly. He mirrors whichever hero is
 * currently selected.
 *
 * Reference geometry, measured off the frame and held as viewport
 * fractions (1756x895 source):
 *   panel  gold rim x 23.7→76vw (~52.4vw wide, centred), y ~12.5→97vh
 *          (~84vh tall); preview sub-panel starts 25.9vw (~15vw wide,
 *          left column of the card)
 *   crest  ~9.8vh shield + laurels, just over half above the top rail
 *   boy    bottom-left, feet on the pavement (~97.5vh), width-capped so
 *          he can never reach the panel's left edge at any lg size
 * Type/spacing scale with viewport HEIGHT (clamp vh + rem caps); heights
 * pin to 100dvh (percentage chains collapse on auto-height parents).
 */
import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Star } from 'lucide-react';
import { useStrings } from '@/i18n/strings';
import { JusticeCrest } from '@/ui/JusticeCrest';
import { BrandHeader } from '@/home/BrandHeader';
import { TopControls } from '@/home/TopControls';
import { InfoDialog } from '@/home/InfoDialog';
import { AboutContent } from '@/home/AboutContent';
import { AvatarBuilder } from '@/player/AvatarBuilder';
import { PlayerAvatar } from '@/player/PlayerAvatar';
import type { CharacterType, PlayerAvatarConfig } from '@/player/avatarConfig';
import { Laurel, StepDots } from './decor';
import plazaBackdrop from '@/assets/onboarding/plaza-bg.jpg';

/** Crest size and how far it lifts above the panel's top rail. */
const CREST_SIZE = 'min(9.4vh, 10vw)';
const CREST_LIFT = `calc(${CREST_SIZE} * -0.53)`;
/**
 * Plaza hero width. The avatar SVG canvas is 100x120 (h = 1.2w), so a
 * 48vh width renders ~57.6vh head-to-feet — the guide-boy scale of the
 * sibling scenes. The 20vw cap keeps him clear of the panel's left rim
 * (~24vw at the panel's 34rem minimum width) at every lg viewport.
 */
const HERO_WIDTH = 'min(52vh, 21.5vw)';

/** Gold rule under the title: tapered lines, tiny diamonds, centre star. */
function DiamondRule() {
  return (
    <div
      className="my-2 flex items-center justify-center gap-1.5 lg:my-[clamp(0.2rem,0.6vh,0.5rem)] lg:gap-[clamp(0.3rem,0.9vh,0.7rem)]"
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

interface MakeHeroSceneProps {
  /** The SELECTED hero's draft (state lives in OnboardingFlow, as before). */
  value: PlayerAvatarConfig;
  /** Same draft patcher the inline card used. */
  onChange: (config: PlayerAvatarConfig) => void;
  /** Boy/Girl card tapped — parent swaps which draft is `value`. */
  onSelectCharacter: (character: CharacterType) => void;
  /** Both drafts, for the un-selected hero card preview. */
  drafts: Partial<Record<CharacterType, PlayerAvatarConfig>>;
  /** Return to the age-band scene (same setStep handler as before). */
  onBack: () => void;
  /** Advance to guardian consent — stays disabled until a nickname is typed. */
  onNext: () => void;
  /** Same gating rule the inline card used: blank nickname blocks Next. */
  nextDisabled: boolean;
  /** Step indicator state, shared with the rest of the flow. */
  step: number;
  stepCount: number;
}

export function MakeHeroScene({
  value,
  onChange,
  onSelectCharacter,
  drafts,
  onBack,
  onNext,
  nextDisabled,
  step,
  stepCount,
}: MakeHeroSceneProps) {
  const t = useStrings();
  const [aboutOpen, setAboutOpen] = useState(false);

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

        {/* The hero on the plaza — the SAME live config as the panel preview,
            so every pill tap re-dresses him instantly (task brief: the big
            boy is the live preview, never a static image). Decorative for
            assistive tech; the accessible controls live in the panel. */}
        <div
          className="pointer-events-none absolute bottom-[2.2vh] left-[1.2vw] hidden select-none lg:block"
          style={{ width: HERO_WIDTH }}
          aria-hidden="true"
        >
          <div className="w-full drop-shadow-[0_22px_18px_rgba(15,23,42,0.32)] [&_svg]:h-auto [&_svg]:w-full">
            <PlayerAvatar config={value} size={560} />
          </div>
        </div>

        {/* Panel column — centred, sized to the reference card. Below lg the
            card is taller than the viewport, so my-auto pins it to the top:
            pad the top until it clears the brand header, dots and crest. */}
        <div className="flex min-h-[100dvh] justify-center px-4 py-6 pt-[8.5rem] sm:pt-[5.5rem] lg:pt-6">
          <div className="relative my-auto w-full max-w-lg lg:w-[clamp(34rem,52.4vw,66rem)] lg:max-w-none">
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
                <div className="relative flex flex-col rounded-[1.9rem] bg-gradient-to-b from-[#fdf7eb] to-[#f4e4c8] px-5 pb-4 pt-6 shadow-[inset_0_2px_0_rgba(255,255,255,0.85)] lg:min-h-[79vh] lg:px-[clamp(1.2rem,2.2vw,2.8rem)] lg:pb-[clamp(0.6rem,1.4vh,1.1rem)] lg:pt-[clamp(1rem,2.8vh,2.1rem)]">
                  {/* Inset hairline border, as on the reference face */}
                  <div
                    className="pointer-events-none absolute inset-[9px] rounded-[1.55rem] border border-[#d9ae5e]/45 lg:inset-[clamp(0.5rem,1.4vh,1rem)]"
                    aria-hidden="true"
                  />

                  {/* Title + rule + subtitle */}
                  <div className="flex items-center justify-center gap-2.5 lg:gap-[clamp(0.5rem,1.6vh,1.2rem)]">
                    <Sparkles
                      className="h-5 w-5 shrink-0 fill-amber-400 text-amber-500 drop-shadow-sm lg:h-[clamp(0.9rem,2.4vh,1.8rem)] lg:w-[clamp(0.9rem,2.4vh,1.8rem)]"
                      aria-hidden="true"
                    />
                    <h2 className="font-display text-3xl font-bold leading-tight text-[#0b2a52] text-balance lg:text-[clamp(1.45rem,3.3vh,2.4rem)]">
                      {t.buildAvatarTitle}
                    </h2>
                    <Sparkles
                      className="h-5 w-5 shrink-0 fill-amber-400 text-amber-500 drop-shadow-sm lg:h-[clamp(0.9rem,2.4vh,1.8rem)] lg:w-[clamp(0.9rem,2.4vh,1.8rem)]"
                      aria-hidden="true"
                    />
                  </div>
                  <DiamondRule />
                  <p className="mb-4 text-center text-sm font-semibold text-[#223c68] lg:mb-[clamp(0.4rem,1.1vh,0.85rem)] lg:text-[clamp(0.78rem,1.7vh,1.15rem)]">
                    {t.buildAvatarHint}
                  </p>

                  {/* The builder itself — same component, same state,
                      plaza presentation */}
                  <AvatarBuilder
                    value={value}
                    onChange={onChange}
                    onSelectCharacter={onSelectCharacter}
                    drafts={drafts}
                    variant="scene"
                  />

                  {/* Back / Next — the SAME handlers and gating as before */}
                  <div className="mt-4 flex items-center justify-between gap-3 pt-1 lg:mt-[clamp(0.5rem,1.2vh,0.95rem)] lg:pt-0">
                    <button
                      onClick={onBack}
                      className="flex items-center gap-2 rounded-full bg-[#f7f0de] px-5 py-2.5 font-display text-base font-bold text-[#4a3a22] shadow-[0_8px_16px_-10px_rgba(101,67,10,0.6)] ring-1 ring-[#e7d9ba] transition-all duration-150 hover:bg-[#fbf5e7] active:translate-y-0.5 touch-manipulation lg:gap-[clamp(0.35rem,1vh,0.8rem)] lg:px-[clamp(1.1rem,3.1vh,2.3rem)] lg:py-[clamp(0.38rem,1.15vh,0.85rem)] lg:text-[clamp(0.9rem,2.05vh,1.45rem)]"
                    >
                      <ArrowLeft className="h-5 w-5 lg:h-[clamp(0.9rem,2vh,1.4rem)] lg:w-[clamp(0.9rem,2vh,1.4rem)]" />
                      {t.back}
                    </button>
                    <button
                      onClick={onNext}
                      disabled={nextDisabled}
                      className="flex items-center gap-2 rounded-full bg-gradient-to-b from-[#ffa03f] to-[#f0711a] px-7 py-2.5 font-display text-base font-bold text-white shadow-[0_12px_20px_-10px_rgba(194,65,12,0.9)] ring-1 ring-white/50 transition-all duration-150 hover:brightness-105 active:translate-y-0.5 touch-manipulation disabled:cursor-not-allowed disabled:opacity-45 disabled:saturate-[.6] disabled:shadow-none lg:gap-[clamp(0.35rem,1vh,0.8rem)] lg:px-[clamp(1.3rem,3.5vh,2.7rem)] lg:py-[clamp(0.38rem,1.15vh,0.85rem)] lg:text-[clamp(0.9rem,2.05vh,1.45rem)]"
                    >
                      {t.next}
                      <ArrowRight className="h-5 w-5 lg:h-[clamp(0.9rem,2vh,1.4rem)] lg:w-[clamp(0.9rem,2vh,1.4rem)]" />
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
