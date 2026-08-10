/**
 * Nyaya AI — deterministic passage retrieval (the "R" in the lightweight RAG).
 *
 * Plain keyword scoring, no embeddings, no network calls: transparent,
 * testable, and fast enough for a prototype. The child's message (plus the
 * current zone, when known) selects up to MAX_PASSAGES corpus entries whose
 * text is the ONLY material Gemini may state legal facts from.
 *
 * Matching rules:
 *   - Latin-script keywords match on word boundaries ("work" never matches
 *     "network"); Devanagari/Gujarati keywords match by substring (word
 *     boundaries are unreliable across Indic scripts in JS regexes).
 *   - +1 per distinct matched keyword; +2 zone-affinity bonus when the
 *     player's current zone matches the entry (ranking bonus only — an
 *     entry is never retrieved on zone affinity alone).
 */
import { CORPUS, type CorpusEntry } from "./corpus";

const MAX_PASSAGES = 3;

/** Escape a keyword for literal use inside a RegExp. */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isLatinOnly(s: string): boolean {
  return /^[a-z0-9 '&().-]+$/i.test(s);
}

export function scoreEntry(
  entry: CorpusEntry,
  normalizedMessage: string,
  currentZoneId?: string,
): number {
  let score = 0;
  for (const kw of entry.keywords) {
    const matched = isLatinOnly(kw)
      ? new RegExp(`\\b${escapeRe(kw)}\\b`, "i").test(normalizedMessage)
      : normalizedMessage.includes(kw);
    if (matched) score += 1;
  }
  // Zone affinity is a ranking bonus only — never a reason to retrieve.
  if (score > 0 && currentZoneId && entry.zoneId === currentZoneId) score += 2;
  return score;
}

/**
 * Returns up to MAX_PASSAGES corpus entries relevant to the message,
 * best-first. Empty array = no supported source (the prompt then forbids
 * specific legal claims and requires an honest "I'm not sure").
 */
export function retrievePassages(
  message: string,
  currentZoneId?: string,
): CorpusEntry[] {
  const normalized = message.normalize("NFKC").toLowerCase();
  return CORPUS.map((entry) => ({
    entry,
    score: scoreEntry(entry, normalized, currentZoneId),
  }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_PASSAGES)
    .map((s) => s.entry);
}
