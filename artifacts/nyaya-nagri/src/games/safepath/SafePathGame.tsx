/**
 * "Safe Path Adventure" — playable POCSO maze game (Aug 2026), the zone1
 * (Safe Zone) lesson. Reference: user's mockup image (design reference
 * ONLY — this is a real game, not a screenshot).
 *
 * Loop: intro → MAZE (walk the path, decision cards pause movement at
 * unsafe spots, flags + safe spots checkpoint progress) → Safe Zone
 * celebration → 5-question SAFETY CHECK → result (Safety Champion).
 *
 * Architecture (mirrors the childhood game):
 *  - ALL rules live in logic.ts (pure; scripts/safepath.smoke.ts drives a
 *    real deterministic walkthrough). This file only renders + forwards
 *    input (keyboard arrows/WASD, on-screen D-pad, swipe).
 *  - Text lives in content.ts, hard-coded EN+HI (PRD §9.8); illustrations
 *    bind in data.ts. No helpline digits anywhere in game copy — the
 *    global Get Help Now pill (z-50, mounted later by the HUD) stays
 *    visible above this z-30 overlay on every phase (PRD §9.2).
 *  - PRD §9.6: wrong picks never subtract points and never scold ("Think
 *    again" + walk back to the checkpoint); hearts running out is a
 *    gentle "let's try that path again", and stars are never 0.
 *  - ONE home: GameQuestFlow mounts it; the lesson gate is credited by
 *    the flow's onComplete (fired once per finished run), never in here.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  Flag,
  Heart,
  Lightbulb,
  Map as MapIcon,
  Play,
  RefreshCw,
  Shield,
  ShieldCheck,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  newSpSession,
  spAckSafe,
  spDecide,
  spMaxScore,
  spMove,
  spTryAgain,
  spUseHint,
  obstacleByCh,
  findCell,
  SP_HINTS,
  type SpDir,
  type SpPos,
  type SpSession,
} from './logic';
import { SP_LEARNINGS, SP_LEVELS, type SpText } from './content';
import {
  SP_ART,
  SP_BG_URL,
  SP_GOAL_URL,
  SP_HERO_URL,
  SP_MASCOT_URL,
  SP_PLAYER_URL,
  SP_TILE_URL,
} from './data';
// Generic WebAudio chimes — deliberately shared with the childhood game
// (no assets, no per-game tuning needed).
import { playCorrect, playWrong, playComplete } from '../childhood/sfx';
import { useStrings } from '@/i18n/strings';
import { useSettings } from '@/data/settingsStore';
import { cn } from '@/lib/utils';

type Phase = 'intro' | 'maze' | 'success' | 'quiz' | 'result';
type Card = { ch: string; stage: 'ask' | 'correct' | 'wrong' } | null;

const isTouch =
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0);

/** Deterministic confetti layout (no rng — reduced-motion turns it off). */
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 53) % 100,
  delay: (i % 6) * 0.2,
  color: ['#f59e0b', '#8b5cf6', '#10b981', '#f97316', '#0ea5e9'][i % 5],
  size: 7 + (i % 3) * 3,
}));

const KEY_DIRS: Record<string, SpDir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
};

/** mm:ss (leading zeros) for the completion screen's Time Taken card. */
const fmtTime = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export function SafePathGame({
  onComplete,
  onContinue,
  onExit,
}: {
  /** Called once per finished run (lesson-gate credit lives upstream). */
  onComplete: () => void;
  /** Primary Continue action on the result screen (→ zone levels). */
  onContinue: () => void;
  /** X button — back to the Safe Zone landing card. */
  onExit: () => void;
}) {
  const t = useStrings();
  const { language } = useSettings();
  const tx = useCallback((x: SpText) => x[language === 'hi' ? 'hi' : 'en'], [language]);

  // DEV-only preview seam (house style, like ?zone= / &watched=):
  // &spphase=success opens the completion screen with a demo perfect-run
  // session so the screen can be reviewed without a full maze run.
  // DEV-gated on purpose — ungated this would be a prod shortcut past
  // the game straight into the quiz (and the lesson gate behind it).
  const devSuccessSeam =
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('spphase') === 'success';

  const [levelIdx, setLevelIdx] = useState(0);
  const level = SP_LEVELS[levelIdx];
  const [phase, setPhase] = useState<Phase>(devSuccessSeam ? 'success' : 'intro');
  const [session, setSession] = useState<SpSession>(() => {
    const s = newSpSession(SP_LEVELS[0]);
    if (!devSuccessSeam) return s;
    const unsafeCount = SP_LEVELS[0].obstacles.filter((o) => o.kind === 'unsafe').length;
    return { ...s, score: spMaxScore(SP_LEVELS[0]), safeDecisions: unsafeCount, reachedGoal: true };
  });
  const [card, setCard] = useState<Card>(null);
  const [showTips, setShowTips] = useState(false);
  const [muted, setMuted] = useState(false);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [hintCells, setHintCells] = useState<SpPos[]>([]);
  const [pops, setPops] = useState<{ id: number; text: string; pos: SpPos }[]>([]);
  const [quizI, setQuizI] = useState(0);
  const [quizPicked, setQuizPicked] = useState<string | null>(null);
  const [quizCorrect, setQuizCorrect] = useState(0);
  /** Frozen at the moment the goal is reached (demo value under the seam). */
  const [elapsedSec, setElapsedSec] = useState(devSuccessSeam ? 3 * 60 + 25 : 0);

  const sessionRef = useRef(session);
  sessionRef.current = session;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const popSeq = useRef(0);
  const creditedRun = useRef(false);
  const hintTimer = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  /** Wall-clock anchor for the run timer (set on every maze (re)start). */
  const runStartRef = useRef<number>(Date.now());

  const startMaze = useCallback(() => {
    runStartRef.current = Date.now();
    setPhase('maze');
  }, []);

  const R = level.grid.length;
  const C = level.grid[0]?.length ?? 1;
  const goalPos = useMemo(() => findCell(level.grid, 'Z'), [level]);
  const startPos = useMemo(() => findCell(level.grid, 'S'), [level]);

  const chime = useCallback((kind: 'ok' | 'no' | 'done') => {
    if (mutedRef.current) return;
    if (kind === 'ok') playCorrect();
    else if (kind === 'no') playWrong();
    else playComplete();
  }, []);

  const addPop = useCallback((text: string, pos: SpPos) => {
    const id = ++popSeq.current;
    setPops((p) => [...p, { id, text, pos }]);
    timersRef.current.push(window.setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1100));
  }, []);

  const resetRun = useCallback((idx: number) => {
    setSession(newSpSession(SP_LEVELS[idx]));
    setElapsedSec(0);
    setCard(null);
    setHintCells([]);
    setPops([]);
    setQuizI(0);
    setQuizPicked(null);
    setQuizCorrect(0);
    setFacing(1);
    creditedRun.current = false;
  }, []);

  const handleMove = useCallback(
    (dir: SpDir) => {
      if (phaseRef.current !== 'maze') return;
      const cur = sessionRef.current;
      const { s, event } = spMove(level, cur, dir);
      if (dir === 'left') setFacing(-1);
      else if (dir === 'right') setFacing(1);
      if (s !== cur) setSession(s);
      switch (event.type) {
        case 'obstacle':
        case 'safe':
          setCard({ ch: event.ch, stage: 'ask' });
          break;
        case 'checkpoint':
          chime('ok');
          addPop('+50', s.pos);
          break;
        case 'goal':
          chime('done');
          addPop('+200', s.pos);
          setElapsedSec(Math.round((Date.now() - runStartRef.current) / 1000));
          timersRef.current.push(window.setTimeout(() => setPhase('success'), 700));
          break;
        default:
          break;
      }
    },
    [level, chime, addPop],
  );

  // Keyboard: arrows + WASD (arrows also stop page scroll).
  useEffect(() => {
    if (phase !== 'maze') return;
    const onKey = (e: KeyboardEvent) => {
      const dir = KEY_DIRS[e.key];
      if (!dir) return;
      e.preventDefault();
      handleMove(dir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, handleMove]);

  // Timer cleanup on unmount (hint highlight, score pops, goal transition).
  useEffect(
    () => () => {
      if (hintTimer.current) window.clearTimeout(hintTimer.current);
      for (const id of timersRef.current) window.clearTimeout(id);
    },
    [],
  );

  // One gate credit per finished run (maze + safety check both done).
  useEffect(() => {
    if (phase === 'result' && !creditedRun.current) {
      creditedRun.current = true;
      onComplete();
    }
  }, [phase, onComplete]);

  const handleChoice = (choiceId: string) => {
    const cur = sessionRef.current;
    const { s, event } = spDecide(level, cur, choiceId);
    setSession(s);
    if (event.type === 'correct') {
      chime('ok');
      addPop('+100', s.pos);
      setCard((c) => (c ? { ...c, stage: 'correct' } : c));
    } else if (event.type === 'wrong') {
      chime('no');
      setCard((c) => (c ? { ...c, stage: 'wrong' } : c));
    } else if (event.type === 'lostLives') {
      chime('no');
      setCard(null);
    }
  };

  const handleAckSafe = () => {
    const cur = sessionRef.current;
    const { s, event } = spAckSafe(level, cur);
    setSession(s);
    if (event.type === 'safeCollected') {
      chime('ok');
      addPop('+50', s.pos);
    }
    setCard(null);
  };

  const handleHint = () => {
    const res = spUseHint(level, sessionRef.current);
    if (!res) return;
    setSession(res.s);
    setHintCells(res.path);
    if (hintTimer.current) window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHintCells([]), 2600);
  };

  const pickQuiz = (optId: string) => {
    if (quizPicked) return;
    const q = level.quiz[quizI];
    const opt = q.options.find((o) => o.id === optId);
    setQuizPicked(optId);
    if (opt?.correct) {
      setQuizCorrect((n) => n + 1);
      chime('ok');
    } else {
      chime('no');
    }
  };

  const nextPlayable = SP_LEVELS[levelIdx + 1];

  const cellStyle = (r: number, c: number): React.CSSProperties => ({
    left: `${(c * 100) / C}%`,
    top: `${(r * 100) / R}%`,
    width: `${100 / C}%`,
    height: `${100 / R}%`,
  });

  /* ------------------------------ shells ------------------------------ */

  const TopChrome = (
    <div className="absolute top-0 inset-x-0 z-20 flex items-start justify-between gap-2 p-2.5 md:p-4 pointer-events-none">
      <button
        type="button"
        onClick={onExit}
        aria-label={t.chExitLabel}
        className="pointer-events-auto w-10 h-10 rounded-full bg-white/95 shadow-md border border-orange-100 flex items-center justify-center text-slate-500 hover:text-slate-700 active:scale-95 transition-transform touch-manipulation shrink-0"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex flex-col items-center gap-1 min-w-0">
        <div className="bg-gradient-to-b from-violet-500 to-violet-700 text-white font-display font-extrabold text-base md:text-2xl px-4 md:px-7 py-1.5 md:py-2 rounded-2xl shadow-lg border-2 border-violet-300/60 whitespace-nowrap">
          {t.spTitle}
        </div>
        <div className="bg-amber-400/95 text-amber-900 text-[11px] md:text-sm font-extrabold px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap">
          {tx(level.title)}
        </div>
        <div className="hidden md:block bg-white/90 text-slate-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
          {t.spInstruction}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <div className="bg-white/95 rounded-2xl shadow-md border border-orange-100 px-2.5 md:px-3.5 py-1 md:py-1.5 flex items-center gap-1.5">
          <Star className="w-4 h-4 md:w-5 md:h-5 text-amber-400 fill-amber-400" aria-hidden />
          <span className="font-display font-extrabold text-slate-800 text-sm md:text-lg tabular-nums">
            {session.score}
          </span>
          <span className="hidden md:inline text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            {t.chScoreLabel}
          </span>
        </div>
        <div
          className="bg-white/95 rounded-full shadow-md border border-orange-100 px-2.5 py-1 flex items-center gap-1"
          role="img"
          aria-label={t.spLivesAria(session.lives)}
        >
          {[0, 1, 2].map((i) => (
            <Heart
              key={i}
              aria-hidden
              className={cn(
                'w-3.5 h-3.5 md:w-4 md:h-4',
                i < session.lives ? 'text-rose-500 fill-rose-500' : 'text-slate-300 fill-slate-200',
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? t.chSoundOn : t.chSoundOff}
          className="pointer-events-auto w-8 h-8 rounded-full bg-white/90 shadow border border-orange-100 flex items-center justify-center text-slate-500 active:scale-95 transition-transform touch-manipulation"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  /* ------------------------------ phases ------------------------------ */

  if (phase === 'intro') {
    return (
      <div className="fixed inset-0 z-30 overflow-hidden">
        <img src={SP_BG_URL} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-sky-900/30" />
        <button
          type="button"
          onClick={onExit}
          aria-label={t.chExitLabel}
          className="absolute top-3 left-3 z-20 w-10 h-10 rounded-full bg-white/95 shadow-md flex items-center justify-center text-slate-500 active:scale-95 transition-transform touch-manipulation"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] rounded-[2rem] shadow-2xl border border-orange-100 max-w-md w-full px-5 py-6 md:px-8 md:py-8 text-center animate-in zoom-in-95 duration-300 max-h-[calc(100dvh-4rem)] overflow-y-auto">
            <img
              src={SP_PLAYER_URL}
              alt=""
              aria-hidden
              draggable={false}
              className="w-20 md:w-24 mx-auto sp-float select-none"
            />
            <h2 className="font-display font-extrabold text-2xl md:text-3xl mt-2">
              <span className="text-violet-600">{t.spTitle}</span>
            </h2>
            <p className="inline-block bg-amber-400/90 text-amber-900 text-xs md:text-sm font-extrabold px-3 py-1 rounded-full mt-2">
              {t.spLevelLabel(level.n, SP_LEVELS.length)} · {tx(level.title)}
            </p>
            <p className="text-sm md:text-base text-slate-600 font-semibold mt-3">{tx(level.mission)}</p>
            <ul className="text-left mt-4 space-y-2">
              {[t.spMission1, t.spMission2, t.spMission3].map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm md:text-base font-semibold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden />
                  {m}
                </li>
              ))}
            </ul>
            <p className="text-xs md:text-sm text-slate-400 font-bold mt-4">
              {isTouch ? t.spMoveTouch : t.spMoveKeys}
            </p>
            <button
              type="button"
              onClick={startMaze}
              className="mt-4 w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-extrabold text-lg px-6 py-3.5 rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95 touch-manipulation"
            >
              <Play className="w-5 h-5 fill-current" aria-hidden />
              {t.spStartCta}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'success') {
    // Completion screen — recreation of the user's reference image
    // (Aug 2026). Every element is real DOM: layered CSS scenery, the
    // park art the game already plays on, and the app's own cast (guide
    // boy + Nyaya robot). Stats bind the LIVE session — nothing pasted.
    const choicesTotal = Math.max(1, session.safeDecisions + session.wrongDecisions);
    const [didItSubA, didItSubB] = t.spDidItSub.split('|SZ|');
    const titleWords = t.spTitle.split(' ');
    const titleColor = (i: number) =>
      i === 0 ? 'text-violet-600' : i === titleWords.length - 1 ? 'text-emerald-600' : 'text-orange-500';
    const statCards = [
      {
        label: t.chScoreLabel,
        value: String(session.score),
        unit: t.spPointsUnit,
        icon: <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500 fill-amber-400" aria-hidden />,
        border: 'border-amber-200',
        labelColor: 'text-amber-700',
      },
      {
        label: t.spStatChoices,
        value: `${session.safeDecisions}/${choicesTotal}`,
        unit: t.spCorrectUnit,
        icon: <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-500 fill-rose-400" aria-hidden />,
        border: 'border-rose-200',
        labelColor: 'text-rose-700',
      },
      {
        label: t.spStatTime,
        value: fmtTime(elapsedSec),
        unit: t.spMinutesUnit,
        icon: <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600" aria-hidden />,
        border: 'border-emerald-200',
        labelColor: 'text-emerald-700',
      },
    ];
    return (
      <div className="fixed inset-0 z-30 overflow-hidden">
        {/* ---- layered illustrated backdrop (PRD §9.5 — gentle cartoon) ---- */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-100" />
        <img
          src={SP_BG_URL}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute bottom-0 inset-x-0 h-[58%] w-full object-cover select-none [mask-image:linear-gradient(to_top,black_62%,transparent)]"
        />
        {/* clouds */}
        <div aria-hidden className="absolute top-[6%] left-[8%] w-28 h-10 md:w-40 md:h-14 bg-white/90 rounded-full blur-[1px] sp-float" />
        <div aria-hidden className="absolute top-[13%] right-[15%] w-24 h-8 md:w-36 md:h-12 bg-white/80 rounded-full blur-[1px] sp-float" style={{ animationDelay: '1.2s' }} />
        <div aria-hidden className="absolute top-[3%] right-[38%] w-16 h-6 md:w-24 md:h-9 bg-white/70 rounded-full blur-[1px] sp-float" style={{ animationDelay: '0.6s' }} />
        {/* bunting — both top corners */}
        <svg aria-hidden className="absolute top-0 left-0 w-40 md:w-64" viewBox="0 0 220 60">
          <path d="M0 6 Q 110 30 220 6" fill="none" stroke="#c4b5fd" strokeWidth="3" />
          {[8, 44, 80, 116, 152, 188].map((x, i) => (
            <polygon
              key={x}
              points={`${x},${10 + (i % 3) * 4} ${x + 22},${8 + (i % 3) * 4} ${x + 11},${32 + (i % 3) * 4}`}
              fill={['#a78bfa', '#fbbf24', '#34d399', '#fb923c', '#38bdf8', '#f472b6'][i]}
            />
          ))}
        </svg>
        <svg aria-hidden className="absolute top-0 right-0 w-40 md:w-64 -scale-x-100" viewBox="0 0 220 60">
          <path d="M0 6 Q 110 30 220 6" fill="none" stroke="#c4b5fd" strokeWidth="3" />
          {[8, 44, 80, 116, 152, 188].map((x, i) => (
            <polygon
              key={x}
              points={`${x},${10 + (i % 3) * 4} ${x + 22},${8 + (i % 3) * 4} ${x + 11},${32 + (i % 3) * 4}`}
              fill={['#f472b6', '#38bdf8', '#fb923c', '#34d399', '#fbbf24', '#a78bfa'][i]}
            />
          ))}
        </svg>
        {/* hot-air balloon */}
        <svg aria-hidden className="absolute top-[7%] right-[5%] w-12 md:w-16 sp-float" style={{ animationDelay: '0.9s' }} viewBox="0 0 60 84">
          <ellipse cx="30" cy="27" rx="21" ry="25" fill="#a78bfa" />
          <ellipse cx="30" cy="27" rx="12" ry="25" fill="#ddd6fe" />
          <ellipse cx="30" cy="27" rx="5" ry="25" fill="#a78bfa" />
          <path d="M18 47 L30 62 M42 47 L30 62" stroke="#7c3aed" strokeWidth="1.5" fill="none" />
          <rect x="24" y="60" width="12" height="10" rx="2" fill="#b45309" />
        </svg>
        {/* confetti */}
        {CONFETTI.map((cf, i) => (
          <span
            key={i}
            aria-hidden
            className="sp-confetti absolute top-0 rounded-sm"
            style={{
              left: `${cf.left}%`,
              width: cf.size,
              height: cf.size * 1.6,
              backgroundColor: cf.color,
              animationDelay: `${cf.delay}s`,
            }}
          />
        ))}
        {/* school (decorative, desktop) */}
        <div aria-hidden className="hidden lg:block absolute left-[4%] top-[15%] w-36 opacity-95">
          <div className="mx-auto w-0 h-0 border-l-[72px] border-r-[72px] border-b-[32px] border-l-transparent border-r-transparent border-b-rose-400" />
          <div className="bg-amber-50 border-2 border-amber-200 rounded-b-lg px-3 pt-2 pb-3 -mt-px shadow-md">
            <div className="mx-auto w-6 h-6 rounded-full bg-white border-2 border-amber-300 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            </div>
            <p className="text-center font-display font-extrabold text-[10px] text-amber-700 tracking-widest mt-1">SCHOOL</p>
            <div className="flex justify-center gap-1.5 mt-1">
              <span className="w-3.5 h-5 bg-sky-200 border border-sky-300 rounded-sm" />
              <span className="w-4 h-6 bg-amber-700 rounded-t-md" />
              <span className="w-3.5 h-5 bg-sky-200 border border-sky-300 rounded-sm" />
            </div>
          </div>
        </div>
        {/* wooden signboard (decorative, desktop) */}
        <div aria-hidden className="hidden lg:flex absolute left-[3%] bottom-[14%] flex-col items-center -rotate-3">
          <div className="bg-amber-800 border-4 border-amber-900/70 rounded-xl px-4 py-3 shadow-lg text-center">
            <p className="text-amber-50 font-display font-extrabold text-sm leading-snug">
              {t.spSignLine1}
              <br />
              {t.spSignLine2}
              <br />
              {t.spSignLine3}
            </p>
            <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-300 mx-auto mt-1" aria-hidden />
          </div>
          <div className="w-2.5 h-14 bg-amber-900 rounded-b-sm" />
        </div>
        {/* Nyaya robot mascot — waves over the panel edge (kept below the
            global Get Help Now pill, which lives at z-50) */}
        <img
          src={SP_MASCOT_URL}
          alt=""
          aria-hidden
          draggable={false}
          className="hidden md:block absolute bottom-3 right-3 lg:right-[3%] w-36 lg:w-48 z-20 sp-wave drop-shadow-xl select-none pointer-events-none"
        />

        {/* ---- scrollable content ---- */}
        <div className="absolute inset-0 overflow-y-auto">
          <div className="min-h-full flex flex-col items-center justify-center px-3 py-6 md:py-8 md:pb-14">
            {/* shield + heart emblem */}
            <div className="relative sp-pop">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl shadow-lg border border-violet-100 flex items-center justify-center">
                <div className="relative">
                  <Shield className="w-8 h-8 md:w-9 md:h-9 text-violet-600 fill-violet-500" aria-hidden />
                  <Heart className="w-3.5 h-3.5 text-amber-300 fill-amber-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%]" aria-hidden />
                </div>
              </div>
              <Star className="absolute -left-6 top-1 w-4 h-4 text-amber-400 fill-amber-300" aria-hidden />
              <Star className="absolute -right-6 top-3 w-3 h-3 text-amber-400 fill-amber-300" aria-hidden />
            </div>

            {/* multicolor outlined title */}
            <h1 className="font-display font-extrabold text-4xl md:text-6xl text-center leading-tight mt-2 sp-title-stroke">
              {titleWords.map((w, i) => (
                <span key={i} className={titleColor(i)}>
                  {w}
                  {i < titleWords.length - 1 ? ' ' : ''}
                </span>
              ))}
            </h1>
            <p className="font-display font-bold text-slate-800 text-base md:text-xl text-center mt-1.5">{t.spTagline}</p>
            <p className="font-bold text-violet-700 text-xs md:text-sm text-center mt-0.5">({t.spAwarenessTag})</p>

            {/* ---- central completion panel ---- */}
            <div className="relative bg-[#FFFDF6]/95 rounded-[2rem] md:rounded-[2.5rem] border border-orange-100 shadow-2xl w-full max-w-3xl mt-4 md:mt-5 px-3 py-4 md:px-7 md:py-6 animate-in zoom-in-95 duration-300">
              {/* achievement scene */}
              <div className="relative overflow-hidden rounded-[1.4rem] md:rounded-[1.8rem] border-2 border-emerald-100 shadow-sm">
                <img
                  src={SP_BG_URL}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover select-none"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/75 to-white/35" />
                <div className="relative grid md:grid-cols-[1fr_auto] gap-3 md:gap-5 p-4 md:p-6 pb-7 md:pb-9">
                  <div>
                    <h2 className="font-display font-extrabold text-2xl md:text-4xl text-violet-700 sp-pop">
                      {t.spDidIt} <span aria-hidden>🎉</span>
                    </h2>
                    <p className="font-semibold text-slate-700 text-sm md:text-base mt-1.5 max-w-md">
                      {didItSubA}
                      <span className="font-extrabold text-emerald-600">{t.spSafeZoneWord}</span>
                      {didItSubB}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 max-w-md">
                      {statCards.map((sc, i) => (
                        <div
                          key={sc.label}
                          className={cn('bg-white/95 border-2 rounded-2xl px-3 py-2.5 text-center shadow-sm sp-pop', sc.border)}
                          style={{ animationDelay: `${0.15 + i * 0.12}s` }}
                        >
                          <p className={cn('flex items-center justify-center gap-1 text-[10px] md:text-xs font-extrabold uppercase tracking-wide', sc.labelColor)}>
                            {sc.icon}
                            {sc.label}
                          </p>
                          <p className="font-display font-extrabold text-xl md:text-2xl text-slate-800 tabular-nums mt-0.5">{sc.value}</p>
                          <p className="text-[10px] md:text-xs font-bold text-slate-400">{sc.unit}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* victorious kid + glowing Safe Zone sign */}
                  <div className="flex md:flex-col items-center justify-center gap-3 md:gap-1.5 md:self-end md:pr-1">
                    <div className="flex flex-col items-center">
                      <div className="bg-gradient-to-b from-emerald-500 to-emerald-700 text-white font-display font-extrabold text-xs md:text-sm px-3 py-1 rounded-lg shadow-md border-2 border-emerald-300/60 rotate-2 whitespace-nowrap">
                        {t.spSafeZone}
                      </div>
                      <div className="relative mt-1.5">
                        <div aria-hidden className="absolute inset-0 m-auto w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-300/70 blur-md sp-glow" />
                        <div className="relative w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/90 border-2 border-emerald-300 shadow flex items-center justify-center">
                          <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" aria-hidden />
                        </div>
                      </div>
                    </div>
                    <img
                      src={SP_HERO_URL}
                      alt=""
                      aria-hidden
                      draggable={false}
                      className="h-32 md:h-48 object-contain drop-shadow-lg select-none sp-pop"
                      style={{ animationDelay: '0.25s' }}
                    />
                  </div>
                </div>
              </div>

              {/* Safety Champion ribbon (overlaps the scene's bottom edge) */}
              <div className="relative z-10 flex justify-center -mt-4 md:-mt-5">
                <div className="relative">
                  <div aria-hidden className="absolute -left-4 top-2 bottom-1 w-6 bg-violet-800 [clip-path:polygon(100%_0,100%_100%,0_100%,35%_50%,0_0)]" />
                  <div aria-hidden className="absolute -right-4 top-2 bottom-1 w-6 bg-violet-800 [clip-path:polygon(0_0,0_100%,100%_100%,65%_50%,100%_0)]" />
                  <p className="relative inline-flex items-center gap-2 bg-gradient-to-b from-violet-500 to-violet-700 text-white font-display font-extrabold text-sm md:text-lg px-5 md:px-7 py-1.5 md:py-2 rounded-xl shadow-lg border-2 border-violet-300/50">
                    <Star className="w-4 h-4 text-amber-300 fill-amber-300" aria-hidden />
                    {t.spYouAreChampion}
                    <Star className="w-4 h-4 text-amber-300 fill-amber-300" aria-hidden />
                  </p>
                </div>
              </div>

              {/* completion badge (status, not a button) */}
              <div className="flex justify-center mt-3 md:mt-4">
                <p role="status" className="inline-flex items-center gap-1.5 bg-emerald-50 border-2 border-emerald-300 text-emerald-700 font-bold text-sm md:text-base px-4 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4" aria-hidden />
                  {t.spGameCompleted}
                </p>
              </div>

              {/* actions — Continue leads on mobile, centered row on desktop */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center md:justify-center gap-2.5 md:gap-4 mt-4 md:mt-5">
                <button
                  type="button"
                  onClick={onExit}
                  className="order-2 md:order-1 inline-flex items-center justify-center gap-2 bg-white hover:bg-sky-50 active:bg-sky-100 text-sky-600 border-2 border-sky-300 font-extrabold text-sm md:text-base px-5 py-3 rounded-full shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-95 touch-manipulation focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                >
                  <MapIcon className="w-4 h-4 md:w-5 md:h-5" aria-hidden />
                  {t.spBackToMap}
                </button>
                <button
                  type="button"
                  onClick={() => setPhase('quiz')}
                  className="order-1 md:order-2 inline-flex items-center justify-center gap-2 bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-600 text-white font-extrabold text-base md:text-lg px-8 py-3.5 rounded-full shadow-lg shadow-orange-500/30 transition-all duration-200 hover:scale-[1.03] hover:shadow-xl active:scale-95 touch-manipulation focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
                >
                  {t.continueLabel}
                  <ArrowRight className="w-5 h-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetRun(levelIdx);
                    startMaze();
                  }}
                  className="order-3 inline-flex items-center justify-center gap-2 bg-white hover:bg-violet-50 active:bg-violet-100 text-violet-600 border-2 border-violet-300 font-extrabold text-sm md:text-base px-5 py-3 rounded-full shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-95 touch-manipulation focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
                >
                  <RefreshCw className="w-4 h-4 md:w-5 md:h-5" aria-hidden />
                  {t.chPlayAgain}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'quiz') {
    const q = level.quiz[quizI];
    const total = level.quiz.length;
    return (
      <div className="fixed inset-0 z-30 overflow-y-auto bg-gradient-to-b from-violet-100 via-sky-50 to-amber-50">
        <div className="min-h-full flex items-center justify-center p-3 md:p-6">
          <div className="bg-white rounded-[1.75rem] shadow-2xl border border-violet-100 max-w-xl w-full px-4 py-5 md:px-7 md:py-7 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="inline-flex items-center gap-2 bg-violet-600 text-white font-display font-extrabold text-sm md:text-base px-4 py-1.5 rounded-full">
                <Shield className="w-4 h-4" aria-hidden />
                {t.spQuizTitle}
              </span>
              <span className="text-xs md:text-sm font-extrabold text-slate-500">
                {t.spQuizProgress(quizI + 1, total)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-3" aria-hidden>
              {level.quiz.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full flex-1 transition-colors',
                    i < quizI ? 'bg-emerald-400' : i === quizI ? 'bg-violet-500' : 'bg-slate-200',
                  )}
                />
              ))}
            </div>
            <h3 className="font-display font-bold text-lg md:text-2xl text-slate-800 mt-4">{tx(q.q)}</h3>
            <div className="mt-4 space-y-2.5">
              {q.options.map((o) => {
                const picked = quizPicked === o.id;
                const revealed = quizPicked != null;
                return (
                  <button
                    key={o.id}
                    type="button"
                    disabled={revealed}
                    onClick={() => pickQuiz(o.id)}
                    className={cn(
                      'w-full text-left font-bold text-sm md:text-base rounded-2xl border-2 px-4 py-3 md:py-3.5 flex items-center gap-2.5 transition-colors touch-manipulation',
                      !revealed && 'bg-white border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 active:bg-violet-50',
                      revealed && o.correct && 'bg-emerald-50 border-emerald-400 text-emerald-800',
                      revealed && picked && !o.correct && 'bg-rose-50 border-rose-300 text-rose-700',
                      revealed && !picked && !o.correct && 'bg-white border-slate-100 text-slate-400',
                    )}
                  >
                    {revealed && o.correct ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" aria-hidden />
                    ) : (
                      <span
                        aria-hidden
                        className={cn(
                          'w-5 h-5 rounded-full border-2 shrink-0',
                          revealed && picked && !o.correct ? 'border-rose-300' : 'border-slate-300',
                        )}
                      />
                    )}
                    {tx(o.label)}
                  </button>
                );
              })}
            </div>
            {quizPicked != null && (
              <div className="mt-4 bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3 animate-in fade-in duration-200">
                <p className="text-xs md:text-sm font-bold text-violet-700">
                  {level.quiz[quizI].options.find((o) => o.id === quizPicked)?.correct
                    ? t.spSafeChoice
                    : t.spThinkAgain}
                </p>
                <p className="text-xs md:text-sm font-semibold text-slate-600 mt-1">{tx(q.explain)}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (quizI + 1 >= total) setPhase('result');
                    else {
                      setQuizI((i) => i + 1);
                      setQuizPicked(null);
                    }
                  }}
                  className="mt-3 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-extrabold text-sm md:text-base px-6 py-2.5 rounded-full shadow-md flex items-center gap-2 transition-transform active:scale-95 touch-manipulation"
                >
                  {t.continueLabel}
                  <ArrowRight className="w-4 h-4" aria-hidden />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="fixed inset-0 z-30 overflow-y-auto bg-gradient-to-b from-amber-100 via-orange-50 to-sky-50">
        <div className="min-h-full flex items-center justify-center p-3 md:p-6">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-orange-100 max-w-xl w-full px-4 py-6 md:px-8 md:py-8 text-center animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-16 h-16 md:w-20 md:h-20 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center sp-pop">
              <Trophy className="w-8 h-8 md:w-10 md:h-10 text-amber-500" aria-hidden />
            </div>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-slate-800 mt-3">{t.spChampion}</h2>
            <p className="text-sm md:text-base text-slate-500 font-semibold mt-1">{t.spResultSub}</p>

            <div className="grid grid-cols-3 gap-2 mt-5">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-2 py-3">
                <p className="text-[10px] md:text-xs font-extrabold text-amber-700 uppercase tracking-wide">{t.spGameScore}</p>
                <p className="font-display font-extrabold text-lg md:text-2xl text-slate-800 mt-1 flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" aria-hidden />
                  {session.score}
                </p>
              </div>
              <div className="bg-violet-50 border border-violet-200 rounded-2xl px-2 py-3">
                <p className="text-[10px] md:text-xs font-extrabold text-violet-700 uppercase tracking-wide">{t.spQuizScore}</p>
                <p className="font-display font-extrabold text-lg md:text-2xl text-slate-800 mt-1">
                  {quizCorrect}/{level.quiz.length}
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-2 py-3">
                <p className="text-[10px] md:text-xs font-extrabold text-emerald-700 uppercase tracking-wide">{t.spSafeDecisions}</p>
                <p className="font-display font-extrabold text-lg md:text-2xl text-slate-800 mt-1">
                  {session.safeDecisions}
                </p>
              </div>
            </div>

            <div className="text-left bg-sky-50/70 border border-sky-100 rounded-2xl px-4 py-3.5 mt-4">
              <p className="font-display font-bold text-sm md:text-base text-sky-800">{t.spWhatLearned}</p>
              <ul className="mt-2 space-y-1.5">
                {SP_LEARNINGS.map((l, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs md:text-sm font-semibold text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden />
                    {tx(l)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => {
                  resetRun(levelIdx);
                  startMaze();
                }}
                className="inline-flex items-center gap-2 bg-white hover:bg-orange-50 active:bg-orange-100 text-orange-600 border-2 border-orange-200 font-bold px-5 py-3 rounded-full shadow-sm transition-transform active:scale-95 touch-manipulation"
              >
                <RefreshCw className="w-4 h-4" aria-hidden />
                {t.chPlayAgain}
              </button>
              {nextPlayable?.playable ? (
                <button
                  type="button"
                  onClick={() => {
                    setLevelIdx(levelIdx + 1);
                    resetRun(levelIdx + 1);
                    setPhase('intro');
                  }}
                  className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-bold px-5 py-3 rounded-full shadow-md transition-transform active:scale-95 touch-manipulation"
                >
                  {t.spNextLevel}
                  <ArrowRight className="w-4 h-4" aria-hidden />
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-400 font-bold px-4 py-3 rounded-full text-sm">
                  {t.spComingSoon}
                </span>
              )}
              <button
                type="button"
                onClick={onContinue}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-extrabold px-6 py-3 rounded-full shadow-lg shadow-orange-500/30 transition-transform active:scale-95 touch-manipulation"
              >
                {t.continueLabel}
                <ArrowRight className="w-5 h-5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------- maze ------------------------------- */

  const pendingOb = card ? obstacleByCh(level, card.ch) : undefined;

  return (
    <div className="fixed inset-0 z-30 overflow-hidden select-none">
      <img src={SP_BG_URL} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-emerald-950/10" />

      {TopChrome}

      {/* board */}
      <div className="absolute inset-0 flex items-center justify-center px-2 pt-[88px] md:pt-[108px] pb-[86px] md:pb-[76px]">
        <div
          className="relative max-h-full"
          style={{ width: 'min(100%, calc(60dvh * 1.3333), 760px)' }}
          onTouchStart={(e) => {
            const tch = e.touches[0];
            touchStart.current = { x: tch.clientX, y: tch.clientY };
          }}
          onTouchEnd={(e) => {
            const st = touchStart.current;
            touchStart.current = null;
            if (!st) return;
            const tch = e.changedTouches[0];
            const dx = tch.clientX - st.x;
            const dy = tch.clientY - st.y;
            if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
            handleMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
          }}
        >
          <div className="relative w-full rounded-2xl" style={{ aspectRatio: `${C}/${R}` }}>
            {/* path tiles */}
            {level.grid.map((row, r) =>
              row.split('').map((cell, c) =>
                cell === '#' ? null : (
                  <div
                    key={`t${r}-${c}`}
                    aria-hidden
                    className={cn(
                      'absolute shadow-[inset_0_0_0_1px_rgba(120,72,20,0.14)]',
                      hintCells.some((h) => h.r === r && h.c === c) && 'sp-hint-pulse',
                    )}
                    style={{
                      ...cellStyle(r, c),
                      backgroundImage: `url(${SP_TILE_URL})`,
                      backgroundSize: '100% 100%',
                    }}
                  />
                ),
              ),
            )}

            {/* start sign */}
            <div
              aria-hidden
              className="absolute z-10 -translate-y-[86%] pointer-events-none"
              style={{ left: `${(startPos.c * 100) / C}%`, top: `${(startPos.r * 100) / R}%` }}
            >
              <span className="inline-block bg-amber-700 text-white font-display font-bold text-[9px] md:text-xs px-1.5 md:px-2.5 py-0.5 rounded-md shadow-md border border-amber-900/40 -rotate-6 whitespace-nowrap">
                {t.spStart}
              </span>
            </div>

            {/* safe zone goal art + label */}
            <div
              aria-hidden
              className="absolute z-10 pointer-events-none flex flex-col items-center"
              style={{
                left: `${(goalPos.c * 100) / C}%`,
                top: `${(goalPos.r * 100) / R}%`,
                width: `${(100 / C) * 2.6}%`,
                transform: 'translate(-32%, -62%)',
              }}
            >
              <img src={SP_GOAL_URL} alt="" className="w-full sp-goal-glow select-none" draggable={false} />
              <span className="bg-emerald-500 text-white font-display font-bold text-[8px] md:text-[11px] px-1.5 md:px-2.5 py-0.5 rounded-full shadow -mt-1 whitespace-nowrap">
                {t.spSafeZone}
              </span>
            </div>

            {/* flags, spots */}
            {level.grid.map((row, r) =>
              row.split('').map((cell, c) => {
                if (cell === 'C') {
                  const taken = session.flagsTaken[`${r},${c}`];
                  return (
                    <div key={`c${r}-${c}`} aria-hidden className="absolute z-10 flex items-center justify-center pointer-events-none" style={cellStyle(r, c)}>
                      {taken ? (
                        <CheckCircle2 className="w-3/5 h-3/5 text-emerald-500 fill-white sp-pop" />
                      ) : (
                        <Flag className="w-3/5 h-3/5 text-amber-500 fill-amber-400 sp-float" />
                      )}
                    </div>
                  );
                }
                const ob = obstacleByCh(level, cell);
                if (!ob) return null;
                const done = ob.kind === 'unsafe' ? session.cleared[cell] : session.collectedSafe[cell];
                return (
                  <div key={`o${r}-${c}`} aria-hidden className="absolute z-10 flex flex-col items-center justify-center pointer-events-none" style={cellStyle(r, c)}>
                    {done ? (
                      <CheckCircle2 className="w-3/5 h-3/5 text-emerald-500 fill-white sp-pop" />
                    ) : ob.kind === 'unsafe' ? (
                      <span className="w-[72%] h-[72%] rounded-full bg-red-500 border-2 border-white shadow-md flex items-center justify-center sp-bob">
                        <AlertTriangle className="w-3/5 h-3/5 text-white" />
                      </span>
                    ) : (
                      <span className="w-[72%] h-[72%] rounded-full bg-emerald-500 border-2 border-white shadow-md flex items-center justify-center sp-bob">
                        <Heart className="w-3/5 h-3/5 text-white fill-white" />
                      </span>
                    )}
                    {!done && (
                      <span className="hidden md:block absolute top-full mt-0.5 bg-white/95 text-slate-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow whitespace-nowrap max-w-[140px] truncate">
                        {tx(ob.title)}
                      </span>
                    )}
                  </div>
                );
              }),
            )}

            {/* score pops */}
            {pops.map((p) => (
              <span
                key={p.id}
                aria-hidden
                className="absolute z-30 sp-score-pop font-display font-extrabold text-amber-500 text-sm md:text-lg drop-shadow"
                style={{ left: `${(p.pos.c * 100) / C}%`, top: `${(p.pos.r * 100) / R}%` }}
              >
                {p.text}
              </span>
            ))}

            {/* player */}
            <div
              className="absolute z-20 pointer-events-none transition-[left,top] duration-150 ease-out"
              style={{
                left: `${(session.pos.c * 100) / C}%`,
                top: `${(session.pos.r * 100) / R}%`,
                width: `${100 / C}%`,
                height: `${100 / R}%`,
              }}
            >
              <img
                src={SP_PLAYER_URL}
                alt=""
                draggable={false}
                className="absolute bottom-0 left-1/2 w-[135%] max-w-none select-none drop-shadow-md"
                style={{ transform: `translateX(-50%) scaleX(${facing})` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div className="absolute bottom-0 inset-x-0 z-20 p-2.5 md:p-4 flex items-end justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={handleHint}
            disabled={session.hintsLeft <= 0}
            aria-label={t.chHintAria(session.hintsLeft)}
            className={cn(
              'inline-flex items-center gap-1.5 font-extrabold text-sm md:text-base px-3.5 md:px-4 py-2.5 rounded-full shadow-md transition-transform active:scale-95 touch-manipulation',
              session.hintsLeft > 0
                ? 'bg-amber-400 hover:bg-amber-500 text-amber-950'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed',
            )}
          >
            <Lightbulb className="w-4 h-4 md:w-5 md:h-5" aria-hidden />
            {session.hintsLeft > 0 ? `${t.chHint} ×${session.hintsLeft}` : t.spHintNone}
          </button>
          <button
            type="button"
            onClick={() => setShowTips(true)}
            className="inline-flex items-center gap-1.5 bg-white/95 hover:bg-sky-50 text-sky-700 border border-sky-200 font-bold text-sm md:text-base px-3.5 md:px-4 py-2.5 rounded-full shadow-md transition-transform active:scale-95 touch-manipulation"
          >
            <BookOpen className="w-4 h-4 md:w-5 md:h-5" aria-hidden />
            {t.spHowSafe}
          </button>
          <span className="inline-flex items-center gap-1.5 bg-white/90 text-slate-600 font-extrabold text-xs md:text-sm px-3 py-2 rounded-full shadow-md">
            {t.spLevelLabel(level.n, SP_LEVELS.length)}
            <span className="flex items-center gap-1" aria-hidden>
              {SP_LEVELS.map((lv, i) => (
                <span
                  key={lv.id}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    i < levelIdx ? 'bg-emerald-400' : i === levelIdx ? 'bg-amber-400' : 'bg-slate-300',
                  )}
                />
              ))}
            </span>
          </span>
        </div>

        {isTouch ? (
          <div className="grid grid-cols-3 gap-1 w-32 md:w-36 shrink-0 pointer-events-auto" aria-hidden={false}>
            <span />
            <button type="button" aria-label={t.spMoveUp} onClick={() => handleMove('up')} className="bg-white/95 rounded-xl shadow-md p-2.5 flex items-center justify-center text-slate-600 active:scale-90 transition-transform touch-manipulation">
              <ArrowUp className="w-5 h-5" />
            </button>
            <span />
            <button type="button" aria-label={t.spMoveLeft} onClick={() => handleMove('left')} className="bg-white/95 rounded-xl shadow-md p-2.5 flex items-center justify-center text-slate-600 active:scale-90 transition-transform touch-manipulation">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button type="button" aria-label={t.spMoveDown} onClick={() => handleMove('down')} className="bg-white/95 rounded-xl shadow-md p-2.5 flex items-center justify-center text-slate-600 active:scale-90 transition-transform touch-manipulation">
              <ArrowDown className="w-5 h-5" />
            </button>
            <button type="button" aria-label={t.spMoveRight} onClick={() => handleMove('right')} className="bg-white/95 rounded-xl shadow-md p-2.5 flex items-center justify-center text-slate-600 active:scale-90 transition-transform touch-manipulation">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <span className="bg-white/80 text-slate-500 text-[11px] font-bold px-3 py-1.5 rounded-full shadow pointer-events-none hidden md:block">
            {t.spMoveKeys}
          </span>
        )}
      </div>

      {/* decision / safe-spot card */}
      {card && pendingOb && (
        <div className="absolute inset-0 z-40 bg-slate-900/45 flex items-center justify-center p-3 md:p-6">
          <div
            className={cn(
              'bg-white rounded-[1.75rem] shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200 max-h-[calc(100dvh-3rem)] overflow-y-auto',
              card.stage === 'wrong' && 'sp-shake',
            )}
          >
            <img src={SP_ART[pendingOb.id]} alt="" aria-hidden className="w-full aspect-[16/9] object-cover" draggable={false} />
            <div
              className={cn(
                'px-4 py-2 flex items-center gap-2 font-display font-extrabold text-white text-sm md:text-base',
                pendingOb.kind === 'unsafe' ? 'bg-red-500' : 'bg-emerald-500',
              )}
            >
              {pendingOb.kind === 'unsafe' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
              ) : (
                <Heart className="w-4 h-4 fill-current shrink-0" aria-hidden />
              )}
              {tx(pendingOb.title)}
            </div>
            <div className="px-4 py-3.5 md:px-5 md:py-4">
              {pendingOb.kind === 'safe' ? (
                <>
                  <p className="text-sm md:text-base font-semibold text-slate-700">{tx(pendingOb.prompt)}</p>
                  <p className="text-xs md:text-sm font-bold text-emerald-600 mt-2">{tx(pendingOb.lesson)}</p>
                  <button
                    type="button"
                    autoFocus
                    onClick={handleAckSafe}
                    className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold px-5 py-3 rounded-full shadow-md transition-transform active:scale-95 touch-manipulation"
                  >
                    {t.spOkThanks} (+50)
                  </button>
                </>
              ) : card.stage === 'ask' ? (
                <>
                  <p className="text-sm md:text-base font-semibold text-slate-700">{tx(pendingOb.prompt)}</p>
                  <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wide mt-3">{t.whatWillYouDo}</p>
                  <div className="mt-2 space-y-2">
                    {(pendingOb.choices ?? []).map((chc, i) => (
                      <button
                        key={chc.id}
                        type="button"
                        autoFocus={i === 0}
                        onClick={() => handleChoice(chc.id)}
                        className="w-full text-left bg-white border-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 active:bg-violet-50 font-bold text-sm md:text-base rounded-2xl px-4 py-3 transition-colors touch-manipulation"
                      >
                        {tx(chc.label)}
                      </button>
                    ))}
                  </div>
                </>
              ) : card.stage === 'correct' ? (
                <>
                  <p className="inline-flex items-center gap-1.5 text-emerald-600 font-extrabold text-sm md:text-base">
                    <CheckCircle2 className="w-5 h-5" aria-hidden />
                    {t.spSafeChoice} +100
                  </p>
                  <p className="text-sm md:text-base font-semibold text-slate-700 mt-2">
                    {tx((pendingOb.choices ?? []).find((x) => x.correct)!.feedback)}
                  </p>
                  <p className="text-xs md:text-sm font-bold text-violet-600 mt-2">{tx(pendingOb.lesson)}</p>
                  <button
                    type="button"
                    autoFocus
                    onClick={() => setCard(null)}
                    className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold px-5 py-3 rounded-full shadow-md transition-transform active:scale-95 touch-manipulation"
                  >
                    {t.continueLabel}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-amber-600 font-extrabold text-sm md:text-base">{t.spThinkAgain}</p>
                  <p className="text-sm md:text-base font-semibold text-slate-700 mt-2">
                    {tx((pendingOb.choices ?? []).find((x) => !x.correct)!.feedback)}
                  </p>
                  <button
                    type="button"
                    autoFocus
                    onClick={() => setCard(null)}
                    className="mt-4 w-full bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-amber-950 font-extrabold px-5 py-3 rounded-full shadow-md transition-transform active:scale-95 touch-manipulation"
                  >
                    {t.spBackToCheckpoint}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* how to stay safe */}
      {showTips && (
        <div className="absolute inset-0 z-40 bg-slate-900/45 flex items-center justify-center p-3 md:p-6">
          <div className="bg-white rounded-[1.75rem] shadow-2xl max-w-sm w-full px-5 py-5 md:px-6 md:py-6 animate-in zoom-in-95 duration-200 max-h-[calc(100dvh-3rem)] overflow-y-auto">
            <p className="font-display font-extrabold text-lg md:text-xl text-sky-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-500" aria-hidden />
              {t.spTipsHeading}
            </p>
            <ul className="mt-3 space-y-2">
              {SP_LEARNINGS.map((l, i) => (
                <li key={i} className="flex items-start gap-2 text-sm font-semibold text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden />
                  {tx(l)}
                </li>
              ))}
            </ul>
            <p className="text-xs md:text-sm font-bold text-violet-600 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5 mt-3">
              {t.spTalkReminder}
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => setShowTips(false)}
              className="mt-4 w-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-extrabold px-5 py-3 rounded-full shadow-md transition-transform active:scale-95 touch-manipulation"
            >
              {t.spOkThanks}
            </button>
          </div>
        </div>
      )}

      {/* gentle out-of-hearts pause */}
      {session.outOfLives && (
        <div className="absolute inset-0 z-40 bg-slate-900/45 flex items-center justify-center p-3 md:p-6">
          <div className="bg-white rounded-[1.75rem] shadow-2xl max-w-sm w-full px-5 py-6 md:px-6 md:py-7 text-center animate-in zoom-in-95 duration-200">
            <img src={SP_PLAYER_URL} alt="" aria-hidden className="w-16 mx-auto sp-float select-none" draggable={false} />
            <p className="font-display font-extrabold text-lg md:text-xl text-slate-800 mt-2">{t.spLivesOut}</p>
            <p className="text-sm font-semibold text-slate-500 mt-1">{t.spLivesOutSub}</p>
            <button
              type="button"
              autoFocus
              onClick={() => setSession(spTryAgain(sessionRef.current))}
              className="mt-4 w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-extrabold px-5 py-3 rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95 touch-manipulation"
            >
              <RefreshCw className="w-4 h-4" aria-hidden />
              {t.spTryAgain}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
