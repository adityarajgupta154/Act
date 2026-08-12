/**
 * "Safe Path Adventure" — maze game content (Aug 2026), zone1 (Safe Zone).
 *
 * POCSO Act 2012 (+ POCSO Rules 2020) awareness for the 8-11 band — PRD
 * §4.2 is the authoritative source row. Every line is HARD-CODED here
 * (PRD §9.8 — game/legal copy is never AI-generated at runtime) and kept
 * implication-only + non-graphic (PRD §9.5): warning SIGNS (secrets,
 * gifts-for-secrets, online strangers, uneasy touch) — never depictions.
 * No shaming, no guilt patterns (PRD §9.6): wrong picks answer with
 * "Think again", never "you failed". Helpline digits NEVER appear in game
 * copy — the global Get Help Now pill is the ONLY helpline pathway (§9.2).
 *
 * Bilingual inline (en/hi) like the childhood game's content module; HI is
 * simple Devanagari, no emoji, Western numerals only (none needed here).
 *
 * Grid legend (rows are strings, all the same width):
 *   '#' grass (blocked) · '.' path · 'S' start · 'Z' Safe Zone goal
 *   'C' checkpoint flag · 'a'-'d' unsafe decision spots · 'T'/'P' safe spots
 * Obstacle chars map 1:1 to the level's `obstacles` entries; unsafe spots
 * carry EXACTLY two choices with EXACTLY one correct (smoke-enforced).
 */

export interface SpText {
  en: string;
  hi: string;
}

export interface SpChoice {
  id: string;
  label: SpText;
  correct: boolean;
  feedback: SpText;
}

export interface SpObstacle {
  /** Stable id — also the illustration key in data.ts (sp-<id>.webp). */
  id: string;
  /** Grid character this obstacle sits on (unique per level grid). */
  ch: string;
  kind: 'unsafe' | 'safe';
  title: SpText;
  prompt: SpText;
  /** Unsafe spots: exactly 2; safe spots: none (single OK button). */
  choices?: SpChoice[];
  lesson: SpText;
}

export interface SpQuizOption {
  id: string;
  label: SpText;
  correct: boolean;
}

export interface SpQuizQ {
  id: string;
  q: SpText;
  options: SpQuizOption[];
  explain: SpText;
}

export interface SpLevel {
  id: string;
  n: number;
  title: SpText;
  mission: SpText;
  /** Locked "coming soon" levels ship metadata only (honest 1/5 pill). */
  playable: boolean;
  grid: string[];
  obstacles: SpObstacle[];
  quiz: SpQuizQ[];
}

/* ------------------------------------------------------------------ */
/* Level 1 — Warning Signs                                             */
/* ------------------------------------------------------------------ */

const LEVEL1: SpLevel = {
  id: 'warning-signs',
  n: 1,
  title: { en: 'Warning Signs', hi: 'खतरे के संकेत' },
  mission: {
    en: 'Spot the warning signs and reach the Safe Zone.',
    hi: 'खतरे के संकेत पहचानो और सेफ ज़ोन तक पहुँचो।',
  },
  playable: true,
  grid: [
    'S....a.....#',
    '###.###.##.#',
    '###b###T##.#',
    '###.###.##.#',
    '###.C......#',
    '#####.###.##',
    '#####c###.##',
    '#####.###d##',
    'P..........Z',
  ],
  obstacles: [
    {
      id: 'secret-phone',
      ch: 'a',
      kind: 'unsafe',
      title: { en: 'A Secret Request', hi: 'राज़ रखने की माँग' },
      prompt: {
        en: 'Someone says: "This is our little secret. Do not tell your parents."',
        hi: 'कोई कहता है: "यह हमारा छोटा-सा राज़ है। मम्मी-पापा को मत बताना।"',
      },
      choices: [
        {
          id: 'tell',
          label: {
            en: 'Tell a trusted adult right away',
            hi: 'तुरंत किसी भरोसेमंद बड़े को बताओ',
          },
          correct: true,
          feedback: {
            en: 'Yes! A secret that must be hidden from parents is never a safe secret.',
            hi: 'हाँ! जो राज़ मम्मी-पापा से छिपाना पड़े, वह कभी सुरक्षित राज़ नहीं होता।',
          },
        },
        {
          id: 'keep',
          label: { en: 'Promise to keep the secret', hi: 'राज़ रखने का वादा करो' },
          correct: false,
          feedback: {
            en: 'Think again. A grown-up who asks you to hide things from parents is not keeping you safe.',
            hi: 'फिर से सोचो। जो बड़ा मम्मी-पापा से बातें छिपाने को कहे, वह तुम्हें सुरक्षित नहीं रख रहा।',
          },
        },
      ],
      lesson: {
        en: 'No safe adult ever asks you to hide things from your parents.',
        hi: 'कोई भी अच्छा बड़ा मम्मी-पापा से बातें छिपाने को नहीं कहता।',
      },
    },
    {
      id: 'online-contact',
      ch: 'b',
      kind: 'unsafe',
      title: { en: 'Unknown Online Friend', hi: 'अनजान ऑनलाइन दोस्त' },
      prompt: {
        en: 'A person you met online says: "Come meet me alone. It will be fun."',
        hi: 'ऑनलाइन मिला कोई कहता है: "अकेले मिलने आओ। मज़ा आएगा।"',
      },
      choices: [
        {
          id: 'refuse',
          label: {
            en: 'Say no and tell a trusted adult',
            hi: 'ना कहो और भरोसेमंद बड़े को बताओ',
          },
          correct: true,
          feedback: {
            en: 'Right! Never meet online strangers — tell an adult you trust.',
            hi: 'बिलकुल सही! ऑनलाइन अजनबियों से कभी मत मिलो — भरोसेमंद बड़े को बताओ।',
          },
        },
        {
          id: 'go',
          label: {
            en: 'Go alone without telling anyone',
            hi: 'बिना बताए अकेले चले जाओ',
          },
          correct: false,
          feedback: {
            en: 'Think again. People online may not be who they say they are.',
            hi: 'फिर से सोचो। ऑनलाइन लोग वही नहीं होते जो वे बताते हैं।',
          },
        },
      ],
      lesson: {
        en: 'Never meet an online stranger. Real friends never ask you to hide.',
        hi: 'ऑनलाइन अजनबी से कभी मत मिलो। सच्चे दोस्त छिपाने को नहीं कहते।',
      },
    },
    {
      id: 'gift-bribe',
      ch: 'c',
      kind: 'unsafe',
      title: { en: 'A Gift with a Secret', hi: 'राज़ वाला तोहफ़ा' },
      prompt: {
        en: 'A man offers you a gift and whispers: "Take it, but tell no one."',
        hi: 'एक आदमी तोहफ़ा देकर धीरे से कहता है: "ले लो, पर किसी को मत बताना।"',
      },
      choices: [
        {
          id: 'refuse',
          label: {
            en: 'Refuse the gift and tell a trusted adult',
            hi: 'तोहफ़ा मत लो और भरोसेमंद बड़े को बताओ',
          },
          correct: true,
          feedback: {
            en: 'Great choice! Gifts should never come with secrets.',
            hi: 'बहुत अच्छा! तोहफ़ों के साथ राज़ नहीं होने चाहिए।',
          },
        },
        {
          id: 'take',
          label: { en: 'Take the gift and stay quiet', hi: 'तोहफ़ा लेकर चुप रहो' },
          correct: false,
          feedback: {
            en: 'Think again. A gift that needs hiding is a warning sign.',
            hi: 'फिर से सोचो। जो तोहफ़ा छिपाना पड़े, वह खतरे का संकेत है।',
          },
        },
      ],
      lesson: {
        en: 'A gift that must be hidden is a warning sign.',
        hi: 'जो तोहफ़ा छिपाना पड़े, वही खतरे का संकेत है।',
      },
    },
    {
      id: 'body-boundary',
      ch: 'd',
      kind: 'unsafe',
      title: { en: 'Your Body Belongs to You', hi: 'तुम्हारा शरीर तुम्हारा है' },
      prompt: {
        en: 'A touch makes you feel strange, confused or unsafe.',
        hi: 'कोई स्पर्श अजीब, उलझन भरा या असुरक्षित महसूस कराता है।',
      },
      choices: [
        {
          id: 'no',
          label: {
            en: 'Say NO loudly, move away and tell an adult',
            hi: 'ज़ोर से ना कहो, हट जाओ और बड़ों को बताओ',
          },
          correct: true,
          feedback: {
            en: 'Yes! Saying NO is always allowed — your body belongs to you.',
            hi: 'हाँ! ना कहना हमेशा सही है — तुम्हारा शरीर तुम्हारा है।',
          },
        },
        {
          id: 'quiet',
          label: {
            en: 'Stay quiet and pretend it is fine',
            hi: 'चुप रहो और सब ठीक होने का नाटक करो',
          },
          correct: false,
          feedback: {
            en: 'Think again. Feelings like this are signals — tell someone you trust.',
            hi: 'फिर से सोचो। ऐसा महसूस होना एक संकेत है — किसी भरोसेमंद को बताओ।',
          },
        },
      ],
      lesson: {
        en: 'No one may touch you in a way that feels wrong. Saying NO is brave.',
        hi: 'कोई भी तुम्हें गलत तरीके से छू नहीं सकता। ना कहना बहादुरी है।',
      },
    },
    {
      id: 'trusted-adult',
      ch: 'T',
      kind: 'safe',
      title: { en: 'Trusted Adult', hi: 'भरोसेमंद बड़े' },
      prompt: {
        en: 'Ma says: "You can tell me anything. I will always listen and help."',
        hi: 'माँ कहती हैं: "मुझे कुछ भी बता सकते हो। मैं हमेशा सुनूँगी और मदद करूँगी।"',
      },
      lesson: {
        en: 'Talking to a trusted adult always keeps you safer.',
        hi: 'भरोसेमंद बड़ों से बात करना तुम्हें हमेशा सुरक्षित रखता है।',
      },
    },
    {
      id: 'safe-place',
      ch: 'P',
      kind: 'safe',
      title: { en: 'Safe Place', hi: 'सुरक्षित जगह' },
      prompt: {
        en: 'School is a safe place — teachers care for you and listen.',
        hi: 'स्कूल एक सुरक्षित जगह है — शिक्षक ध्यान रखते हैं और सुनते हैं।',
      },
      lesson: {
        en: 'Know your safe places: home, school and people who care.',
        hi: 'अपनी सुरक्षित जगहें जानो: घर, स्कूल और अपने लोग।',
      },
    },
  ],
  quiz: [
    {
      id: 'q1-touch',
      q: {
        en: 'What should you do if a touch makes you feel bad or confused?',
        hi: 'अगर कोई स्पर्श बुरा या उलझन भरा लगे तो क्या करोगे?',
      },
      options: [
        { id: 'a', label: { en: 'Keep quiet about it', hi: 'चुप रहो' }, correct: false },
        {
          id: 'b',
          label: {
            en: 'Say NO and tell a trusted adult',
            hi: 'ना कहो और भरोसेमंद बड़े को बताओ',
          },
          correct: true,
        },
        {
          id: 'c',
          label: { en: 'Keep quiet about it', hi: 'चुप रहो, किसी को मत बताओ' },
          correct: false,
        },
      ],
      explain: {
        en: 'Your body belongs to you. Telling a trusted adult keeps you safe — it is never your fault.',
        hi: 'तुम्हारा शरीर तुम्हारा है। भरोसेमंद बड़े को बताना तुम्हें सुरक्षित रखता है — गलती कभी तुम्हारी नहीं।',
      },
    },
    {
      id: 'q2-secret',
      q: {
        en: 'Is it okay to keep a secret that makes you feel strange or uncomfortable?',
        hi: 'क्या ऐसा राज़ रखना ठीक है जो अजीब या असहज लगे?',
      },
      options: [
        {
          id: 'a',
          label: { en: 'Yes, secrets must be kept', hi: 'हाँ, राज़ रखना ही चाहिए' },
          correct: false,
        },
        {
          id: 'b',
          label: { en: 'Only if a friend asks', hi: 'सिर्फ दोस्त कहे तो' },
          correct: false,
        },
        {
          id: 'c',
          label: {
            en: 'No — tell a trusted adult',
            hi: 'नहीं — भरोसेमंद बड़े को बताओ',
          },
          correct: true,
        },
      ],
      explain: {
        en: 'Secrets that feel wrong should always be shared with someone you trust.',
        hi: 'जो राज़ गलत लगे, उसे हमेशा किसी भरोसेमंद को बताओ।',
      },
    },
    {
      id: 'q3-trusted',
      q: { en: 'Who is a trusted adult?', hi: 'भरोसेमंद बड़ा कौन है?' },
      options: [
        {
          id: 'a',
          label: {
            en: 'A stranger who is kind online',
            hi: 'ऑनलाइन मीठा बोलने वाला अजनबी',
          },
          correct: false,
        },
        {
          id: 'b',
          label: { en: 'Your parent or teacher', hi: 'तुम्हारे माता-पिता या शिक्षक' },
          correct: true,
        },
        {
          id: 'c',
          label: { en: 'Anyone who gives gifts', hi: 'कोई भी जो तोहफ़े दे' },
          correct: false,
        },
      ],
      explain: {
        en: 'Trusted adults are people you know well who care for you and listen.',
        hi: 'भरोसेमंद बड़े वे हैं जिन्हें तुम अच्छे से जानते हो और जो तुम्हारा ध्यान रखते हैं।',
      },
    },
    {
      id: 'q4-gift',
      q: {
        en: 'Someone gives you a gift and says "keep it secret". What do you do?',
        hi: 'कोई तोहफ़ा देकर कहे "राज़ रखना"। तुम क्या करोगे?',
      },
      options: [
        { id: 'a', label: { en: 'Take it quietly', hi: 'चुपचाप ले लो' }, correct: false },
        {
          id: 'b',
          label: {
            en: 'Refuse and tell a trusted adult',
            hi: 'मना करो और भरोसेमंद बड़े को बताओ',
          },
          correct: true,
        },
        {
          id: 'c',
          label: { en: 'Say thanks and hide it', hi: 'धन्यवाद कहकर छिपा दो' },
          correct: false,
        },
      ],
      explain: {
        en: 'Gifts should never come with secrets.',
        hi: 'तोहफ़ों के साथ राज़ नहीं होने चाहिए।',
      },
    },
    {
      id: 'q5-truth',
      q: {
        en: 'If you feel unsure about telling, what should you remember?',
        hi: 'अगर बताने में झिझक हो तो क्या याद रखोगे?',
      },
      options: [
        {
          id: 'a',
          label: { en: 'It is better to stay quiet', hi: 'चुप रहना ही ठीक है' },
          correct: false,
        },
        {
          id: 'b',
          label: {
            en: 'Telling the truth is always the right thing',
            hi: 'सच बताना हमेशा सही होता है',
          },
          correct: true,
        },
        {
          id: 'c',
          label: { en: 'Wait until you grow up', hi: 'बड़े होने तक रुको' },
          correct: false,
        },
      ],
      explain: {
        en: 'Telling the truth is brave. Trusted adults will always listen and help you.',
        hi: 'सच बताना बहादुरी है। भरोसेमंद बड़े हमेशा सुनेंगे और मदद करेंगे।',
      },
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Level 2 — Online Safety (proves the data-driven architecture)       */
/* ------------------------------------------------------------------ */

const LEVEL2: SpLevel = {
  id: 'online-safety',
  n: 2,
  title: { en: 'Online Safety', hi: 'ऑनलाइन सुरक्षा' },
  mission: {
    en: 'Stay smart online and reach the Safe Zone.',
    hi: 'ऑनलाइन समझदारी दिखाओ और सेफ ज़ोन तक पहुँचो।',
  },
  playable: true,
  grid: [
    '#.....a....S',
    '#.##.###.###',
    '#.##T###b###',
    '#.##.###.###',
    '#......C.###',
    '##.###.#####',
    '##.###c#####',
    '##d###.#####',
    'Z..........P',
  ],
  obstacles: [
    {
      id: 'game-stranger',
      ch: 'a',
      kind: 'unsafe',
      title: { en: 'Game Chat Stranger', hi: 'गेम चैट में अजनबी' },
      prompt: {
        en: 'A player in your game asks: "Which school do you go to? Where do you live?"',
        hi: 'गेम में कोई पूछता है: "किस स्कूल में पढ़ते हो? कहाँ रहते हो?"',
      },
      choices: [
        {
          id: 'stop',
          label: {
            en: 'Stop chatting and tell a trusted adult',
            hi: 'चैट बंद करो और भरोसेमंद बड़े को बताओ',
          },
          correct: true,
          feedback: {
            en: 'Right! Your school and home are private information.',
            hi: 'सही! तुम्हारा स्कूल और घर निजी जानकारी है।',
          },
        },
        {
          id: 'answer',
          label: {
            en: 'Answer — they seem friendly',
            hi: 'बता दो — वे तो दोस्ताना लगते हैं',
          },
          correct: false,
          feedback: {
            en: 'Think again. Strangers online never need your private details.',
            hi: 'फिर से सोचो। ऑनलाइन अजनबियों को तुम्हारी निजी जानकारी की ज़रूरत नहीं।',
          },
        },
      ],
      lesson: {
        en: 'Your name, school and address are private — even in games.',
        hi: 'तुम्हारा नाम, स्कूल और पता निजी हैं — गेम में भी।',
      },
    },
    {
      id: 'password-private',
      ch: 'b',
      kind: 'unsafe',
      title: { en: 'Passwords are Private', hi: 'पासवर्ड निजी होता है' },
      prompt: {
        en: 'A friend says: "Share your password. Best friends share everything!"',
        hi: 'एक दोस्त कहता है: "पासवर्ड बताओ। पक्के दोस्त सब बाँटते हैं!"',
      },
      choices: [
        {
          id: 'private',
          label: {
            en: 'Keep it private — only parents may know',
            hi: 'निजी रखो — सिर्फ मम्मी-पापा जान सकते हैं',
          },
          correct: true,
          feedback: {
            en: 'Yes! A password is like the key to your house.',
            hi: 'हाँ! पासवर्ड घर की चाबी जैसा होता है।',
          },
        },
        {
          id: 'share',
          label: { en: 'Share it — friends are safe', hi: 'बता दो — दोस्त तो सुरक्षित हैं' },
          correct: false,
          feedback: {
            en: 'Think again. Even good friends should not have your password.',
            hi: 'फिर से सोचो। अच्छे दोस्तों को भी पासवर्ड नहीं देना चाहिए।',
          },
        },
      ],
      lesson: {
        en: 'Passwords are keys. Only you and your parents keep them.',
        hi: 'पासवर्ड चाबी है। इसे सिर्फ तुम और मम्मी-पापा रखते हैं।',
      },
    },
    {
      id: 'photo-request',
      ch: 'c',
      kind: 'unsafe',
      title: { en: 'A Photo Request', hi: 'फोटो की माँग' },
      prompt: {
        en: 'Someone online says: "Send me your photo. It is just for me."',
        hi: 'ऑनलाइन कोई कहता है: "अपनी फोटो भेजो। सिर्फ मेरे लिए।"',
      },
      choices: [
        {
          id: 'refuse',
          label: {
            en: 'Refuse and tell a trusted adult',
            hi: 'मना करो और भरोसेमंद बड़े को बताओ',
          },
          correct: true,
          feedback: {
            en: 'Right! Photos should never be sent to online-only people.',
            hi: 'सही! सिर्फ ऑनलाइन जानने वालों को फोटो कभी मत भेजो।',
          },
        },
        {
          id: 'send',
          label: { en: 'Send one small photo', hi: 'एक छोटी फोटो भेज दो' },
          correct: false,
          feedback: {
            en: 'Think again. Once sent, a photo can go anywhere.',
            hi: 'फिर से सोचो। भेजी गई फोटो कहीं भी पहुँच सकती है।',
          },
        },
      ],
      lesson: {
        en: 'Never send photos to someone you only know online.',
        hi: 'जिसे सिर्फ ऑनलाइन जानते हो, उसे फोटो कभी मत भेजो।',
      },
    },
    {
      id: 'prize-trick',
      ch: 'd',
      kind: 'unsafe',
      title: { en: 'Free Prize Trick', hi: 'मुफ़्त इनाम का झाँसा' },
      prompt: {
        en: 'A message flashes: "You won a big prize! Click fast and tell no one!"',
        hi: 'संदेश चमकता है: "बड़ा इनाम जीता! जल्दी क्लिक करो और किसी को मत बताना!"',
      },
      choices: [
        {
          id: 'show',
          label: {
            en: 'Do not click — show a trusted adult',
            hi: 'क्लिक मत करो — भरोसेमंद बड़े को दिखाओ',
          },
          correct: true,
          feedback: {
            en: 'Smart! "Hurry" and "tell no one" are trick words.',
            hi: 'समझदारी! "जल्दी करो" और "किसी को मत बताना" झाँसे के शब्द हैं।',
          },
        },
        {
          id: 'click',
          label: {
            en: 'Click before the prize is gone',
            hi: 'इनाम जाने से पहले क्लिक करो',
          },
          correct: false,
          feedback: {
            en: 'Think again. Real prizes never ask for secrecy.',
            hi: 'फिर से सोचो। असली इनाम कभी राज़ नहीं माँगते।',
          },
        },
      ],
      lesson: {
        en: 'Tricks say "hurry" and "keep it secret". Real things can wait.',
        hi: 'झाँसे कहते हैं "जल्दी" और "राज़ रखो"। असली चीज़ें रुक सकती हैं।',
      },
    },
    {
      id: 'teacher-listens',
      ch: 'T',
      kind: 'safe',
      title: { en: 'Your Teacher Listens', hi: 'शिक्षक सुनते हैं' },
      prompt: {
        en: 'Teacher says: "If anything online worries you, tell me. I am always here to help."',
        hi: 'शिक्षक कहते हैं: "ऑनलाइन कुछ भी परेशान करे तो मुझे बताओ। मैं हमेशा मदद के लिए हूँ।"',
      },
      lesson: {
        en: 'Teachers are trusted adults — for school and online worries too.',
        hi: 'शिक्षक भरोसेमंद बड़े हैं — स्कूल और ऑनलाइन चिंता, दोनों के लिए।',
      },
    },
    {
      id: 'tell-at-home',
      ch: 'P',
      kind: 'safe',
      title: { en: 'Tell at Home', hi: 'घर पर बताओ' },
      prompt: {
        en: 'Sharing what happens online with your family keeps you safe.',
        hi: 'ऑनलाइन जो होता है, वह परिवार को बताना तुम्हें सुरक्षित रखता है।',
      },
      lesson: {
        en: 'Home is your first safe place. Share your online world there.',
        hi: 'घर पहली सुरक्षित जगह है। अपनी ऑनलाइन दुनिया वहाँ बाँटो।',
      },
    },
  ],
  quiz: [
    {
      id: 'q1-address',
      q: {
        en: 'A player in an online game asks where you live. What do you do?',
        hi: 'ऑनलाइन गेम में कोई पूछे कि तुम कहाँ रहते हो। क्या करोगे?',
      },
      options: [
        { id: 'a', label: { en: 'Tell them politely', hi: 'विनम्रता से बता दो' }, correct: false },
        {
          id: 'b',
          label: {
            en: 'Stop chatting and tell a trusted adult',
            hi: 'चैट बंद करो और भरोसेमंद बड़े को बताओ',
          },
          correct: true,
        },
        {
          id: 'c',
          label: { en: 'Ask where they live', hi: 'उनसे पूछो कि वे कहाँ रहते हैं' },
          correct: false,
        },
      ],
      explain: {
        en: 'Your address, school and photos are private information.',
        hi: 'तुम्हारा पता, स्कूल और फोटो निजी जानकारी हैं।',
      },
    },
    {
      id: 'q2-password',
      q: { en: 'Who may know your password?', hi: 'तुम्हारा पासवर्ड कौन जान सकता है?' },
      options: [
        { id: 'a', label: { en: 'Your best friend', hi: 'तुम्हारा पक्का दोस्त' }, correct: false },
        {
          id: 'b',
          label: { en: 'Only you and your parents', hi: 'सिर्फ तुम और मम्मी-पापा' },
          correct: true,
        },
        {
          id: 'c',
          label: { en: 'Anyone who asks nicely', hi: 'जो भी प्यार से पूछे' },
          correct: false,
        },
      ],
      explain: {
        en: 'A password is like the key to your home — keep it private.',
        hi: 'पासवर्ड घर की चाबी जैसा है — इसे निजी रखो।',
      },
    },
    {
      id: 'q3-photo',
      q: {
        en: 'Someone you only know online asks for your photo.',
        hi: 'सिर्फ ऑनलाइन जानने वाला कोई तुम्हारी फोटो माँगे।',
      },
      options: [
        {
          id: 'a',
          label: {
            en: 'Refuse and tell a trusted adult',
            hi: 'मना करो और भरोसेमंद बड़े को बताओ',
          },
          correct: true,
        },
        {
          id: 'b',
          label: { en: 'Send it if they seem nice', hi: 'अच्छे लगें तो भेज दो' },
          correct: false,
        },
        { id: 'c', label: { en: 'Send an old photo', hi: 'पुरानी फोटो भेज दो' }, correct: false },
      ],
      explain: {
        en: 'Never share photos with people you only know online.',
        hi: 'सिर्फ ऑनलाइन जानने वालों के साथ फोटो कभी साझा मत करो।',
      },
    },
    {
      id: 'q4-prize',
      q: {
        en: 'A message says: "You won a prize! Click fast and tell no one."',
        hi: 'संदेश कहता है: "इनाम जीता! जल्दी क्लिक करो, किसी को मत बताना।"',
      },
      options: [
        { id: 'a', label: { en: 'Click quickly', hi: 'जल्दी क्लिक करो' }, correct: false },
        {
          id: 'b',
          label: {
            en: 'Show it to a trusted adult first',
            hi: 'पहले भरोसेमंद बड़े को दिखाओ',
          },
          correct: true,
        },
        {
          id: 'c',
          label: { en: 'Forward it to friends', hi: 'दोस्तों को भेज दो' },
          correct: false,
        },
      ],
      explain: {
        en: '"Hurry" and "keep it secret" are trick words. Real things can wait.',
        hi: '"जल्दी" और "राज़ रखो" झाँसे के शब्द हैं। असली चीज़ें रुक सकती हैं।',
      },
    },
    {
      id: 'q5-uncomfortable',
      q: {
        en: 'Something online makes you uncomfortable. What do you do?',
        hi: 'ऑनलाइन कुछ असहज करे तो क्या करोगे?',
      },
      options: [
        {
          id: 'a',
          label: {
            en: 'Close it, then tell a trusted adult',
            hi: 'बंद करो, फिर भरोसेमंद बड़े को बताओ',
          },
          correct: true,
        },
        {
          id: 'b',
          label: { en: 'Keep watching quietly', hi: 'चुपचाप देखते रहो' },
          correct: false,
        },
        { id: 'c', label: { en: 'Reply angrily', hi: 'गुस्से में जवाब दो' }, correct: false },
      ],
      explain: {
        en: 'Closing and telling keeps you safe — that is always the right choice.',
        hi: 'बंद करके बताना तुम्हें सुरक्षित रखता है — यही हमेशा सही कदम है।',
      },
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Levels 3-5 — coming soon (metadata only; keeps the /5 pill honest)  */
/* ------------------------------------------------------------------ */

const COMING_SOON: SpLevel[] = [
  {
    id: 'personal-boundaries',
    n: 3,
    title: { en: 'Personal Boundaries', hi: 'निजी सीमाएँ' },
    mission: {
      en: 'Learn about your personal space.',
      hi: 'अपनी निजी सीमाओं के बारे में जानो।',
    },
    playable: false,
    grid: [],
    obstacles: [],
    quiz: [],
  },
  {
    id: 'trusted-adults',
    n: 4,
    title: { en: 'Trusted Adults', hi: 'भरोसेमंद बड़े' },
    mission: {
      en: 'Find the people who always help.',
      hi: 'उन लोगों को पहचानो जो हमेशा मदद करते हैं।',
    },
    playable: false,
    grid: [],
    obstacles: [],
    quiz: [],
  },
  {
    id: 'mixed-safety',
    n: 5,
    title: { en: 'Mixed Safety Adventure', hi: 'मिली-जुली सुरक्षा यात्रा' },
    mission: {
      en: 'Use everything you learned.',
      hi: 'जो सीखा है, सब आज़माओ।',
    },
    playable: false,
    grid: [],
    obstacles: [],
    quiz: [],
  },
];

export const SP_LEVELS: SpLevel[] = [LEVEL1, LEVEL2, ...COMING_SOON];

/** Result-screen "What you learned" list (also the How-to-stay-safe tips). */
export const SP_LEARNINGS: SpText[] = [
  {
    en: 'Your body belongs to you — no one may make you feel unsafe.',
    hi: 'तुम्हारा शरीर तुम्हारा है — कोई तुम्हें असुरक्षित महसूस नहीं करा सकता।',
  },
  {
    en: 'Never keep secrets that feel wrong or uncomfortable.',
    hi: 'जो राज़ गलत या असहज लगे, उसे कभी मत छिपाओ।',
  },
  {
    en: 'Say NO loudly and move away — saying no is brave.',
    hi: 'ज़ोर से ना कहो और वहाँ से हट जाओ — ना कहना बहादुरी है।',
  },
  {
    en: 'Trusted adults like parents and teachers always listen and help.',
    hi: 'माता-पिता और शिक्षक जैसे भरोसेमंद बड़े हमेशा सुनते और मदद करते हैं।',
  },
  {
    en: 'It is never your fault — telling the truth always helps.',
    hi: 'गलती कभी तुम्हारी नहीं — सच बताना हमेशा मदद करता है।',
  },
];
