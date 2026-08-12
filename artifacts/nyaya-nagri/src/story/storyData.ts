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
  /**
   * Optional spoken twin of the caption for the voice guide — slightly
   * more natural for the ear, SAME story facts (never contradicts the
   * caption; fixed hand-written content like everything else here).
   * When absent, the voice guide reads the caption itself.
   */
  narration?: StoryText;
  /**
   * CHOICE slides only: the spoken situation-explainer the guide says
   * BEFORE reading the question ("Riya ke saamne ab ek decision hai…").
   */
  questionIntro?: StoryText;
  /**
   * CHOICE slides only: two to four options, exactly ONE correct (the
   * spoken option leads are fixed words — "Option one/two/three/four" —
   * so four is a hard ceiling; the story smoke pins it).
   */
  choices?: StoryChoice[];
}

/**
 * Explicit unlock requirement for VIDEO-GATED levels (Aug 2026 castle
 * flow). When present it REPLACES the sequential previous-level rule:
 * the level opens only once the named zone is complete (final quiz
 * passed — engine-written) AND the castle's lesson gate was earned by
 * finishing the "Right or Wrong?" game (progressStore.markVideoWatched —
 * historical name, kept for save-compat). Both halves, fail-closed.
 */
export interface StoryUnlockRequirement {
  /** Zone whose recorded completion is required (e.g. 'zone2'). */
  zoneId: string;
  /** progressStore.videosWatched key (see src/quests/gameFlows.ts). */
  videoId: string;
}

export interface StoryLevelDef {
  id: string;
  /** 1-based display number ("Level 1"). */
  number: number;
  title: StoryText;
  /** Short tagline under the title on the level map (the right it teaches). */
  subtitle: StoryText;
  /** The right unlocked on completion — shown as "<reward> Unlocked!". */
  reward: StoryText;
  /** Video-gated unlock (castle flow); absent = sequential chain rule. */
  unlockRequires?: StoryUnlockRequirement;
  /** Empty = "coming soon" teaser: shown on the level map but never openable. */
  slides: StorySlide[];
}

/**
 * User art lives in public/story/. Plain URL strings (not Vite asset
 * imports) keep this module importable by the tsx smoke; import.meta.env
 * is optional-chained for the same reason (undefined under tsx).
 */
const STORY_ART_BASE = `${import.meta.env?.BASE_URL ?? '/'}story/`;
/** Exported for future slide entries (teaser era: no slides reference it). */
export const storyArt = (file: string) => `${STORY_ART_BASE}${file}`;

/**
 * The registry — the ONE place future story levels get added (task §5/§15:
 * the level map, unlock chain, voice catalog and My Progress all generate
 * from this array; adding Level N later is data + art only, no UI change).
 * English captions are the child's own lines, kept verbatim.
 */
export const STORY_LEVELS: StoryLevelDef[] = [
  {
    id: 'right-to-childhood',
    number: 1,
    title: { en: 'Right to Childhood', hi: 'बचपन का अधिकार' },
    subtitle: { en: 'Every Child Deserves a Childhood', hi: 'हर बच्चे को बचपन का हक़ है' },
    reward: { en: 'Right to Childhood', hi: 'बचपन का अधिकार' },
    // Unlocked by the Right to Childhood castle flow (learning video +
    // final quiz), NOT by the sequential chain — see isStoryLevelUnlockedIn.
    unlockRequires: { zoneId: 'zone2', videoId: 'right-to-childhood' },
    // Story content ships later: empty slides = the map's teaser node
    // (never openable — openStory refuses slide-less levels), while the
    // unlock state above still flips the node from locked to ready the
    // moment video + quiz are done. Future slides/scenarios drop into
    // THIS entry, data-only — no UI change (registry ethos, task §5/§15).
    slides: [],
  },
];

/**
 * Gentle "no answer yet" voice reminders for question slides — a VARIED
 * pool (never robotic repetition), cycled by the narrator hook with
 * stretching gaps. Fixed hand-written EN/HI twins; reusable by every
 * story level. No pressure language, no helpline digits (PRD §9).
 */
export const STORY_REMINDERS: StoryText[] = [
  {
    en: 'Abhi tak koi option select nahi hua hai. Aapko kaunsa answer sahi lagta hai?',
    hi: 'अभी तक कोई विकल्प चुना नहीं गया है। तुम्हें कौन सा जवाब सही लगता है?',
  },
  {
    en: 'Riya ko ab ek choice karni hai. Neeche diye gaye options mein se ek choose karo.',
    hi: 'रिया को अब एक फ़ैसला करना है। नीचे दिए गए विकल्पों में से एक चुनो।',
  },
  {
    en: 'Chalo, Riya ki help karte hain. Aapke hisaab se use kya karna chahiye?',
    hi: 'चलो, रिया की मदद करते हैं। तुम्हारे हिसाब से उसे क्या करना चाहिए?',
  },
  {
    en: 'Ab aapki baari hai. Kisi ek option par tap karke answer do.',
    hi: 'अब तुम्हारी बारी है। किसी एक विकल्प पर टैप करके जवाब दो।',
  },
  {
    en: 'Koi jaldi nahi hai. Sab options ko dhyaan se socho, phir ek chuno.',
    hi: 'कोई जल्दी नहीं है। सब विकल्पों को ध्यान से सोचो, फिर एक चुनो।',
  },
  {
    en: 'Sochne ke liye time lena bilkul theek hai. Jab ready ho, ek option par tap karo.',
    hi: 'सोचने के लिए समय लेना बिल्कुल ठीक है। जब तैयार हो, एक विकल्प पर टैप करो।',
  },
];

export function getStoryLevel(id: string): StoryLevelDef | undefined {
  return STORY_LEVELS.find((l) => l.id === id);
}

/**
 * Progress snapshot the lock rule reads. Structurally satisfied by the
 * full ProgressState, so call sites pass progressStore.getState() (or a
 * subscribed copy) and every unlock input rides ONE object.
 */
export interface StoryUnlockProgress {
  storyProgress: Record<string, boolean>;
  /** Zone completions (engine-written) — read by video-gated levels. */
  completedZones?: Record<string, boolean>;
  /** Videos watched to the end (markVideoWatched) — video-gated levels. */
  videosWatched?: Record<string, boolean>;
}

/**
 * Single pure lock rule (mirrors zones' isZoneUnlockedIn). A level with
 * an explicit unlockRequires opens once its castle flow is done — zone
 * complete AND video watched, fail-closed when either half is missing.
 * Levels without one keep the sequential rule: first always open, later
 * ones need the previous completed. Completed levels stay replayable.
 */
export function isStoryLevelUnlockedIn(
  progress: StoryUnlockProgress,
  storyId: string,
): boolean {
  const idx = STORY_LEVELS.findIndex((l) => l.id === storyId);
  if (idx < 0) return false;
  if (progress.storyProgress[storyId]) return true;
  const level = STORY_LEVELS[idx];
  if (level.unlockRequires) {
    const { zoneId, videoId } = level.unlockRequires;
    return (
      progress.completedZones?.[zoneId] === true &&
      progress.videosWatched?.[videoId] === true
    );
  }
  if (idx === 0) return true;
  return !!progress.storyProgress[STORY_LEVELS[idx - 1].id];
}

/**
 * Story Adventure ENTRANCE lock (user order, Aug 2026): the world house
 * is LOCKED until the adventure has something for the child — a level
 * already done (replay is never blocked, mirroring the zone rule) or a
 * newly playable one. On a fresh save the first level is castle-gated
 * behind the zone2 flow, so the door starts locked. Every surface (world
 * house padlock, HUD prompt, openStoryMap guard) derives from THIS rule
 * so entrance-lock logic can never drift between views.
 */
export function isStoryAdventureUnlockedIn(progress: StoryUnlockProgress): boolean {
  return STORY_LEVELS.some(
    (l) => !!progress.storyProgress[l.id] || isStoryLevelUnlockedIn(progress, l.id),
  );
}

/**
 * World entrance: the EXISTING blue-roof decor house east of the plaza
 * (WorldScene HOUSES) — kept exactly where the reference art placed it,
 * only made interactive. The door opens the LEVEL MAP (not a level);
 * `storyId` is just the proximity sentinel WorldScene publishes.
 */
export const STORY_ENTRANCE = {
  storyId: 'right-to-childhood',
  /** Logical [x, z] units — must match the WorldScene HOUSES entry. */
  position: [16, -12] as [number, number],
};

/** Slightly tighter than the zones' PROXIMITY_SQ (36): prompt only appears
 * right at the door, and can never fight a zone prompt (nearest zone
 * anchor is >11 units away). */
export const STORY_PROXIMITY_SQ = 25;
