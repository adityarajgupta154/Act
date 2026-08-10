/**
 * Learning & Development Insights — AI narrative route.
 *
 * POST /api/insights/analyze — stateless, batch-oriented (the client calls
 * it once per dashboard visit when the activity fingerprint changed and
 * caches the result — never per click, spec §18).
 *
 * DIVISION OF LABOUR (safety by construction):
 *   - The CLIENT's deterministic analyzer computes every number, label,
 *     trend, and recommendation. The model receives compact anonymous
 *     aggregates ONLY (no raw events, no nickname, no session ids, no free
 *     text) and merely REPHRASES them into supportive narrative.
 *   - Confidence is computed HERE, deterministically, from evidence counts
 *     — never model-chosen.
 *   - Every model string passes the banned-terms filter (./filter.ts):
 *     psychological/medical/diagnostic phrasing is dropped wholesale.
 *   - The non-diagnostic disclaimer is server-fixed text appended AFTER
 *     filtering — the model can neither write nor remove it.
 *   - Insufficient evidence (below the analyzer's minimum-data gate) never
 *     reaches the model at all: the route answers deterministically.
 */
import { Router, type IRouter } from "express";
import { InsightsAnalyzeBody } from "@workspace/api-zod";
import { getGemini, isGeminiConfigured } from "@workspace/integrations-gemini-ai";
import { ZONE_TOPICS } from "../avatar/prompt";
import {
  filterInsightItems,
  hasBannedInsightTerm,
  INSIGHTS_DISCLAIMER,
  SAFE_ENCOURAGEMENT,
  type AiItem,
} from "./filter";

const router: IRouter = Router();

// Same model + reasoning: gemini-2.5-flash 404s for new keys (Aug 2026).
const INSIGHTS_MODEL = "gemini-3.5-flash";

/** Minimum-evidence gate (mirrors the client analyzer's constants). */
const MIN_EVENTS = 8;
const MIN_SESSIONS = 2;

type AnalyzeInput = ReturnType<typeof InsightsAnalyzeBody.parse>;

function zoneName(zoneId: string | undefined): string | undefined {
  return zoneId ? ZONE_TOPICS[zoneId]?.name : undefined;
}

function confidenceFor(questions: number, sessions: number): "high" | "medium" | "low" {
  if (questions >= 12 && sessions >= 3) return "high";
  if (questions >= MIN_EVENTS && sessions >= MIN_SESSIONS) return "medium";
  return "low";
}

function buildInsightsPrompt(input: AnalyzeInput): {
  system: string;
  user: string;
} {
  const lang = input.language ?? "en";
  const audience = input.audience ?? "teacher";
  const t = input.totals;

  const lines: string[] = [];
  lines.push(
    `TOTALS: ${t.questionsAnswered} questions answered across ${t.sessions} play sessions` +
      (typeof t.activeDays === "number" ? ` on ${t.activeDays} different days` : "") +
      (typeof t.accuracyPct === "number" ? `; overall ${t.accuracyPct}% answered correctly` : "") +
      (typeof t.timeSpentMinutes === "number"
        ? `; about ${t.timeSpentMinutes} minutes of active learning time`
        : "") +
      ".",
  );
  if (typeof t.zonesCompleted === "number" && typeof t.zonesTotal === "number") {
    lines.push(
      `JOURNEY: ${t.zonesCompleted} of ${t.zonesTotal} zones completed` +
        (typeof t.levelsDone === "number" ? `, ${t.levelsDone} levels finished` : "") +
        (typeof t.badges === "number" ? `, ${t.badges} badges earned` : "") +
        (typeof t.streakDays === "number" && t.streakDays > 1
          ? `, current play streak ${t.streakDays} days`
          : "") +
        ".",
    );
  }
  if (typeof t.practiceReplays === "number" && t.practiceReplays > 0) {
    lines.push(
      `PRACTICE HABIT: ${t.practiceReplays} voluntary practice replays of already-finished levels (a persistence signal, not scored).`,
    );
  }

  lines.push("TOPICS (only ones with enough evidence carry a label):");
  for (const topic of input.topics) {
    const name = zoneName(topic.zoneId) ?? topic.zoneId;
    const parts = [
      `${topic.attempts} answered`,
      typeof topic.accuracyPct === "number" ? `${topic.accuracyPct}% correct` : undefined,
      `label: ${topic.label}`,
      typeof topic.sessions === "number" ? `${topic.sessions} sessions` : undefined,
      typeof topic.practiceAttempts === "number" && topic.practiceAttempts > 0
        ? `${topic.practiceAttempts} practice answers`
        : undefined,
      typeof topic.trendDeltaPct === "number"
        ? `within-topic change ${topic.trendDeltaPct > 0 ? "+" : ""}${topic.trendDeltaPct} pts`
        : undefined,
    ].filter(Boolean);
    lines.push(`- ${name}: ${parts.join(", ")}`);
  }

  if (input.trendSeries && input.trendSeries.length >= 2) {
    lines.push(
      `SESSION TREND (accuracy per play session, oldest→newest): ${input.trendSeries
        .map((p) => `${p.accuracyPct}% (${p.attempts} q)`)
        .join(" → ")}; overall direction: ${input.trendDirection ?? "steady"}.`,
    );
  }
  if (input.behavior) {
    const b = input.behavior;
    const bits = [
      typeof b.recapCount === "number" && b.recapCount > 0
        ? `${b.recapCount} adaptive recap questions answered (guided revisits)`
        : undefined,
      typeof b.continuesAfterIncorrectPct === "number"
        ? `continues playing after a wrong answer ${b.continuesAfterIncorrectPct}% of the time`
        : undefined,
      b.engagement ? `engagement pattern: ${b.engagement}` : undefined,
    ].filter(Boolean);
    if (bits.length > 0) lines.push(`BEHAVIOUR SIGNALS: ${bits.join("; ")}.`);
  }

  const outputLanguage =
    lang === "hi"
      ? "Write every text value in simple, warm Hindi (Devanagari script). Keep all numbers as Western digits (7, 82%)."
      : "Write every text value in simple, warm English.";
  const audienceLine =
    audience === "parent"
      ? "The reader is a PARENT with no teaching background: everyday words, zero education jargon, extra warm."
      : "The reader is a TEACHER: clear and practical, one concrete classroom-free suggestion per recommendation, still warm.";

  const system = [
    'You write short, supportive learning summaries for the adults behind ONE child playing "Nyaya Nagri", an Indian legal-literacy game (zones cover the Constitution, child protection, education rights, digital safety, and similar topics).',
    audienceLine,
    outputLanguage,
    "STRICT DATA RULES:",
    "- Use ONLY the numbers and labels provided. Never invent, estimate, or extrapolate any statistic, and never contradict a provided label.",
    "- These are GAME-BASED LEARNING observations. You must NEVER mention, suggest, or hint at intelligence, IQ, attention span, memory capacity, anxiety, depression, ADHD, autism, disorders, diagnoses, therapy, or any psychological, medical, or mental condition — no exceptions, not even reassuringly (do not write \"this does not indicate a disorder\").",
    '- Frame every practice area with growth language ("still growing", "may benefit from more practice", "getting stronger with each try") — never failure language ("weak", "poor", "behind", "struggling").',
    "- Mention the evidence casually where natural (\"across 3 sessions\", \"in 14 questions\") so adults see observations, not judgements.",
    "OUTPUT: reply with ONE JSON object, nothing else, in exactly this shape:",
    '{"strengths":[{"text":"...","zoneId":"zone3"}],"practiceAreas":[{"text":"...","zoneId":"zone5"}],"trendComment":"...","recommendations":[{"text":"...","zoneId":"zone5"}],"encouragement":"..."}',
    "Rules for the shape: 1-3 strengths, 0-2 practiceAreas, 1-3 recommendations, each text one or two short sentences; zoneId only when the item is about one specific zone (use the zone ids given in brackets); trendComment one sentence about the session trend (omit the field if no trend data was provided); encouragement one warm closing sentence addressed to the adult about the child.",
  ].join("\n");

  const zoneKey = input.topics
    .map((tp) => `${zoneName(tp.zoneId) ?? tp.zoneId} [${tp.zoneId}]`)
    .join(", ");
  const user = `Zone reference: ${zoneKey}\n\nOBSERVED GAME DATA:\n${lines.join("\n")}`;
  return { system, user };
}

/** Best-effort JSON extraction (models sometimes wrap output in fences). */
function parseModelJson(raw: string): Record<string, unknown> | null {
  const stripped = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(stripped.slice(start, end + 1));
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Coerce unknown model output into clean, capped AiItems. */
function toItems(value: unknown, max: number): AiItem[] {
  if (!Array.isArray(value)) return [];
  const items: AiItem[] = [];
  for (const entry of value) {
    if (items.length >= max) break;
    if (typeof entry === "string" && entry.trim()) {
      items.push({ text: entry.trim().slice(0, 400) });
    } else if (entry && typeof entry === "object") {
      const text = (entry as { text?: unknown }).text;
      const zoneId = (entry as { zoneId?: unknown }).zoneId;
      if (typeof text === "string" && text.trim()) {
        items.push({
          text: text.trim().slice(0, 400),
          ...(typeof zoneId === "string" && ZONE_TOPICS[zoneId] ? { zoneId } : {}),
        });
      }
    }
  }
  return items;
}

router.post("/insights/analyze", async (req, res) => {
  const parsed = InsightsAnalyzeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const input = parsed.data;
  const lang: "en" | "hi" = input.language === "hi" ? "hi" : "en";
  const confidence = confidenceFor(input.totals.questionsAnswered, input.totals.sessions);

  // MINIMUM-EVIDENCE GATE (spec: never analyze single events). The client
  // analyzer gates this too, but a direct POST must not bypass it — below
  // the threshold no model call happens at all.
  if (
    input.totals.questionsAnswered < MIN_EVENTS ||
    input.totals.sessions < MIN_SESSIONS ||
    input.topics.length === 0
  ) {
    res.json({
      strengths: [],
      practiceAreas: [],
      recommendations: [],
      encouragement: SAFE_ENCOURAGEMENT[lang],
      confidence: "low",
      disclaimer: INSIGHTS_DISCLAIMER[lang],
      filtered: false,
    });
    return;
  }

  if (!isGeminiConfigured()) {
    // Honest failure, no fallback narrative pretending to be AI.
    res.status(503).json({ error: "Insights AI is not configured yet" });
    return;
  }

  const { system, user } = buildInsightsPrompt(input);

  // ONE backoff retry, same pattern as every other AI route here.
  let raw = "";
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await getGemini().models.generateContent({
        model: INSIGHTS_MODEL,
        contents: [{ role: "user", parts: [{ text: user }] }],
        config: {
          systemInstruction: system,
          maxOutputTokens: 1200,
          temperature: 0.3,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
        },
      });
      raw = (response.text ?? "").trim();
      if (raw) break;
    } catch (err) {
      lastErr = err;
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 700));
  }

  const json = raw ? parseModelJson(raw) : null;
  if (!json) {
    if (lastErr) req.log?.error?.(lastErr, "insights analyze upstream error");
    res.status(502).json({ error: "Insights AI is unavailable right now" });
    return;
  }

  // BANNED-TERMS OUTPUT FILTER — fail-closed, per string.
  const strengths = filterInsightItems(toItems(json.strengths, 3));
  const practiceAreas = filterInsightItems(toItems(json.practiceAreas, 2));
  const recommendations = filterInsightItems(toItems(json.recommendations, 3));

  let trendComment =
    typeof json.trendComment === "string" ? json.trendComment.trim().slice(0, 400) : "";
  let trendDropped = 0;
  if (trendComment && hasBannedInsightTerm(trendComment)) {
    trendComment = "";
    trendDropped = 1;
  }

  let encouragement =
    typeof json.encouragement === "string" ? json.encouragement.trim().slice(0, 400) : "";
  let encouragementDropped = 0;
  if (!encouragement || hasBannedInsightTerm(encouragement)) {
    if (encouragement) encouragementDropped = 1;
    encouragement = SAFE_ENCOURAGEMENT[lang];
  }

  const droppedTotal =
    strengths.dropped +
    practiceAreas.dropped +
    recommendations.dropped +
    trendDropped +
    encouragementDropped;

  res.json({
    strengths: strengths.kept,
    practiceAreas: practiceAreas.kept,
    recommendations: recommendations.kept,
    ...(trendComment ? { trendComment } : {}),
    encouragement,
    confidence,
    disclaimer: INSIGHTS_DISCLAIMER[lang],
    filtered: droppedTotal > 0,
  });
});

export default router;
