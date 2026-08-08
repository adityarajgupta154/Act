import React, { useState, useRef, useEffect } from 'react';
import {
  QuestSession, startLevel, answerQuizQuestion, acknowledgeQuizFeedback,
  chooseSceneOption, acknowledgeSceneFeedback, finalizeLevel, getCurrentScene,
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
import { exitZone, openHelp } from '@/ui/uiStore';
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
      <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl max-w-3xl w-full border border-slate-100 animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto flex flex-col h-[80vh] md:h-auto">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="font-display font-bold text-2xl text-slate-800 flex items-center gap-3">
            <Lightbulb className="w-7 h-7 text-amber-500" />
            {t.recapTitle}
          </h2>
          <span className="text-sm font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wide shrink-0">
            {t.recapXofY(session.recapIndex + 1, session.recapQueue.length)}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          <div className="bg-amber-50 rounded-2xl p-6 md:p-8 mb-6 border border-amber-100">
            <p className="text-lg md:text-xl font-medium text-slate-800 leading-relaxed">
              {item.summary}
            </p>
          </div>

          <h3 className="text-xl md:text-2xl font-medium text-slate-700 leading-relaxed mb-4">
            {item.question}
          </h3>

          {!feedback ? (
            <div className="flex flex-col gap-3">
              {item.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setSession(answerRecapQuestion(session, idx))}
                  className="text-left w-full p-4 md:p-5 rounded-2xl border-2 border-slate-100 hover:border-amber-300 hover:bg-amber-50 active:bg-amber-100 transition-all text-lg font-medium text-slate-700 shadow-sm touch-manipulation"
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className={cn("p-6 rounded-2xl border-2 animate-in zoom-in-95 duration-200",
                feedback.correct ? "bg-green-50 border-green-200" : "bg-sky-50 border-sky-200")}>
              <div className="flex items-start gap-4">
                {feedback.correct ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0 mt-1" />
                ) : (
                  <Lightbulb className="w-8 h-8 text-sky-500 shrink-0 mt-1" />
                )}
                <div>
                  <h4 className={cn("font-bold text-xl mb-2", feedback.correct ? "text-green-700" : "text-sky-700")}>
                    {feedback.correct ? t.recapGotIt : t.recapTryAgainIntro}
                  </h4>
                  <p className="text-lg text-slate-700 leading-relaxed font-medium">
                    {feedback.explanation}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSession(acknowledgeRecapFeedback(session))}
                className={cn("mt-6 px-6 py-3 rounded-full font-bold text-white shadow-sm flex items-center gap-2 transition-transform active:scale-95 touch-manipulation",
                  feedback.correct ? "bg-green-600 hover:bg-green-700" : "bg-sky-500 hover:bg-sky-600"
                )}
              >
                {t.continueLabel} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Pre-quiz and Post-quiz UI
  if (session.phase === 'pre-quiz' || session.phase === 'post-quiz') {
    const qIndex = session.quizIndex;
    const question = quest.quizQuestions[qIndex];
    const isPost = session.phase === 'post-quiz';
    const feedback = session.lastQuizFeedback;

    return (
      <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl max-w-3xl w-full border border-slate-100 animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto flex flex-col h-[80vh] md:h-auto">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="font-display font-bold text-2xl text-slate-800">
            {isPost ? t.postQuizTitle : t.preQuizTitle}
          </h2>
          <button onClick={handleLeave} className="text-slate-400 hover:text-slate-600 font-medium px-4 py-2 bg-slate-100 rounded-full transition-colors text-sm">
            {t.leaveQuest}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 mb-6 flex flex-col justify-center">
          <div className="mb-8">
            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-bold mb-4 uppercase tracking-wide">
              {t.questionXofY(qIndex + 1, quest.quizQuestions.length)}
            </span>
            <h3 className="text-xl md:text-2xl font-medium text-slate-700 leading-relaxed">
              {question.question}
            </h3>
          </div>

          {!feedback ? (
            <div className="flex flex-col gap-3">
              {question.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setSession(answerQuizQuestion(session, idx))}
                  className="text-left w-full p-4 md:p-5 rounded-2xl border-2 border-slate-100 hover:border-sky-300 hover:bg-sky-50 active:bg-sky-100 transition-all text-lg font-medium text-slate-700 shadow-sm touch-manipulation"
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className={cn("p-6 rounded-2xl border-2 animate-in zoom-in-95 duration-200",
                feedback.correct ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200")}>
              <div className="flex items-start gap-4">
                {feedback.correct ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0 mt-1" />
                ) : (
                  <XCircle className="w-8 h-8 text-orange-500 shrink-0 mt-1" />
                )}
                <div>
                  <h4 className={cn("font-bold text-xl mb-2", feedback.correct ? "text-green-700" : "text-orange-700")}>
                    {feedback.correct ? t.correct : t.notQuite}
                  </h4>
                  <p className="text-lg text-slate-700 leading-relaxed font-medium">
                    {feedback.explanation}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSession(acknowledgeQuizFeedback(session))}
                className={cn("mt-6 px-6 py-3 rounded-full font-bold text-white shadow-sm flex items-center gap-2 transition-transform active:scale-95 touch-manipulation",
                  feedback.correct ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600"
                )}
              >
                {t.continueLabel} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
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
      <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl max-w-3xl w-full border border-slate-100 animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto flex flex-col h-[80vh] md:h-auto">
        <div className="flex justify-between items-center mb-6 shrink-0 border-b border-slate-100 pb-4">
          <h2 className="font-display font-bold text-2xl text-slate-800">
            {quest.title}
          </h2>
          <button onClick={handleLeave} className="text-slate-400 hover:text-slate-600 font-medium px-4 py-2 bg-slate-100 rounded-full transition-colors text-sm">
            {t.leaveQuest}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          <div className="bg-sky-50 rounded-2xl p-6 md:p-8 mb-8 border border-sky-100">
            {scene.stageLabel && (
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold mb-4 uppercase tracking-wide">
                {scene.stageLabel}
              </span>
            )}
            <p className="text-xl md:text-2xl font-medium text-slate-800 leading-relaxed">
              {scene.narration}
            </p>
          </div>

          {/* Task 17: optional role-play interview — a side conversation
              that never affects choices, scoring, or progression. Keyed by
              scene so each persona appearance starts fresh (and the
              disclaimer is shown anew every time). */}
          {scene.persona && (
            <PersonaInterview
              key={scene.sceneId}
              persona={scene.persona}
              ageBand={quest.ageBand}
              language={questLang}
            />
          )}

          {!feedback ? (
            <div className="flex flex-col gap-3 mt-auto">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">{t.whatWillYouDo}</h3>
              {scene.choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => setSession(chooseSceneOption(session, idx))}
                  className="text-left w-full p-4 md:p-5 rounded-2xl border-2 border-slate-100 hover:border-orange-300 hover:bg-orange-50 active:bg-orange-100 transition-all text-lg font-medium text-slate-700 shadow-sm touch-manipulation"
                >
                  {choice.text}
                </button>
              ))}
            </div>
          ) : (
            <div className={cn("p-6 rounded-2xl border-2 mt-auto animate-in zoom-in-95 duration-200", FeedbackColor(feedback.outcome))}>
              <p className="text-lg md:text-xl font-medium leading-relaxed mb-6">
                {feedback.feedback}
              </p>
              <button
                onClick={() => setSession(acknowledgeSceneFeedback(session))}
                className="bg-white/50 hover:bg-white/80 text-current px-6 py-3 rounded-full font-bold shadow-sm border border-current/20 flex items-center gap-2 transition-transform active:scale-95 touch-manipulation"
              >
                {t.continueLabel} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
