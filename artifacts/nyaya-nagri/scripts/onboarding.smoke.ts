/**
 * Onboarding + consent + ambient audio + player avatar smoke test (Tasks 13-14)
 * Run: pnpm dlx tsx scripts/onboarding.smoke.ts
 *
 * Covers the standing safety rules for the new surfaces:
 *  - EN/HI string parity for every onboarding key, Devanagari, no emojis,
 *    Western numerals only, helpline digits intact.
 *  - progressStore: onboarded defaults to false; completeOnboarding() sets
 *    the age band + flag (consent-gated persistence).
 *  - settingsStore: ambientSound defaults to ON and toggles.
 *  - Static scans: the ONLY free-text input in the whole app is the game
 *    nickname (with "not your real name" guidance); no file/camera inputs
 *    exist anywhere; the HUD keeps Get Help Now visible during onboarding;
 *    the ambient loop is quiet, looping, and settings-gated.
 *  - Task 14 avatar: cartoon config only, sanitize round-trips, cosmetic
 *    only (quest engine/content never references it).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { STRINGS } from '../src/i18n/strings';
import { progressStore } from '../src/data/progressStore';
import { settingsStore } from '../src/data/settingsStore';
import {
  ACCESSORIES,
  FREE_ACCESSORIES,
  MAX_ACCESSORIES,
  createDefaultAvatar,
  HAIR_STYLES_FOR,
  OUTFITS_FOR,
  sanitizeAvatar,
  SKIN_TONES,
} from '../src/player/avatarConfig';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlayerAvatar } from '../src/player/PlayerAvatar';

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
  'avatarLiveNote',
  'welcomeTitle', 'welcomeBody', 'chooseLanguage', 'howItWorksTitle',
  'howOldAreYou', 'ageWhy', 'ageBandDesc811', 'ageBandDesc1215',
  'ageBandDesc1618', 'guardianTitle', 'guardianIntro', 'whatIsStoredTitle',
  'notStoredNote', 'consentCheckbox', 'prototypeNote', 'startPlaying',
  'next', 'back', 'ambientLabel', 'ambientHint',
  // Task 14 — avatar builder (+ Boy/Girl hero picker)
  'buildAvatarTitle', 'buildAvatarHint', 'characterLabel', 'baseLookLabel', 'skinToneLabel',
  'hairLabel', 'outfitLabel', 'accessoriesLabel', 'pickNickname',
  'nicknameHint', 'nicknamePlaceholder', 'editAvatar', 'saveChanges', 'cancel',
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
  assert(s.howItWorksCards.length === 4, `${lang}.howItWorksCards has 4 cards`);
  assert(
    s.howItWorksCards.every((c) => c.title.length > 0 && c.body.length > 0),
    `${lang}.howItWorksCards all have a title and a body`,
  );
  // Task 14: consent list gained the avatar/nickname disclosure item.
  assert(s.storedPoints.length === 4, `${lang}.storedPoints has 4 points (incl. avatar+nickname)`);
  assert(
    lang === 'en'
      ? /nickname/.test(s.storedPoints.join(' ')) && /never a real name/.test(s.storedPoints.join(' '))
      : s.storedPoints.join(' ').includes('निकनेम') && s.storedPoints.join(' ').includes('असली नाम नहीं'),
    `${lang} consent list discloses avatar + nickname storage (never a real name)`,
  );
  // Task 14: avatar builder option lists have full EN/HI parity. The
  // Boy/Girl hero task appended Ponytail (hair) and Kurti + Dress
  // (clothes) to the index-aligned name arrays, plus the two hero names.
  assert(s.characterNames.length === 2, `${lang}.characterNames has 2 entries (Boy, Girl)`);
  assert(s.baseLookNames.length === 2, `${lang}.baseLookNames has 2 entries`);
  assert(s.hairStyleNames.length === 5, `${lang}.hairStyleNames has 5 entries (incl. Ponytail)`);
  assert(s.outfitNames.length === 6, `${lang}.outfitNames has 6 entries (incl. Kurti, Dress)`);
  // Task 16 added 4 shop cosmetics: the name list must cover EVERY
  // renderer-known accessory id, while onboarding still offers only the
  // 6 free starter accessories (shop items need Coins bought by playing).
  assert(
    s.accessoryNames.length === ACCESSORIES.length,
    `${lang}.accessoryNames covers all ${ACCESSORIES.length} accessory ids`,
  );
  assert(FREE_ACCESSORIES.length === 6, 'free starter accessory set unchanged (6)');
  const avatarLists = [...s.characterNames, ...s.baseLookNames, ...s.hairStyleNames, ...s.outfitNames, ...s.accessoryNames].join(' ');
  assert(!EMOJI_RE.test(avatarLists), `${lang} avatar option names have no emojis`);
  // Nickname guidance must say it is NOT the child's real name.
  assert(
    lang === 'en'
      ? /not your real name/i.test(s.nicknameHint)
      : s.nicknameHint.includes('असली नाम नहीं'),
    `${lang} nickname hint says "not your real name"`,
  );
  const all = [...s.howItWorksCards.flatMap((c) => [c.title, c.body]), ...s.storedPoints].join(' ');
  assert(!EMOJI_RE.test(all), `${lang} onboarding lists have no emojis`);
  assert(
    s.howItWorksCards.some((c) => c.body.includes('1098')),
    `${lang} how-it-works mentions Childline 1098 (digits intact)`,
  );
  assert(!DEVANAGARI_DIGITS_RE.test(all), `${lang} lists use Western numerals only`);
  // Consent copy must be honest about storage: device-only, no names.
  assert(
    lang === 'en'
      ? s.notStoredNote.toLowerCase().includes('never asks for a real name')
      : s.notStoredNote.includes('कभी असली नाम'),
    `${lang} consent copy states no REAL name/photo/phone is ever asked`,
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
  DEVANAGARI_RE.test(STRINGS.hi.howItWorksCards.flatMap((c) => [c.title, c.body]).join(' ')),
  'hi.howItWorksCards is in Devanagari',
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
const consentSceneSrc = readFileSync(join(SRC, 'onboarding', 'ConsentScene.tsx'), 'utf8');
// Task 14: the ONLY free-text input in the app is the nickname inside
// AvatarBuilder.tsx — OnboardingFlow itself still has none.
assert(
  !/type="text"|<textarea|type="email"|type="tel"|type="number"/.test(onboardingSrc),
  'OnboardingFlow itself has NO free-text/PII inputs (nickname lives in AvatarBuilder)',
);
assert(
  !/type="text"|<textarea|type="email"|type="tel"|type="number"/.test(consentSceneSrc),
  'ConsentScene has NO free-text/PII inputs — the consent checkbox is its only control',
);
assert(consentSceneSrc.includes('type="checkbox"'), 'onboarding consent uses a checkbox');
assert(
  onboardingSrc.includes('completeOnboarding'),
  'Start button routes through consent-gated completeOnboarding',
);
assert(
  onboardingSrc.indexOf('completeOnboarding') < onboardingSrc.indexOf('settingsStore.flush()'),
  'settings flush happens AFTER consent is recorded',
);
assert(!EMOJI_RE.test(onboardingSrc), 'OnboardingFlow source has no emojis');
assert(!EMOJI_RE.test(consentSceneSrc), 'ConsentScene source has no emojis');
assert(
  /startDisabled=\{!consented \|\| !band\}/.test(onboardingSrc) &&
    /disabled=\{startDisabled\}/.test(consentSceneSrc),
  'Start button is disabled until the guardian checks consent (flow computes, scene wires)',
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
  // The mount may carry props (e.g. the onboarding-time card variant), but
  // it must never be conditionally RENDERED on onboarding state.
  /<HelpDialog[^>]*\/>/.test(hudSrc) && !/\{\s*!?onboarded\s*&&\s*<HelpDialog/.test(hudSrc),
  'Get Help Now stays unconditionally mounted — visible during onboarding too',
);

// ---- 5. Task 14: player avatar — cartoon-only, nickname-only, cosmetic ----

// sanitizeAvatar: valid config round-trips; junk is rejected or clamped.
const validAvatar = { ...createDefaultAvatar(), nickname: 'StarHero' };
assert(
  JSON.stringify(sanitizeAvatar(validAvatar)) === JSON.stringify(validAvatar),
  'sanitizeAvatar round-trips a valid config',
);
assert(sanitizeAvatar(null) === null, 'sanitizeAvatar(null) is null');
assert(
  sanitizeAvatar({ ...createDefaultAvatar(), nickname: '   ' }) === null,
  'blank nickname means no usable avatar (non-blank validation)',
);
const clamped = sanitizeAvatar({
  ...validAvatar,
  base: 'photo-upload',
  skinTone: '#000000',
  hair: 'mohawk',
  outfit: 'armor',
  accessories: ['glasses', 'cap', 'star', 'scarf', 'flower', 'backpack', 'sword'],
});
assert(clamped !== null && clamped.base === 'sunny' && clamped.hair === 'short', 'unknown ids fall back to safe defaults');
assert(clamped !== null && clamped.accessories.length === MAX_ACCESSORIES, `accessories clamp to ${MAX_ACCESSORIES}`);

// ---- 5b. Boy/Girl hero system: per-character lists, sanitize, dual drafts --

assert(createDefaultAvatar().character === 'boy', 'default hero stays boy (legacy behavior unchanged)');
const girlDefault = createDefaultAvatar('girl');
assert(
  girlDefault.character === 'girl' && girlDefault.hair === 'ponytail' && girlDefault.outfit === 'kurti',
  'girl default is her own config (ponytail + kurti), not the boy re-labelled',
);
// Legacy saves have no character field -> sanitize to boy, choices kept.
const legacy = sanitizeAvatar({
  base: 'sunny', skinTone: SKIN_TONES[1], hair: 'bun', outfit: 'hoodie',
  accessories: ['cap'], nickname: 'OldSave',
});
assert(
  legacy?.character === 'boy' && legacy.hair === 'bun' && legacy.outfit === 'hoodie',
  'legacy saves (no character field) sanitize to boy with their choices kept',
);
// Character-aware clamping: cross-character ids degrade to that hero's defaults.
const crossGirl = sanitizeAvatar({ ...girlDefault, nickname: 'Tara', outfit: 'kurta' });
assert(
  crossGirl?.character === 'girl' && crossGirl.outfit === 'kurti',
  'boy-only outfit on a girl falls back to her default kurti',
);
const crossBoy = sanitizeAvatar({ ...createDefaultAvatar(), nickname: 'Veer', hair: 'ponytail', outfit: 'dress' });
assert(
  crossBoy?.hair === 'short' && crossBoy.outfit === 'kurta',
  'girl-only hair/outfit on a boy fall back to his defaults',
);
const girlValid = { ...girlDefault, nickname: 'Tara' };
assert(
  JSON.stringify(sanitizeAvatar(girlValid)) === JSON.stringify(girlValid),
  'a valid girl config round-trips sanitizeAvatar',
);
// Option lists per the task brief: boy unchanged, girl female-appropriate.
assert(HAIR_STYLES_FOR.boy.length === 4 && OUTFITS_FOR.boy.length === 4, 'boy keeps his original 4 hair + 4 clothes options');
assert(
  HAIR_STYLES_FOR.girl.includes('ponytail') &&
    OUTFITS_FOR.girl.includes('kurti') && OUTFITS_FOR.girl.includes('dress') &&
    !OUTFITS_FOR.girl.includes('kurta') && !HAIR_STYLES_FOR.boy.includes('ponytail'),
  'girl offers Ponytail/Kurti/Dress; kurta stays boy-only, ponytail girl-only',
);
// The girl renders as her OWN art: identical hair/outfit ids (short +
// tshirt are valid for both heroes) must still produce different SVGs.
const boySvg = renderToStaticMarkup(
  createElement(PlayerAvatar, { config: { ...createDefaultAvatar(), hair: 'short', outfit: 'tshirt', nickname: 'X' } }),
);
const girlSvg = renderToStaticMarkup(
  createElement(PlayerAvatar, { config: { ...girlDefault, hair: 'short', outfit: 'tshirt', nickname: 'X' } }),
);
assert(boySvg.includes('<svg') && girlSvg.includes('<svg'), 'PlayerAvatar renders SVG for both heroes');
assert(boySvg !== girlSvg, 'same hair/outfit ids render DIFFERENT art for girl vs boy (own art, not a recolor)');
const girlDress = renderToStaticMarkup(createElement(PlayerAvatar, { config: { ...girlValid, outfit: 'dress' } }));
const girlKurti = renderToStaticMarkup(createElement(PlayerAvatar, { config: girlValid }));
assert(girlDress !== girlKurti, 'dress renders its own A-line silhouette (not the standard torso)');
// Dual-draft switch flow (the brief's exact test): customize boy -> switch
// to girl -> customize -> switch back; each draft must be exactly as left,
// with the one shared game nickname travelling across.
{
  let drafts = { boy: createDefaultAvatar('boy'), girl: createDefaultAvatar('girl') };
  let active: 'boy' | 'girl' = 'boy';
  const select = (c: 'boy' | 'girl') => {
    if (c === active) return;
    drafts = { ...drafts, [c]: { ...drafts[c], nickname: drafts[active].nickname } };
    active = c;
  };
  drafts = { ...drafts, boy: { ...drafts.boy, skinTone: SKIN_TONES[4], hair: 'curly', nickname: 'Hero1' } };
  select('girl');
  drafts = { ...drafts, girl: { ...drafts.girl, outfit: 'dress' } };
  select('boy');
  assert(drafts.boy.skinTone === SKIN_TONES[4] && drafts.boy.hair === 'curly', 'switching heroes never resets the boy draft');
  assert(drafts.girl.outfit === 'dress' && drafts.girl.nickname === 'Hero1', 'girl draft survives too; nickname is shared');
  assert(sanitizeAvatar(drafts[active])?.character === 'boy', 'Start saves the SELECTED hero with its own customization');
}
// Onboarding really keeps BOTH drafts (seeds one per hero).
assert(
  /createDefaultAvatar\('boy'\)/.test(onboardingSrc) && /createDefaultAvatar\('girl'\)/.test(onboardingSrc),
  'onboarding seeds independent boy AND girl drafts',
);

// progressStore: avatar defaults to null; setAvatar stores it.
assert(progressStore.getState().avatar === null || progressStore.getState().avatar !== undefined, 'avatar field exists on progress state');
progressStore.setAvatar(validAvatar);
assert(progressStore.getState().avatar?.nickname === 'StarHero', 'setAvatar stores the config in progressStore');

// Regression (architect round 1): malformed configs must be sanitized at
// EVERY persistence ingress — setAvatar drops junk instead of storing it,
// and the localStorage load path re-validates via sanitizeAvatar.
progressStore.setAvatar({ base: 'photo', hair: 'x', outfit: 'armor', nickname: '' } as never);
assert(
  progressStore.getState().avatar?.nickname === 'StarHero',
  'setAvatar rejects an invalid config (blank nickname) instead of persisting it',
);
progressStore.setAvatar({ ...validAvatar, outfit: 'armor' } as never);
assert(
  progressStore.getState().avatar?.outfit === 'kurta',
  'setAvatar clamps unknown outfit ids to a safe default before storing',
);
const progressSrc2 = readFileSync(join(SRC, 'data', 'progressStore.ts'), 'utf8');
assert(
  /const avatar = sanitizeAvatar\(parsed\.avatar\)/.test(progressSrc2),
  'localStorage load re-validates the avatar (malformed saves degrade to null, never crash)',
);
// Task 16 strengthened the same ingress: equipped shop cosmetics that were
// never bought are stripped at load AND at setAvatar.
assert(
  (progressSrc2.match(/filterToOwnedAccessories\(/g) ?? []).length >= 2,
  'load AND setAvatar filter equipped accessories to owned ones (Task 16)',
);
const editOverlaySrc = readFileSync(join(SRC, 'player', 'AvatarEditOverlay.tsx'), 'utf8');
assert(
  /sanitizeAvatar\(progressStore\.getState\(\)\.avatar\)/.test(editOverlaySrc),
  'Edit Avatar overlay seeds its draft through sanitizeAvatar',
);

// AvatarBuilder: exactly ONE text input (the nickname), with maxLength and
// the not-your-real-name hint wired in.
const builderSrc = readFileSync(join(SRC, 'player', 'AvatarBuilder.tsx'), 'utf8');
assert((builderSrc.match(/type="text"/g) ?? []).length === 1, 'AvatarBuilder has exactly one text input (nickname)');
assert(/maxLength=\{NICKNAME_MAX_LENGTH\}/.test(builderSrc), 'nickname input has a maxLength cap');
assert(builderSrc.includes('t.nicknameHint'), 'nickname input shows the not-your-real-name hint');
assert(!EMOJI_RE.test(builderSrc), 'AvatarBuilder source has no emojis');

// HARD RULE (PRD §7.2/§9.4): no photo upload, no camera, no biometrics —
// scan the ENTIRE src tree for file inputs / camera APIs.
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const allSrcFiles = walk(SRC).filter((p) => /\.(ts|tsx)$/.test(p));
// The Sarvam voice engine (approved Nyaya AI voice feature) is the ONE
// permitted getUserMedia caller — MICROPHONE only. The photo/camera ban
// stays absolute everywhere else, and the engine itself is asserted
// audio-only just below (no `video:` key, no ImageCapture).
const VOICE_ENGINE_SUFFIX = join('avatar', 'voice', 'sarvamVoice.ts');
for (const bad of ['type="file"', 'getUserMedia', 'capture=', 'ImageCapture']) {
  assert(
    allSrcFiles.every(
      (p) =>
        (bad === 'getUserMedia' && p.endsWith(VOICE_ENGINE_SUFFIX)) ||
        !readFileSync(p, 'utf8').includes(bad),
    ),
    `no ${bad} anywhere in src (no photo upload / camera access)`,
  );
}
const voiceEngineSrc = readFileSync(join(SRC, 'avatar', 'voice', 'sarvamVoice.ts'), 'utf8');
assert(
  !/video\s*:/.test(voiceEngineSrc) && !voiceEngineSrc.includes('ImageCapture'),
  'voice engine getUserMedia is AUDIO-ONLY (no video key, no ImageCapture)',
);

// Cosmetic only: quest engine + content resolution never touch the avatar.
for (const rel of [['quests', 'engine.ts'], ['quests', 'registry.ts']]) {
  const src = readFileSync(join(SRC, ...rel), 'utf8');
  assert(
    !/avatarConfig|PlayerAvatar|\bavatar\b/i.test(src),
    `${rel.join('/')} never references the player avatar (cosmetic only)`,
  );
}

// Onboarding gates Next on a non-blank nickname; start() trims + stores it.
// The gate is computed in the flow (nextDisabled) and wired onto the plaza
// scene's Next button — assert BOTH halves so neither can silently drop it.
assert(
  /nextDisabled=\{!avatar\.nickname\.trim\(\)\}/.test(onboardingSrc),
  'onboarding Next is disabled until the nickname is non-blank',
);
const makeHeroSrc = readFileSync(join(SRC, 'onboarding', 'MakeHeroScene.tsx'), 'utf8');
assert(
  makeHeroSrc.includes('disabled={nextDisabled}'),
  'MakeHeroScene wires the nickname gate onto its Next button',
);
assert(
  /nickname: avatar\.nickname\.trim\(\)/.test(onboardingSrc),
  'onboarding stores the trimmed nickname with the avatar config',
);
assert(
  onboardingSrc.indexOf('progressStore.update({ avatar') < onboardingSrc.indexOf('completeOnboarding(band)'),
  'avatar is placed in the store before consent finalizes persistence',
);

// HUD displays: minimap marker + corner chip, and an Edit Avatar overlay.
// Aug 2026 home redesign: the minimap card was EXTRACTED to src/ui/Minimap.tsx
// (shared by HUD and Home), so the face-marker check follows it there and the
// HUD check becomes "mounts the shared card".
const minimapSrc = readFileSync(join(SRC, 'ui', 'Minimap.tsx'), 'utf8');
assert(minimapSrc.includes('variant="face"'), 'minimap renders the avatar face marker');
assert(hudSrc.includes('<Minimap />'), 'HUD mounts the shared minimap card');
assert(hudSrc.includes('<AvatarEditOverlay />'), 'HUD mounts the Edit Avatar overlay');
const settingsPanelSrc = readFileSync(join(SRC, 'ui', 'SettingsPanel.tsx'), 'utf8');
assert(settingsPanelSrc.includes('openAvatarEdit'), 'Settings has an Edit Avatar entry');

const ambientSrc = readFileSync(join(SRC, 'audio', 'ambient.ts'), 'utf8');
assert(/AMBIENT_VOLUME = 0\.1\d*/.test(ambientSrc), 'ambient volume is quiet (~0.1)');
assert(ambientSrc.includes('loop = true'), 'ambient audio loops');
assert(ambientSrc.includes('ambientSound'), 'ambient playback is gated on the setting');
assert(ambientSrc.includes('.catch(() => {})'), 'ambient failures are silent (never break the app)');

console.log(`\nAll ${count} onboarding/consent/audio assertions passed.`);
