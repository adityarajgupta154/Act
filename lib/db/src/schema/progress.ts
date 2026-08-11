/**
 * Nyaya Nagri — Player progress table
 *
 * Zone/level/story completion maps, quiz scores, activity scores,
 * streak, badges, and insights — all stored as JSONB to mirror the
 * existing ProgressState shape exactly.
 */
import { jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { players } from './players';

export const playerProgress = pgTable('player_progress', {
  /** One row per player; deletes cascade when the player row is deleted. */
  playerId: uuid('player_id')
    .primaryKey()
    .references(() => players.id, { onDelete: 'cascade' }),
  /** Zone completion flags keyed by zone id, e.g. { "zone1": true }. */
  completedZones: jsonb('completed_zones').default(sql`'{}'::jsonb`).notNull(),
  /** Level completion flags keyed "zoneId:levelId". */
  levelProgress: jsonb('level_progress').default(sql`'{}'::jsonb`).notNull(),
  /** Story Adventure completions keyed by story level id. */
  storyProgress: jsonb('story_progress').default(sql`'{}'::jsonb`).notNull(),
  /** Quiz scores keyed by quest id: { pre: number|null, post: number|null }. */
  quizScores: jsonb('quiz_scores').default(sql`'{}'::jsonb`).notNull(),
  /** Activity level results keyed "zoneId:levelId": { score, total }. */
  activityScores: jsonb('activity_scores').default(sql`'{}'::jsonb`).notNull(),
  /** Practice/replay attempt counts keyed "zoneId:levelId". */
  replayCounts: jsonb('replay_counts').default(sql`'{}'::jsonb`).notNull(),
  /** Silent pre-quiz answer indices keyed by quest id. */
  preAnswersByQuest: jsonb('pre_answers_by_quest').default(sql`'{}'::jsonb`).notNull(),
  /** Badge ids earned, keyed by badge id. */
  badges: jsonb('badges').default(sql`'{}'::jsonb`).notNull(),
  /** Unlocked flavor title ids (private, never shared publicly). */
  titles: jsonb('titles').default(sql`'{}'::jsonb`).notNull(),
  /** Gentle daily streak — { count: number, lastDay: string|null }. */
  streak: jsonb('streak').default(sql`'{"count":0,"lastDay":null}'::jsonb`).notNull(),
  /** Rolling activity event log (capped window) — option indices + derived stats only, no PII. */
  activityLog: jsonb('activity_log').default(sql`'[]'::jsonb`).notNull(),
  /** Insights bookkeeping + cached AI narrative snapshot. */
  insightsMeta: jsonb('insights_meta').default(sql`'{}'::jsonb`).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
