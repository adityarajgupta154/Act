import React, { useState, useRef, useEffect } from 'react';
import { 
  QuestSession, startQuest, answerQuizQuestion, acknowledgeQuizFeedback,
  chooseSceneOption, acknowledgeSceneFeedback, finalizeQuest, getCurrentScene
} from './engine';
import type { Quest, ChoiceOutcome } from './schema';
import { exitZone } from '@/ui/uiStore';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, ArrowRight, ShieldAlert, Award, Star } from 'lucide-react';
import { ZONES } from '@/world/zones';

function FeedbackColor(outcome: ChoiceOutcome) {
  switch (outcome) {
    case 'correct': return "bg-green-50 text-green-700 border-green-200";
    case 'incorrect': return "bg-orange-50 text-orange-700 border-orange-200";
    case 'neutral': return "bg-sky-50 text-sky-700 border-sky-200";
  }
}

export function QuestPlayer({ quest }: { quest: Quest }) {
  const [session, setSession] = useState<QuestSession>(() => startQuest(quest));
  const finalizationRef = useRef<boolean>(false);
  const [finalResult, setFinalResult] = useState<{ postScore: number, total: number, badgeId: string } | null>(null);

  useEffect(() => {
    if (session.phase === 'complete' && !finalizationRef.current) {
      finalizationRef.current = true;
      const result = finalizeQuest(session);
      setFinalResult(result);
    }
  }, [session]);

  const handleLeave = () => {
    exitZone();
  };

  if (session.phase === 'complete') {
    if (!finalResult) return null; // waiting for effect
    const nextZone = ZONES.find(z => z.order === ZONES.find(x => x.id === quest.zoneId)!.order + 1);

    return (
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-2xl w-full text-center border border-slate-100 animate-in zoom-in-95 duration-300 pointer-events-auto">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-800 mb-2">Quest Complete!</h2>
        <p className="text-xl text-slate-600 mb-8 font-medium">{quest.title}</p>
        
        <div className="relative mx-auto w-32 h-32 mb-8">
          <div className="absolute inset-0 bg-orange-400 rounded-full animate-ping opacity-20"></div>
          <div className="relative w-full h-full bg-gradient-to-tr from-orange-400 to-amber-300 rounded-full flex items-center justify-center shadow-lg border-4 border-white z-10 transform transition-transform hover:scale-110">
            <Star className="w-16 h-16 text-white fill-white" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-orange-500 mb-4">
          You got {finalResult.postScore} out of {finalResult.total}!
        </h3>
        
        {nextZone && (
          <p className="text-lg text-slate-600 font-medium mb-8 bg-sky-50 py-3 px-6 rounded-xl inline-block border border-sky-100">
            You unlocked the next area: <strong>{nextZone.name}</strong>
          </p>
        )}
        
        <button
          onClick={handleLeave}
          className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-transform active:scale-95 shadow-md flex items-center gap-2 mx-auto touch-manipulation"
        >
          Back to Map
        </button>
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
            {isPost ? "Let's review what we learned!" : "Quick! Before we start, what do you think?"}
          </h2>
          <button onClick={handleLeave} className="text-slate-400 hover:text-slate-600 font-medium px-4 py-2 bg-slate-100 rounded-full transition-colors text-sm">
            Leave quest
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto min-h-0 mb-6 flex flex-col justify-center">
          <div className="mb-8">
            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-bold mb-4 uppercase tracking-wide">
              Question {qIndex + 1} of {quest.quizQuestions.length}
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
                    {feedback.correct ? "Correct!" : "Not quite!"}
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
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </div>
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
            Leave quest
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          <div className="bg-sky-50 rounded-2xl p-6 md:p-8 mb-8 border border-sky-100">
            <p className="text-xl md:text-2xl font-medium text-slate-800 leading-relaxed">
              {scene.narration}
            </p>
          </div>

          {!feedback ? (
            <div className="flex flex-col gap-3 mt-auto">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">What will you do?</h3>
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
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
