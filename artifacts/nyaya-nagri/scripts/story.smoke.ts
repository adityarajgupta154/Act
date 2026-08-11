/**
 * Story Adventure smoke test (Aug 2026 round)
 * Run: pnpm dlx tsx scripts/story.smoke.ts
 *
 * Asserts the story-level invariants:
 *  - Level 1 "Right to Life": exactly 5 slides in INTRO → STORY → DIALOGUE
 *    → CHOICE → RESULT order; the child's captions kept VERBATIM; exactly
 *    two choices with exactly ONE hard-coded correct answer (PRD §9.8) and
 *    gentle feedback on both branches (§9.6).
 *  - Level 2 "Clean Water, Healthy Life": the full 5-slide arc, captions
 *    VERBATIM, THREE options with exactly ONE correct, the task's own
 *    "ignore" feedback line + moral-line placements, and its art files.
 *  - Level map (Candy-Crush progression): generated from STORY_LEVELS with
 *    ZERO hard-coded level ids, ONE lock rule, locked-node hints, unlock
 *    cinematic gating, and the map/overlay/world DEV seams.
 *  - Hindi twins present, Devanagari, no emojis anywhere.
 *  - Levels stay locked until the previous completes (single pure rule);
 *    slide-less teaser levels can never open.
 *  - Determinism: story TEXT stays fixed — no fetch/AI/api-client in the
 *    data/overlay/engine/hook modules (spec §20). The Gemini STORY VOICE
 *    layer is the one sanctioned fetcher: audio-only, manifest ids only.
 *  - Persistence: storyProgress sanitized at the load ingress;
 *    completeStoryLevel() idempotent + writes the reward badge atomically.
 *  - Geometry: the house entrance matches the WorldScene decor house and
 *    its prompt radius can never overlap a zone prompt.
 *  - Wiring: house tap/E-key/freeze in WorldScene, prompt + overlay in the
 *    HUD, RESULT-slide completion + choice gating + DEV seams in sources.
 *  - Voice guide: GEMINI-ONLY story voice (device-voice engine deleted);
 *    the controller silent-completes without a browser
 *    (and still advances the sequence), reminder pacing is the strict
 *    flat 5s cadence (bug-fix spec §4), the reminder pool is varied EN/HI,
 *    every spoken line is digit-free (helpline digits live ONLY in Get
 *    Help), narration defaults ON, and the overlay/hook/engine/widget
 *    wiring literals are all present.
 *  - Gemini story voice (Aug 2026 upgrade): the client segment catalog and
 *    the api-server's generated TTS manifest match EXACTLY (drift guard),
 *    the manager has ONE fetch site (audio by manifest id — no free text,
 *    no keys), device-voice fallback stays wired, suspend silences it too.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STRINGS } from '../src/i18n/strings';
import {
  STORY_LEVELS,
  STORY_ENTRANCE,
  STORY_PROXIMITY_SQ,
  STORY_REMINDERS,
  getStoryLevel,
  isStoryLevelUnlockedIn,
} from '../src/story/storyData';
import { setNarrationSuspended } from '../src/story/storyNarrationState';
import { REMINDER_DELAYS_MS } from '../src/story/useStoryNarrator';
import {
  storyAdventureVoice,
  primeStoryAudioInGesture,
} from '../src/story/storyAdventureVoice';
import { enumerateAllStorySegments } from '../src/story/storyVoiceSegments';
import {
  LANG_TAGS,
  narrationSupported,
  speak as questSpeak,
  stopSpeaking,
} from '../src/a11y/narrator';
import { settingsStore } from '../src/data/settingsStore';
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

// --- Level 2: "Clean Water, Healthy Life" — the full 5-slide story ------------
const L2 = getStoryLevel('right-to-health');
assert(!!L2 && L2!.number === 2, 'Level 2 "right-to-health" exists, numbered 2');
assert(L2!.title.en === 'Clean Water, Healthy Life', 'L2 title verbatim (task §6)');
assert(L2!.reward.en === 'Right to Health & Care', 'L2 reward is "Right to Health & Care"');
assert(L2!.slides.length === 5, 'Level 2 has the full 5-slide arc');
assert(
  L2!.slides.map((s) => s.type).join(',') === 'INTRO,STORY,DIALOGUE,CHOICE,RESULT',
  'L2 follows the SAME arc as L1 (scalable pattern, no special-casing)',
);
const L2_CAPTIONS_VERBATIM = [
  'Riya ne dekha ki gaon ke kai bachche saaf paani aur achhi health facilities ki kami ka saamna kar rahe hain.',
  'Doosre bachche bhi baar-baar bimaar ho rahe the kyunki unhe saaf paani aur sahi care nahi mil rahi thi.',
  'Riya ne decide kiya ki wo problem ko ignore nahi karegi. Usne bade logon se madad maangi.',
  'Riya kya kare?',
  'Riya ne seekha ki har bacche ko health care, clean water aur safe environment milna chahiye.',
];
L2_CAPTIONS_VERBATIM.forEach((want, i) => {
  assert(L2!.slides[i].caption.en === want, `L2 slide ${i + 1} EN caption is verbatim`);
});

// L2 artwork: the child's own converted files, wired verbatim.
const L2_ART: Array<[number, string]> = [
  [0, 's6-water.webp'],
  [1, 's7-sick.webp'],
  [2, 's8-meeting.webp'],
  [4, 's10-health.webp'],
];
for (const [i, file] of L2_ART) {
  assert(
    L2!.slides[i].image === `/story/${file}`,
    `L2 slide ${i + 1} uses the user's art (${file})`,
  );
  let bytes = 0;
  try {
    bytes = readFileSync(join(here, '../public/story', file)).length;
  } catch {
    bytes = 0;
  }
  assert(bytes > 10_000, `public/story/${file} exists and is non-trivial`);
}
const l2Choice = L2!.slides[3];
assert(l2Choice.image === null, 'L2 CHOICE slide stays image-free — it IS the game screen');
assert(
  !!l2Choice.choices && l2Choice.choices.length === 3,
  'L2 decision offers THREE options (task §10)',
);
assert(
  l2Choice.choices!.filter((c) => c.correct).length === 1,
  'L2: exactly ONE choice is marked correct — hard-coded, never computed',
);
const [l2Ignore, l2Self, l2Right] = l2Choice.choices!;
assert(
  l2Ignore.label.en === 'Problem ko ignore karo' && l2Ignore.correct === false,
  'L2 wrong option 1 verbatim ("ignore")',
);
assert(
  l2Self.label.en === 'Sirf khud ke liye paani bachao' && l2Self.correct === false,
  'L2 wrong option 2 verbatim ("only self")',
);
assert(
  l2Right.label.en === 'Health camp aur clean water ke liye help lo' && l2Right.correct === true,
  'L2 correct option verbatim',
);
assert(
  l2Ignore.feedback.en ===
    'Riya agar problem ko ignore karegi, to Aman aur doosre bachchon ko help nahi mil paayegi.',
  "L2 \"ignore\" feedback is the task's own line, verbatim (§12)",
);
assert(l2Self.feedback.en.trim().length > 0, 'L2 "only self" branch has gentle feedback too');
assert(
  l2Choice.questionIntro!.en.includes('Ek achha decision kai bachchon ki zindagi badal sakta hai.') &&
    l2Right.feedback.en.includes('Ek achha decision kai bachchon ki zindagi badal sakta hai.'),
  "the script's moral line rides the spoken intro AND the on-screen correct feedback, verbatim",
);

// Level-map metadata + option ceiling across ALL levels (data-driven map).
for (const level of STORY_LEVELS) {
  assert(
    level.subtitle.en.trim().length > 0 && DEVANAGARI_RE.test(level.subtitle.hi),
    `${level.id}: map subtitle present with a Devanagari HI twin`,
  );
  for (const s of level.slides) {
    if (s.type === 'CHOICE') {
      const n = s.choices?.length ?? 0;
      assert(n >= 2 && n <= 4, `${level.id}/${s.id}: 2–4 options (spoken word-lead ceiling)`);
    }
  }
}
assert(L1!.subtitle.en === 'Every Child Matters', 'L1 subtitle "Every Child Matters" (task §6 example)');
assert(L2!.subtitle.en === 'Right to Health & Care', 'L2 subtitle names the right it teaches');

assert(isStoryLevelUnlockedIn({}, 'right-to-life'), 'L1 is always unlocked');
assert(!isStoryLevelUnlockedIn({}, 'right-to-health'), 'L2 locked while L1 incomplete');
assert(
  isStoryLevelUnlockedIn({ 'right-to-life': true }, 'right-to-health'),
  'L2 unlocks once L1 is complete',
);
assert(!isStoryLevelUnlockedIn({}, 'no-such-story'), 'unknown story id is never unlocked');

// --- openStory guard chain (uiStore) -----------------------------------------
openStory('right-to-health');
assert(
  uiStore.getState().activeStory === null,
  'openStory refuses the LOCKED Level 2 (fail-closed even though slides exist now)',
);
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
  uiStore.getState().activeStory?.id === 'right-to-health',
  'L1 completion truly unlocks Level 2 — openStory admits it now',
);
closeStory();
assert(uiStore.getState().activeStory === null, 'closeStory clears Level 2 too');

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

// --- Determinism: story TEXT modules stay fetch/AI-free ----------------------
// (spec §20 — no AI generation per slide. The ONE sanctioned fetcher is
// storyAdventureVoice.ts — audio-only, manifest ids only — asserted below.)
for (const rel of [
  '../src/story/storyData.ts',
  '../src/story/StoryOverlay.tsx',
  '../src/story/StoryAdventureMap.tsx',
  '../src/story/storyNarrationState.ts',
  '../src/story/useStoryNarrator.ts',
]) {
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
assert(
  worldScene.includes('openStoryMap(') && !worldScene.includes('openStory('),
  'E key / house tap open the LEVEL MAP — never a story directly (task §2)',
);
assert(
  worldScene.includes('storyMapOpen'),
  'movement + interactions also freeze while the level map is open',
);

const hud = read('../src/ui/HUD.tsx');
assert(
  hud.includes('<StoryPrompt') && hud.includes('<StoryOverlay') && hud.includes('<StoryAdventureMap'),
  'HUD mounts prompt + level map + overlay',
);
assert(hud.includes('storyEnterCta'), 'prompt uses the enter CTA string');
assert(
  hud.includes('openStoryMap()') && !/openStory\(nearbyStoryId\)/.test(hud),
  'the door prompt opens the LEVEL MAP too',
);

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
assert(
  overlay.includes("get('level')") && overlay.includes("get('view') === 'map'"),
  'overlay seam takes &level= and stands down for the map seam (&view=map)',
);
assert(
  overlay.includes('wasCompletedAtEntry') && overlay.includes('celebrateStoryCompletion('),
  'FRESH completions hand the level map its unlock cinematic on leave; replays never do',
);
// Single button ownership (question-screen fix): the bottom bar owns the ONE
// right-side action — exactly one Next render site, exactly one Try Again,
// driven by actionState. The feedback card must stay text-only.
assert(overlay.includes('actionState'), 'bottom-bar action is driven by actionState');
assert(
  overlay.split('{t.next}').length - 1 === 1,
  'exactly ONE Next button render site (no duplicate Next)',
);
assert(
  overlay.split('{t.storyTryAgain}').length - 1 === 1,
  'exactly ONE Try Again render site (no duplicate Try Again)',
);

const store = read('../src/data/progressStore.ts');
assert(
  store.includes('sanitizeRecord(parsed.storyProgress, isBool)'),
  'storyProgress is sanitized at the load ingress',
);

const mainSrc = read('../src/main.tsx');
assert(mainSrc.includes("get('story') === 'open'"), 'main.tsx boots the ?story=open seam');
assert(mainSrc.includes("get('done')"), 'seam can pre-complete levels (&done=) for map/L2 captures');

// --- Level map component: data-driven, deterministic, silent -------------------
const mapSrc = read('../src/story/StoryAdventureMap.tsx');
assert(
  mapSrc.includes('STORY_LEVELS') &&
    !mapSrc.includes("'right-to-life'") &&
    !mapSrc.includes("'right-to-health'"),
  'level map generates from STORY_LEVELS with ZERO hard-coded level ids (task §5/§15)',
);
assert(mapSrc.includes('isStoryLevelUnlockedIn'), 'node states derive from the ONE lock rule (§16)');
assert(mapSrc.includes('storyLockedHint'), 'locked nodes explain which level unlocks them');
assert(
  mapSrc.includes('storyMapNewAdventure') && mapSrc.includes('storyMapPlayLevelCta'),
  'unlock cinematic ends on "New Adventure Unlocked!" + a PLAY CTA (task §11)',
);
assert(
  mapSrc.includes('clicksBlocked') && mapSrc.includes("phase !== 'cta'"),
  'nodes stay unclickable until the cinematic finishes (task §3) — nothing auto-starts',
);
assert(
  !/speechSynthesis|storyAdventureVoice|new Audio\(/.test(mapSrc),
  'the level map is SILENT — no voice on map/completion surfaces (voice spec §8)',
);
assert(mapSrc.includes("get('view') !== 'map'"), 'map DEV seam (&view=map) present');

const uiWiring = read('../src/ui/uiStore.ts');
assert(
  uiWiring.includes('storyMapOpen') && uiWiring.includes('celebrateStoryCompletion'),
  'uiStore owns the map-open + celebration state (transient; the unlock itself is progressStore)',
);

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
  // Level-map chrome (Candy-Crush progression screen).
  'storyMapSubtitle',
  'storyMapComingSoon',
  'storyMapPlayCta',
  'storyMapReplayCta',
  'storyMapNewAdventure',
  'storyMapAllDone',
  'storyMapContinueCta',
  'storyMapLockedToast',
  // Voice-guide chrome (spoken prefixes/CTAs + control labels).
  'storyVoiceOptionOne',
  'storyVoiceOptionTwo',
  'storyVoiceOptionThree',
  'storyVoiceOptionFour',
  'storyVoiceCorrectLead',
  'storyVoiceNextCta',
  'storyVoiceTryAgainCta',
  'storyVoiceOn',
  'storyVoiceOff',
  'storyVoiceReplay',
  'storyVoiceRetry',
  'storyVoicePreparing',
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
assert(
  STRINGS.en.storyMapPlayLevelCta(2).includes('2') &&
    DEVANAGARI_RE.test(STRINGS.hi.storyMapPlayLevelCta(2)),
  'storyMapPlayLevelCta names the level in both languages (screen-only, digits OK)',
);
assert(
  STRINGS.en.storyMapLevelsDone(1, 2).includes('1') &&
    STRINGS.en.storyMapLevelsDone(1, 2).includes('2'),
  'storyMapLevelsDone formats the progress count',
);

// --- GEMINI-ONLY: the device-voice engine is GONE from the story path ---------
// Strict single-voice spec §1/§16: exactly ONE engine (storyAdventureVoice,
// the Gemini controller). No speechSynthesis, no robotic fallback, ever.
assert(narrationSupported() === false, 'tsx environment sanity: no speechSynthesis here');
let synthEngineGone = false;
try {
  read('../src/story/storyVoice.ts');
} catch {
  synthEngineGone = true;
}
assert(
  synthEngineGone,
  'storyVoice.ts (device-voice engine) is DELETED — Gemini is the only story engine',
);
for (const rel of [
  '../src/story/storyAdventureVoice.ts',
  '../src/story/storyNarrationState.ts',
  '../src/story/useStoryNarrator.ts',
  '../src/story/StoryOverlay.tsx',
  '../src/story/storyVoiceSegments.ts',
  '../src/story/storyData.ts',
]) {
  const src = read(rel);
  assert(
    !/speechSynthesis|SpeechSynthesisUtterance|webkitSpeech/.test(src),
    `${rel.replace('../src/', '')}: ZERO Web Speech API usage (Gemini-only story voice)`,
  );
}

// --- Voice guide: reminder pacing (strict bug-fix spec §4: EXACT 5s cadence) --
assert(REMINDER_DELAYS_MS.length >= 1, 'reminder cadence defined');
for (const gap of REMINDER_DELAYS_MS) {
  assert(gap === 5_000, 'every reminder gap is EXACTLY 5s (strict spec §4)');
}
assert(Math.min(...REMINDER_DELAYS_MS) >= 5_000, 'no aggressive per-second reminder loop');

// --- Voice guide: strict-spec silence + separation invariants -----------------
const narratorHookSrc = read('../src/story/useStoryNarrator.ts');
assert(
  narratorHookSrc.includes("if (slide.type === 'RESULT')") &&
    narratorHookSrc.includes('RESULT slide — silent by spec'),
  'congratulations/RESULT slide is completely silent (§8: no reward-line narration)',
);
assert(
  !narratorHookSrc.includes('lastNarratedKeyRef'),
  'no cross-situation narration flag — every situation change is a fresh voice session (§3)',
);
const assistantWidgetSrc = read('../src/avatar/AvatarWidget.tsx');
assert(
  assistantWidgetSrc.includes('if (activeStory) setIsOpen(false)'),
  'opening a story closes the chat panel — suspension can never silently swallow a question read (§9)',
);
assert(
  assistantWidgetSrc.includes('!activeStory) {'),
  'zone/level greetings never fire while a story is open (§9: no generic greeting over the question flow)',
);

// --- Voice guide: varied reminder pool, EN/HI twins ---------------------------
assert(STORY_REMINDERS.length >= 4, 'reminder pool has 4+ variations');
assert(
  new Set(STORY_REMINDERS.map((r) => r.en)).size === STORY_REMINDERS.length &&
    new Set(STORY_REMINDERS.map((r) => r.hi)).size === STORY_REMINDERS.length,
  'reminder lines are all distinct (no robotic repetition)',
);
for (const r of STORY_REMINDERS) {
  assert(DEVANAGARI_RE.test(r.hi), 'reminder HI twin is Devanagari');
  assert(!EMOJI_RE.test(r.en) && !EMOJI_RE.test(r.hi), 'reminders carry no emojis');
  assert(
    !/\bdono\b/i.test(r.en) && !r.hi.includes('दोनों'),
    'reminder pool is option-count-neutral (no "dono" — works for 2 AND 3 options)',
  );
}

// --- Voice guide: every spoken line is digit-free ------------------------------
// (Helpline digits are exclusively owned by the Get Help Now screen; a
// narrated digit string could be mistaken for guidance — PRD §9.)
const spokenLines: string[] = [];
for (const level of STORY_LEVELS) {
  for (const s of level.slides) {
    spokenLines.push(s.caption.en, s.caption.hi);
    if (s.narration) spokenLines.push(s.narration.en, s.narration.hi);
    if (s.questionIntro) spokenLines.push(s.questionIntro.en, s.questionIntro.hi);
    for (const c of s.choices ?? []) {
      spokenLines.push(c.label.en, c.label.hi, c.feedback.en, c.feedback.hi);
    }
  }
}
for (const r of STORY_REMINDERS) spokenLines.push(r.en, r.hi);
for (const lang of ['en', 'hi'] as const) {
  spokenLines.push(
    STRINGS[lang].storyVoiceOptionOne,
    STRINGS[lang].storyVoiceOptionTwo,
    STRINGS[lang].storyVoiceOptionThree,
    STRINGS[lang].storyVoiceOptionFour,
    STRINGS[lang].storyVoiceCorrectLead,
    STRINGS[lang].storyVoiceNextCta,
    STRINGS[lang].storyVoiceTryAgainCta,
    STRINGS[lang].storyVoiceYourTurn,
  );
}
for (const text of spokenLines) {
  assert(!/[0-9०-९]/.test(text), `spoken line stays digit-free: "${text.slice(0, 44)}"`);
}

// --- Voice guide: Level-1 narration twins (spec's own scripts) -----------------
const introSlide = L1!.slides[0];
assert(
  !!introSlide.narration && DEVANAGARI_RE.test(introSlide.narration!.hi),
  'slide 1 has a spoken opener with a Devanagari HI twin',
);
assert(
  !!choiceSlide.questionIntro && DEVANAGARI_RE.test(choiceSlide.questionIntro!.hi),
  'CHOICE slide has a spoken question intro with a Devanagari HI twin',
);
const l2Intro = L2!.slides[0];
assert(
  !!l2Intro.narration &&
    l2Intro.narration!.en.includes('Aman ki tabiyat ab thodi behtar hai') &&
    DEVANAGARI_RE.test(l2Intro.narration!.hi),
  'L2 opener narrates the Level-1 continuity (Aman better now) with an HI twin',
);
assert(
  !!l2Choice.questionIntro && DEVANAGARI_RE.test(l2Choice.questionIntro!.hi),
  'L2 CHOICE slide has a spoken question intro with a Devanagari HI twin',
);

// --- Voice guide: quest narrator untouched, narration defaults ON --------------
assert(
  typeof questSpeak === 'function' && typeof stopSpeaking === 'function',
  'a11y narrator API intact for quests',
);
assert(LANG_TAGS.en === 'en-IN' && LANG_TAGS.hi === 'hi-IN', 'shared BCP-47 tags unchanged');
assert(
  settingsStore.getState().narration === true,
  'voice guide defaults ON on fresh devices (pre-readers need no toggle hunt)',
);

// --- Voice guide: overlay / hook / engine / widget wiring literals -------------
assert(overlay.includes('useStoryNarrator('), 'overlay mounts the narrator hook');
assert(
  overlay.split('storyAdventureVoice.stop()').length - 1 >= 3,
  'Next/Back, answer taps and Try Again all hard-stop voice synchronously',
);
assert(overlay.includes('aria-pressed={settings.narration}'), 'voice toggle is an accessible pressed-state button');
assert(overlay.includes('settingsStore.update({ narration'), 'in-story toggle writes the SHARED narration setting');
assert(overlay.includes('storyVoiceReplay'), 'replay ("listen again") control present');

const hookSrc = read('../src/story/useStoryNarrator.ts');
assert(
  hookSrc.includes('clearReminderTimer();') && hookSrc.includes('storyAdventureVoice.stop();'),
  'hook cleanup stops voice + clears reminder timers (no background timers survive)',
);
assert(hookSrc.includes('REMINDER_DELAYS_MS'), 'reminder pacing uses the exported smoke-pinned constant');
assert(
  hookSrc.includes('choiceReadSegments') && hookSrc.includes('pickedReadSegments'),
  'question + feedback sequences come from the shared segment catalog',
);
assert(hookSrc.includes('reminderSegment'), 'reminders speak catalogued segments (cached audio, varied pool)');
assert(
  hookSrc.includes('preloadAhead()') && hookSrc.includes('storyAdventureVoice.preload'),
  'next slide + both feedback branches are PRELOADED for instant taps',
);
const segsSrc = read('../src/story/storyVoiceSegments.ts');
assert(
  segsSrc.includes('storyVoiceOptionOne') && segsSrc.includes('storyVoiceOptionTwo'),
  'options are spoken behind the question with the option-prefix chrome',
);
assert(
  segsSrc.includes('storyVoiceCorrectLead') && segsSrc.includes('storyVoiceTryAgainCta'),
  'feedback narration includes the praise lead + Try Again CTA',
);
assert(segsSrc.includes('storyVoiceYourTurn'), 'question read closes with the "your turn" cue');

const stateSrc = read('../src/story/storyNarrationState.ts');
assert(
  stateSrc.includes('export function setStorySpeaking') &&
    stateSrc.includes('export function onNarrationSuspended') &&
    stateSrc.includes('suspendListeners.forEach'),
  'narration STATE store exposes the speaking flag + NOTIFIES suspend listeners (engine-free)',
);
assert(
  !stateSrc.includes('new Audio(') && !stateSrc.includes('fetch('),
  'state store is engine-free — it can never grow a second voice path',
);

const uiSrc = read('../src/ui/uiStore.ts');
assert(
  !uiSrc.includes('primeVoiceInGesture'),
  'story entry no longer primes speechSynthesis — only the Gemini element (single engine)',
);

const widgetSrc = read('../src/avatar/AvatarWidget.tsx');
assert(
  widgetSrc.includes('setNarrationSuspended(isOpen)'),
  'opening the chat panel suspends story narration (ONE voice at a time)',
);
assert(widgetSrc.includes('useNarrationVoiceState'), 'assistant bubble reacts while the story guide speaks');

// --- Gemini story voice: segment catalog ↔ server manifest (drift guard) ------
const catalog = enumerateAllStorySegments();
assert(
  catalog.length >= 60,
  'segment catalog covers the FULL Level 1 + Level 2 read (60+ lines EN+HI)',
);
assert(new Set(catalog.map((s) => s.id)).size === catalog.length, 'segment ids are unique');
const enCount = catalog.filter((s) => s.id.endsWith('/en')).length;
const hiCount = catalog.filter((s) => s.id.endsWith('/hi')).length;
assert(
  enCount === hiCount && enCount + hiCount === catalog.length,
  'every segment id ends in /en or /hi, in matched twin counts',
);
assert(
  catalog.every((s) => !/[0-9\u0966-\u096F]/.test(s.text)),
  'every catalogued spoken line is digit-free (PRD §9 — helplines live in Get Help only)',
);
assert(
  ['chrome/yourturn/en', 'chrome/yourturn/hi'].every((id) => catalog.some((s) => s.id === id)),
  '"your turn" close-out cue is catalogued in both languages',
);
assert(
  catalog.some(
    (s) =>
      s.id === 'right-to-life/choice/opt-0/en' &&
      s.text.startsWith(STRINGS.en.storyVoiceOptionOne),
  ),
  'option lines are catalogued WITH the spoken option prefix',
);
assert(
  catalog.some(
    (s) =>
      s.id === 'right-to-health/choice/opt-2/en' &&
      s.text.startsWith(STRINGS.en.storyVoiceOptionThree),
  ),
  'the THIRD option is catalogued with the word-form "Option three" prefix (digits stay banned)',
);

const manifestSrc = read('../../api-server/src/routes/storyvoice/story-voice-manifest.ts');
const manifest = JSON.parse(
  manifestSrc.slice(manifestSrc.indexOf('= [') + 2, manifestSrc.lastIndexOf('] as const') + 1),
) as Array<{ id: string; lang: string; text: string }>;
assert(manifest.length === catalog.length, 'server manifest and client catalog have the same size');
const manifestById = new Map(manifest.map((e) => [e.id, e]));
assert(
  catalog.every((s) => {
    const m = manifestById.get(s.id);
    return !!m && m.text === s.text && m.lang === (s.id.endsWith('/hi') ? 'hi' : 'en');
  }),
  'server manifest matches the catalog EXACTLY (else: pnpm exec tsx scripts/generate-story-voice-manifest.ts)',
);
// Play-order export (prewarm priority): the allowlist array is sorted
// alphabetically, so PLAY order ships as a separate generated export —
// scarce free-tier quota must fill Level 1 (and its question cluster)
// before later levels, or interactive slides go silent while stories speak.
const levelOrderInFile = JSON.parse(
  (manifestSrc.match(/STORY_LEVEL_ORDER: readonly string\[\] = (\[[^\]]*\])/) ?? [])[1] ?? 'null',
) as string[] | null;
const playOrder: string[] = [];
for (const s of catalog) {
  const head = s.id.split('/')[0];
  if (head !== 'chrome' && !playOrder.includes(head)) playOrder.push(head);
}
assert(
  !!levelOrderInFile && JSON.stringify(levelOrderInFile) === JSON.stringify(playOrder),
  'manifest exports STORY_LEVEL_ORDER in PLAY order (STORY_LEVELS sequence, not alphabetical)',
);

// --- Gemini story voice: manager source invariants -----------------------------
const advSrc = read('../src/story/storyAdventureVoice.ts');
assert(advSrc.split('fetch(').length - 1 === 1, 'manager has ONE fetch site — the story TTS endpoint');
assert(
  advSrc.includes("'api/story-adventure-voice/tts'") && advSrc.includes('BASE_URL'),
  'fetches the story-only TTS route base-path-relative (never root-relative)',
);
assert(advSrc.includes('encodeURIComponent'), 'segment id is URL-encoded');
assert(
  advSrc.split('await fetchClipOnce').length - 1 === 2,
  'client retries a failed clip fetch exactly once (server retries upstream separately)',
);
assert(
  advSrc.split('storyVoice.speak(').length - 1 === 0 &&
    advSrc.split('storyVoice.stop(').length - 1 === 0 &&
    !advSrc.includes("from './storyVoice'"),
  'GEMINI-ONLY: zero device-voice fallback calls anywhere in the controller (strict spec §1/§6)',
);
assert(advSrc.includes('DEGRADE_COOLDOWN_MS'), 'failure cooldown prevents fetch storms against a dead upstream');
assert(advSrc.includes('onNarrationSuspended('), 'manager registers for chat-open suspend (ONE voice at a time)');
assert(
  advSrc.includes('const myEpoch = ++epoch') && advSrc.split('myEpoch !== epoch').length - 1 >= 3,
  'speak() bumps the SHARED epoch (supersedes ALL older sequences + their onDone) and guards every await',
);
assert(
  advSrc.includes('setStoryVoiceUnavailable') && advSrc.includes('markUnavailable'),
  'failed narration publishes the retry-chip state instead of switching voices (spec §6/§7)',
);
assert(
  advSrc.includes('retryVoice') && advSrc.includes('simulateOutage'),
  'controller exposes the Gemini retry (chip tap) + the DEV outage seam',
);
assert(
  !/GEMINI_API_KEY|GoogleGenAI|@google\/genai|apiKey/.test(advSrc),
  'no key material or AI SDK anywhere in the frontend manager',
);
assert(!advSrc.includes('setInterval'), 'no polling loops in the audio manager');

// --- Gemini story voice: headless no-op + suspend interplay --------------------
assert(
  storyAdventureVoice.available() === false,
  'tsx env: no Audio element — controller reports the Gemini path unavailable here',
);
let advDone = false;
storyAdventureVoice.speak([{ id: 'chrome/yourturn/en', text: 'hello' }], 'en', {
  onDone: () => {
    advDone = true;
  },
});
assert(advDone, 'headless: controller silent-completes so the state machine advances (silence, not a second voice)');
setNarrationSuspended(true);
advDone = false;
storyAdventureVoice.speak([{ id: 'chrome/yourturn/en', text: 'hello' }], 'en', {
  onDone: () => {
    advDone = true;
  },
});
assert(!advDone, 'suspended: manager plays nothing and does NOT advance');
setNarrationSuspended(false);
storyAdventureVoice.stop();
storyAdventureVoice.preload(catalog.slice(0, 2));
primeStoryAudioInGesture();
assert(storyAdventureVoice.isSpeaking() === false, 'stop/preload/prime are all safe without a browser');

// --- Gemini story voice: engine bridge, gesture prime, scope isolation ---------
const overlaySrcChip = read('../src/story/StoryOverlay.tsx');
assert(
  overlaySrcChip.includes('storyVoiceRetry') && overlaySrcChip.includes('retryVoice'),
  'overlay renders the child-friendly Gemini retry chip when narration is unavailable',
);
assert(
  overlaySrcChip.includes("voice === 'down'") && overlaySrcChip.includes('simulateOutage'),
  'DEV seam (&voice=down) can simulate the outage for screenshots/e2e',
);
assert(
  STRINGS.en.storyVoiceRetry.length > 0 && DEVANAGARI_RE.test(STRINGS.hi.storyVoiceRetry),
  'retry chip text exists in EN (Hinglish) + HI (Devanagari)',
);
assert(
  !/[0-9\u0966-\u096F]/.test(STRINGS.en.storyVoiceRetry + STRINGS.hi.storyVoiceRetry),
  'retry chip text is digit-free (PRD §9 discipline)',
);
assert(
  uiSrc.includes('primeStoryAudioInGesture()'),
  'story entry primes the Gemini audio element inside the same gesture',
);
const a11ySrc = read('../src/a11y/narrator.ts');
assert(
  !a11ySrc.includes('storyAdventureVoice') && !a11ySrc.includes('story-adventure-voice'),
  'quest narrator is untouched by the story voice upgrade (scope isolation)',
);
assert(
  !widgetSrc.includes('storyAdventureVoice'),
  'assistant chat/voice stack never touches the story audio manager (scope isolation)',
);

// --- Gemini story voice: server route contract ----------------------------------
const routeSrc = read('../../api-server/src/routes/storyvoice/index.ts');
assert(routeSrc.includes('MANIFEST_BY_ID.get'), 'server synthesizes MANIFEST ids only (hard allowlist)');
assert(!routeSrc.includes('req.body'), 'server never reads free text from a request (GET id only)');
assert(
  routeSrc.includes('isGeminiConfigured') && routeSrc.includes('getGemini('),
  'story TTS runs on the ONE shared Gemini key accessors (single-key — user order, Aug 11 2026)',
);
assert(
  !routeSrc.includes('getStoryTtsGemini') && !routeSrc.includes('isStoryTtsConfigured'),
  'dedicated story-TTS key accessors are gone from the route (user removed the second key)',
);
assert(
  routeSrc.includes('from "@workspace/integrations-gemini-ai"') && !routeSrc.includes('new GoogleGenAI'),
  'TTS client still comes from the ONE shared integrations lib (no ad-hoc auth in the route)',
);
// Single-key architecture pinned at the SOURCE (client.ts): the dedicated
// GEMINI_TTS_API_KEY scope must never grow back without an explicit order.
const clientSrc = read('../../../lib/integrations-gemini-ai/src/client.ts');
assert(
  !clientSrc.includes('GEMINI_TTS_API_KEY') && !clientSrc.includes('cachedStoryTts'),
  'client.ts has NO dedicated story-TTS key scope (single GEMINI_API_KEY — user order, Aug 11 2026)',
);
assert(
  !clientSrc.includes('GEMINI_ASSISTANT_API_KEY'),
  'the GEMINI_ASSISTANT_API_KEY alias died with the split — single secret name only',
);
assert(
  clientSrc.includes('GEMINI_API_KEY'),
  'client.ts reads the single shared GEMINI_API_KEY',
);
assert(
  !routeSrc.includes('GEMINI_TTS_API_KEY') && !routeSrc.includes('GEMINI_ASSISTANT_API_KEY'),
  'retired key names are gone from the route file entirely (comments included)',
);
assert(
  !routeSrc.includes('process.env'),
  'storyvoice route never reads env directly — key access only via the shared lib accessors',
);
const geminiIndexSrc = read('../../../lib/integrations-gemini-ai/src/index.ts');
assert(
  geminiIndexSrc.includes('getGemini') &&
    geminiIndexSrc.includes('getGeminiAlpha') &&
    geminiIndexSrc.includes('isGeminiConfigured') &&
    !geminiIndexSrc.includes('StoryTts'),
  'integration lib public surface = exactly the three shared accessors (no retired story-TTS exports)',
);
assert(
  routeSrc.includes('story-voice-cache') && routeSrc.includes('pcmToWav'),
  'server disk-caches WAV clips — each line is generated ONCE ever',
);
assert(routeSrc.includes('-tts') && routeSrc.includes('Sulafat'), 'warm TTS voice + tts model candidates pinned');
assert(
  routeSrc.includes('prewarmOrdered') && routeSrc.includes('STORY_LEVEL_ORDER'),
  'prewarm generates in priority order from the PLAY-order level list (question clusters never starve behind later levels)',
);
assert(
  routeSrc.includes('parts[1] === "reward" || parts[1] === "result"'),
  'never-played reward/result-screen clips sink to the END of the prewarm queue',
);
const narrSrc = read('../src/story/useStoryNarrator.ts');
assert(
  narrSrc.includes("next.type !== 'RESULT'"),
  'preload never warms RESULT-slide clips (screen is silent by spec — no quota burned on unheard audio)',
);
assert(routeSrc.includes('prewarm('), 'boot-time prewarm fills the cache before children arrive');
assert(
  routeSrc.includes('scheduleGeneration') && routeSrc.includes('GEN_SPACING_MS'),
  'ALL generation is globally serialized + spaced (free-tier 429 discipline)',
);
assert(
  routeSrc.includes('quotaBackoffUntil') && routeSrc.includes('Retry-After'),
  'quota 429 opens a backoff window with FAST 503s (client falls back instantly, no hang)',
);
assert(
  read('../../api-server/src/routes/index.ts').includes('storyVoiceRouter'),
  'api-server registers the story voice route',
);

console.log('\nstory smoke: ALL OK');
