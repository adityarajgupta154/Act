/**
 * Community content smoke test (Task 11)
 * Run: pnpm dlx tsx scripts/community.smoke.ts
 *
 * Asserts the standing safety rules for the Rights Community screen:
 * bilingual parity, pool sizes per the task spec, helpline digits intact
 * (1098 / 155260, never 1930), qualified legal wording, no emojis, a
 * deterministic completed-zones-first rotation, and — critically — that
 * the screen component contains NO free-text input of any kind.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BOARD_POSTS,
  CIRCLE_PROMPTS,
  EXPERT_FAQ,
  selectCirclePrompts,
  type LocalizedText,
} from '../src/community/content';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok - ${msg}`);
}

const DEVANAGARI_RE = /[\u0900-\u097F]/;
// Emoji / pictograph ranges (standing "no emojis anywhere" rule).
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;

const ALL_TEXTS: Array<{ where: string; text: LocalizedText }> = [];
for (const p of CIRCLE_PROMPTS) {
  ALL_TEXTS.push({ where: `${p.id}.prompt`, text: p.prompt });
  ALL_TEXTS.push({ where: `${p.id}.rightsNote`, text: p.rightsNote });
  p.options.forEach((o, i) => {
    ALL_TEXTS.push({ where: `${p.id}.option${i}.text`, text: o.text });
    ALL_TEXTS.push({ where: `${p.id}.option${i}.affirmation`, text: o.affirmation });
  });
}
for (const b of BOARD_POSTS) ALL_TEXTS.push({ where: `${b.id}.text`, text: b.text });
for (const f of EXPERT_FAQ) {
  ALL_TEXTS.push({ where: `${f.id}.question`, text: f.question });
  ALL_TEXTS.push({ where: `${f.id}.answer`, text: f.answer });
}

// --- Pool sizes per Task 11 spec -------------------------------------------
assert(CIRCLE_PROMPTS.length === 6, 'Rights Circle pool has 6 prompts');
assert(
  CIRCLE_PROMPTS.filter((p) => p.zoneId === null).length === 1,
  'exactly one general prompt in the pool',
);
const zoneIds = CIRCLE_PROMPTS.filter((p) => p.zoneId !== null).map((p) => p.zoneId);
assert(
  new Set(zoneIds).size === 5 &&
    ['zone1', 'zone2', 'zone3', 'zone4', 'zone5'].every((z) => zoneIds.includes(z)),
  'one circle prompt per zone (zone1..zone5)',
);
assert(
  BOARD_POSTS.length >= 5 && BOARD_POSTS.length <= 6,
  `board has 5-6 pre-written posts (got ${BOARD_POSTS.length})`,
);
assert(
  EXPERT_FAQ.length >= 8 && EXPERT_FAQ.length <= 10,
  `expert FAQ has 8-10 items (got ${EXPERT_FAQ.length})`,
);
assert(
  new Set([
    ...CIRCLE_PROMPTS.map((p) => p.id),
    ...BOARD_POSTS.map((b) => b.id),
    ...EXPERT_FAQ.map((f) => f.id),
  ]).size ===
    CIRCLE_PROMPTS.length + BOARD_POSTS.length + EXPERT_FAQ.length,
  'all content ids are unique',
);

// --- Structure --------------------------------------------------------------
for (const p of CIRCLE_PROMPTS) {
  assert(p.options.length === 3, `${p.id} has exactly 3 multiple-choice options`);
}
const promptIds = new Set(CIRCLE_PROMPTS.map((p) => p.id));
for (const b of BOARD_POSTS) {
  assert(promptIds.has(b.promptId), `${b.id} references a real prompt (${b.promptId})`);
  assert(
    ['8-11', '12-15', '16-18'].includes(b.ageBand),
    `${b.id} has a valid age band`,
  );
  assert(
    /^[A-Za-z]+_[0-9]{2}$/.test(b.handle),
    `${b.id} handle "${b.handle}" is pseudonymous (no spaces / real-name format)`,
  );
}
const faqZones = new Set(EXPERT_FAQ.map((f) => f.zoneId).filter(Boolean));
assert(
  ['zone1', 'zone2', 'zone3', 'zone4', 'zone5'].every((z) => faqZones.has(z)),
  'expert FAQ covers all five zones',
);

// --- Bilingual parity, Devanagari, no emojis --------------------------------
for (const { where, text } of ALL_TEXTS) {
  assert(
    text.en.trim().length > 0 && text.hi.trim().length > 0,
    `${where}: both EN and HI present`,
  );
  if (!DEVANAGARI_RE.test(text.hi)) {
    throw new Error(`FAIL: ${where}: HI text is not Devanagari`);
  }
  if (EMOJI_RE.test(text.en) || EMOJI_RE.test(text.hi)) {
    throw new Error(`FAIL: ${where}: contains emoji`);
  }
}
console.log(`ok - all ${ALL_TEXTS.length} localized texts: EN+HI parity, Devanagari HI, no emojis`);

// --- Helpline digits intact (never altered, never translated) ---------------
const corpus = ALL_TEXTS.flatMap(({ text }) => [text.en, text.hi]).join('\n');
assert(corpus.includes('1098'), 'Childline 1098 appears in community content');
assert(corpus.includes('155260'), 'Cyber Crime Helpline 155260 appears in community content');
assert(!corpus.includes('1930'), 'no stray 1930 (PRD mandates 155260)');
assert(!/[०-९]/.test(corpus), 'helpline/other digits are Western numerals, not Devanagari');
for (const { where, text } of ALL_TEXTS) {
  const enHas1098 = text.en.includes('1098');
  const hiHas1098 = text.hi.includes('1098');
  assert(
    enHas1098 === hiHas1098,
    `${where}: 1098 mention matches across languages`,
  );
  const enHasCyber = text.en.includes('155260');
  const hiHasCyber = text.hi.includes('155260');
  assert(
    enHasCyber === hiHasCyber,
    `${where}: 155260 mention matches across languages`,
  );
}

// --- Implication-only handling of sensitive topics (PRD §9.5) ---------------
// Sensitive Zone 1 subject matter must stay at the "unsafe touch / unsafe
// secret" framing level used by the quests — never explicit terminology.
const PROHIBITED_EXPLICIT = [/sexual/i, /यौन/, /rape/i, /बलात्कार/, /porn/i, /molest/i];
for (const re of PROHIBITED_EXPLICIT) {
  assert(!re.test(corpus), `no explicit sensitive terminology (${re})`);
}

// --- RTE accuracy guards -----------------------------------------------------
const rteFaq = EXPERT_FAQ.find((f) => f.id === 'faq_school_fees');
assert(!!rteFaq, 'RTE fees FAQ exists');
assert(
  rteFaq!.answer.en.includes('except minority institutions'),
  'EN RTE answer carries the non-minority qualifier on the 25 percent quota',
);
assert(
  rteFaq!.answer.hi.includes('अल्पसंख्यक संस्थानों को छोड़कर'),
  'HI RTE answer carries the non-minority qualifier on the 25 percent quota',
);
assert(
  rteFaq!.answer.en.includes('many states') && rteFaq!.answer.hi.includes('कई राज्य'),
  'uniforms claim is qualified (many states), not a universal statutory promise',
);

// --- Qualified legal wording -----------------------------------------------
const cyberFaq = EXPERT_FAQ.find((f) => f.id === 'faq_cyberbullying');
assert(!!cyberFaq, 'cyberbullying FAQ exists');
assert(
  cyberFaq!.answer.en.includes('can be an offence'),
  'EN cyberbullying answer uses qualified wording ("can be an offence")',
);
assert(
  cyberFaq!.answer.hi.includes('अपराध हो सकता है'),
  'HI cyberbullying answer uses qualified wording',
);
assert(
  !corpus.toLowerCase().includes('legal advice for you') &&
    !corpus.includes('guaranteed'),
  'no advice/outcome promises in content',
);

// --- Rotation / selection logic ----------------------------------------------
const none: Record<string, boolean> = {};
const sel0 = selectCirclePrompts(none, 0);
assert(sel0.length === 4, 'selection returns 4 prompts (task asks 3-4 visible)');
assert(sel0[0].zoneId === null, 'general prompt is always included first');
assert(
  JSON.stringify(selectCirclePrompts(none, 7).map((p) => p.id)) ===
    JSON.stringify(selectCirclePrompts(none, 7).map((p) => p.id)),
  'selection is deterministic for the same inputs',
);
assert(
  JSON.stringify(selectCirclePrompts(none, 0).map((p) => p.id)) !==
    JSON.stringify(selectCirclePrompts(none, 1).map((p) => p.id)),
  'day index rotates the mix',
);
const onlyZone3: Record<string, boolean> = { zone3: true };
for (let day = 0; day < 10; day++) {
  const sel = selectCirclePrompts(onlyZone3, day);
  assert(
    sel.some((p) => p.zoneId === 'zone3'),
    `completed-zone prompt (zone3) always shown (day ${day})`,
  );
}
const allDone: Record<string, boolean> = {
  zone1: true,
  zone2: true,
  zone3: true,
  zone4: true,
  zone5: true,
};
const days = new Set<string>();
for (let day = 0; day < 5; day++) {
  const sel = selectCirclePrompts(allDone, day);
  assert(sel.length === 4, `all-complete selection still returns 4 (day ${day})`);
  days.add(JSON.stringify(sel.map((p) => p.id)));
}
assert(days.size > 1, 'with all zones complete, rotation varies across days');

// --- No free-text input in the screen component ------------------------------
const here = dirname(fileURLToPath(import.meta.url));
const screenSrc = readFileSync(
  join(here, '../src/ui/CommunityScreen.tsx'),
  'utf8',
).toLowerCase();
assert(!screenSrc.includes('<input'), 'CommunityScreen has no <input>');
assert(!screenSrc.includes('<textarea'), 'CommunityScreen has no <textarea>');
assert(!screenSrc.includes('contenteditable'), 'CommunityScreen has no contentEditable');
const contentSrc = readFileSync(
  join(here, '../src/community/content.ts'),
  'utf8',
);
assert(
  contentSrc.includes('NGO') && contentSrc.toLowerCase().includes('moderation'),
  'content module carries the NGO/teacher moderation code comment',
);

console.log('\nAll community smoke tests passed.');
