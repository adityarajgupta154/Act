/**
 * Nyaya Nagri — Quest schema (Task 3)
 *
 * JSON-based quest format that every zone's content plugs into from Task 4
 * onward. Per PRD §9.8 all quest content (narration, choice correctness,
 * quiz questions, explanations) is static, hard-coded data — never
 * AI-generated at runtime.
 */

import type { AgeBand } from '@/data/progressStore';

export type ChoiceOutcome = 'correct' | 'incorrect' | 'neutral';

export interface QuestChoice {
  text: string;
  outcome: ChoiceOutcome;
  /** Short, empowering explanation shown right after the choice. */
  feedback: string;
  /** Scene to go to next; omit (or point nowhere) to finish the scenes. */
  nextScene?: string;
}

/**
 * Task 17 (PRD §7.4): role-play persona ids. Must match the server's
 * persona configs — the server owns every prompt and guardrail; the
 * client only ever sends the id.
 */
export const PERSONA_IDS = ['police', 'lawyer', 'teacher', 'judge', 'parent'] as const;
export type PersonaId = (typeof PERSONA_IDS)[number];

/**
 * Task 17: optional in-scene persona interview. Purely a side conversation
 * — it never affects scene branching, choices, scoring, or progression
 * (finalizeLevel stays the only progression write path). The chips are
 * static, hand-written suggested questions (PRD §9.8); free-text goes
 * through the same server guardrails.
 */
export interface ScenePersona {
  personaId: PersonaId;
  /** 3-4 static suggested questions (the safe default input). */
  chips: string[];
}

export interface QuestScene {
  sceneId: string;
  narration: string;
  /**
   * Optional process-map label (Task 7, Zone 4 "Justice System Simulator").
   * When present, the player renders it as a stage chip above the narration,
   * e.g. "Step 2 of 5: The First 24 Hours" — used for flowchart-style
   * walkthrough quests. Purely presentational; static content per PRD §9.8.
   */
  stageLabel?: string;
  /**
   * Task 17: optional role-play persona the child can interview in this
   * scene (12-15 and 16-18 bands only — validateQuest rejects personas in
   * 8-11 quests). Always rendered with a "this is a role-play" disclaimer.
   */
  persona?: ScenePersona;
  choices: QuestChoice[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/**
 * Task 15: kinds of levels inside a zone. 'story' and 'decision' levels
 * group existing scenes; the single 'quiz' level is the checkpoint that
 * completes the zone (post-quiz + adaptive recap).
 *
 * Task 18 (PRD §7.4 mini-game variety pack): ACTIVITY kinds join the
 * union — 'memory' (flip-and-match), 'hidden' (hidden-object scene, 8-11
 * band ONLY), 'sorting' (sort scenario cards into buckets), and 'scenario'
 * (single-screen one-decision). Task 20 adds 'authorities' — the Zone 6
 * "Meet the Authorities" tap-through hub of child-protection bodies
 * (PRD §4.2 CPCR Act row + §4.3 directory). The task brief calls this field
 * "levelType"; Task 15 already named the discriminator `kind`, so the new
 * types extend `kind` rather than adding a second, duplicate field.
 * Activity content is static, hand-written data reformatted from the
 * Tasks 4-8 zone corpora — never new legal claims, never AI-generated
 * (PRD §9.8).
 */
export type LevelKind =
  | 'story'
  | 'decision'
  | 'quiz'
  | 'memory'
  | 'hidden'
  | 'sorting'
  | 'scenario'
  | 'authorities';

export const ACTIVITY_LEVEL_KINDS = [
  'memory',
  'hidden',
  'sorting',
  'scenario',
  'authorities',
] as const;
export type ActivityLevelKind = (typeof ACTIVITY_LEVEL_KINDS)[number];

export function isActivityKind(kind: LevelKind): kind is ActivityLevelKind {
  return (ACTIVITY_LEVEL_KINDS as readonly string[]).includes(kind);
}

/** One flip-and-match pair: a right/law name and its short meaning. */
export interface MemoryPair {
  term: string;
  match: string;
}

export interface MemoryLevelContent {
  intro: string;
  /** 4-6 pairs, all reformatted from the quest's existing content. */
  pairs: MemoryPair[];
}

/**
 * Hidden-object scenes are hand-drawn SVG components keyed by sceneKey —
 * static art in the established style, validated against this list so
 * content can never reference a scene that does not exist.
 */
export const HIDDEN_SCENE_KEYS = ['market_street'] as const;
export type HiddenSceneKey = (typeof HIDDEN_SCENE_KEYS)[number];

/**
 * A tappable "something is not right here" cue. Coordinates are percent
 * positions (0-100 of scene width/height) with a percent radius — geometry
 * is language-independent and checked by translation parity.
 */
export interface HiddenObjectCue {
  cueId: string;
  label: string;
  explanation: string;
  x: number;
  y: number;
  r: number;
}

export interface HiddenObjectLevelContent {
  intro: string;
  sceneKey: HiddenSceneKey;
  /** 3-4 gentle, non-graphic cues (Task 4 trauma-sensitivity rules). */
  cues: HiddenObjectCue[];
}

/**
 * Sorting buckets are FIXED ids. Their display labels (including the
 * canonical "Emergency — Call Childline 1098" wording) are hard-coded in
 * the i18n bundles, NOT in content JSON — helpline text stays hard-coded
 * exactly like everywhere else in the app (PRD §9.8).
 */
export const SORT_BUCKET_IDS = ['safe', 'tell', 'emergency'] as const;
export type SortBucketId = (typeof SORT_BUCKET_IDS)[number];

export interface SortingCard {
  text: string;
  bucket: SortBucketId;
  feedback: string;
}

export interface SortingLevelContent {
  intro: string;
  /** 5-8 cards; every bucket must be used at least once. */
  cards: SortingCard[];
}

export interface ScenarioOption {
  text: string;
  outcome: ChoiceOutcome;
  feedback: string;
}

/** Single-screen, one-decision version of the branching format. */
export interface ScenarioLevelContent {
  prompt: string;
  /** 2-4 options with exactly one correct answer; immediate feedback. */
  options: ScenarioOption[];
}

/**
 * Task 20: one tappable card in the "Meet the Authorities" hub (Zone 6).
 * `authorityId` is a language-independent stable id (checked by translation
 * parity); `name` uses the app-wide convention of full name + acronym on
 * first mention, e.g. "Child Welfare Committee (CWC)"; `role` is the
 * one-line explainer of what this body does for children.
 */
export interface AuthorityCard {
  authorityId: string;
  name: string;
  role: string;
}

/**
 * Tap-through hub of real child-protection bodies (PRD §4.2 CPCR Act row,
 * §4.3 directory). Completion-based by gentle design — viewing every card
 * completes the level. The "Childline 1098 first" reminder line is
 * hard-coded in the i18n bundles, NOT in content JSON — helpline text stays
 * hard-coded exactly like everywhere else (PRD §9.8), mirroring how the
 * sorting buckets keep their canonical labels out of content.
 */
export interface AuthoritiesLevelContent {
  intro: string;
  /** 4-6 cards, one per authority/body. */
  authorities: AuthorityCard[];
}

export interface QuestLevel {
  levelId: string;
  kind: LevelKind;
  /** Scenes belonging to this level (story/decision kinds only). */
  sceneIds?: string[];
  /** Scene the level starts at (story/decision kinds only). */
  entryScene?: string;
  /** Task 18/20 activity payloads — exactly the one matching `kind`. */
  memory?: MemoryLevelContent;
  hidden?: HiddenObjectLevelContent;
  sorting?: SortingLevelContent;
  scenario?: ScenarioLevelContent;
  authorities?: AuthoritiesLevelContent;
}

export interface Quest {
  questId: string;
  /** Which zone this quest belongs to (zone0..zone6). */
  zoneId: string;
  ageBand: AgeBand;
  /**
   * Content language (Task 10). Omitted in the original English files
   * (defaults to 'en'); Hindi translations set 'hi'. Same questId across
   * languages — progress is language-independent.
   */
  language?: 'en' | 'hi';
  title: string;
  scenes: QuestScene[];
  /** 3-5 questions; used for BOTH the silent pre-quiz and the scored post-quiz. */
  quizQuestions: QuizQuestion[];
  /**
   * Task 15: ordered levels inside the zone. Structural metadata ONLY —
   * levels group the scenes written in Tasks 4-8; they never change
   * narration, choice correctness, or quiz content (PRD §9.8).
   */
  levels: QuestLevel[];
}

/**
 * Runtime sanity check for quest content files. Throws with a descriptive
 * message so content mistakes surface immediately in development.
 */
export function validateQuest(q: Quest): Quest {
  if (!q.questId || !q.zoneId || !q.title) {
    throw new Error(`Quest ${q.questId ?? '?'}: missing questId/zoneId/title`);
  }
  if (!q.scenes.length) throw new Error(`Quest ${q.questId}: no scenes`);
  if (q.quizQuestions.length < 3 || q.quizQuestions.length > 5) {
    throw new Error(`Quest ${q.questId}: quiz must have 3-5 questions`);
  }
  const sceneIds = new Set(q.scenes.map((s) => s.sceneId));
  if (sceneIds.size !== q.scenes.length) {
    throw new Error(`Quest ${q.questId}: duplicate sceneIds`);
  }
  for (const scene of q.scenes) {
    if (!scene.choices.length) {
      throw new Error(`Quest ${q.questId}/${scene.sceneId}: no choices`);
    }
    for (const c of scene.choices) {
      if (c.nextScene && !sceneIds.has(c.nextScene)) {
        throw new Error(
          `Quest ${q.questId}/${scene.sceneId}: nextScene "${c.nextScene}" does not exist`,
        );
      }
    }
    // Task 17: persona interviews are hard-restricted to the older bands —
    // the 8-11 flowchart experience never gets personas (PRD §7.4).
    if (scene.persona) {
      if (q.ageBand === '8-11') {
        throw new Error(
          `Quest ${q.questId}/${scene.sceneId}: personas are not allowed in 8-11 quests`,
        );
      }
      if (!(PERSONA_IDS as readonly string[]).includes(scene.persona.personaId)) {
        throw new Error(
          `Quest ${q.questId}/${scene.sceneId}: unknown personaId "${scene.persona.personaId}"`,
        );
      }
      const chips = scene.persona.chips;
      if (!Array.isArray(chips) || chips.length < 3 || chips.length > 4) {
        throw new Error(
          `Quest ${q.questId}/${scene.sceneId}: persona chips must be 3-4 suggested questions`,
        );
      }
      if (chips.some((c) => typeof c !== 'string' || !c.trim())) {
        throw new Error(`Quest ${q.questId}/${scene.sceneId}: empty persona chip`);
      }
    }
  }
  for (const [i, qq] of q.quizQuestions.entries()) {
    if (qq.correctIndex < 0 || qq.correctIndex >= qq.options.length) {
      throw new Error(`Quest ${q.questId}: quiz #${i} correctIndex out of range`);
    }
  }
  validateLevels(q);
  return q;
}

const NONEMPTY = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

/**
 * Task 18: validate an activity level's content payload. Exactly the
 * payload matching `kind` must be present; scene fields must be absent.
 */
function validateActivityLevel(q: Quest, level: QuestLevel): void {
  const ctx = `Quest ${q.questId} levels/${level.levelId}`;
  if (level.sceneIds || level.entryScene) {
    throw new Error(`${ctx}: activity levels must not carry sceneIds/entryScene`);
  }
  const payloads = {
    memory: level.memory,
    hidden: level.hidden,
    sorting: level.sorting,
    scenario: level.scenario,
    authorities: level.authorities,
  } as const;
  for (const [key, value] of Object.entries(payloads)) {
    if (key === level.kind) {
      if (!value) throw new Error(`${ctx}: missing "${key}" content for kind "${level.kind}"`);
    } else if (value) {
      throw new Error(`${ctx}: unexpected "${key}" content on a "${level.kind}" level`);
    }
  }

  if (level.kind === 'memory') {
    const m = level.memory!;
    if (!NONEMPTY(m.intro)) throw new Error(`${ctx}: memory intro missing`);
    if (!Array.isArray(m.pairs) || m.pairs.length < 4 || m.pairs.length > 6) {
      throw new Error(`${ctx}: memory needs 4-6 pairs`);
    }
    if (m.pairs.some((p) => !NONEMPTY(p.term) || !NONEMPTY(p.match))) {
      throw new Error(`${ctx}: memory pair with empty term/match`);
    }
    if (new Set(m.pairs.map((p) => p.term)).size !== m.pairs.length) {
      throw new Error(`${ctx}: duplicate memory terms`);
    }
    if (new Set(m.pairs.map((p) => p.match)).size !== m.pairs.length) {
      throw new Error(`${ctx}: duplicate memory matches`);
    }
  }

  if (level.kind === 'hidden') {
    // PRD §7.4 / Task 18 brief: the hidden-object type exists for the 8-11
    // band ONLY — the inverse of the Task 17 persona restriction.
    if (q.ageBand !== '8-11') {
      throw new Error(`${ctx}: hidden-object levels are allowed in 8-11 quests only`);
    }
    const h = level.hidden!;
    if (!NONEMPTY(h.intro)) throw new Error(`${ctx}: hidden intro missing`);
    if (!(HIDDEN_SCENE_KEYS as readonly string[]).includes(h.sceneKey)) {
      throw new Error(`${ctx}: unknown hidden sceneKey "${h.sceneKey}"`);
    }
    if (!Array.isArray(h.cues) || h.cues.length < 3 || h.cues.length > 4) {
      throw new Error(`${ctx}: hidden needs 3-4 cues`);
    }
    if (new Set(h.cues.map((c) => c.cueId)).size !== h.cues.length) {
      throw new Error(`${ctx}: duplicate hidden cueIds`);
    }
    for (const c of h.cues) {
      if (!NONEMPTY(c.cueId) || !NONEMPTY(c.label) || !NONEMPTY(c.explanation)) {
        throw new Error(`${ctx}: hidden cue with empty id/label/explanation`);
      }
      const inRange = (n: number, lo: number, hi: number) =>
        typeof n === 'number' && Number.isFinite(n) && n >= lo && n <= hi;
      if (!inRange(c.x, 0, 100) || !inRange(c.y, 0, 100) || !inRange(c.r, 2, 20)) {
        throw new Error(`${ctx}: hidden cue "${c.cueId}" geometry out of range`);
      }
    }
  }

  if (level.kind === 'sorting') {
    const s = level.sorting!;
    if (!NONEMPTY(s.intro)) throw new Error(`${ctx}: sorting intro missing`);
    if (!Array.isArray(s.cards) || s.cards.length < 5 || s.cards.length > 8) {
      throw new Error(`${ctx}: sorting needs 5-8 cards`);
    }
    for (const card of s.cards) {
      if (!NONEMPTY(card.text) || !NONEMPTY(card.feedback)) {
        throw new Error(`${ctx}: sorting card with empty text/feedback`);
      }
      if (!(SORT_BUCKET_IDS as readonly string[]).includes(card.bucket)) {
        throw new Error(`${ctx}: sorting card with unknown bucket "${card.bucket}"`);
      }
    }
    for (const bucket of SORT_BUCKET_IDS) {
      if (!s.cards.some((c) => c.bucket === bucket)) {
        throw new Error(`${ctx}: sorting bucket "${bucket}" has no cards`);
      }
    }
  }

  if (level.kind === 'scenario') {
    const sc = level.scenario!;
    if (!NONEMPTY(sc.prompt)) throw new Error(`${ctx}: scenario prompt missing`);
    if (!Array.isArray(sc.options) || sc.options.length < 2 || sc.options.length > 4) {
      throw new Error(`${ctx}: scenario needs 2-4 options`);
    }
    if (sc.options.some((o) => !NONEMPTY(o.text) || !NONEMPTY(o.feedback))) {
      throw new Error(`${ctx}: scenario option with empty text/feedback`);
    }
    if (sc.options.filter((o) => o.outcome === 'correct').length !== 1) {
      throw new Error(`${ctx}: scenario must have exactly one correct option`);
    }
  }

  if (level.kind === 'authorities') {
    const a = level.authorities!;
    if (!NONEMPTY(a.intro)) throw new Error(`${ctx}: authorities intro missing`);
    if (!Array.isArray(a.authorities) || a.authorities.length < 4 || a.authorities.length > 6) {
      throw new Error(`${ctx}: authorities hub needs 4-6 entries`);
    }
    if (new Set(a.authorities.map((c) => c.authorityId)).size !== a.authorities.length) {
      throw new Error(`${ctx}: duplicate authorityIds`);
    }
    for (const card of a.authorities) {
      if (!NONEMPTY(card.authorityId) || !NONEMPTY(card.name) || !NONEMPTY(card.role)) {
        throw new Error(`${ctx}: authority card with empty id/name/role`);
      }
    }
  }
}

/**
 * Task 15: prove the levels are a SAFE regrouping of the existing scenes —
 * they must partition every scene exactly once, start where the quest
 * starts, and never allow a path to jump backwards or skip a level. This
 * guarantees playing the levels in order shows the exact same content, in
 * the exact same order, as the original single-quest flow.
 *
 * Task 18: activity levels (memory/hidden/sorting/scenario) are additive —
 * they carry their own static content, consume NO scenes, and are ignored
 * by the scene-partition rules below. The quiz stays the single, final
 * checkpoint, and level 1 stays a story level so the silent pre-quiz
 * baseline is still measured before any content is seen.
 */
export function validateLevels(q: Quest): void {
  const ctx = `Quest ${q.questId} levels`;
  if (!Array.isArray(q.levels) || q.levels.length < 3 || q.levels.length > 5) {
    throw new Error(`${ctx}: must have 3-5 levels`);
  }
  const last = q.levels[q.levels.length - 1];
  if (last.kind !== 'quiz' || q.levels.filter((l) => l.kind === 'quiz').length !== 1) {
    throw new Error(`${ctx}: exactly one quiz level, and it must be last`);
  }
  const ids = new Set(q.levels.map((l) => l.levelId));
  if (ids.size !== q.levels.length) throw new Error(`${ctx}: duplicate levelIds`);
  if (q.levels[0].kind !== 'story') {
    throw new Error(`${ctx}: level 1 must be a story level (pre-quiz baseline first)`);
  }

  for (const level of q.levels) {
    if (isActivityKind(level.kind)) {
      validateActivityLevel(q, level);
    } else if (level.memory || level.hidden || level.sorting || level.scenario || level.authorities) {
      throw new Error(`${ctx}/${level.levelId}: activity content on a "${level.kind}" level`);
    }
  }

  const sceneLevels = q.levels.filter((l) => l.kind === 'story' || l.kind === 'decision');
  const questSceneIds = new Set(q.scenes.map((s) => s.sceneId));
  const seen = new Set<string>();
  for (const level of sceneLevels) {
    if (!level.sceneIds?.length || !level.entryScene) {
      throw new Error(`${ctx}/${level.levelId}: scene level needs sceneIds + entryScene`);
    }
    if (!level.sceneIds.includes(level.entryScene)) {
      throw new Error(`${ctx}/${level.levelId}: entryScene not in its own sceneIds`);
    }
    for (const id of level.sceneIds) {
      // Membership check: a declared id that does not exist in the quest
      // could otherwise mask an omitted real scene while passing the
      // size check below — the partition must be an EXACT set match.
      if (!questSceneIds.has(id)) {
        throw new Error(`${ctx}/${level.levelId}: scene "${id}" does not exist in the quest`);
      }
      if (seen.has(id)) throw new Error(`${ctx}: scene "${id}" in more than one level`);
      seen.add(id);
    }
  }
  if (seen.size !== q.scenes.length) {
    throw new Error(`${ctx}: levels must cover every scene exactly once`);
  }
  if (sceneLevels[0].entryScene !== q.scenes[0].sceneId) {
    throw new Error(`${ctx}: level 1 must start at the quest's first scene`);
  }
  // Links may only stay inside a level or jump to the NEXT level's entry.
  sceneLevels.forEach((level, li) => {
    const inLevel = new Set(level.sceneIds);
    const nextEntry = sceneLevels[li + 1]?.entryScene ?? null;
    for (const scene of q.scenes.filter((s) => inLevel.has(s.sceneId))) {
      for (const c of scene.choices) {
        if (!c.nextScene) {
          if (li !== sceneLevels.length - 1) {
            throw new Error(
              `${ctx}/${level.levelId}/${scene.sceneId}: dead-ends before the last scene level`,
            );
          }
          continue;
        }
        if (!inLevel.has(c.nextScene) && c.nextScene !== nextEntry) {
          throw new Error(
            `${ctx}/${level.levelId}/${scene.sceneId}: link to "${c.nextScene}" escapes the level`,
          );
        }
      }
    }
  });
}

/**
 * Task 10: verify a translated quest is STRUCTURALLY identical to its
 * English source — same ids, same branching, same choice outcomes, same
 * correct answers. Only display strings may differ. This guarantees a
 * translation can never change the legal meaning of which answer is
 * correct or where a choice leads.
 */
export function validateTranslationParity(source: Quest, translated: Quest): Quest {
  const ctx = `Translation ${translated.questId} (${translated.language ?? '?'})`;
  if (translated.questId !== source.questId) {
    throw new Error(`${ctx}: questId differs from source`);
  }
  if (translated.zoneId !== source.zoneId || translated.ageBand !== source.ageBand) {
    throw new Error(`${ctx}: zoneId/ageBand differs from source`);
  }
  if (translated.scenes.length !== source.scenes.length) {
    throw new Error(`${ctx}: scene count differs`);
  }
  source.scenes.forEach((srcScene, sIdx) => {
    const trScene = translated.scenes[sIdx];
    if (trScene.sceneId !== srcScene.sceneId) {
      throw new Error(`${ctx}: scene #${sIdx} id differs (${trScene.sceneId})`);
    }
    // Task 17: persona STRUCTURE is language-independent — same persona (or
    // none) in the same scene, same number of suggested chips. Only the
    // chip text may be translated.
    if ((trScene.persona?.personaId ?? null) !== (srcScene.persona?.personaId ?? null)) {
      throw new Error(`${ctx}/${srcScene.sceneId}: persona differs from source`);
    }
    if ((trScene.persona?.chips.length ?? 0) !== (srcScene.persona?.chips.length ?? 0)) {
      throw new Error(`${ctx}/${srcScene.sceneId}: persona chip count differs`);
    }
    if (trScene.choices.length !== srcScene.choices.length) {
      throw new Error(`${ctx}/${srcScene.sceneId}: choice count differs`);
    }
    srcScene.choices.forEach((srcChoice, cIdx) => {
      const trChoice = trScene.choices[cIdx];
      if (trChoice.outcome !== srcChoice.outcome) {
        throw new Error(`${ctx}/${srcScene.sceneId}: choice #${cIdx} outcome differs`);
      }
      if ((trChoice.nextScene ?? null) !== (srcChoice.nextScene ?? null)) {
        throw new Error(`${ctx}/${srcScene.sceneId}: choice #${cIdx} nextScene differs`);
      }
    });
  });
  if (translated.quizQuestions.length !== source.quizQuestions.length) {
    throw new Error(`${ctx}: quiz question count differs`);
  }
  source.quizQuestions.forEach((srcQ, qIdx) => {
    const trQ = translated.quizQuestions[qIdx];
    if (trQ.options.length !== srcQ.options.length) {
      throw new Error(`${ctx}: quiz #${qIdx} option count differs`);
    }
    if (trQ.correctIndex !== srcQ.correctIndex) {
      throw new Error(`${ctx}: quiz #${qIdx} correctIndex differs`);
    }
  });
  // Task 15/18: level STRUCTURE must be identical across languages — same
  // levelId/kind sequence, same scene grouping, and for activity levels the
  // same shape (pair/cue/card/option counts, cue ids + geometry, card
  // buckets, option outcomes, sceneKey). Display text may be translated,
  // so this compares a text-free projection instead of raw JSON equality.
  const structure = (levels: QuestLevel[]) =>
    JSON.stringify(
      levels.map((l) => ({
        levelId: l.levelId,
        kind: l.kind,
        sceneIds: l.sceneIds ?? null,
        entryScene: l.entryScene ?? null,
        memoryPairs: l.memory ? l.memory.pairs.length : null,
        hidden: l.hidden
          ? {
              sceneKey: l.hidden.sceneKey,
              cues: l.hidden.cues.map((c) => ({ cueId: c.cueId, x: c.x, y: c.y, r: c.r })),
            }
          : null,
        sortingBuckets: l.sorting ? l.sorting.cards.map((c) => c.bucket) : null,
        scenarioOutcomes: l.scenario ? l.scenario.options.map((o) => o.outcome) : null,
        authorityIds: l.authorities ? l.authorities.authorities.map((a) => a.authorityId) : null,
      })),
    );
  if (structure(translated.levels) !== structure(source.levels)) {
    throw new Error(`${ctx}: levels structure differs from source`);
  }
  return translated;
}
