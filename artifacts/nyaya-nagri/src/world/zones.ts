/**
 * Nyaya Nagri — Zone registry & lock rules (Task 1)
 *
 * Single source of truth for the 5 Rights Quest zones and their unlock
 * sequence. Zone themes trace back to PRD §4.2 (legal content matrix).
 * Quest content itself comes in later tasks — this module only defines
 * identity, ordering, and lock state.
 */

import { progressStore } from '@/data/progressStore';

export interface ZoneDef {
  /** Stable id used in the progress store (never rename once shipped). */
  id: string;
  /** Order in the unlock sequence, 1-based. */
  order: number;
  /** Display name (matches the build plan's zone naming). */
  name: string;
  /** One-line child-friendly theme description (not legal text). */
  theme: string;
  /** World position [x, z] of the zone marker on the map. */
  position: [number, number];
}

export const ZONES: ZoneDef[] = [
  {
    id: 'zone1',
    order: 1,
    name: 'Safe Zone',
    theme: 'Personal safety and body autonomy (POCSO awareness)',
    position: [0, -26],
  },
  {
    id: 'zone2',
    order: 2,
    name: 'Right to Childhood',
    theme: 'Every child has the right to learn, play, and rest (child labour awareness)',
    position: [-24, -10],
  },
  {
    id: 'zone3',
    order: 3,
    name: 'School Rights',
    theme: 'Free and fair education for every child (RTE)',
    position: [-15, 20],
  },
  {
    id: 'zone4',
    order: 4,
    name: 'Justice System Simulator',
    theme: 'The people and places that protect children (JJ Act / CWC / JJB)',
    position: [15, 20],
  },
  {
    id: 'zone5',
    order: 5,
    name: 'Digital Safety',
    theme: 'Staying safe and kind online (cyberbullying / online safety)',
    position: [24, -10],
  },
];

export function getZone(zoneId: string): ZoneDef | undefined {
  return ZONES.find((z) => z.id === zoneId);
}

/**
 * Zone 1 is unlocked by default; each later zone unlocks only when the
 * previous zone's quest is complete in the progress store.
 */
export function isZoneUnlocked(zoneId: string): boolean {
  const zone = getZone(zoneId);
  if (!zone) return false;
  if (zone.order === 1) return true;
  const previous = ZONES.find((z) => z.order === zone.order - 1);
  if (!previous) return true;
  return progressStore.isZoneComplete(previous.id);
}

export function isZoneComplete(zoneId: string): boolean {
  return progressStore.isZoneComplete(zoneId);
}

/** Convenience for UI: full lock/complete state for all zones. */
export function getZoneStates(): Array<
  ZoneDef & { unlocked: boolean; completed: boolean }
> {
  return ZONES.map((z) => ({
    ...z,
    unlocked: isZoneUnlocked(z.id),
    completed: isZoneComplete(z.id),
  }));
}
