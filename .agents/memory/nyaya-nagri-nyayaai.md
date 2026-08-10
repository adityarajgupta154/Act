---
name: Nyaya AI assistant (consolidated)
description: The game's ONE AI assistant (robot AvatarWidget, Gemini) — model choice, RAG corpus rules, SDK/build quirks, orval schema gotcha.
---

# Nyaya AI — single assistant architecture

**Rule:** Nyaya Nagri has exactly ONE AI assistant: the orange/white robot (`src/avatar/AvatarWidget.tsx`, branded "Nyaya AI — Your Rights Guide"), mounted on Home + HUD, backed by `POST /api/nyaya-ai/chat`. The old green-scales Legal Buddy widget and the Anthropic `/avatar/chat` route were removed (Aug 2026).
**Why:** SIH spec mandates one assistant everywhere; two chat surfaces confused children and doubled the safety surface.
**How to apply:** Any new AI helper feature extends this widget/route — never add a second floating assistant. `scripts/nyayaai.smoke.ts` enforces the invariant.

## Gemini model choice (hard-won, Aug 2026)
- `gemini-2.5-flash` returns 404 for NEW API keys ("no longer available to new users"). `gemini-3.6-flash` and `gemini-flash-latest` reject our call shape (thinkingConfig/thinkingBudget 0 + maxOutputTokens) with 400 INVALID_ARGUMENT. **`gemini-3.5-flash` is the newest model that works** — verified via live models.list() + generateContent probe.
- `thinkingBudget: 0` stays mandatory — without it flash models burn the token budget on hidden reasoning and return empty replies.
- Free-tier keys: ~5 requests/min per model. Route has ONE 700ms-backoff retry; when live-curling, space requests ~20s or you get 429s.
- Diagnosing upstream errors: `req.log` (pino) captures them in the workflow log; a direct `tsx` probe script in `artifacts/api-server/scripts/` (import `@workspace/integrations-gemini-ai`) gives the raw ApiError fastest.

## RAG corpus rules (routes/nyayaai/corpus.ts)
- **Passages must NEVER contain helpline digits (1098/155260) or "call this number" phrasing.** The fail-closed output gate replaces any model reply that echoes helpline guidance — a passage containing digits would turn every answer on that topic into the canonical escalation. Helpline guidance is exclusively owned by the deterministic escalation path. The safety smoke asserts every corpus text passes the output gate as-is.
- Passages cite act name + year verbatim from PRD §4; source is the India Code SITE (base URL only — never fabricate deep links or section citations).
- Retrieval is deterministic keyword scoring; zone affinity is a ranking bonus only, never a reason to retrieve. No passage retrieved → prompt forbids specific legal claims (honest "not sure" mode).
- Keyword matching: Latin keywords need word boundaries, so include inflected forms explicitly ("bully" AND "bullying" — `\btroll\b` does not match "trolling"). Indic-script keywords match by substring.

## Game context (personalization without PII)
Client sends stable zone IDS + counts + capped nickname/lesson title (`src/avatar/gameContext.ts`); server maps ids→names via ZONE_TOPICS (single source) and PII-redacts free-text fields. Never send coins/XP, real names, or free-text zone names from the client.

## Real-time voice (Gemini Live, Aug 2026)
- Live-capable model on this key: **`gemini-2.5-flash-native-audio-preview-09-2025` only** (text chat's gemini-3.5-flash has no Live support). Voice `Leda`.
- Ephemeral tokens: v1alpha `authTokens.create` + `liveConnectConstraints` — model, voice, transcriptions and the FULL systemInstruction (plain string works) lock at mint; the client's connect config must mirror the constraints. uses:1 → acquire mic permission BEFORE minting or a denied mic burns the token.
- Preview Live models throttle under rapid repeated sessions: turnComplete with ZERO audio/transcript (setupComplete → empty modelTurn → generationComplete → turnComplete). Config-independent — verify with a byte-identical known-good direct mint before touching code; a cooldown fixes it.
- Streamed-audio safety gating (architect-approved after 4 review rounds): playback HOLDBACK — queue each turn's audio until the child's utterance AND the first model-transcript slice both pass the deterministic guard (fast-path check ≈ one round-trip); gate state is EPOCH-scoped per turn/utterance (stale verdicts must never release later audio — including dedupe fast paths); a bounded timer DISCARDS unverifiable audio (never plays raw); incremental re-checks run mid-turn; guard failure fails CLOSED (session ends, friendly message). Raw model text appends only after a clean verdict.
- Residual limits to disclose, not "fix": a modified client can skip a client-called guard (inherent to direct browser→Google streaming; locked prompt is the first defense), and post-release mid-turn content can play ~debounce+RTT before an incremental verdict stops it.

## Build/codegen quirks
- orval@8 emits zod-v4 syntax (`zod.int()`) for OpenAPI `type: integer`, which breaks against installed zod 3.25 — **use `type: number` + min/max in openapi.yaml**.
- Gemini/Anthropic SDKs matching build.mjs external globs must be direct api-server package.json deps or the esbuild bundle fails at runtime.
- Codegen lives at `lib/api-spec` → `pnpm run codegen` (orval), not a root script.
- Shared safety module stays at `routes/avatar/safety.ts` (EN/HI/GU) — `routes/avatar/` still exists for shared modules even though its route file is gone; persona + nyayaai import from it.
