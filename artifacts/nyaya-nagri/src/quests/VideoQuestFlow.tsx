/**
 * Video-first zone flow (Aug 2026) — the Right to Childhood castle.
 *
 * Castle tap → the zone's learning VIDEO → the SAME final quiz level
 * (questions, options, order and UI untouched — QuestPlayer runs it) →
 * story-unlock celebration for the video-gated Story Adventure level.
 *
 * Ordering is enforced HERE (Continue stays disabled until enough REAL
 * playback accrues — the credit tracker ignores seeks, so dragging to the
 * end earns nothing; a previously-watched video keeps Continue open on
 * re-entry with replay optional), while ALL progression writes stay with the existing
 * single-authority paths: finalizeLevel() inside QuestPlayer (quiz + zone
 * completion) and progressStore.markVideoWatched() (video flag). The
 * Story Adventure unlock is DERIVED from those two flags by the ONE lock
 * rule in storyData — nothing here writes unlock state directly.
 *
 * The video is fixed, user-supplied content served verbatim from
 * public/video/ (PRD §9.8 — no AI-generated story content at runtime).
 * The global Get Help Now pill (HUD, z-50) stays visible above this
 * overlay on every stage, PRD §9.2.
 */
import React, { useEffect, useRef, useState } from 'react';
import { QuestPlayer } from './QuestPlayer';
import { levelKey } from './engine';
import type { Quest } from './schema';
import { createWatchTracker, zoneVideoUrl, type ZoneVideoFlow } from './videoFlows';
import { getStoryLevel } from '@/story/storyData';
import { progressStore } from '@/data/progressStore';
import { exitZone, exitZoneToStoryMap, enterLevel, clearLevel } from '@/ui/uiStore';
import { useStrings } from '@/i18n/strings';
import { useSettings } from '@/data/settingsStore';
import { cn } from '@/lib/utils';
import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';

export function VideoQuestFlow({
  flow,
  quest,
  zoneName,
  zoneTheme,
}: {
  flow: ZoneVideoFlow;
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

  const watched = !!progress.videosWatched[flow.videoId];
  const quizPassed =
    !!progress.completedZones[quest.zoneId] ||
    (quizLevel != null &&
      !!progress.levelProgress[levelKey(quest.zoneId, quizLevel.levelId)]);
  const storyLevel = getStoryLevel(flow.storyLevelId);
  const unlockedNow = watched && quizPassed;

  // practice is captured at quiz START (like LevelSelect): a replay of an
  // already-passed quiz never overwrites recorded scores (engine rule).
  const [quizRun, setQuizRun] = useState<{ practice: boolean } | null>(null);
  const [justUnlocked, setJustUnlocked] = useState(false);

  // Seek-proof watch credit: the flag is EARNED by real playback only
  // (videoFlows.createWatchTracker — pure, smoke-tested). Ref, not state:
  // timeupdate fires ~4x/s and must not re-render the flow.
  const trackerRef = useRef(createWatchTracker());
  const creditTime = (v: HTMLVideoElement) => {
    if (watched) return;
    if (trackerRef.current.onTime(v.currentTime, v.duration)) {
      progressStore.markVideoWatched(flow.videoId);
    }
  };

  const startQuiz = () => {
    if (!watched || quizIndex < 0 || !quizLevel) return;
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

  /* ----------------------------- video stage ---------------------------- */
  return (
    <div className="bg-white p-5 md:p-8 rounded-3xl shadow-xl max-w-3xl w-full border border-slate-100 animate-in zoom-in-95 duration-300 pointer-events-auto flex flex-col gap-4 md:gap-5 max-h-full overflow-y-auto">
      <div className="text-center">
        <h2 className="font-display font-bold text-2xl md:text-4xl text-slate-800">
          {zoneName}
        </h2>
        <p className="text-sm md:text-lg text-slate-500 font-medium mt-1">{zoneTheme}</p>
      </div>

      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
        {/* Native controls stay, but the watched flag is EARNED: every
            timeupdate feeds the credit tracker, seeks re-baseline without
            credit, and onEnded is just a final credit pass — dragging the
            seek bar to the end unlocks nothing. */}
        <video
          src={zoneVideoUrl(flow)}
          controls
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full"
          onTimeUpdate={(e) => creditTime(e.currentTarget)}
          onSeeking={(e) => trackerRef.current.onSeek(e.currentTarget.currentTime)}
          onRateChange={(e) => {
            // 1x lock: Chrome's native controls expose a playback-speed
            // menu, and the tracker credits MEDIA time — 2x would earn the
            // lesson in half the wall time (review finding). The lesson is
            // meant to be seen at 1x.
            if (e.currentTarget.playbackRate !== 1) e.currentTarget.playbackRate = 1;
          }}
          onEnded={(e) => creditTime(e.currentTarget)}
          aria-label={zoneName}
        />
      </div>

      <div className="flex flex-col items-center gap-3">
        {watched ? (
          <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
            <CheckCircle2 className="w-4 h-4" />
            {t.videoWatchedTag}
          </span>
        ) : (
          <p className="text-sm md:text-base font-semibold text-slate-500">
            {t.videoWatchFirst}
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
            disabled={!watched || quizIndex < 0}
            className={cn(
              'px-8 py-3.5 rounded-full font-bold text-lg flex items-center gap-2 touch-manipulation transition-transform',
              watched && quizIndex >= 0
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
