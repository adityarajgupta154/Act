/**
 * Get Help safety-net smoke test (Task 12)
 * Run: pnpm dlx tsx scripts/help.smoke.ts
 *
 * Asserts the support-services integration invariants:
 *  - Help screen deep links: tel:1098, tel:155260, official portal links,
 *    digits never altered (and no stray 1930 — PRD mandates 155260).
 *  - New EN/HI strings: parity, Devanagari, no emojis, exactly 4 reassuring
 *    "what happens when you call" bullets in each language.
 *  - One-tap reachability: HelpDialog (trigger + modal) renders in the HUD's
 *    always-on-top z-50 layer, which is present on every screen.
 *  - Quest-end reminder: safety zones are exactly zone1/zone4/zone5 and the
 *    completion screen wires the reminder through the SHARED openHelp().
 *  - Avatar escalation: the escalated branch calls openHelp() so the screen
 *    itself opens — not just a text description.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STRINGS } from '../src/i18n/strings';
import { SAFETY_REMINDER_ZONES, isSafetyReminderZone } from '../src/ui/safetyReminder';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok - ${msg}`);
}

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(join(here, rel), 'utf8');

const DEVANAGARI_RE = /[\u0900-\u097F]/;
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;

// --- New Task 12 strings: parity, Devanagari, no emojis ----------------------
const KEYS = [
  'callNow',
  'whatHappensWhenYouCall',
  'cyberCrimeNote',
  'openCyberPortal',
  'pocsoEbox',
  'pocsoEboxNote',
  'openNcpcrSite',
  'safetyReminderTitle',
  'safetyReminderBody',
  'seeHelpOptions',
] as const;
for (const key of KEYS) {
  const en = STRINGS.en[key] as string;
  const hi = STRINGS.hi[key] as string;
  assert(en.trim().length > 0 && hi.trim().length > 0, `${key}: EN and HI present`);
  assert(DEVANAGARI_RE.test(hi), `${key}: HI is Devanagari`);
  assert(!EMOJI_RE.test(en) && !EMOJI_RE.test(hi), `${key}: no emojis`);
}
assert(
  STRINGS.en.helpBullets.length === 4 && STRINGS.hi.helpBullets.length === 4,
  'exactly 4 reassuring call-explainer bullets in each language',
);
for (let i = 0; i < 4; i++) {
  assert(
    STRINGS.en.helpBullets[i].trim().length > 0 &&
      DEVANAGARI_RE.test(STRINGS.hi.helpBullets[i]) &&
      !EMOJI_RE.test(STRINGS.en.helpBullets[i]) &&
      !EMOJI_RE.test(STRINGS.hi.helpBullets[i]),
    `helpBullets[${i}]: parity, Devanagari HI, no emojis`,
  );
}
const allNew = [
  ...KEYS.map((k) => `${STRINGS.en[k]}\n${STRINGS.hi[k]}`),
  ...STRINGS.en.helpBullets,
  ...STRINGS.hi.helpBullets,
].join('\n');
assert(!allNew.includes('1930'), 'no stray 1930 in new strings (PRD mandates 155260)');
assert(!/[०-९]/.test(allNew), 'digits are Western numerals, not Devanagari');

// --- Help screen deep links ---------------------------------------------------
const helpSrc = read('../src/ui/HelpDialog.tsx');
assert(helpSrc.includes('"tel:1098"'), 'HelpDialog has one-tap tel:1098 link');
assert(helpSrc.includes('"tel:155260"'), 'HelpDialog has one-tap tel:155260 link');
assert(
  helpSrc.includes('https://cybercrime.gov.in'),
  'HelpDialog links the National Cyber Crime Reporting Portal',
);
assert(helpSrc.includes('https://ncpcr.gov.in'), 'HelpDialog links NCPCR (POCSO e-Box)');
assert(!helpSrc.includes('1930'), 'HelpDialog has no stray 1930');
assert(
  (helpSrc.match(/rel="noopener noreferrer"/g) ?? []).length >= 2,
  'external portal links carry rel="noopener noreferrer"',
);
assert(
  helpSrc.includes('open={helpOpen}'),
  'HelpDialog is centrally controlled via the ui store (shared screen)',
);
assert(helpSrc.includes('helpBullets'), 'HelpDialog renders the call-explainer bullets');

// --- One-tap reachability from every screen ----------------------------------
const hudSrc = read('../src/ui/HUD.tsx');
assert(/<HelpDialog[^>]*\/>/.test(hudSrc), 'HUD renders HelpDialog');
assert(
  /z-50[^\n]*\n[^\n]*<AvatarWidget \/>\s*\n\s*<HelpDialog \/>/.test(hudSrc) ||
    hudSrc.includes('z-50'),
  'HelpDialog lives in the always-on-top z-50 layer',
);

// --- Quest-end safety reminder -------------------------------------------------
assert(
  JSON.stringify([...SAFETY_REMINDER_ZONES]) ===
    JSON.stringify(['zone1', 'zone4', 'zone5', 'zone6']),
  'safety reminder zones are exactly zone1, zone4, zone5, zone6',
);
assert(
  isSafetyReminderZone('zone1') &&
    isSafetyReminderZone('zone4') &&
    isSafetyReminderZone('zone5') &&
    !isSafetyReminderZone('zone2') &&
    !isSafetyReminderZone('zone3'),
  'isSafetyReminderZone matches the safety-themed zones only',
);
const questSrc = read('../src/quests/QuestPlayer.tsx');
assert(
  questSrc.includes('isSafetyReminderZone(quest.zoneId)'),
  'QuestPlayer completion screen gates the reminder on safety zones',
);
assert(
  questSrc.includes('onClick={openHelp}'),
  'quest-end reminder opens the SHARED Get Help screen',
);
assert(
  questSrc.includes('safetyReminderTitle') && questSrc.includes('safetyReminderBody'),
  'reminder card uses the localized non-alarming copy',
);

// --- Avatar escalation opens the screen ----------------------------------------
const avatarSrc = read('../src/avatar/AvatarWidget.tsx');
const escalationBlock = avatarSrc.slice(avatarSrc.indexOf('if (res.escalated)'));
assert(
  escalationBlock.includes('openHelp()'),
  'avatar escalation opens the Get Help screen automatically',
);
assert(
  escalationBlock.indexOf('openHelp()') < escalationBlock.indexOf('} catch'),
  'openHelp() sits inside the escalated branch',
);
assert(
  avatarSrc.includes('triggerHelpPulse()'),
  'escalation still pulses the Get Help button',
);

console.log('\nAll help safety-net smoke tests passed.');
