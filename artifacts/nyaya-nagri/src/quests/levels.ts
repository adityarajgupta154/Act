/**
 * Nyaya Nagri — Level lock/unlock rules (Task 15)
 *
 * One layer below Task 1's zone locks, same philosophy: levels inside a
 * zone unlock sequentially, and the zone counts as complete only when its
 * FINAL level (the quiz checkpoint) is passed. Pure reads over the
 * progress store — all writes happen in engine.finalizeLevel().
 */

import { progressStore } from '@/data/progressStore';
import { levelKey } from './engine';
import type { Quest } from './schema';

export type LevelStatus = 'locked' | 'unlocked' | 'completed';

/**
 * A level is complete when recorded in levelProgress — or when the whole
 * zone was completed before Task 15 existed (older saves must not force
 * anyone to replay a finished zone).
 */
export function isLevelCompleted(quest: Quest, levelIndex: number): boolean {
  const level = quest.levels[levelIndex];
  if (!level) return false;
  const state = progressStore.getState();
  return (
    !!state.levelProgress[levelKey(quest.zoneId, level.levelId)] ||
    !!state.completedZones[quest.zoneId]
  );
}

/** Sequential unlock: level N is playable once level N-1 is complete. */
export function isLevelUnlocked(quest: Quest, levelIndex: number): boolean {
  if (levelIndex === 0) return true;
  return isLevelCompleted(quest, levelIndex - 1);
}

export function getLevelStatuses(quest: Quest): LevelStatus[] {
  return quest.levels.map((_, i) =>
    isLevelCompleted(quest, i)
      ? 'completed'
      : isLevelUnlocked(quest, i)
        ? 'unlocked'
        : 'locked',
  );
}

/**
 * Pre-quiz answers recorded when Level 1 finished, handed to the quiz
 * level's session so the adaptive recap works across separate sessions.
 */
export function getPriorPreAnswers(questId: string): number[] {
  return progressStore.getState().preAnswersByQuest[questId] ?? [];
}

/** Practice/Replay attempts for a level (never mixed into quiz scores). */
export function getReplayCount(quest: Quest, levelIndex: number): number {
  const level = quest.levels[levelIndex];
  if (!level) return 0;
  return progressStore.getState().replayCounts[levelKey(quest.zoneId, level.levelId)] ?? 0;
}
