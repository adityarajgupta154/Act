/**
 * Story Adventure voice — manifest generator.
 *
 * Run after ANY change to story data, voice chrome strings or reminders:
 *   pnpm exec tsx scripts/generate-story-voice-manifest.ts
 *
 * Enumerates every line the Story Adventure voice can ever say (the
 * shared catalog in src/story/storyVoiceSegments.ts) and writes it as a
 * GENERATED TypeScript module into the api-server, where the TTS route
 * uses it as a hard allowlist: the server only synthesizes ids found in
 * this manifest, never free text from a request (PRD §9.8 — fixed
 * content only; a TTS proxy for arbitrary text would be an abuse hole).
 *
 * Safety gate at generation time too: refuses to emit ANY spoken line
 * containing digits (Latin or Devanagari) — helpline digits belong to the
 * Get Help screen alone, never to narration (PRD §9).
 *
 * The story smoke asserts the checked-in manifest matches a fresh
 * enumeration exactly, so drift between game data and server allowlist
 * fails CI-style instead of failing children.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { enumerateAllStorySegments, segmentLanguage } from '../src/story/storyVoiceSegments';

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, '../../api-server/src/routes/storyvoice/story-voice-manifest.ts');

const segments = enumerateAllStorySegments()
  .map((s) => ({ id: s.id, lang: segmentLanguage(s.id), text: s.text }))
  .sort((a, b) => a.id.localeCompare(b.id));

// PLAY-order level list (enumeration order = STORY_LEVELS order) — captured
// separately because the alphabetical sort above destroys it. The TTS
// route's prewarm uses this to fill early levels first under scarce quota.
const levelOrder: string[] = [];
for (const s of enumerateAllStorySegments()) {
  const head = s.id.split('/')[0];
  if (head !== 'chrome' && !levelOrder.includes(head)) levelOrder.push(head);
}

const seenIds = new Set<string>();
for (const s of segments) {
  // Ids are the allowlist AND the in-flight dedupe key server-side — a
  // duplicate would silently map two texts onto one entry.
  if (seenIds.has(s.id)) throw new Error(`duplicate segment id: ${s.id}`);
  seenIds.add(s.id);
  if (/[0-9\u0966-\u096F]/.test(s.text)) {
    throw new Error(`digit in spoken line (helpline-digit safety, PRD §9): ${s.id}: ${s.text}`);
  }
  if (!s.text.trim()) throw new Error(`empty spoken line: ${s.id}`);
}

const body = `/**
 * GENERATED — do not edit by hand.
 *
 * Source of truth: artifacts/nyaya-nagri/src/story/storyVoiceSegments.ts
 * Regenerate:      pnpm exec tsx scripts/generate-story-voice-manifest.ts
 *                  (from artifacts/nyaya-nagri)
 *
 * This is the Story Adventure TTS route's ALLOWLIST: every line the story
 * voice can ever speak, as fixed hand-written content (PRD §9.8). The
 * route refuses any id not present here — clients can never make the
 * server synthesize free text. No line contains digits (PRD §9: helpline
 * digits live only in Get Help).
 */
export type StoryVoiceManifestEntry = {
  id: string;
  lang: 'en' | 'hi';
  text: string;
};

export const STORY_VOICE_MANIFEST: readonly StoryVoiceManifestEntry[] = ${JSON.stringify(
  segments,
  null,
  2,
)} as const;

/**
 * Story level ids in PLAY order (the STORY_LEVELS sequence) — consumed by
 * the TTS route's prewarm so scarce quota fills early levels first. The
 * allowlist array above is alphabetically sorted, so it cannot express
 * play order itself. (Deliberately a plain readonly array WITHOUT an
 * as-const terminator: the story smoke's drift guard extracts the
 * manifest array by scanning this file for the first array-assignment
 * marker and the last as-const terminator, so nothing after the manifest
 * may repeat either byte sequence — not even inside a comment.)
 */
export const STORY_LEVEL_ORDER: readonly string[] = ${JSON.stringify(levelOrder)};
`;

writeFileSync(target, body);
console.log(`story-voice manifest: ${segments.length} segments -> ${target}`);
