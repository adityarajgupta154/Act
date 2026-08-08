/**
 * Nyaya Nagri — Quest registry (Task 3; content complete as of Task 8;
 * Hindi translations added in Task 10)
 *
 * Maps zone + age band (+ language) to a quest content file. All 5 zones x
 * 3 age bands (15 quests) exist in English and Hindi. The resolver requires
 * an exact zone + band match — the temporary any-band fallback from the
 * content build-out has been removed so a band can never silently receive
 * another band's quest. Hindi falls back to English only if a translation
 * is missing (should never happen — parity is validated at module load).
 */

import type { AgeBand } from '@/data/progressStore';
import type { Language } from '@/data/settingsStore';
import { validateQuest, validateTranslationParity, type Quest } from './schema';
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
import safeZone811Hi from './content/hi/safe_zone_8_11.json';
import safeZone1215Hi from './content/hi/safe_zone_12_15.json';
import safeZone1618Hi from './content/hi/safe_zone_16_18.json';
import rightChildhood811Hi from './content/hi/right_childhood_8_11.json';
import rightChildhood1215Hi from './content/hi/right_childhood_12_15.json';
import rightChildhood1618Hi from './content/hi/right_childhood_16_18.json';
import schoolRights811Hi from './content/hi/school_rights_8_11.json';
import schoolRights1215Hi from './content/hi/school_rights_12_15.json';
import schoolRights1618Hi from './content/hi/school_rights_16_18.json';
import justiceSystem811Hi from './content/hi/justice_system_8_11.json';
import justiceSystem1215Hi from './content/hi/justice_system_12_15.json';
import justiceSystem1618Hi from './content/hi/justice_system_16_18.json';
import digitalSafety811Hi from './content/hi/digital_safety_8_11.json';
import digitalSafety1215Hi from './content/hi/digital_safety_12_15.json';
import digitalSafety1618Hi from './content/hi/digital_safety_16_18.json';

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

const QUEST_FILES_HI: Quest[] = [
  safeZone811Hi as Quest,
  safeZone1215Hi as Quest,
  safeZone1618Hi as Quest,
  rightChildhood811Hi as Quest,
  rightChildhood1215Hi as Quest,
  rightChildhood1618Hi as Quest,
  schoolRights811Hi as Quest,
  schoolRights1215Hi as Quest,
  schoolRights1618Hi as Quest,
  justiceSystem811Hi as Quest,
  justiceSystem1215Hi as Quest,
  justiceSystem1618Hi as Quest,
  digitalSafety811Hi as Quest,
  digitalSafety1215Hi as Quest,
  digitalSafety1618Hi as Quest,
];

/** Validate everything once at module load — content bugs fail loudly in dev. */
const QUESTS: Quest[] = QUEST_FILES.map(validateQuest);

/**
 * Hindi quests: validate structure AND structural parity with the English
 * source (same scene/choice/quiz ids, counts, outcomes, correctIndex, and
 * nextScene links) so a translation can never diverge from the reviewed
 * English legal content. Fails loudly at module load in dev.
 */
const QUESTS_HI: Quest[] = QUEST_FILES_HI.map((raw) => {
  const quest = validateQuest(raw);
  const source = QUESTS.find((q) => q.questId === quest.questId);
  if (!source) {
    throw new Error(`Hindi quest "${quest.questId}" has no English source quest`);
  }
  validateTranslationParity(source, quest);
  return quest;
});

/**
 * Find the quest for a zone + age band in the requested language. Exact
 * zone + band match only (all 15 quests exist per language); null means an
 * invalid zone — the UI shows the placeholder interior from Task 1.
 * Hindi falls back to the English quest if no translation exists.
 */
export function resolveQuest(
  zoneId: string,
  ageBand: AgeBand,
  language: Language = 'en',
): Quest | null {
  if (language === 'hi') {
    const hi = QUESTS_HI.find((q) => q.zoneId === zoneId && q.ageBand === ageBand);
    if (hi) return hi;
  }
  return QUESTS.find((q) => q.zoneId === zoneId && q.ageBand === ageBand) ?? null;
}

/**
 * All validated quests (read-only) — used by the progress dashboard to map
 * questIds to zones/totals. Always the English set: progress totals and
 * zone mapping are language-independent (ids are identical across languages).
 */
export function getAllQuests(): readonly Quest[] {
  return QUESTS;
}
