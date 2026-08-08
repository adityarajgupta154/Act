/**
 * Nyaya Nagri — Level-Select screen (Task 15)
 *
 * Shown when entering a zone: a simple node/path map of the zone's levels,
 * one layer below the Task 1 zone map and speaking the same visual
 * language — orange = playable, green + star = completed, slate + lock =
 * locked. Levels unlock sequentially; completed levels offer
 * Practice/Replay (which never touches recorded scores).
 */
import React from 'react';
import type { Quest, LevelKind } from './schema';
import { getLevelStatuses, type LevelStatus } from './levels';
import { useStrings } from '@/i18n/strings';
import { exitZone } from '@/ui/uiStore';
import { cn } from '@/lib/utils';
import {
  Lock, Star, Play, RotateCcw, Map as MapIcon,
  BookOpen, Split, Award, Layers, Search, Inbox, Zap,
  type LucideIcon,
} from 'lucide-react';

/** Task 18: a small icon per level TYPE, next to the kind name. */
const KIND_ICONS: Record<LevelKind, LucideIcon> = {
  story: BookOpen,
  decision: Split,
  quiz: Award,
  memory: Layers,
  hidden: Search,
  sorting: Inbox,
  scenario: Zap,
};

const NODE_STYLES: Record<LevelStatus, string> = {
  completed: 'bg-gradient-to-tr from-green-400 to-emerald-300 border-white text-white',
  unlocked: 'bg-gradient-to-tr from-orange-400 to-amber-300 border-white text-white',
  locked: 'bg-slate-200 border-slate-100 text-slate-400',
};

function NodeIcon({ status }: { status: LevelStatus }) {
  if (status === 'completed') return <Star className="w-7 h-7 fill-current" />;
  if (status === 'unlocked') return <Play className="w-7 h-7 fill-current" />;
  return <Lock className="w-6 h-6" />;
}

export function LevelSelect({
  quest,
  zoneName,
  zoneTheme,
  onStart,
}: {
  quest: Quest;
  zoneName: string;
  zoneTheme: string;
  /** practice=true replays a completed level without touching scores. */
  onStart: (levelIndex: number, practice: boolean) => void;
}) {
  const t = useStrings();
  const statuses = getLevelStatuses(quest);
  const anyCompleted = statuses.includes('completed');

  return (
    <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl max-w-2xl w-full border border-slate-100 animate-in zoom-in-95 duration-300 pointer-events-auto max-h-[85vh] overflow-y-auto">
      <div className="text-center mb-8">
        <div className="mx-auto bg-orange-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
          <MapIcon className="w-7 h-7 text-orange-500" />
        </div>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-800 mb-2">{zoneName}</h2>
        <p className="text-base md:text-lg text-slate-600 font-medium mb-1">{zoneTheme}</p>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-4">{t.chooseLevel}</p>
      </div>

      <div className="flex flex-col items-stretch max-w-md mx-auto">
        {quest.levels.map((level, i) => {
          const status = statuses[i];
          const isLast = i === quest.levels.length - 1;
          return (
            <React.Fragment key={level.levelId}>
              <div
                className={cn(
                  'flex items-center gap-4 p-4 rounded-2xl border-2 transition-colors',
                  status === 'locked'
                    ? 'border-slate-100 bg-slate-50'
                    : 'border-slate-100 bg-white shadow-sm',
                )}
              >
                <div
                  className={cn(
                    'w-14 h-14 rounded-full border-4 flex items-center justify-center shrink-0 shadow',
                    NODE_STYLES[status],
                  )}
                >
                  <NodeIcon status={status} />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'font-bold text-lg flex items-center gap-2',
                      status === 'locked' ? 'text-slate-400' : 'text-slate-800',
                    )}
                  >
                    {React.createElement(KIND_ICONS[level.kind], {
                      className: cn(
                        'w-5 h-5 shrink-0',
                        status === 'locked' ? 'text-slate-300' : 'text-orange-500',
                      ),
                    })}
                    <span className="min-w-0">
                      {t.levelN(i + 1)}: {t.levelKindNames[level.kind]}
                    </span>
                  </p>
                  {status === 'completed' && (
                    <span className="inline-block text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {t.levelCompletedTag}
                    </span>
                  )}
                  {status === 'locked' && (
                    <p className="text-sm font-medium text-slate-400">{t.completePreviousLevel}</p>
                  )}
                </div>

                {status === 'unlocked' && (
                  <button
                    onClick={() => onStart(i, false)}
                    className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-5 py-2.5 rounded-full font-bold transition-transform active:scale-95 shadow-md touch-manipulation shrink-0"
                  >
                    {t.startLevelLabel}
                  </button>
                )}
                {status === 'completed' && (
                  <button
                    onClick={() => onStart(i, true)}
                    className="bg-sky-50 hover:bg-sky-100 active:bg-sky-200 text-sky-700 border border-sky-200 px-4 py-2.5 rounded-full font-bold text-sm transition-transform active:scale-95 shadow-sm touch-manipulation shrink-0 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t.practiceReplay}
                  </button>
                )}
              </div>

              {!isLast && (
                <div
                  className={cn(
                    'w-1 h-6 rounded-full mx-auto my-0.5',
                    status === 'completed' ? 'bg-green-300' : 'bg-slate-200',
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {anyCompleted && (
        <p className="text-center text-sm text-slate-400 font-medium mt-4">{t.practiceNote}</p>
      )}

      <div className="flex justify-center mt-8">
        <button
          onClick={exitZone}
          className="bg-sky-50 hover:bg-sky-100 active:bg-sky-200 text-sky-700 px-8 py-3.5 rounded-full font-bold text-lg transition-transform active:scale-95 shadow-sm border border-sky-200 touch-manipulation"
        >
          {t.backToMap}
        </button>
      </div>
    </div>
  );
}
