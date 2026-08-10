/**
 * Nyaya AI — "Your Rights Guide": the game's ONE AI assistant widget.
 *
 * The floating button is the user-supplied orange/white robot art
 * (assistant-bot.png, transparent PNG with its own circular frame — used
 * directly, never recreated in CSS). Mounted on BOTH the Home screen and
 * the in-world HUD (same component, shared session history).
 *
 * Powers (SIH "Nyaya AI" task + low-latency perf spec):
 *   - Gemini brain, STREAMING-FIRST: POST /api/nyaya-ai/chat-stream renders
 *     the reply progressively — first words appear as soon as the model
 *     produces them. Every increment is gated SERVER-SIDE before it is
 *     forwarded (fail-closed helpline output gate over the accumulated
 *     reply), so streamed text is always gated text. The classic JSON route
 *     (useNyayaAiChat) stays as the automatic fallback when the streaming
 *     transport is unavailable — same real API, never a mock.
 *   - Low-latency UX contract: newest question wins — sending a new message
 *     aborts the in-flight reply and its read-aloud (partial gated text is
 *     kept as a finished bubble); first-chunk/stall timeouts mean the
 *     widget can never hang on a dead request; failures show a friendly
 *     line plus a small retry chip. "Thinking..." flips to live text the
 *     moment the first chunk arrives.
 *   - REAL-TIME VOICE (Gemini Live API): tap the mic → continuous
 *     speech-to-speech conversation with live transcripts in this thread,
 *     barge-in interruption, and connecting/listening/thinking/speaking
 *     states shown as rings around the robot art. The browser only ever
 *     holds a single-use ephemeral token (model + child-safe system prompt
 *     are constraint-locked server-side); every finished transcript passes
 *     the deterministic /nyaya-ai/voice-guard gate. Graceful fallback to
 *     typing when the mic is denied or voice is unavailable.
 *   - SpeechSynthesis read-aloud of TEXT-chat replies stays as a separate,
 *     child-controlled toggle (en-IN / hi-IN). While a reply streams it is
 *     spoken SENTENCE BY SENTENCE as text arrives — playback starts with
 *     the first finished sentence, not after the whole reply.
 *   - Safe game context (zones/progress/lesson/nickname) for personalized,
 *     game-aware answers.
 *   - Static suggested-question chips until the first user message.
 *
 * Render performance (the game must stay smooth while the AI streams):
 *   - The finished-message list is memoized — streamed increments re-render
 *     only the single live bubble, never the whole thread.
 *   - Increments are batched through requestAnimationFrame: a burst of
 *     NDJSON events costs at most one render per frame.
 *
 * Safety posture (PRD §9):
 *   - The disclaimer line is HARD-CODED ("educational legal information,
 *     not professional legal advice") and permanently visible in the panel.
 *   - The intro identifies it as a computer helper, not a real lawyer/person.
 *   - Escalated replies (server's deterministic gates) highlight the
 *     helpline digits and open the SAME shared Get Help Now screen. A
 *     mid-stream escalation REPLACES the partial reply wholesale with the
 *     canonical text.
 *   - Conversation lives in memory only for the session (module-level, so
 *     it survives Home ↔ world transitions) — nothing is ever persisted
 *     (DPDP data minimization). Mic and speech hard-stop on close/unmount.
 */
import React, { useState, useEffect, useRef, memo } from 'react';
import {
  useNyayaAiChat,
  useNyayaAiVoiceToken,
  useNyayaAiVoiceGuard,
} from '@workspace/api-client-react';
import { progressStore } from '@/data/progressStore';
import { useUIStore, triggerHelpPulse, openHelp } from '@/ui/uiStore';
import { getZone } from '@/world/zones';
import { settingsStore } from '@/data/settingsStore';
import { getStrings, useStrings } from '@/i18n/strings';
import { getZoneGreeting, getLevelGreeting } from '@/i18n/greetings';
import { buildGameContext } from './gameContext';
import { streamNyayaAiChat, ChatStreamError } from './chatStream';
import { LiveVoiceEngine, type VoiceState } from './voice/liveVoice';
import { Mic, MicOff, Send, X, Volume2, VolumeX, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import assistantBotIcon from '@/assets/ui/assistant-bot.png';

/** BCP-47 tag for the currently selected app language (speech APIs). */
function currentSpeechLang(): string {
  return settingsStore.getState().language === 'hi' ? 'hi-IN' : 'en-IN';
}

// --- Assistant face: user-supplied robot icon (transparent PNG, own circular
// frame baked into the art — no extra background/border chrome behind it). ---
function AvatarFace({ speaking, className }: { speaking: boolean; className?: string }) {
  return (
    <div className={cn("w-12 h-12 md:w-16 md:h-16 select-none", speaking ? "animate-bounce" : "", className)}>
      <img
        src={assistantBotIcon}
        alt=""
        draggable={false}
        className="w-full h-full object-contain pointer-events-none"
      />
    </div>
  );
}

// --- Main Chat Widget ---
type Message = { role: 'user' | 'assistant'; content: string; escalated?: boolean };

/** Session-only history shared across mounts (Home screen ↔ world HUD). */
let sessionMessages: Message[] | null = null;

const MAX_SHOWN = 40; // rolling display window (memory bound, never persisted)

// Zone greetings are hard-coded, age-band-specific strings (PRD §9.8: never
// AI-generated). Task 10 moved them (EN + hand-written HI) to i18n/greetings.

/** One chat bubble (finished message). */
function MessageBubble({ msg }: { msg: Message }) {
  return (
    <div className={cn(
      "flex w-full",
      msg.role === 'user' ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "px-4 py-3 rounded-2xl max-w-[85%] text-[15px] font-medium leading-relaxed shadow-sm",
        msg.role === 'user'
          ? "bg-orange-500 text-white rounded-tr-sm"
          : "bg-white border border-slate-100 text-slate-700 rounded-tl-sm"
      )}>
        {msg.escalated ? (
          <EscalatedMessage text={msg.content} />
        ) : (
          msg.content
        )}
      </div>
    </div>
  );
}

/**
 * Memoized finished-message list: while a reply streams, per-frame updates
 * touch only the live streaming bubble — this whole list bails out of
 * re-rendering (perf spec: no unnecessary re-renders, game stays smooth).
 */
const MessageList = memo(function MessageList({ messages }: { messages: Message[] }) {
  return (
    <>
      {messages.map((msg, i) => (
        <MessageBubble key={i} msg={msg} />
      ))}
    </>
  );
});

export function AvatarWidget() {
  const { activeZoneId, activeLevel } = useUIStore();
  const t = useStrings();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessagesRaw] = useState<Message[]>(() => {
    if (!sessionMessages) {
      sessionMessages = [
        { role: 'assistant', content: getStrings(settingsStore.getState().language).guideIntro },
      ];
    }
    return sessionMessages;
  });
  const [input, setInput] = useState('');

  const [voiceState, setVoiceState] = useState<VoiceState | 'idle'>('idle');
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Streaming send state (perf spec): pending covers stream + fallback;
  // streamText is the ONE live bubble; retryText powers the retry chip.
  const [pending, setPending] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [retryText, setRetryText] = useState<string | null>(null);

  const chatMutation = useNyayaAiChat();
  const voiceTokenMutation = useNyayaAiVoiceToken();
  const voiceGuardMutation = useNyayaAiVoiceGuard();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Imperative live-voice engine — non-null only while a session runs.
  const voiceEngineRef = useRef<LiveVoiceEngine | null>(null);

  // Newest-question-wins machinery: the abort handle of the in-flight send,
  // a supersede epoch (stale completions must never touch fresh state), the
  // raw stream buffer, its rAF flush handle, and the read-aloud cursor.
  const sendAbortRef = useRef<AbortController | null>(null);
  const sendEpochRef = useRef(0);
  const streamBufRef = useRef('');
  const rafRef = useRef<number | null>(null);
  const spokenUpToRef = useRef(0);
  const lastSentRef = useRef('');
  const ttsEnabledRef = useRef(false);

  const setMessages = (updater: (prev: Message[]) => Message[]) => {
    setMessagesRaw((prev) => {
      const next = updater(prev).slice(-MAX_SHOWN);
      sessionMessages = next;
      return next;
    });
  };

  // Track previous zone to trigger greetings
  const prevZoneRef = useRef<string | null>(null);

  // --- read-aloud helpers (child-controlled TTS toggle) ---

  /** Queue one utterance BEHIND whatever is already speaking (stream mode). */
  const queueUtterance = (text: string) => {
    // Strip out Markdown bold markers for speech
    const cleanText = text.replace(/\*\*/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = currentSpeechLang();
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  /** Speak a whole reply, replacing anything queued (non-stream mode). */
  const speakText = (text: string) => {
    if (!ttsEnabledRef.current) return;
    window.speechSynthesis.cancel();
    queueUtterance(text);
  };

  /**
   * Read-aloud keeps pace with the stream: every COMPLETED sentence is
   * queued the moment it exists — playback starts with the first sentence,
   * never after the whole reply (perf spec voice-response rule).
   */
  const speakNewSentences = () => {
    if (!ttsEnabledRef.current) return;
    const text = streamBufRef.current;
    const re = /[.!?।][)"']*(\s+|$)/g;
    re.lastIndex = spokenUpToRef.current;
    let boundary = -1;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) boundary = m.index + m[0].length;
    if (boundary > spokenUpToRef.current) {
      const chunk = text.slice(spokenUpToRef.current, boundary).trim();
      spokenUpToRef.current = boundary;
      if (chunk) queueUtterance(chunk);
    }
  };

  // --- streaming render batcher (one render per frame, max) ---

  const flushStream = () => {
    rafRef.current = null;
    setStreamText(streamBufRef.current);
    speakNewSentences();
  };
  const scheduleStreamFlush = () => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(flushStream);
  };
  const stopStreamFlush = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  /**
   * Abort the in-flight reply (if any) and its read-aloud. keepPartial:
   * already-streamed text (gated server-side) becomes a finished bubble
   * instead of vanishing — the thread always matches what the child saw.
   */
  const cancelInFlight = (keepPartial: boolean) => {
    sendAbortRef.current?.abort();
    sendAbortRef.current = null;
    stopStreamFlush();
    const partial = streamBufRef.current.trim();
    streamBufRef.current = '';
    spokenUpToRef.current = 0;
    if (keepPartial && partial) {
      setMessages(prev => [...prev, { role: 'assistant', content: partial } as Message]);
    }
    setStreamText('');
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  // Privacy cleanup: hard-stop the live voice session, the in-flight reply
  // and speech when the panel closes or the widget unmounts — mic, audio
  // playback, fetches and the WebSocket must never keep running in the
  // background (closed = zero use).
  useEffect(() => {
    if (!isOpen) {
      voiceEngineRef.current?.stop();
      voiceEngineRef.current = null;
      setVoiceState('idle');
      cancelInFlight(true);
    }
    return () => {
      voiceEngineRef.current?.stop();
      voiceEngineRef.current = null;
      sendAbortRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (activeZoneId && activeZoneId !== prevZoneRef.current) {
      const zone = getZone(activeZoneId);
      if (zone) {
        setIsOpen(true);
        // Greeting language = the language selected when the zone is entered.
        const lang = settingsStore.getState().language;
        const bundle = getStrings(lang);
        const zoneStrings = bundle.zones[activeZoneId];
        const greeting =
          getZoneGreeting(activeZoneId, progressStore.getState().ageBand, lang) ??
          bundle.zoneWelcomeFallback(zoneStrings?.name ?? zone.name, zoneStrings?.theme ?? zone.theme);
        appendAssistantMessage(greeting);
      }
    }
    prevZoneRef.current = activeZoneId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeZoneId]);

  // Task 15: greet LEVEL entry too — a short, hard-coded, level-specific
  // line (never AI-generated). Quieter than zone entry: the message is
  // appended without force-opening the chat panel, so starting a level is
  // never interrupted mid-flow.
  const prevLevelRef = useRef<string | null>(null);
  useEffect(() => {
    const key = activeLevel ? `${activeLevel.zoneId}:${activeLevel.levelIndex}` : null;
    if (activeLevel && key !== prevLevelRef.current) {
      const zone = getZone(activeLevel.zoneId);
      if (zone) {
        const lang = settingsStore.getState().language;
        const bundle = getStrings(lang);
        const zoneName = bundle.zones[activeLevel.zoneId]?.name ?? zone.name;
        appendAssistantMessage(
          getLevelGreeting(activeLevel.levelIndex + 1, activeLevel.kind, zoneName, lang),
        );
      }
    }
    prevLevelRef.current = key;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLevel]);

  useEffect(() => {
    if (isOpen) {
      // While streaming, per-frame smooth scrolling would stack animations —
      // jump instantly instead; smooth only for discrete new bubbles.
      messagesEndRef.current?.scrollIntoView({ behavior: streamText ? 'auto' : 'smooth' });
    }
  }, [messages, isOpen, pending, streamText]);

  // TTS toggle: keep the ref in sync for stream callbacks; off = silence now.
  useEffect(() => {
    ttsEnabledRef.current = ttsEnabled;
    if (!ttsEnabled) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [ttsEnabled]);

  const appendAssistantMessage = (content: string, escalated?: boolean) => {
    setMessages(prev => [...prev, { role: 'assistant', content, escalated } as Message]);
    speakText(content);
  };

  const sendMessage = async (raw: string) => {
    const userText = raw.trim();
    if (!userText) return;
    // Duplicate-fire guard: the same chip/button tapped twice while its own
    // request is still running must not send twice (perf spec §9).
    if (pending && lastSentRef.current === userText) return;
    lastSentRef.current = userText;

    // NEWEST QUESTION WINS (perf spec §10): abort the in-flight reply and
    // its read-aloud; already-streamed gated text stays as a finished bubble.
    cancelInFlight(true);
    const epoch = ++sendEpochRef.current;
    const controller = new AbortController();
    sendAbortRef.current = controller;
    setRetryText(null);

    // Rolling context (client memory only, quoted server-side as untrusted).
    // Escalation texts are excluded: the canonical safety reply is not
    // conversational context and must never round-trip through the model.
    // Capped at the server's own window — extra turns were dead payload.
    const history = messages
      .filter(m => !m.escalated)
      .slice(-8)
      .map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, { role: 'user', content: userText } as Message]);
    setPending(true);

    const body = {
      message: userText.substring(0, 500),
      ageBand: progressStore.getState().ageBand,
      language: settingsStore.getState().language,
      history,
      gameContext: buildGameContext(),
    };
    const bundle = getStrings(settingsStore.getState().language);

    try {
      // STREAMING-FIRST: text renders as it is generated. Every delta was
      // already checked server-side (accumulated-reply output gate) before
      // it was forwarded — streamed text is gated text.
      const result = await streamNyayaAiChat(
        body,
        (delta) => {
          if (epoch !== sendEpochRef.current) return;
          streamBufRef.current += delta;
          scheduleStreamFlush();
        },
        controller.signal,
      );
      if (epoch !== sendEpochRef.current) return; // superseded mid-reply

      // Finalize: move the streamed text out of the live bubble.
      stopStreamFlush();
      const partial = streamBufRef.current;
      streamBufRef.current = '';
      setStreamText('');

      if (result.escalated) {
        // Fail-closed contract: the canonical hard-coded text REPLACES the
        // entire partial reply, and the real Get Help screen is one tap away
        // (same behavior as the classic route, Task 12 / PRD §9.1).
        spokenUpToRef.current = 0;
        appendAssistantMessage(result.reply, true);
        triggerHelpPulse();
        openHelp();
        return;
      }

      const finalText = (result.reply || partial).trim();
      if (finalText) {
        setMessages(prev => [...prev, { role: 'assistant', content: finalText } as Message]);
        // Sentences were read aloud while streaming; finish the tail only.
        if (ttsEnabledRef.current) {
          const tail = finalText.slice(spokenUpToRef.current).trim();
          if (tail) queueUtterance(tail);
        }
      }
      spokenUpToRef.current = 0;
      if (result.truncated) {
        // Upstream died mid-reply: keep the partial (honest, gated text),
        // say so in a friendly way, and offer a one-tap retry.
        if (!finalText) appendAssistantMessage(bundle.guideResting);
        setRetryText(userText);
      }
    } catch (error) {
      if (epoch !== sendEpochRef.current) return; // superseded — stay silent
      if (controller.signal.aborted) return; // panel closed / voice started
      stopStreamFlush();
      streamBufRef.current = '';
      setStreamText('');
      spokenUpToRef.current = 0;

      const streamKind = error instanceof ChatStreamError ? error.kind : undefined;
      const status = (error as { status?: number })?.status;
      if (status === 503) {
        appendAssistantMessage(bundle.nyayaAiNotConfigured);
      } else if (streamKind === 'timeout') {
        // Gemini took too long — never freeze: friendly line + retry chip.
        appendAssistantMessage(bundle.guideResting);
        setRetryText(userText);
      } else {
        // Streaming transport unavailable (old browser/buffering proxy) →
        // AUTOMATIC fallback to the classic JSON route. Same real API and
        // identical server-side safety contract — never a mock.
        try {
          const res = await chatMutation.mutateAsync({ data: body });
          if (epoch !== sendEpochRef.current) return;
          appendAssistantMessage(res.reply, res.escalated);
          if (res.escalated) {
            triggerHelpPulse();
            openHelp();
          }
        } catch (fallbackErr) {
          if (epoch !== sendEpochRef.current) return;
          const fallbackStatus = (fallbackErr as { status?: number })?.status;
          appendAssistantMessage(
            fallbackStatus === 503 ? bundle.nyayaAiNotConfigured : bundle.guideResting,
          );
          setRetryText(userText);
        }
      }
    } finally {
      if (epoch === sendEpochRef.current) {
        setPending(false);
        sendAbortRef.current = null;
      }
    }
  };

  const handleSend = () => {
    const text = input;
    setInput('');
    void sendMessage(text);
  };

  const stopVoice = () => {
    voiceEngineRef.current?.stop();
    voiceEngineRef.current = null;
    setVoiceState('idle');
  };

  // Tap the mic: start a FRESH Live session — or end the current one.
  const toggleVoice = () => {
    if (voiceEngineRef.current) {
      stopVoice();
      return;
    }
    // Voice and a streaming text reply must not talk over each other.
    cancelInFlight(true);
    setRetryText(null);
    const language = settingsStore.getState().language;
    const engine = new LiveVoiceEngine({
      getToken: async () => {
        // The server locks the model + child-safe system prompt (safety
        // rules + approved corpus + this safe game context) INSIDE the
        // single-use ephemeral token; no key or prompt ever reaches us.
        return await voiceTokenMutation.mutateAsync({
          data: {
            language,
            ageBand: progressStore.getState().ageBand,
            gameContext: buildGameContext(),
          },
        });
      },
      guardText: async (text, role) =>
        voiceGuardMutation.mutateAsync({
          data: { text: text.slice(0, 2000), role, language },
        }),
      onState: (s) => setVoiceState(s),
      onUserTranscript: (text) =>
        setMessages((prev) => [...prev, { role: 'user', content: text } as Message]),
      onModelTranscript: (text) =>
        setMessages((prev) => [...prev, { role: 'assistant', content: text } as Message]),
      onEscalated: (reply) => {
        // Engine has already fully stopped itself. Same escalation contract
        // as text chat: canonical hard-coded helpline text (never the
        // model's voice) + the real Get Help screen, one tap away.
        voiceEngineRef.current = null;
        setVoiceState('idle');
        if (reply) appendAssistantMessage(reply, true);
        triggerHelpPulse();
        openHelp();
      },
      onError: (kind) => {
        // Engine has already cleaned up. Friendly, typed-chat-first copy —
        // never a raw WebSocket/technical error (spec).
        voiceEngineRef.current = null;
        setVoiceState('idle');
        const bundle = getStrings(settingsStore.getState().language);
        appendAssistantMessage(
          kind === 'mic-denied'
            ? bundle.nyayaAiMicDeniedVoice
            : kind === 'unavailable'
              ? bundle.nyayaAiVoiceUnavailable
              : bundle.nyayaAiVoiceConnectFail,
        );
      },
    });
    voiceEngineRef.current = engine;
    void engine.start();
  };

  // Keyboard safety: Stop WASD/E propagation to game controls
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const voiceActive = voiceState !== 'idle';
  const voiceStateLabel =
    voiceState === 'connecting'
      ? t.nyayaAiConnecting
      : voiceState === 'listening'
        ? t.nyayaAiListening
        : voiceState === 'thinking'
          ? t.nyayaAiThinking
          : voiceState === 'speaking'
            ? t.nyayaAiSpeaking
            : '';

  const showSuggestions =
    !pending && !messages.some((m) => m.role === 'user');

  return (
    <div className="pointer-events-auto flex flex-col items-end">
      {isOpen && (
        <div className="w-[90vw] md:w-96 max-w-sm bg-white rounded-3xl shadow-2xl mb-4 border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

          {/* Header — robot art stays visible as the assistant's avatar */}
          <div className="bg-sky-50 px-4 py-3 border-b border-sky-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                {voiceActive && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'nyaya-voice-ring',
                      voiceState === 'speaking'
                        ? 'nyaya-ring-speaking'
                        : voiceState === 'thinking'
                          ? 'nyaya-ring-thinking'
                          : voiceState === 'connecting'
                            ? 'nyaya-ring-connecting'
                            : 'nyaya-ring-listening',
                    )}
                  />
                )}
                <AvatarFace speaking={speaking || voiceState === 'speaking'} />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-800 leading-tight">{t.yourGuide}</h3>
                <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">{t.aiCompanion}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  ttsEnabled ? "bg-sky-200 text-sky-700" : "bg-white text-slate-400 hover:bg-slate-100"
                )}
                aria-label={t.toggleVoice}
              >
                {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-white hover:bg-slate-100 text-slate-400 rounded-full transition-colors"
                aria-label={t.closeChat}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 min-h-[250px] max-h-[40vh] overflow-y-auto p-4 space-y-4 bg-slate-50">
            <MessageList messages={messages} />

            {/* The ONE live streaming bubble (server-gated text only) */}
            {streamText && (
              <div className="flex w-full justify-start">
                <div className="px-4 py-3 rounded-2xl max-w-[85%] text-[15px] font-medium leading-relaxed shadow-sm bg-white border border-slate-100 text-slate-700 rounded-tl-sm">
                  {streamText}
                </div>
              </div>
            )}

            {/* Lightweight state: flips to live text on the first chunk */}
            {pending && !streamText && (
              <div className="flex w-full justify-start">
                <div className="px-4 py-3 rounded-2xl bg-white border border-slate-100 text-slate-400 rounded-tl-sm shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-bold">{t.thinking}</span>
                </div>
              </div>
            )}

            {/* Small retry chip — request failed or timed out (spec §9) */}
            {retryText && !pending && (
              <div className="flex w-full justify-start">
                <button
                  onClick={() => void sendMessage(retryText)}
                  className="px-3 py-2 rounded-full bg-white border border-slate-200 text-[13px] font-semibold text-sky-600 hover:border-sky-300 hover:text-sky-700 transition-colors shadow-sm"
                >
                  {t.nyayaAiRetry}
                </button>
              </div>
            )}

            {/* Suggested questions (static, pre-approved starters) */}
            {showSuggestions && (
              <div className="pt-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t.nyayaAiSuggestedTitle}
                </p>
                <div className="flex flex-wrap gap-2">
                  {t.nyayaAiSuggested.map((q) => (
                    <button
                      key={q}
                      onClick={() => void sendMessage(q)}
                      className="px-3 py-2 rounded-full bg-white border border-slate-200 text-left text-[13px] font-semibold text-slate-600 hover:border-sky-300 hover:text-sky-700 transition-colors shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Permanent disclaimer — HARD-CODED, never AI-generated */}
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[11px] leading-snug font-semibold text-amber-800">
              {t.nyayaAiDisclaimer}
            </p>
          </div>

          {/* Voice status strip — friendly state labels, never raw errors */}
          {voiceActive && (
            <div className="px-4 py-2 bg-sky-50 border-t border-sky-100 flex items-center gap-2">
              {voiceState === 'connecting' ? (
                <Loader2 className="w-3.5 h-3.5 text-sky-500 animate-spin shrink-0" aria-hidden="true" />
              ) : (
                <span
                  aria-hidden="true"
                  className={cn(
                    'w-2.5 h-2.5 rounded-full shrink-0',
                    voiceState === 'listening' && 'bg-emerald-500 motion-safe:animate-pulse',
                    voiceState === 'thinking' && 'bg-amber-500 motion-safe:animate-pulse',
                    voiceState === 'speaking' && 'bg-sky-500 motion-safe:animate-pulse',
                  )}
                />
              )}
              <span className="text-xs font-bold text-sky-700" aria-live="polite">
                {voiceStateLabel}
              </span>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100">
            <div className="flex gap-2 items-center bg-slate-50 p-1.5 rounded-full border border-slate-200 focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
              <button
                onClick={toggleVoice}
                className={cn(
                  'p-2.5 rounded-full transition-colors shrink-0',
                  voiceState === 'idle' && 'bg-white text-slate-400 hover:text-sky-500 shadow-sm',
                  voiceState === 'connecting' && 'bg-slate-100 text-slate-500',
                  voiceState === 'listening' && 'bg-emerald-100 text-emerald-600 motion-safe:animate-pulse',
                  voiceState === 'thinking' && 'bg-amber-100 text-amber-600',
                  voiceState === 'speaking' && 'bg-sky-100 text-sky-600',
                )}
                aria-label={voiceActive ? t.nyayaAiVoiceStop : t.nyayaAiTapToTalk}
                title={voiceActive ? t.nyayaAiVoiceStop : t.nyayaAiTapToTalk}
              >
                {voiceState === 'connecting' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : voiceActive ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={voiceActive ? voiceStateLabel : t.askAnything}
                disabled={voiceActive}
                className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 px-2 text-[15px] font-medium text-slate-700 placeholder:text-slate-400 min-w-0 disabled:opacity-60"
                maxLength={500}
              />

              <button
                onClick={handleSend}
                disabled={!input.trim() || voiceActive}
                className="p-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full transition-colors shrink-0 shadow-sm"
                aria-label={t.yourGuide}
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            </div>
            {!voiceActive && (
              <p className="text-[11px] text-center font-semibold text-slate-400 mt-1.5">
                {t.nyayaAiMicHint}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Bubble Toggle — the robot art carries its own circular frame, so the
          button adds no background/border chrome; shadow follows the alpha.
          Subtle idle float keeps it friendly without neon/glow effects. */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-full transition-all hover:scale-105 active:scale-95 animate-in zoom-in duration-300 touch-manipulation [filter:drop-shadow(0_6px_12px_rgba(30,41,59,0.35))] motion-safe:animate-[nyaya-float_4s_ease-in-out_infinite]"
          aria-label={t.openGuide}
        >
          <AvatarFace speaking={false} className="w-14 h-14 md:w-20 md:h-20" />
        </button>
      )}
    </div>
  );
}

// Special component to highlight emergency numbers
function EscalatedMessage({ text }: { text: string }) {
  // Simple regex to bold and highlight the specific numbers
  const parts = text.split(/(1098|155260)/g);

  return (
    <span>
      {parts.map((part, i) => {
        if (part === '1098' || part === '155260') {
          return <strong key={i} className="text-red-600 bg-red-50 px-1 rounded-md text-lg">{part}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
