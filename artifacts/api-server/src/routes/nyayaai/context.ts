/**
 * Nyaya AI — shared safe game-context builder.
 *
 * Used by BOTH the text chat route (/nyaya-ai/chat) and the voice token
 * route (/nyaya-ai/voice-token) so the two surfaces can never drift apart
 * on what player data is allowed to reach Gemini (PRD §9 data minimization):
 * stable zone ids mapped to display names SERVER-side (single source),
 * aggregate counts, and length-capped free-text fields that are PII-redacted
 * anyway. Never coins, XP, or anything resembling a real identity.
 */
import { ZONE_TOPICS } from "../avatar/prompt";
import { redactPii } from "../avatar/safety";

/** Structural shape of the client-sent context (zod already validated it). */
export interface NyayaGameContext {
  nickname?: string;
  currentZoneId?: string;
  nearbyZoneId?: string;
  completedZoneIds?: string[];
  progressPct?: number;
  badgeCount?: number;
  currentLessonTitle?: string;
  currentLevelNumber?: number;
  learnQuestionsAnswered?: number;
  learnAccuracyPct?: number;
  learnTrend?: "improving" | "steady" | "declining";
  strongZoneId?: string;
  practiceZoneId?: string;
}

/** Map a zone id to its display name (single-sourced from ZONE_TOPICS). */
export function zoneName(zoneId: string | undefined): string | undefined {
  if (!zoneId) return undefined;
  return ZONE_TOPICS[zoneId]?.name;
}

/** Turn validated game context into safe, redacted prompt lines. */
export function buildContextLines(gameContext: NyayaGameContext | undefined): string[] {
  const ctxLines: string[] = [];
  if (!gameContext) return ctxLines;
  const gc = gameContext;
  if (gc.nickname) ctxLines.push(`- Player nickname (fun made-up game name): "${redactPii(gc.nickname)}"`);
  const cur = zoneName(gc.currentZoneId);
  if (cur) ctxLines.push(`- Zone the player is INSIDE right now: ${cur}`);
  const near = zoneName(gc.nearbyZoneId);
  if (near && !cur) ctxLines.push(`- Zone the player is standing NEAR on the map: ${near}`);
  if (gc.completedZoneIds && gc.completedZoneIds.length > 0) {
    const names = gc.completedZoneIds.map((z) => zoneName(z)).filter(Boolean);
    if (names.length > 0) ctxLines.push(`- Zones already completed (${names.length} of ${Object.keys(ZONE_TOPICS).length}): ${names.join(", ")}`);
  } else {
    ctxLines.push("- Zones already completed: none yet (just starting the journey)");
  }
  if (typeof gc.progressPct === "number") ctxLines.push(`- Overall progress: about ${gc.progressPct}%`);
  if (typeof gc.badgeCount === "number" && gc.badgeCount > 0) ctxLines.push(`- Badges earned so far: ${gc.badgeCount}`);
  if (gc.currentLessonTitle) {
    const lvl = gc.currentLevelNumber ? ` (level ${gc.currentLevelNumber})` : "";
    ctxLines.push(`- Lesson open right now: "${redactPii(gc.currentLessonTitle)}"${lvl}`);
  }
  // Learning-insights stats (client analyzer output, evidence-gated there).
  // These let Nyaya AI answer "How am I doing?" from REAL numbers only.
  if (typeof gc.learnQuestionsAnswered === "number" && gc.learnQuestionsAnswered > 0) {
    const acc =
      typeof gc.learnAccuracyPct === "number"
        ? `, about ${Math.round(gc.learnAccuracyPct)}% answered correctly`
        : "";
    ctxLines.push(
      `- Learning stats so far: ${gc.learnQuestionsAnswered} quiz questions answered${acc}`,
    );
  }
  if (gc.learnTrend) {
    ctxLines.push(`- Learning trend across recent play sessions: ${gc.learnTrend}`);
  }
  const strong = zoneName(gc.strongZoneId);
  if (strong) ctxLines.push(`- Strongest topic right now (from game answers): ${strong}`);
  const practice = zoneName(gc.practiceZoneId);
  if (practice) ctxLines.push(`- Topic that could use some friendly practice: ${practice}`);
  return ctxLines;
}
