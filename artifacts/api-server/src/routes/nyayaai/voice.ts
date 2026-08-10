/**
 * Nyaya AI — real-time VOICE conversation (Gemini Live API).
 *
 * Two endpoints, both stateless (DPDP data minimization — the server never
 * stores audio or transcripts):
 *
 * POST /nyaya-ai/voice-token
 *   Mints a short-lived EPHEMERAL token (v1alpha authTokens) so the browser
 *   can open a Live API WebSocket DIRECTLY with Google — the real
 *   GEMINI_API_KEY never leaves the server. The token is locked with
 *   liveConnectConstraints: model, voice, transcription AND the entire
 *   system instruction (safety rules + full legal corpus + game context)
 *   are fixed server-side at mint time — the browser cannot change the
 *   prompt even if tampered with.
 *
 * POST /nyaya-ai/voice-guard
 *   The deterministic transcript gate for voice mode. The client streams
 *   Live API transcripts (child's speech AND the model's spoken reply)
 *   through this endpoint; the SAME shared safety module used by every
 *   text route decides escalation, and the canonical helpline reply is
 *   returned hard-coded (PRD §9.8: safety text is never model-generated).
 *   Voice audio cannot be blocked pre-utterance (it streams in real time),
 *   so the client's contract is: on escalated=true, STOP playback, END the
 *   session, show the canonical text, and pulse Get Help Now.
 */
import { type IRouter } from "express";
import { EndSensitivity, Modality } from "@google/genai";
import { NyayaAiVoiceTokenBody, NyayaAiVoiceGuardBody } from "@workspace/api-zod";
import { getGeminiAlpha, isGeminiConfigured } from "@workspace/integrations-gemini-ai";
import { buildNyayaAiVoiceSystemPrompt } from "./prompt";
import { buildContextLines } from "./context";
import { type AgeBand } from "../avatar/prompt";
import {
  scanForDistress,
  requiresCanonicalEscalation,
  getEscalationReply,
  hasGujaratiScript,
} from "../avatar/safety";

/**
 * Live-capable native-audio model. Probed live (Aug 2026) against a fresh
 * key: this is the model this key can open bidiGenerateContent sessions
 * with (newer text models like gemini-3.5-flash are NOT Live-capable, and
 * gemini-omni-flash-preview is not enabled for API keys).
 */
export const NYAYA_LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-09-2025";

/** Warm, youthful prebuilt voice — friendly and clear for children. */
export const NYAYA_LIVE_VOICE = "Leda";

const TOKEN_TTL_MS = 30 * 60 * 1000; // whole session window
const SESSION_START_TTL_MS = 2 * 60 * 1000; // token must be USED quickly

export function registerVoiceRoutes(router: IRouter): void {
  router.post("/nyaya-ai/voice-token", async (req, res) => {
    const parsed = NyayaAiVoiceTokenBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    if (!isGeminiConfigured()) {
      res.status(503).json({ error: "Nyaya AI is not configured yet" });
      return;
    }

    const { language = "en", ageBand, gameContext } = parsed.data;
    const ctxLines = buildContextLines(gameContext);
    const systemInstruction = buildNyayaAiVoiceSystemPrompt(
      language,
      ageBand as AgeBand | undefined,
      ctxLines,
    );

    try {
      const now = Date.now();
      const token = await getGeminiAlpha().authTokens.create({
        config: {
          uses: 1, // one WebSocket session per token
          expireTime: new Date(now + TOKEN_TTL_MS).toISOString(),
          newSessionExpireTime: new Date(now + SESSION_START_TTL_MS).toISOString(),
          liveConnectConstraints: {
            model: NYAYA_LIVE_MODEL,
            config: {
              responseModalities: [Modality.AUDIO],
              systemInstruction,
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: NYAYA_LIVE_VOICE } },
              },
              // Both transcripts on: the client renders them AND streams
              // them through /nyaya-ai/voice-guard (deterministic gate).
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              // Keep long conversations alive without unbounded context.
              contextWindowCompression: { slidingWindow: {} },
              temperature: 0.6,
              // LATENCY: the default end-of-speech silence window makes every
              // reply feel sluggish. 600ms starts the model's turn noticeably
              // sooner while still leaving room for a child's normal mid-
              // sentence pauses (cutting them off would be worse than the
              // wait). Locked here AND mirrored with identical values in the
              // client's live.connect config (constrained tokens reject
              // conflicting fields).
              realtimeInputConfig: {
                automaticActivityDetection: {
                  endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_HIGH,
                  silenceDurationMs: 600,
                },
              },
            },
          },
        },
      });
      if (!token?.name) throw new Error("empty token from authTokens.create");
      res.json({
        token: token.name,
        model: NYAYA_LIVE_MODEL,
        expiresAt: new Date(now + SESSION_START_TTL_MS).toISOString(),
      });
    } catch (err) {
      req.log?.error?.(err, "nyaya ai voice token error");
      res.status(502).json({ error: "Nyaya AI voice is unavailable right now" });
    }
  });

  router.post("/nyaya-ai/voice-guard", (req, res) => {
    const parsed = NyayaAiVoiceGuardBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    const { text, role, language = "en" } = parsed.data;
    const replyLang: "en" | "hi" | "gu" = hasGujaratiScript(text) ? "gu" : language;

    // Child's speech → distress input gate. Model's speech → output gate
    // (helpline phrasing must always be the canonical hard-coded text).
    const escalated =
      role === "user" ? scanForDistress([text]) : requiresCanonicalEscalation(text);

    if (escalated) {
      res.json({ escalated: true, reply: getEscalationReply(replyLang) });
      return;
    }
    res.json({ escalated: false });
  });
}
