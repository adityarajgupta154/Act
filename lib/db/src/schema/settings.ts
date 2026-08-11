/**
 * Nyaya Nagri — Player settings table
 *
 * Accessibility and language preferences (PRD §6.4).
 * Mirrors SettingsState exactly — no PII, no progress data.
 */
import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { players } from './players';

export const playerSettings = pgTable('player_settings', {
  /** One row per player; deletes cascade when the player row is deleted. */
  playerId: uuid('player_id')
    .primaryKey()
    .references(() => players.id, { onDelete: 'cascade' }),
  /** Display language: 'en' | 'hi'. */
  language: text('language').default('en').notNull(),
  /** Read narration and choices aloud via Web Speech API. On by default (PRD §6.4). */
  narration: boolean('narration').default(true).notNull(),
  /** Dyslexia-friendly OpenDyslexic font. */
  dyslexiaFont: boolean('dyslexia_font').default(false).notNull(),
  /** High-contrast colour mode. */
  highContrast: boolean('high_contrast').default(false).notNull(),
  /** Text size: 'small' | 'medium' | 'large'. */
  textSize: text('text_size').default('medium').notNull(),
  /** Calm ambient background music loop. On by default. */
  ambientSound: boolean('ambient_sound').default(true).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
