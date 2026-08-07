/**
 * Nyaya Nagri — Quest registry (Task 3, real Zone 1 content from Task 4)
 *
 * Maps zone + age band to a quest content file. The resolver prefers an
 * exact age-band match and falls back to any quest for the zone so a zone
 * stays playable if a band variant is ever missing. Zone 1 now has all
 * three bands (real POCSO content); zones 2-5 get content in later tasks.
 */

import type { AgeBand } from '@/data/progressStore';
import { validateQuest, type Quest } from './schema';
import safeZone811 from './content/safe_zone_8_11.json';
import safeZone1215 from './content/safe_zone_12_15.json';
import safeZone1618 from './content/safe_zone_16_18.json';

const QUEST_FILES: Quest[] = [
  safeZone811 as Quest,
  safeZone1215 as Quest,
  safeZone1618 as Quest,
];

/** Validate everything once at module load — content bugs fail loudly in dev. */
const QUESTS: Quest[] = QUEST_FILES.map(validateQuest);

/**
 * Find the quest for a zone + age band. Exact band match wins, then any
 * quest for the zone, then null (zone has no content yet — UI shows the
 * placeholder interior from Task 1).
 */
export function resolveQuest(zoneId: string, ageBand: AgeBand): Quest | null {
  return (
    QUESTS.find((q) => q.zoneId === zoneId && q.ageBand === ageBand) ??
    QUESTS.find((q) => q.zoneId === zoneId) ??
    null
  );
}
