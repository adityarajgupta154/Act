/**
 * Nyaya Nagri — Quest registry (Task 3; content complete as of Task 8)
 *
 * Maps zone + age band to a quest content file. All 5 zones x 3 age bands
 * (15 quests) now exist, so the resolver requires an exact zone + band
 * match — the temporary any-band fallback from the content build-out has
 * been removed so a band can never silently receive another band's quest.
 */

import type { AgeBand } from '@/data/progressStore';
import { validateQuest, type Quest } from './schema';
import safeZone811 from './content/safe_zone_8_11.json';
import safeZone1215 from './content/safe_zone_12_15.json';
import safeZone1618 from './content/safe_zone_16_18.json';
import rightChildhood811 from './content/right_childhood_8_11.json';
import rightChildhood1215 from './content/right_childhood_12_15.json';
import rightChildhood1618 from './content/right_childhood_16_18.json';
import schoolRights811 from './content/school_rights_8_11.json';
import schoolRights1215 from './content/school_rights_12_15.json';
import schoolRights1618 from './content/school_rights_16_18.json';
import justiceSystem811 from './content/justice_system_8_11.json';
import justiceSystem1215 from './content/justice_system_12_15.json';
import justiceSystem1618 from './content/justice_system_16_18.json';
import digitalSafety811 from './content/digital_safety_8_11.json';
import digitalSafety1215 from './content/digital_safety_12_15.json';
import digitalSafety1618 from './content/digital_safety_16_18.json';

const QUEST_FILES: Quest[] = [
  safeZone811 as Quest,
  safeZone1215 as Quest,
  safeZone1618 as Quest,
  rightChildhood811 as Quest,
  rightChildhood1215 as Quest,
  rightChildhood1618 as Quest,
  schoolRights811 as Quest,
  schoolRights1215 as Quest,
  schoolRights1618 as Quest,
  justiceSystem811 as Quest,
  justiceSystem1215 as Quest,
  justiceSystem1618 as Quest,
  digitalSafety811 as Quest,
  digitalSafety1215 as Quest,
  digitalSafety1618 as Quest,
];

/** Validate everything once at module load — content bugs fail loudly in dev. */
const QUESTS: Quest[] = QUEST_FILES.map(validateQuest);

/**
 * Find the quest for a zone + age band. Exact match only (all 15 quests
 * exist); null means an invalid zone — the UI shows the placeholder
 * interior from Task 1.
 */
export function resolveQuest(zoneId: string, ageBand: AgeBand): Quest | null {
  return QUESTS.find((q) => q.zoneId === zoneId && q.ageBand === ageBand) ?? null;
}
