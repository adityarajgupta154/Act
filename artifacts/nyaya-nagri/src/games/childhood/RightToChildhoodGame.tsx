/**
 * "Right to Childhood" — playable drag-and-drop game (Aug 2026).
 *
 * Replaces the "Right or Wrong?" tap game as the zone2 castle lesson (user
 * order): jury feedback asked for a REAL game mechanic, so the loop is
 * OBSERVE → DRAG → DROP → MATCH → FEEDBACK → SCORE → COMPLETE. Three right
 * slots on a cream board, four illustrated scenario cards in a lavender
 * tray — three belong, ONE is a distractor that can never lock in.
 *
 * Architecture:
 *  - All rules live in logic.ts (pure, no React), driven deterministically
 *    by scripts/childhood.smoke.ts with an injectable rng.
 *  - Scenario text + law facts live in content.ts (hard-coded per PRD
 *    §9.8 — never AI-generated); data.ts binds the illustrations.
 *  - Dragging uses framer-motion (already a project dependency): pointer
 *    AND touch, spring return on a miss (`dragSnapToOrigin`), scale+shadow
 *    while dragging. A tap-to-select → tap-a-slot fallback keeps the game
 *    playable even where dragging is awkward.
 *  - ONE home: the castle's game-first flow (GameQuestFlow) — the lesson
 *    gate is credited by the flow's onComplete, never in here.
 *  - PRD §9.6: wrong drops never subtract points and never scold; the
 *    distractor feedback is factual and gentle.
 *  - PRD §9.1: Get Help Now (z-50, HelpDialog) stays visible above this
 *    overlay because the HUD mounts it later.
 */
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import {
  Apple,
  ArrowDown,
  ArrowRight,
  BookOpen,
  Check,
  HeartPulse,
  Image as ImageIcon,
  Lightbulb,
  Megaphone,
  Music,
  RefreshCw,
  Shield,
  ShieldCheck,
  Star,
  Users,
  Volleyball,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  newChSession,
  dropOption,
  nextRound,
  clearFeedback,
  useHint,
  clearHint,
  starsEarned,
  type ChSession,
} from './logic';
import { CH_ROUNDS, CH_OPTION_ART, CH_BG_URL } from './data';
import type { ChIcon, ChText } from './content';
import { SparkleBurst } from './SparkleBurst';
import { playCorrect, playWrong, playComplete } from './sfx';
import { useStrings } from '@/i18n/strings';
import { useSettings } from '@/data/settingsStore';
import guideBoyUrl from '@/assets/home/guide-boy.webp';

// ---------------------------------------------------------------------------
// Reducer (session lives in useReducer; rules stay in logic.ts)
// ---------------------------------------------------------------------------

type GameAction =
  | { type: 'drop'; optionId: string; rightId: string }
  | { type: 'next' }
  | { type: 'clearFeedback' }
  | { type: 'hint' }
  | { type: 'clearHint' }
  | { type: 'restart' };

function init(): ChSession {
  return newChSession(CH_ROUNDS);
}

function reducer(s: ChSession, a: GameAction): ChSession {
  switch (a.type) {
    case 'drop':          return dropOption(CH_ROUNDS, s, a.optionId, a.rightId);
    case 'next':          return nextRound(CH_ROUNDS, s);
    case 'clearFeedback': return clearFeedback(s);
    case 'hint':          return useHint(CH_ROUNDS, s);
    case 'clearHint':     return clearHint(s);
    case 'restart':       return init();
    default:              return s;
  }
}

// ---------------------------------------------------------------------------
// Static lookups
// ---------------------------------------------------------------------------

const ICONS: Record<ChIcon, React.ComponentType<{ className?: string }>> = {
  book: BookOpen,
  ball: Volleyball,
  shield: Shield,
  heart: HeartPulse,
  family: Users,
  music: Music,
  crossing: ShieldCheck,
  food: Apple,
};

/** Slot accents are POSITIONAL (1 purple, 2 green, 3 orange — reference). */
const ACCENTS = [
  {
    num: 'bg-violet-500',
    title: 'text-violet-700',
    zone: 'bg-violet-50 border-violet-300',
    hover: 'border-violet-500 shadow-[0_0_0_5px_rgba(139,92,246,0.30)] scale-[1.02]',
    drop: 'text-violet-400',
  },
  {
    num: 'bg-emerald-500',
    title: 'text-emerald-700',
    zone: 'bg-emerald-50 border-emerald-300',
    hover: 'border-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.30)] scale-[1.02]',
    drop: 'text-emerald-400',
  },
  {
    num: 'bg-orange-500',
    title: 'text-orange-700',
    zone: 'bg-orange-50 border-orange-300',
    hover: 'border-orange-500 shadow-[0_0_0_5px_rgba(249,115,22,0.30)] scale-[1.02]',
    drop: 'text-orange-400',
  },
];

// ---------------------------------------------------------------------------
// Main overlay
// ---------------------------------------------------------------------------

export function RightToChildhoodGame({
  onComplete,
  onContinue,
  onExit,
}: {
  /** Called on every completed run (lesson-gate credit lives upstream). */
  onComplete: () => void;
  /** Primary Continue action on the completion screen (→ quiz). */
  onContinue: () => void;
  /** X button — back to the castle landing card. */
  onExit: () => void;
}) {
  const t = useStrings();
  const { language } = useSettings();
  const tx = useCallback((s: ChText) => (language === 'hi' ? s.hi : s.en), [language]);
  const [session, dispatch] = useReducer(reducer, undefined, init);
  const [soundOn, setSoundOn] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverRight, setHoverRight] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const round = CH_ROUNDS[session.roundIndex];
  const slotOrder = session.slotOrder[session.roundIndex] ?? [];
  const trayOrder = session.trayOrder[session.roundIndex] ?? [];
  const rightById = new Map(round?.rights.map((r) => [r.id, r]) ?? []);
  const optionById = new Map(round?.options.map((o) => [o.id, o]) ?? []);
  const placedIds = new Set(Object.values(session.placed));
  const playing = session.phase === 'playing';

  // --- sounds + auto-dismiss timers ride the feedback lifecycle -------------
  useEffect(() => {
    const fb = session.feedback;
    if (!fb) return;
    if (fb.kind === 'correct') soundOn && playCorrect();
    else soundOn && playWrong();
    // The round-clear banner stays up until the auto-advance below.
    if (fb.kind === 'correct' && fb.roundCleared) return;
    const ms = fb.kind === 'correct' ? 2200 : 1500;
    const id = setTimeout(() => dispatch({ type: 'clearFeedback' }), ms);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.feedback]);

  // --- round clear → auto-advance (final round → completion screen) ---------
  useEffect(() => {
    if (session.phase !== 'roundClear') return;
    const id = setTimeout(() => dispatch({ type: 'next' }), 2000);
    return () => clearTimeout(id);
  }, [session.phase]);

  // --- hint pulse clears after its moment (the hint is already spent) -------
  useEffect(() => {
    if (!session.hint) return;
    const id = setTimeout(() => dispatch({ type: 'clearHint' }), 2600);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.hint]);

  // --- completion: fanfare + report the run (idempotent upstream) -----------
  useEffect(() => {
    if (session.phase !== 'complete') return;
    soundOn && playComplete();
    onComplete();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.phase]);

  // --- drag plumbing ---------------------------------------------------------
  const hitTest = useCallback(
    (x: number, y: number): string | null => {
      for (const rid of session.slotOrder[session.roundIndex] ?? []) {
        const el = slotRefs.current[rid];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const pad = 10;
        if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) {
          return rid;
        }
      }
      return null;
    },
    [session.slotOrder, session.roundIndex],
  );

  const clientPoint = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if ('clientX' in e && typeof e.clientX === 'number') return { x: e.clientX, y: e.clientY };
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      return { x: touch.clientX, y: touch.clientY };
    }
    return { x: info.point.x - window.scrollX, y: info.point.y - window.scrollY };
  };

  const handleDragEnd = (optionId: string, e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { x, y } = clientPoint(e, info);
    const rightId = hitTest(x, y);
    setDraggingId(null);
    setHoverRight(null);
    if (rightId) dispatch({ type: 'drop', optionId, rightId });
  };

  // Tap-to-select fallback: tap a card, then tap a slot (keeps the game
  // playable where dragging is awkward; taps never fire after a real drag).
  const handleSlotTap = (rightId: string) => {
    if (!selectedId || !playing) return;
    dispatch({ type: 'drop', optionId: selectedId, rightId });
    setSelectedId(null);
  };

  const stars = starsEarned(session);
  const fb = session.feedback;

  // Mascot reaction line (spec §14) — falls back to the intro prompt.
  let mascotLine = t.chMascotIntro;
  if (fb?.kind === 'correct') mascotLine = t.chGreatMatch;
  else if (fb?.kind === 'wrong') mascotLine = t.chMascotWrong;
  else if (fb?.kind === 'distractor') mascotLine = t.chMascotDistractor;

  // -------------------------------------------------------------------------
  // COMPLETE screen
  // -------------------------------------------------------------------------
  if (session.phase === 'complete') {
    return (
      <Shell soundOn={soundOn} onToggleSound={() => setSoundOn((s) => !s)} onExit={onExit} t={t}>
        <div className="flex flex-col items-center gap-5 px-4 py-6 max-w-md mx-auto w-full animate-in fade-in duration-500">
          <img
            src={guideBoyUrl}
            alt=""
            className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-lg ch-float"
            aria-hidden
          />
          <div className="text-center">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white drop-shadow-md tracking-wide">
              {t.chCompleteHeading}
            </h2>
            <p className="mt-1.5 text-white/85 text-sm md:text-base font-semibold">
              {t.chCompleteSub}
            </p>
          </div>

          <div
            className="flex items-center gap-1.5 justify-center"
            aria-label={`${stars} / 3`}
          >
            {Array.from({ length: 3 }, (_, i) => (
              <Star
                key={i}
                className={[
                  'w-9 h-9 md:w-11 md:h-11 ch-star-pop',
                  i < stars ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-100',
                ].join(' ')}
                style={{ animationDelay: `${i * 0.14}s` }}
              />
            ))}
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 flex flex-col items-center gap-1 w-full max-w-xs shadow-inner">
            <span className="text-white/70 text-xs uppercase tracking-widest font-bold">
              {t.chFinalScore}
            </span>
            <span className="font-display font-extrabold text-5xl text-white">{session.score}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button
              type="button"
              onClick={() => dispatch({ type: 'restart' })}
              className="flex-1 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 active:scale-95 text-white font-bold text-base rounded-2xl py-3.5 shadow transition-all touch-manipulation"
            >
              <RefreshCw className="w-5 h-5" />
              {t.chPlayAgain}
            </button>
            <button
              type="button"
              onClick={onContinue}
              className="flex-1 flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-900 font-extrabold text-base rounded-2xl py-3.5 shadow-lg transition-all touch-manipulation"
            >
              {t.continueLabel}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // -------------------------------------------------------------------------
  // PLAYING screen
  // -------------------------------------------------------------------------
  return (
    <Shell soundOn={soundOn} onToggleSound={() => setSoundOn((s) => !s)} onExit={onExit} t={t}>
      {/* Round + score row */}
      <div className="flex items-center justify-between gap-2 px-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="bg-white/20 backdrop-blur-sm text-white font-bold text-xs md:text-sm rounded-full px-3 py-1.5">
            {t.chRound(session.roundIndex + 1, CH_ROUNDS.length)}
          </span>
          <span className="flex items-center gap-1" aria-hidden>
            {CH_ROUNDS.map((_, i) => (
              <span
                key={i}
                className={[
                  'w-2 h-2 rounded-full transition-all',
                  i < session.roundIndex ? 'bg-emerald-400 scale-110' :
                  i === session.roundIndex ? 'bg-white scale-125' : 'bg-white/30',
                ].join(' ')}
              />
            ))}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white font-bold text-xs md:text-sm rounded-full px-3.5 py-1.5">
            <Star className="w-4 h-4 text-amber-300 fill-amber-300" aria-hidden />
            <span>
              {t.chScoreLabel} {session.score}
            </span>
            {fb?.kind === 'correct' && (
              <span
                key={session.score}
                className="absolute -top-4 right-2 text-amber-300 font-extrabold text-sm ch-score-pop pointer-events-none"
                aria-hidden
              >
                +{fb.gained}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: 'hint' })}
            disabled={!playing || session.hintsLeft <= 0}
            aria-label={t.chHintAria(session.hintsLeft)}
            className={[
              'relative flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold text-xs md:text-sm shadow-md transition-all touch-manipulation shrink-0',
              playing && session.hintsLeft > 0
                ? 'bg-violet-600 hover:bg-violet-500 active:scale-95 text-white'
                : 'bg-white/20 text-white/50 cursor-not-allowed',
            ].join(' ')}
          >
            <Lightbulb className="w-4 h-4" aria-hidden />
            {t.chHint}
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow">
              {session.hintsLeft}
            </span>
          </button>
        </div>
      </div>

      {/* Heading + instruction */}
      <div className="text-center px-4 shrink-0">
        <div className="inline-flex items-center gap-2 bg-white/90 rounded-full px-4 py-1.5 shadow-md max-w-full">
          <Megaphone className="w-4 h-4 text-orange-500 shrink-0" aria-hidden />
          <p className="text-[11px] md:text-sm font-bold text-slate-700 truncate">
            {t.chInstruction}
          </p>
        </div>
      </div>

      {/* Play area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-2">
        <div className="relative w-full max-w-4xl mx-auto flex flex-col gap-3">
          {/* Game board — the 3 drop slots */}
          <div className="bg-[#fff8ec]/95 border border-amber-100 rounded-3xl shadow-xl p-3 md:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              {slotOrder.map((rid, pos) => {
                const right = rightById.get(rid);
                if (!right) return null;
                const accent = ACCENTS[pos % ACCENTS.length];
                const Icon = ICONS[right.icon];
                const placedOption = session.placed[rid]
                  ? optionById.get(session.placed[rid])
                  : null;
                const isHover = draggingId && hoverRight === rid && !placedOption;
                const isShake = fb && fb.kind !== 'correct' && fb.rightId === rid;
                const isHinted = session.hint?.rightId === rid;
                const justFilled = fb?.kind === 'correct' && fb.rightId === rid;
                return (
                  <div key={`${session.roundIndex}:${rid}`} className="flex flex-col items-center gap-1.5">
                    <span
                      className={`w-7 h-7 rounded-full ${accent.num} text-white font-extrabold text-sm flex items-center justify-center shadow-md`}
                      aria-hidden
                    >
                      {pos + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-4 h-4 ${accent.title}`} aria-hidden />
                      <span className={`font-display font-bold text-sm md:text-base ${accent.title} text-center leading-tight`}>
                        {tx(right.title)}
                      </span>
                    </div>
                    <div
                      ref={(el) => { slotRefs.current[rid] = el; }}
                      onClick={() => handleSlotTap(rid)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSlotTap(rid);
                        }
                      }}
                      role="button"
                      tabIndex={playing && !placedOption ? 0 : -1}
                      aria-label={tx(right.title)}
                      className={[
                        'relative w-full aspect-[4/3] rounded-2xl border-2 transition-all duration-150 overflow-hidden',
                        placedOption
                          ? 'border-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.30)] border-solid'
                          : `border-dashed ${accent.zone}`,
                        isHover ? accent.hover : '',
                        isShake ? 'ch-shake border-orange-400 shadow-[0_0_0_4px_rgba(251,146,60,0.35)]' : '',
                        isHinted ? 'ch-hint-pulse' : '',
                        selectedId && !placedOption ? 'cursor-pointer' : '',
                      ].join(' ')}
                    >
                      {placedOption ? (
                        <>
                          <img
                            src={CH_OPTION_ART[placedOption.id]}
                            alt={tx(placedOption.label)}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                          <span className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md ch-pop">
                            <Check className="w-4 h-4" aria-hidden />
                          </span>
                          <SparkleBurst key={placedOption.id} active={!!justFilled} />
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                          <ImageIcon className={`w-8 h-8 ${accent.drop} opacity-70`} aria-hidden />
                          <span className={`text-xs font-bold ${accent.drop}`}>{t.chDropHere}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback strip (reserved height — no layout jump) */}
          <div className="min-h-[3.25rem] flex items-center justify-center px-1" aria-live="polite">
            {fb?.kind === 'correct' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-emerald-500/95 backdrop-blur-sm text-white rounded-2xl px-4 py-2.5 max-w-lg w-full shadow-lg text-center">
                <p className="font-bold text-sm">
                  {fb.roundCleared ? `${t.chRoundCleared} ${t.chBonus(100)}` : t.chGreatMatch}
                </p>
                <p className="text-xs mt-0.5 text-white/90">
                  <span className="font-semibold">{t.chLawChipLabel}: </span>
                  {tx(rightById.get(fb.rightId)?.law ?? { en: '', hi: '' })}
                </p>
              </div>
            )}
            {fb?.kind === 'wrong' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-orange-500/95 backdrop-blur-sm text-white rounded-2xl px-4 py-2.5 max-w-lg w-full shadow-lg text-center">
                <p className="font-bold text-sm">{t.chNotQuite}</p>
              </div>
            )}
            {fb?.kind === 'distractor' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-rose-500/95 backdrop-blur-sm text-white rounded-2xl px-4 py-2.5 max-w-lg w-full shadow-lg text-center">
                <p className="font-bold text-sm">{t.chDoesntBelong}</p>
                {optionById.get(fb.optionId)?.note && (
                  <p className="text-xs mt-0.5 text-white/90">
                    {tx(optionById.get(fb.optionId)!.note!)}
                  </p>
                )}
              </div>
            )}
            {!fb && (
              <div className="lg:hidden flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 rounded-2xl px-3.5 py-1.5 max-w-lg w-full">
                <img src={guideBoyUrl} alt="" className="w-7 h-7 object-contain shrink-0" aria-hidden />
                <p className="text-xs font-medium truncate">{mascotLine}</p>
              </div>
            )}
          </div>

          {/* Scenario tray */}
          <div className="bg-violet-200/90 border border-violet-300 rounded-3xl p-3 md:p-4 shadow-xl">
            <div className="flex justify-center -mt-6 mb-2">
              <span className="inline-flex items-center gap-1.5 bg-violet-600 text-white text-xs md:text-sm font-extrabold px-4 py-1.5 rounded-full shadow-md">
                {t.chDragFromHere}
                <ArrowDown className="w-3.5 h-3.5" aria-hidden />
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3">
              {trayOrder.map((oid) => {
                const option = optionById.get(oid);
                if (!option) return null;
                const isPlaced = placedIds.has(oid);
                if (isPlaced) {
                  return (
                    <div
                      key={oid}
                      className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 flex flex-col items-center justify-center gap-1 py-4 opacity-70"
                    >
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" aria-hidden />
                      </span>
                      <span className="text-[10px] md:text-xs font-bold text-emerald-700 text-center px-2 leading-tight">
                        {tx(option.label)}
                      </span>
                    </div>
                  );
                }
                const isDragging = draggingId === oid;
                const isSelected = selectedId === oid;
                const isShaking = fb && fb.kind !== 'correct' && fb.optionId === oid && !isDragging;
                return (
                  <motion.div
                    key={`${session.roundIndex}:${oid}`}
                    drag={playing}
                    dragSnapToOrigin
                    dragMomentum={false}
                    dragElastic={0.1}
                    whileDrag={{ scale: 1.07, zIndex: 60, boxShadow: '0 18px 36px rgba(30,10,60,0.35)' }}
                    whileHover={playing ? { scale: 1.03 } : undefined}
                    onDragStart={() => { setDraggingId(oid); setSelectedId(null); }}
                    onDrag={(e, info) => {
                      const { x, y } = clientPoint(e, info);
                      setHoverRight(hitTest(x, y));
                    }}
                    onDragEnd={(e, info) => handleDragEnd(oid, e, info)}
                    onTap={() => playing && setSelectedId((cur) => (cur === oid ? null : oid))}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && playing) {
                        e.preventDefault();
                        setSelectedId((cur) => (cur === oid ? null : oid));
                      }
                    }}
                    style={{ touchAction: 'none' }}
                    role="button"
                    tabIndex={playing ? 0 : -1}
                    aria-label={tx(option.label)}
                    aria-pressed={isSelected}
                    className={[
                      'relative bg-white rounded-2xl border-2 shadow-md overflow-hidden select-none',
                      playing ? 'cursor-grab active:cursor-grabbing' : 'opacity-70',
                      isSelected ? 'border-sky-400 shadow-[0_0_0_4px_rgba(56,189,248,0.35)]' : 'border-white',
                      isShaking ? 'ch-shake border-orange-400' : '',
                      isDragging ? 'relative' : '',
                    ].join(' ')}
                  >
                    <div className="w-full aspect-[4/3] bg-sky-50 pointer-events-none">
                      <img
                        src={CH_OPTION_ART[oid]}
                        alt=""
                        className="w-full h-full object-cover"
                        draggable={false}
                        loading="eager"
                      />
                    </div>
                    <div className="px-1.5 pt-1.5 pb-2 pointer-events-none">
                      <p className="text-[10px] md:text-xs font-bold text-slate-700 text-center leading-tight line-clamp-2">
                        {tx(option.label)}
                      </p>
                      <span className="mt-1 mx-auto flex w-8 justify-center gap-0.5" aria-hidden>
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="w-1 h-1 rounded-full bg-slate-300" />
                        ))}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

    </Shell>
  );
}

// ---------------------------------------------------------------------------
// Shell wrapper — meadow-sky backdrop + top chrome
// ---------------------------------------------------------------------------

function Shell({
  children,
  soundOn,
  onToggleSound,
  onExit,
  t,
}: {
  children: React.ReactNode;
  soundOn: boolean;
  onToggleSound: () => void;
  onExit: () => void;
  t: ReturnType<typeof useStrings>;
}) {
  return (
    <div
      className="absolute inset-0 z-30 flex flex-col pointer-events-auto bg-cover bg-center"
      style={{ backgroundImage: `url(${CH_BG_URL})` }}
    >
      <div className="absolute inset-0 bg-violet-900/35" aria-hidden />

      {/* Top chrome: exit / title / sound */}
      <div className="relative z-10 flex items-start justify-between gap-2 px-3 pt-3 md:pt-4 shrink-0">
        <button
          type="button"
          onClick={onExit}
          aria-label={t.chExitLabel}
          className="bg-white/20 hover:bg-white/30 active:scale-95 text-white rounded-full p-2 transition touch-manipulation shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center min-w-0 -mt-0.5">
          <h1 className="font-display font-extrabold text-white text-xl md:text-3xl drop-shadow-md tracking-wide truncate max-w-full">
            {t.chTitle}
          </h1>
          <span className="mt-0.5 bg-pink-600/95 text-white text-[10px] md:text-xs font-bold px-3 py-0.5 rounded-full shadow-sm truncate max-w-full">
            {t.chSubtitle}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleSound}
          aria-label={soundOn ? t.chSoundOff : t.chSoundOn}
          className="bg-white/20 hover:bg-white/30 active:scale-95 text-white rounded-full p-2 transition touch-manipulation shrink-0"
        >
          {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0 gap-2.5 py-2 md:py-3">
        {children}
      </div>
    </div>
  );
}
