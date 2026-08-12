/**
 * Smoke: the "Safe Path Adventure" maze game (zone1's game-first lesson).
 *
 * Run: pnpm exec tsx scripts/safepath.smoke.ts
 *
 * Guards (same ethos as childhood.smoke.ts — checks that break loudly when
 * someone rewires the game):
 *  1. Level registry shape — 5 named levels, exactly L1+L2 playable.
 *  2. Grid invariants — rectangular, one S/one Z, every obstacle char
 *     placed exactly once, S→Z reachable, and a run that avoids EVERY
 *     unsafe spot is impossible (a decision is always forced).
 *  3. Content safety — bilingual (EN≠HI, Devanagari present), no emoji,
 *     NO helpline digits in any copy (PRD §9.2 — the pill owns the
 *     number), choices exactly 2-with-1-correct, quizzes 5×3-with-1.
 *  4. Deterministic engine walkthrough — a scripted full run of Level 1
 *     with exact score/lives/stars expectations, plus lives-out → try
 *     again, hint budget, and no-double-checkpoint-pay rules.
 *  5. Assets + wiring — webp bindings exist, gameFlows routes zone1 with
 *     continueTo 'levels' and NO story reward, GameQuestFlow mounts the
 *     game, and the safepath module NEVER touches progressStore (the
 *     lesson gate has exactly one write site — story.smoke enumerates it).
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SP_LEARNINGS, SP_LEVELS, type SpText } from '../src/games/safepath/content';
import {
  newSpSession,
  spMove,
  spDecide,
  spAckSafe,
  spTryAgain,
  spUseHint,
  spStars,
  spMaxScore,
  findCell,
  SP_HINT_STEPS,
  SP_HINTS,
  SP_LIVES,
  type SpDir,
  type SpLevel,
} from '../src/games/safepath/logic';

let passed = 0;
const fails: string[] = [];
function check(name: string, cond: boolean) {
  if (cond) passed++;
  else fails.push(name);
}
const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(join(here, rel), 'utf8');

/* ── 1. registry ─────────────────────────────────────────────────────── */
check('five named levels', SP_LEVELS.length === 5);
check(
  'exactly levels 1+2 are playable (3-5 coming soon)',
  SP_LEVELS.filter((l) => l.playable).length === 2 &&
    SP_LEVELS[0].playable &&
    SP_LEVELS[1].playable,
);
check('level ids unique', new Set(SP_LEVELS.map((l) => l.id)).size === SP_LEVELS.length);
check(
  'level numbers are 1..5 in order',
  SP_LEVELS.every((l, i) => l.n === i + 1),
);

/* ── 2. content safety ───────────────────────────────────────────────── */
const DEVANAGARI = /[\u0900-\u097F]/;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
// The Get Help pill owns the numbers (PRD §9.2) — game copy never carries
// helplines (1098/155260/112/100).
const HELPLINE = /\b(1098|155260|112|100)\b/;

const texts: { where: string; tx: SpText }[] = [];
const pushT = (where: string, tx: SpText) => texts.push({ where, tx });
for (const lv of SP_LEVELS) {
  pushT(`${lv.id}.title`, lv.title);
  pushT(`${lv.id}.mission`, lv.mission);
  for (const ob of lv.obstacles) {
    pushT(`${lv.id}.${ob.id}.title`, ob.title);
    pushT(`${lv.id}.${ob.id}.prompt`, ob.prompt);
    pushT(`${lv.id}.${ob.id}.lesson`, ob.lesson);
    for (const c of ob.choices ?? []) {
      pushT(`${lv.id}.${ob.id}.${c.id}.label`, c.label);
      pushT(`${lv.id}.${ob.id}.${c.id}.feedback`, c.feedback);
    }
  }
  for (const q of lv.quiz) {
    pushT(`${lv.id}.${q.id}.q`, q.q);
    pushT(`${lv.id}.${q.id}.explain`, q.explain);
    for (const o of q.options) pushT(`${lv.id}.${q.id}.${o.id}`, o.label);
  }
}
SP_LEARNINGS.forEach((l, i) => pushT(`learning.${i}`, l));

for (const { where, tx } of texts) {
  check(`${where}: EN + HI both present`, tx.en.trim().length > 0 && tx.hi.trim().length > 0);
  check(`${where}: EN differs from HI`, tx.en !== tx.hi);
  check(`${where}: HI is Devanagari`, DEVANAGARI.test(tx.hi));
  check(`${where}: EN has no Devanagari`, !DEVANAGARI.test(tx.en));
  check(`${where}: no emoji`, !EMOJI.test(tx.en) && !EMOJI.test(tx.hi));
  check(`${where}: no helpline digits`, !HELPLINE.test(tx.en) && !HELPLINE.test(tx.hi));
}
check('exactly five learnings on the result screen', SP_LEARNINGS.length === 5);

/* ── 3. grid + choice invariants (playable levels) ───────────────────── */
type Pos = { r: number; c: number };
const DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
function reach(grid: string[], from: Pos, blocked: (ch: string) => boolean): Set<string> {
  const R = grid.length;
  const C = grid[0].length;
  const seen = new Set<string>([`${from.r},${from.c}`]);
  const q: Pos[] = [from];
  while (q.length) {
    const cur = q.shift()!;
    for (const [dr, dc] of DIRS) {
      const r = cur.r + dr;
      const c = cur.c + dc;
      if (r < 0 || c < 0 || r >= R || c >= C) continue;
      const ch = grid[r][c];
      if (ch === '#' || blocked(ch)) continue;
      const k = `${r},${c}`;
      if (seen.has(k)) continue;
      seen.add(k);
      q.push({ r, c });
    }
  }
  return seen;
}

for (const lv of SP_LEVELS.filter((l) => l.playable)) {
  const g = lv.grid;
  check(`${lv.id}: grid is rectangular`, g.length > 0 && g.every((row) => row.length === g[0].length));
  const flat = g.join('');
  const count = (ch: string) => flat.split(ch).length - 1;
  check(`${lv.id}: exactly one start`, count('S') === 1);
  check(`${lv.id}: exactly one Safe Zone goal`, count('Z') === 1);
  check(`${lv.id}: at least one checkpoint flag`, count('C') >= 1);

  const obChars = lv.obstacles.map((o) => o.ch);
  check(`${lv.id}: obstacle chars unique`, new Set(obChars).size === obChars.length);
  check(`${lv.id}: obstacle ids unique`, new Set(lv.obstacles.map((o) => o.id)).size === lv.obstacles.length);
  for (const ob of lv.obstacles) {
    check(`${lv.id}: '${ob.ch}' placed exactly once`, count(ob.ch) === 1);
  }
  const legal = new Set(['#', '.', 'S', 'Z', 'C', ...obChars]);
  check(`${lv.id}: only legal grid chars`, [...flat].every((ch) => legal.has(ch)));

  const unsafe = lv.obstacles.filter((o) => o.kind === 'unsafe');
  const safe = lv.obstacles.filter((o) => o.kind === 'safe');
  check(`${lv.id}: four unsafe decision spots`, unsafe.length === 4);
  check(`${lv.id}: two safe spots`, safe.length === 2);
  for (const ob of unsafe) {
    check(
      `${lv.id}.${ob.id}: exactly 2 choices, exactly 1 correct`,
      (ob.choices ?? []).length === 2 && (ob.choices ?? []).filter((c) => c.correct).length === 1,
    );
  }
  for (const ob of safe) {
    check(`${lv.id}.${ob.id}: safe spots carry no choices`, !ob.choices || ob.choices.length === 0);
  }

  const S = findCell(g, 'S');
  const all = reach(g, S, () => false);
  const Z = findCell(g, 'Z');
  check(`${lv.id}: goal reachable from start`, all.has(`${Z.r},${Z.c}`));
  check(
    `${lv.id}: every walkable cell connected (no orphan corridors)`,
    [...flat].filter((ch) => ch !== '#').length === all.size,
  );
  const unsafeSet = new Set(unsafe.map((o) => o.ch));
  const dodge = reach(g, S, (ch) => unsafeSet.has(ch));
  check(
    `${lv.id}: a run avoiding ALL unsafe spots is impossible (decision forced)`,
    !dodge.has(`${Z.r},${Z.c}`),
  );

  // Junctions: real route choice, not a single rail.
  let junctions = 0;
  for (let r = 0; r < g.length; r++)
    for (let c = 0; c < g[0].length; c++) {
      if (g[r][c] === '#') continue;
      let n = 0;
      for (const [dr, dc] of DIRS) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= g.length || cc >= g[0].length) continue;
        if (g[rr][cc] !== '#') n++;
      }
      if (n >= 3) junctions++;
    }
  check(`${lv.id}: at least two junctions (route choice exists)`, junctions >= 2);

  check(`${lv.id}: exactly five safety-check questions`, lv.quiz.length === 5);
  for (const q of lv.quiz) {
    check(
      `${lv.id}.${q.id}: 3 options, exactly 1 correct, ids unique`,
      q.options.length === 3 &&
        q.options.filter((o) => o.correct).length === 1 &&
        new Set(q.options.map((o) => o.id)).size === 3,
    );
  }
}

/* ── 4. deterministic engine walkthrough (Level 1) ───────────────────── */
const L1: SpLevel = SP_LEVELS[0];
let cur = newSpSession(L1);
let lastEvent = '';
const mv = (dir: SpDir) => {
  const r = spMove(L1, cur, dir);
  cur = r.s;
  lastEvent = r.event.type;
  return r.event;
};

check('start: player on S with full hearts + hints', cur.pos.r === findCell(L1.grid, 'S').r && cur.pos.c === findCell(L1.grid, 'S').c && cur.lives === SP_LIVES && cur.hintsLeft === SP_HINTS && cur.score === 0);
mv('up');
check('walls block (top edge)', lastEvent === 'blocked');
mv('left');
check('walls block (left edge)', lastEvent === 'blocked');

for (let i = 0; i < 4; i++) mv('right');
check('corridor walk emits moved', lastEvent === 'moved');
mv('right');
check('stepping onto an unsafe spot raises its decision card', lastEvent === 'obstacle' && cur.pendingCh === 'a');
mv('right');
check('movement is frozen while a card is open', lastEvent === 'none');

const aOb = L1.obstacles.find((o) => o.ch === 'a')!;
const aWrong = (aOb.choices ?? []).find((c) => !c.correct)!;
const aRight = (aOb.choices ?? []).find((c) => c.correct)!;
let dec = spDecide(L1, cur, aWrong.id);
cur = dec.s;
check(
  'wrong pick: one heart lost, back at checkpoint, no points lost',
  dec.event.type === 'wrong' && cur.lives === SP_LIVES - 1 && cur.pos.r === 0 && cur.pos.c === 0 && cur.pendingCh === null && cur.score === 0,
);
for (let i = 0; i < 5; i++) mv('right');
check('uncleared spot asks again on return', lastEvent === 'obstacle');
dec = spDecide(L1, cur, aRight.id);
cur = dec.s;
check(
  'correct pick: +100, spot cleared, safe decision counted',
  dec.event.type === 'correct' && cur.score === 100 && !!cur.cleared['a'] && cur.safeDecisions === 1,
);

mv('right');
mv('right');
mv('down');
mv('down');
check('safe spot raises its card', lastEvent === 'safe' && cur.pendingCh === 'T');
let ack = spAckSafe(L1, cur);
cur = ack.s;
check(
  'safe spot: +50 and it becomes the new checkpoint',
  ack.event.type === 'safeCollected' && cur.score === 150 && cur.checkpoint.r === 2 && cur.checkpoint.c === 7,
);

mv('down');
mv('down');
mv('left');
mv('left');
mv('left');
check('checkpoint flag pays +50 once', lastEvent === 'checkpoint' && cur.score === 200 && !!cur.flagsTaken['4,4']);
mv('left');
mv('right');
check('re-crossing a taken flag pays nothing', lastEvent === 'moved' && cur.score === 200);

mv('right');
mv('down');
mv('down');
check('second forced decision on the lower connector', lastEvent === 'obstacle' && cur.pendingCh === 'c');
const cOb = L1.obstacles.find((o) => o.ch === 'c')!;
dec = spDecide(L1, cur, (cOb.choices ?? []).find((c) => !c.correct)!.id);
cur = dec.s;
check(
  'wrong pick respawns at the LAST checkpoint (the flag), not the start',
  dec.event.type === 'wrong' && cur.lives === SP_LIVES - 2 && cur.pos.r === 4 && cur.pos.c === 4,
);
mv('right');
mv('down');
mv('down');
dec = spDecide(L1, cur, (cOb.choices ?? []).find((c) => c.correct)!.id);
cur = dec.s;
check('second correct decision: score 300', dec.event.type === 'correct' && cur.score === 300 && cur.safeDecisions === 2);

mv('down');
mv('down');
for (let i = 0; i < 5; i++) mv('left');
check('dead-end reward: the P safe spot', lastEvent === 'safe' && cur.pendingCh === 'P');
ack = spAckSafe(L1, cur);
cur = ack.s;
check('P collected: score 350, checkpoint moves there', ack.event.type === 'safeCollected' && cur.score === 350 && cur.checkpoint.c === 0);

for (let i = 0; i < 11; i++) mv('right');
check(
  'reaching Z: +200 goal bonus, run complete at 550',
  lastEvent === 'goal' && cur.reachedGoal && cur.score === 350 + 200,
);
mv('right');
check('no movement after the goal', lastEvent === 'none');
check('two wrong picks on the way ⇒ two stars (never zero)', cur.wrongDecisions === 2 && spStars(cur) === 2 && cur.lives === 1);
check('level 1 max score is 750', spMaxScore(L1) === 750);

/* lives-out → gentle try-again */
let s2 = newSpSession(L1);
for (let round = 0; round < 3; round++) {
  for (let i = 0; i < 5; i++) s2 = spMove(L1, s2, 'right').s;
  const d = spDecide(L1, s2, aWrong.id);
  s2 = d.s;
  if (round < 2) check(`lives-out drill: wrong pick ${round + 1} costs a heart`, d.event.type === 'wrong');
  else check('third wrong pick: hearts gone, gentle pause (not game over)', d.event.type === 'lostLives' && s2.outOfLives && s2.lives === 0);
}
check('no movement while out of hearts', spMove(L1, s2, 'right').event.type === 'none');
s2 = spTryAgain(s2);
check(
  'try again: hearts refill, back to checkpoint, score kept',
  s2.lives === SP_LIVES && !s2.outOfLives && s2.pos.r === 0 && s2.pos.c === 0,
);

/* hint budget */
let s3 = newSpSession(L1);
const h1 = spUseHint(L1, s3);
check('hint 1: returns a short path and burns one bulb', !!h1 && h1.path.length > 0 && h1.path.length <= SP_HINT_STEPS && h1.s.hintsLeft === SP_HINTS - 1);
check('hint never moves the player', !!h1 && h1.s.pos.r === s3.pos.r && h1.s.pos.c === s3.pos.c);
if (h1) {
  const chain = [s3.pos, ...h1.path];
  check(
    'hint path is a connected walkable chain',
    h1.path.every((p) => L1.grid[p.r][p.c] !== '#') &&
      chain.every(
        (p, i) => i === 0 || Math.abs(p.r - chain[i - 1].r) + Math.abs(p.c - chain[i - 1].c) === 1,
      ),
  );
  const h2 = spUseHint(L1, h1.s);
  check('hint 2: second bulb burns', !!h2 && h2.s.hintsLeft === 0);
  check('hint 3: budget exhausted → null', h2 ? spUseHint(L1, h2.s) === null : false);
}
let s4 = newSpSession(L1);
for (let i = 0; i < 5; i++) s4 = spMove(L1, s4, 'right').s;
check('no hints while a decision card is open', spUseHint(L1, s4) === null);

/* Level 2 sanity: same engine, mirrored park */
const L2 = SP_LEVELS[1];
const s5 = newSpSession(L2);
check('level 2 starts on its own S', s5.pos.r === findCell(L2.grid, 'S').r && s5.pos.c === findCell(L2.grid, 'S').c);
check('level 2 hints work too', spUseHint(L2, s5) !== null);

/* ── 5. assets + wiring ──────────────────────────────────────────────── */
const ASSETS = [
  'sp-park-bg.webp',
  'sp-path-tile.webp',
  'sp-player.webp',
  'sp-safezone.webp',
  'sp-complete-banner.webp',
  'sp-secret-phone.webp',
  'sp-online-contact.webp',
  'sp-gift-bribe.webp',
  'sp-boundary.webp',
  'sp-trusted-adult.webp',
  'sp-safe-place.webp',
  'sp-password.webp',
  'sp-teacher.webp',
];
const dataSrc = read('../src/games/safepath/data.ts');
for (const f of ASSETS) {
  const p = join(here, '../src/assets/games/safepath', f);
  check(`asset ${f} exists and is real`, existsSync(p) && statSync(p).size > 1000);
  check(`asset ${f} is imported by data.ts`, dataSrc.includes(f));
}
for (const lv of SP_LEVELS.filter((l) => l.playable))
  for (const ob of lv.obstacles)
    check(`data.ts binds art for '${ob.id}'`, dataSrc.includes(`'${ob.id}'`));

const flows = read('../src/quests/gameFlows.ts');
check(
  "gameFlows: zone1 runs the maze with continueTo 'levels' and NO story reward",
  flows.includes("zoneId: 'zone1'") &&
    flows.includes("videoId: 'safe-path-adventure'") &&
    flows.includes('storyLevelId: null') &&
    flows.includes("continueTo: 'levels'"),
);
const gqf = read('../src/quests/GameQuestFlow.tsx');
check('GameQuestFlow mounts the maze for zone1', gqf.includes('<SafePathGame'));
check(
  "GameQuestFlow: 'levels' flows continue into the regular LevelSelect arc",
  gqf.includes('<LevelSelect') && gqf.includes("flow.continueTo === 'levels'"),
);
// The lesson gate has ONE write site (GameQuestFlow's onComplete —
// story.smoke enumerates it). The game module itself must stay pure.
for (const rel of [
  '../src/games/safepath/content.ts',
  '../src/games/safepath/logic.ts',
  '../src/games/safepath/data.ts',
  '../src/games/safepath/SafePathGame.tsx',
  '../src/games/safepath/SpCompletionPanel.tsx',
]) {
  const src = read(rel);
  check(
    `${rel.replace('../src/', '')}: never touches the progress store`,
    !src.includes('progressStore') && !src.includes('markVideoWatched'),
  );
  check(
    `${rel.replace('../src/', '')}: deterministic — no fetch/AI usage`,
    !/fetch\(|@workspace\/api-client|GoogleGenAI|genai/i.test(src),
  );
}
const css = read('../src/index.css');
check(
  'index.css ships the sp-* animation block (with reduced-motion off-switch)',
  css.includes('sp-hint-pulse') && css.includes('sp-goal-glow') && css.includes('.sp-shake'),
);
const strings = read('../src/i18n/strings.ts');
check(
  'strings.ts carries the sp* chrome strings in both languages',
  strings.includes("spTitle: 'Safe Path Adventure'") && strings.includes('सुरक्षित राह का सफ़र'),
);

/* ── completion screen (reference-image recreation, Aug 2026) ──────────── */
// ONE shared panel (SpCompletionPanel) renders the reference design on BOTH
// surfaces: the in-game success phase AND zone1's completed landing card.
const game = read('../src/games/safepath/SafePathGame.tsx');
const panel = read('../src/games/safepath/SpCompletionPanel.tsx');
check(
  'completion panel: chrome copy is wired through i18n, never pasted inline',
  panel.includes('t.spDidIt') &&
    panel.includes('t.spYouAreChampion') &&
    panel.includes('t.spGameCompleted') &&
    panel.includes('t.spBackToMap') &&
    panel.includes('t.chPlayAgain') &&
    game.includes('t.spTagline') &&
    game.includes('t.spAwarenessTag'),
);
check(
  'in-game success: shared panel with three REAL actions — exit, quiz Continue, restart',
  game.includes('<SpCompletionPanel') &&
    game.includes("setPhase('quiz')") &&
    game.includes('startMaze') &&
    game.includes('resetRun(levelIdx)'),
);
check(
  "landing card: zone1's completed state renders the SAME panel from the maze's real last run",
  gqf.includes('isSafePath && gameDone ? (') &&
    gqf.includes('<SpCompletionPanel') &&
    gqf.includes('onRunStats={rememberSpRun}') &&
    gqf.includes('stats={spLastRun}') &&
    gqf.includes('setPlayingGame(true)') &&
    gqf.includes('t.chRibbonDone') &&
    game.includes('onRunStats?.('),
);
check(
  'completion panel: stats bind LIVE run values (score / safe choices / time), no pasted demo numbers',
  game.includes('session.score') &&
    game.includes('session.safeDecisions') &&
    game.includes('session.wrongDecisions') &&
    panel.includes('stats.score') &&
    panel.includes('stats.safeDecisions') &&
    panel.includes('stats.wrongDecisions') &&
    panel.includes('fmtTime(stats.elapsedSec)') &&
    !game.includes('03:25') &&
    !panel.includes('03:25') &&
    !game.includes('450') &&
    !panel.includes('450'),
);
check(
  'completion screen: &spphase preview seam stays DEV-gated (prod must never skip the maze into the quiz)',
  /import\.meta\.env\.DEV[^]{0,300}spphase/.test(game) && game.includes("get('spphase')"),
);
check(
  'strings.ts: completion-screen strings exist in EN and HI',
  strings.includes("spDidIt: 'You did it!'") &&
    strings.includes('तुमने कर दिखाया') &&
    strings.includes("spBackToMap: 'Back to Map'") &&
    strings.includes('नक्शे पर वापस'),
);
check(
  'spDidItSub keeps exactly one |SZ| marker per language (the component splits on it)',
  (strings.match(/spDidItSub: '[^']*'/g) ?? []).length === 2 &&
    (strings.match(/spDidItSub: '[^']*'/g) ?? []).every((l) => (l.match(/\|SZ\|/g) ?? []).length === 1),
);

/* ── intro screen (reference-image recreation, Aug 2026) ───────────────── */
check(
  'intro + success share ONE scenery component (no forked backdrop markup)',
  game.includes('function SpSceneryLayers') && (game.match(/<SpSceneryLayers/g) ?? []).length >= 2,
);
check(
  'intro: live level data + i18n — badge, mission, 3 how-to rows, kbd hint, Start CTA wired to the maze',
  game.includes('t.spLevelLabel(level.n, SP_LEVELS.length)') &&
    game.includes('tx(level.mission)') &&
    game.includes('t.spMission1') &&
    game.includes('t.spMission2') &&
    game.includes('t.spMission3') &&
    game.includes('t.spMoveKeys') &&
    game.includes('t.spStartCta') &&
    game.includes('onClick={startMaze}'),
);
{
  // scope hero/icon assertions to the intro branch itself so maze-phase
  // usage can never satisfy them (architect-review hardening)
  const iStart = game.indexOf("if (phase === 'intro')");
  const iEnd = game.indexOf("if (phase === 'success')");
  const intro = iStart >= 0 && iEnd > iStart ? game.slice(iStart, iEnd) : '';
  check(
    'intro branch itself renders scenery + guide-boy hero + the 3 lucide chips (not the placeholder player blob)',
    intro.includes('<SpSceneryLayers') &&
      intro.includes('SP_HERO_URL') &&
      intro.includes('<Footprints') &&
      intro.includes('<MessageCircleQuestionMark') &&
      intro.includes('<ShieldCheck') &&
      !intro.includes('SP_PLAYER_URL'),
  );
  check(
    'safepath art set is exactly the 13 known sp-*.webp files (intro added NO new art)',
    (() => {
      const files = readdirSync(join(here, '../src/assets/games/safepath')).filter((f) => f.endsWith('.webp'));
      return files.length === 13 && files.every((f) => f.startsWith('sp-'));
    })(),
  );
}

/* ── report ──────────────────────────────────────────────────────────── */
if (fails.length) {
  console.error(`✗ safepath smoke: ${fails.length} FAILED (of ${passed + fails.length})`);
  for (const f of fails) console.error('  -', f);
  process.exit(1);
}
console.log(`✓ safepath smoke: all ${passed} checks passed`);
