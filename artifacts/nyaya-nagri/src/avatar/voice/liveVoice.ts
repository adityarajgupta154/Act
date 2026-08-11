/**
 * Nyaya AI — real-time voice engine (Gemini Live API over WebSocket).
 *
 * True speech-to-speech (NOT STT → text-chat → TTS):
 *   mic 16kHz PCM chunks → Live session → native 24kHz PCM audio replies,
 *   with server-side VAD, barge-in interruption and live transcripts.
 *
 * Security model (PRD §9 / spec):
 *   - The browser NEVER sees the server's Gemini API key (that secret name
 *     is deliberately not even mentioned here — the frontend smoke greps
 *     for it). It calls POST /nyaya-ai/voice-token,
 *     which mints a single-use, short-TTL ephemeral token whose model, voice,
 *     transcription settings and ENTIRE system instruction (safety rules +
 *     pre-approved corpus + safe game context) are locked server-side at mint
 *     time — nothing here can change or read the prompt.
 *   - Safety gate: transcripts (child AND model) stream through the
 *     deterministic /nyaya-ai/voice-guard (same shared safety module as text
 *     chat) INCREMENTALLY while each utterance is still being spoken, and
 *     once more when it finishes. escalated=true → audio stops mid-word, the
 *     session ENDS, and the widget shows the server's canonical helpline text
 *     (hard-coded, never model-generated). The model's finished utterance is
 *     only appended to the chat AFTER its guard verdict comes back clean —
 *     raw model text about helplines never reaches the thread.
 *   - PLAYBACK HOLDBACK: each model turn's audio is queued silently and only
 *     STARTS once (a) the child's finalized utterance and (b) the first slice
 *     of the model's transcript have BOTH come back clean from the gate
 *     (fast-path check, no debounce — costs roughly one round-trip). Gate
 *     state is scoped by turn/utterance epochs so a stale verdict from an
 *     earlier turn can never release a later turn's audio. If a turn's
 *     transcript never shows up, a bounded timer DISCARDS the held audio
 *     (never plays it unguarded) and returns to listening. While a turn
 *     keeps streaming after release, incremental re-checks can still stop
 *     it mid-word.
 *   - The gate fails CLOSED: if /nyaya-ai/voice-guard is unreachable (after a
 *     retry), the whole voice session ends with a friendly "voice unavailable"
 *     message. Voice never keeps running without its safety gate; typing
 *     (whose gate lives server-side in the chat route) stays available.
 *
 * Privacy: raw audio lives only in this tab's memory while the session runs;
 * nothing is recorded or persisted. stop() releases mic, playback, session,
 * AudioContexts and listeners — closed widget = zero resource use.
 *
 * LATENCY (perf spec): the mic/playback graph builds IN PARALLEL with the
 * token mint + socket connect (and when the mic permission is already
 * granted, the mint itself also overlaps getUserMedia — no prompt can
 * appear, so the single-use token cannot be burned waiting on a dialog);
 * VAD end-of-speech is tuned (600ms silence,
 * mirrored with the token constraint) so the model's turn starts sooner;
 * the child's utterance is flushed the moment the model's transcript starts
 * so the holdback usually waits only on the model's own first-slice check;
 * a connect watchdog guarantees "connecting" can never spin forever; and a
 * DEV-only instrumentation flag (debugLatency, injected by the widget —
 * this file never reads env itself) logs tap→listening and per-turn
 * first-audio/release timings. None of this weakens the holdback gate:
 * audio still never plays before its verdicts.
 */
import {
  EndSensitivity,
  GoogleGenAI,
  Modality,
  type LiveServerMessage,
  type Session,
} from '@google/genai';

export type VoiceState = 'connecting' | 'listening' | 'thinking' | 'speaking';
export type VoiceErrorKind = 'mic-denied' | 'unavailable' | 'connect-failed';

export interface VoiceEngineCallbacks {
  /** Mint the ephemeral Live token (server locks model+prompt inside it). */
  getToken(): Promise<{ token: string; model: string; expiresAt: string }>;
  /** Deterministic transcript safety gate (shared server safety module). */
  guardText(
    text: string,
    role: 'user' | 'model',
  ): Promise<{ escalated: boolean; reply?: string }>;
  onState(state: VoiceState): void;
  /** A finished utterance the child spoke (for the chat thread). */
  onUserTranscript(text: string): void;
  /** A finished, guard-cleared utterance Nyaya AI spoke (for the thread). */
  onModelTranscript(text: string): void;
  /** Guard fired: engine has already fully stopped; show canonical text. */
  onEscalated(reply: string): void;
  /** Fatal problem: engine has already fully stopped; show friendly text. */
  onError(kind: VoiceErrorKind): void;
}

/** Mic capture worklet: batches Float32 frames into ~2048-sample chunks. */
const MIC_WORKLET_SRC = `
class NyayaMicCapture extends AudioWorkletProcessor {
  constructor() { super(); this._chunks = []; this._len = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch && ch.length) {
      this._chunks.push(new Float32Array(ch));
      this._len += ch.length;
      if (this._len >= 2048) {
        const all = new Float32Array(this._len);
        let o = 0;
        for (const c of this._chunks) { all.set(c, o); o += c.length; }
        this._chunks = []; this._len = 0;
        this.port.postMessage(all, [all.buffer]);
      }
    }
    return true;
  }
}
registerProcessor('nyaya-mic-capture', NyayaMicCapture);
`;

const MIC_SAMPLE_RATE = 16000; // Live API expects 16kHz PCM16 mono in
const PLAY_SAMPLE_RATE = 24000; // Live API native audio is 24kHz PCM16 mono
/** Silence gap after the child's words before we show "Thinking..." —
 * aligned just past the VAD end-of-speech window so the label (and the
 * early user-gate flush it triggers) lands right as the server commits
 * the end of the utterance. */
const THINKING_AFTER_MS = 650;
/**
 * VAD end-of-speech silence window (ms). MUST stay identical to the value
 * locked inside the token constraints (api-server voice.ts) — a constrained
 * ephemeral token rejects a live.connect config that conflicts with it.
 */
const VAD_SILENCE_MS = 600;
/** Watchdog: never let the widget spin in "connecting" forever. */
const CONNECT_TIMEOUT_MS = 10000;
/** Debounce for the mid-utterance (incremental) safety checks. */
const INC_GUARD_DEBOUNCE_MS = 350;
/**
 * If held-back audio cannot be verified within this window (e.g. the turn
 * produced audio but its transcript never arrived), the audio is DISCARDED —
 * it is never played unguarded — and the engine returns to listening.
 */
const HOLDBACK_MAX_WAIT_MS = 4000;

function floatTo16BitPcmBase64(f32: Float32Array): string {
  const i16 = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]));
    i16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(i16.buffer);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function pcm16Base64ToFloat32(b64: string): Float32Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const i16 = new Int16Array(bytes.buffer, 0, Math.floor(bytes.length / 2));
  const f32 = new Float32Array(i16.length);
  for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768;
  return f32;
}

type GuardRole = 'user' | 'model';

export class LiveVoiceEngine {
  private cb: VoiceEngineCallbacks;
  private disposed = false;

  private mediaStream: MediaStream | null = null;
  private micCtx: AudioContext | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micNode: AudioWorkletNode | null = null;

  private playCtx: AudioContext | null = null;
  private nextStartTime = 0;
  private activeSources = new Set<AudioBufferSourceNode>();

  private session: Session | null = null;
  private opened = false;

  private userBuf = '';
  private modelBuf = '';
  private thinkTimer: ReturnType<typeof setTimeout> | null = null;
  private state: VoiceState = 'connecting';

  // Incremental guard machinery: one debounced, serialized checker per role,
  // re-checking the growing utterance so escalation triggers MID-speech
  // instead of waiting for the end of the turn.
  private incTimer: Record<GuardRole, ReturnType<typeof setTimeout> | null> = {
    user: null,
    model: null,
  };
  private incBusy: Record<GuardRole, boolean> = { user: false, model: false };
  private incDirty: Record<GuardRole, boolean> = { user: false, model: false };
  /** Longest text per role already verified clean (skip duplicate checks). */
  private lastClean: Record<GuardRole, string> = { user: '', model: '' };

  // Playback holdback: no model audio starts until the current turn's gates
  // are clean. Audio arriving early queues silently in pendingAudio.
  private audioHoldback = true;
  private pendingAudio: string[] = [];
  /** False while a finalized child utterance awaits its clean verdict. */
  private userGateClean = true;
  /** True once the current model turn's transcript has a clean verdict. */
  private modelGateClean = false;
  /** turnComplete arrived while audio was still held back. */
  private turnClosing = false;
  /** Bounded wait for held-back audio (discard on expiry — never play raw). */
  private holdbackTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * Epochs: async guard completions may only mutate gate state for the
   * turn/utterance that dispatched them. A stale verdict from a previous
   * turn must never release a later turn's audio.
   */
  private turnEpoch = 0;
  private userEpoch = 0;

  /** Bounded "connecting" phase (mint + socket open) — see start(). */
  private connectTimer: ReturnType<typeof setTimeout> | null = null;

  // DEV-only latency instrumentation (perf spec): timestamps for the session
  // ramp (tap→listening) and each turn's user-final → first-audio → release
  // path, plus per-call guard round-trip times. The flag is INJECTED by the
  // widget in dev builds — this engine never reads env itself (smoke-checked)
  // — and every hook is a no-op in production.
  private debug = false;
  private lat: Record<string, number> = {};

  // DEV-only mic-level meter (debug flag only): peak level + frame count per
  // ~2s window, logged to the console. Diagnoses "session listens but the
  // device mic delivers silence" without touching the audio path.
  private lvlPeak = 0;
  private lvlFrames = 0;
  private lvlLastLog = 0;

  constructor(callbacks: VoiceEngineCallbacks, opts?: { debugLatency?: boolean }) {
    this.cb = callbacks;
    this.debug = opts?.debugLatency === true;
  }

  private mark(key: string): void {
    if (this.debug) this.lat[key] = performance.now();
  }

  private latDelta(from: string, to: string): string {
    const a = this.lat[from];
    const b = this.lat[to];
    return a !== undefined && b !== undefined ? `${Math.round(b - a)}ms` : 'n/a';
  }

  private latLog(msg: string): void {
    // eslint-disable-next-line no-console -- DEV-only latency diagnostics
    if (this.debug) console.debug(`[voice-latency] ${msg}`);
  }

  /** DEV-only: track the mic level so silent-device problems are provable. */
  private meterFrame(frame: Float32Array): void {
    for (let i = 0; i < frame.length; i += 16) {
      const a = Math.abs(frame[i]);
      if (a > this.lvlPeak) this.lvlPeak = a;
    }
    this.lvlFrames++;
    const now = performance.now();
    if (this.lvlLastLog === 0) this.lvlLastLog = now;
    if (now - this.lvlLastLog >= 2000) {
      this.latLog(
        `mic-level peak=${this.lvlPeak.toFixed(4)} frames=${this.lvlFrames} ` +
          `(${this.lvlPeak < 0.005 ? 'SILENT — device is not delivering audio' : 'audio flowing'})`,
      );
      this.lvlPeak = 0;
      this.lvlFrames = 0;
      this.lvlLastLog = now;
    }
  }

  async start(): Promise<void> {
    try {
      this.setState('connecting');
      this.mark('start');
      if (
        typeof AudioWorkletNode === 'undefined' ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        throw Object.assign(new Error('voice unsupported'), {
          voiceKind: 'unavailable' as VoiceErrorKind,
        });
      }

      // LATENCY: when the mic permission is ALREADY granted the browser
      // prompt cannot appear, so getUserMedia resolves near-instantly — the
      // token mint (server hop + Google authTokens.create, ~400-500ms
      // measured) can safely overlap it instead of queueing behind it. When
      // a prompt IS possible the mint stays strictly AFTER the grant: a
      // child reading the dialog would outlive the token's 2-minute
      // session-start window and burn it (the reason this order exists).
      // If the mic still fails (revoked mid-session race), the unused token
      // simply expires server-side — it is never sent anywhere.
      let earlyToken: Promise<{ token: string; model: string; expiresAt: string }> | null =
        null;
      try {
        const perm = await navigator.permissions?.query?.({
          name: 'microphone' as PermissionName,
        });
        if (this.disposed) return; // closed while the (fast) query ran — mint nothing
        if (perm?.state === 'granted') {
          earlyToken = this.cb.getToken();
          earlyToken.catch(() => undefined); // failure surfaces on the awaited path
        }
      } catch {
        /* Permissions API unavailable (older Safari) → sequential order */
      }

      // Mic permission FIRST: never burn the single-use token on a denied mic.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        if (this.disposed) {
          // stop() ran while the mic was being acquired (widget closed mid-
          // prompt/mid-grant). stop() has already finished and will never run
          // again for this engine, so releasing the just-granted tracks HERE
          // is the only thing that keeps the mic indicator from staying on.
          for (const track of stream.getTracks()) {
            try {
              track.stop();
            } catch {
              /* noop */
            }
          }
          return;
        }
        this.mediaStream = stream;
      } catch (e) {
        const name = (e as DOMException)?.name;
        throw Object.assign(new Error('mic unavailable'), {
          voiceKind:
            name === 'NotAllowedError' ||
            name === 'SecurityError' ||
            name === 'PermissionDeniedError'
              ? ('mic-denied' as VoiceErrorKind)
              : ('unavailable' as VoiceErrorKind),
        });
      }
      if (this.disposed) return;
      this.mark('mic');

      // Watchdog STARTS ONLY NOW — after the mic is granted. It must never
      // run while the permission dialog is open (a child reading that dialog
      // is not a network problem). From here on, a mint + connect that
      // cannot finish within the window fails with the friendly copy
      // instead of leaving "Connecting..." spinning forever.
      this.connectTimer = setTimeout(() => {
        this.connectTimer = null;
        if (!this.disposed && !this.opened) this.fail('connect-failed');
      }, CONNECT_TIMEOUT_MS);

      // LATENCY: build the mic + playback graph IN PARALLEL with the token
      // mint and socket connect — AudioContext/worklet init (~100-250ms on
      // slower devices) never sits on the critical path to "listening".
      // Nothing touches the session until wireMic() runs after onopen.
      const micGraphReady = this.buildMicGraph();

      let tok: { token: string; model: string; expiresAt: string };
      try {
        tok = await (earlyToken ?? this.cb.getToken());
      } catch (e) {
        throw Object.assign(new Error('token mint failed'), {
          voiceKind:
            (e as { status?: number })?.status === 503
              ? ('unavailable' as VoiceErrorKind)
              : ('connect-failed' as VoiceErrorKind),
        });
      }
      if (this.disposed) return;
      this.mark('token');

      // Ephemeral token acts as the API key; v1alpha is required for tokens.
      const ai = new GoogleGenAI({
        apiKey: tok.token,
        httpOptions: { apiVersion: 'v1alpha' },
      });
      // Config mirrors the token's locked constraints (identical values) —
      // anything else here would be rejected by the constrained token.
      this.session = await ai.live.connect({
        model: tok.model,
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          // Same VAD tuning the token locks (see VAD_SILENCE_MS note above).
          realtimeInputConfig: {
            automaticActivityDetection: {
              endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_HIGH,
              silenceDurationMs: VAD_SILENCE_MS,
            },
          },
        },
        callbacks: {
          onopen: () => {
            this.opened = true;
            this.mark('open');
            if (this.connectTimer) {
              clearTimeout(this.connectTimer);
              this.connectTimer = null;
            }
            void this.wireMic(micGraphReady);
          },
          onmessage: (m: LiveServerMessage) => this.handleMessage(m),
          onerror: () => this.fail('connect-failed'),
          onclose: () => {
            // Unexpected end (network drop, session TTL) — friendly message,
            // never a raw WebSocket error.
            if (!this.disposed) this.fail(this.opened ? 'unavailable' : 'connect-failed');
          },
        },
      });
      if (this.disposed) {
        try {
          this.session.close();
        } catch {
          /* already gone */
        }
        return;
      }
    } catch (e) {
      if (this.disposed) return;
      this.fail((e as { voiceKind?: VoiceErrorKind })?.voiceKind ?? 'connect-failed');
    }
  }

  /** Full cleanup — idempotent, safe to call from anywhere. */
  stop(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.thinkTimer) clearTimeout(this.thinkTimer);
    this.thinkTimer = null;
    if (this.holdbackTimer) clearTimeout(this.holdbackTimer);
    this.holdbackTimer = null;
    if (this.connectTimer) clearTimeout(this.connectTimer);
    this.connectTimer = null;
    for (const role of ['user', 'model'] as GuardRole[]) {
      if (this.incTimer[role]) clearTimeout(this.incTimer[role]!);
      this.incTimer[role] = null;
    }

    try {
      this.micNode?.port.close();
    } catch {
      /* noop */
    }
    try {
      this.micNode?.disconnect();
    } catch {
      /* noop */
    }
    try {
      this.micSource?.disconnect();
    } catch {
      /* noop */
    }
    this.micNode = null;
    this.micSource = null;
    for (const track of this.mediaStream?.getTracks() ?? []) {
      try {
        track.stop();
      } catch {
        /* noop */
      }
    }
    this.mediaStream = null;

    this.stopPlayback();

    try {
      this.session?.close();
    } catch {
      /* noop */
    }
    this.session = null;

    void this.micCtx?.close().catch(() => undefined);
    void this.playCtx?.close().catch(() => undefined);
    this.micCtx = null;
    this.playCtx = null;
    this.userBuf = '';
    this.modelBuf = '';
  }

  // ---- internals ----

  private setState(s: VoiceState) {
    if (this.disposed) return;
    this.state = s;
    this.cb.onState(s);
  }

  private fail(kind: VoiceErrorKind) {
    const wasDisposed = this.disposed;
    this.stop();
    if (!wasDisposed) this.cb.onError(kind);
  }

  /**
   * Build the mic capture + playback graph. Runs IN PARALLEL with the token
   * mint and Live connect — nothing here touches the session; wireMic()
   * connects graph and socket once BOTH are ready. Returns false instead of
   * throwing so the caller can fail with the friendly 'unavailable' copy.
   */
  private async buildMicGraph(): Promise<boolean> {
    try {
      if (this.disposed || !this.mediaStream) return false;
      this.micCtx = new AudioContext({ sampleRate: MIC_SAMPLE_RATE });
      // Guarded: if the child closes the widget mid-connect, stop() may have
      // already closed this context — resume() on a closed context rejects.
      await this.micCtx.resume().catch(() => undefined);
      const workletUrl = URL.createObjectURL(
        new Blob([MIC_WORKLET_SRC], { type: 'application/javascript' }),
      );
      try {
        await this.micCtx.audioWorklet.addModule(workletUrl);
      } finally {
        URL.revokeObjectURL(workletUrl);
      }
      if (this.disposed || !this.mediaStream) return this.releaseHalfBuiltGraph();

      this.micSource = this.micCtx.createMediaStreamSource(this.mediaStream);
      this.micNode = new AudioWorkletNode(this.micCtx, 'nyaya-mic-capture');
      // Playback context up-front so the tap gesture unlocks it (iOS) —
      // created here (early) so it is ready before the first reply audio.
      this.playCtx = new AudioContext({ sampleRate: PLAY_SAMPLE_RATE });
      await this.playCtx.resume().catch(() => undefined);
      if (this.disposed) return this.releaseHalfBuiltGraph();
      this.mark('graph');
      return true;
    } catch {
      return false;
    }
  }

  /** stop() raced the parallel build: close contexts created after it ran. */
  private releaseHalfBuiltGraph(): boolean {
    void this.micCtx?.close().catch(() => undefined);
    void this.playCtx?.close().catch(() => undefined);
    return false;
  }

  /** Socket is open: wire the (already-built) mic graph into the session. */
  private async wireMic(ready: Promise<boolean>): Promise<void> {
    const ok = await ready;
    if (this.disposed) return;
    if (!ok || !this.micNode || !this.micSource) {
      this.fail('unavailable');
      return;
    }
    this.micNode.port.onmessage = (ev: MessageEvent<Float32Array>) => {
      if (this.disposed || !this.session) return;
      if (this.debug) this.meterFrame(ev.data);
      try {
        // Keeps streaming while the model speaks — that is what makes
        // natural barge-in interruption possible (server-side VAD).
        this.session.sendRealtimeInput({
          audio: {
            data: floatTo16BitPcmBase64(ev.data),
            mimeType: `audio/pcm;rate=${MIC_SAMPLE_RATE}`,
          },
        });
      } catch {
        /* socket mid-close; frames are droppable */
      }
    };
    this.micSource.connect(this.micNode);
    if (this.debug) {
      const track = this.mediaStream?.getAudioTracks()[0];
      if (track) {
        this.latLog(
          `mic-track "${track.label || 'unknown'}" muted=${track.muted} ` +
            `state=${track.readyState} micCtx=${this.micCtx?.state ?? 'n/a'}`,
        );
        track.onmute = () => this.latLog('mic-track MUTED by the system');
        track.onunmute = () => this.latLog('mic-track unmuted');
      }
    }
    this.setState('listening');
    this.mark('listening');
    this.latLog(
      `session: mic ${this.latDelta('start', 'mic')} | graph(parallel) ${this.latDelta('mic', 'graph')} | ` +
        `token ${this.latDelta('mic', 'token')} | connect ${this.latDelta('token', 'open')} | ` +
        `tap->listening ${this.latDelta('start', 'listening')}`,
    );
  }

  private handleMessage(msg: LiveServerMessage): void {
    if (this.disposed) return;
    const sc = msg.serverContent;
    if (!sc) return;

    // Barge-in: the child spoke over the reply. Kill queued audio instantly;
    // flush the partial spoken transcript so the chat matches what was heard.
    if (sc.interrupted) {
      this.stopPlayback();
      this.flushModel();
      this.resetTurnGates();
      this.setState('listening');
      return;
    }

    if (sc.inputTranscription?.text) {
      this.userBuf += sc.inputTranscription.text;
      if (this.state !== 'speaking') this.setState('listening');
      this.bumpThinkingTimer();
      // Check the child's words WHILE they speak — a distress disclosure must
      // trip the gate before (or while) the model starts replying.
      this.scheduleIncrementalGuard('user');
    }
    if (sc.outputTranscription?.text) {
      // Model reply started → the child's utterance is final. Flushing HERE
      // (transcript slices usually arrive before the first audio chunk)
      // starts the user-gate verdict one hop earlier, so the holdback
      // usually waits only on the model's own first-slice check.
      this.flushUser();
      this.modelBuf += sc.outputTranscription.text;
      // Check the model's speech WHILE it streams — helpline phrasing stops
      // playback mid-word instead of after the whole turn.
      this.scheduleIncrementalGuard('model');
    }

    for (const part of sc.modelTurn?.parts ?? []) {
      const data = part.inlineData?.data;
      if (typeof data === 'string' && data.length > 0) {
        // Model reply started → the child's utterance is final. Flush it now
        // so the transcript (and its safety check) never waits for the reply.
        this.flushUser();
        this.enqueueAudio(data);
      }
    }

    if (sc.turnComplete) {
      this.flushUser();
      this.flushModel();
      if (this.audioHoldback && this.pendingAudio.length > 0) {
        // Audio still held back — finalizeModel's verdict (same epoch) will
        // release it, then the gates reset; the holdback timer bounds the
        // wait and discards on expiry.
        this.turnClosing = true;
      } else {
        this.resetTurnGates();
      }
      if (this.activeSources.size === 0 && this.pendingAudio.length === 0) {
        this.setState('listening');
      }
    }
  }

  private bumpThinkingTimer(): void {
    if (this.thinkTimer) clearTimeout(this.thinkTimer);
    this.thinkTimer = setTimeout(() => {
      if (this.disposed || this.state === 'speaking') return;
      if (this.userBuf.trim()) {
        this.flushUser();
        this.setState('thinking');
      }
    }, THINKING_AFTER_MS);
  }

  /**
   * HOLDBACK GATE: while the current turn's transcripts are not yet verified
   * clean, audio queues silently. It is released (in arrival order) the
   * moment both gates are clean — or discarded on escalation/stop/timeout.
   */
  private enqueueAudio(b64: string): void {
    if (this.disposed) return;
    if (this.audioHoldback) {
      if (this.pendingAudio.length === 0) this.mark('turnFirstAudio');
      this.pendingAudio.push(b64);
      this.maybeReleaseAudio(); // gates may already be clean
      if (this.audioHoldback) {
        this.armHoldbackTimer();
        if (this.state === 'listening') {
          this.setState('thinking'); // audio exists but is still held back
        }
      }
      return;
    }
    this.playAudioNow(b64);
  }

  private playAudioNow(b64: string): void {
    if (!this.playCtx || this.disposed) return;
    const f32 = pcm16Base64ToFloat32(b64);
    if (f32.length === 0) return;
    const buf = this.playCtx.createBuffer(1, f32.length, PLAY_SAMPLE_RATE);
    buf.getChannelData(0).set(f32);
    const src = this.playCtx.createBufferSource();
    src.buffer = buf;
    src.connect(this.playCtx.destination);
    // Gapless: butt-joint each chunk to the previous one on the audio clock.
    this.nextStartTime = Math.max(this.playCtx.currentTime, this.nextStartTime);
    src.start(this.nextStartTime);
    this.nextStartTime += buf.duration;
    this.activeSources.add(src);
    src.onended = () => {
      this.activeSources.delete(src);
      if (!this.disposed && this.activeSources.size === 0 && this.state === 'speaking') {
        this.setState('listening');
      }
    };
    if (this.state !== 'speaking') this.setState('speaking');
  }

  private maybeReleaseAudio(): void {
    if (this.disposed || !this.audioHoldback) return;
    if (!this.userGateClean || !this.modelGateClean) return;
    this.audioHoldback = false;
    if (this.holdbackTimer) {
      clearTimeout(this.holdbackTimer);
      this.holdbackTimer = null;
    }
    const chunks = this.pendingAudio;
    this.pendingAudio = [];
    if (chunks.length > 0 && this.debug) {
      this.mark('turnRelease');
      this.latLog(
        `turn: user-final->first-audio ${this.latDelta('userFinal', 'turnFirstAudio')} | ` +
          `holdback ${this.latDelta('turnFirstAudio', 'turnRelease')}`,
      );
    }
    for (const c of chunks) this.playAudioNow(c);
    if (this.turnClosing) this.resetTurnGates();
  }

  /**
   * Bounded wait: if the gates cannot clear (e.g. audio arrived but its
   * transcript never did), DISCARD the held audio — never play it raw —
   * and go back to listening. The session itself stays healthy.
   */
  private armHoldbackTimer(): void {
    if (this.holdbackTimer || this.disposed) return;
    this.holdbackTimer = setTimeout(() => {
      this.holdbackTimer = null;
      if (this.disposed || !this.audioHoldback) return;
      this.pendingAudio = [];
      this.resetTurnGates();
      if (this.activeSources.size === 0) this.setState('listening');
    }, HOLDBACK_MAX_WAIT_MS);
  }

  /** Arm the holdback for the next model turn (advances the turn epoch). */
  private resetTurnGates(): void {
    this.turnEpoch++;
    delete this.lat.turnFirstAudio;
    delete this.lat.turnRelease;
    this.audioHoldback = true;
    this.modelGateClean = false;
    this.turnClosing = false;
    if (this.holdbackTimer) {
      clearTimeout(this.holdbackTimer);
      this.holdbackTimer = null;
    }
  }

  private stopPlayback(): void {
    for (const src of this.activeSources) {
      try {
        src.onended = null;
        src.stop();
      } catch {
        /* already ended */
      }
    }
    this.activeSources.clear();
    this.pendingAudio = [];
    this.nextStartTime = 0;
  }

  private flushUser(): void {
    const text = this.userBuf.trim();
    this.userBuf = '';
    if (this.thinkTimer) clearTimeout(this.thinkTimer);
    if (!text || this.disposed) return;
    // The child's own words are always shown to them; the guard decides
    // escalation in parallel. Model audio stays held back until this
    // utterance's verdict is clean (see maybeReleaseAudio).
    this.mark('userFinal');
    this.cb.onUserTranscript(text);
    if (text !== this.lastClean.user) {
      this.userEpoch++;
      this.userGateClean = false;
    }
    void this.finalizeGuard(text, 'user');
  }

  private flushModel(): void {
    const text = this.modelBuf.trim();
    this.modelBuf = '';
    if (!text || this.disposed) return;
    // Guard-before-append: the model's text reaches the thread ONLY after a
    // clean verdict. Escalated → canonical text is shown instead, never raw.
    void this.finalizeModel(text);
  }

  private async finalizeModel(text: string): Promise<void> {
    const epoch = this.turnEpoch;
    if (text === this.lastClean.model) {
      // Already verified clean mid-stream — append without a duplicate call.
      // Gate mutation stays epoch-scoped even here (defensive: this branch
      // must never mark a LATER turn's gate clean).
      if (epoch === this.turnEpoch) {
        this.modelGateClean = true;
        this.maybeReleaseAudio();
      }
      this.cb.onModelTranscript(text);
      return;
    }
    const verdict = await this.guardVerdict(text, 'model');
    if (this.disposed || !verdict) return; // failed closed or already stopped
    if (verdict.escalated) {
      this.escalate(verdict.reply);
      return;
    }
    this.lastClean.model = text;
    // Gate mutations are turn-scoped: a stale clean verdict from a finished
    // turn must never release the NEXT turn's held audio.
    if (epoch === this.turnEpoch) {
      this.modelGateClean = true;
      this.maybeReleaseAudio();
    }
    this.cb.onModelTranscript(text);
  }

  private async finalizeGuard(text: string, role: GuardRole): Promise<void> {
    const uEpoch = this.userEpoch;
    if (text === this.lastClean[role]) {
      if (role === 'user') {
        this.userGateClean = true;
        this.maybeReleaseAudio();
      }
      return; // already verified clean
    }
    const verdict = await this.guardVerdict(text, role);
    if (this.disposed || !verdict) return;
    if (verdict.escalated) {
      this.escalate(verdict.reply);
      return;
    }
    this.lastClean[role] = text;
    // Utterance-scoped: don't let an old utterance's verdict clear the gate
    // for a newer one still being checked.
    if (role === 'user' && uEpoch === this.userEpoch) {
      this.userGateClean = true;
      this.maybeReleaseAudio();
    }
  }

  private scheduleIncrementalGuard(role: GuardRole): void {
    if (this.disposed) return;
    // Fast path: the first slice of a held-back model turn is checked
    // IMMEDIATELY (no debounce) — this is what the playback release waits on.
    if (role === 'model' && this.audioHoldback && !this.modelGateClean) {
      if (this.incTimer[role]) {
        clearTimeout(this.incTimer[role]!);
        this.incTimer[role] = null;
      }
      void this.runIncrementalGuard(role);
      return;
    }
    if (this.incTimer[role]) clearTimeout(this.incTimer[role]!);
    this.incTimer[role] = setTimeout(() => {
      this.incTimer[role] = null;
      void this.runIncrementalGuard(role);
    }, INC_GUARD_DEBOUNCE_MS);
  }

  private async runIncrementalGuard(role: GuardRole): Promise<void> {
    if (this.disposed) return;
    if (this.incBusy[role]) {
      this.incDirty[role] = true;
      return;
    }
    const epoch = this.turnEpoch;
    const text = (role === 'user' ? this.userBuf : this.modelBuf).trim();
    if (!text) return;
    if (text === this.lastClean[role]) {
      // Identical text already verified clean (verdicts are content-based).
      // Still establish THIS turn's gate, else a verbatim-repeated model
      // phrase would leave its audio held back until the turn finalizes.
      if (role === 'model' && epoch === this.turnEpoch) {
        this.modelGateClean = true;
        this.maybeReleaseAudio();
      }
      return;
    }
    this.incBusy[role] = true;
    const verdict = await this.guardVerdict(text, role);
    this.incBusy[role] = false;
    if (this.disposed || !verdict) return; // failed closed or already stopped
    if (verdict.escalated) {
      this.escalate(verdict.reply);
      return;
    }
    this.lastClean[role] = text;
    if (role === 'model' && epoch === this.turnEpoch) {
      this.modelGateClean = true;
      this.maybeReleaseAudio();
    }
    if (this.incDirty[role]) {
      this.incDirty[role] = false;
      void this.runIncrementalGuard(role); // buffer grew while we checked
    }
  }

  /** Escalation contract: session is DEAD before the canonical text shows. */
  private escalate(reply: string | undefined): void {
    if (this.disposed) return;
    this.stop();
    this.cb.onEscalated(reply ?? '');
  }

  /**
   * Deterministic server-side gate call. Retries once on a transient network
   * problem; if the gate still cannot be reached the engine FAILS CLOSED —
   * the session ends with the friendly "voice unavailable" message rather
   * than continuing to run voice without its safety gate. Returns null when
   * that happened (or when the engine was disposed mid-flight).
   */
  private async guardVerdict(
    text: string,
    role: GuardRole,
  ): Promise<{ escalated: boolean; reply?: string } | null> {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (this.disposed) return null;
      try {
        const t0 = this.debug ? performance.now() : 0;
        const verdict = await this.cb.guardText(text, role);
        if (this.debug) {
          this.latLog(
            `guard[${role}] ${Math.round(performance.now() - t0)}ms (${text.length} chars)`,
          );
        }
        return verdict;
      } catch {
        /* transient network — retry once */
      }
    }
    if (!this.disposed) this.fail('unavailable');
    return null;
  }
}
