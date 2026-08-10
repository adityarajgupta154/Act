/**
 * Story Adventure smoke test (Aug 2026 round)
 * Run: pnpm dlx tsx scripts/story.smoke.ts
 *
 * Asserts the story-level invariants:
 *  - Level 1 "Right to Life": exactly 5 slides in INTRO → STORY → DIALOGUE
 *    → CHOICE → RESULT order; the child's captions kept VERBATIM; exactly
 *    two choices with exactly ONE hard-coded correct answer (PRD §9.8) and
 *    gentle feedback on both branches (§9.6).
 *  - Hindi twins present, Devanagari, no emojis anywhere.
 *  - Level 2 teaser has NO slides and stays locked until L1 completes
 *    (single pure lock rule) — and can never open even then (no slides).
 *  - Determinism: the story module contains no fetch/AI/api-client usage
 *    (spec §20 — no AI generation per slide).
 *  - Persistence: storyProgress sanitized at the load ingress;
 *    completeStoryLevel() idempotent + writes the reward badge atomically.
 *  - Geometry: the house entrance matches the WorldScene decor house and
 *    its prompt radius can never overlap a zone prompt.
 *  - Wiring: house tap/E-key/freeze in WorldScene, prompt + overlay in the
 *    HUD, RESULT-slide completion + choice gating + DEV seams in sources.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STRINGS } from '../src/i18n/strings';
import {
  STORY_LEVELS,
  STORY_ENTRANCE,
  STORY_PROXIMITY_SQ,
  getStoryLevel,
  isStoryLevelUnlockedIn,
} from '../src/story/storyData';
import { ZONES } from '../src/world/zones';
import { PROXIMITY_SQ } from '../src/world/phaser/const';
import { progressStore } from '../src/data/progressStore';
import { uiStore, openStory, closeStory } from '../src/ui/uiStore';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok - ${msg}`);
}

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(join(here, rel), 'utf8');

const DEVANAGARI_RE = /[\u0900-\u097F]/;
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;

// --- Level 1 data: shape + VERBATIM captions --------------------------------
const L1 = getStoryLevel('right-to-life');
assert(!!L1, 'Level 1 "right-to-life" exists');
assert(L1!.number === 1, 'Level 1 is numbered 1');
assert(L1!.slides.length === 5, 'Level 1 has exactly 5 slides');
assert(
  L1!.slides.map((s) => s.type).join(',') === 'INTRO,STORY,DIALOGUE,CHOICE,RESULT',
  'slide types run INTRO → STORY → DIALOGUE → CHOICE → RESULT',
);
assert(L1!.reward.en === 'Right to Life', 'reward name is "Right to Life"');

const CAPTIONS_VERBATIM = [
  'School se ghar lautte waqt Riya ek naye gaon ke raste se guzarti hai.',
  'Riya ki nazar Aman par padti hai. Aman bahut kamzor lag raha tha aur use zaroori care nahi mil pa rahi thi.',
  "Riya ne Aman se pucha, 'Tum theek ho? Kya tumhe kisi madad ki zaroorat hai?'",
  'Riya ke paas ek decision tha — kya wo Aman ki madad karegi?',
  'Riya ne seekha ki har bacche ko jeene, health care aur zaroori madad ka adhikar hota hai.',
];
CAPTIONS_VERBATIM.forEach((want, i) => {
  assert(L1!.slides[i].caption.en === want, `slide ${i + 1} EN caption is verbatim`);
});

// --- Slide artwork: the child's own files, wired verbatim --------------------
// (Under tsx, import.meta.env is undefined, so storyData's BASE_URL falls
// back to '/' — the URLs below are exact.)
const ART_SLIDES: Array<[number, string]> = [
  [0, 's1-intro.webp'],
  [1, 's2-problem.webp'],
  [2, 's3-dialogue.webp'],
  [4, 's5-result.webp'],
];
for (const [i, file] of ART_SLIDES) {
  assert(
    L1!.slides[i].image === `/story/${file}`,
    `slide ${i + 1} uses the user's own art (${file})`,
  );
  let bytes = 0;
  try {
    bytes = readFileSync(join(here, '../public/story', file)).length;
  } catch {
    bytes = 0;
  }
  assert(bytes > 10_000, `public/story/${file} exists and is non-trivial`);
}
assert(
  L1!.slides[3].image === null,
  'CHOICE slide stays image-free — that slide IS the game screen',
);

// --- The decision: two choices, ONE hard-coded correct (PRD §9.8) -----------
const choiceSlide = L1!.slides[3];
assert(!!choiceSlide.choices && choiceSlide.choices.length === 2, 'choice slide has exactly 2 options');
const [wrong, right] = choiceSlide.choices!;
assert(
  choiceSlide.choices!.filter((c) => c.correct).length === 1,
  'exactly ONE choice is marked correct — hard-coded, never computed',
);
assert(
  wrong.label.en === 'Chup chaap aage badh jao' && wrong.correct === false,
  'wrong choice label verbatim + correct:false',
);
assert(
  right.label.en === 'Aman ke liye help bulao' && right.correct === true,
  'correct choice label verbatim + correct:true',
);
assert(
  wrong.feedback.en === 'Riya agar Aman ko ignore kar de, to use zaroori madad nahi mil paayegi.',
  'gentle wrong-choice feedback verbatim (no guilt language)',
);
assert(
  right.feedback.en ===
    'Bilkul! Kisi bachche ko zaroori madad ki zaroorat ho, to kisi trusted adult ya doctor ki help lena important hai.',
  'correct-choice feedback verbatim',
);

// --- Hindi twins: present, Devanagari, no emojis -----------------------------
for (const level of STORY_LEVELS) {
  for (const s of level.slides) {
    assert(
      s.caption.hi.trim().length > 0 && DEVANAGARI_RE.test(s.caption.hi),
      `${level.id}/${s.id}: HI caption present + Devanagari`,
    );
    assert(
      !EMOJI_RE.test(s.caption.en) && !EMOJI_RE.test(s.caption.hi),
      `${level.id}/${s.id}: no emojis in captions`,
    );
    for (const c of s.choices ?? []) {
      assert(
        DEVANAGARI_RE.test(c.label.hi) && DEVANAGARI_RE.test(c.feedback.hi),
        `${level.id}/${s.id}/${c.id}: HI label + feedback are Devanagari`,
      );
    }
  }
}

// --- Level 2: locked teaser only ---------------------------------------------
const L2 = getStoryLevel('right-to-health');
assert(!!L2 && L2!.number === 2, 'Level 2 "right-to-health" teaser exists');
assert(L2!.slides.length === 0, 'Level 2 has NO slides (story deliberately not implemented)');
assert(isStoryLevelUnlockedIn({}, 'right-to-life'), 'L1 is always unlocked');
assert(!isStoryLevelUnlockedIn({}, 'right-to-health'), 'L2 locked while L1 incomplete');
assert(
  isStoryLevelUnlockedIn({ 'right-to-life': true }, 'right-to-health'),
  'L2 unlocks once L1 is complete',
);
assert(!isStoryLevelUnlockedIn({}, 'no-such-story'), 'unknown story id is never unlocked');

// --- openStory guard chain (uiStore) -----------------------------------------
openStory('right-to-health');
assert(uiStore.getState().activeStory === null, 'openStory refuses the locked/empty Level 2');
openStory('right-to-life', 2);
assert(
  uiStore.getState().activeStory?.id === 'right-to-life' &&
    uiStore.getState().activeStory?.initialSlide === 2,
  'openStory opens Level 1 (with the seam slide index)',
);
openStory('right-to-life');
assert(
  uiStore.getState().activeStory?.initialSlide === 2,
  'openStory is a no-op while a story is already open',
);
closeStory();
assert(uiStore.getState().activeStory === null, 'closeStory clears the overlay state');

// --- Persistence: completeStoryLevel + badge, idempotent ---------------------
assert(
  Object.keys(progressStore.getState().storyProgress).length === 0,
  'fresh state starts with empty storyProgress',
);
progressStore.completeStoryLevel('right-to-life');
assert(
  progressStore.getState().storyProgress['right-to-life'] === true,
  'completeStoryLevel records the completion',
);
assert(
  progressStore.getState().badges['story-right-to-life'] === true,
  'the reward badge rides the same atomic write',
);
const afterFirst = progressStore.getState();
progressStore.completeStoryLevel('right-to-life');
assert(
  progressStore.getState() === afterFirst,
  'completeStoryLevel is idempotent (second call is a no-op)',
);
openStory('right-to-health');
assert(
  uiStore.getState().activeStory === null,
  'even unlocked, the slide-less Level 2 teaser can never open',
);

// --- Geometry: entrance matches the decor house, prompts never overlap -------
assert(
  STORY_ENTRANCE.position[0] === 16 && STORY_ENTRANCE.position[1] === -12,
  'entrance sits at the existing decor house [16, -12] (map untouched)',
);
assert(STORY_PROXIMITY_SQ < PROXIMITY_SQ, 'story radius is tighter than zone radius');
const minGap = Math.sqrt(PROXIMITY_SQ) + Math.sqrt(STORY_PROXIMITY_SQ);
for (const z of ZONES) {
  const dx = STORY_ENTRANCE.position[0] - z.position[0];
  const dz = STORY_ENTRANCE.position[1] - z.position[1];
  assert(
    Math.hypot(dx, dz) > minGap,
    `zone ${z.id} anchor is far enough that both prompts can never show at once`,
  );
}

// --- Determinism: no fetch / AI / api-client in the story module -------------
for (const rel of ['../src/story/storyData.ts', '../src/story/StoryOverlay.tsx']) {
  const src = read(rel);
  assert(
    !/fetch\(|@workspace\/api-client|GoogleGenAI|genai|openai/i.test(src),
    `${rel.replace('../src/', '')}: deterministic — no fetch/AI/api-client usage`,
  );
}

// --- Source wiring literals ---------------------------------------------------
const worldScene = read('../src/world/phaser/WorldScene.ts');
assert(
  worldScene.includes('STORY_ENTRANCE') && worldScene.includes('decorateStoryHouse'),
  'WorldScene wires the story house entrance',
);
assert(
  worldScene.includes('nearbyStoryId') && worldScene.includes('STORY_PROXIMITY_SQ'),
  'WorldScene publishes story proximity',
);
assert(
  /activeZoneId \|\| activeStory \|\| isTransitioning/.test(worldScene),
  'movement + E-key freeze while a story is open',
);
assert(worldScene.includes('openStory('), 'E key / house tap enter the story');

const hud = read('../src/ui/HUD.tsx');
assert(hud.includes('<StoryPrompt') && hud.includes('<StoryOverlay'), 'HUD mounts prompt + overlay');
assert(hud.includes('storyEnterCta'), 'prompt uses the enter CTA string');

const overlay = read('../src/story/StoryOverlay.tsx');
assert(
  overlay.includes("slide.type === 'RESULT'") && overlay.includes('completeStoryLevel(level.id)'),
  'reaching the RESULT slide persists completion',
);
assert(
  overlay.includes("picked?.correct === true"),
  'forward navigation is gated on the correct choice',
);
assert(
  overlay.includes("'Escape'") && overlay.includes("'ArrowRight'") && overlay.includes("'ArrowLeft'"),
  'keyboard support: Escape / arrow keys',
);
assert(
  overlay.includes('duration-300') && overlay.includes('slide-in-from-right-6'),
  'slide transitions use the 300ms fade+slide (250-400ms window)',
);
assert(
  overlay.includes("get('story') !== 'open'") || overlay.includes("get('story') === 'open'"),
  'DEV screenshot seam ?story=open present in the overlay',
);

const store = read('../src/data/progressStore.ts');
assert(
  store.includes('sanitizeRecord(parsed.storyProgress, isBool)'),
  'storyProgress is sanitized at the load ingress',
);

const mainSrc = read('../src/main.tsx');
assert(mainSrc.includes("get('story') === 'open'"), 'main.tsx boots the ?story=open seam');

const progressScreen = read('../src/ui/ProgressScreen.tsx');
assert(
  progressScreen.includes('storyAdventuresHeading') && progressScreen.includes('STORY_LEVELS'),
  'My Progress shows the Story Adventures section',
);

// --- Chrome strings: EN/HI parity, Devanagari, no emojis ----------------------
const CHROME_KEYS = [
  'storyAdventure',
  'storyEnterCta',
  'storyTryAgain',
  'storyContinueExploring',
  'storyAdventuresHeading',
  'storyExit',
] as const;
for (const key of CHROME_KEYS) {
  const en = STRINGS.en[key] as string;
  const hi = STRINGS.hi[key] as string;
  assert(en.trim().length > 0 && hi.trim().length > 0, `${key}: EN and HI present`);
  assert(DEVANAGARI_RE.test(hi), `${key}: HI is Devanagari`);
  assert(!EMOJI_RE.test(en) && !EMOJI_RE.test(hi), `${key}: no emojis`);
}
assert(
  STRINGS.en.storyRewardUnlocked('Right to Life').includes('Right to Life') &&
    STRINGS.en.storyRewardUnlocked('X').includes('Unlocked'),
  'storyRewardUnlocked(EN) embeds the reward name',
);
assert(
  DEVANAGARI_RE.test(STRINGS.hi.storyRewardUnlocked('जीने का अधिकार')),
  'storyRewardUnlocked(HI) is Devanagari',
);
assert(STRINGS.en.storySlideOf(2, 5) === '2 / 5', 'storySlideOf formats "2 / 5"');
assert(
  STRINGS.en.storyLockedHint('Right to Life').includes('"Right to Life"'),
  'storyLockedHint names the blocking level',
);

console.log('\nstory smoke: ALL OK');
