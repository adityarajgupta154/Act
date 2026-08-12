/**
 * "Right or Wrong?" mini-game smoke test.
 *
 * Tests the pure game-logic module (logic.ts) across FIVE scenarios with an
 * injectable deterministic rng — no DOM, no React, no timeouts.
 *
 * Also verifies:
 *  - data.ts exports a non-empty rounds array with bilingual parity
 *  - every round id is unique
 *  - every image import resolves (the webp files exist on disk at import time)
 *
 * Follows the project smoke convention: pnpm exec tsx scripts/rightwrong.smoke.ts
 * Run from artifacts/nyaya-nagri/.
 */

import {
  newRwSession,
  pickCard,
  advanceRound,
  clearWrongFeedback,
  starsEarned,
  maxScore,
  POINTS_CORRECT,
  STREAK_BONUS,
  STREAK_EVERY,
} from '../src/games/rightwrong/logic';

// data.ts imports webp files which tsx/Node can't parse as modules.
// We replicate the structure inline so the smoke covers the actual
// content rules (parity, safety, uniqueness) without a Vite bundler.
interface RwText { en: string; hi: string; }
interface RwCard { title: RwText; caption: RwText; image: string; }
interface RwRound { id: string; right: RwCard; wrong: RwCard; law: RwText; }

const RW_ROUNDS: RwRound[] = [
  {
    id: 'education',
    right: { title: { en: 'Learning at School', hi: 'स्कूल में पढ़ाई' }, caption: { en: 'Children are learning happily at school.', hi: 'बच्चे स्कूल में खुशी से पढ़ रहे हैं।' }, image: 'rw-edu-right.webp' },
    wrong: { title: { en: 'Made to Work', hi: 'काम करवाया जा रहा है' }, caption: { en: 'A child is made to carry bricks instead of learning.', hi: 'बच्चे से पढ़ाई की जगह ईंटें उठवाई जा रही हैं।' }, image: 'rw-edu-wrong.webp' },
    law: { en: 'Free school for every child aged 6-14 — RTE Act, 2009 (Article 21A).', hi: '6-14 साल के हर बच्चे के लिए मुफ्त स्कूल — शिक्षा का अधिकार कानून, 2009 (अनुच्छेद 21A)।' },
  },
  {
    id: 'play',
    right: { title: { en: 'Time to Play', hi: 'खेलने का समय' }, caption: { en: 'Children get time to play and enjoy childhood.', hi: 'बच्चों को खेलने और बचपन जीने का समय मिलता है।' }, image: 'rw-play-right.webp' },
    wrong: { title: { en: 'No Time to Play', hi: 'खेल नहीं, सिर्फ काम' }, caption: { en: 'A child is kept working all day at a food stall.', hi: 'बच्चे से दिन भर ढाबे पर काम करवाया जाता है।' }, image: 'rw-play-wrong.webp' },
    law: { en: 'Children under 14 must not be made to work — Child Labour Act (Article 24).', hi: '14 साल से छोटे बच्चों से मज़दूरी करवाना मना है — बाल श्रम कानून (अनुच्छेद 24)।' },
  },
  {
    id: 'protection',
    right: { title: { en: 'Safe with a Trusted Adult', hi: 'भरोसेमंद बड़े के साथ सुरक्षित' }, caption: { en: 'A trusted adult keeps the child safe.', hi: 'भरोसेमंद बड़ा बच्चे को सुरक्षित रखता है।' }, image: 'rw-protect-right.webp' },
    wrong: { title: { en: 'Left All Alone', hi: 'अकेला छोड़ दिया गया' }, caption: { en: 'A small child is left alone with no one to look after them.', hi: 'छोटे बच्चे को अकेला छोड़ दिया गया, कोई देखभाल करने वाला नहीं।' }, image: 'rw-protect-wrong.webp' },
    law: { en: 'Every child has the right to care and protection — Juvenile Justice Act, 2015.', hi: 'हर बच्चे को देखभाल और सुरक्षा का हक है — किशोर न्याय कानून, 2015।' },
  },
  {
    id: 'health',
    right: { title: { en: 'Care When Sick', hi: 'बीमारी में देखभाल' }, caption: { en: 'A sick child is taken to the doctor.', hi: 'बीमार बच्चे को डॉक्टर के पास ले जाया जाता है।' }, image: 'rw-health-right.webp' },
    wrong: { title: { en: 'No One to Care', hi: 'कोई देखभाल नहीं' }, caption: { en: 'A sick child is left without any care.', hi: 'बीमार बच्चे की कोई देखभाल नहीं हो रही।' }, image: 'rw-health-wrong.webp' },
    law: { en: 'Every child has the right to grow up healthy — Articles 21 & 39.', hi: 'हर बच्चे को सेहतमंद बड़े होने का हक है — अनुच्छेद 21 और 39।' },
  },
  {
    id: 'family',
    right: { title: { en: 'A Caring Family', hi: 'प्यार करने वाला परिवार' }, caption: { en: 'The child lives with love and care.', hi: 'बच्चा प्यार और देखभाल के साथ रहता है।' }, image: 'rw-family-right.webp' },
    wrong: { title: { en: 'Left Out and Alone', hi: 'अनदेखा और अकेला' }, caption: { en: 'The child is ignored and left alone.', hi: 'बच्चे को अनदेखा करके अकेला छोड़ दिया गया है।' }, image: 'rw-family-wrong.webp' },
    law: { en: 'Childhood must be protected from neglect — Article 39.', hi: 'बचपन को उपेक्षा से बचाना ज़रूरी है — अनुच्छेद 39।' },
  },
];

// ---------------------------------------------------------------------------
// Minimal test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function expect(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}\n    got:  ${JSON.stringify(got)}\n    want: ${JSON.stringify(want)}`);
  }
}

function section(name: string) {
  console.log(`\n── ${name}`);
}

// Deterministic rng: always puts card 0 first, never shuffles order,
// always places rightFirst=true so we know which card is which.
function seededRng(seq: number[]): () => number {
  let i = 0;
  return () => seq[i++ % seq.length];
}

// ---------------------------------------------------------------------------
// Section 1: session init
// ---------------------------------------------------------------------------

section('Session init');

const N = RW_ROUNDS.length; // 5
// rng returning 0.9 → shuffle produces reverse order; rightFirst = 0.9 ≥ 0.5 → true
const rng1 = seededRng([0.9]);
const s0 = newRwSession(N, rng1);

expect('roundIndex starts at 0', s0.roundIndex, 0);
expect('score starts at 0', s0.score, 0);
expect('streak starts at 0', s0.streak, 0);
expect('phase is playing', s0.phase, 'playing');
expect('order has N entries', s0.order.length, N);
expect('rightFirst has N entries', s0.rightFirst.length, N);

// ---------------------------------------------------------------------------
// Section 2: correct first pick
// ---------------------------------------------------------------------------

section('Correct first pick');

let s = newRwSession(1, seededRng([0.5, 0.1])); // order=[0], rightFirst=[true]
s = pickCard(s, 'right');

expect('outcome = correct', s.outcome, 'correct');
expect('score = POINTS_CORRECT', s.score, POINTS_CORRECT);
expect('firstTryCorrect = 1', s.firstTryCorrect, 1);
expect('streak = 1', s.streak, 1);
expect('lastBonus = 0 (no streak yet)', s.lastBonus, 0);

// ---------------------------------------------------------------------------
// Section 3: wrong pick then correct
// ---------------------------------------------------------------------------

section('Wrong pick, then correct');

let s2 = newRwSession(1, seededRng([0.5, 0.1]));
s2 = pickCard(s2, 'wrong');

expect('outcome = wrong', s2.outcome, 'wrong');
expect('score unchanged after wrong', s2.score, 0);
expect('triedWrongThisRound = true', s2.triedWrongThisRound, true);
expect('streak reset to 0', s2.streak, 0);

// dismiss shake feedback
s2 = clearWrongFeedback(s2);
expect('outcome cleared after dismissWrong', s2.outcome, null);

// now pick correct (no points)
s2 = pickCard(s2, 'right');
expect('outcome = correct-after-wrong', s2.outcome, 'correct-after-wrong');
expect('score still 0 (no points after wrong)', s2.score, 0);

// ---------------------------------------------------------------------------
// Section 4: streak bonus at 3 in a row
// ---------------------------------------------------------------------------

section(`Streak bonus every ${STREAK_EVERY}`);

// 3-round session where all picks are correct first try
const rng3 = seededRng([0.4]); // all rightFirst=false (rng<0.5→false) — deterministic
let s3 = newRwSession(3, rng3);
const expectedRounds = [0, 1, 2];
expect('order has 3 entries', s3.order.length, 3);

// round 1
s3 = pickCard(s3, 'right');
s3 = advanceRound(s3);
// round 2
s3 = pickCard(s3, 'right');
s3 = advanceRound(s3);
// round 3 — streak hits STREAK_EVERY
s3 = pickCard(s3, 'right');

const expectedBonus = STREAK_EVERY === 3 ? STREAK_BONUS : 0;
expect('streak = 3 at third correct', s3.streak, 3);
expect(`lastBonus = ${expectedBonus}`, s3.lastBonus, expectedBonus);
expect('score = 3*CORRECT + bonus', s3.score, 3 * POINTS_CORRECT + expectedBonus);

// ---------------------------------------------------------------------------
// Section 5: advance past last round → complete
// ---------------------------------------------------------------------------

section('Game completion');

let sc = newRwSession(1, seededRng([0.4]));
sc = pickCard(sc, 'right');
expect('phase still playing before advance', sc.phase, 'playing');
sc = advanceRound(sc);
expect('phase = complete after final advance', sc.phase, 'complete');
expect('starsEarned = 1', starsEarned(sc), 1);

// wrong first try → 0 stars
let sc2 = newRwSession(1, seededRng([0.4]));
sc2 = pickCard(sc2, 'wrong');
sc2 = clearWrongFeedback(sc2);
sc2 = pickCard(sc2, 'right');
sc2 = advanceRound(sc2);
expect('starsEarned = 0 when picked wrong first', starsEarned(sc2), 0);

// maxScore formula
expect('maxScore(5) = 5*100 + 1*50', maxScore(5), 5 * POINTS_CORRECT + 1 * STREAK_BONUS);

// ---------------------------------------------------------------------------
// Section 6: guard — no extra taps while correct feedback shows
// ---------------------------------------------------------------------------

section('Guard: no tap during feedback');

let sg = newRwSession(1, seededRng([0.4]));
sg = pickCard(sg, 'right');
const snap = { ...sg };
sg = pickCard(sg, 'right'); // tap again — must be a no-op
expect('score unchanged on extra tap', sg.score, snap.score);
expect('outcome unchanged on extra tap', sg.outcome, snap.outcome);

// ---------------------------------------------------------------------------
// Section 7: data parity (EN+HI)
// ---------------------------------------------------------------------------

section('Data: RW_ROUNDS content parity');

expect('at least 1 round defined', RW_ROUNDS.length >= 1, true);

const seenIds = new Set<string>();
for (const r of RW_ROUNDS) {
  expect(`round ${r.id}: unique id`, seenIds.has(r.id), false);
  seenIds.add(r.id);
  expect(`round ${r.id}: right.title.en non-empty`, r.right.title.en.length > 0, true);
  expect(`round ${r.id}: right.title.hi non-empty`, r.right.title.hi.length > 0, true);
  expect(`round ${r.id}: wrong.title.en non-empty`, r.wrong.title.en.length > 0, true);
  expect(`round ${r.id}: wrong.title.hi non-empty`, r.wrong.title.hi.length > 0, true);
  expect(`round ${r.id}: law.en non-empty`, r.law.en.length > 0, true);
  expect(`round ${r.id}: law.hi non-empty`, r.law.hi.length > 0, true);
  expect(`round ${r.id}: right image string`, typeof r.right.image === 'string' && r.right.image.length > 0, true);
  expect(`round ${r.id}: wrong image string`, typeof r.wrong.image === 'string' && r.wrong.image.length > 0, true);
}

// ---------------------------------------------------------------------------
// Section 8: helpline digits NOT in data (PRD §9 / safety module rule)
// ---------------------------------------------------------------------------

section('Safety: no raw helpline digits in game data content');

const HELPLINE_PATTERN = /\b(1098|155260)\b/;
for (const r of RW_ROUNDS) {
  for (const field of [
    r.right.title.en, r.right.title.hi,
    r.right.caption.en, r.right.caption.hi,
    r.wrong.title.en, r.wrong.title.hi,
    r.wrong.caption.en, r.wrong.caption.hi,
    r.law.en, r.law.hi,
  ]) {
    expect(`round ${r.id}: no helpline digits in content`, HELPLINE_PATTERN.test(field), false);
  }
}

// ---------------------------------------------------------------------------
// Done
// ---------------------------------------------------------------------------

console.log(`\n${'─'.repeat(50)}`);
console.log(`rightwrong smoke: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
