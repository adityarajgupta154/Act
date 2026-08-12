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
import type { LevelKind, SortBucketId } from '@/quests/schema';

export interface ZoneStrings {
  name: string;
  theme: string;
}

export interface UIStrings {
  // HUD / map
  appTitle: string;
  myProgress: string;
  /** Left-rail player profile card: trigger aria-label + no-avatar fallback title. */
  playerProfileToggle: string;
  mapLabel: string;
  /** Full-screen map modal (reference redesign, Aug 2026). */
  mapModalSubtitle: string;
  mapOpenLabel: string;
  mapCloseLabel: string;
  mapLegendYou: string;
  mapLegendHub: string;
  mapLegendPath: string;
  mapYouAreHere: string;
  startHereTagline: string;
  // Reference bottom bar shortcuts (Aug 2026 "same to same" round)
  learnRights: string;
  helpOthers: string;
  earnBadges: string;
  settings: string;
  pressToEnter: string;
  locked: string;
  completeFirst: (zoneName: string) => string;
  startQuest: (questTitle: string) => string;
  backToMap: string;

  // Level select (Task 15; Task 18 adds the four activity kinds)
  chooseLevel: string;
  levelN: (n: number) => string;
  levelKindNames: Record<LevelKind, string>;
  completePreviousLevel: string;
  startLevelLabel: string;
  practiceReplay: string;
  practiceNote: string;
  levelCompletedTag: string;
  levelComplete: string;
  practiceComplete: string;
  nextLevelUnlocked: (levelName: string) => string;
  backToLevels: string;
  /** Short motivating description shown on each level card (kind-specific). */
  levelKindDescs: Record<LevelKind, string>;
  /** "Total Points" label next to the XP badge in the zone header. */
  zoneTotalPoints: string;
  /** "You're doing amazing!" banner title at the bottom of the level list. */
  zoneEncouragement: string;
  /** Sub-line of the bottom encouragement banner. */
  zoneEncouragementSub: string;

  // Zones (names + one-line themes)
  zones: Record<string, ZoneStrings>;

  // Quest player
  preQuizTitle: string;
  postQuizTitle: string;
  leaveQuest: string;
  questionXofY: (current: number, total: number) => string;
  correct: string;
  notQuite: string;
  correctAnswerWas: string;
  continueLabel: string;
  whatWillYouDo: string;
  // Game-board quiz chrome (Aug 2026 redesign): ribbon/kicker labels.
  // Ribbons render uppercase via CSS, so values stay sentence-case.
  ribbonQuestion: string;
  ribbonReview: string;
  ribbonRecap: string;
  /**
   * "Right or Wrong?" playable mini-game (Aug 2026). Game vocabulary on
   * purpose — Round/Score/Streak/Stars, never "question/quiz" (jury
   * feedback: it must feel like a game, not an assessment).
   */
  chTitle: string;
  chSubtitle: string;
  chTagline: string;
  chAwarenessTag: string;
  chRibbonDone: string;
  chInstruction: string;
  chDragFromHere: string;
  chDropHere: string;
  chRound: (n: number, total: number) => string;
  chScoreLabel: string;
  chGreatMatch: string;
  chNotQuite: string;
  chDoesntBelong: string;
  chLawChipLabel: string;
  chRoundCleared: string;
  chBonus: (n: number) => string;
  chCompleteHeading: string;
  chCompleteSub: string;
  chFinalScore: string;
  chPlayAgain: string;
  chPlayCta: string;
  chSoundOn: string;
  chSoundOff: string;
  chExitLabel: string;
  chHint: string;
  chHintAria: (n: number) => string;
  chMascotIntro: string;
  chMascotWrong: string;
  chMascotDistractor: string;
  // "Safe Path Adventure" maze game (zone1) — sp* chrome strings only;
  // the game's content text lives in src/games/safepath/content.ts
  // (hard-coded EN+HI inline, PRD §9.8).
  spTitle: string;
  spTagline: string;
  spAwarenessTag: string;
  spInstruction: string;
  spMission1: string;
  spMission2: string;
  spMission3: string;
  spMoveKeys: string;
  spMoveTouch: string;
  spMoveUp: string;
  spMoveDown: string;
  spMoveLeft: string;
  spMoveRight: string;
  spStartCta: string;
  spStart: string;
  spSafeZone: string;
  spLevelLabel: (n: number, total: number) => string;
  spLivesAria: (n: number) => string;
  spHintNone: string;
  spHowSafe: string;
  spTipsHeading: string;
  spTalkReminder: string;
  spSafeChoice: string;
  spThinkAgain: string;
  spBackToCheckpoint: string;
  spOkThanks: string;
  spLivesOut: string;
  spLivesOutSub: string;
  spTryAgain: string;
  spReached: string;
  spReachedSub: string;
  spQuizTitle: string;
  spQuizProgress: (n: number, total: number) => string;
  spChampion: string;
  spResultSub: string;
  spGameScore: string;
  spQuizScore: string;
  spSafeDecisions: string;
  spWhatLearned: string;
  spNextLevel: string;
  spComingSoon: string;
  questComplete: string;
  youGotXofY: (score: number, total: number) => string;
  unlockedNext: (zoneName: string) => string;
  recapTitle: string;
  recapXofY: (current: number, total: number) => string;
  recapGotIt: string;
  recapTryAgainIntro: string;
  readAloud: string;
  stopReading: string;

  // Task 18 activity levels. The sorting bucket labels live HERE, not in
  // content JSON — the emergency label carries the canonical Childline 1098
  // wording, and helpline text stays hard-coded in code (PRD §9.8). All
  // feedback is gentle by design (§9.6): no guilt, no failure states.
  memoryPairsFound: (found: number, total: number) => string;
  memoryMatchFound: string;
  memoryNotAMatch: string;
  hiddenFoundXofY: (found: number, total: number) => string;
  hiddenKeepLooking: string;
  hiddenAllFound: string;
  sortingBucketNames: Record<SortBucketId, string>;
  sortingCardXofY: (current: number, total: number) => string;
  sortingRightPlace: string;
  sortingBelongsIn: (bucketName: string) => string;
  whereDoesThisGo: string;
  activityFinish: string;
  /** Task 20 "Meet the Authorities" hub. Helpline text hard-coded here (PRD §9.8). */
  authoritiesTapHint: string;
  authoritiesRememberLine: string;

  // Progress dashboard
  /** Task 27 - zone completion certificates (PRD 9.4: nickname only). */
  certificatesHeading: string;
  certificatesEarnHeading: string;
  certificateOfCompletion: string;
  certificateCompletedTag: string;
  viewCertificate: string;
  downloadCertificate: string;
  certificateDownloading: string;
  certificateDownloadFailed: string;
  certificateLockedHint: string;
  certificateLevelsDone: (done: number, total: number) => string;
  certificateUnlockedToast: string;
  certificateUnlockedBody: (zoneName: string) => string;
  certificateClose: string;
  certBrandName: string;
  certBrandTagline: string;
  certPresentedTo: string;
  certForCompleting: string;
  certBodyLine: string;
  certCompletedOnLabel: string;
  certIdLabel: string;
  certRecipientFallback: string;

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

  // Learning insights — child-facing glimpse + adult area link (ProgressScreen)
  adultAreaLink: string;
  adultAreaLinkSub: string;
  insMiniTitle: string;
  insMiniEmpty: string;
  insMiniAnswered: (count: number) => string;
  insMiniStrong: (zone: string) => string;
  insMiniPractice: (zone: string) => string;
  insMiniKeepGoing: string;

  // Adult insights hub + PIN gate
  adultAreaTitle: string;
  adultAreaIntro: string;
  adultGateNote: string;
  adultSetPinTitle: string;
  adultSetPinSub: string;
  adultEnterPinTitle: string;
  adultPinPlaceholder: string;
  adultPinConfirmPlaceholder: string;
  adultPinMismatch: string;
  adultPinFormatError: string;
  adultPinWrong: string;
  adultSetPinBtn: string;
  adultUnlock: string;
  adultLock: string;
  adultForgotPin: string;
  adultForgotPinNote: string;
  adultTeacherCard: string;
  adultTeacherCardSub: string;
  adultParentCard: string;
  adultParentCardSub: string;
  adultReportCard: string;
  adultReportCardSub: string;
  adultBackToGame: string;
  adultBackToHub: string;

  // Insights dashboards — deterministic layer
  insLearnerTitle: string;
  insLearnerSub: string;
  insNotEnoughData: string;
  insEvidenceLine: (questions: number, sessions: number) => string;
  insConfidence: string;
  insConfidenceHigh: string;
  insConfidenceMedium: string;
  insConfidenceLow: string;
  insLabelStrong: string;
  insLabelDeveloping: string;
  insLabelNeedsPractice: string;
  insLabelInsufficient: string;
  insTrendImproving: string;
  insTrendSteady: string;
  insTrendDeclining: string;
  insTrendInsufficient: string;
  insStatQuestions: string;
  insStatSessions: string;
  insStatActiveDays: string;
  insStatAccuracy: string;
  insStatTime: string;
  insStatLevels: string;
  insStatBadges: string;
  insStatStreak: string;
  insStatPractice: string;
  insMinutes: (mins: number) => string;
  insTopicChartTitle: string;
  insTrendChartTitle: string;
  insTrendChartSub: string;
  insColTopic: string;
  insColAnswered: string;
  insColAccuracy: string;
  insColLabel: string;
  insColSessions: string;
  insBehaviorTitle: string;
  insBehaviorRecap: (count: number) => string;
  insBehaviorPersistence: (pct: number) => string;
  insBehaviorPracticeReplays: (count: number) => string;
  insEngagement: string;
  insEngagementGood: string;
  insEngagementBuilding: string;
  insEngagementLow: string;
  insStrengthsTitle: string;
  insPracticeTitle: string;
  insRecsTitle: string;
  insFindStrengthTopic: (zone: string, pct: number) => string;
  insFindImproving: (fromPct: number, toPct: number) => string;
  insFindPersistence: (pct: number) => string;
  insFindPracticeTopic: (zone: string, pct: number) => string;
  insFindPracticeTopicDeveloping: (zone: string, pct: number) => string;
  insFindRecentDip: (pts: number) => string;
  insRecReplayZone: (zone: string) => string;
  insRecContinueZone: (zone: string) => string;
  insRecRegular: string;

  // Insights — AI narrative panel
  insAiTitle: string;
  insAiSub: string;
  insAiRefresh: string;
  insAiLoading: string;
  insAiError: string;
  insAiUnavailable: string;
  insAiStrengths: string;
  insAiPractice: string;
  insAiRecommendations: string;
  insAiTrendLabel: string;
  insAiEncouragementLabel: string;
  insAiFilteredNote: string;
  insAiEmpty: string;
  insAiCachedNote: string;

  // Parent view
  parentTitle: string;
  parentIntro: string;
  parentJourney: (done: number, total: number) => string;
  parentWhatItMeans: string;
  parentWhatItMeansBody: string;
  parentTalkTitle: string;
  parentTalkBody: string;

  // 14-section report (spec order)
  reportTitle: string;
  reportPrint: string;
  reportGeneratedOn: (when: string) => string;
  reportS1: string;
  reportS2: string;
  reportS3: string;
  reportS4: string;
  reportS5: string;
  reportS6: string;
  reportS7: string;
  reportS8: string;
  reportS9: string;
  reportS10: string;
  reportS11: string;
  reportS12: string;
  reportS13: string;
  reportS14: string;
  reportQpBaseline: string;
  reportQpCheckpoint: string;
  reportQpRecap: string;
  reportQpAvgTime: string;
  reportSeconds: (secs: number) => string;
  reportObservedTag: string;
  reportDevRefTag: string;
  reportDevRefBody: string;
  reportSourcesTitle: string;
  reportSourceLegalIntro: string;
  reportLegalUnverified: string;
  reportColAct: string;
  reportNoBadges: string;
  reportNoCertificates: string;
  insDisclaimer: string;

  // Help dialog — helpline names/numbers must stay exact in every language
  getHelpNow: string;
  emergencyHelp: string;
  childline: string;
  cyberCrime: string;
  available247: string;
  close: string;

  // Emergency Assistance Hub (Get Help Now v2) — 112 is India's unified
  // emergency number; all helpline digits stay identical in every language
  // (PRD §9). Location strings promise session-only use (hub spec §18).
  helpHubSubtitle: string;
  realEmergency: string;
  emergencyQuestion: string;
  call112: string;
  isThisEmergency: string;
  yesCall112: string;
  emergencySafetyNote: string;
  findHelpNearMe: string;
  findHelpIntro: string;
  allowLocation: string;
  locationPrivacyNote: string;
  findingLocation: string;
  locationFound: string;
  locationReady: string;
  chooseHelpType: string;
  findHospitals: string;
  findMedicalCare: string;
  findChildCare: string;
  emergencySearchLabel: string;
  allowLocationAgain: string;
  locationDenied: string;
  locationSettingsHint: string;
  locationTimeout: string;
  locationUnavailable: string;
  locationUnsupported: string;
  openMaps: string;
  emergencyAssistNote: string;
  needAdult: string;
  needAdultNote: string;
  shareHelpInfo: string;
  shareCopied: string;
  moreHelp: string;

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

  // Nyaya AI — sitewide Gemini-powered legal-literacy Q&A helper.
  // The disclaimer is HARD-CODED and permanently visible in the widget
  // (PRD §9.1/§9.2); never AI-generated. Suggested questions are static.
  nyayaAiDisclaimer: string;
  nyayaAiSuggestedTitle: string;
  nyayaAiSuggested: string[];
  nyayaAiNotConfigured: string;
  nyayaAiMicDenied: string;

  // Nyaya AI real-time voice mode (Gemini Live). Status labels are UI
  // chrome (never AI-generated); error texts are friendly, never raw
  // technical/transport errors, and always point back to typing.
  nyayaAiTapToTalk: string;
  nyayaAiListening: string;
  nyayaAiThinking: string;
  nyayaAiSpeaking: string;
  nyayaAiConnecting: string;
  nyayaAiMicHint: string;
  nyayaAiVoiceStop: string;
  nyayaAiVoiceUnavailable: string;
  nyayaAiVoiceConnectFail: string;
  nyayaAiMicDeniedVoice: string;
  nyayaAiRetry: string;

  // Persona interviews (Task 17, PRD §7.4) — disclaimer is HARD-CODED and
  // shown every time a persona appears (PRD §9.2); never AI-generated.
  personaDisclaimer: (role: string) => string;
  personaRolePolice: string;
  personaRoleLawyer: string;
  personaRoleTeacher: string;
  personaRoleJudge: string;
  personaRoleParent: string;
  personaNamePolice: string;
  personaNameLawyer: string;
  personaNameTeacher: string;
  personaNameJudge: string;
  personaNameParent: string;
  personaIntroLine: (name: string) => string;
  personaInputPlaceholder: string;
  personaSend: string;
  personaUnavailable: string;

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
  howItWorksCards: Array<{ title: string; body: string }>;
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
  /** Boy/Girl hero picker — label + names aligned to CHARACTERS [boy, girl]. */
  characterLabel: string;
  characterNames: string[];
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
  avatarLiveNote: string;
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

  // Home / landing screen (entry presentation layer — Task 25)
  homeTagline: string;
  homeEnterCta: string;
  homeCentralBanner: string;
  homeLoading: string;
  homeAbout: string;
  homeAboutTitle: string;
  homeAboutBody: string[];

  // Story Adventure (Aug 2026) — the house-entrance slide-show levels.
  // All story CONTENT (captions, choices, feedback) is fixed data in
  // src/story/storyData.ts (PRD §9.8); these are only the chrome strings.
  storyAdventure: string;
  storyEnterCta: string;
  storyTryAgain: string;
  storyContinueExploring: string;
  storyRewardUnlocked: (rewardName: string) => string;
  storySlideOf: (current: number, total: number) => string;
  storyAdventuresHeading: string;
  storyLockedHint: (previousTitle: string) => string;
  storyExit: string;
  // Story Adventure LEVEL MAP (Candy-Crush-style progression screen).
  // Level titles/subtitles/rewards live in storyData; chrome only here.
  storyMapSubtitle: string;
  storyMapComingSoon: string;
  /** Two-tone ghost-card twin of storyMapComingSoon (reference: violet lead + navy tail). */
  storyMapComingSoonLead: string;
  storyMapComingSoonTail: string;
  storyMapPlayCta: string;
  storyMapReplayCta: string;
  storyMapNewAdventure: string;
  storyMapAllDone: string;
  // Video-first castle flow (Aug 2026): video screen + story unlock card.
  gamePlayFirst: string;
  gameCompletedTag: string;
  storyUnlockedHeading: string;
  openStoryAdventure: string;
  storyMapContinueCta: string;
  storyMapPlayLevelCta: (n: number) => string;
  storyMapLevelsDone: (done: number, total: number) => string;
  /** Shown when a LOCKED level node is tapped (map redesign §9). */
  storyMapLockedToast: string;
  // Story voice guide (spoken chrome + control labels). The spoken lines
  // are voiced by the Gemini clip narrator (the ONLY story voice) around
  // the FIXED story data — they never carry story facts themselves.
  storyVoiceOptionOne: string;
  storyVoiceOptionTwo: string;
  storyVoiceOptionThree: string;
  storyVoiceOptionFour: string;
  storyVoiceCorrectLead: string;
  storyVoiceNextCta: string;
  storyVoiceTryAgainCta: string;
  storyVoiceYourTurn: string;
  storyVoiceOn: string;
  storyVoiceOff: string;
  storyVoiceReplay: string;
  storyVoiceRetry: string;
  /** Neutral loading chip while Gemini audio is being prepared (§12). */
  storyVoicePreparing: string;
}

const EN: UIStrings = {
  appTitle: 'Nyaya Nagri',
  myProgress: 'My Progress',
  playerProfileToggle: 'Player Profile',
  mapLabel: 'Map',
  mapModalSubtitle: 'Your journey across Nyaya Nagri',
  mapOpenLabel: 'Open the full map',
  mapCloseLabel: 'Close map',
  mapLegendYou: 'You',
  mapLegendHub: 'Current Hub',
  mapLegendPath: 'Path',
  mapYouAreHere: 'You are here',
  startHereTagline: 'Start here!',
  learnRights: 'Learn Rights',
  helpOthers: 'Help Others',
  earnBadges: 'Earn Badges',
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
    memory: 'Memory Match',
    hidden: 'Find the Clues',
    sorting: 'Sort It Out',
    scenario: 'Quick Decision',
    authorities: 'Meet the Authorities',
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
  levelKindDescs: {
    story: "Let's start the journey and learn about rights and dignity.",
    decision: 'Make smart choices and see how they impact everyone.',
    quiz: 'Test your knowledge and become a rights champion!',
    memory: 'Match the pairs and strengthen your memory.',
    hidden: 'Search for clues hidden in the scene.',
    sorting: 'Sort each right into the correct group.',
    scenario: 'Think fast and pick the right action!',
    authorities: 'Meet the people who protect children\'s rights.',
  },
  zoneTotalPoints: 'Total Points',
  zoneEncouragement: "You're doing amazing!",
  zoneEncouragementSub: 'Keep learning, keep growing, keep shining!',

  zones: {
    zone0: {
      name: 'Know Yourself',
      theme: 'Every child is equal, matters, and lives with dignity (Constitution basics)',
    },
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
    zone6: {
      name: 'Family & Community Shield',
      theme: 'Every home should feel safe — the law shields children at home and in the community (child marriage prevention / family safety)',
    },
  },

  preQuizTitle: 'Quick! Before we start, what do you think?',
  postQuizTitle: "Let's review what we learned!",
  leaveQuest: 'Leave quest',
  questionXofY: (current, total) => `Question ${current} of ${total}`,
  correct: 'Correct!',
  notQuite: 'Not quite!',
  correctAnswerWas: 'The right answer:',
  continueLabel: 'Continue',
  whatWillYouDo: 'What will you do?',
  ribbonQuestion: 'Question',
  ribbonReview: 'Review',
  ribbonRecap: 'Recap',
  chTitle: 'Right to Childhood',
  chSubtitle: 'Build a happy, safe and equal childhood!',
  chTagline: 'Every child has the right to learn, play, and rest',
  chAwarenessTag: 'Child labour awareness',
  chRibbonDone: 'Game Completed!',
  chInstruction: 'Drag each picture below into its matching right.',
  chDragFromHere: 'Drag from here',
  chDropHere: 'Drop here',
  chRound: (n, total) => `Round ${n} of ${total}`,
  chScoreLabel: 'Score',
  chGreatMatch: 'Great match!',
  chNotQuite: 'Not quite! Try another place.',
  chDoesntBelong: 'This one does not belong here.',
  chLawChipLabel: 'The law says',
  chRoundCleared: 'Round cleared!',
  chBonus: (n) => `Bonus +${n}!`,
  chCompleteHeading: 'Childhood Rights Protected!',
  chCompleteSub: 'You matched every right correctly!',
  chFinalScore: 'Final score',
  chPlayAgain: 'Play again',
  chPlayCta: 'Play',
  chSoundOn: 'Sound on',
  chSoundOff: 'Sound off',
  chExitLabel: 'Leave the game',
  chHint: 'Hint',
  chHintAria: (n) => `Hint — ${n} left`,
  chMascotIntro: 'Drag each picture to its right place!',
  chMascotWrong: 'Think again — where does it truly belong?',
  chMascotDistractor: 'That one does not belong anywhere here.',
  spTitle: 'Safe Path Adventure',
  spTagline: 'Find the safe path and reach the Safe Zone!',
  spAwarenessTag: 'POCSO safety awareness',
  spInstruction: 'Walk the path. Choose what keeps you safe!',
  spMission1: 'Walk the path and watch for signs',
  spMission2: 'Answer safety questions to clear the way',
  spMission3: 'Reach the glowing Safe Zone',
  spMoveKeys: 'Move: arrow keys or WASD',
  spMoveTouch: 'Move: tap the arrows or swipe',
  spMoveUp: 'Move up',
  spMoveDown: 'Move down',
  spMoveLeft: 'Move left',
  spMoveRight: 'Move right',
  spStartCta: 'Start the adventure',
  spStart: 'START',
  spSafeZone: 'SAFE ZONE',
  spLevelLabel: (n, total) => `Level ${n} of ${total}`,
  spLivesAria: (n) => `Hearts left: ${n}`,
  spHintNone: 'No hints left',
  spHowSafe: 'How to stay safe?',
  spTipsHeading: 'Ways to stay safe',
  spTalkReminder:
    'If anything feels wrong, tell a trusted adult. You are never in trouble for telling the truth.',
  spSafeChoice: 'Safe choice!',
  spThinkAgain: 'Think again. It is okay — try once more!',
  spBackToCheckpoint: 'Back to the last checkpoint',
  spOkThanks: 'Okay!',
  spLivesOut: "Let's try that path again!",
  spLivesOutSub: 'Every hero practices. Start from your checkpoint.',
  spTryAgain: 'Try again',
  spReached: 'You reached the Safe Zone!',
  spReachedSub: 'You made safe choices all the way.',
  spQuizTitle: 'Safety Check',
  spQuizProgress: (n, total) => `Question ${n} of ${total}`,
  spChampion: 'Safety Champion!',
  spResultSub: 'You finished the Safe Path Adventure!',
  spGameScore: 'Game score',
  spQuizScore: 'Safety check',
  spSafeDecisions: 'Safe decisions',
  spWhatLearned: 'What you learned',
  spNextLevel: 'Next level',
  spComingSoon: 'More levels coming soon!',
  questComplete: 'Quest Complete!',
  youGotXofY: (score, total) => `You got ${score} out of ${total}!`,
  unlockedNext: (zoneName) => `You unlocked the next area: ${zoneName}`,
  recapTitle: "Let's revisit one big idea!",
  recapXofY: (current, total) => `${current} of ${total}`,
  recapGotIt: "You've got it!",
  recapTryAgainIntro: 'Good try! Here is the idea one more time:',
  readAloud: 'Read aloud',
  stopReading: 'Stop reading',

  memoryPairsFound: (found, total) => `Pairs found: ${found} of ${total}`,
  memoryMatchFound: 'It is a match!',
  memoryNotAMatch: 'Not a match — flip again and keep looking.',
  hiddenFoundXofY: (found, total) => `Found ${found} of ${total}`,
  hiddenKeepLooking: 'Nothing wrong there — keep looking.',
  hiddenAllFound: 'You spotted them all. Well done for looking so closely.',
  sortingBucketNames: {
    safe: 'Safe',
    tell: 'Tell a Trusted Adult',
    emergency: 'Emergency — Call Childline 1098',
  },
  sortingCardXofY: (current, total) => `Card ${current} of ${total}`,
  sortingRightPlace: 'Right place!',
  sortingBelongsIn: (bucketName) => `Good thinking — this one belongs in: ${bucketName}`,
  whereDoesThisGo: 'Where does this belong?',
  activityFinish: 'Finish',
  authoritiesTapHint: 'Tap each card to meet a helper.',
  authoritiesRememberLine:
    'You never have to remember all these names. One easy call — Childline 1098 — can reach the right helper for you.',

  certificatesHeading: 'Certificates',
  certificatesEarnHeading: 'Certificates to Earn',
  certificateOfCompletion: 'Certificate of Completion',
  certificateCompletedTag: 'Completed',
  viewCertificate: 'View Certificate',
  downloadCertificate: 'Download Certificate',
  certificateDownloading: 'Preparing your certificate…',
  certificateDownloadFailed: 'That download did not work. Please try again.',
  certificateLockedHint: 'Complete this zone to unlock your certificate.',
  certificateLevelsDone: (done, total) => `${done} of ${total} levels done`,
  certificateUnlockedToast: 'Certificate Unlocked!',
  certificateUnlockedBody: (zoneName) => `Congratulations! You completed ${zoneName}.`,
  certificateClose: 'Close',
  certBrandName: 'NYAYA NAGRI',
  certBrandTagline: 'Learning & Rights Education Platform',
  certPresentedTo: 'This certificate is proudly presented to',
  certForCompleting: 'for successfully completing',
  certBodyLine:
    'and demonstrating completion of the learning activities and challenges within this Nyaya Nagri learning zone.',
  certCompletedOnLabel: 'Completed on',
  certIdLabel: 'Certificate ID',
  certRecipientFallback: 'Nyaya Nagri Explorer',

  progressTitle: 'My Progress',
  closeProgress: 'Close progress',
  completedXofY: (done, total) =>
    `You've completed ${done} out of ${total} Rights Quests!`,
  encouragementStart:
    'Your adventure is just beginning. The Know Yourself zone is waiting for you!',
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

  adultAreaLink: 'Teacher & Parent Insights',
  adultAreaLinkSub:
    'Opens in a new tab — learning patterns, charts and a printable report (PIN-protected).',
  insMiniTitle: 'My Learning Glimpse',
  insMiniEmpty: 'Not enough activity data yet. Play a few more levels and check back!',
  insMiniAnswered: (count: number) =>
    `You have answered ${count} questions on your journey — great effort!`,
  insMiniStrong: (zone: string) => `${zone} looks like one of your strong topics. Wonderful!`,
  insMiniPractice: (zone: string) =>
    `A friendly replay of ${zone} could make you even stronger.`,
  insMiniKeepGoing: 'Keep exploring — every question makes your rights-knowledge stronger!',

  adultAreaTitle: 'Teacher & Parent Insights',
  adultAreaIntro:
    'Game-based learning patterns for the explorer on this device — observations over time, never judgements or diagnoses.',
  adultGateNote:
    'This is a local demo gate for this prototype: the PIN lives only in this browser and protects the adult views on this device. A real school deployment would use accounts with server-side access control.',
  adultSetPinTitle: 'Set an adult PIN',
  adultSetPinSub:
    'Choose a 4-6 digit PIN. You will need it to open the teacher and parent views on this device.',
  adultEnterPinTitle: 'Enter the adult PIN',
  adultPinPlaceholder: 'PIN (4-6 digits)',
  adultPinConfirmPlaceholder: 'Repeat PIN',
  adultPinMismatch: 'The two PINs do not match.',
  adultPinFormatError: 'The PIN must be 4 to 6 digits.',
  adultPinWrong: 'Wrong PIN. Please try again.',
  adultSetPinBtn: 'Save PIN & open',
  adultUnlock: 'Unlock',
  adultLock: 'Lock this area',
  adultForgotPin: 'Forgot the PIN? Reset it',
  adultForgotPinNote:
    'Resetting the PIN never touches any learning data. You will simply set a new PIN.',
  adultTeacherCard: 'Teacher dashboard',
  adultTeacherCardSub:
    'Topic accuracy, session trends, behaviour signals and AI observations.',
  adultParentCard: 'Parent view',
  adultParentCardSub: "A simple, friendly summary of your child's learning journey.",
  adultReportCard: 'Detailed report',
  adultReportCardSub: 'The full 14-section learning report — printable as PDF.',
  adultBackToGame: 'Back to the game',
  adultBackToHub: 'Back to insights home',

  insLearnerTitle: 'Explorer on this device',
  insLearnerSub:
    'This prototype stores one learner locally in this browser — identified only by a pseudonymous session ID, never a real name.',
  insNotEnoughData:
    'Not enough activity data yet to identify learning patterns. Insights appear after at least 8 answered questions across 2 different play sessions.',
  insEvidenceLine: (questions: number, sessions: number) =>
    `Based on ${questions} answered questions across ${sessions} play sessions`,
  insConfidence: 'Evidence confidence',
  insConfidenceHigh: 'High',
  insConfidenceMedium: 'Medium',
  insConfidenceLow: 'Low',
  insLabelStrong: 'Strong',
  insLabelDeveloping: 'Developing',
  insLabelNeedsPractice: 'Needs Practice',
  insLabelInsufficient: 'Not enough data',
  insTrendImproving: 'Improving',
  insTrendSteady: 'Steady',
  insTrendDeclining: 'Recent dip',
  insTrendInsufficient: 'Not enough data',
  insStatQuestions: 'Questions answered',
  insStatSessions: 'Play sessions',
  insStatActiveDays: 'Active days',
  insStatAccuracy: 'Overall accuracy',
  insStatTime: 'Active learning time',
  insStatLevels: 'Levels completed',
  insStatBadges: 'Badges',
  insStatStreak: 'Day streak',
  insStatPractice: 'Practice replays',
  insMinutes: (mins: number) => (mins < 1 ? 'under a minute' : `${mins} min`),
  insTopicChartTitle: 'Accuracy by topic (zones)',
  insTrendChartTitle: 'Improvement timeline',
  insTrendChartSub:
    'Average accuracy per play session — patterns over time, never single answers.',
  insColTopic: 'Topic',
  insColAnswered: 'Answered',
  insColAccuracy: 'Accuracy',
  insColLabel: 'Status',
  insColSessions: 'Sessions',
  insBehaviorTitle: 'Learning behaviour signals',
  insBehaviorRecap: (count: number) =>
    `${count} adaptive recap questions answered (guided revisits after a tough baseline)`,
  insBehaviorPersistence: (pct: number) =>
    `Continues playing after a wrong answer ${pct}% of the time`,
  insBehaviorPracticeReplays: (count: number) =>
    `${count} voluntary practice replays of finished levels`,
  insEngagement: 'Engagement',
  insEngagementGood: 'Good rhythm',
  insEngagementBuilding: 'Building up',
  insEngagementLow: 'Just starting',
  insStrengthsTitle: 'Strengths',
  insPracticeTitle: 'Areas for practice',
  insRecsTitle: 'Recommended next steps',
  insFindStrengthTopic: (zone: string, pct: number) =>
    `Shows strong understanding of ${zone} (${pct}% correct).`,
  insFindImproving: (fromPct: number, toPct: number) =>
    `Accuracy across sessions grew from ${fromPct}% to ${toPct}% — steady improvement.`,
  insFindPersistence: (pct: number) =>
    `Keeps going after mistakes (${pct}% of wrong answers are followed by continued play) — a healthy learning habit.`,
  insFindPracticeTopic: (zone: string, pct: number) =>
    `${zone} may benefit from more practice (${pct}% correct so far).`,
  insFindPracticeTopicDeveloping: (zone: string, pct: number) =>
    `${zone} is developing well (${pct}% correct) — a little more play could make it strong.`,
  insFindRecentDip: (pts: number) =>
    `Recent sessions dipped by about ${pts} points — a gentle revisit could help.`,
  insRecReplayZone: (zone: string) =>
    `Replay a level in ${zone} for friendly practice (replays are never scored).`,
  insRecContinueZone: (zone: string) => `Continue the journey: ${zone} is the next zone waiting.`,
  insRecRegular: 'Short, regular play sessions (2-3 per week) build the strongest patterns.',

  insAiTitle: 'AI observations',
  insAiSub:
    'Written by AI from the aggregated numbers above — filtered so it can never contain psychological or medical claims. The deterministic stats stay the source of truth.',
  insAiRefresh: 'Refresh AI observations',
  insAiLoading: 'Asking the AI to summarize the latest patterns…',
  insAiError:
    'The AI summary is unavailable right now. The stats above are unaffected — try again in a moment.',
  insAiUnavailable:
    'AI observations need the server AI key (GEMINI_API_KEY). All deterministic insights above work without it.',
  insAiStrengths: 'Strengths',
  insAiPractice: 'Practice areas',
  insAiRecommendations: 'Suggestions',
  insAiTrendLabel: 'Trend',
  insAiEncouragementLabel: 'A word for the adults',
  insAiFilteredNote: 'Some AI text was removed by the safety filter (non-diagnostic guarantee).',
  insAiEmpty: 'No AI observations yet — tap refresh to generate them.',
  insAiCachedNote: 'Generated once per data change and cached — never on every click.',

  parentTitle: 'Parent view',
  parentIntro:
    "A simple picture of your child's learning journey in Nyaya Nagri — the game that teaches children their legal rights.",
  parentJourney: (done: number, total: number) => `${done} of ${total} zones explored`,
  parentWhatItMeans: 'What does this mean?',
  parentWhatItMeansBody:
    'These numbers only describe how your child plays and answers inside the game. They show learning patterns — they never measure intelligence, attention, or any medical or psychological condition.',
  parentTalkTitle: 'A nice question to ask your child',
  parentTalkBody:
    '"Which zone did you like the most, and what would you do if a friend needed that right?" — talking about it doubles the learning.',

  reportTitle: 'Learning & Development Report',
  reportPrint: 'Print / Save as PDF',
  reportGeneratedOn: (when: string) => `Generated on ${when}`,
  reportS1: 'Student Overview',
  reportS2: 'Learning Summary',
  reportS3: 'Zone Progress',
  reportS4: 'Question Performance',
  reportS5: 'Topic Performance',
  reportS6: 'Strengths',
  reportS7: 'Areas for Practice',
  reportS8: 'Improvement Timeline',
  reportS9: 'Engagement Summary',
  reportS10: 'Recommended Activities',
  reportS11: 'Badges',
  reportS12: 'Certificates',
  reportS13: 'AI-Generated Learning Insights',
  reportS14: 'Disclaimer',
  reportQpBaseline: 'Baseline quiz accuracy (before learning)',
  reportQpCheckpoint: 'Checkpoint quiz accuracy (after learning)',
  reportQpRecap: 'Adaptive recap accuracy',
  reportQpAvgTime: 'Average response time',
  reportSeconds: (secs: number) => `${secs}s`,
  reportObservedTag: 'Observed game behaviour',
  reportDevRefTag: 'Developmental reference',
  reportDevRefBody:
    'Background reading on how children develop and learn (adult context only — never used to assess this child): Verywell Mind, "Child Psychology and Development".',
  reportSourcesTitle: 'Sources & verification',
  reportSourceLegalIntro:
    "Every legal topic in the game traces to Indian law as published on India Code (indiacode.nic.in), the Government of India's official legislation repository:",
  reportLegalUnverified: 'Legal source could not be verified',
  reportColAct: 'Legal basis (India Code)',
  reportNoBadges: 'No badges earned yet.',
  reportNoCertificates: 'No certificates earned yet.',
  insDisclaimer:
    "These insights describe game-based learning patterns only. This is not a psychological, medical, or diagnostic assessment, and it cannot determine any child's mental or medical condition. If you have any concern about a child's development or wellbeing, please talk to a qualified professional.",

  getHelpNow: 'Get Help Now',
  emergencyHelp: 'Emergency Help',
  childline: 'Childline',
  cyberCrime: 'Cyber Crime',
  available247: "Available 24/7. It's safe and free to call.",
  close: 'Close',

  helpHubSubtitle: "Need help? We'll help you find the right support.",
  realEmergency: 'Real emergency',
  emergencyQuestion: 'Someone is badly hurt, unconscious, or cannot breathe?',
  call112: 'Call 112',
  isThisEmergency: 'Is this a real emergency?',
  yesCall112: 'Yes, call 112',
  emergencySafetyNote: 'For serious or life-threatening emergencies, call emergency services right away.',
  findHelpNearMe: 'Find Help Near Me',
  findHelpIntro: 'Allow your location to find nearby hospitals and medical help on Google Maps.',
  allowLocation: 'Use My Location',
  locationPrivacyNote: 'Your location stays on this device — it only goes into the Google Maps link you open. It is never saved.',
  findingLocation: 'Finding your location...',
  locationFound: 'Location found',
  locationReady: 'Your location is ready. Find nearby medical help.',
  chooseHelpType: 'Choose the type of help you need.',
  findHospitals: 'Find Hospitals Nearby',
  findMedicalCare: 'Find Medical Care',
  findChildCare: 'Find Child Care',
  emergencySearchLabel: 'Emergency Help',
  allowLocationAgain: 'Allow Location Again',
  locationDenied: 'Location access is needed to find help near you.',
  locationSettingsHint: 'Turn location back on in your browser or phone settings, then tap Allow Location Again.',
  locationTimeout: 'Location is taking too long.',
  locationUnavailable: "We couldn't determine your location.",
  locationUnsupported: 'Your device or browser does not support location access.',
  openMaps: 'Open Google Maps',
  emergencyAssistNote: 'For immediate emergency assistance',
  needAdult: 'Need an adult?',
  needAdultNote: 'Ask a parent, teacher or trusted adult for help.',
  shareHelpInfo: 'Share Help Information',
  shareCopied: 'Copied! Show it to an adult.',
  moreHelp: 'Report online',

  guideIntro:
    "Hi! I'm Nyaya AI 👋 Ask me anything about your rights or what you're learning in Nyaya Nagri. I'm a computer helper, not a real person or lawyer — and please don't share personal details like your real name, school, or phone number.",
  yourGuide: 'Nyaya AI',
  aiCompanion: 'Your Rights Guide',
  thinking: 'Thinking...',
  askAnything: 'Type your question...',
  guideResting: 'Nyaya AI is taking a short break. Please try again.',
  toggleVoice: 'Toggle voice',
  openGuide: 'Open Nyaya AI',
  closeChat: 'Close chat',
  zoneWelcomeFallback: (zoneName, theme) =>
    `Welcome to ${zoneName}! Here we'll learn about: ${theme}.`,

  nyayaAiDisclaimer:
    'This AI provides educational legal information, not professional legal advice.',
  nyayaAiSuggestedTitle: 'Try asking:',
  nyayaAiSuggested: [
    'What are my rights?',
    'Explain this zone',
    'What should I do online?',
    'Why is this important?',
    'Explain in simple words',
  ],
  nyayaAiNotConfigured: 'Nyaya AI is not set up yet — please try again later.',
  nyayaAiMicDenied:
    "I can't hear you because microphone access is off. You can allow the mic in your browser settings, or just type your question.",

  nyayaAiTapToTalk: 'Tap to talk',
  nyayaAiListening: 'Listening... speak now',
  nyayaAiThinking: 'Thinking...',
  nyayaAiSpeaking: 'Nyaya AI is speaking...',
  nyayaAiConnecting: 'Connecting...',
  nyayaAiMicHint: 'Tap the microphone and talk to me.',
  nyayaAiRetry: 'Try again',
  nyayaAiVoiceStop: 'End voice chat',
  nyayaAiVoiceUnavailable:
    'Voice chat is temporarily unavailable. You can still chat with Nyaya AI.',
  nyayaAiVoiceConnectFail:
    "I couldn't start voice chat right now. Please try again, or just type your question.",
  nyayaAiMicDeniedVoice:
    "I can't hear you because microphone access is blocked. You can allow the mic in your browser settings, or just type your question — I'm still here!",

  personaDisclaimer: (role) => `This is a role-play, not a real ${role}.`,
  personaRolePolice: 'Police Officer',
  personaRoleLawyer: 'Lawyer',
  personaRoleTeacher: 'Teacher',
  personaRoleJudge: 'Judge',
  personaRoleParent: 'Parent or Guardian',
  personaNamePolice: 'Officer Kavita',
  personaNameLawyer: 'Advocate Arjun',
  personaNameTeacher: 'Sunita Maam',
  personaNameJudge: 'Judge Meera',
  personaNameParent: 'Nisha Aunty',
  personaIntroLine: (name) =>
    `You can interview ${name}. Tap a suggested question, or type a short one of your own.`,
  personaInputPlaceholder: 'Type a short question...',
  personaSend: 'Ask',
  personaUnavailable: 'This character is resting — try again in a moment.',

  settingsTitle: 'Settings',
  languageLabel: 'Language',
  languageEnglish: 'English',
  languageHindi: 'Hindi',
  narrationLabel: 'Audio narration',
  narrationHint: 'Reads stories and choices aloud. Quizzes stay quiet.',
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
  // Card titles are the reference-image headings; bodies keep the original
  // approved wording — the safety meaning is never rephrased (PRD §9).
  howItWorksCards: [
    {
      title: 'Explore the City',
      body: 'Walk around the city and visit 7 zones — each one is about rights that protect you.',
    },
    {
      title: 'Play, Choose & Earn',
      body: 'Play story quests, make your own choices, and answer fun quizzes to earn badges.',
    },
    {
      title: 'Ask Anything',
      body: 'Your friendly guide can answer questions any time.',
    },
    {
      title: 'Get Help Anytime',
      body: 'The red Get Help Now button is always on screen — it shows real helplines like Childline 1098.',
    },
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
  characterLabel: 'Your hero',
  characterNames: ['Boy', 'Girl'],
  baseLookLabel: 'Look',
  baseLookNames: ['Sunny', 'Brave'],
  skinToneLabel: 'Skin tone',
  hairLabel: 'Hair',
  hairStyleNames: ['Short', 'Curly', 'Braids', 'Bun', 'Ponytail'],
  outfitLabel: 'Clothes',
  outfitNames: ['Kurta', 'T-shirt', 'Kameez', 'Hoodie', 'Kurti', 'Dress'],
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
  avatarLiveNote: 'Changes you make will update your hero in real time.',
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
    zone0_pathfinder: 'Rights Pathfinder',
    zone1_guardian: 'Safe Zone Guardian',
    zone2_champion: 'Childhood Champion',
    zone3_scholar: 'School Rights Scholar',
    zone4_explorer: 'Justice Explorer',
    zone5_defender: 'Digital Defender',
    zone6_shield_bearer: 'Shield Bearer',
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

  homeTagline: 'Know Your Rights. Build Your Future.',
  homeEnterCta: 'Enter',
  homeCentralBanner: 'Know Your Rights',
  homeLoading: 'Loading…',
  homeAbout: 'About',
  homeAboutTitle: 'About Nyaya Nagri',
  homeAboutBody: [
    'Nyaya Nagri is a learning city where children aged 8-18 explore the rights that protect them — through stories, quests, and games in English and Hindi.',
    'It is an awareness and confidence-building tool — not legal advice and not a crisis service. For real help, the red Get Help Now button always shows Childline 1098 and Cyber Crime 155260.',
    'Everything you do stays on this device: no accounts, no photos, no real names, no personal details.',
  ],

  storyAdventure: 'Story Adventure',
  storyEnterCta: 'Press E or Tap to Begin',
  storyTryAgain: 'Try Again',
  storyContinueExploring: 'Continue Exploring',
  storyRewardUnlocked: (rewardName) => `${rewardName} Unlocked!`,
  storySlideOf: (current, total) => `${current} / ${total}`,
  storyAdventuresHeading: 'Story Adventures',
  storyLockedHint: (previousTitle) => `Finish "${previousTitle}" to unlock this story.`,
  storyExit: 'Leave the story',
  storyMapSubtitle: 'Har level ek naya adhikar sikhata hai.',
  storyMapComingSoon: 'Naye adventures jald aa rahe hain…',
  storyMapComingSoonLead: 'Naye adventures',
  storyMapComingSoonTail: 'jald aa rahe hain…',
  storyMapPlayCta: 'Shuru karo',
  storyMapReplayCta: 'Dobara khelo',
  storyMapNewAdventure: 'New Adventure Unlocked!',
  storyMapAllDone: 'Saari kahaniyan complete!',
  gamePlayFirst: 'Play the game, then continue',
  gameCompletedTag: 'Game completed',
  storyUnlockedHeading: 'New Story Unlocked!',
  openStoryAdventure: 'Go to Story Adventure',
  storyMapContinueCta: 'Continue Adventure',
  storyMapPlayLevelCta: (n) => `Play Level ${n}`,
  storyMapLevelsDone: (done, total) => `${done} / ${total} Complete`,
  storyMapLockedToast: 'Pehle pichhla adventure complete karo!',
  storyVoiceOptionOne: 'Option one:',
  storyVoiceOptionTwo: 'Option two:',
  storyVoiceOptionThree: 'Option three:',
  storyVoiceOptionFour: 'Option four:',
  storyVoiceCorrectLead: 'Bahut badhiya!',
  storyVoiceNextCta: 'Ab Next par tap karke story continue karo.',
  storyVoiceTryAgainCta: 'Try Again par tap karke dobara answer choose karo.',
  storyVoiceYourTurn: 'Ab aapki baari hai.',
  storyVoiceOn: 'Turn voice guide on',
  storyVoiceOff: 'Turn voice guide off',
  storyVoiceReplay: 'Listen again',
  storyVoiceRetry: 'Voice load nahi ho paayi. Dobara sunne ke liye tap karein.',
  storyVoicePreparing: 'Voice taiyaar ho rahi hai…',
};

const HI: UIStrings = {
  appTitle: 'न्याय नगरी',
  myProgress: 'मेरी प्रगति',
  playerProfileToggle: 'खिलाड़ी प्रोफ़ाइल',
  mapLabel: 'नक्शा',
  mapModalSubtitle: 'न्याय नगरी में तुम्हारा सफ़र',
  mapOpenLabel: 'पूरा नक्शा खोलो',
  mapCloseLabel: 'नक्शा बंद करो',
  mapLegendYou: 'तुम',
  mapLegendHub: 'मुख्य केंद्र',
  mapLegendPath: 'रास्ता',
  mapYouAreHere: 'तुम यहाँ हो',
  startHereTagline: 'यहाँ से शुरू करो!',
  learnRights: 'अधिकार सीखो',
  helpOthers: 'दूसरों की मदद करो',
  earnBadges: 'बैज कमाओ',
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
    memory: 'मेमोरी मिलान',
    hidden: 'सुराग ढूँढो',
    sorting: 'सही जगह चुनो',
    scenario: 'झटपट फ़ैसला',
    authorities: 'मददगारों से मिलो',
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
  levelKindDescs: {
    story: 'सफ़र शुरू करो और अपने अधिकार और सम्मान सीखो।',
    decision: 'समझदारी से चुनो और देखो इससे सबको कैसे फ़र्क पड़ता है।',
    quiz: 'अपनी जानकारी परखो और अधिकार चैंपियन बनो!',
    memory: 'जोड़े मिलाओ और अपनी याददाश्त मज़बूत करो।',
    hidden: 'दृश्य में छिपे सुराग ढूँढो।',
    sorting: 'हर अधिकार को सही जगह पर रखो।',
    scenario: 'जल्दी सोचो और सही काम चुनो!',
    authorities: 'उन लोगों से मिलो जो बच्चों के अधिकार बचाते हैं।',
  },
  zoneTotalPoints: 'कुल अंक',
  zoneEncouragement: 'तुम बहुत बढ़िया कर रहे हो!',
  zoneEncouragementSub: 'सीखते रहो, बढ़ते रहो, चमकते रहो!',

  zones: {
    zone0: {
      name: 'खुद को जानो',
      theme: 'हर बच्चा बराबर है, मायने रखता है, और गरिमा के साथ जीता है (संविधान की मूल बातें)',
    },
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
    zone6: {
      name: 'परिवार और समुदाय की ढाल',
      theme: 'हर घर सुरक्षित महसूस होना चाहिए — क़ानून घर और समुदाय में बच्चों की ढाल है (बाल विवाह रोकथाम / पारिवारिक सुरक्षा)',
    },
  },

  preQuizTitle: 'जल्दी बताओ! शुरू करने से पहले, तुम्हें क्या लगता है?',
  postQuizTitle: 'चलो देखें हमने क्या सीखा!',
  leaveQuest: 'क्वेस्ट छोड़ो',
  questionXofY: (current, total) => `सवाल ${current} (कुल ${total})`,
  correct: 'सही!',
  notQuite: 'पूरा सही नहीं!',
  correctAnswerWas: 'सही जवाब:',
  continueLabel: 'आगे बढ़ो',
  whatWillYouDo: 'तुम क्या करोगे?',
  ribbonQuestion: 'सवाल',
  ribbonReview: 'पुनरावृत्ति',
  ribbonRecap: 'दोहराएं',
  chTitle: 'बचपन का अधिकार',
  chSubtitle: 'खुशहाल, सुरक्षित और बराबरी वाला बचपन बनाओ!',
  chTagline: 'हर बच्चे को सीखने, खेलने और आराम करने का अधिकार है',
  chAwarenessTag: 'बाल श्रम जागरूकता',
  chRibbonDone: 'गेम पूरा हुआ!',
  chInstruction: 'नीचे की हर तस्वीर खींचकर उसके सही हक में रखो।',
  chDragFromHere: 'यहाँ से खींचो',
  chDropHere: 'यहाँ छोड़ो',
  chRound: (n, total) => `राउंड ${n} / ${total}`,
  chScoreLabel: 'स्कोर',
  chGreatMatch: 'सही जगह!',
  chNotQuite: 'यहाँ नहीं! किसी और जगह आज़माओ।',
  chDoesntBelong: 'यह तस्वीर यहाँ नहीं आती।',
  chLawChipLabel: 'कानून कहता है',
  chRoundCleared: 'राउंड पूरा!',
  chBonus: (n) => `बोनस +${n}!`,
  chCompleteHeading: 'बचपन के अधिकार सुरक्षित!',
  chCompleteSub: 'तुमने हर हक सही जगह लगाया!',
  chFinalScore: 'कुल स्कोर',
  chPlayAgain: 'फिर से खेलो',
  chPlayCta: 'खेलो',
  chSoundOn: 'आवाज़ चालू',
  chSoundOff: 'आवाज़ बंद',
  chExitLabel: 'गेम से बाहर जाओ',
  chHint: 'हिंट',
  chHintAria: (n) => `हिंट — ${n} बाकी`,
  chMascotIntro: 'हर तस्वीर को उसकी सही जगह खींचो!',
  chMascotWrong: 'फिर से सोचो — यह सच में कहाँ आती है?',
  chMascotDistractor: 'वह तस्वीर यहाँ किसी जगह नहीं आती।',
  spTitle: 'सुरक्षित राह का सफ़र',
  spTagline: 'सुरक्षित राह चुनो और सेफ ज़ोन तक पहुँचो!',
  spAwarenessTag: 'पॉक्सो सुरक्षा जागरूकता',
  spInstruction: 'राह पर चलो। वही चुनो जो सुरक्षित रखे!',
  spMission1: 'राह पर चलो और संकेतों पर ध्यान दो',
  spMission2: 'सुरक्षा सवालों के जवाब देकर राह खोलो',
  spMission3: 'चमकते सेफ ज़ोन तक पहुँचो',
  spMoveKeys: 'चलने के लिए: तीर कुंजियाँ या WASD',
  spMoveTouch: 'चलने के लिए: तीर बटन दबाओ या स्वाइप करो',
  spMoveUp: 'ऊपर चलो',
  spMoveDown: 'नीचे चलो',
  spMoveLeft: 'बाएँ चलो',
  spMoveRight: 'दाएँ चलो',
  spStartCta: 'सफ़र शुरू करो',
  spStart: 'शुरू',
  spSafeZone: 'सेफ ज़ोन',
  spLevelLabel: (n, total) => `स्तर ${n} / ${total}`,
  spLivesAria: (n) => `दिल बाकी: ${n}`,
  spHintNone: 'हिंट खत्म',
  spHowSafe: 'सुरक्षित कैसे रहें?',
  spTipsHeading: 'सुरक्षित रहने के तरीके',
  spTalkReminder:
    'कुछ भी गलत लगे तो किसी भरोसेमंद बड़े को बताओ। सच बताने पर तुम कभी मुसीबत में नहीं पड़ोगे।',
  spSafeChoice: 'सुरक्षित चुनाव!',
  spThinkAgain: 'फिर से सोचो। कोई बात नहीं — एक बार और!',
  spBackToCheckpoint: 'पिछले पड़ाव से फिर शुरू',
  spOkThanks: 'ठीक है!',
  spLivesOut: 'चलो, वह राह फिर से आज़माएँ!',
  spLivesOutSub: 'हर हीरो अभ्यास करता है। अपने पड़ाव से शुरू करो।',
  spTryAgain: 'फिर कोशिश करो',
  spReached: 'तुम सेफ ज़ोन पहुँच गए!',
  spReachedSub: 'तुमने पूरे रास्ते सुरक्षित चुनाव किए।',
  spQuizTitle: 'सुरक्षा जाँच',
  spQuizProgress: (n, total) => `सवाल ${n} / ${total}`,
  spChampion: 'सुरक्षा चैंपियन!',
  spResultSub: 'तुमने सुरक्षित राह का सफ़र पूरा किया!',
  spGameScore: 'गेम स्कोर',
  spQuizScore: 'सुरक्षा जाँच',
  spSafeDecisions: 'सुरक्षित फैसले',
  spWhatLearned: 'तुमने क्या सीखा',
  spNextLevel: 'अगला स्तर',
  spComingSoon: 'और स्तर जल्द आ रहे हैं!',
  questComplete: 'क्वेस्ट पूरी हुई!',
  youGotXofY: (score, total) => `तुमने ${total} में से ${score} सही किए!`,
  unlockedNext: (zoneName) => `नया इलाका खुल गया: ${zoneName}`,
  recapTitle: 'चलो एक बड़ी बात फिर से देखें!',
  recapXofY: (current, total) => `${current} (कुल ${total})`,
  recapGotIt: 'तुमने समझ लिया!',
  recapTryAgainIntro: 'अच्छी कोशिश! वही बात एक बार फिर:',
  readAloud: 'पढ़कर सुनाओ',
  stopReading: 'पढ़ना रोको',

  memoryPairsFound: (found, total) => `जोड़ियाँ मिलीं: ${total} में से ${found}`,
  memoryMatchFound: 'जोड़ी मिल गई!',
  memoryNotAMatch: 'जोड़ी नहीं बनी — फिर पलटो और ढूँढते रहो।',
  hiddenFoundXofY: (found, total) => `${total} में से ${found} मिले`,
  hiddenKeepLooking: 'वहाँ सब ठीक है — और ढूँढो।',
  hiddenAllFound: 'तुमने सब ढूँढ लिए। इतने ध्यान से देखने के लिए शाबाश।',
  sortingBucketNames: {
    safe: 'सुरक्षित',
    tell: 'किसी भरोसेमंद बड़े को बताओ',
    emergency: 'इमरजेंसी — चाइल्डलाइन 1098 पर कॉल करो',
  },
  sortingCardXofY: (current, total) => `कार्ड ${current} (कुल ${total})`,
  sortingRightPlace: 'सही जगह!',
  sortingBelongsIn: (bucketName) => `अच्छा सोचा — यह असल में यहाँ जाता है: ${bucketName}`,
  whereDoesThisGo: 'यह कहाँ जाएगा?',
  activityFinish: 'पूरा करो',
  authoritiesTapHint: 'हर कार्ड पर टैप करके एक मददगार से मिलो।',
  authoritiesRememberLine:
    'तुम्हें ये सारे नाम याद रखने की ज़रूरत नहीं है। एक आसान कॉल — चाइल्डलाइन 1098 — तुम्हें सही मददगार तक पहुँचा सकती है।',

  certificatesHeading: 'प्रमाणपत्र',
  certificatesEarnHeading: 'कमाने के लिए प्रमाणपत्र',
  certificateOfCompletion: 'पूर्णता प्रमाणपत्र',
  certificateCompletedTag: 'पूरा हुआ',
  viewCertificate: 'प्रमाणपत्र देखो',
  downloadCertificate: 'प्रमाणपत्र डाउनलोड करो',
  certificateDownloading: 'तुम्हारा प्रमाणपत्र तैयार हो रहा है…',
  certificateDownloadFailed: 'डाउनलोड नहीं हो पाया। फिर से कोशिश करो।',
  certificateLockedHint: 'अपना प्रमाणपत्र पाने के लिए यह ज़ोन पूरा करो।',
  certificateLevelsDone: (done, total) => `${total} में से ${done} लेवल पूरे`,
  certificateUnlockedToast: 'प्रमाणपत्र मिल गया!',
  certificateUnlockedBody: (zoneName) => `बधाई हो! तुमने ${zoneName} पूरा कर लिया।`,
  certificateClose: 'बंद करो',
  certBrandName: 'न्याय नगरी',
  certBrandTagline: 'सीखने और अधिकारों की शिक्षा का मंच',
  certPresentedTo: 'यह प्रमाणपत्र गर्व के साथ दिया जाता है',
  certForCompleting: 'सफलतापूर्वक पूरा करने के लिए',
  certBodyLine:
    'और इस न्याय नगरी लर्निंग ज़ोन की सीखने की गतिविधियाँ और चुनौतियाँ पूरी करने के लिए।',
  certCompletedOnLabel: 'पूरा किया',
  certIdLabel: 'प्रमाणपत्र आईडी',
  certRecipientFallback: 'न्याय नगरी खोजी',

  progressTitle: 'मेरी प्रगति',
  closeProgress: 'प्रगति बंद करो',
  completedXofY: (done, total) =>
    `तुमने ${total} में से ${done} अधिकार क्वेस्ट पूरी कर ली हैं!`,
  encouragementStart:
    'तुम्हारा सफ़र अभी शुरू हुआ है। खुद को जानो ज़ोन तुम्हारा इंतज़ार कर रहा है!',
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

  adultAreaLink: 'शिक्षक और अभिभावक इनसाइट्स',
  adultAreaLinkSub:
    'नए टैब में खुलता है — सीखने के पैटर्न, चार्ट और प्रिंट होने वाली रिपोर्ट (PIN-सुरक्षित)।',
  insMiniTitle: 'मेरी सीखने की झलक',
  insMiniEmpty: 'अभी पर्याप्त गतिविधि डेटा नहीं है। कुछ और लेवल खेलो और फिर देखना!',
  insMiniAnswered: (count: number) =>
    `तुमने अपनी यात्रा में ${count} सवालों के जवाब दिए हैं — शानदार मेहनत!`,
  insMiniStrong: (zone: string) => `${zone} तुम्हारे मज़बूत विषयों में लगता है। बहुत बढ़िया!`,
  insMiniPractice: (zone: string) =>
    `${zone} का एक दोस्ताना रीप्ले तुम्हें और भी मज़बूत बना सकता है।`,
  insMiniKeepGoing: 'खोज जारी रखो — हर सवाल तुम्हारी अधिकारों की समझ मज़बूत करता है!',

  adultAreaTitle: 'शिक्षक और अभिभावक इनसाइट्स',
  adultAreaIntro:
    'इस डिवाइस के खोजी के गेम-आधारित सीखने के पैटर्न — समय के साथ अवलोकन, कभी भी फ़ैसले या निदान नहीं।',
  adultGateNote:
    'यह इस प्रोटोटाइप का लोकल डेमो गेट है: PIN सिर्फ़ इसी ब्राउज़र में रहता है और इसी डिवाइस पर बड़ों के व्यू सुरक्षित करता है। असली स्कूल डिप्लॉयमेंट में सर्वर-साइड एक्सेस कंट्रोल वाले असली अकाउंट होंगे।',
  adultSetPinTitle: 'बड़ों का PIN सेट करें',
  adultSetPinSub:
    '4-6 अंकों का PIN चुनें। इसी डिवाइस पर शिक्षक और अभिभावक व्यू खोलने के लिए यह चाहिए होगा।',
  adultEnterPinTitle: 'बड़ों का PIN डालें',
  adultPinPlaceholder: 'PIN (4-6 अंक)',
  adultPinConfirmPlaceholder: 'PIN दोबारा डालें',
  adultPinMismatch: 'दोनों PIN मेल नहीं खाते।',
  adultPinFormatError: 'PIN 4 से 6 अंकों का होना चाहिए।',
  adultPinWrong: 'ग़लत PIN। फिर से कोशिश करें।',
  adultSetPinBtn: 'PIN सेव करें और खोलें',
  adultUnlock: 'खोलें',
  adultLock: 'इस हिस्से को लॉक करें',
  adultForgotPin: 'PIN भूल गए? रीसेट करें',
  adultForgotPinNote:
    'PIN रीसेट करने से सीखने का कोई डेटा नहीं मिटता। आप बस नया PIN सेट करेंगे।',
  adultTeacherCard: 'शिक्षक डैशबोर्ड',
  adultTeacherCardSub: 'विषयवार सटीकता, सेशन ट्रेंड, व्यवहार संकेत और AI अवलोकन।',
  adultParentCard: 'अभिभावक व्यू',
  adultParentCardSub: 'आपके बच्चे की सीखने की यात्रा का सरल, दोस्ताना सार।',
  adultReportCard: 'विस्तृत रिपोर्ट',
  adultReportCardSub: 'पूरी 14-खंड वाली लर्निंग रिपोर्ट — PDF की तरह प्रिंट करें।',
  adultBackToGame: 'गेम पर वापस',
  adultBackToHub: 'इनसाइट्स होम पर वापस',

  insLearnerTitle: 'इस डिवाइस का खोजी',
  insLearnerSub:
    'यह प्रोटोटाइप एक ही लर्नर को इसी ब्राउज़र में लोकली रखता है — पहचान सिर्फ़ छद्म सेशन ID से, कभी असली नाम से नहीं।',
  insNotEnoughData:
    'सीखने के पैटर्न पहचानने के लिए अभी पर्याप्त गतिविधि डेटा नहीं है। कम से कम 2 अलग सेशनों में 8 सवालों के जवाब के बाद इनसाइट्स दिखेंगी।',
  insEvidenceLine: (questions: number, sessions: number) =>
    `${sessions} सेशनों में ${questions} जवाबों के आधार पर`,
  insConfidence: 'भरोसे का स्तर',
  insConfidenceHigh: 'उच्च',
  insConfidenceMedium: 'मध्यम',
  insConfidenceLow: 'कम',
  insLabelStrong: 'मज़बूत',
  insLabelDeveloping: 'विकसित हो रहा',
  insLabelNeedsPractice: 'अभ्यास चाहिए',
  insLabelInsufficient: 'डेटा कम है',
  insTrendImproving: 'सुधर रहा',
  insTrendSteady: 'स्थिर',
  insTrendDeclining: 'हाल में हल्की गिरावट',
  insTrendInsufficient: 'डेटा कम है',
  insStatQuestions: 'जवाब दिए सवाल',
  insStatSessions: 'खेल सेशन',
  insStatActiveDays: 'सक्रिय दिन',
  insStatAccuracy: 'कुल सटीकता',
  insStatTime: 'सक्रिय सीखने का समय',
  insStatLevels: 'पूरे किए लेवल',
  insStatBadges: 'बैज',
  insStatStreak: 'दिनों की स्ट्रीक',
  insStatPractice: 'अभ्यास रीप्ले',
  insMinutes: (mins: number) => (mins < 1 ? 'एक मिनट से कम' : `${mins} मिनट`),
  insTopicChartTitle: 'विषय (ज़ोन) अनुसार सटीकता',
  insTrendChartTitle: 'सुधार की टाइमलाइन',
  insTrendChartSub: 'हर खेल सेशन की औसत सटीकता — समय के साथ पैटर्न, अकेले जवाब नहीं।',
  insColTopic: 'विषय',
  insColAnswered: 'जवाब',
  insColAccuracy: 'सटीकता',
  insColLabel: 'स्थिति',
  insColSessions: 'सेशन',
  insBehaviorTitle: 'सीखने के व्यवहार संकेत',
  insBehaviorRecap: (count: number) =>
    `${count} अडैप्टिव रीकैप सवालों के जवाब (कठिन बेसलाइन के बाद दोस्ताना दोहराव)`,
  insBehaviorPersistence: (pct: number) =>
    `ग़लत जवाब के बाद ${pct}% बार खेलना जारी रहता है`,
  insBehaviorPracticeReplays: (count: number) =>
    `पूरे हो चुके लेवलों के ${count} स्वैच्छिक अभ्यास रीप्ले`,
  insEngagement: 'जुड़ाव',
  insEngagementGood: 'अच्छी लय',
  insEngagementBuilding: 'बन रही है',
  insEngagementLow: 'अभी शुरुआत है',
  insStrengthsTitle: 'मज़बूत पक्ष',
  insPracticeTitle: 'अभ्यास के क्षेत्र',
  insRecsTitle: 'अगले सुझाए कदम',
  insFindStrengthTopic: (zone: string, pct: number) =>
    `${zone} की समझ मज़बूत दिख रही है (${pct}% सही)।`,
  insFindImproving: (fromPct: number, toPct: number) =>
    `सेशनों के साथ सटीकता ${fromPct}% से बढ़कर ${toPct}% हुई — लगातार सुधार।`,
  insFindPersistence: (pct: number) =>
    `ग़लती के बाद भी आगे बढ़ना जारी रहता है (${pct}% ग़लत जवाबों के बाद खेल जारी) — सीखने की अच्छी आदत।`,
  insFindPracticeTopic: (zone: string, pct: number) =>
    `${zone} में और अभ्यास मदद कर सकता है (अभी ${pct}% सही)।`,
  insFindPracticeTopicDeveloping: (zone: string, pct: number) =>
    `${zone} अच्छे से विकसित हो रहा है (${pct}% सही) — थोड़ा और खेल इसे मज़बूत बना देगा।`,
  insFindRecentDip: (pts: number) =>
    `हाल के सेशनों में करीब ${pts} अंकों की हल्की गिरावट — एक दोस्ताना दोहराव मदद करेगा।`,
  insRecReplayZone: (zone: string) =>
    `${zone} का कोई लेवल दोस्ताना अभ्यास के लिए रीप्ले करें (रीप्ले कभी स्कोर नहीं होते)।`,
  insRecContinueZone: (zone: string) => `यात्रा जारी रखें: अगला ज़ोन ${zone} इंतज़ार कर रहा है।`,
  insRecRegular: 'छोटे, नियमित खेल सेशन (हफ़्ते में 2-3) सबसे मज़बूत पैटर्न बनाते हैं।',

  insAiTitle: 'AI अवलोकन',
  insAiSub:
    'ऊपर के जोड़े गए आँकड़ों से AI द्वारा लिखा गया — ऐसे फ़िल्टर के साथ कि इसमें कभी मनोवैज्ञानिक या चिकित्सीय दावे न आ सकें। भरोसे का स्रोत हमेशा ऊपर के आँकड़े ही हैं।',
  insAiRefresh: 'AI अवलोकन रीफ्रेश करें',
  insAiLoading: 'AI से ताज़ा पैटर्न का सार माँगा जा रहा है…',
  insAiError:
    'AI सार अभी उपलब्ध नहीं है। ऊपर के आँकड़े प्रभावित नहीं हैं — थोड़ी देर में फिर कोशिश करें।',
  insAiUnavailable:
    'AI अवलोकनों के लिए सर्वर पर AI key (GEMINI_API_KEY) चाहिए। ऊपर की सभी नियतात्मक इनसाइट्स इसके बिना भी काम करती हैं।',
  insAiStrengths: 'मज़बूत पक्ष',
  insAiPractice: 'अभ्यास क्षेत्र',
  insAiRecommendations: 'सुझाव',
  insAiTrendLabel: 'रुझान',
  insAiEncouragementLabel: 'बड़ों के लिए दो शब्द',
  insAiFilteredNote: 'सुरक्षा फ़िल्टर ने कुछ AI टेक्स्ट हटाया (नॉन-डायग्नोस्टिक गारंटी)।',
  insAiEmpty: 'अभी कोई AI अवलोकन नहीं — बनाने के लिए रीफ्रेश दबाएँ।',
  insAiCachedNote: 'डेटा बदलने पर ही एक बार बनता है और कैश होता है — हर क्लिक पर कभी नहीं।',

  parentTitle: 'अभिभावक व्यू',
  parentIntro:
    'न्याय नगरी में आपके बच्चे की सीखने की यात्रा की सरल तस्वीर — वह गेम जो बच्चों को उनके कानूनी अधिकार सिखाता है।',
  parentJourney: (done: number, total: number) => `${total} में से ${done} ज़ोन खोजे`,
  parentWhatItMeans: 'इसका मतलब क्या है?',
  parentWhatItMeansBody:
    'ये संख्याएँ सिर्फ़ यह बताती हैं कि आपका बच्चा गेम के अंदर कैसे खेलता और जवाब देता है। ये सीखने के पैटर्न दिखाती हैं — बुद्धिमत्ता, ध्यान या किसी चिकित्सीय/मनोवैज्ञानिक स्थिति को कभी नहीं मापतीं।',
  parentTalkTitle: 'बच्चे से पूछने लायक एक प्यारा सवाल',
  parentTalkBody:
    '"तुम्हें कौन-सा ज़ोन सबसे अच्छा लगा, और किसी दोस्त को उस अधिकार की ज़रूरत हो तो तुम क्या करोगे?" — इस पर बात करने से सीख दोगुनी हो जाती है।',

  reportTitle: 'लर्निंग और डेवलपमेंट रिपोर्ट',
  reportPrint: 'प्रिंट / PDF सेव करें',
  reportGeneratedOn: (when: string) => `${when} को बनाई गई`,
  reportS1: 'विद्यार्थी परिचय',
  reportS2: 'सीखने का सार',
  reportS3: 'ज़ोन प्रगति',
  reportS4: 'सवालों का प्रदर्शन',
  reportS5: 'विषयवार प्रदर्शन',
  reportS6: 'मज़बूत पक्ष',
  reportS7: 'अभ्यास के क्षेत्र',
  reportS8: 'सुधार की टाइमलाइन',
  reportS9: 'जुड़ाव का सार',
  reportS10: 'सुझाई गई गतिविधियाँ',
  reportS11: 'बैज',
  reportS12: 'प्रमाणपत्र',
  reportS13: 'AI-जनित लर्निंग इनसाइट्स',
  reportS14: 'अस्वीकरण',
  reportQpBaseline: 'बेसलाइन क्विज़ सटीकता (सीखने से पहले)',
  reportQpCheckpoint: 'चेकपॉइंट क्विज़ सटीकता (सीखने के बाद)',
  reportQpRecap: 'अडैप्टिव रीकैप सटीकता',
  reportQpAvgTime: 'औसत जवाब समय',
  reportSeconds: (secs: number) => `${secs} सेकंड`,
  reportObservedTag: 'देखा गया गेम व्यवहार',
  reportDevRefTag: 'विकास संबंधी संदर्भ',
  reportDevRefBody:
    'बच्चे कैसे बढ़ते और सीखते हैं, इस पर पृष्ठभूमि पठन (सिर्फ़ बड़ों के संदर्भ के लिए — इस बच्चे के आकलन के लिए कभी नहीं): Verywell Mind, "Child Psychology and Development"।',
  reportSourcesTitle: 'स्रोत और सत्यापन',
  reportSourceLegalIntro:
    'गेम का हर कानूनी विषय भारत सरकार के आधिकारिक कानून भंडार India Code (indiacode.nic.in) पर प्रकाशित कानूनों से जुड़ता है:',
  reportLegalUnverified: 'कानूनी स्रोत सत्यापित नहीं हो सका',
  reportColAct: 'कानूनी आधार (India Code)',
  reportNoBadges: 'अभी कोई बैज नहीं मिला।',
  reportNoCertificates: 'अभी कोई प्रमाणपत्र नहीं मिला।',
  insDisclaimer:
    'ये जानकारियाँ केवल गेम-आधारित सीखने के पैटर्न बताती हैं। यह कोई मनोवैज्ञानिक, चिकित्सीय या नैदानिक आकलन नहीं है, और यह किसी बच्चे की मानसिक या चिकित्सा स्थिति तय नहीं कर सकती। बच्चे के विकास या भलाई से जुड़ी किसी भी चिंता के लिए कृपया योग्य विशेषज्ञ से बात करें।',

  getHelpNow: 'अभी मदद लो',
  emergencyHelp: 'आपातकालीन मदद',
  childline: 'चाइल्डलाइन',
  cyberCrime: 'साइबर क्राइम',
  available247: 'हर दिन, हर समय उपलब्ध। कॉल करना सुरक्षित और मुफ़्त है।',
  close: 'बंद करो',

  helpHubSubtitle: 'मदद चाहिए? हम सही मदद ढूंढने में साथ देंगे।',
  realEmergency: 'सच में इमरजेंसी?',
  emergencyQuestion: 'कोई बहुत चोटिल है, बेहोश है, या साँस नहीं ले पा रहा?',
  call112: '112 पर कॉल करो',
  isThisEmergency: 'क्या यह सच में इमरजेंसी है?',
  yesCall112: 'हाँ, 112 पर कॉल करो',
  emergencySafetyNote: 'गंभीर या जान के खतरे वाली हालत में तुरंत इमरजेंसी सेवा को कॉल करो।',
  findHelpNearMe: 'आस-पास मदद ढूंढो',
  findHelpIntro: 'लोकेशन की इजाज़त दो ताकि Google Maps पर आस-पास के अस्पताल और मेडिकल मदद ढूंढ सको।',
  allowLocation: 'मेरी लोकेशन इस्तेमाल करो',
  locationPrivacyNote: 'तुम्हारी लोकेशन इसी डिवाइस पर रहती है — सिर्फ़ उस Google Maps लिंक में जाती है जो तुम खोलते हो। कभी सेव नहीं होती।',
  findingLocation: 'तुम्हारी लोकेशन ढूंढ रहे हैं...',
  locationFound: 'लोकेशन मिल गई',
  locationReady: 'तुम्हारी लोकेशन तैयार है। आस-पास की मेडिकल मदद ढूंढो।',
  chooseHelpType: 'बताओ, किस तरह की मदद चाहिए।',
  findHospitals: 'आस-पास के अस्पताल ढूंढो',
  findMedicalCare: 'मेडिकल देखभाल ढूंढो',
  findChildCare: 'बच्चों का अस्पताल ढूंढो',
  emergencySearchLabel: 'इमरजेंसी मदद',
  allowLocationAgain: 'लोकेशन फिर से चालू करो',
  locationDenied: 'आस-पास मदद ढूंढने के लिए लोकेशन की इजाज़त चाहिए।',
  locationSettingsHint: 'ब्राउज़र या फ़ोन की सेटिंग में लोकेशन फिर से चालू करो, फिर "लोकेशन फिर से चालू करो" दबाओ।',
  locationTimeout: 'लोकेशन मिलने में बहुत देर लग रही है।',
  locationUnavailable: 'तुम्हारी लोकेशन पता नहीं चल पाई।',
  locationUnsupported: 'तुम्हारा डिवाइस या ब्राउज़र लोकेशन नहीं बता सकता।',
  openMaps: 'Google Maps खोलो',
  emergencyAssistNote: 'तुरंत इमरजेंसी मदद के लिए',
  needAdult: 'किसी बड़े की ज़रूरत है?',
  needAdultNote: 'मम्मी-पापा, टीचर या किसी भरोसेमंद बड़े से मदद माँगो।',
  shareHelpInfo: 'मदद की जानकारी भेजो',
  shareCopied: 'कॉपी हो गया! किसी बड़े को दिखाओ।',
  moreHelp: 'ऑनलाइन रिपोर्ट करो',

  guideIntro:
    'नमस्ते! मैं Nyaya AI हूँ 👋 अपने अधिकारों या न्याय नगरी में जो सीख रहे हो, उसके बारे में कुछ भी पूछो। मैं एक कंप्यूटर हेल्पर हूँ, असली इंसान या वकील नहीं — और अपना असली नाम, स्कूल या फ़ोन नंबर जैसी निजी बातें मत बताना।',
  yourGuide: 'Nyaya AI',
  aiCompanion: 'तुम्हारा अधिकार गाइड',
  thinking: 'सोच रहा हूँ...',
  askAnything: 'अपना सवाल लिखो...',
  guideResting: 'Nyaya AI थोड़ा आराम कर रहा है। थोड़ी देर में फिर कोशिश करो।',
  toggleVoice: 'आवाज़ चालू/बंद करो',
  openGuide: 'Nyaya AI खोलो',
  closeChat: 'चैट बंद करो',
  zoneWelcomeFallback: (zoneName, theme) =>
    `${zoneName} में स्वागत है! यहाँ हम सीखेंगे: ${theme}।`,

  nyayaAiDisclaimer:
    'यह AI शिक्षा के लिए कानूनी जानकारी देता है, पेशेवर कानूनी सलाह नहीं।',
  nyayaAiSuggestedTitle: 'ये पूछकर देखो:',
  nyayaAiSuggested: [
    'मेरे क्या अधिकार हैं?',
    'यह ज़ोन समझाओ',
    'ऑनलाइन मुझे क्या करना चाहिए?',
    'यह ज़रूरी क्यों है?',
    'आसान शब्दों में समझाओ',
  ],
  nyayaAiNotConfigured: 'Nyaya AI अभी तैयार नहीं है — थोड़ी देर बाद कोशिश करो।',
  nyayaAiMicDenied:
    'माइक्रोफ़ोन की अनुमति बंद है, इसलिए मैं सुन नहीं पा रहा। ब्राउज़र में माइक की अनुमति दो, या बस अपना सवाल टाइप करो।',

  nyayaAiTapToTalk: 'बोलने के लिए टैप करो',
  nyayaAiListening: 'सुन रहा हूँ... बोलो',
  nyayaAiThinking: 'सोच रहा हूँ...',
  nyayaAiSpeaking: 'Nyaya AI बोल रहा है...',
  nyayaAiConnecting: 'जुड़ रहा हूँ...',
  nyayaAiMicHint: 'माइक्रोफ़ोन पर टैप करो और मुझसे बात करो।',
  nyayaAiRetry: 'फिर से कोशिश करो',
  nyayaAiVoiceStop: 'वॉइस चैट बंद करो',
  nyayaAiVoiceUnavailable:
    'वॉइस चैट अभी थोड़ी देर के लिए उपलब्ध नहीं है। तुम Nyaya AI से टाइप करके बात कर सकते हो।',
  nyayaAiVoiceConnectFail:
    'वॉइस चैट अभी शुरू नहीं हो पाई। फिर कोशिश करो, या बस अपना सवाल टाइप करो।',
  nyayaAiMicDeniedVoice:
    'माइक्रोफ़ोन की अनुमति बंद है, इसलिए मैं तुम्हें सुन नहीं पा रहा। ब्राउज़र में माइक की अनुमति दो, या बस अपना सवाल टाइप करो — मैं यहीं हूँ!',

  personaDisclaimer: (role) => `यह सिर्फ़ एक रोल-प्ले है, असली ${role} नहीं।`,
  personaRolePolice: 'पुलिस अफ़सर',
  personaRoleLawyer: 'वकील',
  personaRoleTeacher: 'टीचर',
  personaRoleJudge: 'जज',
  personaRoleParent: 'माता-पिता या अभिभावक',
  personaNamePolice: 'ऑफ़िसर कविता',
  personaNameLawyer: 'एडवोकेट अर्जुन',
  personaNameTeacher: 'सुनीता मैम',
  personaNameJudge: 'जज मीरा',
  personaNameParent: 'निशा आंटी',
  personaIntroLine: (name) =>
    `तुम ${name} से सवाल पूछ सकते हो। नीचे दिया कोई सवाल चुनो, या अपना छोटा सवाल लिखो।`,
  personaInputPlaceholder: 'छोटा सवाल लिखो...',
  personaSend: 'पूछो',
  personaUnavailable: 'यह किरदार थोड़ा आराम कर रहा है — थोड़ी देर में फिर कोशिश करो।',

  settingsTitle: 'सेटिंग्स',
  languageLabel: 'भाषा',
  languageEnglish: 'English',
  languageHindi: 'हिंदी',
  narrationLabel: 'आवाज़ में सुनाना',
  narrationHint: 'कहानियाँ और विकल्प आवाज़ में पढ़कर सुनाता है। क्विज़ में आवाज़ नहीं आती।',
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
  howItWorksCards: [
    {
      title: 'शहर की सैर करो',
      body: 'शहर में घूमो और 7 ज़ोन देखो — हर ज़ोन तुम्हारी रक्षा करने वाले अधिकारों के बारे में है।',
    },
    {
      title: 'खेलो, चुनो और जीतो',
      body: 'कहानी वाले क्वेस्ट खेलो, अपने फ़ैसले खुद लो, और मज़ेदार क्विज़ से बैज जीतो।',
    },
    {
      title: 'कुछ भी पूछो',
      body: 'तुम्हारा दोस्ताना गाइड कभी भी सवालों के जवाब दे सकता है।',
    },
    {
      title: 'कभी भी मदद लो',
      body: 'लाल "अभी मदद लो" बटन हमेशा स्क्रीन पर रहता है — इसमें चाइल्डलाइन 1098 जैसी असली हेल्पलाइन हैं।',
    },
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
  characterLabel: 'आपका हीरो',
  characterNames: ['लड़का', 'लड़की'],
  buildAvatarHint: 'चुनो कि न्याय नगरी में तुम कैसे दिखोगे — सिर्फ़ कार्टून लुक।',
  baseLookLabel: 'चेहरा',
  baseLookNames: ['हँसमुख', 'बहादुर'],
  skinToneLabel: 'त्वचा का रंग',
  hairLabel: 'बाल',
  hairStyleNames: ['छोटे', 'घुँघराले', 'चोटियाँ', 'जूड़ा', 'पोनीटेल'],
  outfitLabel: 'कपड़े',
  outfitNames: ['कुर्ता', 'टी-शर्ट', 'कमीज़', 'हुडी', 'कुर्ती', 'फ्रॉक'],
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
  avatarLiveNote: 'तुम जो भी बदलोगे, वह तुम्हारे हीरो पर तुरंत दिखेगा।',
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
    zone0_pathfinder: 'अधिकार राही',
    zone1_guardian: 'सेफ़ ज़ोन रक्षक',
    zone2_champion: 'बचपन चैंपियन',
    zone3_scholar: 'स्कूल अधिकार ज्ञानी',
    zone4_explorer: 'न्याय खोजी',
    zone5_defender: 'डिजिटल रक्षक',
    zone6_shield_bearer: 'ढाल वीर',
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

  homeTagline: 'अपने अधिकार जानो। अपना भविष्य बनाओ।',
  homeEnterCta: 'चलो',
  homeCentralBanner: 'अपने अधिकार जानो',
  homeLoading: 'लोड हो रहा है…',
  homeAbout: 'परिचय',
  homeAboutTitle: 'न्याय नगरी के बारे में',
  homeAboutBody: [
    'न्याय नगरी एक सीखने का शहर है जहाँ 8-18 साल के बच्चे कहानियों, क्वेस्ट और खेलों के ज़रिए वे अधिकार सीखते हैं जो उनकी रक्षा करते हैं — हिंदी और अंग्रेज़ी में।',
    'यह जागरूकता और हिम्मत बढ़ाने का साधन है — कानूनी सलाह या आपातकालीन सेवा नहीं। असली मदद के लिए लाल "अभी मदद लो" बटन हमेशा चाइल्डलाइन 1098 और साइबर क्राइम 155260 दिखाता है।',
    'तुम्हारा सब कुछ इसी डिवाइस पर रहता है: कोई खाता नहीं, कोई फ़ोटो नहीं, कोई असली नाम नहीं, कोई निजी जानकारी नहीं।',
  ],

  storyAdventure: 'कहानी का सफ़र',
  storyEnterCta: 'E दबाओ या टैप करके शुरू करो',
  storyTryAgain: 'फिर से कोशिश करो',
  storyContinueExploring: 'घूमना जारी रखो',
  storyRewardUnlocked: (rewardName) => `${rewardName} अनलॉक हुआ!`,
  storySlideOf: (current, total) => `${current} / ${total}`,
  storyAdventuresHeading: 'कहानी के सफ़र',
  storyLockedHint: (previousTitle) => `इसे खोलने के लिए पहले "${previousTitle}" पूरी करो।`,
  storyExit: 'कहानी से बाहर जाओ',
  storyMapSubtitle: 'हर लेवल एक नया अधिकार सिखाता है।',
  storyMapComingSoon: 'नए एडवेंचर जल्द आ रहे हैं…',
  storyMapComingSoonLead: 'नए एडवेंचर',
  storyMapComingSoonTail: 'जल्द आ रहे हैं…',
  storyMapPlayCta: 'शुरू करो',
  storyMapReplayCta: 'दोबारा खेलो',
  storyMapNewAdventure: 'नया एडवेंचर अनलॉक हुआ!',
  storyMapAllDone: 'सारी कहानियाँ पूरी!',
  gamePlayFirst: 'पहले गेम खेलो, फिर आगे बढ़ो',
  gameCompletedTag: 'गेम पूरा हो गया',
  storyUnlockedHeading: 'नई कहानी अनलॉक हो गई!',
  openStoryAdventure: 'स्टोरी एडवेंचर खोलो',
  storyMapContinueCta: 'एडवेंचर जारी रखो',
  storyMapPlayLevelCta: (n) => `लेवल ${n} खेलो`,
  storyMapLevelsDone: (done, total) => `${done} / ${total} पूरे`,
  storyMapLockedToast: 'पहले पिछला एडवेंचर पूरा करो!',
  storyVoiceOptionOne: 'पहला विकल्प:',
  storyVoiceOptionTwo: 'दूसरा विकल्प:',
  storyVoiceOptionThree: 'तीसरा विकल्प:',
  storyVoiceOptionFour: 'चौथा विकल्प:',
  storyVoiceCorrectLead: 'बहुत बढ़िया!',
  storyVoiceNextCta: 'अब "आगे" पर टैप करके कहानी जारी रखो।',
  storyVoiceTryAgainCta: '"फिर से कोशिश करो" पर टैप करके दोबारा जवाब चुनो।',
  storyVoiceYourTurn: 'अब तुम्हारी बारी है।',
  storyVoiceRetry: 'आवाज़ लोड नहीं हो पाई। दोबारा सुनने के लिए टैप करें।',
  storyVoicePreparing: 'आवाज़ तैयार हो रही है…',
  storyVoiceOn: 'आवाज़ गाइड चालू करो',
  storyVoiceOff: 'आवाज़ गाइड बंद करो',
  storyVoiceReplay: 'फिर से सुनो',
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
