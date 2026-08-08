/**
 * Nyaya Nagri — UI string bundles, English + Hindi (Task 10, PRD §6.4)
 *
 * Every user-facing UI string lives here (quest CONTENT lives in the
 * per-language quest files under quests/content and quests/recaps*).
 * The Hindi bundle is hand-written in clear, simple child-appropriate
 * Hindi — never machine/AI-generated at runtime (PRD §9.8). Helpline
 * numbers are digits and identical in every language; helpline meaning is
 * never altered. No emojis anywhere.
 *
 * The UIStrings interface makes bundle completeness a compile-time check:
 * a missing Hindi key is a type error, not a silent English fallback.
 */
import type { Language } from '@/data/settingsStore';
import { useSettings } from '@/data/settingsStore';

export interface ZoneStrings {
  name: string;
  theme: string;
}

export interface UIStrings {
  // HUD / map
  appTitle: string;
  myProgress: string;
  settings: string;
  pressToEnter: string;
  locked: string;
  completeFirst: (zoneName: string) => string;
  startQuest: (questTitle: string) => string;
  backToMap: string;

  // Level select (Task 15)
  chooseLevel: string;
  levelN: (n: number) => string;
  levelKindNames: Record<'story' | 'decision' | 'quiz', string>;
  completePreviousLevel: string;
  startLevelLabel: string;
  practiceReplay: string;
  practiceNote: string;
  levelCompletedTag: string;
  levelComplete: string;
  practiceComplete: string;
  nextLevelUnlocked: (levelName: string) => string;
  backToLevels: string;

  // Zones (names + one-line themes)
  zones: Record<string, ZoneStrings>;

  // Quest player
  preQuizTitle: string;
  postQuizTitle: string;
  leaveQuest: string;
  questionXofY: (current: number, total: number) => string;
  correct: string;
  notQuite: string;
  continueLabel: string;
  whatWillYouDo: string;
  questComplete: string;
  youGotXofY: (score: number, total: number) => string;
  unlockedNext: (zoneName: string) => string;
  recapTitle: string;
  recapXofY: (current: number, total: number) => string;
  recapGotIt: string;
  recapTryAgainIntro: string;
  readAloud: string;
  stopReading: string;

  // Progress dashboard
  progressTitle: string;
  closeProgress: string;
  completedXofY: (done: number, total: number) => string;
  encouragementStart: string;
  encouragementMid: string;
  encouragementAll: string;
  badgesEarned: (count: number) => string;
  zoneComplete: string;
  zoneReady: string;
  zoneLocked: string;
  teacherSection: string;
  teacherSectionSub: string;
  showSummary: string;
  hideSummary: string;
  teacherSummaryTitle: string;
  teacherPrivacyNote: string;
  teacherEmpty: string;
  colZone: string;
  colBefore: string;
  colAfter: string;
  colChange: string;
  ptsChange: (delta: number) => string;
  avgImprovement: string;
  sessionIdLabel: string;

  // Help dialog — helpline names/numbers must stay exact in every language
  getHelpNow: string;
  emergencyHelp: string;
  childline: string;
  cyberCrime: string;
  available247: string;
  close: string;

  // Avatar widget
  guideIntro: string;
  yourGuide: string;
  aiCompanion: string;
  thinking: string;
  askAnything: string;
  guideResting: string;
  toggleVoice: string;
  openGuide: string;
  closeChat: string;
  zoneWelcomeFallback: (zoneName: string, theme: string) => string;

  // Settings panel
  settingsTitle: string;
  languageLabel: string;
  languageEnglish: string;
  languageHindi: string;
  narrationLabel: string;
  narrationHint: string;
  narrationUnsupported: string;
  dyslexiaLabel: string;
  dyslexiaHint: string;
  contrastLabel: string;
  contrastHint: string;
  textSizeLabel: string;
  textSizeSmall: string;
  textSizeMedium: string;
  textSizeLarge: string;
  on: string;
  off: string;
  done: string;

  // Community screen (Task 11) — static, moderated-by-design content
  community: string;
  communityTitle: string;
  closeCommunity: string;
  tabCircle: string;
  tabBoard: string;
  tabExpert: string;
  safeByDesignNote: string;
  circleIntro: string;
  promptsRotateNote: string;
  fromZone: (zoneName: string) => string;
  generalPromptTag: string;
  whyThisMatters: string;
  thanksForReflecting: string;
  boardIntro: string;
  boardIllustrative: string;
  boardModerationNote: string;
  expertIntro: string;
  expertDisclaimer: string;
  ageLabel: (band: string) => string;

  // Get Help screen (Task 12) — helpline digits stay identical everywhere
  callNow: string;
  whatHappensWhenYouCall: string;
  helpBullets: string[];
  cyberCrimeNote: string;
  openCyberPortal: string;
  pocsoEbox: string;
  pocsoEboxNote: string;
  openNcpcrSite: string;
  safetyReminderTitle: string;
  safetyReminderBody: string;
  seeHelpOptions: string;

  // Onboarding (Task 13) — intro, age band, guardian consent (DPDP-aware)
  welcomeTitle: string;
  welcomeBody: string;
  chooseLanguage: string;
  howItWorksTitle: string;
  howItWorksPoints: string[];
  howOldAreYou: string;
  ageWhy: string;
  ageBandDesc811: string;
  ageBandDesc1215: string;
  ageBandDesc1618: string;
  guardianTitle: string;
  guardianIntro: string;
  whatIsStoredTitle: string;
  storedPoints: string[];
  notStoredNote: string;
  consentCheckbox: string;
  prototypeNote: string;
  startPlaying: string;
  next: string;
  back: string;

  // Ambient audio setting (Task 13)
  ambientLabel: string;
  ambientHint: string;

  // Player avatar builder (Task 14) — cartoon assets only, nickname never a real name
  buildAvatarTitle: string;
  buildAvatarHint: string;
  baseLookLabel: string;
  baseLookNames: string[];
  skinToneLabel: string;
  hairLabel: string;
  hairStyleNames: string[];
  outfitLabel: string;
  outfitNames: string[];
  accessoriesLabel: string;
  accessoryNames: string[];
  pickNickname: string;
  nicknameHint: string;
  nicknamePlaceholder: string;
  editAvatar: string;
  saveChanges: string;
  cancel: string;

  // Game economy (Task 16, PRD §7.3) — "Player Rank" wording is deliberate:
  // it must never be confused with the in-zone "Level X" (Task 15). Streak
  // copy is gentle by design (§9.6). Leaderboard copy makes the cohort-only
  // scope explicit (§9.7). Shop copy states no-real-money plainly.
  playerRankChip: (rank: number) => string;
  coinsChip: (coins: number) => string;
  openShopLabel: string;
  streakChip: (days: number) => string;
  streakNote: string;
  rewardsLine: (xp: number, coins: number) => string;
  titleUnlocked: (titleName: string) => string;

  // Avatar Shop (cosmetic-only)
  avatarShopTitle: string;
  shopIntro: string;
  shopNoRealMoney: string;
  shopBuy: string;
  shopOwned: string;
  shopConfirm: (name: string, price: number) => string;
  shopYesBuy: string;
  shopNotNow: string;
  shopNotEnough: string;
  shopEquipHint: string;
  coinPrice: (price: number) => string;

  // Player profile section (private — inside My Progress)
  profileHeading: string;
  playerRankLabel: string;
  totalXpLabel: string;
  coinsLabel: string;
  streakLabel: string;
  streakDays: (days: number) => string;
  xpToNext: (xp: number) => string;
  titlesHeading: string;
  titlesPrivateNote: string;
  noTitlesYet: string;
  titleNames: Record<string, string>;

  // Cohort leaderboard (opt-in, default OFF, never public)
  tabLeaderboard: string;
  leaderboardTitle: string;
  leaderboardIntro: string;
  leaderboardOptInLabel: string;
  leaderboardOffNote: string;
  leaderboardDemoNote: string;
  leaderboardYouTag: string;
  leaderboardNeverPublic: string;
  leaderboardXp: (xp: number) => string;
}

const EN: UIStrings = {
  appTitle: 'Nyaya Nagri',
  myProgress: 'My Progress',
  settings: 'Settings',
  pressToEnter: 'Press E or Tap to Enter',
  locked: 'Locked',
  completeFirst: (zoneName) => `Complete "${zoneName}" first`,
  startQuest: (questTitle) => `Start Quest: ${questTitle}`,
  backToMap: 'Back to Map',

  chooseLevel: 'Choose a Level',
  levelN: (n) => `Level ${n}`,
  levelKindNames: {
    story: 'The Story Begins',
    decision: 'Your Choices',
    quiz: 'Quiz Checkpoint',
  },
  completePreviousLevel: 'Finish the earlier level to unlock this one.',
  startLevelLabel: 'Start',
  practiceReplay: 'Practice Again',
  practiceNote: 'Practice mode — your recorded score stays the same.',
  levelCompletedTag: 'Completed',
  levelComplete: 'Level Complete!',
  practiceComplete: 'Practice Complete!',
  nextLevelUnlocked: (levelName) => `Unlocked: ${levelName}`,
  backToLevels: 'Back to Levels',

  zones: {
    zone1: {
      name: 'Safe Zone',
      theme: 'Personal safety and body autonomy (POCSO awareness)',
    },
    zone2: {
      name: 'Right to Childhood',
      theme: 'Every child has the right to learn, play, and rest (child labour awareness)',
    },
    zone3: {
      name: 'School Rights',
      theme: 'Free and fair education for every child (RTE)',
    },
    zone4: {
      name: 'Justice System Simulator',
      theme: 'The people and places that protect children (JJ Act / CWC / JJB)',
    },
    zone5: {
      name: 'Digital Safety',
      theme: 'Staying safe and kind online (cyberbullying / online safety)',
    },
  },

  preQuizTitle: 'Quick! Before we start, what do you think?',
  postQuizTitle: "Let's review what we learned!",
  leaveQuest: 'Leave quest',
  questionXofY: (current, total) => `Question ${current} of ${total}`,
  correct: 'Correct!',
  notQuite: 'Not quite!',
  continueLabel: 'Continue',
  whatWillYouDo: 'What will you do?',
  questComplete: 'Quest Complete!',
  youGotXofY: (score, total) => `You got ${score} out of ${total}!`,
  unlockedNext: (zoneName) => `You unlocked the next area: ${zoneName}`,
  recapTitle: "Let's revisit one big idea!",
  recapXofY: (current, total) => `${current} of ${total}`,
  recapGotIt: "You've got it!",
  recapTryAgainIntro: 'Good try! Here is the idea one more time:',
  readAloud: 'Read aloud',
  stopReading: 'Stop reading',

  progressTitle: 'My Progress',
  closeProgress: 'Close progress',
  completedXofY: (done, total) =>
    `You've completed ${done} out of ${total} Rights Quests!`,
  encouragementStart:
    'Your adventure is just beginning. The Safe Zone is waiting for you!',
  encouragementMid: 'Amazing work! Keep exploring, the next zone is ready for you.',
  encouragementAll:
    'Incredible! You explored every zone. You are a true Rights Champion!',
  badgesEarned: (count) =>
    count === 1 ? '1 star badge earned' : `${count} star badges earned`,
  zoneComplete: 'Complete! Star earned',
  zoneReady: 'Ready to explore',
  zoneLocked: 'Locked for now',
  teacherSection: 'For Teachers and Parents',
  teacherSectionSub: 'Optional learning summary (hidden by default)',
  showSummary: 'Show summary',
  hideSummary: 'Hide summary',
  teacherSummaryTitle: 'Learning summary for this device',
  teacherPrivacyNote:
    "Aggregated quiz improvement (before the quest vs after) per zone, for measuring learning impact only. This view never shows individual answers or any story choices, and it is not a tool for monitoring a child's personal situation. Data is stored under a pseudonymous session ID only — no names, no personal details.",
  teacherEmpty:
    'No quests completed on this device yet — the summary will appear after the first completed quest.',
  colZone: 'Zone',
  colBefore: 'Before',
  colAfter: 'After',
  colChange: 'Change',
  ptsChange: (delta) => `${delta > 0 ? `+${delta}` : delta} pts`,
  avgImprovement: 'Average improvement across played zones:',
  sessionIdLabel: 'Pseudonymous session ID:',

  getHelpNow: 'Get Help Now',
  emergencyHelp: 'Emergency Help',
  childline: 'Childline',
  cyberCrime: 'Cyber Crime',
  available247: "Available 24/7. It's safe and free to call.",
  close: 'Close',

  guideIntro:
    "Hi! I'm your guide here in Nyaya Nagri. I'm a computer friend, not a real person, but I'm here to help you learn about your rights. How can I help today?",
  yourGuide: 'Your Guide',
  aiCompanion: 'AI Companion',
  thinking: 'Thinking...',
  askAnything: 'Ask me anything...',
  guideResting: 'Your guide is taking a rest — try again in a moment.',
  toggleVoice: 'Toggle voice',
  openGuide: 'Open Guide',
  closeChat: 'Close chat',
  zoneWelcomeFallback: (zoneName, theme) =>
    `Welcome to ${zoneName}! Here we'll learn about: ${theme}.`,

  settingsTitle: 'Settings',
  languageLabel: 'Language',
  languageEnglish: 'English',
  languageHindi: 'Hindi',
  narrationLabel: 'Audio narration',
  narrationHint: 'Reads stories, choices, and quiz questions aloud.',
  narrationUnsupported: 'Audio narration is not supported in this browser.',
  dyslexiaLabel: 'Easy-reading font',
  dyslexiaHint: 'Switches to a font that is easier to read.',
  contrastLabel: 'High contrast',
  contrastHint: 'Makes text and buttons stand out more.',
  textSizeLabel: 'Text size',
  textSizeSmall: 'Small',
  textSizeMedium: 'Medium',
  textSizeLarge: 'Large',
  on: 'On',
  off: 'Off',
  done: 'Done',

  community: 'Rights Community',
  communityTitle: 'Rights Community',
  closeCommunity: 'Close community',
  tabCircle: 'Rights Circle',
  tabBoard: 'Circle Board',
  tabExpert: 'Ask a Legal Expert',
  safeByDesignNote:
    'Safe by design: there is no chat here, and nothing you tap is sent to anyone.',
  circleIntro:
    'Pick the response that feels most like you. There are no wrong answers here — this is a space to reflect.',
  promptsRotateNote:
    'Prompts change as you complete more quests — come back tomorrow for a fresh mix.',
  fromZone: (zoneName) => `From: ${zoneName}`,
  generalPromptTag: 'For everyone',
  whyThisMatters: 'Why this matters',
  thanksForReflecting: 'Thanks for reflecting!',
  boardIntro: 'See how other champions responded to Rights Circle prompts.',
  boardIllustrative:
    'Illustrative examples — written by the Nyaya Nagri team, not real children.',
  boardModerationNote:
    'In a real launch, trained NGO staff and teachers would review every response before it appears. There is no way to post here.',
  expertIntro:
    'Compiled from Ask-a-Legal-Expert sessions with child-rights experts.',
  expertDisclaimer:
    'This is general information for learning, not legal advice for a specific situation. Every situation is different — talk to a trusted adult, and remember Childline 1098 is always there.',
  ageLabel: (band) => `Age ${band}`,

  callNow: 'Tap to call',
  whatHappensWhenYouCall: 'What happens when you call?',
  helpBullets: [
    'It is free and open every day, at any time.',
    'A trained, kind adult picks up and listens.',
    'You share only what you feel ready to share.',
    'They connect you to the right helpers — and you can call for a friend too.',
  ],
  cyberCrimeNote:
    'For online bullying, threats, or anything scary on the internet.',
  openCyberPortal: 'Report online: cybercrime.gov.in',
  pocsoEbox: 'POCSO e-Box',
  pocsoEboxNote:
    'A safe online complaint box for children, run by NCPCR. Find the e-Box on the NCPCR website.',
  openNcpcrSite: 'Open ncpcr.gov.in',
  safetyReminderTitle: 'Good to remember',
  safetyReminderBody:
    'If anything in real life ever feels like this story, you are not alone — kind helpers are one tap away.',
  seeHelpOptions: 'See help options',

  welcomeTitle: 'Welcome to Nyaya Nagri!',
  welcomeBody:
    'A friendly city where you play stories, meet a helpful guide, and learn the rights that keep every child safe and strong.',
  chooseLanguage: 'Choose your language',
  howItWorksTitle: 'How it works',
  howItWorksPoints: [
    'Walk around the city and visit 5 zones — each one is about rights that protect you.',
    'Play story quests, make your own choices, and answer fun quizzes to earn badges.',
    'Your friendly guide can answer questions any time.',
    'The red Get Help Now button is always on screen — it shows real helplines like Childline 1098.',
  ],
  howOldAreYou: 'How old are you?',
  ageWhy: 'We use this only to pick the right stories for you.',
  ageBandDesc811: 'Simple, fun stories',
  ageBandDesc1215: 'School, friends, and online-life stories',
  ageBandDesc1618: 'Real-world rights and how to use them',
  guardianTitle: 'A grown-up needs to agree',
  guardianIntro:
    'Please hand the device to a parent, guardian, or teacher for this step.',
  whatIsStoredTitle: 'What this app saves (only on this device):',
  storedPoints: [
    'The age group and language you choose, and your settings.',
    'Your quest progress, quiz scores, and badges.',
    'Your cartoon avatar look and game nickname (never a real name).',
    'A random player code — never a name.',
  ],
  notStoredNote:
    'This app never asks for a real name, photo, phone number, school, or address — the nickname is just a fun game name. Messages typed or spoken to the guide are sent over the internet to an AI service only to create the reply — this app does not save them. Please remind your child not to share personal details in the chat.',
  consentCheckbox:
    'I am a parent, guardian, or teacher, and I agree to let this child play.',
  prototypeNote:
    'This is a learning prototype: agreement is remembered only on this device, in the spirit of the DPDP Act, 2023.',
  startPlaying: 'Start playing',
  next: 'Next',
  back: 'Back',

  ambientLabel: 'Calm background music',
  ambientHint: 'Soft music while you explore. Turn it off any time.',

  buildAvatarTitle: 'Make your hero',
  buildAvatarHint: 'Choose how you look in Nyaya Nagri — cartoon looks only.',
  baseLookLabel: 'Look',
  baseLookNames: ['Sunny', 'Brave'],
  skinToneLabel: 'Skin tone',
  hairLabel: 'Hair',
  hairStyleNames: ['Short', 'Curly', 'Braids', 'Bun'],
  outfitLabel: 'Clothes',
  outfitNames: ['Kurta', 'T-shirt', 'Kameez', 'Hoodie'],
  accessoriesLabel: 'Extras (pick up to 3)',
  accessoryNames: [
    'Glasses',
    'Cap',
    'Star badge',
    'Scarf',
    'Flower',
    'Backpack',
    'Hair bow',
    'Medal',
    'Crown',
    'Cape',
  ],
  pickNickname: 'Pick a game nickname',
  nicknameHint: 'Not your real name — just a fun game name!',
  nicknamePlaceholder: 'e.g. StarHero',
  editAvatar: 'Edit Avatar',
  saveChanges: 'Save',
  cancel: 'Cancel',

  playerRankChip: (rank) => `Player Rank ${rank}`,
  coinsChip: (coins) => `${coins} Coins`,
  openShopLabel: 'Avatar Shop',
  streakChip: (days) => (days === 1 ? '1-day streak' : `${days}-day streak`),
  streakNote:
    'Play on any day to grow your streak. Taking a break is always okay — your streak simply starts fresh.',
  rewardsLine: (xp, coins) => `You earned ${xp} XP and ${coins} Coins!`,
  titleUnlocked: (titleName) => `New title earned: ${titleName}`,

  avatarShopTitle: 'Avatar Shop',
  shopIntro: 'Spend your Coins on fun looks for your avatar. You earn Coins by finishing levels.',
  shopNoRealMoney:
    'Everything here uses game Coins only — nothing in Nyaya Nagri ever costs real money.',
  shopBuy: 'Buy',
  shopOwned: 'Owned',
  shopConfirm: (name, price) => `Buy ${name} for ${price} Coins?`,
  shopYesBuy: 'Yes, buy it',
  shopNotNow: 'Not now',
  shopNotEnough: 'Not enough Coins yet — finish more levels to earn Coins.',
  shopEquipHint: 'You own this! Put it on in Edit Avatar.',
  coinPrice: (price) => `${price} Coins`,

  profileHeading: 'Player Profile',
  playerRankLabel: 'Player Rank',
  totalXpLabel: 'Total XP',
  coinsLabel: 'Coins',
  streakLabel: 'Play Streak',
  streakDays: (days) => (days === 1 ? '1 day' : `${days} days`),
  xpToNext: (xp) => `${xp} XP to the next rank`,
  titlesHeading: 'My Titles',
  titlesPrivateNote: 'Titles are just for you — no one else ever sees them.',
  noTitlesYet: 'Finish levels and zones to earn your first title!',
  titleNames: {
    first_level: 'First Steps',
    zone1_guardian: 'Safe Zone Guardian',
    zone2_champion: 'Childhood Champion',
    zone3_scholar: 'School Rights Scholar',
    zone4_explorer: 'Justice Explorer',
    zone5_defender: 'Digital Defender',
    all_zones_champion: 'Nyaya Nagri Champion',
  },

  tabLeaderboard: 'Class Board',
  leaderboardTitle: 'Class Points Board',
  leaderboardIntro:
    'A friendly XP board for your own classroom group only. It shows game nicknames — never real names.',
  leaderboardOptInLabel: 'Show me on my class board',
  leaderboardOffNote:
    'Your name is not on the board. Join any time — or stay off it, both are completely fine.',
  leaderboardDemoNote:
    'Demo classroom: these example players were written by the Nyaya Nagri team. In a real school, your teacher would set up your class group.',
  leaderboardYouTag: 'You',
  leaderboardNeverPublic:
    'Only your own class group could ever see this board. There is no public or school-wide leaderboard in Nyaya Nagri.',
  leaderboardXp: (xp) => `${xp} XP`,
};

const HI: UIStrings = {
  appTitle: 'न्याय नगरी',
  myProgress: 'मेरी प्रगति',
  settings: 'सेटिंग्स',
  pressToEnter: 'E दबाओ या टैप करके अंदर जाओ',
  locked: 'अभी बंद है',
  completeFirst: (zoneName) => `पहले "${zoneName}" पूरा करो`,
  startQuest: (questTitle) => `क्वेस्ट शुरू करो: ${questTitle}`,
  backToMap: 'नक्शे पर वापस',

  chooseLevel: 'एक लेवल चुनो',
  levelN: (n) => `लेवल ${n}`,
  levelKindNames: {
    story: 'कहानी शुरू होती है',
    decision: 'तुम्हारे फ़ैसले',
    quiz: 'क्विज़ चेकपॉइंट',
  },
  completePreviousLevel: 'इसे खोलने के लिए पहले वाला लेवल पूरा करो।',
  startLevelLabel: 'शुरू करो',
  practiceReplay: 'फिर से अभ्यास करो',
  practiceNote: 'अभ्यास मोड — तुम्हारा दर्ज स्कोर वैसा ही रहेगा।',
  levelCompletedTag: 'पूरा हुआ',
  levelComplete: 'लेवल पूरा हुआ!',
  practiceComplete: 'अभ्यास पूरा हुआ!',
  nextLevelUnlocked: (levelName) => `खुल गया: ${levelName}`,
  backToLevels: 'लेवल सूची पर वापस',

  zones: {
    zone1: {
      name: 'सेफ़ ज़ोन',
      theme: 'निजी सुरक्षा और अपने शरीर पर अपना हक (पॉक्सो जागरूकता)',
    },
    zone2: {
      name: 'बचपन का अधिकार',
      theme: 'हर बच्चे को पढ़ने, खेलने और आराम करने का अधिकार है (बाल मज़दूरी जागरूकता)',
    },
    zone3: {
      name: 'स्कूल अधिकार',
      theme: 'हर बच्चे के लिए मुफ़्त और न्यायपूर्ण शिक्षा (आरटीई)',
    },
    zone4: {
      name: 'न्याय प्रणाली सिम्युलेटर',
      theme: 'वे लोग और जगहें जो बच्चों की रक्षा करते हैं (जेजे एक्ट / सीडब्ल्यूसी / जेजेबी)',
    },
    zone5: {
      name: 'डिजिटल सुरक्षा',
      theme: 'ऑनलाइन सुरक्षित रहना और अच्छा व्यवहार (साइबरबुलिंग / ऑनलाइन सुरक्षा)',
    },
  },

  preQuizTitle: 'जल्दी बताओ! शुरू करने से पहले, तुम्हें क्या लगता है?',
  postQuizTitle: 'चलो देखें हमने क्या सीखा!',
  leaveQuest: 'क्वेस्ट छोड़ो',
  questionXofY: (current, total) => `सवाल ${current} (कुल ${total})`,
  correct: 'सही!',
  notQuite: 'पूरा सही नहीं!',
  continueLabel: 'आगे बढ़ो',
  whatWillYouDo: 'तुम क्या करोगे?',
  questComplete: 'क्वेस्ट पूरी हुई!',
  youGotXofY: (score, total) => `तुमने ${total} में से ${score} सही किए!`,
  unlockedNext: (zoneName) => `नया इलाका खुल गया: ${zoneName}`,
  recapTitle: 'चलो एक बड़ी बात फिर से देखें!',
  recapXofY: (current, total) => `${current} (कुल ${total})`,
  recapGotIt: 'तुमने समझ लिया!',
  recapTryAgainIntro: 'अच्छी कोशिश! वही बात एक बार फिर:',
  readAloud: 'पढ़कर सुनाओ',
  stopReading: 'पढ़ना रोको',

  progressTitle: 'मेरी प्रगति',
  closeProgress: 'प्रगति बंद करो',
  completedXofY: (done, total) =>
    `तुमने ${total} में से ${done} अधिकार क्वेस्ट पूरी कर ली हैं!`,
  encouragementStart:
    'तुम्हारा सफ़र अभी शुरू हुआ है। सेफ़ ज़ोन तुम्हारा इंतज़ार कर रहा है!',
  encouragementMid: 'शानदार! खोज जारी रखो, अगला ज़ोन तुम्हारे लिए तैयार है।',
  encouragementAll:
    'कमाल कर दिया! तुमने हर ज़ोन घूम लिया। तुम सच्चे अधिकार चैंपियन हो!',
  badgesEarned: (count) =>
    count === 1 ? '1 सितारा बैज मिला' : `${count} सितारा बैज मिले`,
  zoneComplete: 'पूरा हुआ! सितारा मिला',
  zoneReady: 'खोज के लिए तैयार',
  zoneLocked: 'अभी बंद है',
  teacherSection: 'शिक्षकों और माता-पिता के लिए',
  teacherSectionSub: 'वैकल्पिक सीखने का सारांश (शुरू में छिपा रहता है)',
  showSummary: 'सारांश दिखाओ',
  hideSummary: 'सारांश छिपाओ',
  teacherSummaryTitle: 'इस डिवाइस के लिए सीखने का सारांश',
  teacherPrivacyNote:
    'हर ज़ोन के लिए क्विज़ में सुधार (क्वेस्ट से पहले बनाम बाद) का कुल-जोड़, केवल सीखने का असर मापने के लिए। इसमें बच्चे के अलग-अलग जवाब या कहानी के चुनाव कभी नहीं दिखते, और यह बच्चे की निजी स्थिति पर नज़र रखने का साधन नहीं है। डेटा केवल एक छद्म (बिना पहचान वाली) सेशन ID के तहत रखा जाता है — कोई नाम नहीं, कोई निजी जानकारी नहीं।',
  teacherEmpty:
    'इस डिवाइस पर अभी कोई क्वेस्ट पूरी नहीं हुई है — पहली क्वेस्ट पूरी होते ही सारांश दिखेगा।',
  colZone: 'ज़ोन',
  colBefore: 'पहले',
  colAfter: 'बाद में',
  colChange: 'बदलाव',
  ptsChange: (delta) => `${delta > 0 ? `+${delta}` : delta} अंक`,
  avgImprovement: 'खेले गए ज़ोन में औसत सुधार:',
  sessionIdLabel: 'छद्म सेशन ID:',

  getHelpNow: 'अभी मदद लो',
  emergencyHelp: 'आपातकालीन मदद',
  childline: 'चाइल्डलाइन',
  cyberCrime: 'साइबर क्राइम',
  available247: 'हर दिन, हर समय उपलब्ध। कॉल करना सुरक्षित और मुफ़्त है।',
  close: 'बंद करो',

  guideIntro:
    'नमस्ते! मैं न्याय नगरी में तुम्हारा गाइड हूँ। मैं एक कंप्यूटर दोस्त हूँ, असली इंसान नहीं, पर तुम्हें तुम्हारे अधिकार सीखने में मदद करने के लिए यहाँ हूँ। बताओ, आज कैसे मदद करूँ?',
  yourGuide: 'तुम्हारा गाइड',
  aiCompanion: 'AI साथी',
  thinking: 'सोच रहा हूँ...',
  askAnything: 'कुछ भी पूछो...',
  guideResting: 'तुम्हारा गाइड थोड़ा आराम कर रहा है — थोड़ी देर में फिर कोशिश करो।',
  toggleVoice: 'आवाज़ चालू/बंद करो',
  openGuide: 'गाइड खोलो',
  closeChat: 'चैट बंद करो',
  zoneWelcomeFallback: (zoneName, theme) =>
    `${zoneName} में स्वागत है! यहाँ हम सीखेंगे: ${theme}।`,

  settingsTitle: 'सेटिंग्स',
  languageLabel: 'भाषा',
  languageEnglish: 'English',
  languageHindi: 'हिंदी',
  narrationLabel: 'आवाज़ में सुनाना',
  narrationHint: 'कहानियाँ, विकल्प और क्विज़ के सवाल आवाज़ में पढ़कर सुनाता है।',
  narrationUnsupported: 'इस ब्राउज़र में आवाज़ में सुनाना उपलब्ध नहीं है।',
  dyslexiaLabel: 'आसान-पढ़ाई वाला फ़ॉन्ट',
  dyslexiaHint: 'ऐसा फ़ॉन्ट चुनता है जो पढ़ने में आसान हो।',
  contrastLabel: 'गहरा कंट्रास्ट',
  contrastHint: 'लिखाई और बटन ज़्यादा साफ़ दिखते हैं।',
  textSizeLabel: 'अक्षरों का आकार',
  textSizeSmall: 'छोटा',
  textSizeMedium: 'मध्यम',
  textSizeLarge: 'बड़ा',
  on: 'चालू',
  off: 'बंद',
  done: 'हो गया',

  community: 'अधिकार समुदाय',
  communityTitle: 'अधिकार समुदाय',
  closeCommunity: 'समुदाय बंद करो',
  tabCircle: 'अधिकार मंडली',
  tabBoard: 'मंडली बोर्ड',
  tabExpert: 'कानूनी विशेषज्ञ से पूछो',
  safeByDesignNote:
    'सुरक्षा के साथ बनाया गया: यहाँ कोई चैट नहीं है, और तुम जो भी चुनो वह किसी को नहीं भेजा जाता।',
  circleIntro:
    'वह जवाब चुनो जो सबसे ज़्यादा तुम्हारे जैसा लगे। यहाँ कोई जवाब गलत नहीं — यह सोचने-समझने की जगह है।',
  promptsRotateNote:
    'जैसे-जैसे तुम क्वेस्ट पूरी करोगे, सवाल बदलते रहेंगे — कल फिर आओ, नया मिश्रण मिलेगा।',
  fromZone: (zoneName) => `कहाँ से: ${zoneName}`,
  generalPromptTag: 'सबके लिए',
  whyThisMatters: 'यह क्यों ज़रूरी है',
  thanksForReflecting: 'सोचने के लिए शाबाश!',
  boardIntro: 'देखो, दूसरे चैंपियनों ने अधिकार मंडली के सवालों पर क्या कहा।',
  boardIllustrative:
    'उदाहरण के लिए बनाए गए नमूने — इन्हें न्याय नगरी टीम ने लिखा है, ये असली बच्चों के संदेश नहीं हैं।',
  boardModerationNote:
    'असली लॉन्च में हर संदेश दिखने से पहले प्रशिक्षित एनजीओ कार्यकर्ता और शिक्षक उसकी जाँच करेंगे। यहाँ खुद कुछ पोस्ट करने का कोई तरीका नहीं है।',
  expertIntro:
    'बाल-अधिकार विशेषज्ञों के साथ हुए सवाल-जवाब सत्रों से चुनकर बनाया गया।',
  expertDisclaimer:
    'यह सीखने के लिए सामान्य जानकारी है, किसी खास स्थिति के लिए कानूनी सलाह नहीं। हर स्थिति अलग होती है — किसी भरोसेमंद बड़े से बात करो, और याद रखो, चाइल्डलाइन 1098 हमेशा साथ है।',
  ageLabel: (band) => `उम्र ${band}`,

  callNow: 'कॉल करने के लिए टैप करो',
  whatHappensWhenYouCall: 'कॉल करने पर क्या होता है?',
  helpBullets: [
    'यह मुफ़्त है और हर दिन, हर समय खुला है।',
    'एक प्रशिक्षित, अच्छा बड़ा फ़ोन उठाता है और तुम्हारी बात सुनता है।',
    'जितना बताने का मन हो, बस उतना ही बताओ।',
    'वे तुम्हें सही मददगारों से जोड़ते हैं — और तुम किसी दोस्त के लिए भी कॉल कर सकते हो।',
  ],
  cyberCrimeNote:
    'ऑनलाइन बुलिंग, धमकियों या इंटरनेट पर किसी भी डरावनी चीज़ के लिए।',
  openCyberPortal: 'ऑनलाइन रिपोर्ट करो: cybercrime.gov.in',
  pocsoEbox: 'पॉक्सो (POCSO) e-Box',
  pocsoEboxNote:
    'बच्चों के लिए एक सुरक्षित ऑनलाइन शिकायत बॉक्स, जिसे एनसीपीसीआर (NCPCR) चलाता है। e-Box एनसीपीसीआर की वेबसाइट पर मिलेगा।',
  openNcpcrSite: 'ncpcr.gov.in खोलो',
  safetyReminderTitle: 'याद रखने वाली बात',
  safetyReminderBody:
    'अगर असल ज़िंदगी में कभी कुछ इस कहानी जैसा लगे, तो तुम अकेले नहीं हो — मददगार बस एक टैप दूर हैं।',
  seeHelpOptions: 'मदद के रास्ते देखो',

  welcomeTitle: 'न्याय नगरी में स्वागत है!',
  welcomeBody:
    'एक प्यारा शहर जहाँ तुम कहानियाँ खेलते हो, एक मददगार गाइड से मिलते हो, और वे अधिकार सीखते हो जो हर बच्चे को सुरक्षित और मज़बूत रखते हैं।',
  chooseLanguage: 'अपनी भाषा चुनो',
  howItWorksTitle: 'यह कैसे काम करता है',
  howItWorksPoints: [
    'शहर में घूमो और 5 ज़ोन देखो — हर ज़ोन तुम्हारी रक्षा करने वाले अधिकारों के बारे में है।',
    'कहानी वाले क्वेस्ट खेलो, अपने फ़ैसले खुद लो, और मज़ेदार क्विज़ से बैज जीतो।',
    'तुम्हारा दोस्ताना गाइड कभी भी सवालों के जवाब दे सकता है।',
    'लाल "अभी मदद लो" बटन हमेशा स्क्रीन पर रहता है — इसमें चाइल्डलाइन 1098 जैसी असली हेल्पलाइन हैं।',
  ],
  howOldAreYou: 'तुम्हारी उम्र कितनी है?',
  ageWhy: 'इससे हम बस तुम्हारे लिए सही कहानियाँ चुनते हैं।',
  ageBandDesc811: 'आसान, मज़ेदार कहानियाँ',
  ageBandDesc1215: 'स्कूल, दोस्तों और ऑनलाइन दुनिया की कहानियाँ',
  ageBandDesc1618: 'असली दुनिया के अधिकार और उन्हें इस्तेमाल करने के तरीके',
  guardianTitle: 'एक बड़े की हाँ चाहिए',
  guardianIntro:
    'कृपया इस कदम के लिए डिवाइस माता-पिता, अभिभावक या शिक्षक को दो।',
  whatIsStoredTitle: 'यह ऐप क्या सेव करता है (सिर्फ़ इसी डिवाइस पर):',
  storedPoints: [
    'तुम्हारा चुना हुआ उम्र-समूह, भाषा और सेटिंग्स।',
    'तुम्हारी क्वेस्ट की प्रगति, क्विज़ के अंक और बैज।',
    'तुम्हारा कार्टून अवतार लुक और गेम निकनेम (कभी असली नाम नहीं)।',
    'एक रैंडम खिलाड़ी कोड — कभी नाम नहीं।',
  ],
  notStoredNote:
    'यह ऐप कभी असली नाम, फ़ोटो, फ़ोन नंबर, स्कूल या पता नहीं माँगता — निकनेम बस एक मज़ेदार गेम नाम है। गाइड को लिखे या बोले गए संदेश सिर्फ़ जवाब बनाने के लिए इंटरनेट पर एक एआई (AI) सेवा को भेजे जाते हैं — यह ऐप उन्हें सेव नहीं करता। कृपया बच्चे को याद दिलाएँ कि वह चैट में अपनी निजी जानकारी न लिखे।',
  consentCheckbox:
    'मैं माता-पिता, अभिभावक या शिक्षक हूँ, और मैं इस बच्चे को खेलने की अनुमति देता/देती हूँ।',
  prototypeNote:
    'यह एक सीखने का प्रोटोटाइप है: सहमति सिर्फ़ इसी डिवाइस पर याद रखी जाती है — डीपीडीपी (DPDP) एक्ट, 2023 की भावना के अनुसार।',
  startPlaying: 'खेलना शुरू करो',
  next: 'आगे',
  back: 'पीछे',

  ambientLabel: 'शांत बैकग्राउंड संगीत',
  ambientHint: 'घूमते समय हल्का संगीत। जब चाहो बंद कर दो।',

  buildAvatarTitle: 'अपना हीरो बनाओ',
  buildAvatarHint: 'चुनो कि न्याय नगरी में तुम कैसे दिखोगे — सिर्फ़ कार्टून लुक।',
  baseLookLabel: 'चेहरा',
  baseLookNames: ['हँसमुख', 'बहादुर'],
  skinToneLabel: 'त्वचा का रंग',
  hairLabel: 'बाल',
  hairStyleNames: ['छोटे', 'घुँघराले', 'चोटियाँ', 'जूड़ा'],
  outfitLabel: 'कपड़े',
  outfitNames: ['कुर्ता', 'टी-शर्ट', 'कमीज़', 'हुडी'],
  accessoriesLabel: 'एक्स्ट्रा (ज़्यादा से ज़्यादा 3 चुनो)',
  accessoryNames: [
    'चश्मा',
    'टोपी',
    'सितारा बैज',
    'स्कार्फ़',
    'फूल',
    'बस्ता',
    'बालों का बो',
    'मेडल',
    'मुकुट',
    'केप',
  ],
  pickNickname: 'गेम के लिए एक निकनेम चुनो',
  nicknameHint: 'अपना असली नाम नहीं — बस एक मज़ेदार गेम नाम!',
  nicknamePlaceholder: 'जैसे स्टारहीरो',
  editAvatar: 'अवतार बदलो',
  saveChanges: 'सेव करो',
  cancel: 'रद्द करो',

  playerRankChip: (rank) => `प्लेयर रैंक ${rank}`,
  coinsChip: (coins) => `${coins} सिक्के`,
  openShopLabel: 'अवतार दुकान',
  streakChip: (days) => `लगातार ${days} दिन`,
  streakNote:
    'किसी भी दिन खेलो तो स्ट्रीक बढ़ती है। आराम करना हमेशा ठीक है — स्ट्रीक बस फिर से शुरू हो जाती है।',
  rewardsLine: (xp, coins) => `तुमने ${xp} XP और ${coins} सिक्के कमाए!`,
  titleUnlocked: (titleName) => `नई उपाधि मिली: ${titleName}`,

  avatarShopTitle: 'अवतार दुकान',
  shopIntro: 'अपने सिक्कों से अवतार के लिए मज़ेदार चीज़ें लो। सिक्के लेवल पूरे करने से मिलते हैं।',
  shopNoRealMoney:
    'यहाँ सब कुछ सिर्फ़ गेम के सिक्कों से मिलता है — न्याय नगरी में कुछ भी असली पैसों से नहीं मिलता।',
  shopBuy: 'खरीदो',
  shopOwned: 'तुम्हारा है',
  shopConfirm: (name, price) => `${price} सिक्कों में ${name} खरीदो?`,
  shopYesBuy: 'हाँ, खरीदो',
  shopNotNow: 'अभी नहीं',
  shopNotEnough: 'अभी सिक्के कम हैं — और लेवल पूरे करो, सिक्के मिलेंगे।',
  shopEquipHint: 'यह तुम्हारा है! "अवतार बदलो" में जाकर पहनो।',
  coinPrice: (price) => `${price} सिक्के`,

  profileHeading: 'खिलाड़ी प्रोफ़ाइल',
  playerRankLabel: 'प्लेयर रैंक',
  totalXpLabel: 'कुल XP',
  coinsLabel: 'सिक्के',
  streakLabel: 'खेल स्ट्रीक',
  streakDays: (days) => `${days} दिन`,
  xpToNext: (xp) => `अगली रैंक के लिए ${xp} XP और`,
  titlesHeading: 'मेरी उपाधियाँ',
  titlesPrivateNote: 'उपाधियाँ सिर्फ़ तुम्हारे लिए हैं — इन्हें कोई और कभी नहीं देखता।',
  noTitlesYet: 'लेवल और ज़ोन पूरे करो और अपनी पहली उपाधि पाओ!',
  titleNames: {
    first_level: 'पहला कदम',
    zone1_guardian: 'सेफ़ ज़ोन रक्षक',
    zone2_champion: 'बचपन चैंपियन',
    zone3_scholar: 'स्कूल अधिकार ज्ञानी',
    zone4_explorer: 'न्याय खोजी',
    zone5_defender: 'डिजिटल रक्षक',
    all_zones_champion: 'न्याय नगरी चैंपियन',
  },

  tabLeaderboard: 'क्लास बोर्ड',
  leaderboardTitle: 'क्लास पॉइंट बोर्ड',
  leaderboardIntro:
    'सिर्फ़ तुम्हारे अपने क्लास ग्रुप का XP बोर्ड। इसमें सिर्फ़ गेम निकनेम दिखते हैं — असली नाम कभी नहीं।',
  leaderboardOptInLabel: 'मुझे मेरे क्लास बोर्ड पर दिखाओ',
  leaderboardOffNote:
    'तुम्हारा नाम बोर्ड पर नहीं है। जब चाहो जुड़ो — या न जुड़ो, दोनों बिलकुल ठीक हैं।',
  leaderboardDemoNote:
    'डेमो क्लासरूम: ये उदाहरण खिलाड़ी न्याय नगरी टीम ने लिखे हैं। असली स्कूल में तुम्हारे टीचर क्लास ग्रुप बनाएँगे।',
  leaderboardYouTag: 'तुम',
  leaderboardNeverPublic:
    'यह बोर्ड सिर्फ़ तुम्हारा अपना क्लास ग्रुप ही देख सकता है। न्याय नगरी में कोई पब्लिक या पूरे स्कूल का लीडरबोर्ड नहीं है।',
  leaderboardXp: (xp) => `${xp} XP`,
};

export const STRINGS: Record<Language, UIStrings> = { en: EN, hi: HI };

export function getStrings(language: Language): UIStrings {
  return STRINGS[language];
}

/** React hook: the active string bundle, re-rendering on language change. */
export function useStrings(): UIStrings {
  const { language } = useSettings();
  return STRINGS[language];
}
