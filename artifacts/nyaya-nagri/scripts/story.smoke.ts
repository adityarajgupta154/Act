/**
 * Story Adventure smoke test (Aug 2026 round)
 * Run: pnpm dlx tsx scripts/story.smoke.ts
 *
 * Asserts the story-level invariants:
 *  - The ONE story level "Right to Childhood": castle-gated teaser (no
 *    slides yet), the task's EXACT title, unlockRequires pinned to the
 *    zone2 castle flow; right-to-life / right-to-health are REMOVED.
 *  - Game-first castle flow (learning video DELETED — user order, Aug
 *    2026): ZONE_GAME_FLOWS ↔ story unlockRequires can never drift, no
 *    mp4 ships (public/video/ is gone), the lesson-gate flag writes ONLY
 *    via the game's completion callback, the SAME final quiz runs through
 *    QuestPlayer (found by kind), and Continue stays locked until the
 *    game is done.
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
import { readFileSync, existsSync, readdirSync } from 'node:fs';
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
import { ZONE_GAME_FLOWS, getZoneGameFlow } from '../src/quests/gameFlows';
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

// --- The ONE story level: "Right to Childhood" (castle-gated teaser) ---------
// The old right-to-life / right-to-health levels are REMOVED (task order,
// Aug 2026): the castle's mini-game + final quiz now feed a single
// castle-gated level. Its slides ship later — until then it is a teaser
// node on the map (visible, unlockable, never openable).
const RTC = 'right-to-childhood';
const rtc = getStoryLevel(RTC);
assert(!!rtc, 'the "right-to-childhood" story level exists');
assert(rtc!.number === 1, 'it is Level 1 (the chain restarts here)');
assert(rtc!.title.en === 'Right to Childhood', 'EN title EXACTLY "Right to Childhood" (task wording)');
assert(DEVANAGARI_RE.test(rtc!.title.hi), 'HI title is Devanagari');
assert(
  rtc!.subtitle.en === 'Every Child Deserves a Childhood',
  'map subtitle names the promise it teaches',
);
assert(rtc!.reward.en === 'Right to Childhood', 'reward names the right it teaches');
assert(rtc!.slides.length === 0, 'teaser era: NO slides yet (content ships later, data-only)');
assert(
  rtc!.unlockRequires?.zoneId === 'zone2' &&
    rtc!.unlockRequires?.videoId === 'right-to-childhood',
  'unlock is castle-gated: zone2 completion + the game gate (historical videoId key)',
);
assert(STORY_LEVELS.length === 1, 'STORY_LEVELS holds ONLY the new level (old levels removed, not hidden)');
assert(
  !getStoryLevel('right-to-life') && !getStoryLevel('right-to-health'),
  'right-to-life / right-to-health are GONE from the registry',
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

// --- The ONE lock rule: castle-gated = zone complete AND game done -----------
assert(!isStoryLevelUnlockedIn({ storyProgress: {} }, RTC), 'level starts LOCKED (nothing done)');
assert(
  !isStoryLevelUnlockedIn({ storyProgress: {}, completedZones: { zone2: true } }, RTC),
  'castle quiz alone is NOT enough (game half missing — fail-closed)',
);
assert(
  !isStoryLevelUnlockedIn(
    { storyProgress: {}, videosWatched: { 'right-to-childhood': true } },
    RTC,
  ),
  'the game gate alone is NOT enough (quiz half missing — fail-closed)',
);
assert(
  isStoryLevelUnlockedIn(
    {
      storyProgress: {},
      completedZones: { zone2: true },
      videosWatched: { 'right-to-childhood': true },
    },
    RTC,
  ),
  'zone completion + the earned game gate UNLOCK the level',
);
assert(
  isStoryLevelUnlockedIn({ storyProgress: { 'right-to-childhood': true } }, RTC),
  'a completed level stays unlocked (replayable) without re-checking the gates',
);
assert(
  !isStoryLevelUnlockedIn({ storyProgress: {} }, 'no-such-story'),
  'unknown story id is never unlocked',
);

// --- openStory guard chain (uiStore) + persistence ----------------------------
openStory(RTC);
assert(
  uiStore.getState().activeStory === null,
  'openStory refuses the LOCKED castle-gated level (fail-closed)',
);

assert(
  Object.keys(progressStore.getState().storyProgress).length === 0 &&
    Object.keys(progressStore.getState().videosWatched).length === 0,
  'fresh state: empty storyProgress AND empty videosWatched',
);
progressStore.markVideoWatched('right-to-childhood');
assert(
  progressStore.getState().videosWatched['right-to-childhood'] === true,
  'markVideoWatched records the lesson-gate flag (historical name — the game earns it now)',
);
const afterWatch = progressStore.getState();
progressStore.markVideoWatched('right-to-childhood');
assert(progressStore.getState() === afterWatch, 'markVideoWatched is idempotent (no-op rewrite)');
openStory(RTC);
assert(
  uiStore.getState().activeStory === null,
  'the game gate alone still cannot open the level (zone half missing)',
);

progressStore.completeStoryLevel(RTC);
assert(progressStore.getState().storyProgress[RTC] === true, 'completeStoryLevel records the completion');
assert(
  progressStore.getState().badges['story-right-to-childhood'] === true,
  'the reward badge rides the same atomic write',
);
const afterFirst = progressStore.getState();
progressStore.completeStoryLevel(RTC);
assert(progressStore.getState() === afterFirst, 'completeStoryLevel is idempotent (second call is a no-op)');
assert(
  isStoryLevelUnlockedIn(progressStore.getState(), RTC),
  'the store snapshot satisfies the lock rule structurally (ONE object, ONE rule)',
);
openStory(RTC);
assert(
  uiStore.getState().activeStory === null,
  'openStory STILL refuses the slide-less teaser even when unlocked — no premature story',
);
closeStory();
assert(uiStore.getState().activeStory === null, 'closeStory stays a safe no-op');

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
  '../src/quests/gameFlows.ts',
  '../src/quests/GameQuestFlow.tsx',
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
assert(
  hud.includes('getZoneGameFlow') && hud.includes('<GameQuestFlow'),
  'zone interiors registered in gameFlows run the game-first screen (others keep LevelSelect)',
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
assert(
  store.includes('sanitizeRecord(parsed.videosWatched, isBool)'),
  'videosWatched is sanitized at the load ingress (same rule as storyProgress)',
);

const mainSrc = read('../src/main.tsx');
assert(mainSrc.includes("get('story') === 'open'"), 'main.tsx boots the ?story=open seam');
assert(mainSrc.includes("get('done')"), 'seam can pre-complete levels (&done=) for map captures');

// --- Level map component: data-driven, deterministic, silent -------------------
const mapSrc = read('../src/story/StoryAdventureMap.tsx');
assert(
  mapSrc.includes('STORY_LEVELS') &&
    !mapSrc.includes("'right-to-life'") &&
    !mapSrc.includes("'right-to-health'") &&
    !mapSrc.includes("'right-to-childhood'"),
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
assert(
  mapSrc.includes("flashMapNote('soon')") && mapSrc.includes('storyMapComingSoon'),
  'tapping an unlocked-but-slide-less teaser flashes the coming-soon note (no dead tap)',
);
assert(
  mapSrc.includes('completeFirst') && mapSrc.includes('unlockRequires'),
  'castle-gated locked nodes name the ZONE that opens them (not a previous level)',
);

const uiWiring = read('../src/ui/uiStore.ts');
assert(
  uiWiring.includes('storyMapOpen') && uiWiring.includes('celebrateStoryCompletion'),
  'uiStore owns the map-open + celebration state (transient; the unlock itself is progressStore)',
);
assert(
  uiWiring.includes('exitZoneToStoryMap'),
  'uiStore owns the zone → story-map handoff (same fade as exitZone)',
);

const progressScreen = read('../src/ui/ProgressScreen.tsx');
assert(
  progressScreen.includes('storyAdventuresHeading') && progressScreen.includes('STORY_LEVELS'),
  'My Progress shows the Story Adventures section',
);

// --- Game-first castle flows: the two registries can never drift --------------
assert(ZONE_GAME_FLOWS.length >= 1, 'the Right to Childhood castle flow is registered');
for (const flow of ZONE_GAME_FLOWS) {
  assert(
    ZONES.some((z) => z.id === flow.zoneId),
    `flow ${flow.videoId}: zone "${flow.zoneId}" exists in the world`,
  );
  const target = getStoryLevel(flow.storyLevelId);
  assert(!!target, `flow ${flow.videoId}: its story level "${flow.storyLevelId}" exists`);
  assert(
    target!.unlockRequires?.zoneId === flow.zoneId &&
      target!.unlockRequires?.videoId === flow.videoId,
    `flow ${flow.videoId}: story unlockRequires mirrors the flow EXACTLY`,
  );
}
// The learning video is DELETED (user order, Aug 2026): the game IS the
// lesson. No mp4 may quietly return — the whole public/video/ dir is gone.
assert(
  !existsSync(join(here, '../public/video')),
  'public/video/ is GONE — the castle lesson is the game, not a video',
);
for (const level of STORY_LEVELS) {
  if (!level.unlockRequires) continue;
  assert(
    ZONE_GAME_FLOWS.some(
      (f) =>
        f.zoneId === level.unlockRequires!.zoneId && f.videoId === level.unlockRequires!.videoId,
    ),
    `${level.id}: a zone flow actually writes both of its unlock inputs`,
  );
}
assert(
  getZoneGameFlow('zone2')?.videoId === 'right-to-childhood',
  'zone2 interior routes to the castle game flow',
);
assert(
  getZoneGameFlow('no-such-zone') === null,
  'non-game zones fall through to the level-select screen',
);

const flowSrc = read('../src/quests/GameQuestFlow.tsx');
// GAME BEFORE QUIZ is a POLICY: a fresh entry mounts the game (never the
// quiz), the lesson gate is credited ONLY by the game's completion
// callback, and Continue stays disabled until the gate is earned. The
// game rules themselves are covered by scripts/childhood.smoke.ts.
assert(
  flowSrc.includes('<RightToChildhoodGame') &&
    flowSrc.includes('onComplete={() => progressStore.markVideoWatched(flow.videoId)}'),
  'the game credits the lesson gate through its completion callback (the ONE write site)',
);
// ...and it STAYS the one production write site: enumerate every src file
// that mentions markVideoWatched( — only the store (definition) and the
// castle flow (the callback) may. A future bypass (debug button, second
// caller) grows this set and fails loudly. The ?zone&watched= DEV seam in
// main.tsx deliberately writes the videosWatched map directly, so it does
// not appear here.
{
  const srcRoot = join(here, '../src');
  const gateFiles: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(entry.name) && readFileSync(p, 'utf8').includes('markVideoWatched('))
        gateFiles.push(p.slice(srcRoot.length + 1));
    }
  };
  walk(srcRoot);
  assert(
    gateFiles.sort().join(',') === 'data/progressStore.ts,quests/GameQuestFlow.tsx',
    `markVideoWatched( appears ONLY in the store + the castle flow (got: ${gateFiles.join(', ') || 'none'})`,
  );
}
assert(
  flowSrc.includes('!progressStore.getState().videosWatched[flow.videoId]'),
  'a fresh entry (gate unearned) drops straight into the game — game FIRST',
);
assert(
  !flowSrc.includes('<video') && !/createWatchTracker|zoneVideoUrl/.test(flowSrc),
  'no video element or watch-tracker remains anywhere in the castle flow',
);
assert(
  flowSrc.includes('<QuestPlayer') && flowSrc.includes("l.kind === 'quiz'"),
  'the SAME final quiz runs through QuestPlayer, found by KIND (questions untouched)',
);
assert(
  flowSrc.includes('disabled={!gameDone'),
  'Continue stays disabled until the game is completed (game BEFORE quiz, enforced)',
);
assert(
  flowSrc.includes('practice: quizPassed'),
  'a replay of an already-passed quiz runs as practice — recorded scores never overwritten',
);
assert(
  flowSrc.includes('enterLevel(') && flowSrc.includes('clearLevel()'),
  'the AI companion rides the SAME enterLevel/clearLevel signals as LevelSelect',
);
assert(
  flowSrc.includes('exitZoneToStoryMap'),
  'the unlock celebration can jump straight to the Story Adventure map',
);
assert(
  !/fetch\(|@workspace\/api-client|GoogleGenAI|genai|openai/i.test(flowSrc),
  'game flow is deterministic — hard-coded game content, never AI/fetched',
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
  // Game-first castle flow chrome (landing card + unlock celebration).
  'gamePlayFirst',
  'gameCompletedTag',
  'storyUnlockedHeading',
  'openStoryAdventure',
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
  catalog.length >= 2,
  'segment catalog still carries the shared voice chrome through the teaser era',
);
assert(
  catalog.every(
    (s) => s.id.split('/')[0] === 'chrome' || STORY_LEVELS.some((l) => l.id === s.id.split('/')[0]),
  ),
  'every catalogued segment belongs to the chrome pool or a REGISTERED story level',
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
// The "your turn" cue (like the option-prefix chrome) enumerates only
// alongside CHOICE slides — in the teaser era the catalog is the shared
// reminder pool alone. The moment slides ship, this assert re-arms.
if (STORY_LEVELS.some((l) => l.slides.some((s) => s.type === 'CHOICE'))) {
  assert(
    ['chrome/yourturn/en', 'chrome/yourturn/hi'].every((id) => catalog.some((s) => s.id === id)),
    '"your turn" close-out cue is catalogued in both languages',
  );
}

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
