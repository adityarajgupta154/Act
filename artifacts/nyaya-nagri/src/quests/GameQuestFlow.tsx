/**
 * Game-first zone flow (Aug 2026) — the Right to Childhood castle.
 *
 * Castle tap → the "Right or Wrong?" MINI-GAME (replaces the old learning
 * video — user order, Aug 2026) → the SAME final quiz level (questions,
 * options, order and UI untouched — QuestPlayer runs it) → story-unlock
 * celebration for the gated Story Adventure level.
 *
 * Ordering is enforced HERE: a fresh entry (gate not yet earned) drops
 * STRAIGHT into the game, and Continue stays disabled until one full game
 * run completes. All progression writes stay with the existing
 * single-authority paths: finalizeLevel() inside QuestPlayer (quiz + zone
 * completion) and progressStore.markVideoWatched() — the lesson-gate flag.
 * The flag (and its videosWatched home) keeps its historical name for
 * save-compat: it used to mean "watched the video", it now means "finished
 * the castle game" — same key, same unlock semantics, so old saves keep
 * their progress. The Story Adventure unlock is DERIVED from those two
 * flags by the ONE lock rule in storyData — nothing here writes unlock
 * state directly.
 *
 * Game content is hard-coded (PRD §9.8 — never AI-generated at runtime).
 * The global Get Help Now pill (HUD, z-50) stays visible above this
 * overlay on every stage, PRD §9.2.
 */
import React, { useEffect, useState } from 'react';
import { QuestPlayer } from './QuestPlayer';
import { levelKey } from './engine';
import type { Quest } from './schema';
import type { ZoneGameFlow } from './gameFlows';
import { RightToChildhoodGame } from '@/games/childhood/RightToChildhoodGame';
import landingBgUrl from '@/assets/games/childhood/ch-landing-bg.webp';
import landingBannerUrl from '@/assets/games/childhood/ch-complete-banner.webp';
import { getStoryLevel } from '@/story/storyData';
import { progressStore } from '@/data/progressStore';
import { exitZone, exitZoneToStoryMap, enterLevel, clearLevel } from '@/ui/uiStore';
import { useStrings } from '@/i18n/strings';
import { useSettings } from '@/data/settingsStore';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Heart,
  Map as MapIcon,
  Play,
  Shield,
} from 'lucide-react';

// Mockup title treatment: words cycle violet → orange → green (fits the
// 3-word EN "Right to Childhood" and HI "बचपन का अधिकार" alike).
const TITLE_WORD_COLORS = [
  'text-violet-600',
  'text-orange-500',
  'text-emerald-600',
];

export function GameQuestFlow({
  flow,
  quest,
  zoneName,
  zoneTheme,
}: {
  flow: ZoneGameFlow;
  quest: Quest;
  zoneName: string;
  zoneTheme: string;
}) {
  const t = useStrings();
  const { language } = useSettings();
  const [progress, setProgress] = useState(() => progressStore.getState());
  useEffect(() => progressStore.subscribe(setProgress), []);

  // The quiz level is found by KIND (validated to be last), never by a
  // hard-coded index — the 12-15/16-18 bands have more questions but the
  // same shape, so every age band runs its own exact existing questions.
  const quizIndex = quest.levels.findIndex((l) => l.kind === 'quiz');
  const quizLevel = quizIndex >= 0 ? quest.levels[quizIndex] : null;

  // The lesson gate: historically "video watched", now EARNED by finishing
  // one full "Right or Wrong?" run (key name kept for save-compat).
  const gameDone = !!progress.videosWatched[flow.videoId];
  const quizPassed =
    !!progress.completedZones[quest.zoneId] ||
    (quizLevel != null &&
      !!progress.levelProgress[levelKey(quest.zoneId, quizLevel.levelId)]);
  const storyLevel = getStoryLevel(flow.storyLevelId);
  const unlockedNow = gameDone && quizPassed;

  // practice is captured at quiz START (like LevelSelect): a replay of an
  // already-passed quiz never overwrites recorded scores (engine rule).
  const [quizRun, setQuizRun] = useState<{ practice: boolean } | null>(null);
  const [justUnlocked, setJustUnlocked] = useState(false);
  // GAME FIRST: a fresh entry (gate not yet earned) mounts the game
  // immediately; re-entries land on the landing card (replay optional).
  const [playingGame, setPlayingGame] = useState(
    () => !progressStore.getState().videosWatched[flow.videoId],
  );

  const startQuiz = () => {
    // Read the gate from the STORE (not the subscribed snapshot): Continue
    // on the game's end screen fires right after the completion credit.
    const gateDone = !!progressStore.getState().videosWatched[flow.videoId];
    if (!gateDone || quizIndex < 0 || !quizLevel) return;
    // Signal the AI companion BEFORE mounting the player, so the level
    // greeting appears as the level opens (same as the LevelSelect path).
    enterLevel(quest.zoneId, quizIndex, quizLevel.kind);
    setQuizRun({ practice: quizPassed });
  };

  /* ----------------------------- quiz stage ----------------------------- */
  if (quizRun && quizLevel) {
    // Same centred stage as ZoneInterior's QuestPlayer mount: the quiz
    // board / completion cards centre themselves inside it on desktop.
    return (
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6">
        <QuestPlayer
          key={`${quest.questId}:${quizIndex}:${quizRun.practice}`}
          quest={quest}
          levelIndex={quizIndex}
          practice={quizRun.practice}
          onExit={() => {
            clearLevel();
            const now = progressStore.getState();
            const passedNow =
              !!now.completedZones[quest.zoneId] ||
              !!now.levelProgress[levelKey(quest.zoneId, quizLevel.levelId)];
            // The celebration card fires only on a FRESH pass (not replays),
            // mirroring the map cinematic's fresh-completion-only rule.
            const freshUnlock =
              !quizRun.practice && passedNow && !!now.videosWatched[flow.videoId];
            setQuizRun(null);
            if (freshUnlock) setJustUnlocked(true);
          }}
        />
      </div>
    );
  }

  /* ----------------------------- game stage ----------------------------- */
  if (playingGame) {
    return (
      <RightToChildhoodGame
        onComplete={() => progressStore.markVideoWatched(flow.videoId)}
        onContinue={() => {
          setPlayingGame(false);
          startQuiz();
        }}
        onExit={() => setPlayingGame(false)}
      />
    );
  }

  /* ------------------------ story-unlocked stage ------------------------ */
  if (justUnlocked && storyLevel) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-2xl w-full mx-auto text-center border border-slate-100 animate-in zoom-in-95 duration-300 pointer-events-auto">
        <div className="mx-auto bg-violet-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
          <BookOpen className="w-8 h-8 text-violet-500" />
        </div>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-800 mb-3">
          {t.storyUnlockedHeading}
        </h2>
        <p className="text-lg md:text-xl text-slate-600 mb-10 font-medium">
          {t.storyRewardUnlocked(storyLevel.title[language])}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={exitZone}
            className="bg-sky-50 hover:bg-sky-100 active:bg-sky-200 text-sky-700 px-8 py-4 rounded-full font-bold text-lg transition-transform active:scale-95 shadow-sm border border-sky-200 touch-manipulation"
          >
            {t.backToMap}
          </button>
          <button
            onClick={exitZoneToStoryMap}
            className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-transform active:scale-95 shadow-md flex items-center gap-2 touch-manipulation"
          >
            {t.openStoryAdventure}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      </div>
    );
  }

  /* ---------------------------- landing stage --------------------------- */
  // Re-entry surface (the fresh path skips it — see playingGame's initial
  // value): replay the game, continue to the quiz, or hop to the story.
  // Storybook layout from the user's mockup (Aug 2026): full-bleed park
  // scene, cream card with shield badge, tricolor title, sunrise banner.
  // The bottom-right of the screen is deliberately left to the live Nyaya
  // AI launcher (the mockup's waving robot IS that widget — don't double it).
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-auto">
      <img
        src={landingBgUrl}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 flex items-center justify-center p-3 pt-10 md:p-6 md:pt-12">
        <div className="relative max-w-2xl w-full">
          {/* floating sparkles around the card (decorative) */}
          <span aria-hidden className="absolute -top-6 left-8 text-amber-400 text-xl select-none animate-pulse">✦</span>
          <span aria-hidden className="absolute -top-8 right-12 text-violet-400 text-sm select-none animate-pulse">✦</span>
          <span aria-hidden className="absolute top-20 -left-5 text-pink-400 text-xs select-none animate-pulse hidden md:block">✦</span>
          <span aria-hidden className="absolute top-28 -right-5 text-emerald-400 text-sm select-none animate-pulse hidden md:block">✦</span>

          {/* shield badge riding the card's top edge */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 w-14 h-14 rounded-full bg-white shadow-lg border border-orange-100 flex items-center justify-center">
            <span className="relative flex items-center justify-center">
              <Shield className="w-8 h-8 text-violet-600 fill-violet-500" aria-hidden />
              <Heart className="w-3.5 h-3.5 text-amber-300 fill-amber-300 absolute" aria-hidden />
            </span>
          </div>

          <div className="bg-[#FFFDF8] rounded-[2rem] shadow-2xl border border-orange-100 animate-in zoom-in-95 duration-300 max-h-[calc(100dvh-5.5rem)] overflow-y-auto px-4 pt-9 pb-5 md:px-8 md:pt-10 md:pb-7 flex flex-col gap-3.5 md:gap-4">
            <div className="text-center">
              <h2 className="font-display font-extrabold text-3xl md:text-5xl leading-tight">
                {t.chTitle.split(' ').map((word, i) => (
                  <span key={i} className={TITLE_WORD_COLORS[i % TITLE_WORD_COLORS.length]}>
                    {i > 0 ? ' ' : ''}
                    {word}
                  </span>
                ))}
              </h2>
              <p className="text-sm md:text-lg text-slate-700 font-bold mt-1.5">{t.chTagline}</p>
              <p className="text-xs md:text-sm text-violet-500 font-bold mt-0.5">
                ({t.chAwarenessTag})
              </p>
            </div>

            {/* Game panel — the castle's step 1. Tapping it (re)opens the game. */}
            <button
              type="button"
              onClick={() => setPlayingGame(true)}
              aria-label={gameDone ? t.chPlayAgain : t.chPlayCta}
              className="relative w-full rounded-2xl overflow-hidden shadow-md border border-orange-100 aspect-[16/6] group touch-manipulation shrink-0"
            >
              <img
                src={landingBannerUrl}
                alt=""
                aria-hidden
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover object-[50%_30%] group-hover:scale-105 transition-transform duration-300"
              />
              {gameDone ? (
                <>
                  <span className="absolute left-1/2 top-[56%] -translate-x-1/2 -rotate-2 bg-gradient-to-b from-violet-500 to-violet-700 text-white font-display font-extrabold text-lg md:text-2xl px-5 py-1.5 md:px-8 md:py-2 rounded-xl shadow-lg border-2 border-violet-300/70 whitespace-nowrap">
                    {t.chRibbonDone}
                  </span>
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1.5 bg-amber-400/95 text-amber-900 text-xs md:text-sm font-extrabold px-3 py-1.5 rounded-full shadow group-active:scale-95 transition-transform">
                    <Play className="w-3.5 h-3.5 fill-current" aria-hidden />
                    {t.chPlayAgain}
                  </span>
                </>
              ) : (
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-2 bg-amber-400 text-amber-900 font-extrabold px-5 py-2.5 rounded-full shadow-md group-active:scale-95 transition-transform">
                  <Play className="w-4 h-4 fill-current" aria-hidden />
                  {t.chPlayCta}
                </span>
              )}
            </button>

            <div className="flex flex-col items-center gap-3">
              {gameDone ? (
                <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  {t.gameCompletedTag}
                </span>
              ) : (
                <p className="text-sm md:text-base font-semibold text-slate-500">
                  {t.gamePlayFirst}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={exitZone}
                  className="inline-flex items-center gap-2 bg-white hover:bg-sky-50 active:bg-sky-100 text-sky-600 px-6 py-3.5 rounded-full font-bold transition-transform active:scale-95 shadow-sm border-2 border-sky-200 touch-manipulation"
                >
                  <MapIcon className="w-5 h-5" aria-hidden />
                  {t.backToMap}
                </button>
                <button
                  onClick={startQuiz}
                  disabled={!gameDone || quizIndex < 0}
                  className={cn(
                    'px-8 py-3.5 rounded-full font-bold text-lg flex items-center gap-2 touch-manipulation transition-transform',
                    gameDone && quizIndex >= 0
                      ? 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-lg shadow-orange-500/30 active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed',
                  )}
                >
                  {t.continueLabel}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Old-save / replay path: everything already done — offer the
                  story directly (the fresh-pass celebration card handles the
                  first time; this covers re-entries). */}
              {unlockedNow && storyLevel && !justUnlocked && (
                <button
                  onClick={exitZoneToStoryMap}
                  className="flex items-center gap-2 text-violet-600 hover:text-violet-700 font-bold text-sm md:text-base touch-manipulation"
                >
                  <BookOpen className="w-4 h-4" />
                  {t.openStoryAdventure}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
