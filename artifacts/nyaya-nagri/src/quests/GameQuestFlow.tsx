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
import { CH_BG_URL } from '@/games/childhood/data';
import { getStoryLevel } from '@/story/storyData';
import { progressStore } from '@/data/progressStore';
import { exitZone, exitZoneToStoryMap, enterLevel, clearLevel } from '@/ui/uiStore';
import { useStrings } from '@/i18n/strings';
import { useSettings } from '@/data/settingsStore';
import { cn } from '@/lib/utils';
import { ArrowRight, BookOpen, CheckCircle2, Play } from 'lucide-react';

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
    return (
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
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-2xl w-full text-center border border-slate-100 animate-in zoom-in-95 duration-300 pointer-events-auto">
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
    );
  }

  /* ---------------------------- landing stage --------------------------- */
  // Re-entry surface (the fresh path skips it — see playingGame's initial
  // value): replay the game, continue to the quiz, or hop to the story.
  return (
    <div className="bg-white p-5 md:p-8 rounded-3xl shadow-xl max-w-2xl w-full border border-slate-100 animate-in zoom-in-95 duration-300 pointer-events-auto flex flex-col gap-4 md:gap-5 max-h-full overflow-y-auto">
      <div className="text-center">
        <h2 className="font-display font-bold text-2xl md:text-4xl text-slate-800">
          {zoneName}
        </h2>
        <p className="text-sm md:text-lg text-slate-500 font-medium mt-1">{zoneTheme}</p>
      </div>

      {/* Game panel — the castle's step 1. Tapping it (re)opens the game. */}
      <button
        type="button"
        onClick={() => setPlayingGame(true)}
        aria-label={t.chPlayCta}
        className="relative w-full rounded-2xl overflow-hidden shadow-inner bg-slate-900 aspect-[16/7] group touch-manipulation"
      >
        <img
          src={CH_BG_URL}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-violet-900/40" aria-hidden />
        <div className="relative z-10 h-full flex flex-col items-center justify-center gap-1.5 px-4">
          <span className="font-display font-extrabold text-white text-2xl md:text-3xl drop-shadow-md">
            {t.chTitle}
          </span>
          <span className="text-white/85 text-xs md:text-sm font-semibold">{t.chSubtitle}</span>
          <span className="mt-1.5 inline-flex items-center gap-2 bg-amber-400 text-amber-900 font-extrabold px-5 py-2.5 rounded-full shadow-md group-active:scale-95 transition-transform">
            <Play className="w-4 h-4 fill-current" aria-hidden />
            {gameDone ? t.chPlayAgain : t.chPlayCta}
          </span>
        </div>
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
            className="bg-sky-50 hover:bg-sky-100 active:bg-sky-200 text-sky-700 px-6 py-3.5 rounded-full font-bold transition-transform active:scale-95 shadow-sm border border-sky-200 touch-manipulation"
          >
            {t.backToMap}
          </button>
          <button
            onClick={startQuiz}
            disabled={!gameDone || quizIndex < 0}
            className={cn(
              'px-8 py-3.5 rounded-full font-bold text-lg flex items-center gap-2 touch-manipulation transition-transform',
              gameDone && quizIndex >= 0
                ? 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-md active:scale-95'
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
  );
}
