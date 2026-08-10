/**
 * Nyaya Nagri — Story Adventure data (deterministic, PRD §9.8 / spec §20).
 *
 * Slide-show story levels entered from the blue-roof house on the map.
 * ALL narrative text, the choices, the correct answer and every feedback
 * line are FIXED content written here — never AI-generated, never fetched,
 * never computed at runtime. The Hindi lines are hand-written twins of the
 * same story (same rule as the quest content files).
 *
 * Slide artwork is the child's own (user-supplied) illustration set,
 * served verbatim from public/story/ (only recompressed to WebP). The
 * CHOICE slide is deliberately image-free — that slide IS the game screen;
 * any slide with `image: null` renders StoryOverlay's soft placeholder
 * frame. Existing art is never recreated or generated.
 */
import type { Language } from '@/data/settingsStore';

export type StoryText = Record<Language, string>;

export type StorySlideType = 'INTRO' | 'STORY' | 'DIALOGUE' | 'CHOICE' | 'RESULT';

export interface StoryChoice {
  id: string;
  label: StoryText;
  /** Hard-coded correctness (PRD §9.8) — never computed, never AI. */
  correct: boolean;
  /** Gentle, blame-free feedback for this pick (PRD §9.6). */
  feedback: StoryText;
}

export interface StorySlide {
  id: string;
  type: StorySlideType;
  /** URL under public/, or null for the placeholder frame. */
  image: string | null;
  caption: StoryText;
  /** CHOICE slides only: exactly two options, exactly one correct. */
  choices?: StoryChoice[];
}

export interface StoryLevelDef {
  id: string;
  /** 1-based display number ("Level 1"). */
  number: number;
  title: StoryText;
  /** The right unlocked on completion — shown as "<reward> Unlocked!". */
  reward: StoryText;
  /** Empty while the level is a locked teaser (Level 2). */
  slides: StorySlide[];
}

/**
 * User art lives in public/story/. Plain URL strings (not Vite asset
 * imports) keep this module importable by the tsx smoke; import.meta.env
 * is optional-chained for the same reason (undefined under tsx).
 */
const STORY_ART_BASE = `${import.meta.env?.BASE_URL ?? '/'}story/`;
const storyArt = (file: string) => `${STORY_ART_BASE}${file}`;

/**
 * The registry. Level 1 "Right to Life" is fully playable; Level 2 is a
 * LOCKED teaser only — its story is deliberately not implemented yet.
 * English captions are the child's own lines, kept verbatim.
 */
export const STORY_LEVELS: StoryLevelDef[] = [
  {
    id: 'right-to-life',
    number: 1,
    title: { en: 'Right to Life', hi: 'जीने का अधिकार' },
    reward: { en: 'Right to Life', hi: 'जीने का अधिकार' },
    slides: [
      {
        id: 'intro',
        type: 'INTRO',
        image: storyArt('s1-intro.webp'),
        caption: {
          en: 'School se ghar lautte waqt Riya ek naye gaon ke raste se guzarti hai.',
          hi: 'स्कूल से घर लौटते वक़्त रिया एक नए गाँव के रास्ते से गुज़रती है।',
        },
      },
      {
        id: 'problem',
        type: 'STORY',
        image: storyArt('s2-problem.webp'),
        caption: {
          en: 'Riya ki nazar Aman par padti hai. Aman bahut kamzor lag raha tha aur use zaroori care nahi mil pa rahi thi.',
          hi: 'रिया की नज़र अमन पर पड़ती है। अमन बहुत कमज़ोर लग रहा था और उसे ज़रूरी देखभाल नहीं मिल पा रही थी।',
        },
      },
      {
        id: 'dialogue',
        type: 'DIALOGUE',
        image: storyArt('s3-dialogue.webp'),
        caption: {
          en: "Riya ne Aman se pucha, 'Tum theek ho? Kya tumhe kisi madad ki zaroorat hai?'",
          hi: "रिया ने अमन से पूछा, 'तुम ठीक हो? क्या तुम्हें किसी मदद की ज़रूरत है?'",
        },
      },
      {
        id: 'choice',
        type: 'CHOICE',
        // Deliberately image-free: the CHOICE slide IS the "game screen".
        image: null,
        caption: {
          en: 'Riya ke paas ek decision tha — kya wo Aman ki madad karegi?',
          hi: 'रिया के पास एक फ़ैसला था — क्या वो अमन की मदद करेगी?',
        },
        choices: [
          {
            id: 'ignore',
            label: { en: 'Chup chaap aage badh jao', hi: 'चुपचाप आगे बढ़ जाओ' },
            correct: false,
            feedback: {
              en: 'Riya agar Aman ko ignore kar de, to use zaroori madad nahi mil paayegi.',
              hi: 'रिया अगर अमन को नज़रअंदाज़ कर दे, तो उसे ज़रूरी मदद नहीं मिल पाएगी।',
            },
          },
          {
            id: 'help',
            label: { en: 'Aman ke liye help bulao', hi: 'अमन के लिए मदद बुलाओ' },
            correct: true,
            feedback: {
              en: 'Bilkul! Kisi bachche ko zaroori madad ki zaroorat ho, to kisi trusted adult ya doctor ki help lena important hai.',
              hi: 'बिल्कुल! किसी बच्चे को ज़रूरी मदद की ज़रूरत हो, तो किसी भरोसेमंद बड़े या डॉक्टर की मदद लेना ज़रूरी है।',
            },
          },
        ],
      },
      {
        id: 'result',
        type: 'RESULT',
        image: storyArt('s5-result.webp'),
        caption: {
          en: 'Riya ne seekha ki har bacche ko jeene, health care aur zaroori madad ka adhikar hota hai.',
          hi: 'रिया ने सीखा कि हर बच्चे को जीने, सेहत की देखभाल और ज़रूरी मदद का अधिकार होता है।',
        },
      },
    ],
  },
  {
    id: 'right-to-health',
    number: 2,
    title: { en: 'Right to Health & Care', hi: 'सेहत और देखभाल का अधिकार' },
    reward: { en: 'Right to Health & Care', hi: 'सेहत और देखभाल का अधिकार' },
    // Locked teaser — no slides until the Level 2 story ships.
    slides: [],
  },
];

export function getStoryLevel(id: string): StoryLevelDef | undefined {
  return STORY_LEVELS.find((l) => l.id === id);
}

/**
 * Single pure lock rule (mirrors zones' isZoneUnlockedIn): the first story
 * level is always open; each later one needs the previous level completed.
 * Completed levels stay replayable, like zones.
 */
export function isStoryLevelUnlockedIn(
  storyProgress: Record<string, boolean>,
  storyId: string,
): boolean {
  const idx = STORY_LEVELS.findIndex((l) => l.id === storyId);
  if (idx < 0) return false;
  if (idx === 0) return true;
  return !!storyProgress[STORY_LEVELS[idx - 1].id];
}

/**
 * World entrance: the EXISTING blue-roof decor house east of the plaza
 * (WorldScene HOUSES) — kept exactly where the reference art placed it,
 * only made interactive.
 */
export const STORY_ENTRANCE = {
  storyId: 'right-to-life',
  /** Logical [x, z] units — must match the WorldScene HOUSES entry. */
  position: [16, -12] as [number, number],
};

/** Slightly tighter than the zones' PROXIMITY_SQ (36): prompt only appears
 * right at the door, and can never fight a zone prompt (nearest zone
 * anchor is >11 units away). */
export const STORY_PROXIMITY_SQ = 25;
