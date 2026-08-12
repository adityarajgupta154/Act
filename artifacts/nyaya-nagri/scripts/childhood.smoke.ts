/**
 * "Right to Childhood" drag-and-drop game smoke — drives the REAL pure
 * engine (src/games/childhood/logic.ts) and REAL content (content.ts)
 * under tsx with a seeded rng. No DOM, no React, no network.
 *
 *   pnpm exec tsx scripts/childhood.smoke.ts
 *
 * Guards:
 *  1. content invariants — 3 rounds × 3 rights × 4 options with EXACTLY
 *     one distractor (correctRight: null) per round; every non-null
 *     correctRight resolves 1:1 to a round right; EN/HI parity with real
 *     Devanagari; no emojis; law fact on every right; awareness note on
 *     every distractor; helpline digits banned in game copy (PRD §9.2 —
 *     the Get Help pill is the ONLY helpline pathway).
 *  2. illustration convention — src/assets/games/childhood/ch-<optionId>.webp
 *     exists for every option (+ ch-bg.webp) and data.ts binds each one.
 *  3. engine rules — correct drop locks (+100), round clear adds +100,
 *     wrong drops never subtract and never place, THE DISTRACTOR CAN
 *     NEVER LOCK INTO ANY SLOT, hints are limited and never place a card,
 *     stars are 3/2/1 and never 0, a perfect run scores exactly maxScore.
 *  4. removal — the old "Right or Wrong?" game is fully gone from src/
 *     and scripts/ (dirs, assets, references).
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CH_ROUNDS } from '../src/games/childhood/content';
import {
  newChSession,
  dropOption,
  nextRound,
  clearFeedback,
  useHint,
  clearHint,
  starsEarned,
  maxScore,
  HINTS_TOTAL,
  POINTS_CORRECT,
  ROUND_BONUS,
  type ChSession,
} from '../src/games/childhood/logic';

let pass = 0;
const fails: string[] = [];
function check(name: string, cond: boolean) {
  if (cond) pass += 1;
  else fails.push(name);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSET_DIR = join(ROOT, 'src/assets/games/childhood');

/** Deterministic rng (mulberry32) so shuffles are reproducible. */
function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEVANAGARI = /[\u0900-\u097F]/;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
// The Get Help pill (PRD §9.1-9.2) is the only place helplines may appear.
const HELPLINES = /\b(1098|155260|112|100)\b/;

// ---------------------------------------------------------------------------
// 1. Content invariants
// ---------------------------------------------------------------------------
check('three rounds', CH_ROUNDS.length === 3);
check('round ids unique', new Set(CH_ROUNDS.map((r) => r.id)).size === CH_ROUNDS.length);

const allOptionIds: string[] = [];
const allText: string[] = [];
for (const round of CH_ROUNDS) {
  const rid = round.id;
  check(`${rid}: 3 rights`, round.rights.length === 3);
  check(`${rid}: 4 options`, round.options.length === 4);
  check(
    `${rid}: right ids unique in round`,
    new Set(round.rights.map((r) => r.id)).size === round.rights.length,
  );
  const distractors = round.options.filter((o) => o.correctRight === null);
  check(`${rid}: exactly one distractor`, distractors.length === 1);
  check(`${rid}: distractor carries a note`, !!distractors[0]?.note);
  for (const o of round.options) {
    allOptionIds.push(o.id);
    allText.push(o.label.en, o.label.hi);
    if (o.note) allText.push(o.note.en, o.note.hi);
    if (o.correctRight !== null) {
      check(
        `${rid}/${o.id}: correctRight resolves`,
        round.rights.some((r) => r.id === o.correctRight),
      );
      check(`${rid}/${o.id}: non-distractor has no note`, !o.note);
    }
  }
  for (const r of round.rights) {
    allText.push(r.title.en, r.title.hi, r.law.en, r.law.hi);
    const matches = round.options.filter((o) => o.correctRight === r.id);
    check(`${rid}/${r.id}: exactly one matching option`, matches.length === 1);
    check(`${rid}/${r.id}: law fact present`, r.law.en.length > 10 && r.law.hi.length > 10);
  }
}
check('option ids globally unique', new Set(allOptionIds).size === allOptionIds.length);
check('12 options total', allOptionIds.length === 12);

for (const round of CH_ROUNDS) {
  for (const r of round.rights) {
    check(`${round.id}/${r.id}: hi title uses Devanagari`, DEVANAGARI.test(r.title.hi));
    check(`${round.id}/${r.id}: hi law uses Devanagari`, DEVANAGARI.test(r.law.hi));
  }
  for (const o of round.options) {
    check(`${round.id}/${o.id}: hi label uses Devanagari`, DEVANAGARI.test(o.label.hi));
    check(`${round.id}/${o.id}: en/hi differ`, o.label.en !== o.label.hi);
  }
}
check('no emojis anywhere in game copy', allText.every((s) => !EMOJI.test(s)));
check('no helpline digits in game copy', allText.every((s) => !HELPLINES.test(s)));

// ---------------------------------------------------------------------------
// 2. Illustration convention + data bindings
// ---------------------------------------------------------------------------
const dataSrc = readFileSync(join(ROOT, 'src/games/childhood/data.ts'), 'utf8');
for (const id of allOptionIds) {
  const file = join(ASSET_DIR, `ch-${id}.webp`);
  check(`asset ch-${id}.webp exists`, existsSync(file) && statSync(file).size > 1000);
  check(`data.ts binds ch-${id}.webp`, dataSrc.includes(`ch-${id}.webp`));
}
check('backdrop ch-bg.webp exists', existsSync(join(ASSET_DIR, 'ch-bg.webp')));
check('data.ts binds the backdrop', dataSrc.includes('ch-bg.webp'));

// ---------------------------------------------------------------------------
// 3. Engine rules (seeded — fully deterministic)
// ---------------------------------------------------------------------------
const rng = seededRng(42);
let s = newChSession(CH_ROUNDS, rng);
check('starts on round 0', s.roundIndex === 0 && s.phase === 'playing');
check('starts at score 0', s.score === 0 && s.wrongAttempts === 0);
check(`starts with ${HINTS_TOTAL} hints`, s.hintsLeft === HINTS_TOTAL);
check('slot orders cover every round', s.slotOrder.length === CH_ROUNDS.length);
check('tray orders cover every round', s.trayOrder.length === CH_ROUNDS.length);
CH_ROUNDS.forEach((round, i) => {
  check(
    `round ${i} slot order is a permutation of rights`,
    [...s.slotOrder[i]].sort().join() === round.rights.map((r) => r.id).sort().join(),
  );
  check(
    `round ${i} tray order is a permutation of options`,
    [...s.trayOrder[i]].sort().join() === round.options.map((o) => o.id).sort().join(),
  );
});
const s2 = newChSession(CH_ROUNDS, seededRng(7));
check(
  'different seeds shuffle differently',
  JSON.stringify(s2.trayOrder) !== JSON.stringify(s.trayOrder) ||
    JSON.stringify(s2.slotOrder) !== JSON.stringify(s.slotOrder),
);

const distractorOf = (i: number) => CH_ROUNDS[i].options.find((o) => o.correctRight === null)!;
const correctPairs = (i: number) =>
  CH_ROUNDS[i].options
    .filter((o) => o.correctRight !== null)
    .map((o) => ({ optionId: o.id, rightId: o.correctRight! }));

// Hints: point at a real unplaced non-distractor, decrement, never place.
let h = newChSession(CH_ROUNDS, seededRng(3));
for (let n = 1; n <= HINTS_TOTAL; n++) {
  h = useHint(CH_ROUNDS, h);
  check(`hint ${n} decrements`, h.hintsLeft === HINTS_TOTAL - n);
  check(`hint ${n} targets something`, h.hint !== null);
  if (h.hint) {
    const opt = CH_ROUNDS[0].options.find((o) => o.id === h.hint!.optionId);
    check(`hint ${n} targets a non-distractor`, !!opt && opt.correctRight === h.hint.rightId);
    check(`hint ${n} never places`, Object.keys(h.placed).length === 0);
  }
  h = clearHint(h);
  check(`hint ${n} clears`, h.hint === null);
}
const exhausted = useHint(CH_ROUNDS, h);
check('hint at 0 is a no-op', exhausted === h && exhausted.hintsLeft === 0);

// Full playthrough: distractor everywhere first (never locks), then solve.
let expectedScore = 0;
let expectedWrong = 0;
for (let i = 0; i < CH_ROUNDS.length; i++) {
  check(`round ${i}: playing`, s.phase === 'playing' && s.roundIndex === i);
  const d = distractorOf(i);
  for (const right of CH_ROUNDS[i].rights) {
    const before = s;
    s = dropOption(CH_ROUNDS, s, d.id, right.id);
    expectedWrong += 1;
    check(`round ${i}: distractor never locks on ${right.id}`, !s.placed[right.id]);
    check(
      `round ${i}: distractor feedback on ${right.id}`,
      s.feedback?.kind === 'distractor' && s.feedback.optionId === d.id,
    );
    check(`round ${i}: distractor costs no points`, s.score === before.score);
    s = clearFeedback(s);
  }
  // One deliberate wrong (non-distractor onto the wrong slot) in round 0.
  if (i === 0) {
    const pairs = correctPairs(0);
    const wrongTarget = pairs.find((p) => p.rightId !== pairs[0].rightId)!;
    s = dropOption(CH_ROUNDS, s, pairs[0].optionId, wrongTarget.rightId);
    expectedWrong += 1;
    check('wrong drop gives wrong feedback', s.feedback?.kind === 'wrong');
    check('wrong drop never places', !Object.values(s.placed).includes(pairs[0].optionId));
    check('wrong drop costs no points', s.score === 0);
    s = clearFeedback(s);

    // Hint clears when its card locks in correctly.
    s = useHint(CH_ROUNDS, s);
    check('mid-game hint targets current round', s.hint !== null);
  }
  for (const [n, pair] of correctPairs(i).entries()) {
    s = dropOption(CH_ROUNDS, s, pair.optionId, pair.rightId);
    const cleared = n === 2;
    expectedScore += POINTS_CORRECT + (cleared ? ROUND_BONUS : 0);
    check(`round ${i}: correct #${n + 1} locks`, s.placed[pair.rightId] === pair.optionId);
    check(
      `round ${i}: correct #${n + 1} scores`,
      s.score === expectedScore &&
        s.feedback?.kind === 'correct' &&
        s.feedback.gained === POINTS_CORRECT + (cleared ? ROUND_BONUS : 0) &&
        s.feedback.roundCleared === cleared,
    );
    check(`round ${i}: hint cleared by drop`, s.hint === null);
  }
  check(`round ${i}: round clears`, s.phase === (i === CH_ROUNDS.length - 1 ? 'roundClear' : 'roundClear'));

  // Guards while cleared: no drops, no hints.
  const d2 = distractorOf(i);
  check('drop during roundClear is a no-op', dropOption(CH_ROUNDS, s, d2.id, CH_ROUNDS[i].rights[0].id) === s);
  check('hint during roundClear is a no-op', useHint(CH_ROUNDS, s) === s);
  s = nextRound(CH_ROUNDS, s);
}
check('game completes after last round', s.phase === 'complete');
check('completed score is maxScore', s.score === maxScore(CH_ROUNDS));
check('maxScore is 1200', maxScore(CH_ROUNDS) === 1200);
check('wrong attempts tallied gently', s.wrongAttempts === expectedWrong);
check('many wrongs still earn 1 star (never 0)', starsEarned(s) === 1);
check('distractor ids never placed anywhere', CH_ROUNDS.every(
  (_, i) => !Object.values(s.placed).includes(distractorOf(i).id),
));

// Star ladder + no-op guards on a clean run.
let clean = newChSession(CH_ROUNDS, seededRng(9));
check('nextRound while playing is a no-op', nextRound(CH_ROUNDS, clean) === clean);
check('unknown option is a no-op', dropOption(CH_ROUNDS, clean, 'nope', CH_ROUNDS[0].rights[0].id) === clean);
check('unknown right is a no-op', dropOption(CH_ROUNDS, clean, distractorOf(0).id, 'nope') === clean);
for (let i = 0; i < CH_ROUNDS.length; i++) {
  const pairs = correctPairs(i);
  clean = dropOption(CH_ROUNDS, clean, pairs[0].optionId, pairs[0].rightId);
  const filled = dropOption(CH_ROUNDS, clean, pairs[1].optionId, pairs[0].rightId);
  check(`round ${i}: filled slot rejects drops`, filled === clean);
  const replay = dropOption(CH_ROUNDS, clean, pairs[0].optionId, pairs[1].rightId);
  check(`round ${i}: placed card cannot re-drop`, replay === clean);
  clean = dropOption(CH_ROUNDS, clean, pairs[1].optionId, pairs[1].rightId);
  clean = dropOption(CH_ROUNDS, clean, pairs[2].optionId, pairs[2].rightId);
  clean = nextRound(CH_ROUNDS, clean);
}
check('flawless run earns 3 stars', clean.phase === 'complete' && starsEarned(clean) === 3);
check('a few wrongs earn 2 stars', starsEarned({ ...clean, wrongAttempts: 3 } as ChSession) === 2);
check('star floor is 1, never 0', starsEarned({ ...clean, wrongAttempts: 99 } as ChSession) === 1);

// ---------------------------------------------------------------------------
// 4. Old "Right or Wrong?" game fully removed
// ---------------------------------------------------------------------------
check('rightwrong module dir gone', !existsSync(join(ROOT, 'src/games/rightwrong')));
check('rightwrong assets dir gone', !existsSync(join(ROOT, 'src/assets/games/rightwrong')));
check('rightwrong smoke gone', !existsSync(join(ROOT, 'scripts/rightwrong.smoke.ts')));

const SELF = fileURLToPath(import.meta.url);
const staleFiles: string[] = [];
function walk(dir: string) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(ts|tsx|css)$/.test(entry.name) && p !== SELF) {
      if (/rightwrong/i.test(readFileSync(p, 'utf8'))) staleFiles.push(p);
    }
  }
}
walk(join(ROOT, 'src'));
walk(join(ROOT, 'scripts'));
check(`no stale rightwrong references (${staleFiles.join(', ') || 'none'})`, staleFiles.length === 0);

const stringsSrc = readFileSync(join(ROOT, 'src/i18n/strings.ts'), 'utf8');
check('strings.ts has no rw* keys left', !/\brw[A-Z]/.test(stringsSrc));
check('strings.ts ships EN+HI game chrome', (stringsSrc.match(/chTitle:/g) ?? []).length >= 3);

// ---------------------------------------------------------------------------
console.log(`childhood smoke: ${pass} checks passed, ${fails.length} failed`);
if (fails.length > 0) {
  for (const f of fails) console.error(`  FAIL: ${f}`);
  process.exit(1);
}
