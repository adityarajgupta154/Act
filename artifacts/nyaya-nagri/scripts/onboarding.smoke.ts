/**
 * Onboarding + consent + ambient audio smoke test (Task 13)
 * Run: pnpm dlx tsx scripts/onboarding.smoke.ts
 *
 * Covers the standing safety rules for the new surfaces:
 *  - EN/HI string parity for every onboarding key, Devanagari, no emojis,
 *    Western numerals only, helpline digits intact.
 *  - progressStore: onboarded defaults to false; completeOnboarding() sets
 *    the age band + flag (consent-gated persistence).
 *  - settingsStore: ambientSound defaults to ON and toggles.
 *  - Static scans: onboarding collects zero PII (no text inputs), the HUD
 *    keeps Get Help Now visible during onboarding, and the ambient loop is
 *    quiet, looping, and settings-gated.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { STRINGS } from '../src/i18n/strings';
import { progressStore } from '../src/data/progressStore';
import { settingsStore } from '../src/data/settingsStore';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dir, '..', 'src');

let count = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  count++;
  console.log(`ok - ${msg}`);
}

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const DEVANAGARI_RE = /[\u0900-\u097F]/;
const DEVANAGARI_DIGITS_RE = /[\u0966-\u096F]/;

// ---- 1. Strings: parity, language, numerals, no emojis --------------------
const KEYS = [
  'welcomeTitle', 'welcomeBody', 'chooseLanguage', 'howItWorksTitle',
  'howOldAreYou', 'ageWhy', 'ageBandDesc811', 'ageBandDesc1215',
  'ageBandDesc1618', 'guardianTitle', 'guardianIntro', 'whatIsStoredTitle',
  'notStoredNote', 'consentCheckbox', 'prototypeNote', 'startPlaying',
  'next', 'back', 'ambientLabel', 'ambientHint',
] as const;

for (const key of KEYS) {
  const en = STRINGS.en[key] as string;
  const hi = STRINGS.hi[key] as string;
  assert(typeof en === 'string' && en.length > 0, `en.${key} present`);
  assert(typeof hi === 'string' && hi.length > 0, `hi.${key} present`);
  assert(DEVANAGARI_RE.test(hi), `hi.${key} is in Devanagari`);
  assert(!EMOJI_RE.test(en) && !EMOJI_RE.test(hi), `${key} has no emojis`);
  assert(!DEVANAGARI_DIGITS_RE.test(hi), `hi.${key} uses Western numerals only`);
}

for (const lang of ['en', 'hi'] as const) {
  const s = STRINGS[lang];
  assert(s.howItWorksPoints.length === 4, `${lang}.howItWorksPoints has 4 points`);
  assert(s.storedPoints.length === 3, `${lang}.storedPoints has 3 points`);
  const all = [...s.howItWorksPoints, ...s.storedPoints].join(' ');
  assert(!EMOJI_RE.test(all), `${lang} onboarding lists have no emojis`);
  assert(
    s.howItWorksPoints.some((p) => p.includes('1098')),
    `${lang} how-it-works mentions Childline 1098 (digits intact)`,
  );
  assert(!DEVANAGARI_DIGITS_RE.test(all), `${lang} lists use Western numerals only`);
  // Consent copy must be honest about storage: device-only, no names.
  assert(
    lang === 'en'
      ? s.notStoredNote.toLowerCase().includes('never asks')
      : s.notStoredNote.includes('कभी नाम'),
    `${lang} consent copy states no name/photo/phone is ever asked`,
  );
  // Full disclosure: guide messages go to an external AI service to create
  // the reply, are not saved by the app, and guardians are asked to remind
  // the child not to share personal details.
  assert(
    lang === 'en'
      ? /AI service/.test(s.notStoredNote) && /not to share personal/.test(s.notStoredNote)
      : s.notStoredNote.includes('एआई (AI)') && s.notStoredNote.includes('निजी जानकारी न'),
    `${lang} consent copy discloses the external AI service + no-personal-details reminder`,
  );
}
assert(
  DEVANAGARI_RE.test(STRINGS.hi.howItWorksPoints.join(' ')),
  'hi.howItWorksPoints is in Devanagari',
);
// PRD-qualified legal reference style: DPDP transliterated with English parens.
assert(
  STRINGS.hi.prototypeNote.includes('डीपीडीपी (DPDP)'),
  'hi.prototypeNote transliterates the act with English parens',
);

// ---- 2. progressStore: consent-gated onboarding ---------------------------
assert(progressStore.getState().onboarded === false, 'onboarded defaults to false');
assert(progressStore.getState().ageBand === '12-15', 'ageBand default is 12-15 pre-onboarding');
progressStore.completeOnboarding('8-11');
assert(progressStore.getState().onboarded === true, 'completeOnboarding sets onboarded');
assert(progressStore.getState().ageBand === '8-11', 'completeOnboarding stores chosen age band');
assert(
  progressStore.getState().sessionId.startsWith('nn-'),
  'sessionId stays pseudonymous (nn- prefix, no PII)',
);

const storeSrc = readFileSync(join(SRC, 'data', 'progressStore.ts'), 'utf8');
assert(
  storeSrc.includes("onboarded === true") && storeSrc.includes('InMemoryAdapter()'),
  'boot adapter reads device storage only when consent was recorded',
);

// Settings persistence must be consent-gated too (no pre-consent writes,
// e.g. picking a language during onboarding must not touch localStorage).
const settingsSrc = readFileSync(join(SRC, 'data', 'settingsStore.ts'), 'utf8');
assert(
  (settingsSrc.match(/hasRecordedConsent\(\)/g) ?? []).length >= 2,
  'settings load AND save are both gated on recorded guardian consent',
);
assert(/flush\(\)/.test(settingsSrc), 'settingsStore exposes flush() for the moment consent is given');

// ---- 3. settingsStore: ambient sound --------------------------------------
assert(settingsStore.getState().ambientSound === true, 'ambientSound defaults to ON');
settingsStore.update({ ambientSound: false });
assert(settingsStore.getState().ambientSound === false, 'ambientSound toggles off');
settingsStore.update({ ambientSound: true });

// ---- 4. Static scans: zero PII, Get Help always visible, quiet audio ------
const onboardingSrc = readFileSync(join(SRC, 'onboarding', 'OnboardingFlow.tsx'), 'utf8');
assert(
  !/type="text"|<textarea|type="email"|type="tel"|type="number"/.test(onboardingSrc),
  'onboarding has NO free-text/PII inputs (choices + checkbox only)',
);
assert(onboardingSrc.includes('type="checkbox"'), 'onboarding consent uses a checkbox');
assert(
  onboardingSrc.includes('completeOnboarding'),
  'Start button routes through consent-gated completeOnboarding',
);
assert(
  onboardingSrc.indexOf('completeOnboarding') < onboardingSrc.indexOf('settingsStore.flush()'),
  'settings flush happens AFTER consent is recorded',
);
assert(!EMOJI_RE.test(onboardingSrc), 'OnboardingFlow source has no emojis');
assert(
  /disabled=\{!consented/.test(onboardingSrc),
  'Start button is disabled until the guardian checks consent',
);

const hudSrc = readFileSync(join(SRC, 'ui', 'HUD.tsx'), 'utf8');
assert(
  /\{!onboarded && <OnboardingFlow \/>\}/.test(hudSrc),
  'HUD shows onboarding until completed',
);
assert(
  /\{onboarded && <AvatarWidget \/>\}/.test(hudSrc),
  'guide appears only after onboarding (needs age band)',
);
assert(
  /<HelpDialog \/>/.test(hudSrc) && !/onboarded && <HelpDialog/.test(hudSrc),
  'Get Help Now stays unconditionally mounted — visible during onboarding too',
);

const ambientSrc = readFileSync(join(SRC, 'audio', 'ambient.ts'), 'utf8');
assert(/AMBIENT_VOLUME = 0\.1\d*/.test(ambientSrc), 'ambient volume is quiet (~0.1)');
assert(ambientSrc.includes('loop = true'), 'ambient audio loops');
assert(ambientSrc.includes('ambientSound'), 'ambient playback is gated on the setting');
assert(ambientSrc.includes('.catch(() => {})'), 'ambient failures are silent (never break the app)');

console.log(`\nAll ${count} onboarding/consent/audio assertions passed.`);
