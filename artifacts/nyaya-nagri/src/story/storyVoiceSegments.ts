/**
 * Story Adventure — spoken-segment catalog (shared by the narrator hook,
 * the Gemini story voice manager and the manifest generator).
 *
 * Every line the Story Adventure voice can EVER say is enumerable here as
 * a stable-ID segment {id, text}. The api-server's story-voice manifest is
 * GENERATED from enumerateAllStorySegments() (scripts/
 * generate-story-voice-manifest.ts) and its TTS route only synthesizes ids
 * found in that manifest — the client can never make the server speak free
 * text (PRD §9.8: fixed content only; TTS-proxy abuse surface: zero).
 *
 * IDs name WHERE a line lives (level/slide/part/lang or chrome/part/lang);
 * the manifest carries the text, and the server's audio cache keys include
 * the text hash — so editing a line regenerates its audio automatically,
 * with no client change and no stale cache.
 *
 * The story smoke asserts the checked-in manifest matches this enumeration
 * exactly (drift guard): if storyData/strings change, regenerate with
 *   pnpm exec tsx scripts/generate-story-voice-manifest.ts
 */
import { getStrings } from '@/i18n/strings';
import type { Language } from '@/data/settingsStore';
import {
  STORY_LEVELS,
  STORY_REMINDERS,
  type StoryChoice,
  type StoryLevelDef,
  type StorySlide,
} from './storyData';

export type StorySegment = {
  /** Stable id: `<level>/<slide>/<part>/<lang>` or `chrome/<part>/<lang>`. */
  id: string;
  /** The exact fixed text spoken for this id (also the synth fallback). */
  text: string;
};

const LANGS: Language[] = ['en', 'hi'];

const seg = (id: string, text: string): StorySegment => ({ id, text });

type ChromePart = 'correctlead' | 'nextcta' | 'tryagaincta' | 'yourturn';

/** Chrome lines (strings.ts) shared across all levels. */
function chromeSegment(part: ChromePart, lang: Language): StorySegment {
  const t = getStrings(lang);
  const text = {
    correctlead: t.storyVoiceCorrectLead,
    nextcta: t.storyVoiceNextCta,
    tryagaincta: t.storyVoiceTryAgainCta,
    yourturn: t.storyVoiceYourTurn,
  }[part];
  return seg(`chrome/${part}/${lang}`, text);
}

/** One line from the varied "no answer yet" reminder pool. */
export function reminderSegment(index: number, lang: Language): StorySegment {
  const i = ((index % STORY_REMINDERS.length) + STORY_REMINDERS.length) % STORY_REMINDERS.length;
  return seg(`chrome/reminder-${i}/${lang}`, STORY_REMINDERS[i][lang]);
}

/** Narrative read for non-question slides (RESULT adds the reward line first). */
export function plainReadSegments(
  level: StoryLevelDef,
  slide: StorySlide,
  lang: Language,
): StorySegment[] {
  const t = getStrings(lang);
  const bodyPart = slide.narration ? 'narration' : 'caption';
  const body = seg(
    `${level.id}/${slide.id}/${bodyPart}/${lang}`,
    (slide.narration ?? slide.caption)[lang],
  );
  if (slide.type === 'RESULT') {
    return [seg(`${level.id}/reward/${lang}`, t.storyRewardUnlocked(level.reward[lang])), body];
  }
  return [body];
}

/**
 * Spoken lead-in for each option index — fixed WORDS ("Option one:" …),
 * never digits (the manifest generator hard-rejects digits in spoken
 * lines, PRD §9). Four is the hard ceiling; the story smoke pins every
 * CHOICE slide to 2–4 options so this table can never be outrun.
 */
function optionLead(lang: Language, index: number): string {
  const t = getStrings(lang);
  const leads = [
    t.storyVoiceOptionOne,
    t.storyVoiceOptionTwo,
    t.storyVoiceOptionThree,
    t.storyVoiceOptionFour,
  ];
  const lead = leads[index];
  if (!lead) throw new Error(`story voice supports at most ${leads.length} options per slide`);
  return lead;
}

/** Question slide, nothing picked: intro → question → ALL options → "your turn". */
export function choiceReadSegments(
  level: StoryLevelDef,
  slide: StorySlide,
  lang: Language,
): StorySegment[] {
  const choices = slide.choices ?? [];
  if (choices.length < 2) return plainReadSegments(level, slide, lang);
  return [
    ...(slide.questionIntro
      ? [seg(`${level.id}/${slide.id}/qintro/${lang}`, slide.questionIntro[lang])]
      : []),
    seg(`${level.id}/${slide.id}/caption/${lang}`, slide.caption[lang]),
    ...choices.map((c, i) =>
      seg(`${level.id}/${slide.id}/opt-${i}/${lang}`, `${optionLead(lang, i)} ${c.label[lang]}`),
    ),
    chromeSegment('yourturn', lang),
  ];
}

/** Spoken feedback after a pick (praise lead / Try Again guidance included). */
export function pickedReadSegments(
  level: StoryLevelDef,
  slide: StorySlide,
  picked: StoryChoice,
  lang: Language,
): StorySegment[] {
  const fb = seg(`${level.id}/${slide.id}/fb-${picked.id}/${lang}`, picked.feedback[lang]);
  return picked.correct
    ? [chromeSegment('correctlead', lang), fb, chromeSegment('nextcta', lang)]
    : [fb, chromeSegment('tryagaincta', lang)];
}

/** A slide's idle read — also used to PRELOAD the next slide's audio. */
export function slideReadSegments(
  level: StoryLevelDef,
  slide: StorySlide,
  lang: Language,
): StorySegment[] {
  return slide.type === 'CHOICE' && (slide.choices?.length ?? 0) >= 2
    ? choiceReadSegments(level, slide, lang)
    : plainReadSegments(level, slide, lang);
}

/** The COMPLETE catalog — manifest generator + smoke drift guard. */
export function enumerateAllStorySegments(): StorySegment[] {
  const out = new Map<string, StorySegment>();
  const add = (s: StorySegment) => out.set(s.id, s);
  for (const lang of LANGS) {
    for (const level of STORY_LEVELS) {
      for (const slide of level.slides) {
        slideReadSegments(level, slide, lang).forEach(add);
        for (const c of slide.choices ?? []) {
          pickedReadSegments(level, slide, c, lang).forEach(add);
        }
      }
    }
    STORY_REMINDERS.forEach((_, i) => add(reminderSegment(i, lang)));
  }
  return [...out.values()];
}

/** Language a segment id belongs to (every id ends in /en or /hi). */
export function segmentLanguage(id: string): Language {
  return id.endsWith('/hi') ? 'hi' : 'en';
}
