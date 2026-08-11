/**
 * Nyaya Nagri — Players table
 *
 * Core pseudonymous player identity (PRD §9.4 — zero PII).
 * No real name, email, or phone. Only game-level cosmetic + economy fields.
 */
import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Pseudonymous device session id generated client-side (e.g. "nn-abc123-xyz"). */
  sessionId: text('session_id').notNull().unique(),
  /** True only after guardian consent completes onboarding. */
  onboarded: boolean('onboarded').default(false).notNull(),
  /** Age band chosen during onboarding — drives content selection, never identity. */
  ageBand: text('age_band').notNull(), // '8-11' | '12-15' | '16-18'
  /** Cartoon avatar config (nickname + cosmetic ids). No PII — nickname is a game handle only. */
  avatar: jsonb('avatar'),
  /** XP earned in-game only; no real-money path (PRD §7.3). */
  xp: integer('xp').default(0).notNull(),
  /** Virtual Coins, spendable only on cosmetic accessories. */
  coins: integer('coins').default(0).notNull(),
  /** Shop accessory ids bought with Coins. */
  ownedAccessories: text('owned_accessories').array().default(sql`'{}'::text[]`).notNull(),
  /** Cohort leaderboard opt-in; default false (PRD §9.7). */
  leaderboardOptIn: boolean('leaderboard_opt_in').default(false).notNull(),
  /** Reserved, non-PII key/value slots from ProgressState.extras. */
  extras: jsonb('extras').default(sql`'{}'::jsonb`).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
