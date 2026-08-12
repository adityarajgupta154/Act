import React, { useRef, useEffect, useState } from 'react';
import { useJoystick } from './JoystickContext';
import { HelpDialog } from './HelpDialog';
import {
  Settings,
  Map as MapIcon,
  Users,
  Trophy,
  Scale,
  MapPin,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  BadgeCheck,
} from 'lucide-react';
import { useUIStore, enterZone, exitZone, openProgress, openSettings, openCommunity, openStoryMap, enterLevel, clearLevel } from './uiStore';
import { ProgressOverlay } from './ProgressScreen';
import { MapOverlay } from './MapScreen';
import { StoryOverlay } from '@/story/StoryOverlay';
import { StoryAdventureMap } from '@/story/StoryAdventureMap';
import { STORY_LEVELS, isStoryLevelUnlockedIn } from '@/story/storyData';
import { CertificateOverlay } from '@/certificates/CertificateModal';
import { SettingsPanel } from './SettingsPanel';
import { CommunityOverlay } from './CommunityScreen';
import { getZoneStates, getZone } from '@/world/zones';
import { progressStore } from '@/data/progressStore';
import { useSettings } from '@/data/settingsStore';
import { useStrings } from '@/i18n/strings';
import { AvatarWidget } from '@/avatar/AvatarWidget';
import { OnboardingFlow } from '@/onboarding/OnboardingFlow';
import { AvatarEditOverlay } from '@/player/AvatarEditOverlay';
import { AvatarShopOverlay } from '@/economy/AvatarShop';
import { PlayerProfile } from './PlayerProfile';
import { Minimap } from './Minimap';
import { resolveQuest } from '@/quests/registry';
import { QuestPlayer } from '@/quests/QuestPlayer';
import { LevelSelect } from '@/quests/LevelSelect';
import { GameQuestFlow } from '@/quests/GameQuestFlow';
import { getZoneGameFlow } from '@/quests/gameFlows';
import { getLevelStatuses } from '@/quests/levels';
// Quiz-screen backdrop (Aug 2026): generated in-house doodle scene (books,
// pencil, lightbulb, hills) — replaces the plain frosted slate backdrop so
// every level/quiz surface sits in a playful classroom-sky world.
import quizDoodleBgUrl from '@/assets/ui/quiz-doodle-bg.webp';

/** Task 13: has the onboarding (intro, age band, guardian consent) run? */
function useOnboarded(): boolean {
  const [onboarded, setOnboarded] = useState(() => progressStore.getState().onboarded);
  useEffect(() => progressStore.subscribe((s) => setOnboarded(s.onboarded)), []);
  return onboarded;
}

/* Reference redesign (Aug 2026) + map declutter: the old left-rail chip
   stack (badges / rank / coins / streak / My Progress / Rights Community)
   now lives INSIDE the expandable PlayerProfile card — see
   PlayerProfile.tsx. Only the brand card and that ONE card stay on the
   left; the dropdown overlays the map without moving anything. */


/**
 * Reference redesign: top-center banner pointing at the next zone to play
 * (first unlocked-but-uncompleted zone). Purely informative — entering
 * still happens by walking there. Hidden once every zone is complete and
 * on small screens where it would crowd the chip column.
 */
function NextZoneBanner() {
  const t = useStrings();
  const [states, setStates] = useState(getZoneStates());
  useEffect(() => {
    return progressStore.subscribe(() => setStates(getZoneStates()));
  }, []);

  const next = states.find((z) => z.unlocked && !z.completed);
  if (!next) return null;
  const zoneName = t.zones[next.id]?.name ?? next.name;

  return (
    <div className="hidden md:flex absolute top-4 md:top-6 left-1/2 -translate-x-1/2 items-center gap-3 bg-white rounded-2xl shadow-md border border-slate-100 px-4 py-2.5">
      <span className="w-9 h-9 rounded-xl bg-blue-500 text-white grid place-content-center shrink-0">
        <MapPin className="w-5 h-5" />
      </span>
      <span className="leading-tight">
        <span className="block font-display font-bold text-sm text-[#0b2a52]">{zoneName}</span>
        <span className="block text-xs font-semibold text-slate-500">{t.startHereTagline}</span>
      </span>
    </div>
  );
}

function ProximityPrompt() {
  const { nearbyZoneId } = useUIStore();
  const [states, setStates] = useState(getZoneStates());
  const t = useStrings();

  useEffect(() => {
    return progressStore.subscribe(() => setStates(getZoneStates()));
  }, []);

  if (!nearbyZoneId) return null;

  const zoneState = states.find(z => z.id === nearbyZoneId);
  if (!zoneState) return null;

  const zoneName = t.zones[zoneState.id]?.name ?? zoneState.name;

  if (zoneState.unlocked) {
    return (
      <div className="bg-white px-6 py-4 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center gap-3 pointer-events-auto animate-in slide-in-from-bottom-4 duration-200">
        <h3 className="font-display font-bold text-xl text-[#0b2a52]">{zoneName}</h3>
        <button
          onClick={() => enterZone(nearbyZoneId)}
          className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-6 py-3 rounded-full font-bold transition-transform active:scale-95 shadow-md flex items-center gap-2 touch-manipulation"
        >
          {t.pressToEnter}
        </button>
      </div>
    );
  }

  const previous = states.find(z => z.order === zoneState.order - 1);
  const previousName = previous ? (t.zones[previous.id]?.name ?? previous.name) : null;
  return (
    <div className="bg-white px-6 py-4 rounded-3xl shadow-lg border border-slate-100 flex flex-col items-center gap-2 pointer-events-auto opacity-95 animate-in slide-in-from-bottom-4 duration-200">
      <h3 className="font-display font-bold text-xl text-slate-500">{zoneName}</h3>
      <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
        {t.locked}
      </div>
      {previousName && (
        <p className="text-sm font-medium text-slate-500">
          {t.completeFirst(previousName)}
        </p>
      )}
    </div>
  );
}

/**
 * Story Adventure door prompt — mirrors ProximityPrompt exactly. Appears
 * only while standing at the house (nearbyStoryId) and never fights a zone
 * prompt: the house sits >11 units from every zone anchor, so the two can
 * never be non-null together. The button opens the LEVEL MAP (progression
 * screen) — never a story directly; the second line previews the next
 * unplayed level from the SAME data/lock rule the map itself renders.
 */
function StoryPrompt() {
  const { nearbyStoryId, activeStory, storyMapOpen } = useUIStore();
  const { language } = useSettings();
  const t = useStrings();
  const [progress, setProgress] = useState(() => progressStore.getState());
  useEffect(() => progressStore.subscribe(setProgress), []);

  if (!nearbyStoryId || activeStory || storyMapOpen) return null;
  // Slide-less teasers COUNT here (game-gated castle flow): the prompt
  // previews the next unlockable level even before its slides ship.
  const storyProgress = progress.storyProgress;
  const doneCount = STORY_LEVELS.filter((l) => storyProgress[l.id]).length;
  const next =
    STORY_LEVELS.find(
      (l) => !storyProgress[l.id] && isStoryLevelUnlockedIn(progress, l.id),
    ) ?? null;
  const allDone = STORY_LEVELS.length > 0 && doneCount === STORY_LEVELS.length;
  // A still-locked game-gated level names the zone that opens it.
  const firstLocked =
    STORY_LEVELS.find((l) => !storyProgress[l.id] && l.unlockRequires) ?? null;
  const lockedZoneName = firstLocked?.unlockRequires
    ? (t.zones[firstLocked.unlockRequires.zoneId]?.name ?? '')
    : '';

  return (
    <div className="bg-white px-6 py-4 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center gap-3 pointer-events-auto animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-orange-100 text-orange-500 grid place-content-center shrink-0">
          <BookOpen className="w-5 h-5" />
        </span>
        <span className="leading-tight text-left">
          <span className="block font-display font-bold text-xl text-[#0b2a52]">
            {t.storyAdventure}
          </span>
          <span className="block text-sm font-semibold text-slate-500">
            {next
              ? `${t.levelN(next.number)} — ${next.title[language]}`
              : allDone
                ? t.storyMapAllDone
                : lockedZoneName
                  ? t.completeFirst(lockedZoneName)
                  : t.storyMapComingSoon}
          </span>
        </span>
      </div>
      {allDone && (
        <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
          <BadgeCheck className="w-4 h-4" />
          {t.levelCompletedTag}
        </span>
      )}
      <button
        onClick={() => openStoryMap()}
        className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-6 py-3 rounded-full font-bold transition-transform active:scale-95 shadow-md flex items-center gap-2 touch-manipulation"
      >
        {t.storyEnterCta}
      </button>
    </div>
  );
}

function ZoneInterior({ zoneId }: { zoneId: string }) {
  // Task 15: which level is being played (null = Level-Select screen).
  const [playing, setPlaying] = useState<{ levelIndex: number; practice: boolean } | null>(null);
  const { language } = useSettings();
  const t = useStrings();

  // Leaving the zone in ANY way clears the level-entry signal.
  useEffect(() => () => clearLevel(), []);

  const zone = getZone(zoneId);
  if (!zone) return null;

  const ageBand = progressStore.getState().ageBand;
  // The quest is resolved in the CURRENT app language; once started, the
  // session keeps that language for the whole level (see QuestPlayer).
  const quest = resolveQuest(zoneId, ageBand, language);
  const zoneStrings = t.zones[zoneId];

  if (playing && quest) {
    return (
      <QuestPlayer
        key={`${quest.questId}:${playing.levelIndex}:${playing.practice}`}
        quest={quest}
        levelIndex={playing.levelIndex}
        practice={playing.practice}
        onExit={() => {
          clearLevel();
          setPlaying(null);
        }}
      />
    );
  }

  if (!quest) {
    // No content registered for this zone yet — plain centred card with exit.
    return (
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-2xl w-full text-center border border-slate-100 animate-in zoom-in-95 duration-300 pointer-events-auto">
          <div className="mx-auto bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <MapIcon className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-800 mb-4">{zoneStrings?.name ?? zone.name}</h2>
          <p className="text-lg md:text-xl text-slate-600 mb-10 font-medium">{zoneStrings?.theme ?? zone.theme}</p>
          <button
            onClick={exitZone}
            className="bg-sky-50 hover:bg-sky-100 active:bg-sky-200 text-sky-700 px-8 py-4 rounded-full font-bold text-lg transition-transform active:scale-95 shadow-sm border border-sky-200 mx-auto touch-manipulation"
          >
            {t.backToMap}
          </button>
        </div>
      </div>
    );
  }

  // Game-first castle flow (Aug 2026): zones registered in gameFlows run
  // the "Right or Wrong?" GAME → final quiz (same questions, same engine
  // finalization) instead of the level-select screen. Ordering (game
  // BEFORE quiz) is enforced inside the flow component; the global Get
  // Help Now pill stays above.
  const gameFlow = getZoneGameFlow(zoneId);
  if (gameFlow) {
    return (
      <GameQuestFlow
        flow={gameFlow}
        quest={quest}
        zoneName={zoneStrings?.name ?? zone.name}
        zoneTheme={zoneStrings?.theme ?? zone.theme}
      />
    );
  }

  return (
    <LevelSelect
      quest={quest}
      zoneName={zoneStrings?.name ?? zone.name}
      zoneTheme={zoneStrings?.theme ?? zone.theme}
      onStart={(levelIndex, practice) => {
        // Task 26 gating (defence in depth): LevelSelect only renders
        // buttons for unlocked/completed levels, but re-check here so NO
        // code path can ever start a locked level.
        if (getLevelStatuses(quest)[levelIndex] === 'locked') return;
        // Signal the AI companion BEFORE mounting the player, so the
        // level greeting appears as the level opens (Task 15).
        enterLevel(zoneId, levelIndex, quest.levels[levelIndex].kind);
        setPlaying({ levelIndex, practice });
      }}
    />
  );
}

export function HUD() {
  const { activeZoneId, fadeOpacity } = useUIStore();
  const t = useStrings();
  const onboarded = useOnboarded();

  // Task 16: opening the game counts as "played today" — the streak grows
  // gently from simply showing up (idempotent per local calendar day).
  useEffect(() => {
    if (onboarded) progressStore.touchDailyStreak();
  }, [onboarded]);

  // Reference redesign: two-tone brand wordmark (first word orange, rest
  // navy) — a presentation-only split of the SAME localized appTitle.
  const [brandFirst, ...brandRest] = t.appTitle.split(' ');

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      
      {/* Normal HUD / Map View Elements */}
      {!activeZoneId && (
        <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-6 animate-in fade-in duration-300">
          {/* Top-center: where to go next */}
          <NextZoneBanner />

          {/* Top Bar — z-20 so the profile dropdown paints (and receives
              taps) above the joystick/prompt rows if they overlap on very
              short screens */}
          <div className="flex justify-between items-start w-full z-20">
            <div className="flex flex-col gap-2 pointer-events-auto">
              <div className="bg-white px-4 py-2.5 rounded-2xl shadow-md border border-slate-100 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-[#152a52] grid place-content-center shrink-0">
                  <Scale className="w-6 h-6 text-amber-400" />
                </span>
                <h1 className="font-display font-bold text-xl md:text-2xl tracking-wide leading-none">
                  <span className="text-orange-500">{brandFirst}</span>
                  {brandRest.length > 0 && (
                    <>
                      {' '}
                      <span className="text-[#0b2a52]">{brandRest.join(' ')}</span>
                    </>
                  )}
                </h1>
              </div>
              {/* Map declutter (Aug 2026): ONE expandable profile card owns
                  every player stat + the My Progress / Rights Community
                  shortcuts (old floating chips removed — PlayerProfile.tsx).
                  Its dropdown overlays the map; nothing below ever shifts. */}
              {onboarded && <PlayerProfile />}
            </div>
            <div className="flex flex-col items-end gap-3 pointer-events-auto">
              <button 
                onClick={openSettings}
                className="bg-white p-3 md:p-3.5 rounded-full shadow-md border border-slate-100 hover:bg-slate-50 transition-colors active:scale-95 touch-manipulation"
                aria-label={t.settings}
              >
                <Settings className="w-6 h-6 text-slate-500" />
              </button>
              <Minimap />
            </div>
          </div>

          {/* Bottom Center Prompt (zone gate or story house — the two can
              never be non-null together, so at most one card shows) */}
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 w-max max-w-[90vw]">
            <ProximityPrompt />
            <StoryPrompt />
          </div>

          {/* Reference bottom bar: three quick shortcuts (md+ only — on
              phones the joystick and Get Help pill already own the bottom). */}
          <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-10 items-center gap-1 bg-[#16254c]/95 rounded-full px-2 py-1.5 shadow-lg pointer-events-auto">
            <button
              onClick={openProgress}
              className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 active:scale-95 transition-colors text-white font-bold text-sm touch-manipulation"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              {t.learnRights}
            </button>
            <button
              onClick={openCommunity}
              className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 active:scale-95 transition-colors text-white font-bold text-sm touch-manipulation"
            >
              <Users className="w-4 h-4 text-blue-300" />
              {t.helpOthers}
            </button>
            <button
              onClick={openProgress}
              className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 active:scale-95 transition-colors text-white font-bold text-sm touch-manipulation"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              {t.earnBadges}
            </button>
          </div>

          {/* Bottom Left Joystick */}
          <div className="flex justify-start items-end w-full z-10">
            <div className="w-32 h-32 md:w-40 md:h-40 pointer-events-auto shrink-0 mb-2 md:mb-4">
              <JoystickUI />
            </div>
          </div>
        </div>
      )}

      {/* Interior View Overlay — doodle-scene backdrop behind every level
          select / quiz / game screen (bg-sky-100 shows while it loads).
          No flex-centering: LevelSelect / QuestPlayer / GameQuestFlow each
          manage their own full-screen layout; the "no quest" fallback adds
          centering inside ZoneInterior. */}
      {activeZoneId && (
        <div
          className="absolute inset-0 z-30 pointer-events-auto bg-sky-100 bg-cover bg-center"
          style={{ backgroundImage: `url(${quizDoodleBgUrl})` }}
        >
          <ZoneInterior zoneId={activeZoneId} />
        </div>
      )}

      {/* Story Adventure LEVEL MAP (z-30) — the Candy-Crush-style
          progression screen the house door opens; stories launch from its
          nodes and the unlock cinematic plays here. Stands down while a
          story is open. Mounted BEFORE the Progress/Community overlays
          (same z-30): the map's reference bottom bar opens those screens,
          and later siblings paint on top, so they appear ABOVE the map and
          closing them lands back on the map. */}
      <StoryAdventureMap />

      {/* Progress dashboard overlay (z-30) — Help button (z-50) stays on top */}
      <ProgressOverlay />

      {/* Certificate viewer (Task 27) — z-40: above My Progress (z-30),
          always below the Get Help Now layer (z-50). */}
      <CertificateOverlay />

      {/* Settings panel overlay (z-30, Task 10) — Help button (z-50) stays on top */}
      <SettingsPanel />

      {/* Edit Avatar overlay (z-30, Task 14) — rendered after SettingsPanel
          so it paints above it when opened from Settings */}
      <AvatarEditOverlay />

      {/* Avatar Shop overlay (z-30, Task 16) — cosmetic Coins shop, no real
          money anywhere; Get Help Now button (z-50) stays on top */}
      <AvatarShopOverlay />

      {/* Community screen overlay (z-30, Task 11) — static, moderated-by-design;
          Get Help Now button (z-50) stays on top */}
      <CommunityOverlay />

      {/* Full-screen Map modal (z-30, reference redesign) — opened from the
          minimap card; Get Help Now (z-50) stays on top */}
      <MapOverlay />

      {/* Story Adventure overlay (z-30, Aug 2026) — the house slide-show;
          fully deterministic content. Get Help Now (z-50) stays on top */}
      <StoryOverlay />

      {/* Onboarding (z-20, Task 13) — covers the world until the guardian
          consent step completes; Get Help Now (z-50) stays on top even here */}
      {!onboarded && <OnboardingFlow />}

      {/* Black Fade Overlay (z-40) */}
      <div
        className="absolute inset-0 bg-slate-950 pointer-events-none transition-opacity duration-300 ease-in-out z-40"
        style={{ opacity: fadeOpacity }}
      />

      {/* Floating Action Controls (z-50) - Always visible, never fades.
          The guide needs an age band, so it appears after onboarding;
          the Get Help Now button is there from the very first screen. */}
      {/* Compact assistant + Get Help group — same 8–10px gap spec as Home
          (Aug 12 2026: in-game gap-4 read as a weird hole between the robot
          and the card; matched to the Home compact-group spacing). */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-2 md:gap-2.5 pointer-events-none">
        {/* Nyaya AI — the game's ONE assistant (robot guide, Gemini brain). */}
        {onboarded && <AvatarWidget />}
        {/* Reference redesign: during onboarding the trigger is the card
            (name + both helpline numbers visible); in-world it stays the
            compact pill so it never crowds the game HUD. Same shared screen. */}
        <HelpDialog variant={onboarded ? 'pill' : 'card'} />
      </div>
    </div>
  );
}

function JoystickUI() {
  const joystickRef = useJoystick();
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!baseRef.current || !knobRef.current) return;
    baseRef.current.setPointerCapture(e.pointerId);
    joystickRef.current.active = true;
    updatePosition(e);
  };
  
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!joystickRef.current.active) return;
    updatePosition(e);
  };
  
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!baseRef.current) return;
    baseRef.current.releasePointerCapture(e.pointerId);
    joystickRef.current.active = false;
    joystickRef.current.x = 0;
    joystickRef.current.y = 0;
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(0px, 0px)`;
    }
  };
  
  const updatePosition = (e: React.PointerEvent) => {
    if (!baseRef.current || !knobRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;
    
    const maxDistance = rect.width / 2 - 24; 
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }
    
    knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    
    joystickRef.current.x = dx / maxDistance;
    joystickRef.current.y = dy / maxDistance;
  };
  
  return (
    <div 
      ref={baseRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full h-full bg-white/40 backdrop-blur-md rounded-full border-4 border-white/70 flex items-center justify-center touch-none shadow-md"
    >
      {/* Directional hints (reference joystick) — decorative only */}
      <ChevronUp className="absolute top-1.5 left-1/2 -translate-x-1/2 w-5 h-5 text-slate-400/80 pointer-events-none" aria-hidden="true" />
      <ChevronDown className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 text-slate-400/80 pointer-events-none" aria-hidden="true" />
      <ChevronLeft className="absolute left-1.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400/80 pointer-events-none" aria-hidden="true" />
      <ChevronRight className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400/80 pointer-events-none" aria-hidden="true" />
      <div 
        ref={knobRef}
        className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full shadow-xl border border-slate-100 transition-transform duration-75 ease-out"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
