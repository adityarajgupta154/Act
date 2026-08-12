/**
 * "Right to Childhood" drag-and-drop game — hard-coded content (PRD §9.8:
 * legal facts, scenario labels and feedback are NEVER generated or altered
 * at runtime). This module is PURE TEXT — no image imports — so the smoke
 * test (scripts/childhood.smoke.ts) can import the REAL content directly
 * under tsx. data.ts binds each option id to its bundled illustration.
 *
 * Every right traces to the PRD §4 act mapping:
 *  - education  → Art. 21A + RTE Act 2009 (free & compulsory education 6-14)
 *  - play       → Art. 24 + Child Labour (Prohibition) Act 1986/2016
 *  - protection → JJ Act 2015 (children in need of care & protection)
 *  - health     → Art. 21 + Art. 39(e)(f) (healthy development)
 *  - family     → Art. 39(f) (childhood protected against neglect)
 *  - recreation → UN Child Rights Agreement Art. 31 (rest, play, leisure)
 *  - safety     → POCSO Act 2012 (special protection from harm)
 *  - nutrition  → NFSA 2013 mid-day meals (healthy food at school)
 *
 * Each round = 3 rights (drop slots) + 4 scenario options: 3 that belong,
 * plus exactly ONE distractor with `correctRight: null` that can NEVER be
 * locked into a slot (the game's core lesson — see logic.ts). Trauma
 * sensitivity (PRD §9.5): distractor scenes work by implication only — a
 * tired or lonely child, never violence or injury — and every line stays
 * factual and gentle for the 8-11 band.
 *
 * Image convention (asserted by the smoke): every option id maps to
 * src/assets/games/childhood/ch-<optionId>.webp.
 *
 * Hindi uses simple child-appropriate Devanagari, Western numerals, and no
 * emojis (project i18n conventions).
 */

export interface ChText {
  en: string;
  hi: string;
}

/** Icon ids are render-free strings; the component maps them to lucide. */
export type ChIcon =
  | 'book'
  | 'ball'
  | 'shield'
  | 'heart'
  | 'family'
  | 'music'
  | 'crossing'
  | 'food';

export interface ChRight {
  /** Unique within its round (education repeats across rounds by design). */
  id: string;
  title: ChText;
  icon: ChIcon;
  /** Hard-coded law fact shown when this right is matched correctly. */
  law: ChText;
}

export interface ChOption {
  /** Globally unique — names the bundled illustration (ch-<id>.webp). */
  id: string;
  /** Short scenario caption under the card illustration. */
  label: ChText;
  /** Right this scenario belongs to — null marks THE distractor. */
  correctRight: string | null;
  /** Distractors only: one gentle law-awareness line for the feedback. */
  note?: ChText;
}

export interface ChRound {
  id: string;
  rights: ChRight[];
  options: ChOption[];
}

/** One law fact per right — single source, reused when a right repeats. */
const LAW: Record<string, ChText> = {
  education: {
    en: 'Free school for every child aged 6-14 — RTE Act, 2009 (Article 21A).',
    hi: '6-14 साल के हर बच्चे के लिए मुफ्त स्कूल — शिक्षा का अधिकार कानून, 2009 (अनुच्छेद 21A)।',
  },
  play: {
    en: 'Children under 14 must not be made to work — Child Labour Act (Article 24).',
    hi: '14 साल से छोटे बच्चों से मज़दूरी करवाना मना है — बाल श्रम कानून (अनुच्छेद 24)।',
  },
  protection: {
    en: 'Every child has the right to care and protection — Juvenile Justice Act, 2015.',
    hi: 'हर बच्चे को देखभाल और सुरक्षा का हक है — किशोर न्याय कानून, 2015।',
  },
  health: {
    en: 'Every child has the right to grow up healthy — Articles 21 & 39.',
    hi: 'हर बच्चे को सेहतमंद बड़े होने का हक है — अनुच्छेद 21 और 39।',
  },
  family: {
    en: 'Childhood must be protected from neglect — Article 39.',
    hi: 'बचपन को उपेक्षा से बचाना ज़रूरी है — अनुच्छेद 39।',
  },
  recreation: {
    en: 'Rest and play time is every child\'s right — Child Rights Agreement (Article 31).',
    hi: 'आराम और खेल का समय हर बच्चे का हक है — बाल अधिकार समझौता (अनुच्छेद 31)।',
  },
  safety: {
    en: 'Special laws keep children safe from harm — POCSO Act, 2012.',
    hi: 'खास कानून बच्चों को नुकसान से बचाते हैं — पॉक्सो कानून, 2012।',
  },
  nutrition: {
    en: 'Healthy food at school is every child\'s right — mid-day meal law, 2013.',
    hi: 'स्कूल में पौष्टिक खाना हर बच्चे का हक है — मिड-डे मील कानून, 2013।',
  },
};

export const CH_ROUNDS: ChRound[] = [
  {
    id: 'childhood-basics',
    rights: [
      {
        id: 'education',
        title: { en: 'Right to Education', hi: 'शिक्षा का अधिकार' },
        icon: 'book',
        law: LAW.education,
      },
      {
        id: 'play',
        title: { en: 'Right to Play', hi: 'खेलने का अधिकार' },
        icon: 'ball',
        law: LAW.play,
      },
      {
        id: 'protection',
        title: { en: 'Right to Protection', hi: 'सुरक्षा का अधिकार' },
        icon: 'shield',
        law: LAW.protection,
      },
    ],
    options: [
      {
        id: 'school',
        label: { en: 'Children studying in a classroom', hi: 'बच्चे कक्षा में पढ़ रहे हैं' },
        correctRight: 'education',
      },
      {
        id: 'park',
        label: { en: 'Children playing in a park', hi: 'बच्चे पार्क में खेल रहे हैं' },
        correctRight: 'play',
      },
      {
        id: 'care',
        label: {
          en: 'A child safe with a trusted adult',
          hi: 'भरोसेमंद बड़े के साथ सुरक्षित बच्चा',
        },
        correctRight: 'protection',
      },
      {
        id: 'labour',
        label: {
          en: 'A boy working instead of going to school',
          hi: 'स्कूल की जगह काम करता बच्चा',
        },
        correctRight: null,
        note: {
          en: 'Children must not be made to work — their place is school. (Child Labour Act)',
          hi: 'बच्चों से काम नहीं करवाया जा सकता — उनकी जगह स्कूल है। (बाल श्रम कानून)',
        },
      },
    ],
  },
  {
    id: 'growing-up-well',
    rights: [
      {
        id: 'health',
        title: { en: 'Right to Health', hi: 'सेहत का अधिकार' },
        icon: 'heart',
        law: LAW.health,
      },
      {
        id: 'family',
        title: { en: 'Right to Family Care', hi: 'परिवार की देखभाल का अधिकार' },
        icon: 'family',
        law: LAW.family,
      },
      {
        id: 'recreation',
        title: { en: 'Right to Recreation', hi: 'मौज-मस्ती का अधिकार' },
        icon: 'music',
        law: LAW.recreation,
      },
    ],
    options: [
      {
        id: 'doctor',
        label: {
          en: 'A child getting a checkup from a doctor',
          hi: 'डॉक्टर से जाँच करवाता बच्चा',
        },
        correctRight: 'health',
      },
      {
        id: 'family',
        label: {
          en: 'A family eating together with love',
          hi: 'परिवार साथ में प्यार से खाना खाता है',
        },
        correctRight: 'family',
      },
      {
        id: 'kites',
        label: {
          en: 'Children flying kites and having fun',
          hi: 'बच्चे पतंग उड़ाते और मस्ती करते हैं',
        },
        correctRight: 'recreation',
      },
      {
        id: 'stall',
        label: {
          en: 'A child made to wash dishes all day',
          hi: 'दिन भर बर्तन धोता बच्चा',
        },
        correctRight: null,
        note: {
          en: 'Long hours of work are not for children — the law protects them. (Child Labour Act)',
          hi: 'लंबे समय का काम बच्चों के लिए नहीं है — कानून उनकी रक्षा करता है। (बाल श्रम कानून)',
        },
      },
    ],
  },
  {
    id: 'strong-future',
    rights: [
      {
        id: 'safety',
        title: { en: 'Right to Safety', hi: 'हिफ़ाज़त का अधिकार' },
        icon: 'crossing',
        law: LAW.safety,
      },
      {
        id: 'education',
        title: { en: 'Right to Education', hi: 'शिक्षा का अधिकार' },
        icon: 'book',
        law: LAW.education,
      },
      {
        id: 'nutrition',
        title: { en: 'Right to Nutrition', hi: 'पौष्टिक भोजन का अधिकार' },
        icon: 'food',
        law: LAW.nutrition,
      },
    ],
    options: [
      {
        id: 'crossing',
        label: {
          en: 'A child crossing the road safely',
          hi: 'बच्चा सड़क सुरक्षित पार करता है',
        },
        correctRight: 'safety',
      },
      {
        id: 'reading',
        label: {
          en: 'Children reading books with their teacher',
          hi: 'बच्चे टीचर के साथ किताबें पढ़ते हैं',
        },
        correctRight: 'education',
      },
      {
        id: 'meal',
        label: {
          en: 'Children eating a healthy school meal',
          hi: 'बच्चे पौष्टिक खाना खाते हैं',
        },
        correctRight: 'nutrition',
      },
      {
        id: 'selling',
        label: {
          en: 'A small child selling things on the street',
          hi: 'सड़क पर चीज़ें बेचता छोटा बच्चा',
        },
        correctRight: null,
        note: {
          en: 'No child should have to earn on the streets — the law is on their side. (Juvenile Justice Act)',
          hi: 'किसी बच्चे को सड़क पर कमाना न पड़े — कानून उनके साथ है। (किशोर न्याय कानून)',
        },
      },
    ],
  },
];
