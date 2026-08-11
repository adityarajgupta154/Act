/**
 * Story Adventure voice — Gemini TTS, STORY ADVENTURE ONLY.
 *
 * GET /api/story-adventure-voice/tts?id=<segmentId>  →  audio/wav
 *
 * This route serves the warm narrator voice for the Story Adventure and
 * NOTHING else. It is fully isolated from the Nyaya AI assistant's voice
 * stack (Live API ephemeral tokens in nyayaai/voice.ts) and from every
 * other feature — per the task's hard scope rule.
 *
 * Safety & isolation model (PRD §9.8):
 *  - The request carries ONLY a segment id. The text comes from the
 *    GENERATED manifest (story-voice-manifest.ts) — the server never
 *    synthesizes free text, so this cannot be abused as a TTS proxy, and
 *    only fixed hand-written story lines (digit-free, no helplines) can
 *    ever be spoken. Unknown id → 404.
 *  - Uses the ONE shared Gemini key (GEMINI_API_KEY) via
 *    integrations-gemini-ai. The earlier dedicated second TTS-key secret
 *    scope was REMOVED on explicit user order (Aug 11, 2026): a single
 *    key powers assistant + story TTS, like the original design. The
 *    quota discipline below (serialized generation, 429 backoff, polite
 *    prewarm) is what protects that shared key. Missing key ⇒ explicit
 *    503 TTS_NOT_CONFIGURED — no fallback. The key never leaves the
 *    server.
 *
 * Performance model (story content is static):
 *  - Every generated clip is cached on disk keyed by voice+text hash —
 *    each line is paid for ONCE ever; edits to a line change its hash and
 *    regenerate naturally. Repeat requests are a file read.
 *  - A throttled boot-time prewarm generates any missing clips in the
 *    background (first generation is ~5-10s per line, so waiting for the
 *    first child to hit each line would feel broken).
 *
 * Free-tier quota discipline (verified live: TTS previews 429 easily):
 *  1. ALL generation is globally serialized with fixed spacing — no burst
 *     of parallel calls can trip 429s (a cold story open fires ~10).
 *  2. A 429 opens a short backoff window; while it is open, requests that
 *     would NEED generation fail fast with 503 + Retry-After so the client
 *     surfaces its retry chip instantly instead of hanging into its fetch
 *     timeout (NO fallback voice exists — strict Gemini-only spec).
 *     Cached clips keep serving normally.
 *  3. The prewarm is a POLITE background consumer: it yields to live
 *     requests, waits out backoff windows, and only aborts on repeated
 *     NON-quota errors (bad key ≠ busy quota).
 */
import { Router, type IRouter } from "express";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getGemini, isGeminiConfigured } from "@workspace/integrations-gemini-ai";
import { logger } from "../../lib/logger";
import {
  STORY_LEVEL_ORDER,
  STORY_VOICE_MANIFEST,
  type StoryVoiceManifestEntry,
} from "./story-voice-manifest";

/** Probed live (Aug 2026) — both return audio/L16 24kHz mono for this key. */
export const STORY_TTS_MODELS = [
  "gemini-3.1-flash-tts-preview",
  "gemini-2.5-flash-preview-tts",
] as const;

/** Warm prebuilt voice — a friendly "didi" storyteller for young kids. */
export const STORY_TTS_VOICE = "Sulafat";

/**
 * Style steering (Gemini TTS takes natural-language delivery directions
 * before the line). The instruction is in English for BOTH languages —
 * the model narrates the payload text in its own language.
 */
const STYLE_PREFIX =
  "Say warmly, gently and a little slowly, like a friendly storyteller guiding a young child: ";

const CACHE_DIR = join(process.cwd(), ".story-voice-cache");

const MANIFEST_BY_ID = new Map<string, StoryVoiceManifestEntry>(
  STORY_VOICE_MANIFEST.map((e) => [e.id, e]),
);

/** Cache key: voice + language + exact text (edits regenerate naturally). */
function cacheFile(entry: StoryVoiceManifestEntry): string {
  const hash = createHash("sha256")
    .update(`${STORY_TTS_VOICE}|${entry.lang}|${entry.text}`)
    .digest("hex")
    .slice(0, 32);
  return join(CACHE_DIR, `${hash}.wav`);
}

/** Wrap raw PCM (s16le 24kHz mono — Gemini TTS output) in a WAV header. */
function pcmToWav(pcm: Buffer, sampleRate = 24_000): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate (16-bit mono)
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

// --- Free-tier quota discipline ------------------------------------------------

const GEN_SPACING_MS = 6_000; // one Gemini call at a time, well spaced
const QUOTA_BACKOFF_MS = 30_000;
let quotaBackoffUntil = 0;
let lastDemandAt = 0; // last time a live client asked for a clip
/** `<levelHead>|<lang>` of the last live cache MISS — the block a child is
 *  playing RIGHT NOW; the prewarm pulls its remaining clips forward. */
let demandKey: string | null = null;
let lastGenStart = 0;
let genChain: Promise<unknown> = Promise.resolve();

const isQuotaError = (err: unknown) => /429|RESOURCE_EXHAUSTED|quota/i.test(String(err));

/** Upstream HTTP status from a @google/genai ApiError message (best effort). */
function upstreamStatus(err: unknown): number | null {
  const m = /"code"\s*:\s*(\d{3})/.exec(String(err));
  return m ? Number(m[1]) : null;
}

/** 400/401/403-class = key/request problem — retrying is useless (user
 *  spec: no retry loops on 400/403; show an explicit error instead). */
function isFatalRequestError(err: unknown): boolean {
  const code = upstreamStatus(err);
  if (code !== null) return code === 400 || code === 401 || code === 403;
  return /API key not valid|API_KEY_INVALID|PERMISSION_DENIED|UNAUTHENTICATED|INVALID_ARGUMENT/i.test(
    String(err),
  );
}
const inQuotaBackoff = () => Date.now() < quotaBackoffUntil;

/** "Quota door is closed right now" — clients should fall back, not wait. */
class QuotaBusyError extends Error {}

/** Global FIFO with fixed spacing between generation STARTS. */
function scheduleGeneration<T>(fn: () => Promise<T>): Promise<T> {
  const next = genChain.then(async () => {
    const wait = lastGenStart + GEN_SPACING_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastGenStart = Date.now();
    return fn();
  });
  genChain = next.catch(() => undefined);
  return next;
}

async function generateOnce(
  model: string,
  entry: StoryVoiceManifestEntry,
): Promise<{ bytes: Buffer; mime: string }> {
  const res = await getGemini().models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: `${STYLE_PREFIX}${entry.text}` }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: STORY_TTS_VOICE } },
      },
    },
  });
  const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  const b64 = part?.inlineData?.data;
  if (!b64) {
    // Diagnostics (task request): surface WHY there is no audio — the
    // response structure only; never the key, never the spoken text.
    logger.warn(
      {
        segment: entry.id,
        model,
        finishReason: res.candidates?.[0]?.finishReason ?? null,
        partKinds: res.candidates?.[0]?.content?.parts?.map((p) => Object.keys(p).join("+")) ?? [],
      },
      "story-voice TTS returned no audio data",
    );
    throw new Error("TTS returned no audio data");
  }
  const mime = part?.inlineData?.mimeType ?? "";
  const bytes = Buffer.from(b64, "base64");
  logger.info(
    { segment: entry.id, model, mime, bytes: bytes.length, hasAudio: true },
    "story-voice TTS audio received",
  );
  return { bytes, mime };
}

/**
 * Package Gemini TTS audio for disk/HTTP. L16/PCM (the documented TTS
 * output) gets a WAV header at the rate the response DECLARES (never a
 * blind 24kHz assumption — user spec); ready-made WAV passes through;
 * anything else fails explicitly rather than writing bytes the browser
 * can't actually play.
 */
function toWav(audio: { bytes: Buffer; mime: string }): Buffer {
  const mime = audio.mime.toLowerCase();
  if (mime.includes("wav")) return audio.bytes;
  if (mime.includes("l16") || mime.includes("pcm") || mime.includes("linear16")) {
    // PCM must DECLARE its sample rate — wrapping at a guessed rate would
    // cache a chipmunked/slowed clip forever. Missing rate => explicit
    // failure (never cached), same as a missing/unknown mime below.
    const rate = /rate=(\d{4,6})/.exec(mime)?.[1];
    if (!rate) {
      throw new Error(
        `TTS returned PCM without a declared rate ("${audio.mime}") — refusing to guess`,
      );
    }
    return pcmToWav(audio.bytes, Number(rate));
  }
  throw new Error(`TTS returned unsupported audio mime "${audio.mime}"`);
}

/**
 * Generate (or read cached) WAV for a manifest entry. Primary model twice
 * (transient blips), then the fallback model — but a quota 429 aborts
 * immediately and opens the backoff window (retrying into a closed quota
 * door just burns time the child spends in silence).
 */
async function synthesizeToCache(entry: StoryVoiceManifestEntry): Promise<string> {
  const file = cacheFile(entry);
  if (existsSync(file)) return file;
  if (inQuotaBackoff()) throw new QuotaBusyError("story-voice quota backoff");
  mkdirSync(CACHE_DIR, { recursive: true });
  const attempts: string[] = [STORY_TTS_MODELS[0], STORY_TTS_MODELS[0], STORY_TTS_MODELS[1]];
  let lastErr: unknown = null;
  for (let i = 0; i < attempts.length; i++) {
    try {
      const audio = await scheduleGeneration(() => {
        // Re-check at DEQUEUE time: another request may have closed the
        // quota door while this one sat in the generation queue — don't
        // burn a call into a known 429 wall.
        if (inQuotaBackoff()) throw new QuotaBusyError("story-voice quota backoff");
        return generateOnce(attempts[i], entry);
      });
      writeFileSync(file, toWav(audio));
      return file;
    } catch (err) {
      if (err instanceof QuotaBusyError) throw err; // queue-skip: no log spam, no window extension
      lastErr = err;
      logger.warn(
        {
          segment: entry.id,
          model: attempts[i],
          attempt: i + 1,
          status: upstreamStatus(err),
          err: String(err).slice(0, 160),
        },
        "story-voice TTS attempt failed",
      );
      if (isQuotaError(err)) {
        // Quota door: fail FAST and let the layered retries handle 429s
        // (client re-fetch + chip tap = fresh request + prewarm re-tick
        // after the window) — an in-process 429 sleep would hold the live
        // request past the client's 12s fetch timeout for nothing.
        quotaBackoffUntil = Date.now() + QUOTA_BACKOFF_MS;
        throw new QuotaBusyError("story-voice quota exhausted");
      }
      // Bad key / bad request: abort immediately, no more attempts.
      if (isFatalRequestError(err)) throw err instanceof Error ? err : new Error(String(err));
      // Transient (500/502/503/network): exponential pause before the next
      // attempt (user spec: max 2 retries) on top of GEN_SPACING_MS.
      if (i < attempts.length - 1) await new Promise((r) => setTimeout(r, 2_000 * 2 ** i));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/** Parallel requests for the same id share ONE generation. */
const inFlight = new Map<string, Promise<string>>();
function synthesizeShared(entry: StoryVoiceManifestEntry): Promise<string> {
  const existing = inFlight.get(entry.id);
  if (existing) return existing;
  const p = synthesizeToCache(entry).finally(() => inFlight.delete(entry.id));
  inFlight.set(entry.id, p);
  return p;
}

/**
 * Prewarm order under SCARCE quota (free tier): whatever trickles through
 * the 429 windows must complete PLAYABLE interactions first — not just the
 * early-manifest narrative lines. Order:
 *   0. chrome CTAs + "your turn" — without these, EVERY question read and
 *      BOTH feedback branches die mid-sequence (the engine stops at the
 *      first missing clip), so they outrank everything.
 *   1. level blocks in play order (L1 en, L1 hi, L2 en, …) — the clips a
 *      child actually plays through, question clusters included.
 *   2. reminder pool — nudges for a child who ALREADY heard the question
 *      (the client only arms reminders after a successful question read),
 *      so they are worthless while the question itself cannot speak. The
 *      Aug 2026 slide-4 bug: 12 reminder clips ranked ahead of Level 1's
 *      question cluster while the DAILY quota was 429-dead — days of
 *      trickle went to nudge lines nobody could ever reach, and the
 *      interactive heart of the level stayed silent.
 *   3. reward/result-screen lines LAST: the congratulations screen is never
 *      narrated (the client hard-stops on RESULT), so these must never take
 *      a generation slot ahead of clips a child can actually hear.
 * On top of the static order, a live cache MISS re-anchors the queue onto
 * the missed level+lang block (demandKey below): the story being PLAYED
 * right now fills before the global march order resumes.
 */
function prewarmOrdered(): StoryVoiceManifestEntry[] {
  // PLAY order comes from the generated STORY_LEVEL_ORDER (the STORY_LEVELS
  // sequence) — NOT from manifest encounter order: the allowlist file is
  // sorted alphabetically, which would rank right-to-health ahead of
  // right-to-life and starve Level 1's question all over again.
  const levelRank = new Map(STORY_LEVEL_ORDER.map((id, i) => [id, i] as const));
  const rank = (e: StoryVoiceManifestEntry): number => {
    const parts = e.id.split("/");
    // Reminders sink BELOW the level blocks (tier 2 in the doc above).
    if (parts[0] === "chrome") return parts[1].startsWith("reminder-") ? 500 : 0;
    // Unknown level head (future drift) sinks AFTER known levels, never first.
    const lvl = (levelRank.get(parts[0]) ?? STORY_LEVEL_ORDER.length) * 2 + (e.lang === "hi" ? 1 : 0);
    // Never-played result-screen lines sink below every audible block.
    if (parts[1] === "reward" || parts[1] === "result") return 1_000 + lvl;
    return 10 + lvl;
  };
  return STORY_VOICE_MANIFEST.map((e, i) => [e, i] as const)
    .sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]) // index tiebreak = stable
    .map(([e]) => e);
}

/** Boot-time prewarm — see "quota discipline" in the header. */
function prewarm(): void {
  if (!isGeminiConfigured()) {
    logger.warn(
      "story-voice prewarm skipped — GEMINI_API_KEY is not set (single shared Gemini key — user order, Aug 11 2026)",
    );
    return;
  }
  const missing = prewarmOrdered().filter((e) => !existsSync(cacheFile(e)));
  if (missing.length === 0) {
    logger.info({ total: STORY_VOICE_MANIFEST.length }, "story-voice cache already warm");
    return;
  }
  logger.info(
    // `next` = the first planned generations (ids only) — boot-time proof
    // that the scarce-quota priority order is what we think it is.
    { missing: missing.length, next: missing.slice(0, 6).map((e) => e.id) },
    "story-voice prewarm starting",
  );
  let i = 0;
  let generated = 0;
  let hardFailures = 0;
  const tick = () => {
    if (i >= missing.length || hardFailures >= 3) {
      logger.info(
        { generated, remaining: missing.length - i, aborted: hardFailures >= 3 },
        "story-voice prewarm finished",
      );
      return;
    }
    // Yield: a child is actively fetching, or the quota door is closed.
    if (Date.now() - lastDemandAt < 15_000) {
      setTimeout(tick, 5_000);
      return;
    }
    if (inQuotaBackoff()) {
      setTimeout(tick, QUOTA_BACKOFF_MS);
      return;
    }
    // Live MISS re-anchor: a child is playing a block the global order
    // hasn't reached (e.g. L1-hi while the march grinds L1-en) — pull that
    // block's first still-missing clip forward so the story being played
    // NOW is what the next quota slot fills.
    if (demandKey) {
      const [head, lang] = demandKey.split("|");
      const j = missing.findIndex(
        (e, k) => k >= i && e.id.split("/")[0] === head && e.lang === lang && !existsSync(cacheFile(e)),
      );
      if (j > i) {
        const [pulled] = missing.splice(j, 1);
        missing.splice(i, 0, pulled);
      } else if (j === -1) {
        demandKey = null; // block complete (or fully cached) — resume the global order
      }
    }
    const entry = missing[i];
    if (existsSync(cacheFile(entry))) {
      // A live request already filled this one.
      i++;
      setTimeout(tick, 250);
      return;
    }
    synthesizeShared(entry)
      .then(() => {
        i++;
        generated++;
        hardFailures = 0;
      })
      .catch((err) => {
        if (!(err instanceof QuotaBusyError)) {
          i++; // hard error: skip this entry, count towards abort
          hardFailures++;
        }
        // QuotaBusy: same entry retried after the backoff window.
      })
      .finally(() => setTimeout(tick, 20_000));
  };
  setTimeout(tick, 5_000); // let the server finish booting first
}

const router: IRouter = Router();

router.get("/story-adventure-voice/tts", async (req, res) => {
  const id = String(req.query.id ?? "");
  const entry = MANIFEST_BY_ID.get(id);
  if (!entry) {
    // Only manifest ids exist — free text can NEVER be synthesized here.
    res.status(404).json({ error: "Unknown story segment" });
    return;
  }
  lastDemandAt = Date.now();
  const cachedClip = cacheFile(entry);
  if (existsSync(cachedClip)) {
    // Disk-cached clips involve NO Gemini call — they keep playing even
    // when the Gemini key is missing or the quota door is closed, so an
    // already-generated story never goes silent over key/quota state.
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(readFileSync(cachedClip));
    return;
  }
  // From here on this is a cache MISS — generation needs the shared key.
  if (!isGeminiConfigured()) {
    res.status(503).json({ success: false, error: "TTS_NOT_CONFIGURED" });
    return;
  }
  const demandHead = entry.id.split("/")[0];
  if (demandHead !== "chrome") {
    // A real child needs THIS block — re-anchor the prewarm onto it.
    // (chrome misses don't re-anchor: they're already the top tier.)
    demandKey = `${demandHead}|${entry.lang}`;
  }
  if (inQuotaBackoff()) {
    // Fail FAST during a quota window: the client shows its retry chip
    // instantly instead of hanging into its fetch timeout (no fallback
    // voice exists — Gemini-only spec).
    res.setHeader("Retry-After", "30");
    res.status(503).json({ success: false, error: "TTS_QUOTA_BUSY", status: 429 });
    return;
  }
  try {
    const file = await synthesizeShared(entry);
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(readFileSync(file));
  } catch (err) {
    if (err instanceof QuotaBusyError) {
      res.setHeader("Retry-After", "30");
      res.status(503).json({ success: false, error: "TTS_QUOTA_BUSY", status: 429 });
      return;
    }
    // The client retries once, then goes SILENT + retry chip (never
    // another voice engine — strict Gemini-only spec). Safe error shape
    // only — no key, no upstream error text (user spec).
    res.status(502).json({
      success: false,
      error: "TTS_REQUEST_FAILED",
      status: upstreamStatus(err) ?? 502,
    });
  }
});

// Boot-time key status (name only, never the value): story TTS shares the
// single GEMINI_API_KEY with the assistant (user order, Aug 11 2026).
logger.info(
  { ttsKey: "GEMINI_API_KEY", configured: isGeminiConfigured() },
  "story-voice key status",
);
prewarm();

export default router;
