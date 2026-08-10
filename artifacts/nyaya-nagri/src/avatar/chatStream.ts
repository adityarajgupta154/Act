/**
 * Nyaya AI — hand-written streaming chat client (NDJSON over fetch).
 *
 * The generated JSON client cannot read a chunked NDJSON body, so this small
 * reader lives alongside it. Server contract (POST /api/nyaya-ai/chat-stream):
 *
 *   {"type":"delta","text":"..."}   gated increment of the reply — the server
 *                                   runs its fail-closed helpline output gate
 *                                   over the ACCUMULATED reply before every
 *                                   forward, so a delta is always gated text.
 *   {"type":"escalated","reply":x}  canonical escalation text — the caller
 *                                   REPLACES the whole partial bubble with it.
 *   {"type":"done"}                 reply finished cleanly.
 *   {"type":"error"}                upstream died mid-reply — the caller keeps
 *                                   the partial text and offers a retry.
 *
 * Latency guards (perf spec: the widget must never freeze or hang):
 *   - FIRST_CHUNK_TIMEOUT_MS to the first byte, else abort → kind 'timeout'.
 *   - STALL_TIMEOUT_MS between reads afterwards.
 * Both abort the fetch, which lets the server cancel its upstream Gemini
 * call too (its res 'close' listener). The caller's own AbortSignal wins the
 * newest-question-wins race: aborting it kills this request instantly.
 */

export interface ChatStreamBody {
  message: string;
  ageBand?: string;
  language?: string;
  history?: { role: string; content: string }[];
  gameContext?: unknown;
}

export interface ChatStreamResult {
  /** Full reply text (empty when escalated before any delta). */
  reply: string;
  /** Canonical escalation: `reply` is the hard-coded helpline text. */
  escalated: boolean;
  /** Upstream died mid-reply — partial text kept, caller offers retry. */
  truncated: boolean;
}

export type ChatStreamErrorKind = 'http' | 'timeout' | 'network' | 'unsupported';

export class ChatStreamError extends Error {
  readonly kind: ChatStreamErrorKind;
  readonly status?: number;
  constructor(kind: ChatStreamErrorKind, status?: number) {
    super(`chat stream failed: ${kind}${status ? ` (${status})` : ''}`);
    this.kind = kind;
    this.status = status;
  }
}

const FIRST_CHUNK_TIMEOUT_MS = 15000;
const STALL_TIMEOUT_MS = 20000;

/**
 * Stream one Nyaya AI reply. `onDelta` fires for every gated increment;
 * the resolved result carries the final semantics (done/escalated/truncated).
 * Throws ChatStreamError for transport-level failures (caller may fall back
 * to the classic JSON route) and rethrows the caller's own AbortError.
 */
export async function streamNyayaAiChat(
  body: ChatStreamBody,
  onDelta: (text: string) => void,
  outerSignal: AbortSignal,
): Promise<ChatStreamResult> {
  const ctrl = new AbortController();
  const onOuterAbort = () => ctrl.abort(outerSignal.reason);
  if (outerSignal.aborted) ctrl.abort(outerSignal.reason);
  else outerSignal.addEventListener('abort', onOuterAbort);

  let timer: number | null = null;
  let timedOut = false;
  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
  const armTimer = (ms: number) => {
    clearTimer();
    timer = window.setTimeout(() => {
      timedOut = true;
      ctrl.abort();
    }, ms);
  };

  try {
    armTimer(FIRST_CHUNK_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch('/api/nyaya-ai/chat-stream', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/x-ndjson',
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    } catch (err) {
      if (timedOut) throw new ChatStreamError('timeout');
      if (outerSignal.aborted) throw err; // caller cancelled — not a failure
      throw new ChatStreamError('network');
    }
    if (!res.ok) throw new ChatStreamError('http', res.status);
    if (!res.body) throw new ChatStreamError('unsupported'); // no ReadableStream

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let reply = '';

    // One NDJSON line → terminal result, or null to keep reading.
    const handleLine = (line: string): ChatStreamResult | null => {
      let ev: { type?: string; text?: string; reply?: string };
      try {
        ev = JSON.parse(line) as typeof ev;
      } catch {
        return null; // defensive: never let one bad line kill the reply
      }
      if (ev.type === 'delta' && typeof ev.text === 'string') {
        reply += ev.text;
        onDelta(ev.text);
        return null;
      }
      if (ev.type === 'escalated') {
        return {
          reply: typeof ev.reply === 'string' ? ev.reply : '',
          escalated: true,
          truncated: false,
        };
      }
      if (ev.type === 'done') return { reply, escalated: false, truncated: false };
      if (ev.type === 'error') return { reply, escalated: false, truncated: true };
      return null;
    };

    // Drain every COMPLETE line currently in the buffer.
    const drainLines = (): ChatStreamResult | null => {
      let nl: number;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        const result = handleLine(line);
        if (result) return result;
      }
      return null;
    };

    try {
      armTimer(FIRST_CHUNK_TIMEOUT_MS); // time to the first streamed event
      for (;;) {
        let chunk: ReadableStreamReadResult<Uint8Array>;
        try {
          chunk = await reader.read();
        } catch (err) {
          if (timedOut) throw new ChatStreamError('timeout');
          if (outerSignal.aborted) throw err;
          throw new ChatStreamError('network');
        }
        if (chunk.done) break;
        armTimer(STALL_TIMEOUT_MS);
        buf += decoder.decode(chunk.value, { stream: true });
        const result = drainLines();
        if (result) return result;
      }
      // Connection ended: flush the decoder and honor a final event that
      // arrived WITHOUT a trailing newline — a terminal line still counts.
      buf += decoder.decode();
      const drained = drainLines();
      if (drained) return drained;
      const tail = buf.trim();
      if (tail) {
        const last = handleLine(tail);
        if (last) return last;
      }
      // No terminal event at all — the connection was cut mid-reply.
      return { reply, escalated: false, truncated: true };
    } finally {
      // Release the connection on EVERY exit — early terminal returns,
      // timeouts and network throws included.
      void reader.cancel().catch(() => undefined);
    }
  } finally {
    clearTimer();
    outerSignal.removeEventListener('abort', onOuterAbort);
  }
}
