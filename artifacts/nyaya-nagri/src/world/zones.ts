/**
 * Nyaya Nagri — Zone registry & lock rules (Task 1)
 *
 * Single source of truth for the 6 Rights Quest zones and their unlock
 * sequence. Zone themes trace back to PRD §4.1/§4.2 (legal content matrix);
 * Zone 0 "Know Yourself" (PRD M13) is the constitutional foundation zone
 * that plays before all topic zones.
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
    id: 'zone0',
    order: 1,
    name: 'Know Yourself',
    theme: 'Every child is equal, matters, and lives with dignity (Constitution basics)',
    position: [0, -12],
  },
  {
    id: 'zone1',
    order: 2,
    name: 'Safe Zone',
    theme: 'Personal safety and body autonomy (POCSO awareness)',
    position: [0, -26],
  },
  {
    id: 'zone2',
    order: 3,
    name: 'Right to Childhood',
    theme: 'Every child has the right to learn, play, and rest (child labour awareness)',
    position: [-24, -10],
  },
  {
    id: 'zone3',
    order: 4,
    name: 'School Rights',
    theme: 'Free and fair education for every child (RTE)',
    position: [-15, 20],
  },
  {
    id: 'zone4',
    order: 5,
    name: 'Justice System Simulator',
    theme: 'The people and places that protect children (JJ Act / CWC / JJB)',
    position: [15, 20],
  },
  {
    id: 'zone5',
    order: 6,
    name: 'Digital Safety',
    theme: 'Staying safe and kind online (cyberbullying / online safety)',
    position: [24, -10],
  },
];

export function getZone(zoneId: string): ZoneDef | undefined {
  return ZONES.find((z) => z.id === zoneId);
}

/**
 * The first zone in the sequence (Zone 0, "Know Yourself") is unlocked by
 * default; each later zone unlocks only when the previous zone's quest is
 * complete in the progress store — so Zone 1 now requires Zone 0 first.
 *
 * A zone that is itself complete is always unlocked: completing it proves
 * the child had access, and replay/practice of finished zones must never be
 * blocked. This also migrates pre-Zone-0 saves gracefully — a child who had
 * already finished Zone 1+ keeps every completed zone open and only new
 * (uncompleted) zones follow the Zone 0-first sequence.
 *
 * `isZoneUnlockedIn` is the ONE pure rule over a completedZones map; every
 * surface (3D map, dev seam, progress dashboard) must derive from it so the
 * lock logic can never drift between views.
 */
export function isZoneUnlockedIn(
  completedZones: Record<string, boolean>,
  zoneId: string,
): boolean {
  const zone = getZone(zoneId);
  if (!zone) return false;
  if (completedZones[zoneId] === true) return true;
  if (zone.order === 1) return true;
  const previous = ZONES.find((z) => z.order === zone.order - 1);
  if (!previous) return true;
  return completedZones[previous.id] === true;
}

export function isZoneUnlocked(zoneId: string): boolean {
  return isZoneUnlockedIn(progressStore.getState().completedZones, zoneId);
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
