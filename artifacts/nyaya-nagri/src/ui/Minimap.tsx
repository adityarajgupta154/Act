/**
 * Nyaya Nagri — Minimap card (shared by the in-world HUD and the Home
 * screen since the Aug 2026 home-reference redesign; extracted verbatim
 * from HUD.tsx, behaviour unchanged).
 *
 * The whole card is the Map button — tapping it opens the full-screen Map
 * modal (MapScreen.tsx), so whichever screen mounts it must also mount
 * <MapOverlay />. On Home nobody moves the player, so the marker just
 * rests at the plaza default — that is intentional (it mirrors where the
 * child will stand after entering).
 */
import React, { useRef, useEffect, useState } from 'react';
import { playerPosition, openMap } from './uiStore';
import { STORY_ENTRANCE } from '@/story/storyData';
import { getZoneStates } from '@/world/zones';
import { progressStore } from '@/data/progressStore';
import { useStrings } from '@/i18n/strings';
import { PlayerAvatar, usePlayerAvatarConfig } from '@/player/PlayerAvatar';

/** Reference minimap: per-zone dot colors matching the world label pills. */
const MAP_DOT: Record<string, string> = {
  zone0: '#e8b64c',
  zone1: '#b45410',
  zone2: '#7b2fb5',
  zone3: '#6d28a8',
  zone4: '#5b21b6',
  zone5: '#c02867',
  zone6: '#1f3a63',
};

export function Minimap() {
  const playerRef = useRef<HTMLDivElement>(null);
  const avatar = usePlayerAvatarConfig();
  const t = useStrings();
  const [states, setStates] = useState(getZoneStates());

  useEffect(() => {
    return progressStore.subscribe(() => setStates(getZoneStates()));
  }, []);

  useEffect(() => {
    let frameId: number;
    const update = () => {
      if (playerRef.current) {
        // Map space -32..32 into 0..100% (the village core fills the card)
        const px = Math.min(Math.max(((playerPosition.x + 32) / 64) * 100, 0), 100);
        const pz = Math.min(Math.max(((playerPosition.z + 32) / 64) * 100, 0), 100);
        playerRef.current.style.left = `${px}%`;
        playerRef.current.style.top = `${pz}%`;
      }
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    // Reference redesign: the whole minimap card is now the Map button —
    // tapping it opens the full-screen Map modal (MapScreen.tsx).
    <button
      type="button"
      onClick={openMap}
      aria-label={t.mapOpenLabel}
      className="block bg-white rounded-2xl p-2 shadow-md border border-slate-100 pointer-events-auto flex-shrink-0 cursor-pointer transition-all hover:shadow-lg hover:border-sky-200 active:scale-95 touch-manipulation"
    >
      <div className="text-[11px] leading-none font-display font-bold text-[#0b2a52] text-center pb-1.5">
        {t.mapLabel}
      </div>
      <div className="w-24 h-24 md:w-32 md:h-32 bg-[#dff0c4] rounded-xl relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" aria-hidden="true">
          {states.filter((z) => z.id !== 'zone0').map((z) => (
            <line
              key={z.id}
              x1="50"
              y1="31.3"
              x2={((z.position[0] + 32) / 64) * 100}
              y2={((z.position[1] + 32) / 64) * 100}
              stroke="#d9c99f"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          ))}
          {/* S entrance lane + E story-house lane — same structure as the
              world's road network (map redesign, Aug 2026). */}
          <line x1="50" y1="31.3" x2="50" y2="73" stroke="#d9c99f" strokeWidth="3.5" strokeLinecap="round" />
          <line
            x1="50"
            y1="31.3"
            x2={((STORY_ENTRANCE.position[0] + 32) / 64) * 100}
            y2={((STORY_ENTRANCE.position[1] + 32) / 64) * 100}
            stroke="#d9c99f"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
        {/* Story house dot — same registry the world builds from. */}
        <div
          className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 border-white shadow-sm"
          style={{
            left: `${((STORY_ENTRANCE.position[0] + 32) / 64) * 100}%`,
            top: `${((STORY_ENTRANCE.position[1] + 32) / 64) * 100}%`,
            backgroundColor: '#ea580c',
          }}
        />
        {states.map(z => {
          const px = ((z.position[0] + 32) / 64) * 100;
          const pz = ((z.position[1] + 32) / 64) * 100;
          return (
            <div
              key={z.id}
              className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 border-white shadow-sm ${z.unlocked ? '' : 'opacity-45'}`}
              style={{ left: `${px}%`, top: `${pz}%`, backgroundColor: MAP_DOT[z.id] ?? '#e8b64c' }}
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
    </button>
  );
}
