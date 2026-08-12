/**
 * "Right or Wrong?" playable mini-game (Aug 2026).
 *
 * Jury feedback: "gamification but no actual game." This overlay gives the
 * player a real, self-contained game loop: two illustrated scene cards
 * (RIGHT vs WRONG), first-try scoring, streak bonuses, confetti, gentle
 * shake on wrong picks, and a "YOU DID IT!" end screen with stars.
 *
 * Architecture:
 *  - All rules live in logic.ts (pure, no React), tested by the smoke.
 *  - Illustrated content + law facts live in data.ts (hard-coded per PRD
 *    §9.8 — never AI-generated at runtime).
 *  - Sound is optional and modular (sfx.ts, WebAudio, silent fallback).
 *  - Persistence via progressStore.extras (consent-gated, load-sanitised).
 *  - Two homes, ONE component: the standalone map overlay (uiStore
 *    rightWrongOpen) and the castle's game-first flow (GameQuestFlow),
 *    which embeds it via onComplete/onContinue/onExit — the castle's
 *    lesson gate is credited by the flow, never in here.
 *  - PRD §9.6: no streak-guilt — breaking a streak NEVER subtracts points
 *    or shows a scolding message.
 *  - PRD §9.1: Get Help Now (z-50, HelpDialog) always visible above the
 *    overlay because the HUD mounts it after this component.
 */
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { ArrowRight, Home, RefreshCw, Star, Volume2, VolumeX, X } from 'lucide-react';
import {
  newRwSession,
  pickCard,
  advanceRound,
  clearWrongFeedback,
  starsEarned,
  maxScore,
  type RwSession,
  type CardKind,
} from './logic';
import { RW_ROUNDS, RW_BG_URL } from './data';
import { ConfettiPop } from './ConfettiPop';
import { playCorrect, playWrong, playComplete } from './sfx';
import { useStrings } from '@/i18n/strings';
import { useSettings } from '@/data/settingsStore';
import { closeRightWrong } from '@/ui/uiStore';
import { progressStore } from '@/data/progressStore';
import guideBoyUrl from '@/assets/home/guide-boy.webp';

// ---------------------------------------------------------------------------
// Reducer (keeps component stateless-ish; session lives in useReducer)
// ---------------------------------------------------------------------------

type GameAction =
  | { type: 'pick'; card: CardKind }
  | { type: 'advance' }
  | { type: 'dismissWrong' }
  | { type: 'restart' };

function init(): RwSession {
  return newRwSession(RW_ROUNDS.length);
}

function reducer(s: RwSession, a: GameAction): RwSession {
  switch (a.type) {
    case 'pick':       return pickCard(s, a.card);
    case 'advance':    return advanceRound(s);
    case 'dismissWrong': return clearWrongFeedback(s);
    case 'restart':    return init();
    default:           return s;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SceneCardProps {
  title: string;
  caption: string;
  image: string;
  kind: CardKind;
  state: 'idle' | 'correct' | 'wrong' | 'disabled';
  onPick: () => void;
  confettiKey: number;
  t: ReturnType<typeof useStrings>;
}

function SceneCard({ title, caption, image, kind: _kind, state, onPick, confettiKey, t }: SceneCardProps) {
  const isCorrect  = state === 'correct';
  const isWrong    = state === 'wrong';
  const isDisabled = state === 'disabled';

  let border = 'border-white/40';
  if (isCorrect) border = 'border-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.35)]';
  if (isWrong)   border = 'border-orange-400 shadow-[0_0_0_4px_rgba(251,146,60,0.35)]';

  return (
    <div className="relative flex-1 min-w-0 max-w-sm w-full">
      <button
        type="button"
        onClick={isDisabled ? undefined : onPick}
        disabled={isDisabled}
        aria-label={title}
        className={[
          'relative w-full rounded-3xl border-4 transition-all duration-200 overflow-hidden',
          'flex flex-col bg-white shadow-xl touch-manipulation focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70',
          border,
          isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.03] hover:shadow-2xl active:scale-[0.97]',
          isWrong ? 'rw-shake' : '',
        ].join(' ')}
      >
        {/* Illustration */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-sky-50">
          <img
            src={image}
            alt={caption}
            className="w-full h-full object-cover"
            draggable={false}
            loading="eager"
          />
          {/* Overlay tint for correct / wrong */}
          {isCorrect && (
            <div className="absolute inset-0 bg-emerald-400/20 flex items-center justify-center">
              <span className="text-5xl rw-pop" aria-hidden>✓</span>
            </div>
          )}
          {isWrong && (
            <div className="absolute inset-0 bg-orange-400/20 flex items-center justify-center">
              <span className="text-4xl" aria-hidden>✕</span>
            </div>
          )}
          {/* Confetti bursts out of the card on correct first-pick */}
          <ConfettiPop active={isCorrect} key={confettiKey} />
        </div>

        {/* Text */}
        <div className="px-3 pt-2.5 pb-3 flex flex-col gap-1">
          <p className="font-display font-bold text-base md:text-lg text-slate-800 leading-tight line-clamp-2">{title}</p>
          <p className="text-xs md:text-sm text-slate-500 leading-snug line-clamp-3">{caption}</p>
        </div>
      </button>

      {/* Correct badge */}
      {isCorrect && (
        <span
          className="absolute -top-3 -right-2 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md rw-pop"
          aria-live="polite"
        >
          {t.rwGreatChoice}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StarRow({ earned, total }: { earned: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center flex-wrap" aria-label={`${earned} stars out of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <Star
          key={i}
          className={[
            'w-8 h-8 md:w-9 md:h-9 transition-all rw-star-pop',
            i < earned ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-100',
          ].join(' ')}
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main overlay
// ---------------------------------------------------------------------------

export interface RightWrongGameProps {
  /** Castle embedding: called on every completed run (idempotent upstream). */
  onComplete?: () => void;
  /** Castle embedding: primary Continue action on the end screen (→ quiz). */
  onContinue?: () => void;
  /** Overrides X/back (default: closeRightWrong — the standalone overlay). */
  onExit?: () => void;
}

export function RightWrongGame({ onComplete, onContinue, onExit }: RightWrongGameProps = {}) {
  const t = useStrings();
  const { language } = useSettings();
  const exit = onExit ?? closeRightWrong;
  const [session, dispatch] = useReducer(reducer, undefined, init);
  const [soundOn, setSoundOn] = useState(true);
  const [confettiKey, setConfettiKey] = useState(0);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist personal best when game completes
  useEffect(() => {
    if (session.phase !== 'complete') return;
    soundOn && playComplete();
    const prev = progressStore.getState().rightWrongBest;
    if (!prev || session.score > prev.score) {
      const stars = starsEarned(session);
      progressStore.update({ rightWrongBest: { score: session.score, stars } });
    }
    // Castle embedding: report the completed run (the lesson-gate credit
    // lives in GameQuestFlow; markVideoWatched is idempotent for replays).
    onComplete?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.phase]);

  // Auto-advance after correct feedback
  useEffect(() => {
    if (session.outcome !== 'correct' && session.outcome !== 'correct-after-wrong') return;
    if (session.phase === 'complete') return;
    advanceTimer.current && clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => dispatch({ type: 'advance' }), 1400);
    return () => { advanceTimer.current && clearTimeout(advanceTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.outcome, session.roundIndex]);

  // Auto-dismiss wrong-card shake after a moment (card stays selectable)
  useEffect(() => {
    if (session.outcome !== 'wrong') return;
    wrongTimer.current && clearTimeout(wrongTimer.current);
    wrongTimer.current = setTimeout(() => dispatch({ type: 'dismissWrong' }), 1100);
    return () => { wrongTimer.current && clearTimeout(wrongTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.wrongAttempts]);

  const handlePick = useCallback((kind: CardKind) => {
    if (kind === 'right') {
      soundOn && playCorrect();
      setConfettiKey((k) => k + 1);
    } else {
      soundOn && playWrong();
    }
    dispatch({ type: 'pick', card: kind });
  }, [soundOn]);

  const roundIdx   = session.order[session.roundIndex];
  const round      = RW_ROUNDS[roundIdx];
  const rightFirst = session.rightFirst[session.roundIndex];

  // Which card state to show
  function cardState(kind: CardKind): SceneCardProps['state'] {
    if (session.outcome === 'correct' || session.outcome === 'correct-after-wrong') {
      return kind === 'right' ? 'correct' : 'disabled';
    }
    if (session.outcome === 'wrong' && kind === 'wrong') return 'wrong';
    if (session.triedWrongThisRound && kind === 'wrong') return 'disabled';
    return 'idle';
  }

  const best = progressStore.getState().rightWrongBest;
  const stars = starsEarned(session);
  const total = RW_ROUNDS.length;

  // ---------------------------------------------------------------------------
  // COMPLETE screen
  // ---------------------------------------------------------------------------
  if (session.phase === 'complete') {
    return (
      <GameShell soundOn={soundOn} onToggleSound={() => setSoundOn((s) => !s)} onExit={exit} t={t}>
        <div className="flex flex-col items-center gap-5 px-4 py-6 max-w-md mx-auto w-full animate-in fade-in duration-500">
          {/* Mascot */}
          <img
            src={guideBoyUrl}
            alt=""
            className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-lg rw-float"
            aria-hidden
          />

          <div className="text-center">
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white drop-shadow-md tracking-wide">
              {t.rwYouDidIt}
            </h2>
            <p className="mt-1 text-white/80 text-sm md:text-base font-semibold">
              {t.rwRightsProtected(stars, total)}
            </p>
          </div>

          {/* Stars */}
          <StarRow earned={stars} total={total} />

          {/* Score card */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 flex flex-col items-center gap-1 w-full max-w-xs shadow-inner">
            <span className="text-white/70 text-xs uppercase tracking-widest font-bold">{t.rwFinalScore}</span>
            <span className="font-display font-extrabold text-5xl text-white">{session.score}</span>
            {best && best.score > session.score && (
              <span className="text-white/60 text-sm">{t.rwBestScore(best.score)}</span>
            )}
          </div>

          <p className="text-white font-semibold text-sm text-center">{t.rwKnowRights}</p>

          {/* Actions — castle embedding swaps the primary slot to Continue
              (→ quiz); standalone keeps Play Again primary + Back home. */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button
              type="button"
              onClick={() => dispatch({ type: 'restart' })}
              className={[
                'flex-1 flex items-center justify-center gap-2 active:scale-95 text-base rounded-2xl py-3.5 transition-all touch-manipulation',
                onContinue
                  ? 'bg-white/20 hover:bg-white/30 text-white font-bold shadow'
                  : 'bg-amber-400 hover:bg-amber-300 text-amber-900 font-extrabold shadow-lg',
              ].join(' ')}
            >
              <RefreshCw className="w-5 h-5" />
              {t.rwPlayAgain}
            </button>
            {onContinue ? (
              <button
                type="button"
                onClick={onContinue}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-900 font-extrabold text-base rounded-2xl py-3.5 shadow-lg transition-all touch-manipulation"
              >
                {t.continueLabel}
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={exit}
                className="flex-1 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 active:scale-95 text-white font-bold text-base rounded-2xl py-3.5 shadow transition-all touch-manipulation"
              >
                <Home className="w-5 h-5" />
                {t.rwBackHome}
              </button>
            )}
          </div>
        </div>
      </GameShell>
    );
  }

  // ---------------------------------------------------------------------------
  // PLAYING screen
  // ---------------------------------------------------------------------------
  const lawFact = round ? (language === 'hi' ? round.law.hi : round.law.en) : '';

  const cardA = rightFirst ? 'right' : 'wrong';
  const cardB = rightFirst ? 'wrong' : 'right';

  function cardProps(kind: CardKind) {
    if (!round) return null;
    const data = round[kind];
    const label = language === 'hi' ? data.title.hi : data.title.en;
    const cap   = language === 'hi' ? data.caption.hi : data.caption.en;
    return { title: label, caption: cap, image: data.image };
  }

  const propsA = cardProps(cardA);
  const propsB = cardProps(cardB);

  return (
    <GameShell soundOn={soundOn} onToggleSound={() => setSoundOn((s) => !s)} onExit={exit} t={t}>
      {/* HUD pill */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0">
        {/* Round counter */}
        <span className="bg-white/20 backdrop-blur-sm text-white font-bold text-sm rounded-full px-3.5 py-1.5">
          {t.rwRound(session.roundIndex + 1, total)}
        </span>
        {/* Score */}
        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white font-bold text-sm rounded-full px-3.5 py-1.5">
          <Star className="w-4 h-4 text-amber-300 fill-amber-300" aria-hidden />
          <span>{t.rwScoreLabel} {session.score}</span>
          {session.streak >= 2 && (
            <span className="ml-0.5 text-orange-300 font-black text-xs">🔥{session.streak}</span>
          )}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 shrink-0 -mt-1" aria-label={t.rwRound(session.roundIndex + 1, total)}>
        {RW_ROUNDS.map((_, i) => (
          <span
            key={i}
            className={[
              'w-2 h-2 rounded-full transition-all',
              i < session.roundIndex  ? 'bg-emerald-400 scale-110' :
              i === session.roundIndex ? 'bg-white scale-125' : 'bg-white/30',
            ].join(' ')}
          />
        ))}
      </div>

      {/* Heading */}
      <div className="text-center px-4 shrink-0">
        <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white drop-shadow-md">
          {t.rwHeading}
        </h2>
        <p className="text-white/75 text-xs md:text-sm font-medium mt-0.5">{t.rwSubheading}</p>
      </div>

      {/* Cards area */}
      <div className="flex flex-col sm:flex-row gap-3 px-3 flex-1 min-h-0 items-stretch justify-center">
        {propsA && (
          <SceneCard
            {...propsA}
            kind={cardA}
            state={cardState(cardA)}
            onPick={() => handlePick(cardA)}
            confettiKey={confettiKey}
            t={t}
          />
        )}

        {/* OR badge */}
        <div className="flex sm:flex-col items-center justify-center shrink-0 my-1 sm:my-0">
          <span className="w-10 h-10 rounded-full bg-amber-400 text-amber-900 font-extrabold text-sm flex items-center justify-center shadow-md border-4 border-white/60 select-none">
            {t.rwOr.toUpperCase()}
          </span>
        </div>

        {propsB && (
          <SceneCard
            {...propsB}
            kind={cardB}
            state={cardState(cardB)}
            onPick={() => handlePick(cardB)}
            confettiKey={confettiKey}
            t={t}
          />
        )}
      </div>

      {/* Feedback / Law chip */}
      <div className="shrink-0 px-3 pb-1 min-h-[4rem] flex items-center justify-center">
        {(session.outcome === 'correct' || session.outcome === 'correct-after-wrong') && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-emerald-500/90 backdrop-blur-sm text-white rounded-2xl px-4 py-3 max-w-sm w-full shadow-lg text-center">
            <p className="font-bold text-sm">
              {session.outcome === 'correct' ? t.rwGreatChoice : t.rwThatsTheOne}
              {session.lastBonus > 0 && (
                <span className="ml-2 text-amber-200">{t.rwStreakBonus(session.lastBonus)}</span>
              )}
            </p>
            <p className="text-xs mt-1 text-white/85">
              <span className="font-semibold">{t.rwLawChipLabel}: </span>{lawFact}
            </p>
          </div>
        )}
        {session.outcome === 'wrong' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-orange-500/90 backdrop-blur-sm text-white rounded-2xl px-4 py-3 max-w-sm w-full shadow-lg text-center">
            <p className="font-bold text-sm">{t.rwTryAgain}</p>
          </div>
        )}
        {!session.outcome && (
          /* Mascot hint — rotates between think/correct */
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 rounded-2xl px-3.5 py-2 max-w-sm w-full">
            <img src={guideBoyUrl} alt="" className="w-8 h-8 object-contain shrink-0" aria-hidden />
            <p className="text-xs font-medium">
              {session.firstTryCorrect > 0 ? t.rwMascotCorrect : t.rwMascotThink}
            </p>
          </div>
        )}
      </div>
    </GameShell>
  );
}

// ---------------------------------------------------------------------------
// Shell wrapper — purple-sky illustrated background + top chrome
// ---------------------------------------------------------------------------
interface ShellProps {
  children: React.ReactNode;
  soundOn: boolean;
  onToggleSound: () => void;
  /** X button — closeRightWrong standalone, back-to-landing in the castle. */
  onExit: () => void;
  t: ReturnType<typeof useStrings>;
}

function GameShell({ children, soundOn, onToggleSound, onExit, t }: ShellProps) {
  return (
    <div
      className="absolute inset-0 z-30 flex flex-col pointer-events-auto bg-cover bg-center"
      style={{ backgroundImage: `url(${RW_BG_URL})` }}
    >
      {/* Soft overlay so cards pop */}
      <div className="absolute inset-0 bg-violet-900/45" aria-hidden />

      {/* Top chrome */}
      <div className="relative z-10 flex items-center justify-between px-3 pt-3 md:pt-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-display font-extrabold text-white text-lg md:text-xl drop-shadow-sm tracking-wide">
            {t.rwTitle}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundOn ? t.rwSoundOff : t.rwSoundOn}
            className="bg-white/20 hover:bg-white/30 active:scale-95 text-white rounded-full p-2 transition touch-manipulation"
          >
            {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={onExit}
            aria-label={t.rwExitLabel}
            className="bg-white/20 hover:bg-white/30 active:scale-95 text-white rounded-full p-2 transition touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0 gap-3 py-2 md:py-3 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
