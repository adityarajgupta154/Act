/**
 * Nyaya Nagri — Player certificates table
 *
 * One row per zone-player combination. Derived from completedZones
 * (PRD §9.4) — stable certificate id + first-completion date only;
 * no player name is ever stored (that lives in avatar.nickname only).
 */
import { pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { players } from './players';

export const playerCertificates = pgTable(
  'player_certificates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    /** Zone id, e.g. "zone1". */
    zoneId: text('zone_id').notNull(),
    /** Stable certificate id generated client-side from zoneId. */
    certificateId: text('certificate_id').notNull(),
    /** ISO timestamp of first zone completion — the issue date printed on the cert. */
    earnedAt: timestamp('earned_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('uq_player_zone').on(table.playerId, table.zoneId),
  ],
);
