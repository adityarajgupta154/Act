/**
 * Nyaya AI — Sarvam AI voice engine (turn-based, Hindi-first).
 *
 * Architecture (replaces the Gemini Live WebSocket):
 *   mic → WebAudio VAD → detect speech start/end →
 *   collect PCM16 → pack WAV → POST /api/nyaya-ai/sarvam-voice →
 *   server: Sarvam STT + Gemini LLM + Sarvam TTS →
 *   receive audio + transcripts → play back → repeat.
 *
 * Same public interface as LiveVoiceEngine (VoiceState, VoiceErrorKind,
 * start(), stop()) so AvatarWidget only needs a 1-line engine swap.
 *
 * Safety: all safety gates run SERVER-SIDE inside the pipeline route.
 * The client never touches raw safety decisions — it only acts on the
 * escalated flag the server returns (same "fail closed" contract as voice guard).
 *
 * Privacy: audio lives in JS memory only while recording; nothing stored.
 */

export type VoiceState = 'connecting' | 'listening' | 'thinking' | 'speaking';
export type VoiceErrorKind = 'mic-denied' | 'unavailable' | 'connect-failed';

export interface SarvamVoiceCallbacks {
  onState(state: VoiceState): void;
  onUserTranscript(text: string): void;
  onModelTranscript(text: string): void;
  onEscalated(reply: string): void;
  onError(kind: VoiceErrorKind): void;
}

interface SarvamVoiceOptions {
  language?: 'en' | 'hi';
  ageBand?: string;
  gameContext?: unknown;
  getHistory?(): { role: string; content: string }[];
  debugLatency?: boolean;
}

// VAD thresholds
const SPEECH_THRESHOLD = 0.015;     // RMS amplitude to start recording
const SILENCE_DURATION_MS = 800;    // ms of silence before sending
const MIN_SPEECH_MS = 250;          // ignore micro-bursts (noise)
const MAX_RECORD_MS = 30_000;       // max single utterance
const FFT_SIZE = 256;
const MIC_SAMPLE_RATE = 16_000;     // Sarvam STT expects 16kHz

/** Worklet: batches mic Float32 frames into ~2048-sample chunks. */
const MIC_WORKLET_SRC = `
class NyayaSarvamCapture extends AudioWorkletProcessor {
  constructor() { super(); this._chunks = []; this._len = 0; }
  process(inputs) {
    const ch = inputs[0]?.[0];
    if (ch?.length) {
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
registerProcessor('nyaya-sarvam-capture', NyayaSarvamCapture);
`;

/** Float32 PCM → Int16 PCM */
function floatToI16(f32: Float32Array): Int16Array {
  const i16 = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]));
    i16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return i16;
}

/** Concatenate multiple Int16Array chunks into one. */
function concatI16(chunks: Int16Array[]): Int16Array {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Int16Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

/** Pack PCM16 as a WAV file and return base64. */
function packWavBase64(pcm16: Int16Array, sampleRate: number): string {
  const dataLen = pcm16.byteLength;
  const buf = new ArrayBuffer(44 + dataLen);
  const view = new DataView(buf);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataLen, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);   // PCM
  view.setUint16(22, 1, true);   // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataLen, true);
  new Uint8Array(buf, 44).set(new Uint8Array(pcm16.buffer));
  // base64 encode
  const bytes = new Uint8Array(buf);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK)
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(bin);
}

/** Decode a base64 audio string into an ArrayBuffer. */
function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return buf;
}

export class SarvamVoiceEngine {
  private cb: SarvamVoiceCallbacks;
  private opts: SarvamVoiceOptions;
  private disposed = false;

  private mediaStream: MediaStream | null = null;
  private micCtx: AudioContext | null = null;
  private micNode: AudioWorkletNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;

  private playCtx: AudioContext | null = null;
  private nextStartTime = 0;
  private activeSources = new Set<AudioBufferSourceNode>();

  // VAD state
  private recording = false;
  private speechStartTime = 0;
  private silenceStart = 0;
  private pcmChunks: Int16Array[] = [];
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private maxTimer: ReturnType<typeof setTimeout> | null = null;
  private vadTimer: ReturnType<typeof setInterval> | null = null;

  // Turn lock: only one inflight request at a time
  private inflight = false;

  constructor(callbacks: SarvamVoiceCallbacks, opts: SarvamVoiceOptions = {}) {
    this.cb = callbacks;
    this.opts = opts;
  }

  async start(): Promise<void> {
    try {
      this.setState('connecting');

      if (typeof AudioWorkletNode === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw this.voiceError('unavailable');
      }

      // Mic
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch (e) {
        const name = (e as DOMException)?.name;
        throw this.voiceError(
          name === 'NotAllowedError' || name === 'PermissionDeniedError'
            ? 'mic-denied'
            : 'unavailable',
        );
      }
      if (this.disposed) { for (const t of stream.getTracks()) t.stop(); return; }
      this.mediaStream = stream;

      // Build audio graph
      this.micCtx = new AudioContext({ sampleRate: MIC_SAMPLE_RATE });
      await this.micCtx.resume().catch(() => undefined);

      const workletUrl = URL.createObjectURL(new Blob([MIC_WORKLET_SRC], { type: 'application/javascript' }));
      try { await this.micCtx.audioWorklet.addModule(workletUrl); }
      finally { URL.revokeObjectURL(workletUrl); }

      if (this.disposed) return;

      this.micSource = this.micCtx.createMediaStreamSource(stream);
      this.micNode = new AudioWorkletNode(this.micCtx, 'nyaya-sarvam-capture');
      this.analyser = this.micCtx.createAnalyser();
      this.analyser.fftSize = FFT_SIZE;

      // Playback context — use native sample rate; decodeAudioData handles conversion
      this.playCtx = new AudioContext();
      await this.playCtx.resume().catch(() => undefined);

      if (this.disposed) return;

      // Wire: mic → analyser (for VAD) + worklet (for PCM collection)
      this.micSource.connect(this.analyser);
      this.micSource.connect(this.micNode);

      // PCM collection
      this.micNode.port.onmessage = (ev: MessageEvent<Float32Array>) => {
        if (!this.recording || this.disposed) return;
        this.pcmChunks.push(floatToI16(ev.data));
      };

      // VAD polling every 50ms
      this.vadTimer = setInterval(() => this.vadTick(), 50);

      this.setState('listening');
    } catch (e) {
      if (this.disposed) return;
      this.fail((e as { voiceKind?: VoiceErrorKind })?.voiceKind ?? 'connect-failed');
    }
  }

  stop(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.clearTimers();

    try { this.micNode?.port.close(); } catch { /* noop */ }
    try { this.micNode?.disconnect(); } catch { /* noop */ }
    try { this.micSource?.disconnect(); } catch { /* noop */ }
    try { this.analyser?.disconnect(); } catch { /* noop */ }
    this.micNode = null; this.micSource = null; this.analyser = null;

    for (const t of this.mediaStream?.getTracks() ?? []) { try { t.stop(); } catch { /* noop */ } }
    this.mediaStream = null;

    this.stopPlayback();

    void this.micCtx?.close().catch(() => undefined);
    void this.playCtx?.close().catch(() => undefined);
    this.micCtx = null; this.playCtx = null;
    this.pcmChunks = [];
  }

  // ── VAD ──────────────────────────────────────────────────────────────────

  private vadTick(): void {
    if (this.disposed || !this.analyser || this.inflight) return;

    const buf = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buf);
    let rms = 0;
    for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / buf.length);

    if (!this.recording) {
      if (rms > SPEECH_THRESHOLD) {
        // Speech start
        this.recording = true;
        this.speechStartTime = Date.now();
        this.silenceStart = 0;
        this.pcmChunks = [];
        this.maxTimer = setTimeout(() => this.sendRecording(), MAX_RECORD_MS);
      }
    } else {
      if (rms < SPEECH_THRESHOLD) {
        if (this.silenceStart === 0) this.silenceStart = Date.now();
        const silenceMs = Date.now() - this.silenceStart;
        if (silenceMs >= SILENCE_DURATION_MS) {
          const speechMs = Date.now() - this.speechStartTime;
          if (speechMs >= MIN_SPEECH_MS + SILENCE_DURATION_MS) {
            this.sendRecording();
          } else {
            // Too short — discard (noise burst)
            this.recording = false;
            this.pcmChunks = [];
            this.clearMaxTimer();
          }
        }
      } else {
        this.silenceStart = 0; // reset silence window on new speech
      }
    }
  }

  private async sendRecording(): Promise<void> {
    if (this.disposed || this.inflight) return;
    this.recording = false;
    this.clearMaxTimer();

    const chunks = this.pcmChunks;
    this.pcmChunks = [];

    if (chunks.length === 0) return;

    const pcm16 = concatI16(chunks);
    const audioBase64 = packWavBase64(pcm16, MIC_SAMPLE_RATE);

    this.inflight = true;
    this.setState('thinking');

    try {
      const body = {
        audioBase64,
        language: this.opts.language ?? 'hi',
        ageBand: this.opts.ageBand,
        gameContext: this.opts.gameContext,
        history: this.opts.getHistory?.() ?? [],
      };

      const res = await fetch('/api/nyaya-ai/sarvam-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(25_000),
      });

      if (this.disposed) return;

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`sarvam-voice ${res.status}: ${errText}`);
      }

      const data = (await res.json()) as {
        userTranscript?: string;
        modelTranscript?: string;
        audioBase64?: string;
        escalated?: boolean;
        empty?: boolean;
        error?: string;
      };

      if (this.disposed) return;

      if (data.empty) {
        // Server got silence / no transcript
        this.inflight = false;
        this.setState('listening');
        return;
      }

      if (data.userTranscript) {
        this.cb.onUserTranscript(data.userTranscript);
      }

      if (data.escalated) {
        this.stop();
        this.cb.onEscalated(data.modelTranscript ?? '');
        return;
      }

      if (data.modelTranscript) {
        this.cb.onModelTranscript(data.modelTranscript);
      }

      // Play TTS audio via Web Audio decodeAudioData (handles any WAV format)
      if (data.audioBase64 && this.playCtx && !this.disposed) {
        this.setState('speaking');
        try {
          await this.decodeAndPlay(data.audioBase64);
        } catch {
          // Decode failed — go back to listening silently
          this.inflight = false;
          this.setState('listening');
        }
      } else {
        this.inflight = false;
        this.setState('listening');
      }
    } catch (err) {
      if (this.disposed) return;
      // eslint-disable-next-line no-console
      if (this.opts.debugLatency) console.debug('[sarvam-voice] turn error', err);
      // Don't kill the session on a single turn failure — just go back to listening
      this.inflight = false;
      this.setState('listening');
    }
  }

  // ── Playback ──────────────────────────────────────────────────────────────

  /** Decode a base64 WAV/audio string and play it via Web Audio. */
  private async decodeAndPlay(audioBase64: string): Promise<void> {
    if (!this.playCtx || this.disposed) return;
    const arrayBuf = base64ToArrayBuffer(audioBase64);
    // decodeAudioData handles WAV format + sample-rate conversion natively
    const audioBuf = await this.playCtx.decodeAudioData(arrayBuf);
    if (this.disposed) return;
    const src = this.playCtx.createBufferSource();
    src.buffer = audioBuf;
    src.connect(this.playCtx.destination);
    this.nextStartTime = Math.max(this.playCtx.currentTime, this.nextStartTime);
    src.start(this.nextStartTime);
    this.nextStartTime += audioBuf.duration;
    this.activeSources.add(src);
    return new Promise((resolve) => {
      src.onended = () => {
        this.activeSources.delete(src);
        if (!this.disposed && this.activeSources.size === 0) {
          this.inflight = false;
          this.setState('listening');
        }
        resolve();
      };
    });
  }

  private stopPlayback(): void {
    for (const src of this.activeSources) {
      try { src.onended = null; src.stop(); } catch { /* noop */ }
    }
    this.activeSources.clear();
    this.nextStartTime = 0;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private setState(s: VoiceState): void {
    if (this.disposed) return;
    this.cb.onState(s);
  }

  private fail(kind: VoiceErrorKind): void {
    const wasDisposed = this.disposed;
    this.stop();
    if (!wasDisposed) this.cb.onError(kind);
  }

  private clearTimers(): void {
    if (this.silenceTimer) { clearTimeout(this.silenceTimer); this.silenceTimer = null; }
    if (this.vadTimer) { clearInterval(this.vadTimer); this.vadTimer = null; }
    this.clearMaxTimer();
  }

  private clearMaxTimer(): void {
    if (this.maxTimer) { clearTimeout(this.maxTimer); this.maxTimer = null; }
  }

  private voiceError(kind: VoiceErrorKind): Error & { voiceKind: VoiceErrorKind } {
    return Object.assign(new Error(kind), { voiceKind: kind });
  }
}
