/**
 * Nyaya Nagri — Cohort leaderboard demo data (Task 16, PRD §7.3 + §9.7)
 *
 * HARD SCOPE RULE (§9.7): leaderboards are COHORT-ONLY — a child's own
 * classroom group — pseudonymous, and opt-in with the default OFF. There
 * is NO global, school-wide, or public leaderboard anywhere, and none may
 * ever be added.
 *
 * This prototype is device-local with no accounts or server, so no real
 * classroom cohort can exist yet. Exactly like the Task 11 community
 * board, the cohort shown is a clearly LABELLED demo classroom: every
 * entry below was written by the team. The handles are invented game
 * nicknames in the same style the game itself suggests — they are not
 * real children and contain no PII. The child's own row (real local XP,
 * game nickname only) is merged in by the UI when they opt in.
 *
 * A real deployment would replace this file with a teacher-administered
 * backend (class group setup, consent, moderation) — flagged in the task
 * report.
 */

export interface DemoCohortEntry {
  /** Invented pseudonymous game handle — never a real name. */
  handle: string;
  /** Demo XP total, in the same scale as the real game economy. */
  xp: number;
}

/** The labelled demo classroom cohort ("sample players by the team"). */
export const DEMO_COHORT: readonly DemoCohortEntry[] = [
  { handle: 'AsmanTara_12', xp: 640 },
  { handle: 'NanhiShakti_10', xp: 530 },
  { handle: 'BraveKiran_09', xp: 455 },
  { handle: 'GyaanDost_14', xp: 370 },
  { handle: 'KhushiStar_23', xp: 250 },
  { handle: 'NyayaYoddha_07', xp: 160 },
];
