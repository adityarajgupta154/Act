/**
 * "Right or Wrong?" — hard-coded game content (PRD §9.8: legal facts and
 * feedback are NEVER generated or altered at runtime).
 *
 * Every round traces to the PRD §4 act mapping:
 *  - education  → Art. 21A + RTE Act 2009 (free & compulsory education 6-14)
 *  - play       → Art. 24 + Child Labour (Prohibition) Act 1986/2016
 *  - protection → JJ Act 2015 (children in need of care & protection)
 *  - health     → Art. 21 + Art. 39(e)(f) (healthy development)
 *  - family     → Art. 39(f) (childhood protected against neglect)
 *
 * Trauma-sensitivity (PRD §9.5): every "wrong" situation is shown through
 * implication only — a tired or lonely child, never violence or injury —
 * and the copy stays factual and gentle for the 8-11 band.
 *
 * Hindi uses simple child-appropriate Devanagari, Western numerals, and no
 * emojis (project i18n conventions).
 */

import eduRight from '@/assets/games/rightwrong/rw-edu-right.webp';
import eduWrong from '@/assets/games/rightwrong/rw-edu-wrong.webp';
import playRight from '@/assets/games/rightwrong/rw-play-right.webp';
import playWrong from '@/assets/games/rightwrong/rw-play-wrong.webp';
import protectRight from '@/assets/games/rightwrong/rw-protect-right.webp';
import protectWrong from '@/assets/games/rightwrong/rw-protect-wrong.webp';
import healthRight from '@/assets/games/rightwrong/rw-health-right.webp';
import healthWrong from '@/assets/games/rightwrong/rw-health-wrong.webp';
import familyRight from '@/assets/games/rightwrong/rw-family-right.webp';
import familyWrong from '@/assets/games/rightwrong/rw-family-wrong.webp';
import rwBg from '@/assets/games/rightwrong/rw-bg.webp';

/** Painted meadow-sky backdrop for the whole game screen. */
export const RW_BG_URL = rwBg;

export interface RwText {
  en: string;
  hi: string;
}

export interface RwCard {
  title: RwText;
  caption: RwText;
  /** Bundled illustration (in-house generated — no stock art, no text baked in). */
  image: string;
}

export interface RwRound {
  id: string;
  /** The situation where the child's right is PROTECTED (the correct pick). */
  right: RwCard;
  /** The situation where it is violated — implication only, never graphic. */
  wrong: RwCard;
  /** Hard-coded law fact shown after the round is solved. */
  law: RwText;
}

export const RW_ROUNDS: RwRound[] = [
  {
    id: 'education',
    right: {
      title: { en: 'Learning at School', hi: 'स्कूल में पढ़ाई' },
      caption: {
        en: 'Children are learning happily at school.',
        hi: 'बच्चे स्कूल में खुशी से पढ़ रहे हैं।',
      },
      image: eduRight,
    },
    wrong: {
      title: { en: 'Made to Work', hi: 'काम करवाया जा रहा है' },
      caption: {
        en: 'A child is made to carry bricks instead of learning.',
        hi: 'बच्चे से पढ़ाई की जगह ईंटें उठवाई जा रही हैं।',
      },
      image: eduWrong,
    },
    law: {
      en: 'Free school for every child aged 6-14 — RTE Act, 2009 (Article 21A).',
      hi: '6-14 साल के हर बच्चे के लिए मुफ्त स्कूल — शिक्षा का अधिकार कानून, 2009 (अनुच्छेद 21A)।',
    },
  },
  {
    id: 'play',
    right: {
      title: { en: 'Time to Play', hi: 'खेलने का समय' },
      caption: {
        en: 'Children get time to play and enjoy childhood.',
        hi: 'बच्चों को खेलने और बचपन जीने का समय मिलता है।',
      },
      image: playRight,
    },
    wrong: {
      title: { en: 'No Time to Play', hi: 'खेल नहीं, सिर्फ काम' },
      caption: {
        en: 'A child is kept working all day at a food stall.',
        hi: 'बच्चे से दिन भर ढाबे पर काम करवाया जाता है।',
      },
      image: playWrong,
    },
    law: {
      en: 'Children under 14 must not be made to work — Child Labour Act (Article 24).',
      hi: '14 साल से छोटे बच्चों से मज़दूरी करवाना मना है — बाल श्रम कानून (अनुच्छेद 24)।',
    },
  },
  {
    id: 'protection',
    right: {
      title: { en: 'Safe with a Trusted Adult', hi: 'भरोसेमंद बड़े के साथ सुरक्षित' },
      caption: {
        en: 'A trusted adult keeps the child safe.',
        hi: 'भरोसेमंद बड़ा बच्चे को सुरक्षित रखता है।',
      },
      image: protectRight,
    },
    wrong: {
      title: { en: 'Left All Alone', hi: 'अकेला छोड़ दिया गया' },
      caption: {
        en: 'A small child is left alone with no one to look after them.',
        hi: 'छोटे बच्चे को अकेला छोड़ दिया गया, कोई देखभाल करने वाला नहीं।',
      },
      image: protectWrong,
    },
    law: {
      en: 'Every child has the right to care and protection — Juvenile Justice Act, 2015.',
      hi: 'हर बच्चे को देखभाल और सुरक्षा का हक है — किशोर न्याय कानून, 2015।',
    },
  },
  {
    id: 'health',
    right: {
      title: { en: 'Care When Sick', hi: 'बीमारी में देखभाल' },
      caption: {
        en: 'A sick child is taken to the doctor.',
        hi: 'बीमार बच्चे को डॉक्टर के पास ले जाया जाता है।',
      },
      image: healthRight,
    },
    wrong: {
      title: { en: 'No One to Care', hi: 'कोई देखभाल नहीं' },
      caption: {
        en: 'A sick child is left without any care.',
        hi: 'बीमार बच्चे की कोई देखभाल नहीं हो रही।',
      },
      image: healthWrong,
    },
    law: {
      en: 'Every child has the right to grow up healthy — Articles 21 & 39.',
      hi: 'हर बच्चे को सेहतमंद बड़े होने का हक है — अनुच्छेद 21 और 39।',
    },
  },
  {
    id: 'family',
    right: {
      title: { en: 'A Caring Family', hi: 'प्यार करने वाला परिवार' },
      caption: {
        en: 'The child lives with love and care.',
        hi: 'बच्चा प्यार और देखभाल के साथ रहता है।',
      },
      image: familyRight,
    },
    wrong: {
      title: { en: 'Left Out and Alone', hi: 'अनदेखा और अकेला' },
      caption: {
        en: 'The child is ignored and left alone.',
        hi: 'बच्चे को अनदेखा करके अकेला छोड़ दिया गया है।',
      },
      image: familyWrong,
    },
    law: {
      en: 'Childhood must be protected from neglect — Article 39.',
      hi: 'बचपन को उपेक्षा से बचाना ज़रूरी है — अनुच्छेद 39।',
    },
  },
];
