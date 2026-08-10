/**
 * Nyaya Nagri — Zone completion certificates (Task 27, PRD §9.4).
 *
 * Pure, dependency-free module (no store/zones imports — the store imports
 * THIS at its load ingress, and zones.ts imports the store).
 *
 * Design rules:
 * - A certificate is DERIVED state: it exists if and only if its zone is
 *   flagged complete in `completedZones` — which is written ONLY by the
 *   quest engine's finalization path. There is no other unlock path, so a
 *   certificate can never be unlocked by a button or a hand-edited save.
 * - Once issued, `certificateId` and `completedAt` are STABLE: reconcile
 *   keeps existing records verbatim and only fills in what is missing
 *   (legacy saves that completed zones before this feature existed get
 *   their certificate backfilled on first load).
 * - Data minimization (§9.4): a record stores NO name — the display name is
 *   always read live from the game nickname at render time, so it follows
 *   the existing profile logic and never duplicates even that pseudonym.
 */

export interface CertificateRecord {
  /** Stable unique id, e.g. "NYN-SCH-2026-A8F42C". Never regenerated. */
  certificateId: string;
  /** ISO timestamp of the FIRST completion; never changes afterwards. */
  completedAt: string;
}

/**
 * Deterministic 3-letter zone codes for certificate ids. Keyed by the
 * stable zone ids from zones.ts (never rename once shipped — printed
 * certificates reference these ids forever).
 */
export const ZONE_CERT_CODES: Record<string, string> = {
  zone0: 'KNW', // Know Yourself
  zone1: 'SAF', // Safe Zone
  zone2: 'CHD', // Right to Childhood
  zone3: 'SCH', // School Rights
  zone4: 'JUS', // Justice System Simulator
  zone5: 'DIG', // Digital Safety
  zone6: 'FAM', // Family & Community Shield
};

export const CERTIFICATE_ID_PATTERN = /^NYN-[A-Z]{3}-\d{4}-[A-Z0-9]{6}$/;

const ID_ALPHABET = '0123456789ABCDEF';

/** "NYN-<ZONE>-<YYYY>-<6 hex>" — unique enough for one device's 7 zones. */
export function generateCertificateId(zoneId: string, nowIso: string): string {
  const code = ZONE_CERT_CODES[zoneId] ?? 'NYN';
  const year = new Date(nowIso).getFullYear();
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  }
  return `NYN-${code}-${year}-${suffix}`;
}

/** Load-time shape guard: a stored record must look exactly right. */
export function isCertificateRecord(v: unknown): v is CertificateRecord {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const r = v as { certificateId?: unknown; completedAt?: unknown };
  return (
    typeof r.certificateId === 'string' &&
    CERTIFICATE_ID_PATTERN.test(r.certificateId) &&
    typeof r.completedAt === 'string' &&
    Number.isFinite(new Date(r.completedAt).getTime())
  );
}

/**
 * The ONE reconcile rule (mirrors reconcileEconomy's philosophy): keep only
 * records the recorded progress can justify, back-fill what completion has
 * earned, never touch a valid existing record (stable id + date).
 *
 * - a record for a zone that is NOT complete (or unknown) is DROPPED —
 *   forged saves cannot mint certificates;
 * - a complete zone with no (or malformed) record gets a fresh one issued
 *   at `nowIso` — engine completions get the real moment because the store
 *   reconciles inside the SAME update that flags the zone complete; legacy
 *   pre-feature saves get their first load as the date.
 */
export function reconcileCertificates(
  existing: unknown,
  completedZones: Record<string, boolean>,
  nowIso: string,
): Record<string, CertificateRecord> {
  const out: Record<string, CertificateRecord> = {};
  if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
    for (const [zoneId, record] of Object.entries(existing as Record<string, unknown>)) {
      if (!(zoneId in ZONE_CERT_CODES)) continue; // unknown zone: drop
      if (completedZones[zoneId] !== true) continue; // not earned: drop
      if (!isCertificateRecord(record)) continue; // malformed: reissue below
      out[zoneId] = { certificateId: record.certificateId, completedAt: record.completedAt };
    }
  }
  for (const zoneId of Object.keys(ZONE_CERT_CODES)) {
    if (completedZones[zoneId] === true && !out[zoneId]) {
      out[zoneId] = {
        certificateId: generateCertificateId(zoneId, nowIso),
        completedAt: nowIso,
      };
    }
  }
  return out;
}

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_HI = [
  'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर',
];

/**
 * "10 August 2026" — professional long date, Western numerals in BOTH
 * languages (project-wide numeral rule). Manual month tables so smoke tests
 * never depend on Node's ICU locale data.
 */
export function formatCertificateDate(iso: string, language: 'en' | 'hi'): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  const months = language === 'hi' ? MONTHS_HI : MONTHS_EN;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Nyaya-Nagri-School-Rights-Certificate.pdf" (always the EN zone name). */
export function certificateFileName(zoneNameEn: string): string {
  const slug = zoneNameEn
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `Nyaya-Nagri-${slug}-Certificate.pdf`;
}

/**
 * Display name rule (§9.4): live game nickname only — never stored on the
 * record, never any real/PII name. Falls back to a friendly generic when
 * no nickname was ever set.
 */
export function certificateRecipient(
  nickname: string | null | undefined,
  fallback: string,
): string {
  const clean = (nickname ?? '').trim();
  return clean.length > 0 ? clean : fallback;
}
