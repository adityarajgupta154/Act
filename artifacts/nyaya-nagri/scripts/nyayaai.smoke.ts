/**
 * Nyaya AI smoke — single-assistant consolidation + widget invariants.
 *
 * File/grep-based checks (no DOM): verifies the SIH "ONE AI assistant"
 * requirement — the green scales Legal Buddy is completely gone, the
 * orange/white robot (AvatarWidget) is the only assistant, rebranded
 * "Nyaya AI", Gemini-wired, voice-capable, disclaimer always visible,
 * and no API key anywhere in client source.
 *
 * Run from artifacts/nyaya-nagri:  pnpm exec tsx scripts/nyayaai.smoke.ts
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');

let failures = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    console.log(`  ok  ${name}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${name}`);
  }
}

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8');
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|css|html)$/.test(name)) out.push(p);
  }
  return out;
}

const widget = read('src/avatar/AvatarWidget.tsx');
const voiceEngine = read('src/avatar/voice/liveVoice.ts');
const gameCtx = read('src/avatar/gameContext.ts');
const hud = read('src/ui/HUD.tsx');
const home = read('src/home/HomeScreen.tsx');
const strings = read('src/i18n/strings.ts');
const css = read('src/index.css');
const allSrcFiles = walk(SRC);

console.log('— ONE assistant: green scales widget completely removed —');
check('src/legalbuddy directory deleted', !existsSync(join(SRC, 'legalbuddy')));
check(
  'no LegalBuddyWidget reference anywhere in src',
  allSrcFiles.every((f) => !readFileSync(f, 'utf8').includes('LegalBuddyWidget')),
);
check(
  'no legalBuddy i18n keys left',
  !strings.includes('legalBuddy'),
);
check('old legalbuddy smoke removed', !existsSync(join(ROOT, 'scripts/legalbuddy.smoke.ts')));
check(
  'no useLegalBuddyChat / useAvatarChat callers left',
  allSrcFiles.every((f) => {
    const s = readFileSync(f, 'utf8');
    return !s.includes('useLegalBuddyChat') && !s.includes('useAvatarChat');
  }),
);

console.log('— robot assistant (AvatarWidget → Nyaya AI) —');
check('robot image asset used directly', widget.includes("assistant-bot.png"));
check('robot art not recreated: <img> used', widget.includes('<img') && widget.includes('assistantBotIcon'));
check('Gemini route wired (useNyayaAiChat)', widget.includes('useNyayaAiChat'));
check('game context sent', widget.includes('gameContext: buildGameContext()'));
check('history sent (rolling, capped to server window)', widget.includes('.slice(-8)'));
check('suggestion chips wired', widget.includes('nyayaAiSuggested.map'));
check('permanent disclaimer bar wired', widget.includes('nyayaAiDisclaimer'));
check('503 → not-configured message', widget.includes('nyayaAiNotConfigured'));
check('read-aloud TTS toggle stays (speechSynthesis)', widget.includes('speechSynthesis'));
check('TTS language follows app language', widget.includes("'hi-IN' : 'en-IN'"));
check('Enter-to-send + game-key stopPropagation', widget.includes('stopPropagation') && widget.includes("e.key === 'Enter'"));
check('input capped at 500 chars', widget.includes('maxLength={500}'));
check('escalation opens shared Get Help screen', widget.includes('triggerHelpPulse') && widget.includes('openHelp'));
check('helpline digits highlighted in escalations', widget.includes('(1098|155260)'));
check('session-only memory (module store, no persistence)', widget.includes('sessionMessages'));
check(
  'no client-side chat persistence',
  !/localStorage|sessionStorage|indexedDB/i.test(widget),
);
check('idle float animation (subtle, motion-safe)', widget.includes('nyaya-float') && css.includes('@keyframes nyaya-float'));

console.log('— real-time voice (Gemini Live, ephemeral tokens) —');
check('voice mode wired (LiveVoiceEngine + tap toggle)', widget.includes('new LiveVoiceEngine') && widget.includes('toggleVoice'));
check('token minted server-side (useNyayaAiVoiceToken)', widget.includes('useNyayaAiVoiceToken'));
check(
  'transcript safety guard wired for BOTH roles',
  widget.includes('useNyayaAiVoiceGuard') &&
    voiceEngine.includes("'user'") &&
    voiceEngine.includes("'model'") &&
    voiceEngine.includes('guardText'),
);
check(
  'guard runs INCREMENTALLY while transcripts stream (mid-utterance)',
  voiceEngine.includes('scheduleIncrementalGuard') &&
    voiceEngine.includes('INC_GUARD_DEBOUNCE_MS'),
);
check(
  'guard failure fails CLOSED (voice ends; never unguarded voice)',
  voiceEngine.includes('FAILS CLOSED') &&
    !voiceEngine.toLowerCase().includes('fail open') &&
    !voiceEngine.toLowerCase().includes('fails open'),
);
check(
  'model text appended only after clean verdict (guard-before-append)',
  voiceEngine.includes('finalizeModel'),
);
check(
  'model AUDIO held back until first clean verdicts (playback holdback)',
  voiceEngine.includes('audioHoldback') &&
    voiceEngine.includes('pendingAudio') &&
    voiceEngine.includes('maybeReleaseAudio'),
);
check(
  'holdback is bounded: unverifiable audio DISCARDED, never played raw',
  voiceEngine.includes('HOLDBACK_MAX_WAIT_MS') && voiceEngine.includes('armHoldbackTimer'),
);
check(
  'stale verdicts cannot cross turns (epoch-scoped gate state)',
  voiceEngine.includes('turnEpoch') && voiceEngine.includes('userEpoch'),
);
check("engine connects with v1alpha ephemeral token as key", voiceEngine.includes("apiVersion: 'v1alpha'"));
check('16kHz PCM mic in / 24kHz native audio out', voiceEngine.includes('16000') && voiceEngine.includes('24000'));
check(
  'AudioWorklet capture (no deprecated ScriptProcessor)',
  voiceEngine.includes('AudioWorkletNode') && !voiceEngine.includes('createScriptProcessor'),
);
check('gapless scheduled playback queue', voiceEngine.includes('nextStartTime'));
check('barge-in interruption clears audio queue', voiceEngine.includes('interrupted') && voiceEngine.includes('stopPlayback'));
check(
  'live transcripts land in the shared chat thread',
  widget.includes('onUserTranscript') && widget.includes('onModelTranscript'),
);
check(
  'mic state labels wired (tap/listen/think/speak)',
  ['nyayaAiTapToTalk', 'nyayaAiListening', 'nyayaAiThinking', 'nyayaAiSpeaking'].every(
    (k) => widget.includes(k),
  ),
);
check(
  'voice i18n keys exist in interface + EN + HI (parity)',
  [
    'nyayaAiTapToTalk',
    'nyayaAiListening',
    'nyayaAiThinking',
    'nyayaAiSpeaking',
    'nyayaAiConnecting',
    'nyayaAiMicHint',
    'nyayaAiVoiceStop',
    'nyayaAiVoiceUnavailable',
    'nyayaAiVoiceConnectFail',
    'nyayaAiMicDeniedVoice',
  ].every((k) => (strings.match(new RegExp(k, 'g')) ?? []).length >= 3),
);
check(
  'robot rings are overlays only (PNG never distorted)',
  widget.includes('nyaya-voice-ring') &&
    css.includes('nyaya-ring-listening') &&
    css.includes('nyaya-ring-speaking') &&
    css.includes('prefers-reduced-motion'),
);
check(
  'friendly fallbacks: unavailable + connect-fail + mic-denied',
  widget.includes('nyayaAiVoiceUnavailable') &&
    widget.includes('nyayaAiVoiceConnectFail') &&
    widget.includes('nyayaAiMicDeniedVoice') &&
    voiceEngine.includes('NotAllowedError'),
);
check(
  'no raw WebSocket/technical errors in user-facing strings',
  !strings.toLowerCase().includes('websocket') &&
    !strings.toLowerCase().includes('api error') &&
    !strings.toLowerCase().includes('connection error'),
);
check(
  'voice escalation: session ends + canonical text + Help screen',
  voiceEngine.includes('onEscalated') &&
    widget.includes('appendAssistantMessage(reply, true)'),
);
check(
  'full cleanup: mic tracks, session, both AudioContexts',
  voiceEngine.includes('getTracks') &&
    voiceEngine.includes('session?.close') &&
    voiceEngine.includes('micCtx?.close') &&
    voiceEngine.includes('playCtx?.close') &&
    widget.includes('voiceEngineRef.current?.stop()'),
);
check(
  'old one-shot SpeechRecognition STT fully removed',
  !widget.includes('SpeechRecognition') && !widget.includes('webkitSpeechRecognition'),
);
check('static mic hint line wired', widget.includes('nyayaAiMicHint'));

console.log('— mounts: robot is the ONLY floating assistant —');
check('HUD mounts AvatarWidget (onboarded-gated)', hud.includes('{onboarded && <AvatarWidget />}'));
check('HUD has exactly one assistant mount', (hud.match(/<AvatarWidget \/>/g) ?? []).length === 1);
check('Home mounts AvatarWidget (reachable pre-game)', home.includes('<AvatarWidget />'));
check('Home has exactly one assistant mount', (home.match(/<AvatarWidget \/>/g) ?? []).length === 1);
check('Get Help Now untouched in HUD (HelpDialog present)', hud.includes('<HelpDialog'));

console.log('— i18n contract —');
check(
  'EXACT disclaimer string (EN)',
  strings.includes('This AI provides educational legal information, not professional legal advice.'),
);
check("name is 'Nyaya AI'", strings.includes("yourGuide: 'Nyaya AI'"));
check("subtitle 'Your Rights Guide'", strings.includes("aiCompanion: 'Your Rights Guide'"));
check(
  'all 5 spec quick prompts (EN)',
  [
    'What are my rights?',
    'Explain this zone',
    'What should I do online?',
    'Why is this important?',
    'Explain in simple words',
  ].every((q) => strings.includes(`'${q}'`)),
);
check('HI disclaimer present', strings.includes('पेशेवर कानूनी सलाह नहीं'));
check('HI quick prompts present', strings.includes('आसान शब्दों में समझाओ'));
check('greeting is Nyaya AI intro', strings.includes("I'm Nyaya AI"));
check(
  'helplines in strings stay Western digits (1098/155260 never localized)',
  strings.includes('1098') && strings.includes('155260') && !/[૦-૯०-९]/.test(strings),
);

console.log('— security: key never in client —');
check(
  'GEMINI_API_KEY never READ by frontend code (env access banned; i18n copy may name it)',
  allSrcFiles.every((f) => {
    const src = readFileSync(f, 'utf8');
    // The real invariant: client CODE never reads the key from any env.
    if (/(import\.meta\.env|process\.env)\s*(\.|\[)\s*['"]?\s*(VITE_)?GEMINI_API_KEY/.test(src)) return false;
    // The guardian-insights copy legitimately NAMES the server env var in
    // user-facing text ("AI observations need the server AI key ...").
    if (f.endsWith(join('i18n', 'strings.ts'))) return true;
    return !src.includes('GEMINI_API_KEY');
  }),
);
check(
  '@google/genai imported ONLY by the voice engine (ephemeral token use)',
  allSrcFiles.every((f) => {
    if (f.endsWith(join('avatar', 'voice', 'liveVoice.ts'))) return true;
    return !readFileSync(f, 'utf8').includes('@google/genai');
  }),
);
check(
  'voice engine never reads env/secrets itself',
  !voiceEngine.includes('process.env') && !voiceEngine.includes('import.meta.env'),
);
check(
  'no hardcoded Google API key pattern anywhere in src',
  allSrcFiles.every((f) => !/AIza[0-9A-Za-z_-]{20,}/.test(readFileSync(f, 'utf8'))),
);

console.log('— game context safety (data minimization) —');
check('nickname capped', gameCtx.includes('.slice(0, 24)'));
check('lesson title capped', gameCtx.includes('.slice(0, 120)'));
check('no coins/XP leaked to AI (no property reads)', !/\.coins\b/.test(gameCtx) && !/\.xp\b/.test(gameCtx));
check(
  'only whitelisted fields',
  ['nickname', 'currentZoneId', 'nearbyZoneId', 'completedZoneIds', 'progressPct', 'badgeCount', 'currentLessonTitle', 'currentLevelNumber']
    .every((k) => gameCtx.includes(k)),
);

console.log('— backend consolidation —');
const apiRoot = join(ROOT, '../api-server');
check('nyayaai route exists', existsSync(join(apiRoot, 'src/routes/nyayaai/index.ts')));
check('legalbuddy route deleted', !existsSync(join(apiRoot, 'src/routes/legalbuddy')));
check('old avatar chat route deleted', !existsSync(join(apiRoot, 'src/routes/avatar/index.ts')));
check(
  'shared safety module still in place',
  existsSync(join(apiRoot, 'src/routes/avatar/safety.ts')) &&
    existsSync(join(apiRoot, 'src/routes/avatar/prompt.ts')),
);
const apiIndex = readFileSync(join(apiRoot, 'src/routes/index.ts'), 'utf8');
check('router mounts nyayaai (no avatar/legalbuddy)', apiIndex.includes('nyayaai') && !apiIndex.includes('avatarRouter') && !apiIndex.includes('legalBuddyRouter'));
const spec = readFileSync(join(ROOT, '../../lib/api-spec/openapi.yaml'), 'utf8');
check('spec has /nyaya-ai/chat', spec.includes('/nyaya-ai/chat'));
check('spec has NO /avatar/chat or /legalbuddy/chat', !spec.includes('/avatar/chat') && !spec.includes('/legalbuddy/chat'));
check('spec gameContext schema present', spec.includes('NyayaAiGameContext'));
check(
  'spec has voice endpoints (token + guard)',
  spec.includes('/nyaya-ai/voice-token') && spec.includes('/nyaya-ai/voice-guard'),
);
check('voice route registered server-side', existsSync(join(apiRoot, 'src/routes/nyayaai/voice.ts')));
const corpus = readFileSync(join(apiRoot, 'src/routes/nyayaai/corpus.ts'), 'utf8');
check('India Code named as corpus source', corpus.includes('indiacode.nic.in'));

console.log('— low-latency streaming chat (perf spec) —');
{
  const chatStream = read('src/avatar/chatStream.ts');
  const apiNyaya = readFileSync(join(apiRoot, 'src/routes/nyayaai/index.ts'), 'utf8');
  check(
    'streaming-first send path (hand-written NDJSON reader)',
    widget.includes('streamNyayaAiChat') && chatStream.includes('chat-stream'),
  );
  check(
    'classic JSON route kept as automatic fallback (same real API)',
    widget.includes('chatMutation.mutateAsync'),
  );
  check(
    'newest question wins: abort + supersede epoch + kept partial',
    widget.includes('cancelInFlight') &&
      widget.includes('new AbortController()') &&
      widget.includes('sendEpochRef'),
  );
  check(
    'never hangs: first-chunk + stall timeouts abort the fetch',
    chatStream.includes('FIRST_CHUNK_TIMEOUT_MS') && chatStream.includes('STALL_TIMEOUT_MS'),
  );
  check(
    'failure shows retry chip (friendly, one tap)',
    widget.includes('setRetryText') && widget.includes('nyayaAiRetry'),
  );
  check(
    'retry i18n key present in interface + EN + HI',
    (strings.match(/nyayaAiRetry/g) ?? []).length >= 3,
  );
  check(
    'stream renders are frame-batched (no per-token re-render)',
    widget.includes('requestAnimationFrame'),
  );
  check(
    'finished bubbles memoized away from stream updates',
    widget.includes('<MessageList messages=') && widget.includes('memo(function MessageList'),
  );
  check(
    'read-aloud speaks sentence-by-sentence while streaming',
    widget.includes('speakNewSentences'),
  );
  check('server stream route exists (/nyaya-ai/chat-stream)', apiNyaya.includes('chat-stream'));
  check(
    'both routes share ONE preparation helper (gates cannot drift)',
    apiNyaya.includes('function prepareChat'),
  );
  check(
    'output gate runs on the ACCUMULATED reply BEFORE each forward',
    apiNyaya.includes('requiresCanonicalEscalation(full)'),
  );
  check(
    'upstream Gemini stream aborted when the client disconnects',
    apiNyaya.includes('upstreamAbort'),
  );
  check(
    'thinking disabled for fastest first token (both routes)',
    apiNyaya.includes('thinkingBudget: 0'),
  );
  check('spec documents /nyaya-ai/chat-stream', spec.includes('/nyaya-ai/chat-stream'));
}

if (failures > 0) {
  console.error(`\n${failures} Nyaya AI smoke check(s) FAILED`);
  process.exit(1);
}
console.log('\nAll Nyaya AI smoke checks passed.');
