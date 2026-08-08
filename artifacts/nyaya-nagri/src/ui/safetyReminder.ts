/**
 * Task 12 — which zones get a quest-end safety reminder card.
 *
 * The reminder is a brief, NON-ALARMING pointer to the Get Help Now screen,
 * shown after quests whose themes touch personal safety, so children build
 * repeated, calm familiarity with real support services (PRD §9.1, §4.3).
 *
 * Zones 1 (personal safety / POCSO), 4 (justice system / JJ Act),
 * 5 (digital safety) and 6 (family safety / child marriage — Task 20) are
 * safety-themed and disclosure-prone. Zones 2 (child labour) and
 * 3 (school rights) are rights-and-entitlements themed; the reminder is
 * deliberately NOT shown there so it stays meaningful and never becomes
 * background noise the child learns to ignore.
 */
export const SAFETY_REMINDER_ZONES = ['zone1', 'zone4', 'zone5', 'zone6'] as const;

export function isSafetyReminderZone(zoneId: string): boolean {
  return (SAFETY_REMINDER_ZONES as readonly string[]).includes(zoneId);
}
