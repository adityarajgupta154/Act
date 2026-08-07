/**
 * Nyaya Nagri — Quest registry (Task 3)
 *
 * Maps zone + age band to a quest content file. Real quests (Task 4+) get
 * added to QUEST_FILES; the resolver prefers an exact age-band match and
 * falls back to any quest for the zone so a zone is playable even before
 * all three band variants exist.
 */

import type { AgeBand } from '@/data/progressStore';
import { validateQuest, type Quest } from './schema';
import zone1Sample from './content/zone1_sample.json';

const QUEST_FILES: Quest[] = [zone1Sample as Quest];

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
