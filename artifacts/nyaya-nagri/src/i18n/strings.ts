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
    'A random player code — never a name.',
  ],
  notStoredNote:
    'This app never asks for a name, photo, phone number, school, or address. Messages typed or spoken to the guide are sent over the internet to an AI service only to create the reply — this app does not save them. Please remind your child not to share personal details in the chat.',
  consentCheckbox:
    'I am a parent, guardian, or teacher, and I agree to let this child play.',
  prototypeNote:
    'This is a learning prototype: agreement is remembered only on this device, in the spirit of the DPDP Act, 2023.',
  startPlaying: 'Start playing',
  next: 'Next',
  back: 'Back',

  ambientLabel: 'Calm background music',
  ambientHint: 'Soft music while you explore. Turn it off any time.',
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
    'एक रैंडम खिलाड़ी कोड — कभी नाम नहीं।',
  ],
  notStoredNote:
    'यह ऐप कभी नाम, फ़ोटो, फ़ोन नंबर, स्कूल या पता नहीं माँगता। गाइड को लिखे या बोले गए संदेश सिर्फ़ जवाब बनाने के लिए इंटरनेट पर एक एआई (AI) सेवा को भेजे जाते हैं — यह ऐप उन्हें सेव नहीं करता। कृपया बच्चे को याद दिलाएँ कि वह चैट में अपनी निजी जानकारी न लिखे।',
  consentCheckbox:
    'मैं माता-पिता, अभिभावक या शिक्षक हूँ, और मैं इस बच्चे को खेलने की अनुमति देता/देती हूँ।',
  prototypeNote:
    'यह एक सीखने का प्रोटोटाइप है: सहमति सिर्फ़ इसी डिवाइस पर याद रखी जाती है — डीपीडीपी (DPDP) एक्ट, 2023 की भावना के अनुसार।',
  startPlaying: 'खेलना शुरू करो',
  next: 'आगे',
  back: 'पीछे',

  ambientLabel: 'शांत बैकग्राउंड संगीत',
  ambientHint: 'घूमते समय हल्का संगीत। जब चाहो बंद कर दो।',
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
