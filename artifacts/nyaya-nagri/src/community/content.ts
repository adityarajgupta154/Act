/**
 * Nyaya Nagri — Community content (Task 11, PRD §6.5, §9.3)
 *
 * SAFETY MODEL (hard rules):
 *  - There is NO open chat and NO user-to-user messaging anywhere in this
 *    module or the screens that render it. Every word shown to a child is
 *    pre-written, human-reviewed static content in this file.
 *  - Rights Circle prompts are multiple-choice reflections — no free text.
 *    Choices are never persisted and never leave the device.
 *  - The Circle Board below is a SIMULATION for the prototype: the sample
 *    "peer responses" were written by the Nyaya Nagri team and are clearly
 *    labeled as illustrative in the UI. In a real deployment, this board
 *    would show ONLY responses reviewed and approved by verified NGO staff
 *    or teachers BEFORE anything goes live (PRD §6.5 — moderated Rights
 *    Circles, no open DMs; PRD §9.3 — no real-time unmoderated communication
 *    between children). Real-time open messaging is intentionally out of
 *    scope for safety reasons and must not be added without that
 *    moderation infrastructure.
 *  - The "Ask a Legal Expert" FAQ is static content framed as compiled from
 *    moderated expert AMA sessions (PRD §6.5). Answers draw only on the
 *    reviewed legal content of Zones 1-5 and keep qualified wording
 *    ("can be an offence"), never promising outcomes, timelines, or secrecy.
 *  - Helpline digits 1098 / 155260 are never altered or translated.
 *  - Hindi is hand-written (simple child Hindi, tum register, acts
 *    transliterated with English parentheses) — never machine-generated.
 *  - No emojis anywhere. Sensitive topics by implication only (PRD §9.5).
 *
 * NOTE FOR REAL RELEASE: a qualified Indian legal expert should review all
 * legal statements (both languages) before public deployment.
 */
import type { Language } from '@/data/settingsStore';

export interface LocalizedText {
  en: string;
  hi: string;
}

export interface CircleOption {
  text: LocalizedText;
  /** Supportive, non-judgmental response — reflections have no wrong answers. */
  affirmation: LocalizedText;
}

export interface CirclePrompt {
  id: string;
  /** Related quest zone, or null for the general prompt shown to everyone. */
  zoneId: string | null;
  prompt: LocalizedText;
  options: CircleOption[];
  /** "Why this matters" — ties the reflection back to a real right. */
  rightsNote: LocalizedText;
}

export interface BoardPost {
  id: string;
  /** Pseudonymous handle — never a real name (PRD §6.5). */
  handle: string;
  ageBand: '8-11' | '12-15' | '16-18';
  /** Which Rights Circle prompt this sample response belongs to. */
  promptId: string;
  text: LocalizedText;
}

export interface FaqItem {
  id: string;
  /** Source zone of the legal content, or null for cross-cutting items. */
  zoneId: string | null;
  question: LocalizedText;
  answer: LocalizedText;
}

export function pickText(text: LocalizedText, language: Language): string {
  return text[language];
}

// ---------------------------------------------------------------------------
// Rights Circle prompts — multiple-choice reflections (no right/wrong).
// ---------------------------------------------------------------------------

export const CIRCLE_PROMPTS: CirclePrompt[] = [
  {
    id: 'circle_fairness',
    zoneId: null,
    prompt: {
      en: 'What would you do if you saw a friend being treated unfairly? Pick the response that feels most like you.',
      hi: 'अगर तुम देखो कि तुम्हारे दोस्त के साथ नाइंसाफ़ी हो रही है, तो तुम क्या करोगे? वह जवाब चुनो जो सबसे ज़्यादा तुम्हारे जैसा लगे।',
    },
    options: [
      {
        text: {
          en: "Speak up right away and say, 'This is not fair.'",
          hi: "तुरंत आवाज़ उठाना और कहना, 'यह ठीक नहीं है।'",
        },
        affirmation: {
          en: 'Speaking up takes courage. And if speaking up ever feels unsafe, telling a trusted adult is just as strong.',
          hi: 'आवाज़ उठाने के लिए हिम्मत चाहिए। और अगर कभी आवाज़ उठाना असुरक्षित लगे, तो किसी भरोसेमंद बड़े को बताना भी उतना ही मज़बूत कदम है।',
        },
      },
      {
        text: {
          en: 'Quietly check on your friend and ask how they are feeling.',
          hi: 'चुपचाप दोस्त के पास जाकर पूछना कि वह कैसा महसूस कर रहा है।',
        },
        affirmation: {
          en: 'Listening is real support. A friend who feels heard is no longer alone.',
          hi: 'सुनना भी सच्चा सहारा है। जिस दोस्त की बात सुनी जाती है, वह अकेला नहीं रहता।',
        },
      },
      {
        text: {
          en: 'Tell a trusted adult who can help.',
          hi: 'किसी भरोसेमंद बड़े को बताना जो मदद कर सके।',
        },
        affirmation: {
          en: 'Bringing in a trusted adult is smart, not tattling. Some problems need bigger helpers.',
          hi: 'भरोसेमंद बड़े की मदद लेना समझदारी है, चुगली नहीं। कुछ मुश्किलें बड़े मददगारों से ही सुलझती हैं।',
        },
      },
    ],
    rightsNote: {
      en: 'The Constitution says every person is equal (Articles 14 and 15). Noticing unfairness is the first step to standing up for rights — yours and your friends\'.',
      hi: 'संविधान कहता है कि हर इंसान बराबर है (अनुच्छेद 14 और 15)। नाइंसाफ़ी को पहचानना अधिकारों के लिए खड़े होने का पहला कदम है — अपने भी, दोस्तों के भी।',
    },
  },
  {
    id: 'circle_safe_zone',
    zoneId: 'zone1',
    prompt: {
      en: 'A secret is making you feel worried or heavy inside, and someone said to keep it. What feels most like you?',
      hi: 'कोई राज़ तुम्हें अंदर से परेशान या भारी महसूस करा रहा है, और किसी ने कहा है कि किसी को मत बताना। कौन-सा कदम सबसे ज़्यादा तुम्हारे जैसा लगता है?',
    },
    options: [
      {
        text: {
          en: 'Tell a trusted adult, even if it feels hard.',
          hi: 'किसी भरोसेमंद बड़े को बताना, भले ही मुश्किल लगे।',
        },
        affirmation: {
          en: 'That is exactly what safe adults are for. A secret that feels bad is never yours to carry alone.',
          hi: 'भरोसेमंद बड़े इसीलिए तो होते हैं। जो राज़ बुरा महसूस कराए, उसे अकेले उठाना तुम्हारा काम नहीं है।',
        },
      },
      {
        text: {
          en: 'Write down my feelings first, then find the words to tell someone.',
          hi: 'पहले अपनी भावनाएँ लिख लेना, फिर किसी को बताने के लिए शब्द ढूँढना।',
        },
        affirmation: {
          en: 'Finding your words in your own time is okay. The important part is that telling someone stays the plan.',
          hi: 'अपने समय पर शब्द ढूँढना बिल्कुल ठीक है। असली बात यह है कि किसी को बताने की योजना बनी रहे।',
        },
      },
      {
        text: {
          en: 'Remember: it is not my fault, and Childline 1098 can be called any time.',
          hi: 'याद रखना: गलती मेरी नहीं है, और चाइल्डलाइन को 1098 पर कभी भी कॉल किया जा सकता है।',
        },
        affirmation: {
          en: 'True on both counts. Bad-feeling secrets are never a child\'s fault, and 1098 is free and there every day, at any time.',
          hi: 'दोनों बातें सच हैं। बुरा महसूस कराने वाले राज़ में बच्चे की कभी गलती नहीं होती, और 1098 मुफ़्त है — हर दिन, हर समय।',
        },
      },
    ],
    rightsNote: {
      en: 'The Safe Zone quest taught this: your body and your feelings deserve respect, and no secret that feels wrong has to be kept. The POCSO Act protects every child under 18.',
      hi: 'सेफ़ ज़ोन क्वेस्ट ने यही सिखाया: तुम्हारा शरीर और तुम्हारी भावनाएँ सम्मान की हकदार हैं, और जो राज़ गलत महसूस हो, उसे रखना ज़रूरी नहीं। पॉक्सो (POCSO) कानून 18 साल से छोटे हर बच्चे की रक्षा करता है।',
    },
  },
  {
    id: 'circle_childhood',
    zoneId: 'zone2',
    prompt: {
      en: 'You notice a child about your age working in a shop during school hours. What feels most like you?',
      hi: 'तुम देखते हो कि तुम्हारी उम्र का एक बच्चा स्कूल के समय में एक दुकान पर काम कर रहा है। कौन-सा कदम सबसे ज़्यादा तुम्हारे जैसा लगता है?',
    },
    options: [
      {
        text: {
          en: 'Tell a parent or teacher what I saw.',
          hi: 'जो देखा, वह माता-पिता या टीचर को बताना।',
        },
        affirmation: {
          en: 'Telling a trusted adult is the safest first step — adults can bring in the right helpers, like Childline 1098.',
          hi: 'भरोसेमंद बड़े को बताना सबसे सुरक्षित पहला कदम है — बड़े सही मददगारों को जोड़ सकते हैं, जैसे चाइल्डलाइन 1098।',
        },
      },
      {
        text: {
          en: 'Wonder about their story, and ask an adult how children like them can be helped.',
          hi: 'उसकी कहानी के बारे में सोचना, और किसी बड़े से पूछना कि ऐसे बच्चों की मदद कैसे हो सकती है।',
        },
        affirmation: {
          en: 'Curiosity with kindness is how change starts. Every working child has a story — and a right to school instead.',
          hi: 'दया के साथ जिज्ञासा से ही बदलाव शुरू होता है। काम करने वाले हर बच्चे की एक कहानी है — और स्कूल जाने का अधिकार भी।',
        },
      },
      {
        text: {
          en: 'Learn what the law says, so I can explain it to others.',
          hi: 'यह जानना कि कानून क्या कहता है, ताकि मैं दूसरों को समझा सकूँ।',
        },
        affirmation: {
          en: 'Knowledge spreads. When one child knows that employing children under 14 is prohibited, a whole class can learn it.',
          hi: 'जानकारी फैलती है। जब एक बच्चा जानता है कि 14 साल से छोटों से नौकरी करवाना मना है, तो पूरी क्लास सीख सकती है।',
        },
      },
    ],
    rightsNote: {
      en: 'From the Right to Childhood quest: children under 14 cannot be employed in any occupation, and every child aged 6 to 14 has the right to free schooling.',
      hi: 'बचपन का अधिकार क्वेस्ट से: 14 साल से छोटे बच्चों से किसी भी काम में नौकरी नहीं करवाई जा सकती, और 6 से 14 साल के हर बच्चे को मुफ़्त पढ़ाई का अधिकार है।',
    },
  },
  {
    id: 'circle_school',
    zoneId: 'zone3',
    prompt: {
      en: 'A classmate stops coming to school because their family cannot pay for things. What feels most like you?',
      hi: 'एक सहपाठी स्कूल आना बंद कर देता है क्योंकि उसका परिवार खर्च नहीं उठा सकता। कौन-सा कदम सबसे ज़्यादा तुम्हारे जैसा लगता है?',
    },
    options: [
      {
        text: {
          en: 'Tell our teacher what happened.',
          hi: 'जो हुआ, वह टीचर को बताना।',
        },
        affirmation: {
          en: 'Teachers can act on this — no school can turn a child away over money before Class 8.',
          hi: 'टीचर इस पर कदम उठा सकते हैं — क्लास 8 से पहले कोई स्कूल पैसों की वजह से बच्चे को नहीं लौटा सकता।',
        },
      },
      {
        text: {
          en: 'Share what I learned: government schools are free up to Class 8, with free books and uniforms.',
          hi: 'जो सीखा वह बताना: सरकारी स्कूलों में क्लास 8 तक पढ़ाई मुफ़्त है, किताबें और यूनिफ़ॉर्म भी मुफ़्त।',
        },
        affirmation: {
          en: 'Exactly right — that is the RTE Act. Sharing it might bring a friend back to school.',
          hi: 'बिल्कुल सही — यही आरटीई (RTE) कानून है। यह बात बताने से शायद कोई दोस्त स्कूल लौट आए।',
        },
      },
      {
        text: {
          en: 'Ask a trusted adult to talk with the classmate\'s family.',
          hi: 'किसी भरोसेमंद बड़े से कहना कि वह सहपाठी के परिवार से बात करे।',
        },
        affirmation: {
          en: 'Families sometimes do not know their child\'s rights. One kind adult conversation can open the school door again.',
          hi: 'कई बार परिवारों को बच्चे के अधिकार पता नहीं होते। बड़ों की एक अच्छी बातचीत स्कूल का दरवाज़ा फिर खोल सकती है।',
        },
      },
    ],
    rightsNote: {
      en: 'From the School Rights quest: elementary education (up to Class 8) is free in government schools, and no child can be expelled for inability to pay.',
      hi: 'स्कूल अधिकार क्वेस्ट से: सरकारी स्कूलों में प्रारंभिक पढ़ाई (क्लास 8 तक) मुफ़्त है, और पैसे न होने पर किसी बच्चे को स्कूल से नहीं निकाला जा सकता।',
    },
  },
  {
    id: 'circle_justice',
    zoneId: 'zone4',
    prompt: {
      en: 'A friend says they are scared of the police after watching a movie. What feels most like you?',
      hi: 'एक दोस्त कहता है कि फ़िल्म देखने के बाद उसे पुलिस से डर लगने लगा है। कौन-सा कदम सबसे ज़्यादा तुम्हारे जैसा लगता है?',
    },
    options: [
      {
        text: {
          en: 'Share what I learned: specially trained, child-friendly officers handle anything involving children.',
          hi: 'जो सीखा वह बताना: बच्चों से जुड़ी हर बात खास प्रशिक्षित, बच्चों के अनुकूल अफ़सर सँभालते हैं।',
        },
        affirmation: {
          en: 'Yes — every police station is supposed to have a child welfare police officer, and the law treats children differently from adults.',
          hi: 'हाँ — कानून के हिसाब से हर थाने में एक बाल कल्याण पुलिस अफ़सर होना चाहिए, और कानून बच्चों के साथ बड़ों से अलग व्यवहार करता है।',
        },
      },
      {
        text: {
          en: 'Tell them a child can never be kept in a police lockup or jail.',
          hi: 'उसे बताना कि किसी बच्चे को कभी पुलिस लॉकअप या जेल में नहीं रखा जा सकता।',
        },
        affirmation: {
          en: 'That is one of the strongest protections in the JJ Act — worth repeating to any scared friend.',
          hi: 'यह जेजे (JJ) एक्ट की सबसे मज़बूत सुरक्षाओं में से एक है — हर डरे हुए दोस्त को बताने लायक बात।',
        },
      },
      {
        text: {
          en: 'Suggest asking a teacher to explain who protects children, and how.',
          hi: 'सुझाव देना कि टीचर से पूछें कि बच्चों की रक्षा कौन करता है और कैसे।',
        },
        affirmation: {
          en: 'Great instinct — the CWC, the JJB, and Childline 1098 all exist to protect children, and a teacher can explain each one.',
          hi: 'बहुत अच्छी सोच — सीडब्ल्यूसी (CWC), जेजेबी (JJB) और चाइल्डलाइन 1098, सब बच्चों की रक्षा के लिए हैं, और टीचर हर एक के बारे में समझा सकते हैं।',
        },
      },
    ],
    rightsNote: {
      en: 'From the Justice System Simulator: the law around children is built to protect, not punish — trained officers, child-friendly committees, and bail as the norm.',
      hi: 'न्याय प्रणाली सिम्युलेटर से: बच्चों से जुड़ा कानून सज़ा देने के लिए नहीं, रक्षा करने के लिए बना है — प्रशिक्षित अफ़सर, बच्चों के अनुकूल समितियाँ, और ज़मानत ही सामान्य नियम।',
    },
  },
  {
    id: 'circle_digital',
    zoneId: 'zone5',
    prompt: {
      en: 'In a group chat, people start making fun of one classmate. What feels most like you?',
      hi: 'एक ग्रुप चैट में लोग एक सहपाठी का मज़ाक उड़ाने लगते हैं। कौन-सा कदम सबसे ज़्यादा तुम्हारे जैसा लगता है?',
    },
    options: [
      {
        text: {
          en: 'Refuse to join in, and send the classmate a kind private message.',
          hi: 'मज़ाक में शामिल न होना, और सहपाठी को अलग से एक अच्छा-सा संदेश भेजना।',
        },
        affirmation: {
          en: 'One kind message tells someone they are not alone — that can change their whole day.',
          hi: 'एक अच्छा संदेश बता देता है कि वह अकेला नहीं है — इससे उसका पूरा दिन बदल सकता है।',
        },
      },
      {
        text: {
          en: 'Save screenshots and tell a trusted adult.',
          hi: 'स्क्रीनशॉट सँभालकर रखना और किसी भरोसेमंद बड़े को बताना।',
        },
        affirmation: {
          en: 'Screenshots preserve proof before posts vanish, and a trusted adult can involve the school. Smart and safe.',
          hi: 'पोस्ट गायब होने से पहले स्क्रीनशॉट सबूत बचा लेते हैं, और भरोसेमंद बड़े स्कूल तक बात पहुँचा सकते हैं। समझदार और सुरक्षित कदम।',
        },
      },
      {
        text: {
          en: 'Use the app\'s report and block tools.',
          hi: 'ऐप के रिपोर्ट और ब्लॉक टूल इस्तेमाल करना।',
        },
        affirmation: {
          en: 'Report and block exist exactly for this. No counter-attack needed — the strong move is help, not revenge.',
          hi: 'रिपोर्ट और ब्लॉक इसीलिए बने हैं। पलटवार की ज़रूरत नहीं — मज़बूत कदम है मदद, बदला नहीं।',
        },
      },
    ],
    rightsNote: {
      en: 'From the Digital Safety quest: never join the harm, keep proof, involve trusted adults — and remember, serious online harassment can be an offence under the IT Act.',
      hi: 'डिजिटल सुरक्षा क्वेस्ट से: कभी नुकसान में शामिल मत हो, सबूत सँभालो, भरोसेमंद बड़ों को जोड़ो — और याद रखो, गंभीर ऑनलाइन उत्पीड़न आईटी (IT) एक्ट के तहत अपराध हो सकता है।',
    },
  },
];

/**
 * Selects the Rights Circle prompts to show (4 of the pool): the general
 * prompt first, then zone prompts — prompts for COMPLETED zones take
 * priority (PRD/Task 11: prompts relate to completed quests), and the
 * dayIndex rotates the mix so the screen changes day to day. Pure and
 * deterministic for testing.
 */
export function selectCirclePrompts(
  completedZones: Record<string, boolean>,
  dayIndex: number,
): CirclePrompt[] {
  const rotate = <T,>(arr: T[], k: number): T[] =>
    arr.length === 0 ? arr : arr.map((_, i) => arr[(i + (k % arr.length) + arr.length) % arr.length]);

  const general = CIRCLE_PROMPTS.filter((p) => p.zoneId === null);
  const zonePrompts = CIRCLE_PROMPTS.filter((p) => p.zoneId !== null);
  const completed = zonePrompts.filter((p) => completedZones[p.zoneId as string] === true);
  const upcoming = zonePrompts.filter((p) => completedZones[p.zoneId as string] !== true);

  return [...general, ...rotate(completed, dayIndex), ...rotate(upcoming, dayIndex)].slice(0, 4);
}

// ---------------------------------------------------------------------------
// Circle Board — SIMULATED sample peer responses (prototype only).
//
// MODERATION NOTE (real deployment): this board must show only content that
// verified NGO staff or teachers have reviewed and approved BEFORE it goes
// live. Children never post directly to other children, there are no DMs,
// and no free-text field feeds this board from the client. These six sample
// posts were written by the Nyaya Nagri team as illustrations of what safe,
// approved responses would look like — they are not from real children, and
// the UI labels them as illustrative.
// ---------------------------------------------------------------------------

export const BOARD_POSTS: BoardPost[] = [
  {
    id: 'post_fairness_1',
    handle: 'TaraStar_11',
    ageBand: '8-11',
    promptId: 'circle_fairness',
    text: {
      en: 'When my friend was left out of a game, I said everyone plays or no one plays. It worked! Being fair felt good.',
      hi: 'जब मेरे दोस्त को खेल से बाहर रखा गया, मैंने कहा या तो सब खेलेंगे या कोई नहीं। और यह काम कर गया! इंसाफ़ से रहना अच्छा लगा।',
    },
  },
  {
    id: 'post_childhood_1',
    handle: 'NeelPankh_09',
    ageBand: '8-11',
    promptId: 'circle_childhood',
    text: {
      en: 'I saw a boy working at a tea stall and told my teacher. She said telling an adult was the right step, and explained how helpers like Childline 1098 can step in.',
      hi: 'मैंने एक लड़के को चाय की दुकान पर काम करते देखा और अपनी टीचर को बताया। उन्होंने कहा कि बड़ों को बताना सही कदम था, और समझाया कि चाइल्डलाइन 1098 जैसे मददगार कैसे आगे आ सकते हैं।',
    },
  },
  {
    id: 'post_school_1',
    handle: 'AsmaniPatang_13',
    ageBand: '12-15',
    promptId: 'circle_school',
    text: {
      en: 'My cousin thought school could throw her out for failing one test. I shared what I learned here — no expulsion before Class 8. She was so relieved.',
      hi: 'मेरी कज़िन को लगता था कि एक टेस्ट में फ़ेल होने पर स्कूल उसे निकाल सकता है। मैंने यहाँ सीखी बात बताई — क्लास 8 से पहले स्कूल से नहीं निकाला जा सकता। उसे बड़ी राहत मिली।',
    },
  },
  {
    id: 'post_digital_1',
    handle: 'ShantChand_14',
    ageBand: '12-15',
    promptId: 'circle_digital',
    text: {
      en: 'Someone made a joke account about a classmate. We did not forward anything, saved screenshots, and reported it together. The account was removed.',
      hi: 'किसी ने एक सहपाठी के नाम से मज़ाक वाला अकाउंट बनाया। हमने कुछ भी आगे नहीं भेजा, स्क्रीनशॉट सँभाले और साथ मिलकर रिपोर्ट किया। अकाउंट हटा दिया गया।',
    },
  },
  {
    id: 'post_justice_1',
    handle: 'SuryaKiran_16',
    ageBand: '16-18',
    promptId: 'circle_justice',
    text: {
      en: 'I used to think police always meant trouble. Learning about the CWC and JJB changed that — the system for children is supposed to protect first. I explained it to my younger brother too.',
      hi: 'मुझे लगता था कि पुलिस का मतलब हमेशा मुसीबत है। सीडब्ल्यूसी (CWC) और जेजेबी (JJB) के बारे में सीखकर सोच बदल गई — बच्चों के लिए बनी व्यवस्था का पहला काम रक्षा करना है। मैंने अपने छोटे भाई को भी समझाया।',
    },
  },
  {
    id: 'post_safe_zone_1',
    handle: 'HimmatDeep_17',
    ageBand: '16-18',
    promptId: 'circle_safe_zone',
    text: {
      en: 'The biggest thing I learned: a secret that feels wrong is never ours to carry alone, and telling a trusted adult is strength, not weakness.',
      hi: 'सबसे बड़ी बात जो मैंने सीखी: जो राज़ गलत महसूस हो, उसे अकेले उठाना हमारा काम नहीं, और भरोसेमंद बड़े को बताना कमज़ोरी नहीं, ताकत है।',
    },
  },
];

// ---------------------------------------------------------------------------
// "Ask a Legal Expert" — static FAQ, framed as compiled from moderated
// expert AMA sessions (PRD §6.5). Content mirrors the reviewed legal facts
// of Zones 1-5; qualified wording preserved; no outcome/secrecy promises.
// ---------------------------------------------------------------------------

export const EXPERT_FAQ: FaqItem[] = [
  {
    id: 'faq_pocso',
    zoneId: 'zone1',
    question: {
      en: 'What is the POCSO Act, and who does it protect?',
      hi: 'पॉक्सो (POCSO) कानून क्या है, और यह किसकी रक्षा करता है?',
    },
    answer: {
      en: 'The POCSO Act, 2012 is a special law that protects every child under 18 — of any gender — from unsafe touch, unsafe secrets, and people who try to take advantage of a child, online and offline. It also makes reporting and the court process child-friendly, with special courts and support persons so the process is gentler for the child. A child who reports is someone to protect, never someone in trouble.',
      hi: 'पॉक्सो (POCSO) कानून, 2012 एक खास कानून है जो 18 साल से छोटे हर बच्चे की — चाहे लड़का हो या लड़की — गलत छुअन, गलत राज़ और बच्चे का गलत फ़ायदा उठाने वालों से रक्षा करता है, ऑनलाइन और ऑफ़लाइन दोनों जगह। यह रिपोर्ट करने और अदालत की प्रक्रिया को भी बच्चों के अनुकूल बनाता है — विशेष अदालतें और सहायता देने वाले लोग, ताकि प्रक्रिया बच्चे के लिए नरम रहे। जो बच्चा रिपोर्ट करता है, वह रक्षा पाने वाला होता है, मुसीबत में पड़ने वाला नहीं।',
    },
  },
  {
    id: 'faq_bad_secret',
    zoneId: 'zone1',
    question: {
      en: 'A touch or a secret makes me feel bad or confused. What can I do?',
      hi: 'कोई छुअन या राज़ मुझे बुरा या उलझन भरा महसूस कराता है। मैं क्या कर सकता/सकती हूँ?',
    },
    answer: {
      en: 'Your body belongs to you, and a touch or secret that feels wrong does not have to be kept. Tell a trusted adult — a parent, teacher, or relative — and if the first person does not listen, keep telling until someone does. You can also call Childline free at 1098, any time, day or night. It is never the child\'s fault.',
      hi: 'तुम्हारा शरीर तुम्हारा अपना है, और जो छुअन या राज़ गलत महसूस हो, उसे रखना ज़रूरी नहीं। किसी भरोसेमंद बड़े को बताओ — माता-पिता, टीचर या कोई रिश्तेदार — और अगर पहला इंसान न सुने, तो तब तक बताते रहो जब तक कोई सुन न ले। तुम चाइल्डलाइन को 1098 पर मुफ़्त कॉल भी कर सकते हो, किसी भी समय, दिन हो या रात। इसमें बच्चे की कभी कोई गलती नहीं होती।',
    },
  },
  {
    id: 'faq_child_labour',
    zoneId: 'zone2',
    question: {
      en: 'Can a child under 14 have a job?',
      hi: 'क्या 14 साल से छोटा बच्चा नौकरी कर सकता है?',
    },
    answer: {
      en: 'No. The law says children under 14 cannot be employed in any occupation. The one narrow exception is helping your own family\'s work after school hours or in vacations — only if it is safe, non-hazardous, and does not harm your education. And from 14 to 18, the law bans work in a schedule of hazardous occupations and processes.',
      hi: 'नहीं। कानून कहता है कि 14 साल से छोटे बच्चों से किसी भी काम में नौकरी नहीं करवाई जा सकती। एक ही सीमित छूट है: स्कूल के बाद या छुट्टियों में अपने ही परिवार के काम में हाथ बँटाना — वह भी तभी जब काम सुरक्षित हो, ख़तरनाक न हो और पढ़ाई को नुकसान न पहुँचाए। और 14 से 18 साल के किशोरों के लिए ख़तरनाक कामों की सूची में काम करना मना है।',
    },
  },
  {
    id: 'faq_school_fees',
    zoneId: 'zone3',
    question: {
      en: 'Does school cost money? What if a family cannot pay?',
      hi: 'क्या स्कूल के लिए पैसे लगते हैं? अगर परिवार खर्च न उठा पाए तो?',
    },
    answer: {
      en: 'Under the RTE Act, elementary education — up to Class 8 — is free in government schools: no fees, and money should never stop a child from finishing school. Government schools also provide free textbooks, and many states give free uniforms too. No child can be turned away or expelled for inability to pay. Private unaided schools (except minority institutions) must also keep 25 percent of their entry-level seats (Class 1 or pre-primary) for children from disadvantaged groups and weaker sections, with the government paying the school back.',
      hi: 'आरटीई (RTE) कानून के तहत सरकारी स्कूलों में प्रारंभिक पढ़ाई — क्लास 8 तक — मुफ़्त है: कोई फ़ीस नहीं, और पैसों की कमी किसी बच्चे की पढ़ाई नहीं रोकनी चाहिए। सरकारी स्कूल किताबें भी मुफ़्त देते हैं, और कई राज्य मुफ़्त यूनिफ़ॉर्म भी देते हैं। पैसे न होने पर किसी बच्चे को न स्कूल से लौटाया जा सकता है, न निकाला जा सकता है। निजी (बिना सरकारी मदद वाले) स्कूलों को भी — अल्पसंख्यक संस्थानों को छोड़कर — अपनी शुरुआती क्लास (क्लास 1 या प्री-प्राइमरी) की 25 प्रतिशत सीटें वंचित और कमज़ोर वर्गों के बच्चों के लिए रखनी होती हैं, जिनका खर्च सरकार स्कूल को लौटाती है।',
    },
  },
  {
    id: 'faq_expulsion',
    zoneId: 'zone3',
    question: {
      en: 'Can a school expel a student for failing a test?',
      hi: 'क्या स्कूल किसी छात्र को टेस्ट में फ़ेल होने पर निकाल सकता है?',
    },
    answer: {
      en: 'Not before the child completes elementary school (Class 8). Expulsion for failing is not allowed. Being held back a year can happen only in Classes 5 and 8, only in states that chose that option, and only after a second-chance re-exam.',
      hi: 'बच्चे के क्लास 8 पूरी करने से पहले नहीं। फ़ेल होने पर स्कूल से निकालना मना है। एक साल पीछे रखना सिर्फ़ क्लास 5 और 8 में हो सकता है, सिर्फ़ उन राज्यों में जिन्होंने यह विकल्प चुना है, और वह भी दोबारा परीक्षा का मौका देने के बाद।',
    },
  },
  {
    id: 'faq_police',
    zoneId: 'zone4',
    question: {
      en: 'What happens if the police need to talk to a child?',
      hi: 'अगर पुलिस को किसी बच्चे से बात करनी हो तो क्या होता है?',
    },
    answer: {
      en: 'Children are handled by specially trained officers — the Special Juvenile Police Unit or a child welfare police officer, in plain clothes. No handcuffs, and a child can never be kept in a police lockup or jail. Parents or guardians are informed as soon as possible, the child is produced before the Juvenile Justice Board within 24 hours (excluding journey time), and for children, release on bail is the norm. If a child is not released, they stay in an observation home for children — never a jail.',
      hi: 'बच्चों से जुड़े मामले खास प्रशिक्षित अफ़सर सँभालते हैं — विशेष किशोर पुलिस इकाई (SJPU) या बाल कल्याण पुलिस अफ़सर, सादे कपड़ों में। हथकड़ी नहीं लगती, और बच्चे को कभी पुलिस लॉकअप या जेल में नहीं रखा जा सकता। माता-पिता या अभिभावकों को जल्द से जल्द बताया जाता है, बच्चे को 24 घंटे के अंदर (सफ़र का समय छोड़कर) किशोर न्याय बोर्ड (JJB) के सामने लाया जाता है, और बच्चों के लिए ज़मानत ही सामान्य नियम है। अगर बच्चे को छोड़ा नहीं जाता, तो वह बच्चों के लिए बने ऑब्ज़र्वेशन होम में रहता है — जेल में कभी नहीं।',
    },
  },
  {
    id: 'faq_cwc_jjb',
    zoneId: 'zone4',
    question: {
      en: 'What is the difference between the CWC and the JJB?',
      hi: 'सीडब्ल्यूसी (CWC) और जेजेबी (JJB) में क्या फ़र्क है?',
    },
    answer: {
      en: 'The Child Welfare Committee (CWC) is for children who need care and protection — a child in an unsafe situation goes before the district CWC within 24 hours, and practically anyone, including the child, can approach it. The Juvenile Justice Board (JJB) is for children accused of breaking the law. Both are child-friendly bodies, not regular criminal courts, and both exist to protect the child\'s rights and future.',
      hi: 'बाल कल्याण समिति (CWC) उन बच्चों के लिए है जिन्हें देखभाल और सुरक्षा चाहिए — असुरक्षित स्थिति में फँसा बच्चा 24 घंटे के अंदर ज़िले की सीडब्ल्यूसी के सामने लाया जाता है, और लगभग कोई भी, खुद बच्चा भी, वहाँ जा सकता है। किशोर न्याय बोर्ड (JJB) उन बच्चों के लिए है जिन पर कानून तोड़ने का आरोप है। दोनों बच्चों के अनुकूल संस्थाएँ हैं, आम आपराधिक अदालतें नहीं, और दोनों का मकसद बच्चे के अधिकार और भविष्य की रक्षा करना है।',
    },
  },
  {
    id: 'faq_cyberbullying',
    zoneId: 'zone5',
    question: {
      en: 'What can I do about cyberbullying?',
      hi: 'साइबरबुलिंग के खिलाफ़ मैं क्या कर सकता/सकती हूँ?',
    },
    answer: {
      en: 'Do not reply or counter-attack — that feeds the fire and can cross lines itself. Save screenshots as proof before posts vanish, use the app\'s report and block tools, and tell a trusted adult who can involve the school. Serious online harassment can be an offence under the IT Act, and online crimes can be reported via the Cyber Crime Helpline 155260 or the National Cyber Crime Reporting Portal.',
      hi: 'जवाब मत दो और पलटवार मत करो — इससे आग और भड़कती है और खुद हदें पार हो सकती हैं। पोस्ट गायब होने से पहले सबूत के लिए स्क्रीनशॉट सँभालो, ऐप के रिपोर्ट और ब्लॉक टूल इस्तेमाल करो, और किसी भरोसेमंद बड़े को बताओ जो स्कूल तक बात पहुँचा सके। गंभीर ऑनलाइन उत्पीड़न आईटी (IT) एक्ट के तहत अपराध हो सकता है, और ऑनलाइन अपराध साइबर क्राइम हेल्पलाइन 155260 या राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल पर रिपोर्ट किए जा सकते हैं।',
    },
  },
  {
    id: 'faq_online_threats',
    zoneId: 'zone5',
    question: {
      en: 'Someone online is asking for my photos or threatening me. What should I do?',
      hi: 'कोई ऑनलाइन मेरी फ़ोटो माँग रहा है या मुझे धमका रहा है। मुझे क्या करना चाहिए?',
    },
    answer: {
      en: 'It is not your fault, and threats should not be obeyed — giving in often leads to more demands. Do not send anything and do not pay. Save the messages as proof, tell a trusted adult right away, and report it — via the Cyber Crime Helpline 155260, the National Cyber Crime Reporting Portal, or Childline 1098. The POCSO Act protects everyone under 18 from this kind of online harm, and the child who reports is treated as someone to protect, never to punish.',
      hi: 'गलती तुम्हारी नहीं है, और धमकी मानना ज़रूरी नहीं — झुकने पर अक्सर माँगें और बढ़ती हैं। कुछ भी मत भेजो और पैसे मत दो। सबूत के लिए संदेश सँभालो, तुरंत किसी भरोसेमंद बड़े को बताओ, और रिपोर्ट करो — साइबर क्राइम हेल्पलाइन 155260, राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल, या चाइल्डलाइन 1098 पर। पॉक्सो (POCSO) कानून 18 साल से छोटे हर बच्चे की इस तरह के ऑनलाइन नुकसान से रक्षा करता है, और रिपोर्ट करने वाले बच्चे को रक्षा मिलती है, सज़ा कभी नहीं।',
    },
  },
  {
    id: 'faq_calling_1098',
    zoneId: null,
    question: {
      en: 'What actually happens when someone calls Childline 1098?',
      hi: 'जब कोई चाइल्डलाइन को 1098 पर कॉल करता है तो असल में क्या होता है?',
    },
    answer: {
      en: 'A trained adult answers — free of charge, any time, day or night. They listen kindly, and the caller can share as much as they feel ready to. Depending on what is needed, they help connect the child to the right support — like the Child Welfare Committee, medical help, or a safe adult nearby. You can also call about another child you are worried about.',
      hi: 'एक प्रशिक्षित बड़ा फ़ोन उठाता है — बिल्कुल मुफ़्त, किसी भी समय, दिन हो या रात। वे प्यार से सुनते हैं, और जितना बताने का मन हो उतना ही बताना काफ़ी है। ज़रूरत के हिसाब से वे बच्चे को सही मदद से जोड़ते हैं — जैसे बाल कल्याण समिति (CWC), डॉक्टरी मदद, या पास का कोई सुरक्षित बड़ा। तुम किसी और बच्चे की चिंता में भी कॉल कर सकते हो।',
    },
  },
];
