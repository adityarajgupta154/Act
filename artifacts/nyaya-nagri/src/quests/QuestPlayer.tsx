import React, { useState, useRef, useEffect } from 'react';
import {
  QuestSession, startLevel, answerQuizQuestion, acknowledgeQuizFeedback,
  chooseSceneOption, acknowledgeSceneFeedback, continueScene, finalizeLevel, getCurrentScene,
  getActiveRecap, answerRecapQuestion, acknowledgeRecapFeedback,
  getSessionLevel, completeActivity,
  type LevelResult,
} from './engine';
import { getPriorPreAnswers } from './levels';
import type { Quest, ChoiceOutcome } from './schema';
import { MemoryLevel } from './activities/MemoryLevel';
import { HiddenObjectLevel } from './activities/HiddenObjectLevel';
import { SortingLevel } from './activities/SortingLevel';
import { ScenarioLevel } from './activities/ScenarioLevel';
import { AuthoritiesLevel } from './activities/AuthoritiesLevel';
import { exitZone, openCertificate, openHelp } from '@/ui/uiStore';
import { isSafetyReminderZone } from '@/ui/safetyReminder';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, ArrowRight, Star, Lightbulb, ShieldCheck, RotateCcw } from 'lucide-react';
import { ZONES } from '@/world/zones';
import { getStrings } from '@/i18n/strings';
import { useSettings } from '@/data/settingsStore';
import { speak, stopSpeaking } from '@/a11y/narrator';
import { PersonaInterview } from '@/persona/PersonaInterview';

function FeedbackColor(outcome: ChoiceOutcome) {
  switch (outcome) {
    case 'correct': return "bg-green-50 text-green-700 border-green-200";
    case 'incorrect': return "bg-orange-50 text-orange-700 border-orange-200";
    case 'neutral': return "bg-sky-50 text-sky-700 border-sky-200";
  }
}

/**
 * Shared game-board chrome for every decision/quiz surface. The old quiz
 * panels used the same plain white card as settings screens, which made the
 * learning loop feel disconnected from the city. This is CSS-only game art:
 * no stock/watermarked artwork is needed, and the legal copy remains exactly
 * the same.
 */
function GameQuizShell({
  ribbonLabel,
  title,
  progress,
  icon,
  leaveLabel,
  onLeave,
  prompt,
  answers,
}: {
  ribbonLabel: string;
  title: string;
  progress?: string;
  icon?: React.ReactNode;
  leaveLabel: string;
  onLeave: () => void;
  prompt: React.ReactNode;
  answers: React.ReactNode;
}) {
  return (
    <div className="relative pointer-events-auto flex h-[82dvh] max-h-[min(100%,780px)] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border-4 border-white/80 bg-gradient-to-b from-sky-500 via-cyan-400 to-sky-500 p-2 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 md:p-4">
      {/* Lightweight CSS clouds keep the board lively without another asset. */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-8 top-16 h-20 w-44 rounded-full bg-white/20 blur-sm" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 bottom-20 h-24 w-56 rounded-full bg-white/20 blur-sm" />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 rounded-full bg-white/50 shadow-[80px_80px_0_2px_rgba(255,255,255,0.35),-120px_120px_0_1px_rgba(255,255,255,0.3)]" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col p-2 md:p-3">
        <div className="mb-5 flex shrink-0 items-center justify-between gap-3 px-1 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-white/70 bg-white/90 text-sky-700 shadow-md">
              {icon ?? <Star className="h-6 w-6 fill-current" />}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold drop-shadow-sm md:text-xl">{title}</p>
              {progress && <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/85">{progress}</p>}
            </div>
          </div>
          <button
            onClick={onLeave}
            className="min-h-11 shrink-0 rounded-full border-2 border-white/70 bg-white/85 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:text-sm"
          >
            {leaveLabel}
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-1 pb-1">
          <div className="relative z-10 mb-5 pt-5 md:pt-7">
            <div className="absolute left-5 right-5 top-0 z-20 flex items-center justify-center md:left-16 md:right-16">
              <div className="relative w-full -rotate-1 rounded-xl border-4 border-lime-950/70 bg-lime-500 px-5 py-2 text-center font-display text-xl font-bold uppercase tracking-[0.12em] text-white shadow-[0_5px_0_rgba(54,83,20,0.5)] md:text-3xl">
                <span className="drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]">{ribbonLabel}</span>
              </div>
            </div>
            <div className="rounded-[1.35rem] border-4 border-amber-950/75 bg-amber-950 p-2 shadow-xl">
              <div className="rounded-[1rem] border-2 border-amber-200/80 bg-amber-100 px-4 pb-5 pt-11 text-slate-800 shadow-inner md:px-7 md:pb-7 md:pt-12">
                {prompt}
              </div>
            </div>
          </div>

          <div className="relative z-10 pb-2">{answers}</div>
        </div>
      </div>
    </div>
  );
}

function GameAnswerButton({
  index,
  onClick,
  children,
}: {
  index: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-start gap-3 rounded-2xl border-4 border-amber-950/75 bg-yellow-300 px-3 py-3 text-left text-base font-bold leading-relaxed text-amber-950 shadow-[0_5px_0_rgba(120,53,15,0.55)] transition-all hover:-translate-y-0.5 hover:bg-yellow-200 hover:shadow-[0_7px_0_rgba(120,53,15,0.55)] active:translate-y-1 active:shadow-[0_2px_0_rgba(120,53,15,0.55)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-600 touch-manipulation md:items-center md:px-4 md:py-4 md:text-lg"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-orange-950/60 bg-orange-500 font-display text-lg text-white shadow-sm md:h-10 md:w-10">
        {String.fromCharCode(65 + index)}
      </span>
      <span className="pt-0.5">{children}</span>
    </button>
  );
}

export function QuestPlayer({
  quest: questProp,
  levelIndex,
  practice = false,
  onExit,
}: {
  quest: Quest;
  /** Task 15: the level of quest.levels this player session runs. */
  levelIndex: number;
  /** Practice/Replay of a completed level — recorded scores are untouched. */
  practice?: boolean;
  /** Back to the Level-Select screen (leave mid-level or after a level). */
  onExit: () => void;
}) {
  const [session, setSession] = useState<QuestSession>(() =>
    startLevel(questProp, levelIndex, {
      practice,
      priorPreAnswers: getPriorPreAnswers(questProp.questId),
    }),
  );
  const finalizationRef = useRef<boolean>(false);
  const [finalResult, setFinalResult] = useState<LevelResult | null>(null);
  const settings = useSettings();

  // Task 10: a running quest stays in ONE language — everything reads from
  // session.quest (fixed at start), so switching the app language mid-quest
  // never mixes languages inside a story. The new language applies from the
  // next quest start. The player chrome follows the quest's language too, so
  // the whole quest surface is coherent.
  const quest = session.quest;
  const questLang = quest.language ?? 'en';
  const t = getStrings(questLang);

  useEffect(() => {
    if (session.phase === 'complete' && !finalizationRef.current) {
      finalizationRef.current = true;
      const result = finalizeLevel(session);
      setFinalResult(result);
    }
  }, [session]);

  // Task 10: audio narration (PRD §6.4) — read the currently visible block
  // (narration + choices / question + options / recap / feedback) aloud in
  // the quest's language whenever it changes and narration is enabled.
  useEffect(() => {
    if (!settings.narration) {
      stopSpeaking();
      return;
    }
    const parts: string[] = [];
    if (session.phase === 'pre-quiz' || session.phase === 'post-quiz') {
      const q = quest.quizQuestions[session.quizIndex];
      if (session.lastQuizFeedback) {
        parts.push(
          session.lastQuizFeedback.correct ? t.correct : t.notQuite,
          session.lastQuizFeedback.explanation,
        );
        if (!session.lastQuizFeedback.correct && q) {
          parts.push(t.correctAnswerWas, q.options[q.correctIndex]);
        }
      } else if (q) {
        parts.push(q.question, ...q.options);
      }
    } else if (session.phase === 'scenes') {
      const scene = getCurrentScene(session);
      if (session.pendingFeedback) {
        parts.push(session.pendingFeedback.feedback);
      } else if (scene) {
        parts.push(scene.narration, ...scene.choices.map((c) => c.text));
      }
    } else if (session.phase === 'recap') {
      const item = getActiveRecap(session);
      if (session.recapFeedback) {
        parts.push(
          session.recapFeedback.correct ? t.recapGotIt : t.recapTryAgainIntro,
          session.recapFeedback.explanation,
        );
        if (!session.recapFeedback.correct && item) {
          parts.push(t.correctAnswerWas, item.options[item.correctIndex]);
        }
      } else if (item) {
        parts.push(item.summary, item.question, ...item.options);
      }
    } else if (session.phase === 'activity') {
      // Task 18: narrate the activity's own intro/prompt once on entry.
      // In-activity feedback is narrated by the activity components via
      // narrate() below (their internal state is not visible here).
      const level = getSessionLevel(session);
      if (level?.memory) parts.push(level.memory.intro);
      else if (level?.hidden) parts.push(level.hidden.intro);
      else if (level?.sorting) parts.push(level.sorting.intro);
      else if (level?.scenario) parts.push(level.scenario.prompt);
      else if (level?.authorities) parts.push(level.authorities.intro);
    } else if (session.phase === 'complete' && finalResult) {
      if (finalResult.kind === 'quiz') {
        parts.push(finalResult.recorded ? t.questComplete : t.practiceComplete);
        if (finalResult.postScore !== null) {
          parts.push(t.youGotXofY(finalResult.postScore, finalResult.total));
        }
      } else {
        parts.push(finalResult.recorded ? t.levelComplete : t.practiceComplete);
      }
    }
    if (parts.length > 0) speak(parts, questLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, settings.narration, finalResult]);

  // Stop any narration when the quest player unmounts (leave / back to map).
  useEffect(() => () => stopSpeaking(), []);

  // Task 18: narration hook handed to activity components for their inner
  // feedback moments — same settings gate and quest language as above.
  const narrate = (parts: string[]) => {
    if (settings.narration && parts.length > 0) speak(parts, questLang);
  };

  // Leaving mid-level (or after a non-final level) goes back one layer —
  // to the zone's Level-Select screen, not all the way to the map.
  const handleLeave = () => {
    stopSpeaking();
    onExit();
  };

  const handleLeaveZone = () => {
    stopSpeaking();
    exitZone();
  };

  // Task 12 support-services reminder, reused by both quiz-level end
  // screens (recorded and practice) for zones 1/4/5 (PRD §9.1).
  const safetyReminder = isSafetyReminderZone(quest.zoneId) && (
    <div className="bg-sky-50 border border-sky-100 rounded-2xl p-5 mb-8 text-left max-w-md mx-auto">
      <p className="font-bold text-sky-700 mb-1 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 shrink-0" />
        {t.safetyReminderTitle}
      </p>
      <p className="text-slate-600 font-medium mb-3">{t.safetyReminderBody}</p>
      <button
        onClick={openHelp}
        className="bg-white border border-sky-200 text-sky-700 hover:bg-sky-100 active:bg-sky-200 px-5 py-2.5 rounded-full font-bold text-sm transition-colors active:scale-95 touch-manipulation"
      >
        {t.seeHelpOptions}
      </button>
    </div>
  );

  if (session.phase === 'complete') {
    if (!finalResult) return null; // waiting for effect
    const isQuizLevel = finalResult.kind === 'quiz';

    // FINAL level first completed: the zone-complete celebration (star,
    // badge, next-zone unlock) — exactly the Task 1-14 behavior.
    if (isQuizLevel && finalResult.recorded) {
      const nextZone = ZONES.find(z => z.order === ZONES.find(x => x.id === quest.zoneId)!.order + 1);
      const nextZoneName = nextZone ? (t.zones[nextZone.id]?.name ?? nextZone.name) : null;

      return (
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-2xl w-full text-center border border-slate-100 animate-in zoom-in-95 duration-300 pointer-events-auto">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-800 mb-2">{t.questComplete}</h2>
          <p className="text-xl text-slate-600 mb-8 font-medium">{quest.title}</p>

          <div className="relative mx-auto w-32 h-32 mb-8">
            <div className="absolute inset-0 bg-orange-400 rounded-full animate-ping opacity-20"></div>
            <div className="relative w-full h-full bg-gradient-to-tr from-orange-400 to-amber-300 rounded-full flex items-center justify-center shadow-lg border-4 border-white z-10 transform transition-transform hover:scale-110">
              <Star className="w-16 h-16 text-white fill-white" />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-orange-500 mb-4">
            {t.youGotXofY(finalResult.postScore ?? 0, finalResult.total)}
          </h3>

          {/* Task 16: XP/Coin rewards + any newly earned (private) titles */}
          {finalResult.xpAwarded > 0 && (
            <p className="text-lg font-bold text-violet-600 mb-2">
              {t.rewardsLine(finalResult.xpAwarded, finalResult.coinsAwarded)}
            </p>
          )}
          {finalResult.newTitles.map((id) => (
            <p key={id} className="text-base font-bold text-amber-600 mb-2">
              {t.titleUnlocked(t.titleNames[id] ?? id)}
            </p>
          ))}

          {/* Task 27: the certificate was issued in the SAME store update
              that marked the zone complete. A quiet professional note —
              deliberately not another confetti moment (brief: subtle). */}
          <div className="bg-[#FBF8EF] border border-[#E7CE8F] rounded-xl px-5 py-4 mb-6 text-left flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-800">{t.certificateUnlockedToast}</p>
              <p className="text-sm text-slate-600 font-medium">
                {t.certificateUnlockedBody(t.zones[quest.zoneId]?.name ?? quest.zoneId)}
              </p>
            </div>
            <button
              onClick={() => openCertificate(quest.zoneId)}
              className="shrink-0 bg-[#14306E] hover:bg-[#1d3f8c] text-white px-4 py-2.5 rounded-full font-bold text-sm transition-colors touch-manipulation"
            >
              {t.viewCertificate}
            </button>
          </div>

          {nextZoneName && (
            <p className="text-lg text-slate-600 font-medium mb-8 bg-sky-50 py-3 px-6 rounded-xl inline-block border border-sky-100">
              {t.unlockedNext(nextZoneName)}
            </p>
          )}

          {safetyReminder}

          <button
            onClick={handleLeaveZone}
            className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-transform active:scale-95 shadow-md flex items-center gap-2 mx-auto touch-manipulation"
          >
            {t.backToMap}
          </button>
        </div>
      );
    }

    // Non-final level completed, or a Practice/Replay of any level.
    const nextLevel = quest.levels[levelIndex + 1];
    const showNextUnlock = finalResult.recorded && nextLevel;
    const title = finalResult.recorded ? t.levelComplete : t.practiceComplete;

    return (
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-2xl w-full text-center border border-slate-100 animate-in zoom-in-95 duration-300 pointer-events-auto">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-800 mb-2">{title}</h2>
        <p className="text-xl text-slate-600 mb-8 font-medium">
          {t.levelN(levelIndex + 1)}: {t.levelKindNames[finalResult.kind]}
        </p>

        <div className="mx-auto w-24 h-24 mb-8 bg-gradient-to-tr from-green-400 to-emerald-300 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
          {finalResult.recorded ? (
            <CheckCircle2 className="w-12 h-12 text-white" />
          ) : (
            <RotateCcw className="w-12 h-12 text-white" />
          )}
        </div>

        {isQuizLevel && finalResult.postScore !== null && (
          <h3 className="text-2xl font-bold text-orange-500 mb-4">
            {t.youGotXofY(finalResult.postScore, finalResult.total)}
          </h3>
        )}

        {/* Task 18: X-of-Y only where it is meaningful (sorting/scenario).
            Memory and hidden-object are completion-based by gentle design. */}
        {finalResult.activityScore &&
          (finalResult.kind === 'sorting' || finalResult.kind === 'scenario') && (
            <h3 className="text-2xl font-bold text-orange-500 mb-4">
              {t.youGotXofY(finalResult.activityScore.score, finalResult.activityScore.total)}
            </h3>
          )}

        {/* Task 16: rewards on first-time completions only (never practice) */}
        {finalResult.xpAwarded > 0 && (
          <p className="text-lg font-bold text-violet-600 mb-4">
            {t.rewardsLine(finalResult.xpAwarded, finalResult.coinsAwarded)}
          </p>
        )}
        {finalResult.newTitles.map((id) => (
          <p key={id} className="text-base font-bold text-amber-600 mb-4">
            {t.titleUnlocked(t.titleNames[id] ?? id)}
          </p>
        ))}

        {!finalResult.recorded && (
          <p className="text-base text-slate-500 font-medium mb-6">{t.practiceNote}</p>
        )}

        {showNextUnlock && (
          <p className="text-lg text-slate-600 font-medium mb-8 bg-sky-50 py-3 px-6 rounded-xl inline-block border border-sky-100">
            {t.nextLevelUnlocked(`${t.levelN(levelIndex + 2)}: ${t.levelKindNames[nextLevel.kind]}`)}
          </p>
        )}

        {isQuizLevel && safetyReminder}

        <button
          onClick={handleLeave}
          className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-transform active:scale-95 shadow-md flex items-center gap-2 mx-auto touch-manipulation"
        >
          {t.backToLevels}
        </button>
      </div>
    );
  }

  // Adaptive "let's revisit" recap (Task 9): shown only after a very low
  // silent pre-quiz baseline. Framed as one more friendly look at big ideas —
  // never as "you got these wrong", and no scores are shown.
  if (session.phase === 'recap') {
    const item = getActiveRecap(session);
    const feedback = session.recapFeedback;
    if (!item) return null;

    return (
      <GameQuizShell
        ribbonLabel={t.ribbonRecap}
        title={t.recapTitle}
        progress={t.recapXofY(session.recapIndex + 1, session.recapQueue.length)}
        icon={<Lightbulb className="h-6 w-6 fill-current text-amber-500" />}
        leaveLabel={t.leaveQuest}
        onLeave={handleLeave}
        prompt={(
          <>
            <div className="mb-4 rounded-2xl border-2 border-amber-300 bg-amber-200/70 p-4 md:p-5">
              <p className="text-base font-bold leading-relaxed text-amber-950 md:text-lg">
                {item.summary}
              </p>
            </div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
              {t.ribbonQuestion}
            </p>
            <h3 className="text-xl font-bold leading-relaxed text-slate-800 md:text-2xl">
              {item.question}
            </h3>
          </>
        )}
        answers={(
          !feedback ? (
            <div className="flex flex-col gap-4">
              {item.options.map((opt, idx) => (
                <GameAnswerButton key={idx} index={idx} onClick={() => setSession(answerRecapQuestion(session, idx))}>
                  {opt}
                </GameAnswerButton>
              ))}
            </div>
          ) : (
            <div className={cn("rounded-2xl border-4 p-5 shadow-xl animate-in zoom-in-95 duration-200 md:p-6",
                feedback.correct ? "border-emerald-800/60 bg-emerald-100" : "border-sky-800/50 bg-sky-100")}>
              <div className="flex items-start gap-4">
                {feedback.correct ? (
                  <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-700" />
                ) : (
                  <Lightbulb className="h-8 w-8 shrink-0 text-sky-700" />
                )}
                <div>
                  <h4 className="mb-2 font-display text-xl font-bold text-slate-800">
                    {feedback.correct ? t.recapGotIt : t.recapTryAgainIntro}
                  </h4>
                  <p className="text-base font-semibold leading-relaxed text-slate-700 md:text-lg">
                    {feedback.explanation}
                  </p>
                  {!feedback.correct && (
                    <div className="mt-4 rounded-xl border-2 border-emerald-700/40 bg-emerald-100 p-4">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-emerald-800">{t.correctAnswerWas}</p>
                      <p className="text-base font-bold leading-relaxed text-slate-800 md:text-lg">
                        {item.options[item.correctIndex]}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSession(acknowledgeRecapFeedback(session))}
                className="mt-5 flex items-center gap-2 rounded-full bg-sky-600 px-6 py-3 font-bold text-white shadow-md transition-transform hover:bg-sky-700 active:scale-95 touch-manipulation"
              >
                {t.continueLabel} <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )
        )}
      />
    );
  }

  // Pre-quiz and Post-quiz UI
  if (session.phase === 'pre-quiz' || session.phase === 'post-quiz') {
    const qIndex = session.quizIndex;
    const question = quest.quizQuestions[qIndex];
    const isPost = session.phase === 'post-quiz';
    const feedback = session.lastQuizFeedback;

    return (
      <GameQuizShell
        ribbonLabel={isPost ? t.ribbonReview : t.ribbonQuestion}
        title={isPost ? t.postQuizTitle : t.preQuizTitle}
        progress={t.questionXofY(qIndex + 1, quest.quizQuestions.length)}
        icon={
          isPost
            ? <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            : <Star className="h-6 w-6 fill-current text-amber-500" />
        }
        leaveLabel={t.leaveQuest}
        onLeave={handleLeave}
        prompt={(
          <>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
              {t.questionXofY(qIndex + 1, quest.quizQuestions.length)}
            </p>
            <h3 className="text-xl font-bold leading-relaxed text-slate-800 md:text-2xl">
              {question.question}
            </h3>
          </>
        )}
        answers={(
          !feedback ? (
            <div className="flex flex-col gap-4">
              {question.options.map((opt, idx) => (
                <GameAnswerButton key={idx} index={idx} onClick={() => setSession(answerQuizQuestion(session, idx))}>
                  {opt}
                </GameAnswerButton>
              ))}
            </div>
          ) : (
            <div className={cn("rounded-2xl border-4 p-5 shadow-xl animate-in zoom-in-95 duration-200 md:p-6",
                feedback.correct ? "border-emerald-800/60 bg-emerald-100" : "border-orange-800/50 bg-orange-100")}>
              <div className="flex items-start gap-4">
                {feedback.correct ? (
                  <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-700" />
                ) : (
                  <XCircle className="h-8 w-8 shrink-0 text-orange-700" />
                )}
                <div>
                  <h4 className="mb-2 font-display text-xl font-bold text-slate-800">
                    {feedback.correct ? t.correct : t.notQuite}
                  </h4>
                  <p className="text-base font-semibold leading-relaxed text-slate-700 md:text-lg">
                    {feedback.explanation}
                  </p>
                  {!feedback.correct && (
                    <div className="mt-4 rounded-xl border-2 border-emerald-700/40 bg-emerald-100 p-4">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-emerald-800">{t.correctAnswerWas}</p>
                      <p className="text-base font-bold leading-relaxed text-slate-800 md:text-lg">
                        {question.options[question.correctIndex]}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSession(acknowledgeQuizFeedback(session))}
                className={cn("mt-5 flex items-center gap-2 rounded-full px-6 py-3 font-bold text-white shadow-md transition-transform active:scale-95 touch-manipulation",
                  feedback.correct ? "bg-emerald-600 hover:bg-emerald-700" : "bg-orange-600 hover:bg-orange-700"
                )}
              >
                {t.continueLabel} <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )
        )}
      />
    );
  }

  // Task 18: activity levels (memory / hidden / sorting / scenario) — one
  // self-contained interactive screen; completion routes through the same
  // completeActivity -> phase 'complete' -> finalizeLevel single write path.
  if (session.phase === 'activity') {
    const level = getSessionLevel(session);
    if (!level) return null;
    const finish = (score: number) => setSession(completeActivity(session, score));

    return (
      <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl max-w-3xl w-full border border-slate-100 animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-6 shrink-0 border-b border-slate-100 pb-4">
          <h2 className="font-display font-bold text-2xl text-slate-800">
            {t.levelKindNames[level.kind]}
          </h2>
          <button onClick={handleLeave} className="text-slate-400 hover:text-slate-600 font-medium px-4 py-2 bg-slate-100 rounded-full transition-colors text-sm">
            {t.leaveQuest}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {level.memory && (
            <MemoryLevel content={level.memory} t={t} narrate={narrate} onComplete={finish} />
          )}
          {level.hidden && (
            <HiddenObjectLevel content={level.hidden} t={t} narrate={narrate} onComplete={finish} />
          )}
          {level.sorting && (
            <SortingLevel content={level.sorting} t={t} narrate={narrate} onComplete={finish} />
          )}
          {level.scenario && (
            <ScenarioLevel content={level.scenario} t={t} narrate={narrate} onComplete={finish} />
          )}
          {level.authorities && (
            <AuthoritiesLevel content={level.authorities} t={t} narrate={narrate} onComplete={finish} />
          )}
        </div>
      </div>
    );
  }

  // Scenes phase UI
  if (session.phase === 'scenes') {
    const scene = getCurrentScene(session);
    const feedback = session.pendingFeedback;

    if (!scene) return null;

    return (
      <GameQuizShell
        ribbonLabel={t.whatWillYouDo}
        title={quest.title}
        progress={scene.stageLabel ?? undefined}
        icon={<Lightbulb className="h-6 w-6 fill-current text-amber-500" />}
        leaveLabel={t.leaveQuest}
        onLeave={handleLeave}
        prompt={(
          <>
            {scene.stageLabel && (
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
                {scene.stageLabel}
              </p>
            )}
            <p className="text-xl font-bold leading-relaxed text-slate-800 md:text-2xl">
              {scene.narration}
            </p>
          </>
        )}
        answers={(
          <>
            {/* Task 17: optional role-play interview remains outside scoring
                and progression, but shares the same quiz-board shell. */}
            {scene.persona && (
              <PersonaInterview
                key={scene.sceneId}
                persona={scene.persona}
                ageBand={quest.ageBand}
                language={questLang}
              />
            )}

            {scene.choices.length === 0 ? (
              <div className="flex justify-end">
                <button
                  onClick={() => setSession(continueScene(session))}
                  className="flex items-center gap-2 rounded-full bg-orange-600 px-7 py-3.5 text-lg font-bold text-white shadow-md transition-transform hover:bg-orange-700 active:scale-95 touch-manipulation"
                >
                  {t.continueLabel} <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            ) : !feedback ? (
              <div className="flex flex-col gap-4">
                {scene.choices.map((choice, idx) => (
                  <GameAnswerButton key={idx} index={idx} onClick={() => setSession(chooseSceneOption(session, idx))}>
                    {choice.text}
                  </GameAnswerButton>
                ))}
              </div>
            ) : (
              <div className={cn("rounded-2xl border-4 p-5 shadow-xl animate-in zoom-in-95 duration-200 md:p-6", FeedbackColor(feedback.outcome))}>
                <p className="mb-6 text-base font-bold leading-relaxed md:text-xl">
                  {feedback.feedback}
                </p>
                <button
                  onClick={() => setSession(acknowledgeSceneFeedback(session))}
                  className="flex items-center gap-2 rounded-full bg-white/70 px-6 py-3 font-bold text-current shadow-sm transition-transform hover:bg-white active:scale-95 touch-manipulation"
                >
                  {t.continueLabel} <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
      />
    );
  }

  return null;
}
