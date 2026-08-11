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

export interface StoryLevelDef {
  id: string;
  /** 1-based display number ("Level 1"). */
  number: number;
  title: StoryText;
  /** Short tagline under the title on the level map (the right it teaches). */
  subtitle: StoryText;
  /** The right unlocked on completion — shown as "<reward> Unlocked!". */
  reward: StoryText;
  /** Empty = "coming soon" teaser: shown on the level map but never openable. */
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
 * The registry — the ONE place future story levels get added (task §5/§15:
 * the level map, unlock chain, voice catalog and My Progress all generate
 * from this array; adding Level N later is data + art only, no UI change).
 * English captions are the child's own lines, kept verbatim.
 */
export const STORY_LEVELS: StoryLevelDef[] = [
  {
    id: 'right-to-life',
    number: 1,
    title: { en: 'Right to Life', hi: 'जीने का अधिकार' },
    subtitle: { en: 'Every Child Matters', hi: 'हर बच्चा ज़रूरी है' },
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
        // Spoken opener (voice-guide spec's own script for slide 1).
        narration: {
          en: 'Riya school se ghar wapas aa rahi hai. Raste mein use ek chhota sa gaon dikhai deta hai, jahan kuch bachche khel rahe hain.',
          hi: 'रिया स्कूल से घर वापस आ रही है। रास्ते में उसे एक छोटा सा गाँव दिखाई देता है, जहाँ कुछ बच्चे खेल रहे हैं।',
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
        // Spoken BEFORE the question (voice-guide spec STEP 1 script).
        questionIntro: {
          en: 'Riya ke saamne ab ek important decision hai. Aman ko madad ki zaroorat hai. Ab dekhte hain Riya kya faisla karti hai.',
          hi: 'रिया के सामने अब एक ज़रूरी फ़ैसला है। अमन को मदद की ज़रूरत है। अब देखते हैं रिया क्या फ़ैसला करती है।',
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
    title: { en: 'Clean Water, Healthy Life', hi: 'साफ़ पानी, सेहतमंद ज़िंदगी' },
    subtitle: { en: 'Right to Health & Care', hi: 'सेहत और देखभाल का अधिकार' },
    reward: { en: 'Right to Health & Care', hi: 'सेहत और देखभाल का अधिकार' },
    // Continues DIRECTLY from Level 1 (same Riya + Aman story): Aman is a
    // little better now, and Riya starts seeing the village's wider health
    // and clean-water problem. Captions are the child's lines, verbatim.
    slides: [
      {
        id: 'water',
        type: 'INTRO',
        image: storyArt('s6-water.webp'),
        caption: {
          en: 'Riya ne dekha ki gaon ke kai bachche saaf paani aur achhi health facilities ki kami ka saamna kar rahe hain.',
          hi: 'रिया ने देखा कि गाँव के कई बच्चे साफ़ पानी और अच्छी स्वास्थ्य सुविधाओं की कमी का सामना कर रहे हैं।',
        },
        // Spoken opener bridges from Level 1 (task: SAME ongoing story).
        narration: {
          en: 'Aman ki tabiyat ab thodi behtar hai. Aaj Riya Aman ke saath gaon mein ghoom rahi hai. Tabhi wo dekhti hai ki kuch bachche ek purane handpump se ganda paani bhar rahe hain.',
          hi: 'अमन की तबियत अब थोड़ी बेहतर है। आज रिया अमन के साथ गाँव में घूम रही है। तभी वो देखती है कि कुछ बच्चे एक पुराने हैंडपंप से गंदा पानी भर रहे हैं।',
        },
      },
      {
        id: 'sick',
        type: 'STORY',
        image: storyArt('s7-sick.webp'),
        caption: {
          en: 'Doosre bachche bhi baar-baar bimaar ho rahe the kyunki unhe saaf paani aur sahi care nahi mil rahi thi.',
          hi: 'दूसरे बच्चे भी बार-बार बीमार हो रहे थे क्योंकि उन्हें साफ़ पानी और सही देखभाल नहीं मिल रही थी।',
        },
        narration: {
          en: 'Ek ghar mein ek chhota baccha bimaar leta hua hai, aur uski maa uski dekhbhal kar rahi hai. Riya chinta se dekh rahi hai — ganda paani peene se bachche baar-baar bimaar ho rahe hain.',
          hi: 'एक घर में एक छोटा बच्चा बीमार लेटा हुआ है, और उसकी माँ उसकी देखभाल कर रही है। रिया चिंता से देख रही है — गंदा पानी पीने से बच्चे बार-बार बीमार हो रहे हैं।',
        },
      },
      {
        id: 'meeting',
        type: 'DIALOGUE',
        image: storyArt('s8-meeting.webp'),
        caption: {
          en: 'Riya ne decide kiya ki wo problem ko ignore nahi karegi. Usne bade logon se madad maangi.',
          hi: 'रिया ने तय किया कि वो प्रॉब्लम को नज़रअंदाज़ नहीं करेगी। उसने बड़े लोगों से मदद माँगी।',
        },
        narration: {
          en: 'Riya apne teacher, doctor aur gaon ke logon ke saath baithkar baat karti hai. Wo sabko batati hai ki bachchon ko saaf paani aur sahi care ki zaroorat hai.',
          hi: 'रिया अपने टीचर, डॉक्टर और गाँव के लोगों के साथ बैठकर बात करती है। वो सबको बताती है कि बच्चों को साफ़ पानी और सही देखभाल की ज़रूरत है।',
        },
      },
      {
        id: 'choice',
        type: 'CHOICE',
        // Deliberately image-free: the CHOICE slide IS the "game screen".
        image: null,
        caption: {
          en: 'Riya kya kare?',
          hi: 'रिया क्या करे?',
        },
        // Spoken BEFORE the question — carries the child's moral line
        // ("Ek achha decision…") verbatim, per the Level 2 script.
        questionIntro: {
          en: 'Riya ke saamne ab ek bada decision hai. Ek achha decision kai bachchon ki zindagi badal sakta hai. Ab dekhte hain Riya kya faisla karti hai.',
          hi: 'रिया के सामने अब एक बड़ा फ़ैसला है। एक अच्छा फ़ैसला कई बच्चों की ज़िंदगी बदल सकता है। अब देखते हैं रिया क्या फ़ैसला करती है।',
        },
        choices: [
          {
            id: 'ignore',
            label: { en: 'Problem ko ignore karo', hi: 'प्रॉब्लम को नज़रअंदाज़ करो' },
            correct: false,
            feedback: {
              en: 'Riya agar problem ko ignore karegi, to Aman aur doosre bachchon ko help nahi mil paayegi.',
              hi: 'रिया अगर प्रॉब्लम को नज़रअंदाज़ करेगी, तो अमन और दूसरे बच्चों को मदद नहीं मिल पाएगी।',
            },
          },
          {
            id: 'only-self',
            label: { en: 'Sirf khud ke liye paani bachao', hi: 'सिर्फ़ खुद के लिए पानी बचाओ' },
            correct: false,
            feedback: {
              en: 'Sirf apne liye paani bachane se doosre bachchon ki problem waise hi rahegi. Sab ke liye milkar solution dhoondhna zyada behtar hai.',
              hi: 'सिर्फ़ अपने लिए पानी बचाने से दूसरे बच्चों की प्रॉब्लम वैसे ही रहेगी। सबके लिए मिलकर हल ढूँढना ज़्यादा बेहतर है।',
            },
          },
          {
            id: 'health-camp',
            label: {
              en: 'Health camp aur clean water ke liye help lo',
              hi: 'हेल्थ कैंप और साफ़ पानी के लिए मदद लो',
            },
            correct: true,
            feedback: {
              en: 'Bilkul sahi! Ek achha decision kai bachchon ki zindagi badal sakta hai. Health camp aur clean water se poore gaon ke bachchon ko madad milegi.',
              hi: 'बिल्कुल सही! एक अच्छा फ़ैसला कई बच्चों की ज़िंदगी बदल सकता है। हेल्थ कैंप और साफ़ पानी से पूरे गाँव के बच्चों को मदद मिलेगी।',
            },
          },
        ],
      },
      {
        id: 'result',
        type: 'RESULT',
        image: storyArt('s10-health.webp'),
        caption: {
          en: 'Riya ne seekha ki har bacche ko health care, clean water aur safe environment milna chahiye.',
          hi: 'रिया ने सीखा कि हर बच्चे को हेल्थ केयर, साफ़ पानी और सुरक्षित माहौल मिलना चाहिए।',
        },
      },
    ],
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
 * only made interactive. The door opens the LEVEL MAP (not a level);
 * `storyId` is just the proximity sentinel WorldScene publishes.
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
