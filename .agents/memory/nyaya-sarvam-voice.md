---
name: Nyaya Sarvam voice engine
description: Turn-based Sarvam voice pipeline (replaced Gemini Live) — decisions, safety order, budget limits.
---

# Sarvam turn-based voice (replaced Gemini Live, Aug 2026)

**Decision:** kid voice chat is record-a-turn → server pipeline (Sarvam STT → the SAME text-chat safety gates → Gemini reply → Sarvam TTS) → audio back. Chosen over Live streaming for deterministic safety gating, no client-held credentials, and Hindi-first STT quality.
**Why the order is sacred:** distress / canonical-escalation / PII gates run on transcripts BEFORE synthesis — streamed audio cannot be un-said. Never move gating after TTS, never let the client talk to Sarvam/Gemini directly (SARVAM_API_KEY is server-only).

**Client contract:** engine fails closed — any turn failure (429/4xx/timeout) means back-to-listening with a friendly chip, never a crash and never an unlock of anything. VAD constants (silence 800ms / min speech 250ms / max 30s) are UX-tuned for children; don't tweak casually.

**Budget protection (review-driven, Aug 2026):** most expensive call in the app (STT+LLM+TTS), NO auth by design — the shield is an ADMISSION middleware mounted in app.ts BEFORE express.json (shed = 429 without paying the 5MB parse; single admission point, no in-route allow). `trust proxy = 1` is REQUIRED or every user shares the proxy peer's IP bucket. Per-IP numbers stay classroom-NAT-loose (many kids share one school IP); the GLOBAL per-minute ceiling owns the spend cap. In-route strict bounds before any upstream call: audio size 413; language enum; history shape AND per-item/total content length. Body limit 5MB because base64 WAV turns run 1-4MB.

**Testing:** limiter policy is a pure clock-injected module — smoke-test the policy, not just greps. Behavioral mocked-HTTP route tests remain a known gap (safety module itself is behaviorally covered in the api battery).
