---
name: Nyaya AI streaming chat pattern
description: How the low-latency NDJSON text-chat streaming works without weakening the child-safety gates; constraints future edits must keep.
---

# Streaming + safety gating pattern (text chat)

**Rule:** the streaming route may only forward a delta AFTER running the canonical-escalation output gate over the ACCUMULATED reply (`requiresCanonicalEscalation(full)` before `writeEvent(delta)`). Tripped → single `escalated` event, client replaces the whole partial bubble with canonical text, upstream aborted. Never gate per-chunk in isolation (helpline phrasing can straddle chunk boundaries).

**Why:** child-safety contract — no ungated AI text may ever reach the child; the gate is a local function so per-chunk cost is ~zero. This is the same tradeoff family as the architect-approved voice holdback (brief clean prefix may appear, then swaps to canonical).

**How to apply:**
- Both chat routes share ONE `prepareChat()` helper (distress scan pre-AI → PII redaction → context lines → RAG → untrusted-history quoting). Any new gate goes in the helper, never in one route only — smokes assert `function prepareChat` exists.
- NDJSON events: `delta` / `escalated` / `done` / `error`. Headers are sent lazily with the FIRST event so pre-stream failures keep clean HTTP statuses (400/502/503). Retry upstream ONLY if nothing was forwarded yet; after text went out, send `error` and let the client keep the partial + show retry.
- `res.on('close')` (guarded by `!res.writableEnded`) aborts the upstream Gemini stream via `abortSignal` in the SDK config — @google/genai supports `abortSignal` in GenerateContentConfig.

# Client contract (AvatarWidget + chatStream.ts)

- Newest question wins: supersede epoch (`sendEpochRef`) + AbortController; stale completions check epoch before touching state. Aborted partials are KEPT as finished bubbles (they were gated server-side).
- Stream renders are rAF-batched into ONE live bubble; the finished list is memoized (`MessageList` memo) — never re-render the thread per token.
- Hand-written NDJSON fetch reader with first-chunk (15s) + stall (20s) timeouts; transport failure → automatic fallback to the classic JSON route (same API, never a mock).
- Read-aloud speaks sentence-by-sentence during stream (cursor `spokenUpToRef`, boundary regex includes Devanagari danda `।`); finalization speaks only the unspoken tail.
- Client history cap must match the server window (`.slice(-8)`) — smoke greps for it.

# Voice session start latency

Mic/playback AudioContext + worklet graph builds IN PARALLEL with token mint + Live connect (`buildMicGraph()` kicked off right after getUserMedia; `wireMic()` joins graph+socket after onopen). getUserMedia must STAY before the token mint (single-use token would expire waiting on the permission prompt). stop() races handled by disposed-guards + closing half-built contexts.
