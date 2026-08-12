/**
 * Nyaya Nagri — full-screen Map modal (reference redesign, Aug 2026)
 *
 * A large centered card floating over the LIVE game world (dimmed +
 * blurred behind, per the reference): golden constitution-book hub in the
 * middle (Zone 0's real pedestal art — not a CSS recreation), the six
 * topic zones arranged radially with stone paths, and a live
 * "You are here" marker.
 *
 * Pure presentation:
 *  - lock/complete state comes ONLY from getZoneStates() (isZoneUnlockedIn
 *    stays the single lock rule; this file never re-implements it),
 *  - the player's location comes from the SAME uiStore signals the world
 *    uses (activeZoneId / nearbyZoneId; otherwise the child is at the hub),
 *  - entering a zone still goes through enterZone(), which re-checks the
 *    lock — the map can never bypass zone gating.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Baby,
  Check,
  Home,
  Lock,
  LockKeyhole,
  Map as MapIcon,
  MapPin,
  Scale,
  School,
  Play,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useUIStore, closeMap, openMap, enterZone, openRightWrong } from './uiStore';
import { getZoneStates } from '@/world/zones';
import { progressStore } from '@/data/progressStore';
import { useStrings } from '@/i18n/strings';
import { PlayerAvatar, usePlayerAvatarConfig } from '@/player/PlayerAvatar';
import pedestalUrl from '@/assets/world/monument-pedestal.png';

/* ------------------------------ layout ---------------------------------- */

/**
 * Radial slots (degrees clockwise from top), matched to the reference
 * frame wherever the zone names line up: Family & Community Shield on
 * top, Justice System Simulator top-right, School Rights right, Safe
 * Zone at the bottom, Digital Safety bottom-left, Right to Childhood
 * top-left. The reference's seventh spot is its center hub — ours is
 * Zone 0's golden book pedestal, which IS the game's central plaza.
 */
const NODE_LAYOUT: Record<
  string,
  { angle: number; label: 'above' | 'below' | 'side'; disc: string; Glyph: LucideIcon }
> = {
  zone6: { angle: 0, label: 'above', disc: 'from-[#8b5cf6] to-[#6d28d9]', Glyph: Users },
  zone4: { angle: 60, label: 'side', disc: 'from-[#94a3b8] to-[#475569]', Glyph: Scale },
  zone3: { angle: 120, label: 'side', disc: 'from-[#fb7185] to-[#e11d48]', Glyph: School },
  zone1: { angle: 180, label: 'below', disc: 'from-[#4ade80] to-[#16a34a]', Glyph: Home },
  zone5: { angle: 240, label: 'side', disc: 'from-[#c084fc] to-[#9333ea]', Glyph: LockKeyhole },
  zone2: { angle: 300, label: 'side', disc: 'from-[#a78bfa] to-[#7c3aed]', Glyph: Baby },
};

/** Radii of the node ring, in % of the map canvas. */
const RX = 28.5;
const RY = 30;

function nodePos(angleDeg: number): { x: number; y: number } {
  const r = (angleDeg * Math.PI) / 180;
  return { x: 50 + RX * Math.sin(r), y: 50 - RY * Math.cos(r) };
}

/** Is this slot on the left or right half (for side-label placement)? */
function sideOf(angleDeg: number): 'left' | 'right' {
  return Math.sin((angleDeg * Math.PI) / 180) < 0 ? 'left' : 'right';
}

/* --------------------------- decorations --------------------------------- */

/** Tiny flat SVG decorations (reference style: simple pastel trees, bushes,
 * rocks, flower patches). Positions avoid the hub, spokes and node slots. */
const DECOR: Array<{ x: number; y: number; kind: 'tree' | 'bush' | 'rock' | 'flowers'; s: number }> = [
  { x: 8, y: 10, kind: 'tree', s: 1 },
  { x: 28, y: 11, kind: 'flowers', s: 1 },
  { x: 68, y: 8, kind: 'bush', s: 1 },
  { x: 91, y: 12, kind: 'tree', s: 0.85 },
  { x: 6, y: 44, kind: 'bush', s: 0.9 },
  { x: 93, y: 46, kind: 'rock', s: 1 },
  { x: 32, y: 53, kind: 'flowers', s: 0.8 },
  { x: 68, y: 55, kind: 'rock', s: 0.7 },
  { x: 7, y: 87, kind: 'tree', s: 0.95 },
  { x: 21, y: 91, kind: 'flowers', s: 0.9 },
  { x: 34, y: 92, kind: 'rock', s: 0.8 },
  { x: 67, y: 91, kind: 'flowers', s: 1 },
  { x: 81, y: 89, kind: 'tree', s: 0.8 },
  { x: 94, y: 73, kind: 'tree', s: 0.7 },
];

function Decor({ kind, s }: { kind: 'tree' | 'bush' | 'rock' | 'flowers'; s: number }) {
  const w = (base: number) => Math.round(base * s);
  if (kind === 'tree') {
    return (
      <svg width={w(26)} height={w(30)} viewBox="0 0 26 30" fill="none">
        <rect x="11" y="18" width="4" height="9" rx="1.5" fill="#b08a54" />
        <circle cx="13" cy="11.5" r="9" fill="#a8d178" />
        <circle cx="9.5" cy="8.5" r="4.8" fill="#c1e296" />
      </svg>
    );
  }
  if (kind === 'bush') {
    return (
      <svg width={w(28)} height={w(14)} viewBox="0 0 28 14" fill="none">
        <ellipse cx="9" cy="9" rx="8.5" ry="5" fill="#b3d987" />
        <ellipse cx="19" cy="8.5" rx="8" ry="5.2" fill="#a2cd74" />
      </svg>
    );
  }
  if (kind === 'rock') {
    return (
      <svg width={w(22)} height={w(13)} viewBox="0 0 22 13" fill="none">
        <ellipse cx="11" cy="8.5" rx="9.5" ry="4.5" fill="#c3cbb2" />
        <ellipse cx="8.5" cy="6" rx="6" ry="3.6" fill="#d6ddc7" />
      </svg>
    );
  }
  return (
    <svg width={w(20)} height={w(10)} viewBox="0 0 20 10" fill="none">
      <circle cx="4" cy="6" r="2.4" fill="#f2a9c7" />
      <circle cx="10.5" cy="4.5" r="2" fill="#f7c6da" />
      <circle cx="16" cy="6.5" r="2.2" fill="#f2a9c7" />
    </svg>
  );
}

/* ------------------------------ component -------------------------------- */

function useZoneStates() {
  const [states, setStates] = useState(getZoneStates);
  useEffect(() => progressStore.subscribe(() => setStates(getZoneStates())), []);
  return states;
}

const LABEL_PILL =
  'bg-white/95 rounded-xl md:rounded-2xl px-2 py-1 md:px-3 md:py-1.5 shadow-md border border-slate-100 ' +
  'font-display font-bold text-[10px] md:text-xs leading-tight text-[#0b2a52] text-center w-max max-w-[6.8rem] md:max-w-[8.75rem]';

export function MapOverlay() {
  const { mapOpen, activeZoneId, nearbyZoneId } = useUIStore();
  const t = useStrings();
  const states = useZoneStates();
  const avatar = usePlayerAvatarConfig();
  const [lockedHint, setLockedHint] = useState<string | null>(null);
  const hintTimer = useRef<number | null>(null);

  // DEV-only screenshot/e2e seam (same spirit as __nnDebug): the headless
  // browser cannot click the minimap, so ?map=open opens the modal on boot.
  // Stripped from production builds.
  useEffect(() => {
    if (import.meta.env?.DEV && new URLSearchParams(window.location.search).get('map') === 'open') {
      openMap();
    }
  }, []);

  // Baseline keyboard support: Escape closes (same pattern as Settings).
  useEffect(() => {
    if (!mapOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMap();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mapOpen]);

  useEffect(
    () => () => {
      if (hintTimer.current !== null) window.clearTimeout(hintTimer.current);
    },
    [],
  );

  if (!mapOpen) return null;

  const zone0 = states.find((z) => z.id === 'zone0');
  const ring = states.filter((z) => z.id !== 'zone0' && NODE_LAYOUT[z.id]);
  // Where the child actually is: inside a zone > near a zone > the hub.
  const hereId = activeZoneId ?? nearbyZoneId ?? null;

  const openZone = (zone: (typeof states)[number]) => {
    const name = t.zones[zone.id]?.name ?? zone.name;
    if (zone.unlocked) {
      closeMap();
      enterZone(zone.id); // re-checks the lock internally
      return;
    }
    const prev = states.find((z) => z.order === zone.order - 1);
    const prevName = prev ? (t.zones[prev.id]?.name ?? prev.name) : '';
    setLockedHint(`${name} — ${t.completeFirst(prevName)}`);
    if (hintTimer.current !== null) window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setLockedHint(null), 2800);
  };

  // "You are here" marker: on the spoke of the current/nearby zone, else
  // just left of the hub (reference composition).
  const markerOnSpoke = !!(hereId && NODE_LAYOUT[hereId]);
  let marker = { x: 50 - RX, y: 50 };
  if (markerOnSpoke && hereId && NODE_LAYOUT[hereId]) {
    const p = nodePos(NODE_LAYOUT[hereId].angle);
    marker = { x: 50 + (p.x - 50) * 0.62, y: 50 + (p.y - 50) * 0.62 };
  }

  const zone0Name = zone0 ? (t.zones[zone0.id]?.name ?? zone0.name) : '';

  return (
    <div
      className="absolute inset-0 z-30 pointer-events-auto bg-slate-900/45 backdrop-blur-[3px] flex items-center justify-center p-2.5 md:p-6 animate-in fade-in duration-200"
      onClick={closeMap}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.mapLabel}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-[1.75rem] md:rounded-[2.5rem] shadow-2xl border border-slate-100 w-[min(96vw,56rem)] h-[min(92dvh,58rem)] flex flex-col p-3 md:p-6 animate-in fade-in zoom-in-95 duration-300"
      >
        {/* Close */}
        <button
          type="button"
          onClick={closeMap}
          aria-label={t.mapCloseLabel}
          className="absolute top-3 right-3 md:top-5 md:right-5 z-20 bg-slate-100 hover:bg-slate-200 rounded-full p-2.5 transition-colors active:scale-95 touch-manipulation"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        {/* Header */}
        <div className="shrink-0 flex flex-col items-center pt-1 md:pt-0">
          <div className="flex items-center gap-2.5 md:gap-3">
            <Sparkles className="w-4 h-4 text-sky-300" aria-hidden />
            <span className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-b from-sky-400 to-blue-600 shadow-md grid place-content-center shrink-0">
              <MapIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </span>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-[#0b2a52] tracking-wide">
              {t.mapLabel}
            </h2>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" aria-hidden />
          </div>
          <span className="mt-2 inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3.5 py-1 md:px-4 md:py-1.5 text-[11px] md:text-sm font-semibold text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden />
            {t.mapModalSubtitle}
          </span>
        </div>

        {/* Map canvas */}
        <div
          className="relative flex-1 min-h-0 mt-2.5 md:mt-4 rounded-[1.25rem] md:rounded-[1.75rem] overflow-hidden ring-1 ring-inset ring-lime-900/10"
          style={{ background: 'radial-gradient(ellipse at center, #f1f9e2 0%, #e6f2cf 70%, #dfedc4 100%)' }}
        >
          {/* Decorations */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            {DECOR.map((d, i) => (
              <span
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2 opacity-90"
                style={{ left: `${d.x}%`, top: `${d.y}%` }}
              >
                <Decor kind={d.kind} s={d.s} />
              </span>
            ))}
            {/* Faint orbit ring through the node circle (reference detail) */}
            <span
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-[#b9d693] opacity-60"
              style={{ width: `${RX * 2}%`, height: `${RY * 2}%` }}
            />
          </div>

          {/* Stone paths: hub → each zone */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {ring.map((z) => {
              const p = nodePos(NODE_LAYOUT[z.id].angle);
              return (
                <g key={z.id} opacity={z.unlocked ? 1 : 0.45}>
                  <line x1="50" y1="50" x2={p.x} y2={p.y} stroke="#d9c99f" strokeWidth="6" strokeLinecap="round" />
                  <line x1="50" y1="50" x2={p.x} y2={p.y} stroke="#eadfc0" strokeWidth="2.6" strokeLinecap="round" />
                </g>
              );
            })}
          </svg>

          {/* Central hub — Zone 0's real golden book pedestal */}
          {zone0 && (
            <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-75 duration-300">
              <div className="relative flex flex-col items-center">
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 md:w-24 md:h-24 rounded-full bg-amber-300/50 blur-xl scale-125"
                  aria-hidden
                />
                <button
                  type="button"
                  onClick={() => openZone(zone0)}
                  aria-label={zone0Name}
                  className="relative rounded-full bg-white p-1 md:p-1.5 shadow-xl transition-transform hover:scale-105 active:scale-95 touch-manipulation"
                >
                  <span className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-b from-[#ffe08a] via-[#f7c948] to-[#e9a71f] grid place-content-center ring-1 ring-amber-200 shadow-[inset_0_-6px_10px_rgba(120,72,0,0.18)]">
                    <img
                      src={pedestalUrl}
                      alt=""
                      draggable={false}
                      className="h-12 md:h-[4.4rem] w-auto object-contain drop-shadow-md"
                    />
                  </span>
                  {zone0.completed && (
                    <span className="absolute -top-0.5 -right-0.5 bg-green-500 border-2 border-white rounded-full p-[4px] shadow" aria-hidden>
                      <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
                    </span>
                  )}
                  {hereId === 'zone0' && <span className="map-current-ring" aria-hidden />}
                </button>
                <span className={`mt-1.5 md:mt-2 ${LABEL_PILL}`}>{zone0Name}</span>
              </div>
            </div>
          )}

          {/* Zone nodes */}
          {ring.map((z, i) => {
            const slot = NODE_LAYOUT[z.id];
            const p = nodePos(slot.angle);
            const name = t.zones[z.id]?.name ?? z.name;
            const isCurrent = hereId === z.id;
            const floats = z.unlocked && !z.completed && !isCurrent;
            const side = sideOf(slot.angle);
            const labelClass =
              slot.label === 'above'
                ? `absolute bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 ${LABEL_PILL}`
                : slot.label === 'below'
                  ? `mt-1.5 md:mt-2 ${LABEL_PILL}`
                  : `mt-1.5 md:mt-0 md:absolute md:top-1/2 md:-translate-y-1/2 ${
                      side === 'left'
                        ? 'md:right-[calc(100%+0.6rem)]'
                        : 'md:left-[calc(100%+0.6rem)]'
                    } ${LABEL_PILL}`;
            return (
              <div
                key={z.id}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-50 duration-300 fill-mode-backwards"
                style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${180 + i * 70}ms` }}
              >
                <div className="relative flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => openZone(z)}
                    aria-label={z.unlocked ? name : `${name} — ${t.locked}`}
                    className={`relative rounded-full bg-white p-1 md:p-[5px] shadow-lg transition-transform hover:scale-105 active:scale-95 touch-manipulation ${
                      floats ? 'map-node-float' : ''
                    }`}
                    style={floats ? { animationDelay: `${i * 350}ms` } : undefined}
                  >
                    <span
                      className={`w-12 h-12 md:w-[4.4rem] md:h-[4.4rem] rounded-full bg-gradient-to-b ${slot.disc} grid place-content-center shadow-[inset_0_-5px_8px_rgba(0,0,0,0.16)] ${
                        z.unlocked ? '' : 'saturate-[.45] opacity-80'
                      }`}
                    >
                      <slot.Glyph className="w-6 h-6 md:w-8 md:h-8 text-white drop-shadow" strokeWidth={2.2} />
                    </span>
                    {!z.unlocked && (
                      <span className="absolute -bottom-1 -right-1 bg-slate-500 border-2 border-white rounded-full p-[4px] shadow" aria-hidden>
                        <Lock className="w-3 h-3 text-white" strokeWidth={2.6} />
                      </span>
                    )}
                    {z.completed && (
                      <>
                        <span className="absolute -top-0.5 -right-0.5 bg-green-500 border-2 border-white rounded-full p-[4px] shadow" aria-hidden>
                          <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
                        </span>
                        <Sparkles className="absolute -top-2.5 -left-2.5 w-4 h-4 text-amber-400 animate-pulse" aria-hidden />
                      </>
                    )}
                    {isCurrent && <span className="map-current-ring" aria-hidden />}
                  </button>
                  <span className={labelClass}>{name}</span>
                </div>
              </div>
            );
          })}

          {/* You are here */}
          <div
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-in fade-in slide-in-from-left-2 duration-300 fill-mode-backwards"
            style={{ left: `${marker.x}%`, top: `${marker.y}%`, animationDelay: '600ms' }}
          >
            <div className="flex items-center gap-1 md:gap-1.5">
              <span className="bg-white rounded-full px-2 py-0.5 md:px-3 md:py-1 text-[9px] md:text-xs font-bold text-sky-600 shadow-md border border-sky-100 whitespace-nowrap">
                {t.mapYouAreHere}
              </span>
              <span className="relative w-11 h-11 md:w-14 md:h-14 rounded-full bg-white p-[3px] shadow-lg shrink-0">
                <span className="w-full h-full rounded-full border-[3px] border-sky-400 bg-sky-50 overflow-hidden grid place-content-center">
                  {avatar ? (
                    <PlayerAvatar config={avatar} size={34} variant="face" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-sky-500" />
                  )}
                </span>
                {/* Blue pointer toward the hub (reference composition) — only
                    meaningful in the resting "at the hub" placement. */}
                {!markerOnSpoke && (
                  <span
                    className="absolute top-1/2 left-full -translate-y-1/2 -ml-px w-0 h-0 border-y-[6px] border-y-transparent border-l-[9px] border-l-sky-400 drop-shadow"
                    aria-hidden
                  />
                )}
              </span>
            </div>
          </div>

          {/* Locked-zone hint (existing lock copy, visual only) */}
          {lockedHint && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 max-w-[94%] bg-white rounded-2xl px-4 py-2 shadow-lg border border-slate-200 flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
              <span className="text-xs md:text-sm font-semibold text-slate-600">{lockedHint}</span>
            </div>
          )}
        </div>

        {/* "Right or Wrong?" mini-game entry — lives on the map card so it
            feels part of the city, not a random floating button. */}
        <div className="shrink-0 mt-2 md:mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => { closeMap(); openRightWrong(); }}
            className="flex items-center gap-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 active:scale-95 text-white font-display font-bold text-sm md:text-base rounded-2xl px-5 py-2.5 shadow-lg transition-all touch-manipulation focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300"
          >
            <Play className="w-4 h-4 md:w-5 md:h-5 fill-white" />
            {t.rwTitle} — {t.rwPlayCta}
          </button>
        </div>

        {/* Legend */}
        <div className="shrink-0 mt-2 md:mt-2.5 mx-auto inline-flex items-center gap-3 md:gap-6 bg-white rounded-full border border-slate-200 shadow-md px-4 md:px-7 py-2 md:py-2.5">
          <span className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full border-2 border-sky-300 bg-sky-50 overflow-hidden grid place-content-center shrink-0">
              {avatar ? (
                <PlayerAvatar config={avatar} size={20} variant="face" />
              ) : (
                <span className="w-3 h-3 rounded-full bg-sky-500" />
              )}
            </span>
            <span className="text-xs md:text-sm font-display font-bold text-[#0b2a52]">{t.mapLegendYou}</span>
          </span>
          <span className="w-px h-6 bg-slate-200" aria-hidden />
          <span className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-gradient-to-b from-[#ffe08a] to-[#e9a71f] border border-amber-200 grid place-content-center overflow-hidden shrink-0">
              <img src={pedestalUrl} alt="" className="h-5 w-auto object-contain" draggable={false} />
            </span>
            <span className="text-xs md:text-sm font-display font-bold text-[#0b2a52]">{t.mapLegendHub}</span>
          </span>
          <span className="w-px h-6 bg-slate-200" aria-hidden />
          <span className="flex items-center gap-2">
            <span className="w-8 md:w-10 h-2.5 rounded-full bg-[#d9c99f] shadow-inner shrink-0" />
            <span className="text-xs md:text-sm font-display font-bold text-[#0b2a52]">{t.mapLegendPath}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
