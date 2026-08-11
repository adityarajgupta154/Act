/**
 * Gemini client (user-supplied key, NOT the Replit AI proxy).
 *
 * ONE shared key scope (user order, Aug 11 2026 — REVERTED the earlier
 * two-key split): GEMINI_API_KEY powers everything Gemini — Nyaya AI
 * text/streaming/insights, Live voice token minting, AND Story Adventure
 * TTS. The dedicated second TTS-key secret scope was removed on explicit
 * user instruction; do not reintroduce a second key without a new order.
 *
 * The key is server-side only; it never reaches the frontend. Clients stay
 * LAZY so the api-server keeps serving non-Gemini routes even when the key
 * is missing — Gemini routes then fail explicitly with a clear message.
 */
import { GoogleGenAI } from "@google/genai";

let cached: GoogleGenAI | null = null;

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function getGemini(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it as a secret so the Nyaya AI and story narration routes can call Gemini.",
    );
  }
  if (!cached) {
    cached = new GoogleGenAI({ apiKey });
  }
  return cached;
}

let cachedAlpha: GoogleGenAI | null = null;

/**
 * v1alpha client — required for ephemeral Live API session tokens
 * (authTokens.create). Same key, still strictly server-side: only the
 * short-lived token it mints (NEVER the key) reaches the browser, which
 * uses it to open its own Live WebSocket directly with Google.
 */
export function getGeminiAlpha(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it as a secret so Nyaya AI voice can mint Live session tokens.",
    );
  }
  if (!cachedAlpha) {
    cachedAlpha = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } });
  }
  return cachedAlpha;
}
