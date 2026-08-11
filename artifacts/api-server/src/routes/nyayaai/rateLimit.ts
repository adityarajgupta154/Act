/**
 * Tiny dependency-free request limiter for EXPENSIVE AI routes.
 *
 * Budget protection, not auth (the game deliberately has no accounts):
 * a per-key token bucket rides out one hammering client, and a global
 * per-minute ceiling keeps distributed abuse from draining the shared
 * paid STT/LLM/TTS keys. Pure and clock-injected so the ratelimit smoke
 * unit-tests the policy deterministically.
 */
import type { NextFunction, Request, Response } from "express";

export interface RateLimiterOptions {
  /** Burst headroom per client key. */
  perKeyCapacity: number;
  /** Sustained tokens per minute per client key. */
  perKeyRefillPerMinute: number;
  /** Hard ceiling on ALLOWED requests per minute across all keys. */
  globalPerMinute: number;
}

export interface RateLimiter {
  /** true = proceed; false = shed the request (429). */
  allow(key: string, nowMs?: number): boolean;
}

const PRUNE_ABOVE = 500;
const IDLE_EVICT_MS = 10 * 60_000;

export function createRateLimiter(opts: RateLimiterOptions): RateLimiter {
  const buckets = new Map<string, { tokens: number; last: number }>();
  let windowStart = 0;
  let windowCount = 0;
  return {
    allow(key, nowMs = Date.now()) {
      if (nowMs - windowStart >= 60_000) {
        windowStart = nowMs;
        windowCount = 0;
      }
      if (windowCount >= opts.globalPerMinute) return false;

      let b = buckets.get(key);
      if (!b) {
        b = { tokens: opts.perKeyCapacity, last: nowMs };
        buckets.set(key, b);
      }
      b.tokens = Math.min(
        opts.perKeyCapacity,
        b.tokens + ((nowMs - b.last) / 60_000) * opts.perKeyRefillPerMinute,
      );
      b.last = nowMs;
      if (b.tokens < 1) return false;
      b.tokens -= 1;
      windowCount += 1;

      if (buckets.size > PRUNE_ABOVE) {
        for (const [k, v] of buckets) {
          if (nowMs - v.last > IDLE_EVICT_MS) buckets.delete(k);
        }
      }
      return true;
    },
  };
}

// STT + LLM + TTS per call makes the Sarvam voice route the most expensive
// call in the app, and the game deliberately has no accounts — so ADMISSION
// is the only shield for the paid keys. Numbers are classroom-NAT-friendly:
// several children often share one school IP, so the per-IP bucket is loose
// and the global ceiling owns the actual spend cap.
export const voiceLimiter = createRateLimiter({
  perKeyCapacity: 12,
  perKeyRefillPerMinute: 20,
  globalPerMinute: 60,
});

/**
 * Mount in app.ts BEFORE express.json(): a shed request must cost a 429,
 * not a 5MB JSON parse. Requires `trust proxy` so req.ip is the client,
 * not the platform proxy peer.
 */
export function voiceAdmission(req: Request, res: Response, next: NextFunction): void {
  if (!voiceLimiter.allow(req.ip ?? "unknown")) {
    res.status(429).json({ error: "Too many voice requests — please wait a moment" });
    return;
  }
  next();
}
