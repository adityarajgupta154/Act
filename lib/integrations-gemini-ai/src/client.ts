/**
 * Gemini client (user-supplied key, NOT the Replit AI proxy).
 *
 * The user's requirement for Nyaya AI is explicit: use the Gemini API
 * with the GEMINI_API_KEY environment variable, server-side only. The key
 * never reaches the frontend; this module is only ever imported by the
 * api-server.
 *
 * Unlike the Anthropic integration lib (which throws at import time), this
 * client is LAZY on purpose: the api-server must keep serving the existing
 * persona routes even when GEMINI_API_KEY is missing — only the Nyaya AI
 * routes fail, explicitly, with a clear message.
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
      "GEMINI_API_KEY is not set. Add it as a secret so the Nyaya AI routes can call Gemini.",
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
 * (authTokens.create). Same user key, still strictly server-side: only the
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
