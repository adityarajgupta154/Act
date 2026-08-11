/**
 * Nyaya Nagri — left-rail player profile (map-declutter redesign, Aug 2026).
 *
 * ONE compact card ([avatar] nickname / Player Rank N ▼) replaces the old
 * stack of floating chips (badges, rank, coins, streak, My Progress,
 * Rights Community). Tapping it expands a dropdown panel ABSOLUTELY
 * positioned over the map — the world canvas and every other HUD element
 * never move or reflow (task §5). Every row reuses the SAME icons, i18n
 * strings and store data the old chips used (single source of truth:
 * progressStore + usePlayerAvatarConfig) — nothing duplicated, nothing
 * hardcoded (task §8/§14).
 *
 *  - Coins row still opens the Avatar Shop; My Progress / Rights Community
 *    keep their screens (task §9/§10) — each tap also collapses the panel.
 *  - Badges and streak rows keep the old chips' hide-at-zero behavior; the
 *    streak stays celebration-only (no warnings/guilt — PRD §9.6).
 *  - Panel closes on outside tap, Escape, and whenever any other screen or
 *    overlay opens (task §6); zone entry unmounts the map HUD entirely.
 *  - Open/close is animated ~200ms (fade + slight downward slide + 0.98
 *    scale, reversed on close — task §11) via tailwindcss-animate.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Award, ChevronDown, Coins, Flame, Star, Trophy, Users } from 'lucide-react';
import { useUIStore, openProgress, openCommunity, openShop } from './uiStore';
import { progressStore } from '@/data/progressStore';
import { useStrings } from '@/i18n/strings';
import { rankForXp } from '@/economy/economy';
import { PlayerAvatar, usePlayerAvatarConfig } from '@/player/PlayerAvatar';
import { cn } from '@/lib/utils';

/* Same visual language as the rest of the HUD cards (solid white rounded
   cards, colored icon coins, deep-navy labels) — reads as native UI. */
const LABEL = 'font-bold text-sm text-[#0b2a52]';
const ROW_ICON = 'w-7 h-7 rounded-full grid place-content-center shrink-0';
const ROW = 'w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left';

/** One snapshot for every stat the panel shows — single subscription. */
function usePlayerStats() {
  const pick = (s: ReturnType<typeof progressStore.getState>) => ({
    xp: s.xp,
    coins: s.coins,
    streak: s.streak.count,
    badges: Object.values(s.badges).filter(Boolean).length,
  });
  const [snap, setSnap] = useState(() => pick(progressStore.getState()));
  useEffect(() => progressStore.subscribe((s) => setSnap(pick(s))), []);
  return snap;
}

/**
 * DEV-only screenshot seam (?profile=open): the headless capture browser
 * cannot click, so the panel can boot expanded. Always false in prod.
 */
function devProfileOpen(): boolean {
  if (!import.meta.env?.DEV) return false;
  return new URLSearchParams(window.location.search).get('profile') === 'open';
}

export function PlayerProfile() {
  const t = useStrings();
  const stats = usePlayerStats();
  const avatar = usePlayerAvatarConfig();
  const ui = useUIStore();
  const rootRef = useRef<HTMLDivElement>(null);

  // 'open' → 'closing' (reverse animation plays) → 'closed' (unmounted).
  const [phase, setPhase] = useState<'closed' | 'open' | 'closing'>(() =>
    devProfileOpen() ? 'open' : 'closed',
  );
  const isOpen = phase === 'open';

  const close = () => setPhase((p) => (p === 'open' ? 'closing' : p));
  const toggle = () => setPhase((p) => (p === 'open' ? 'closing' : 'open'));

  // Task §6: tapping anywhere outside collapses; Escape collapses; taps
  // INSIDE the card/panel never auto-close.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  // Task §6: navigating to ANY other screen/overlay collapses the panel
  // (rows close themselves on tap; this also covers Settings, the minimap
  // Map modal, the assistant, Get Help Now, the story house, zones…).
  const somewhereElse =
    ui.progressOpen ||
    ui.communityOpen ||
    ui.settingsOpen ||
    ui.shopOpen ||
    ui.mapOpen ||
    ui.helpOpen ||
    ui.avatarEditOpen ||
    ui.storyMapOpen ||
    !!ui.activeStory ||
    !!ui.activeZoneId;
  useEffect(() => {
    if (somewhereElse) setPhase((p) => (p === 'open' ? 'closing' : p));
  }, [somewhereElse]);

  const rank = rankForXp(stats.xp);

  return (
    <div ref={rootRef} className="relative self-start">
      {/* Collapsed card — same footprint as the old nickname chip (§1). */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls="player-profile-panel"
        aria-label={t.playerProfileToggle}
        className="bg-white pl-1.5 pr-3 py-1.5 rounded-full flex items-center gap-2 shadow-md hover:bg-slate-50 transition-colors active:scale-95 touch-manipulation"
      >
        <span className="w-8 h-8 rounded-full bg-sky-50 border border-sky-100 overflow-hidden flex items-center justify-center shrink-0">
          {avatar ? (
            <PlayerAvatar config={avatar} size={26} variant="face" />
          ) : (
            <Star className="w-4 h-4 text-sky-500" aria-hidden="true" />
          )}
        </span>
        <span className="leading-tight text-left">
          <span className={`font-display ${LABEL} block`}>
            {avatar?.nickname ?? t.playerProfileToggle}
          </span>
          <span className="block text-[11px] leading-tight font-semibold text-slate-400">
            {t.playerRankChip(rank)}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown panel — absolute overlay, the map never moves (§5). */}
      {phase !== 'closed' && (
        <div
          id="player-profile-panel"
          onAnimationEnd={() => {
            if (phase === 'closing') setPhase('closed');
          }}
          className={cn(
            'absolute left-0 top-full mt-2 z-20 w-64 max-w-[calc(100vw-2rem)]',
            'max-h-[min(50vh,420px)] overflow-y-auto overscroll-contain',
            'bg-white rounded-2xl shadow-xl border border-slate-100 p-2 origin-top',
            phase === 'closing'
              ? 'animate-out fade-out slide-out-to-top-1 zoom-out-[0.98] duration-200 fill-mode-forwards'
              : 'animate-in fade-in slide-in-from-top-1 zoom-in-[0.98] duration-200',
          )}
        >
          {/* Stats rows — same icons + meanings as the old chips (§3). */}
          {stats.badges > 0 && (
            <div className={ROW}>
              <span className={`${ROW_ICON} bg-orange-100 text-orange-500`}>
                <Award className="w-4 h-4 fill-orange-400" />
              </span>
              <span className={LABEL}>{stats.badges}</span>
            </div>
          )}
          <div className={ROW}>
            <span className={`${ROW_ICON} bg-blue-100 text-blue-600`}>
              <Trophy className="w-4 h-4" />
            </span>
            <span className={LABEL}>{t.playerRankChip(rank)}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              close();
              openShop();
            }}
            aria-label={t.openShopLabel}
            className={`${ROW} hover:bg-amber-50 transition-colors active:scale-[0.98] touch-manipulation`}
          >
            <span className={`${ROW_ICON} bg-amber-100 text-amber-600`}>
              <Coins className="w-4 h-4" />
            </span>
            <span className={LABEL}>{t.coinsChip(stats.coins)}</span>
          </button>
          {stats.streak > 0 && (
            <div className={ROW}>
              <span className={`${ROW_ICON} bg-orange-100 text-orange-500`}>
                <Flame className="w-4 h-4" />
              </span>
              <span className={LABEL}>{t.streakChip(stats.streak)}</span>
            </div>
          )}

          <div className="my-1 border-t border-slate-100" aria-hidden="true" />

          {/* Navigation rows — existing screens, existing handlers (§9/§10). */}
          <button
            type="button"
            onClick={() => {
              close();
              openProgress();
            }}
            className={`${ROW} hover:bg-amber-50 transition-colors active:scale-[0.98] touch-manipulation`}
          >
            <span className={`${ROW_ICON} bg-amber-100 text-amber-500`}>
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </span>
            <span className={LABEL}>{t.myProgress}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              close();
              openCommunity();
            }}
            className={`${ROW} hover:bg-sky-50 transition-colors active:scale-[0.98] touch-manipulation`}
          >
            <span className={`${ROW_ICON} bg-sky-100 text-sky-600`}>
              <Users className="w-4 h-4" />
            </span>
            <span className={LABEL}>{t.community}</span>
          </button>
        </div>
      )}
    </div>
  );
}
