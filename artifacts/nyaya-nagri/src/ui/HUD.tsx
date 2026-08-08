import React, { useRef, useEffect, useState } from 'react';
import { useJoystick } from './JoystickContext';
import { HelpDialog } from './HelpDialog';
import { Settings, Map as MapIcon, Award, Star, Users, Trophy, Coins, Flame } from 'lucide-react';
import { useUIStore, playerPosition, enterZone, exitZone, openProgress, openSettings, openCommunity, openShop, enterLevel, clearLevel } from './uiStore';
import { ProgressOverlay } from './ProgressScreen';
import { SettingsPanel } from './SettingsPanel';
import { CommunityOverlay } from './CommunityScreen';
import { getZoneStates, getZone } from '@/world/zones';
import { progressStore } from '@/data/progressStore';
import { useSettings } from '@/data/settingsStore';
import { useStrings } from '@/i18n/strings';
import { AvatarWidget } from '@/avatar/AvatarWidget';
import { OnboardingFlow } from '@/onboarding/OnboardingFlow';
import { PlayerAvatar } from '@/player/PlayerAvatar';
import { AvatarEditOverlay } from '@/player/AvatarEditOverlay';
import { AvatarShopOverlay } from '@/economy/AvatarShop';
import { rankForXp } from '@/economy/economy';
import { sanitizeAvatar } from '@/player/avatarConfig';
import { resolveQuest } from '@/quests/registry';
import { QuestPlayer } from '@/quests/QuestPlayer';
import { LevelSelect } from '@/quests/LevelSelect';

/** Task 13: has the onboarding (intro, age band, guardian consent) run? */
function useOnboarded(): boolean {
  const [onboarded, setOnboarded] = useState(() => progressStore.getState().onboarded);
  useEffect(() => progressStore.subscribe((s) => setOnboarded(s.onboarded)), []);
  return onboarded;
}

/** Task 14: the child's cosmetic player avatar (null until built). */
function usePlayerAvatarConfig() {
  const [avatar, setAvatar] = useState(() => sanitizeAvatar(progressStore.getState().avatar));
  useEffect(() => progressStore.subscribe((s) => setAvatar(sanitizeAvatar(s.avatar))), []);
  return avatar;
}

function BadgeCounter() {
  const [count, setCount] = useState(() => {
    const b = progressStore.getState().badges;
    return Object.values(b).filter(Boolean).length;
  });

  useEffect(() => {
    return progressStore.subscribe(state => {
      const b = state.badges;
      setCount(Object.values(b).filter(Boolean).length);
    });
  }, []);

  if (count === 0) return null;

  return (
    <div className="bg-orange-100 border border-orange-200 text-orange-600 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
      <Award className="w-4 h-4 fill-orange-500" />
      <span className="font-bold text-sm">{count}</span>
    </div>
  );
}

/**
 * Task 16 economy chips: "Player Rank" (wording is deliberate — never
 * confusable with the in-zone "Level X"), Coins (tap = Avatar Shop), and
 * the gentle streak. The streak chip only celebrates the current count —
 * there is no warning, countdown, or guilt state anywhere (PRD §9.6).
 */
function EconomyChips() {
  const t = useStrings();
  const [snap, setSnap] = useState(() => {
    const s = progressStore.getState();
    return { xp: s.xp, coins: s.coins, streak: s.streak.count };
  });
  useEffect(
    () =>
      progressStore.subscribe((s) =>
        setSnap({ xp: s.xp, coins: s.coins, streak: s.streak.count }),
      ),
    [],
  );

  return (
    <>
      <div className="self-start bg-white/90 backdrop-blur-sm border border-violet-200 text-violet-600 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
        <Trophy className="w-4 h-4" />
        <span className="font-bold text-sm">{t.playerRankChip(rankForXp(snap.xp))}</span>
      </div>
      <button
        onClick={openShop}
        aria-label={t.openShopLabel}
        className="self-start bg-white/90 backdrop-blur-sm border border-amber-200 text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm font-bold text-sm transition-colors active:scale-95 touch-manipulation"
      >
        <Coins className="w-4 h-4" />
        {t.coinsChip(snap.coins)}
      </button>
      {snap.streak > 0 && (
        <div className="self-start bg-white/90 backdrop-blur-sm border border-orange-200 text-orange-500 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
          <Flame className="w-4 h-4" />
          <span className="font-bold text-sm">{t.streakChip(snap.streak)}</span>
        </div>
      )}
    </>
  );
}

function Minimap() {
  const playerRef = useRef<HTMLDivElement>(null);
  const avatar = usePlayerAvatarConfig();
  const [states, setStates] = useState(getZoneStates());
  
  useEffect(() => {
    return progressStore.subscribe(() => setStates(getZoneStates()));
  }, []);

  useEffect(() => {
    let frameId: number;
    const update = () => {
      if (playerRef.current) {
        // Map space -40..40 roughly into 0..100%
        const px = Math.min(Math.max(((playerPosition.x + 40) / 80) * 100, 0), 100);
        const pz = Math.min(Math.max(((playerPosition.z + 40) / 80) * 100, 0), 100);
        playerRef.current.style.left = `${px}%`;
        playerRef.current.style.top = `${pz}%`;
      }
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="w-24 h-24 md:w-32 md:h-32 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden pointer-events-auto flex-shrink-0">
      {states.map(z => {
        const px = ((z.position[0] + 40) / 80) * 100;
        const pz = ((z.position[1] + 40) / 80) * 100;
        return (
          <div
            key={z.id}
            className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 ${z.unlocked ? 'bg-orange-400 border-white' : 'bg-slate-300 border-slate-100'}`}
            style={{ left: `${px}%`, top: `${pz}%` }}
          />
        );
      })}
      {/* Player marker — the child's own avatar face when built (Task 14,
          cosmetic only); falls back to the original dot. */}
      <div
        ref={playerRef}
        className="absolute -ml-2.5 -mt-2.5 z-10 transition-transform duration-75"
      >
        {avatar ? (
          <div className="w-5 h-5 rounded-full bg-white border-2 border-sky-500 shadow-sm overflow-hidden flex items-center justify-center">
            <PlayerAvatar config={avatar} size={16} variant="face" />
          </div>
        ) : (
          <div className="w-4 h-4 bg-sky-500 rounded-full border-2 border-white shadow-sm" />
        )}
      </div>
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
      <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-3xl shadow-xl border border-orange-100 flex flex-col items-center gap-3 pointer-events-auto animate-in slide-in-from-bottom-4 duration-200">
        <h3 className="font-display font-bold text-xl text-orange-500">{zoneName}</h3>
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
    <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-3xl shadow-lg border border-slate-200 flex flex-col items-center gap-2 pointer-events-auto opacity-90 animate-in slide-in-from-bottom-4 duration-200">
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
    // No content registered for this zone yet — plain card with exit.
    return (
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
    );
  }

  return (
    <LevelSelect
      quest={quest}
      zoneName={zoneStrings?.name ?? zone.name}
      zoneTheme={zoneStrings?.theme ?? zone.theme}
      onStart={(levelIndex, practice) => {
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
  const playerAvatar = usePlayerAvatarConfig();

  // Task 16: opening the game counts as "played today" — the streak grows
  // gently from simply showing up (idempotent per local calendar day).
  useEffect(() => {
    if (onboarded) progressStore.touchDailyStreak();
  }, [onboarded]);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      
      {/* Normal HUD / Map View Elements */}
      {!activeZoneId && (
        <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-6 animate-in fade-in duration-300">
          {/* Top Bar */}
          <div className="flex justify-between items-start w-full z-10">
            <div className="flex flex-col gap-2 pointer-events-auto">
              <div className="bg-white/90 backdrop-blur-sm px-5 py-3 md:px-6 md:py-3 rounded-2xl shadow-sm border border-orange-100">
                <h1 className="font-display font-bold text-xl md:text-2xl text-orange-500 tracking-wide">
                  {t.appTitle}
                </h1>
              </div>
              {/* Player avatar chip (Task 14) — cosmetic identity corner icon */}
              {playerAvatar && (
                <div className="self-start flex items-center gap-2 bg-white/90 backdrop-blur-sm pl-1.5 pr-3.5 py-1.5 rounded-full shadow-sm border border-sky-100">
                  <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-100 overflow-hidden flex items-center justify-center">
                    <PlayerAvatar config={playerAvatar} size={26} variant="face" />
                  </div>
                  <span className="font-display font-bold text-sm text-slate-700">
                    {playerAvatar.nickname}
                  </span>
                </div>
              )}
              <div className="self-start">
                <BadgeCounter />
              </div>
              {/* Task 16: Player Rank / Coins (opens shop) / gentle streak */}
              {onboarded && <EconomyChips />}
              <button
                onClick={openProgress}
                className="self-start bg-white/90 backdrop-blur-sm border border-amber-200 text-amber-600 hover:bg-amber-50 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm font-bold text-sm transition-colors active:scale-95 touch-manipulation"
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {t.myProgress}
              </button>
              <button
                onClick={openCommunity}
                className="self-start bg-white/90 backdrop-blur-sm border border-sky-200 text-sky-600 hover:bg-sky-50 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm font-bold text-sm transition-colors active:scale-95 touch-manipulation"
              >
                <Users className="w-4 h-4" />
                {t.community}
              </button>
            </div>
            <div className="flex flex-col items-end gap-3 pointer-events-auto">
              <button 
                onClick={openSettings}
                className="bg-white/90 backdrop-blur-sm p-3 md:p-4 rounded-full shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors active:scale-95 touch-manipulation"
                aria-label={t.settings}
              >
                <Settings className="w-6 h-6 text-slate-500" />
              </button>
              <Minimap />
            </div>
          </div>

          {/* Bottom Center Prompt */}
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 w-max max-w-[90vw]">
            <ProximityPrompt />
          </div>

          {/* Bottom Left Joystick */}
          <div className="flex justify-start items-end w-full z-10">
            <div className="w-32 h-32 md:w-40 md:h-40 pointer-events-auto shrink-0 mb-2 md:mb-4">
              <JoystickUI />
            </div>
          </div>
        </div>
      )}

      {/* Interior View Overlay */}
      {activeZoneId && (
        <div className="absolute inset-0 z-30 pointer-events-auto bg-slate-50/95 backdrop-blur-md flex items-center justify-center p-6">
          <ZoneInterior zoneId={activeZoneId} />
        </div>
      )}

      {/* Progress dashboard overlay (z-30) — Help button (z-50) stays on top */}
      <ProgressOverlay />

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
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
        {onboarded && <AvatarWidget />}
        <HelpDialog />
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
      className="w-full h-full bg-white/30 backdrop-blur-md rounded-full border-[3px] border-white/50 flex items-center justify-center touch-none shadow-sm"
    >
      <div 
        ref={knobRef}
        className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full shadow-lg border border-slate-100/50 transition-transform duration-75 ease-out"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
