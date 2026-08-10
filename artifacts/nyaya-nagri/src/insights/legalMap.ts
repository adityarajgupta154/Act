/**
 * Source traceability (spec §12) — zone -> legal instrument map.
 *
 * VERIFIED CONTENT ONLY: every entry below is copied from the PRD §4
 * "Legal & Regulatory Scope" act mapping — the same authoritative backbone
 * that powers the quests and the AI corpus. Nothing here is generated, and
 * section-level citations are deliberately NOT invented (PRD §9.8). The
 * public source for all instruments is India Code, the Government of
 * India's official repository of legislation.
 *
 * A zone missing from this map must render the canonical fallback line
 * ("Legal source could not be verified") — never a guessed act name.
 */

export const INDIA_CODE_URL = 'https://www.indiacode.nic.in/';
export const INDIA_CODE_NAME = 'India Code';

/** Developmental background reference (spec §1, SOURCE 2) — background only,
 *  NEVER a diagnostic basis. */
export const DEVELOPMENT_REFERENCE_NAME =
  'Verywell Mind — Overview of Child Psychology and Development';
export const DEVELOPMENT_REFERENCE_URL =
  'https://www.verywellmind.com/what-is-child-psychology-2795067';

/** PRD §4.1/§4.2 act mapping, verbatim. */
const ZONE_ACTS: Record<string, string> = {
  zone0: 'Constitution of India — Articles 14, 15, 15(3), 21, 21A',
  zone1: 'Protection of Children from Sexual Offences (POCSO) Act, 2012',
  zone2: 'Child Labour (Prohibition & Regulation) Act, 1986 (Amendment 2016)',
  zone3: 'Right of Children to Free and Compulsory Education (RTE) Act, 2009',
  zone4: 'Juvenile Justice (Care and Protection of Children) Act, 2015',
  zone5: 'Information Technology Act, 2000 (as amended) + IT Rules 2021',
  zone6: 'Prohibition of Child Marriage Act, 2006',
};

/** The verified act behind a zone's content, or null (-> fallback line). */
export function legalActForZone(zoneId: string): string | null {
  return ZONE_ACTS[zoneId] ?? null;
}
