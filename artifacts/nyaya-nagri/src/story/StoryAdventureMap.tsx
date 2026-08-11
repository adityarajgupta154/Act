/**
 * Nyaya Nagri — Story Adventure LEVEL MAP (Candy-Crush-style progression).
 *
 * Aug 2026 redesign: rebuilt to the user's reference frame — soft ivory
 * meadow with a winding cream trail, gold progression for what's already
 * earned, violet for what's next, white info cards beside big round game
 * nodes, and a dashed "naye adventures" teaser at the top of the climb.
 * Everything is real HTML/CSS (no baked screenshot): decor is edge-hugging
 * cutouts from the child's own reference art plus tiny inline shapes.
 *
 * The trail renders ENTIRELY from STORY_LEVELS (redesign task §4/§9 —
 * adding a level later is data + art only; this file hard-codes ZERO level
 * ids). Level 1 sits at the BOTTOM; the journey climbs upward through a
 * serpentine <AdventureLevel/> / <AdventurePath/> sequence and ends in the
 * one ghost teaser that is not data and can never open.
 *
 * Node states are pure derivations of progressStore.storyProgress through
 * the ONE lock rule isStoryLevelUnlockedIn (§20 — no second unlock
 * calculation anywhere):
 *   completed → gold trophy disc + green check, replayable (replay only
 *               re-reads data; progress is never reset)
 *   unlocked  → white disc, violet progress ring + play, pulsing halo
 *   locked    → muted disc + lock + storyLockedHint(previous), inert
 * Path segments follow the same truth: gold behind the child's progress,
 * violet toward the next horizon, sand for the far-locked rest (§4).
 *
 * UNLOCK CINEMATIC (§10): when StoryOverlay reports a FRESH completion via
 * uiStore.storyCelebration, the map plays a staged sequence — reward
 * banner → trail segment draws toward the next node → its lock glows and
 * shakes → the lock opens → "New Adventure Unlocked!" with a PLAY CTA.
 * Until the final beat every node stays click-blocked and the next node
 * deliberately KEEPS LOOKING locked (progress itself was persisted the
 * moment the RESULT slide appeared, so refreshing mid-cinematic skips only
 * the show — never the unlock). Stages are plain setTimeout state:
 * deterministic, no animation library, and the same beats under
 * prefers-reduced-motion (only flourishes are motion-safe-gated).
 * Nothing here auto-starts the next level.
 *
 * Z layers (§17, small and deliberate): 0 decor → 10 trail/header/bottom
 * bar → 20 toast/cinematic. The HUD's Get Help Now + assistant live at
 * z-50 above this whole dialog, exactly like every other overlay.
 *
 * Everything is fixed content (PRD §9.8): titles/subtitles/rewards come
 * from storyData, chrome from strings.ts. No fetch, no AI, and NO AUDIO —
 * the map and completion surfaces stay silent (the Gemini story voice
 * belongs to the slides alone, strict voice spec §8).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Lock,
  LockOpen,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import {
  useUIStore,
  openStory,
  openStoryMap,
  closeStoryMap,
  openProgress,
  openCommunity,
  celebrateStoryCompletion,
  clearStoryCelebration,
} from '@/ui/uiStore';
import { progressStore } from '@/data/progressStore';
import { useSettings } from '@/data/settingsStore';
import { useStrings } from '@/i18n/strings';
import { cn } from '@/lib/utils';
import { STORY_LEVELS, isStoryLevelUnlockedIn, type StoryLevelDef } from './storyData';

type NodeState = 'completed' | 'unlocked' | 'locked';
type CinePhase = 'banner' | 'path' | 'lockglow' | 'unlock' | 'cta';
/** Path segment visual: gold (earned) / violet (next horizon) / sand. */
type SegVisual = 'inactive' | 'upcoming' | 'drawing' | 'active';

/**
 * DEV-only deep-link seam (?story=open&view=map[&celebrate=<id>]) for the
 * headless capture browser. `&done=<id,csv>` is handled by main.tsx (it
 * seeds storyProgress) so completed/unlocked node states are reachable.
 * Always null in production builds.
 */
function devMapSeam(): { celebrate: string | null } | null {
  if (!import.meta.env?.DEV || typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search);
  if (p.get('story') !== 'open' || p.get('view') !== 'map') return null;
  return { celebrate: p.get('celebrate') };
}

/** Cinematic beat lengths (ms). Reduced-motion users get the same beats. */
const PHASE_MS: Record<Exclude<CinePhase, 'cta'>, number> = {
  banner: 1700,
  path: 1000,
  lockglow: 1000,
  unlock: 750,
};

/** Nature cutouts lifted from the user's reference art (transparent PNGs). */
const ART = `${import.meta.env.BASE_URL}story/map/`;

const NAV_BTN =
  'flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full hover:bg-orange-50 active:scale-95 transition-colors text-[#0b2a52] font-bold text-sm touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300';

export function StoryAdventureMap() {
  const { storyMapOpen, activeStory, storyCelebration } = useUIStore();

  // DEV-only screenshot/e2e seam — same spirit as StoryOverlay's.
  useEffect(() => {
    const seam = devMapSeam();
    if (!seam) return;
    if (seam.celebrate) celebrateStoryCompletion(seam.celebrate);
    else openStoryMap();
  }, []);

  // The story overlay plays ABOVE the map flow: while a story is open the
  // map stands down entirely and re-mounts (fresh, auto-centered) on close.
  if (!storyMapOpen || activeStory) return null;
  return <MapScreen celebration={storyCelebration} />;
}

function MapScreen({ celebration }: { celebration: { completedId: string } | null }) {
  const t = useStrings();
  const { language } = useSettings();
  const [storyProgress, setStoryProgress] = useState(
    () => progressStore.getState().storyProgress,
  );
  useEffect(() => progressStore.subscribe((s) => setStoryProgress(s.storyProgress)), []);

  const playable = STORY_LEVELS.filter((l) => l.slides.length > 0);
  const doneCount = playable.filter((l) => storyProgress[l.id]).length;

  /* ------------------------- unlock cinematic ------------------------- */
  const completedIdx = celebration
    ? STORY_LEVELS.findIndex((l) => l.id === celebration.completedId)
    : -1;
  const completedLevel = completedIdx >= 0 ? STORY_LEVELS[completedIdx] : null;
  const nextLevel = completedIdx >= 0 ? (STORY_LEVELS[completedIdx + 1] ?? null) : null;

  const [phase, setPhase] = useState<CinePhase | null>(celebration ? 'banner' : null);
  useEffect(() => {
    if (!celebration || !completedLevel) {
      setPhase(null);
      // Defensive: an unknown celebrate id (bad seam) is dropped silently.
      if (celebration && !completedLevel) clearStoryCelebration();
      return;
    }
    setPhase('banner');
    const timers: number[] = [];
    const stages: CinePhase[] = nextLevel ? ['path', 'lockglow', 'unlock', 'cta'] : ['cta'];
    let acc = PHASE_MS.banner;
    for (const s of stages) {
      timers.push(window.setTimeout(() => setPhase(s), acc));
      if (s !== 'cta') acc += PHASE_MS[s];
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebration?.completedId]);

  // Until the final beat, the freshly-unlocked node KEEPS LOOKING locked
  // and every node is click-blocked (§10: clickable only after).
  const cineActive = !!celebration && phase !== null;
  const holdLockedId =
    cineActive && phase !== 'unlock' && phase !== 'cta' ? (nextLevel?.id ?? null) : null;
  const clicksBlocked = cineActive && phase !== 'cta';

  /* --------------------------- node states ---------------------------- */
  const stateOf = (level: StoryLevelDef): NodeState => {
    if (holdLockedId === level.id) return 'locked';
    if (storyProgress[level.id]) return 'completed';
    if (level.slides.length > 0 && isStoryLevelUnlockedIn(storyProgress, level.id)) {
      return 'unlocked';
    }
    return 'locked';
  };

  const segState = (lowerIdx: number): SegVisual => {
    // The segment freshly travelled during the cinematic draws in on its
    // own beat, then stays lit.
    if (cineActive && lowerIdx === completedIdx && nextLevel) {
      if (phase === 'banner') return 'inactive';
      if (phase === 'path') return 'drawing';
      return 'active';
    }
    const lower = STORY_LEVELS[lowerIdx];
    const upper = STORY_LEVELS[lowerIdx + 1];
    if (!lower) return 'inactive';
    const lowerDone = !!storyProgress[lower.id];
    if (upper) {
      if (lowerDone && stateOf(upper) !== 'locked') return 'active';
      // The frontier level's outgoing segment points at the next horizon
      // (reference: violet dashes climbing past the current play node).
      if (lowerDone || stateOf(lower) === 'unlocked') return 'upcoming';
      return 'inactive';
    }
    // Segment from the LAST real level up to the ghost teaser.
    return lowerDone || stateOf(lower) === 'unlocked' ? 'upcoming' : 'inactive';
  };

  /* ------------------------- scroll management ------------------------ */
  const nodeRefs = useRef<Record<string, HTMLElement | null>>({});
  useEffect(() => {
    // On open: center the action (§12) — the celebrated node, else the
    // next level to play, else the top of the trail.
    const focusId =
      celebration?.completedId ??
      playable.find((l) => !storyProgress[l.id] && isStoryLevelUnlockedIn(storyProgress, l.id))
        ?.id ??
      STORY_LEVELS[STORY_LEVELS.length - 1]?.id;
    if (focusId) {
      nodeRefs.current[focusId]?.scrollIntoView({ behavior: 'auto', block: 'center' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    // The 'path' beat pans up to the node being unlocked.
    if (phase === 'path' && nextLevel) {
      nodeRefs.current[nextLevel.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [phase, nextLevel]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeStoryMap();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Modal focus lifecycle (§19): aria-modal must be true in BEHAVIOR, not
  // just markup — focus moves INTO the dialog on open, Tab/Shift+Tab wrap
  // inside it, and the opener gets focus back on close/unmount. Buttons
  // are the only interactive elements here; display:none decoys (md-only
  // bar on phones) drop out via the offsetParent visibility check, and
  // cinematic click-blocking drops the disabled trail nodes the same way.
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const opener =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusables = () =>
      Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled])')).filter(
        (el) => el.offsetParent !== null,
      );
    focusables()[0]?.focus({ preventScroll: true });
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const els = focusables();
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      const active = document.activeElement;
      const inside = active instanceof HTMLElement && root.contains(active);
      if (e.shiftKey) {
        if (!inside || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (!inside || active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    // Capture phase: the trap wins even if focus somehow lands on the
    // world/HUD behind the dialog.
    window.addEventListener('keydown', onTab, true);
    return () => {
      window.removeEventListener('keydown', onTab, true);
      opener?.focus({ preventScroll: true });
    };
  }, []);

  const playLevel = (levelId: string) => {
    if (clicksBlocked) return;
    clearStoryCelebration();
    // openStory re-checks the lock rules (fail-closed) and primes the ONE
    // story audio path inside this tap gesture.
    openStory(levelId);
  };

  /* --------------------- locked-node feedback note --------------------- */
  const [lockedNote, setLockedNote] = useState(false);
  const lockedNoteTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (lockedNoteTimer.current !== null) window.clearTimeout(lockedNoteTimer.current);
    },
    [],
  );
  const flashLockedNote = () => {
    setLockedNote(true);
    if (lockedNoteTimer.current !== null) window.clearTimeout(lockedNoteTimer.current);
    lockedNoteTimer.current = window.setTimeout(() => setLockedNote(false), 2200);
  };

  /* ------------------------------ render ------------------------------ */
  // Bottom-up trail: with flex-col-reverse, DOM order [L1, seg, L2, …,
  // ghost] paints Level 1 at the BOTTOM and the ghost at the top.
  const trail: React.ReactNode[] = [];
  STORY_LEVELS.forEach((level, i) => {
    if (i > 0) {
      trail.push(
        <AdventurePath key={`seg-${i}`} state={segState(i - 1)} flip={(i - 1) % 2 === 1} />,
      );
    }
    const st = stateOf(level);
    trail.push(
      <AdventureLevel
        key={level.id}
        level={level}
        index={i}
        state={st}
        lockGlow={cineActive && phase === 'lockglow' && nextLevel?.id === level.id}
        unlocking={cineActive && phase === 'unlock' && nextLevel?.id === level.id}
        disabled={clicksBlocked || st === 'locked'}
        language={language}
        onPlay={() => playLevel(level.id)}
        onLockedClick={() => {
          if (!clicksBlocked) flashLockedNote();
        }}
        nodeRef={(el) => {
          nodeRefs.current[level.id] = el;
        }}
      />,
    );
  });
  trail.push(
    <AdventurePath
      key="seg-ghost"
      state={segState(STORY_LEVELS.length - 1)}
      flip={(STORY_LEVELS.length - 1) % 2 === 1}
    />,
  );
  trail.push(<GhostNode key="ghost" index={STORY_LEVELS.length} />);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={t.storyAdventure}
      className="absolute inset-0 z-30 pointer-events-auto flex flex-col bg-gradient-to-b from-[#d9edf8] via-[#f8f4e6] to-[#eef0d9]"
    >
      <style>{`
        @keyframes nnPathDraw { to { stroke-dashoffset: 0; } }
        @keyframes nnLockShake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-10deg); }
          40% { transform: rotate(9deg); }
          60% { transform: rotate(-7deg); }
          80% { transform: rotate(5deg); }
        }
      `}</style>

      {/* Meadow dressing (z-0, §3/§17) — winding cream trail, soft grassy
          islands, cutouts from the user's reference art, sparkles and two
          little butterflies. Edge-hugging and pointer-inert so the level
          trail stays the focus; most pieces are md+ only (phone columns
          reach the screen edges). */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* winding footpath painted into the terrain */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="hidden md:block absolute inset-0 w-full h-full opacity-70"
          style={{ filter: 'blur(3px)' }}
        >
          <path
            d="M -6 99 C 16 86, 9 66, 33 57 C 54 49, 66 53, 80 43 C 91 36, 97 29, 106 25"
            fill="none"
            stroke="#efe4c6"
            strokeWidth="12"
            strokeLinecap="round"
          />
        </svg>
        {/* soft grassy islands under the trail */}
        <div className="hidden md:block absolute right-[14%] top-[28%] w-[30rem] h-[16rem] bg-[radial-gradient(closest-side,rgba(174,213,110,0.42),transparent)] blur-md" />
        <div className="hidden md:block absolute left-[8%] top-[62%] w-[26rem] h-[13rem] bg-[radial-gradient(closest-side,rgba(174,213,110,0.34),transparent)] blur-md" />
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-amber-200/40 blur-2xl" />
        <div className="absolute bottom-24 -left-20 w-64 h-64 rounded-full bg-lime-300/30 blur-3xl" />
        {/* reference-art cutouts */}
        <img src={`${ART}rock.png`} alt="" className="hidden md:block absolute left-[4%] top-[13%] w-16" />
        <img src={`${ART}tree-l.png`} alt="" className="hidden md:block absolute left-0 top-[24%] w-44" />
        <img src={`${ART}tree-r.png`} alt="" className="hidden md:block absolute right-0 top-[36%] w-36" />
        <img src={`${ART}rock.png`} alt="" className="hidden md:block absolute left-[13%] top-[57%] w-20" />
        <img src={`${ART}log-l.png`} alt="" className="hidden md:block absolute left-[3%] top-[71%] w-32" />
        <img src={`${ART}log-r.png`} alt="" className="hidden md:block absolute right-[6%] top-[57%] w-28" />
        <img src={`${ART}shroom.png`} alt="" className="hidden md:block absolute left-[24%] top-[44%] w-14" />
        <img src={`${ART}shroom.png`} alt="" className="hidden md:block absolute right-[21%] top-[69%] w-12 scale-x-[-1]" />
        <img src={`${ART}daisy.png`} alt="" className="absolute right-[9%] top-[14%] w-10 md:w-12" />
        <img src={`${ART}daisy.png`} alt="" className="hidden md:block absolute left-[30%] top-[76%] w-10" />
        <img src={`${ART}grass.png`} alt="" className="absolute left-[6%] top-[20%] w-10 md:left-[31%] md:w-14" />
        <img src={`${ART}grass.png`} alt="" className="hidden md:block absolute right-[28%] top-[78%] w-14" />
        <img
          src={`${ART}bush-bl.png`}
          alt=""
          className="absolute -left-1 bottom-0 w-36 md:w-64 [mask-image:linear-gradient(to_right,black_72%,transparent)]"
        />
        <img
          src={`${ART}bush-br.png`}
          alt=""
          className="absolute -right-1 bottom-0 w-24 md:w-36 [mask-image:linear-gradient(to_left,black_70%,transparent)]"
        />
        {/* leaf medallion under the back button (reference top-left) */}
        <span className="hidden md:grid absolute left-5 top-24 w-11 h-11 bg-white rounded-full shadow-md border border-slate-100 place-content-center">
          <Leaf className="w-5 h-5 text-emerald-500" />
        </span>
        {/* sparkles + butterflies */}
        <span className="absolute top-40 right-24 text-amber-400/60 motion-safe:animate-pulse">
          <Sparkles className="w-6 h-6" />
        </span>
        <span className="hidden md:block absolute top-[24%] right-[7%] text-amber-400/70 motion-safe:animate-pulse" style={{ animationDelay: '700ms' }}>
          <Sparkles className="w-4 h-4" />
        </span>
        <Butterfly className="hidden md:block absolute top-[17%] right-[27%] w-7 h-7 text-rose-400 rotate-12 motion-safe:animate-pulse" />
        <Butterfly className="hidden md:block absolute top-[38%] left-[19%] w-5 h-5 text-amber-500 -rotate-6 motion-safe:animate-pulse" style={{ animationDelay: '1100ms' }} />
      </div>

      {/* Top bar (reference: chevron back, sparkle-flanked display title,
          star progress pill). z-10 above decor (§17). */}
      <div className="relative z-10 flex items-center justify-between gap-3 p-4 md:p-5 shrink-0">
        <button
          onClick={closeStoryMap}
          aria-label={t.back}
          className="bg-white p-2.5 md:p-3 rounded-full shadow-md border border-slate-100 text-slate-500 hover:text-slate-700 transition-colors active:scale-95 touch-manipulation shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <div className="text-center leading-tight min-w-0">
          <p className="font-display font-bold text-xl md:text-4xl text-[#0b2a52] flex items-center justify-center gap-2 min-w-0">
            <Sparkles className="hidden sm:block w-4 h-4 md:w-5 md:h-5 text-amber-400 shrink-0" aria-hidden="true" />
            <span className="truncate">{t.storyAdventure}</span>
            <Sparkles className="hidden sm:block w-4 h-4 md:w-5 md:h-5 text-amber-400 shrink-0" aria-hidden="true" />
          </p>
          <p className="text-xs md:text-sm font-semibold text-slate-500 truncate">
            {t.storyMapSubtitle}
          </p>
        </div>
        <span className="flex items-center gap-1.5 bg-white px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-md border border-slate-100 text-sm font-bold text-[#0b2a52] shrink-0">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden="true" />
          {t.storyMapLevelsDone(doneCount, playable.length)}
        </span>
      </div>

      {/* Locked-node feedback (§11): child-friendly, auto-dismisses. */}
      <div
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 top-20 md:top-24 z-20 flex justify-center px-4"
      >
        {lockedNote && (
          <div className="flex items-center gap-2 bg-white/95 border border-slate-200 shadow-lg rounded-full px-4 py-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Lock className="w-4 h-4 text-slate-400" aria-hidden="true" />
            <span className="text-sm font-bold text-[#0b2a52]">{t.storyMapLockedToast}</span>
          </div>
        )}
      </div>

      {/* The trail */}
      <div className="relative flex-1 overflow-y-auto overflow-x-hidden">
        <div className="min-h-full flex flex-col-reverse items-center justify-start pt-4 pb-24 md:pb-32">
          {trail}
        </div>
      </div>

      {/* Reference bottom bar (§13): the SAME three shortcuts the village
          HUD offers, restyled to the reference's white pill. md+ only — on
          phones the floating Get Help pill owns the bottom edge (§14); on
          md tablets it anchors LEFT so the HUD's Get Help pill (bottom-right,
          z-50) never covers it, recentering at lg+ like the reference.
          Progress and Community mount AFTER the map in HUD.tsx, so they
          open ABOVE it. */}
      {!cineActive && (
        <div className="hidden md:flex absolute bottom-5 left-6 lg:left-1/2 lg:-translate-x-1/2 z-10 items-center gap-1 bg-white/95 border border-slate-100 rounded-full px-2.5 py-1.5 shadow-lg pointer-events-auto">
          <button onClick={openProgress} className={NAV_BTN}>
            <span className="w-7 h-7 rounded-lg bg-amber-100 grid place-content-center">
              <BookOpen className="w-4 h-4 text-amber-600" />
            </span>
            {t.learnRights}
          </button>
          <span className="w-px h-6 bg-slate-100" aria-hidden="true" />
          <button onClick={openCommunity} className={NAV_BTN}>
            <span className="w-7 h-7 rounded-lg bg-sky-100 grid place-content-center">
              <Users className="w-4 h-4 text-sky-600" />
            </span>
            {t.helpOthers}
          </button>
          <span className="w-px h-6 bg-slate-100" aria-hidden="true" />
          <button onClick={openProgress} className={NAV_BTN}>
            <span className="w-7 h-7 rounded-lg bg-amber-100 grid place-content-center">
              <Trophy className="w-4 h-4 text-amber-600" />
            </span>
            {t.earnBadges}
          </button>
        </div>
      )}

      {/* Unlock cinematic overlays */}
      {cineActive && completedLevel && (
        <CelebrationLayer
          phase={phase!}
          completedLevel={completedLevel}
          nextLevel={nextLevel}
          language={language}
          onPlayNext={() => nextLevel && playLevel(nextLevel.id)}
          onDismiss={clearStoryCelebration}
        />
      )}
    </div>
  );
}

/* ------------------------------ decor bits ------------------------------ */

/** Tiny inline butterfly (reference accent) — pure SVG, no image asset. */
function Butterfly({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path
        d="M12 7 C 9 2, 3 3, 4.5 8 C 5.5 11, 9.5 11.5, 12 10.5 C 14.5 11.5, 18.5 11, 19.5 8 C 21 3, 15 2, 12 7 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M12 10.5 C 10 11, 7.5 15, 9.5 17 C 11 18.5, 12 15.5, 12 13.5 C 12 15.5, 13 18.5, 14.5 17 C 16.5 15, 14 11, 12 10.5 Z"
        fill="currentColor"
        opacity="0.6"
      />
      <path d="M12 6.5 V 13" stroke="#7c2d12" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------ trail bits ------------------------------ */

/**
 * <AdventurePath/> (§9) — one dashed sweep between consecutive nodes,
 * generated per gap so ANY number of levels chains automatically.
 * Gold = already travelled, violet = the next horizon, sand = far away.
 */
function AdventurePath({ state, flip }: { state: SegVisual; flip: boolean }) {
  return (
    <div
      className={cn(
        'h-24 md:h-28 w-[150px] md:w-[min(34vw,26rem)] shrink-0 -my-1',
        flip && 'scale-x-[-1]',
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 72" className="w-full h-full" preserveAspectRatio="none">
        {/* Long rounded dashes (reference style), wider at md+ so the
            sweep visually bridges the serpentine gap. */}
        <path
          d="M 25 72 C 25 24, 175 48, 175 0"
          fill="none"
          strokeLinecap="round"
          strokeWidth={6.5}
          strokeDasharray="6 8"
          pathLength={100}
          className={cn(
            'transition-colors duration-500',
            state === 'inactive' && 'stroke-[#d9cfae]',
            state === 'upcoming' && 'stroke-violet-400/80',
            (state === 'active' || state === 'drawing') && 'stroke-amber-400',
          )}
        />
        {state === 'drawing' && (
          <path
            d="M 25 72 C 25 24, 175 48, 175 0"
            fill="none"
            strokeLinecap="round"
            strokeWidth={6.5}
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={100}
            className="stroke-amber-400/90 motion-safe:[animation:nnPathDraw_950ms_ease-out_forwards]"
          />
        )}
      </svg>
    </div>
  );
}

/**
 * <AdventureLevel/> (§9) — one node disc + info card, fully data-driven.
 * Even indices sit left, odd right (controlled serpentine, §9).
 */
function AdventureLevel({
  level,
  index,
  state,
  lockGlow,
  unlocking,
  disabled,
  language,
  onPlay,
  onLockedClick,
  nodeRef,
}: {
  level: StoryLevelDef;
  index: number;
  state: NodeState;
  lockGlow: boolean;
  unlocking: boolean;
  disabled: boolean;
  language: 'en' | 'hi';
  onPlay: () => void;
  onLockedClick: () => void;
  nodeRef: (el: HTMLElement | null) => void;
}) {
  const t = useStrings();
  const prev = index > 0 ? STORY_LEVELS[index - 1] : null;
  const right = index % 2 === 1; // serpentine: even levels sit left, odd right

  const disc = (
    <span
      className={cn(
        'relative w-20 h-20 md:w-28 md:h-28 rounded-full grid place-content-center shrink-0 transition-all duration-500',
        state === 'completed' &&
          'bg-gradient-to-tr from-amber-300 to-orange-400 ring-4 ring-white shadow-[0_0_28px_rgba(251,146,60,0.45)]',
        state === 'unlocked' && 'bg-white shadow-[0_0_26px_rgba(139,92,246,0.35)]',
        state === 'locked' && 'bg-slate-200/90 border-4 border-slate-300',
        lockGlow && 'ring-4 ring-amber-300 shadow-[0_0_42px_rgba(251,191,36,0.85)]',
      )}
    >
      {/* current-level pulse halo */}
      {state === 'unlocked' && !unlocking && (
        <span
          className="absolute -inset-2 rounded-full bg-violet-400/25 motion-safe:animate-ping"
          style={{ animationDuration: '2s' }}
          aria-hidden="true"
        />
      )}
      {/* violet progress ring on the active node (reference play disc) */}
      {state === 'unlocked' && (
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="none" strokeWidth="7" className="stroke-violet-100" />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="78 22"
            className="stroke-violet-500"
          />
        </svg>
      )}
      {state === 'completed' && (
        <>
          <span className="absolute -top-2 -left-2 text-amber-500 motion-safe:animate-ping" aria-hidden="true">
            <Sparkles className="w-4 h-4" />
          </span>
          <span
            className="absolute -bottom-1 -right-2 text-orange-400 motion-safe:animate-ping"
            style={{ animationDelay: '600ms' }}
            aria-hidden="true"
          >
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-green-500 ring-2 ring-white grid place-content-center" aria-hidden="true">
            <Check className="w-4 h-4 text-white" strokeWidth={3.5} />
          </span>
        </>
      )}
      {state === 'completed' ? (
        <Trophy className="relative w-9 h-9 md:w-12 md:h-12 text-white drop-shadow" />
      ) : unlocking ? (
        <LockOpen className="relative w-8 h-8 md:w-10 md:h-10 text-violet-500 animate-in zoom-in-50 spin-in-12 duration-500" />
      ) : state === 'unlocked' ? (
        <Play className="relative w-8 h-8 md:w-10 md:h-10 text-violet-600 translate-x-0.5" fill="currentColor" />
      ) : (
        <span className={cn(lockGlow && 'motion-safe:[animation:nnLockShake_650ms_ease-in-out_infinite]')}>
          <Lock className="relative w-8 h-8 md:w-10 md:h-10 text-slate-400" />
        </span>
      )}
      {/* level number bubble — screen-only text, digits allowed */}
      <span
        className={cn(
          'absolute -bottom-1.5 -left-1.5 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white border-2 border-white shadow-md grid place-content-center text-xs md:text-sm font-bold',
          state === 'locked' ? 'text-slate-400' : 'text-slate-600',
        )}
        aria-hidden="true"
      >
        {level.number}
      </span>
    </span>
  );

  const card = (
    <span
      className={cn(
        'block w-44 md:w-64 bg-white/95 rounded-[1.35rem] border shadow-md px-3.5 py-2.5 md:px-5 md:py-4 text-left leading-tight transition-shadow group-hover:shadow-lg',
        state === 'locked' ? 'border-slate-200' : 'border-slate-100',
      )}
    >
      {state !== 'locked' && (
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] md:text-xs font-extrabold uppercase tracking-wide',
            state === 'completed'
              ? 'bg-orange-100 text-orange-600'
              : 'bg-violet-100 text-violet-600',
          )}
        >
          {t.levelN(level.number)}
        </span>
      )}
      <span
        className={cn(
          'mt-1 block font-display font-bold text-sm md:text-xl',
          state === 'locked' ? 'text-slate-400' : 'text-[#0b2a52]',
        )}
      >
        {level.title[language]}
      </span>
      <span
        className={cn(
          'block text-xs md:text-sm font-semibold',
          state === 'locked' ? 'text-slate-400/80' : 'text-slate-500',
        )}
      >
        {level.subtitle[language]}
      </span>
      {state === 'completed' && (
        <>
          <span className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full text-[11px] md:text-xs font-bold">
              <Check className="w-3 h-3" strokeWidth={3} />
              {t.levelCompletedTag}
            </span>
            <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full text-[11px] md:text-xs font-bold">
              <Trophy className="w-3 h-3" />
              {level.reward[language]}
            </span>
          </span>
          <span className="mt-1.5 inline-flex items-center gap-1.5 text-slate-500 text-[11px] md:text-xs font-bold">
            <RotateCcw className="w-3.5 h-3.5" />
            {t.storyMapReplayCta}
          </span>
        </>
      )}
      {state === 'unlocked' && (
        <span className="mt-2 inline-flex items-center gap-1.5 bg-violet-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
          <Play className="w-3 h-3" fill="currentColor" />
          {t.storyMapPlayCta}
        </span>
      )}
      {state === 'locked' && prev && (
        <span className="mt-1 block text-[11px] md:text-xs font-medium text-slate-400">
          {t.storyLockedHint(prev.title[language])}
        </span>
      )}
    </span>
  );

  const rowCls = cn(
    'group relative shrink-0 flex items-center gap-3 md:gap-4 rounded-3xl p-1.5 touch-manipulation focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/60',
    right
      ? 'flex-row-reverse translate-x-[min(6vw,2.5rem)] md:translate-x-[min(15vw,12rem)]'
      : 'translate-x-[max(-6vw,-2.5rem)] md:translate-x-[max(-15vw,-12rem)]',
    state !== 'locked' &&
      !disabled &&
      'cursor-pointer transition-transform md:hover:scale-[1.03] active:scale-[0.98]',
  );

  if (state === 'locked') {
    // Locked nodes stay inert for navigation but CLICKABLE for feedback:
    // a tap explains the rule instead of silently doing nothing (§11).
    return (
      <button
        ref={nodeRef}
        type="button"
        aria-disabled="true"
        onClick={onLockedClick}
        aria-label={`${t.levelN(level.number)} — ${level.title[language]}`}
        className={cn(rowCls, 'text-left')}
      >
        {disc}
        {card}
      </button>
    );
  }
  return (
    <button
      ref={nodeRef}
      type="button"
      disabled={disabled}
      onClick={onPlay}
      aria-label={`${t.levelN(level.number)} — ${level.title[language]}`}
      className={rowCls}
    >
      {disc}
      {card}
    </button>
  );
}

/** One non-clickable "more adventures coming" teaser above the last level. */
function GhostNode({ index }: { index: number }) {
  const t = useStrings();
  const right = index % 2 === 1;
  return (
    <div
      aria-disabled="true"
      className={cn(
        'relative shrink-0 flex items-center gap-3 md:gap-4 p-1.5 opacity-95',
        right
          ? 'flex-row-reverse translate-x-[min(6vw,2.5rem)] md:translate-x-[min(15vw,12rem)]'
          : 'translate-x-[max(-6vw,-2.5rem)] md:translate-x-[max(-15vw,-12rem)]',
      )}
    >
      <span className="relative w-20 h-20 md:w-24 md:h-24 rounded-full grid place-content-center shrink-0 bg-white shadow-md border border-violet-100">
        <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-violet-500" />
        <span className="absolute top-1 right-1.5 text-violet-300" aria-hidden="true">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
        <span
          className="absolute -top-1 -right-1 text-violet-300 motion-safe:animate-ping"
          style={{ animationDuration: '2.4s' }}
          aria-hidden="true"
        >
          <Sparkles className="w-4 h-4" />
        </span>
      </span>
      <span className="block w-44 md:w-64 bg-white/90 rounded-[1.35rem] border-2 border-dashed border-violet-300 px-3.5 py-2.5 md:px-5 md:py-4 leading-snug">
        <span className="block font-display font-bold text-sm md:text-lg text-violet-500">
          {t.storyMapComingSoonLead}
        </span>
        <span className="block font-display font-bold text-sm md:text-lg text-[#0b2a52]">
          {t.storyMapComingSoonTail}
        </span>
      </span>
    </div>
  );
}

/* --------------------------- cinematic layer ---------------------------- */

function CelebrationLayer({
  phase,
  completedLevel,
  nextLevel,
  language,
  onPlayNext,
  onDismiss,
}: {
  phase: CinePhase;
  completedLevel: StoryLevelDef;
  nextLevel: StoryLevelDef | null;
  language: 'en' | 'hi';
  onPlayNext: () => void;
  onDismiss: () => void;
}) {
  const t = useStrings();

  // Mid-sequence beats: a small reward toast keeps the eye free to watch
  // the trail light up. No pointer events anywhere.
  if (phase === 'path' || phase === 'lockglow' || phase === 'unlock') {
    return (
      <div className="absolute inset-x-0 top-20 z-20 flex justify-center pointer-events-none">
        <div className="flex items-center gap-2 bg-white/95 border border-amber-200 shadow-lg rounded-full px-4 py-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <Award className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-sm font-bold text-[#0b2a52]">
            {t.storyRewardUnlocked(completedLevel.reward[language])}
          </span>
        </div>
      </div>
    );
  }

  // 'banner' (sequence start) and 'cta' (sequence end) are centered cards.
  return (
    <div
      className="absolute inset-0 z-20 grid place-items-center p-4 bg-slate-900/25 backdrop-blur-[2px] animate-in fade-in duration-300"
      onClick={phase === 'cta' ? onDismiss : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white rounded-3xl border border-orange-100 shadow-2xl px-6 py-7 text-center animate-in zoom-in-90 fade-in duration-400"
      >
        <span className="absolute -top-3 left-6 text-amber-400 motion-safe:animate-ping" aria-hidden="true">
          <Sparkles className="w-5 h-5" />
        </span>
        <span
          className="absolute -top-2 right-8 text-orange-400 motion-safe:animate-ping"
          style={{ animationDelay: '450ms' }}
          aria-hidden="true"
        >
          <Sparkles className="w-4 h-4" />
        </span>

        {phase === 'banner' ? (
          <>
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-orange-400 to-amber-300 grid place-content-center ring-4 ring-white shadow-[0_0_40px_rgba(251,146,60,0.5)] animate-in zoom-in-50 duration-500">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h3 className="mt-3 font-display font-bold text-2xl text-[#0b2a52]">
              {t.storyRewardUnlocked(completedLevel.reward[language])}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {completedLevel.title[language]}
            </p>
          </>
        ) : nextLevel ? (
          <>
            <div className="mx-auto w-20 h-20 rounded-full bg-white border-4 border-violet-400 grid place-content-center shadow-[0_0_32px_rgba(139,92,246,0.4)] animate-in zoom-in-50 duration-500">
              <LockOpen className="w-9 h-9 text-violet-500" />
            </div>
            <h3 className="mt-3 font-display font-bold text-2xl text-[#0b2a52]">
              {t.storyMapNewAdventure}
            </h3>
            <p className="mt-1 text-base font-bold text-violet-600">
              {t.levelN(nextLevel.number)} — {nextLevel.title[language]}
            </p>
            <p className="text-sm font-semibold text-slate-500">{nextLevel.subtitle[language]}</p>
            <button
              onClick={onPlayNext}
              className="mt-4 w-full bg-violet-500 hover:bg-violet-600 active:bg-violet-700 text-white py-3.5 rounded-full font-bold text-lg shadow-md transition-transform active:scale-95 touch-manipulation flex items-center justify-center gap-2"
            >
              {t.storyMapPlayLevelCta(nextLevel.number)}
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={onDismiss}
              className="mt-2 w-full py-2 rounded-full font-bold text-sm text-slate-400 hover:text-slate-600 transition-colors touch-manipulation"
            >
              {t.storyMapContinueCta}
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-amber-300 to-orange-400 grid place-content-center ring-4 ring-white shadow-[0_0_40px_rgba(251,146,60,0.5)] animate-in zoom-in-50 duration-500">
              <Trophy className="w-9 h-9 text-white" />
            </div>
            <h3 className="mt-3 font-display font-bold text-2xl text-[#0b2a52]">
              {t.storyMapAllDone}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{t.storyMapComingSoon}</p>
            <button
              onClick={onDismiss}
              className="mt-4 w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white py-3 rounded-full font-bold shadow-md transition-transform active:scale-95 touch-manipulation"
            >
              {t.storyMapContinueCta}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
