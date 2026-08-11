/**
 * Nyaya Nagri — Story Adventure narrator hook (the audio sequence
 * controller from the voice-guide spec, hardened by the strict
 * story-voice bug-fix spec).
 *
 * Runs the per-slide state machine on top of the Story Adventure's ONLY
 * audio engine (storyAdventureVoice — the Gemini story voice controller).
 * There is NO other voice: no browser TTS, no device TTS, no fallback
 * engine (strict single-voice spec §1/§6). If Gemini narration fails, the
 * engine publishes `unavailable`, the overlay shows the "tap to retry"
 * chip, and — because a failed sequence never fires onDone — no reminder
 * clock runs while the voice is down. retryVoice() re-attempts GEMINI.
 *
 *   narrative slide:  STORY_NARRATING → IDLE (silence, child taps Next)
 *   question slide:   QUESTION_READING → OPTION_1 → OPTION_2
 *                     → "your turn" cue → WAITING_FOR_ANSWER → (varied
 *                     REMINDER every 5s → WAITING…) until the child picks
 *   picked wrong:     feedback + "Try Again…" CTA, then quiet (no
 *                     reminders while feedback is showing; never
 *                     auto-advanced)
 *   picked correct:   praise + feedback + "Next…" CTA, then quiet —
 *                     the question voice system is DONE
 *   result slide:     completely SILENT (congratulations screens are
 *                     never narrated — strict spec §8)
 *
 * Hard rules implemented here (strict spec "MOST IMPORTANT REQUIREMENTS"):
 *  - ONE voice session per situation: the effect lifecycle IS the session
 *    boundary — every situation change (slide / pick / language / replay /
 *    suspend) first runs cleanup (timers cleared + engine stop), then the
 *    new situation speaks from scratch. Stale narration, stale promises or
 *    a previous slide's completion flag can never gate or pollute the next
 *    slide (§3/§11/§12); the engine's epoch counter discards any late
 *    callbacks from superseded sessions.
 *  - the overlay's click handlers also call storyAdventureVoice.stop()
 *    synchronously, so audio dies the same instant the child taps;
 *  - all reminder timers live in refs and are cleared on answer, Back,
 *    Next, replay, voice-off, chat-open (suspend), slide change and
 *    unmount — a reminder can never fire after the child has answered
 *    or left the question (§5);
 *  - reminders wait EXACTLY 5s after the options finish, then keep a 5s
 *    cadence while the child hasn't answered, cycling a pool of varied
 *    child-friendly lines — never the same sentence twice in a row (§4);
 *  - the congratulations / RESULT screen is silent — no reward line, no
 *    summary, no reminders, nothing queued (§8);
 *  - narration NEVER blocks the UI: everything remains tappable while
 *    speech plays, and unsupported browsers simply play silently;
 *  - upcoming audio is PRELOADED (next slide + both feedback branches)
 *    so answers and Next feel instant even on a cold cache.
 *
 * ALL spoken text is fixed content (storyData narration twins + strings
 * chrome, catalogued in storyVoiceSegments) — nothing is generated,
 * fetched as text, or rewritten (PRD §9.8).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Language } from '@/data/settingsStore';
import { useNarrationVoiceState } from './storyNarrationState';
import { storyAdventureVoice } from './storyAdventureVoice';
import {
  choiceReadSegments,
  pickedReadSegments,
  plainReadSegments,
  reminderSegment,
  slideReadSegments,
  type StorySegment,
} from './storyVoiceSegments';
import type { StoryChoice, StoryLevelDef, StorySlide } from './storyData';

/**
 * Waiting gap before each reminder (strict spec §4: "after EXACTLY 5
 * seconds… after another 5 seconds"): a flat 5s cadence while the child
 * hasn't answered, cycling the varied reminder pool. Exported for the
 * smoke test to pin the cadence.
 */
export const REMINDER_DELAYS_MS = [5_000] as const;

/** DEV-only state-machine trace — lets e2e runs and the browser console
 *  verify the voice lifecycle without needing ears. Silent in prod. */
const dlog = (...args: unknown[]) => {
  // `?.` — this module is also imported by the tsx smoke (no vite env).
  if (import.meta.env?.DEV) console.debug('[story-voice]', ...args);
};

type NarratorArgs = {
  level: StoryLevelDef;
  slide: StorySlide;
  picked: StoryChoice | null;
  language: Language;
  /** settings.narration && supported — false = fully silent, UI-only. */
  enabled: boolean;
};

export function useStoryNarrator({ level, slide, picked, language, enabled }: NarratorArgs) {
  const { speaking, suspended, unavailable, preparing } = useNarrationVoiceState();

  // Replay bumps the nonce so the main effect re-runs the CURRENT
  // situation from the top (including a full question re-read).
  const [replayNonce, setReplayNonce] = useState(0);

  const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reminderCountRef = useRef(0);

  const clearReminderTimer = useCallback(() => {
    if (reminderTimerRef.current !== null) clearTimeout(reminderTimerRef.current);
    reminderTimerRef.current = null;
  }, []);

  useEffect(() => {
    let alive = true;

    clearReminderTimer();
    if (!enabled || suspended) {
      // Voice off / chat panel open: hard-stop and stay visually intact.
      // When the chat closes (suspended → false) this effect re-runs and
      // the current situation is read fresh from the top — a question can
      // never stay silent because of an earlier suspension (§3).
      storyAdventureVoice.stop();
      dlog(suspended ? 'suspended (chat open) — silent' : 'narration off — silent');
      return () => {
        alive = false;
      };
    }

    const choices = slide.choices ?? [];
    const isChoice = slide.type === 'CHOICE' && choices.length >= 2;

    /** WAITING_FOR_ANSWER → (5s) → REMINDER_SPEAKING → WAITING… */
    const armReminder = () => {
      if (!alive || !isChoice || picked) return;
      const count = reminderCountRef.current;
      const delay =
        REMINDER_DELAYS_MS[Math.min(count, REMINDER_DELAYS_MS.length - 1)];
      reminderTimerRef.current = setTimeout(() => {
        if (!alive) return;
        reminderCountRef.current = count + 1;
        dlog('reminder', count + 1);
        storyAdventureVoice.speak([reminderSegment(count, language)], language, {
          onDone: armReminder,
        });
      }, delay);
    };

    // Warm upcoming audio so taps feel instant even on a cold cache:
    // the next slide's read, and (on a question) both feedback branches.
    const preloadAhead = () => {
      const idx = level.slides.findIndex((s) => s.id === slide.id);
      const next = level.slides[idx + 1];
      // RESULT screens are never narrated (silent by spec §8) — preloading
      // their clips would burn scarce TTS quota on audio nobody ever hears.
      if (next && next.type !== 'RESULT') {
        storyAdventureVoice.preload(slideReadSegments(level, next, language));
      }
      if (isChoice && !picked) {
        for (const c of choices) {
          storyAdventureVoice.preload(pickedReadSegments(level, slide, c, language));
        }
      }
    };

    // Completion / congratulations screen: SILENT by spec (§8). No reward
    // line, no summary, no reminders — the child just heard the praise on
    // the question slide; this screen is visual-only. goto() already cut
    // any playing audio synchronously; stopping again here is harmless
    // and guarantees silence even on direct/seam entry.
    if (slide.type === 'RESULT') {
      storyAdventureVoice.stop();
      dlog('RESULT slide — silent by spec');
      return () => {
        alive = false;
      };
    }

    // Build the spoken sequence for the current situation.
    let segments: StorySegment[] = [];
    let onDone: (() => void) | undefined;

    if (isChoice && !picked) {
      // Every (re)start of the question interaction reads the FULL
      // sequence — intro + question + option 1 + option 2 + "your turn"
      // (§2, exact order). Try Again and Replay land here again and are
      // read from the top: a restarted interaction is a new voice
      // session (§6), so the question can never be silently skipped.
      reminderCountRef.current = 0;
      segments = choiceReadSegments(level, slide, language);
      onDone = armReminder;
    } else if (isChoice && picked) {
      // Feedback (praise or try-again explanation). No reminders here —
      // armReminder guards on `picked`, so the feedback/try-again state
      // never gets an unanswered-question nudge (§6).
      segments = pickedReadSegments(level, slide, picked, language);
    } else {
      // Narrative slides read their narration twin (or the caption).
      segments = plainReadSegments(level, slide, language);
    }

    dlog('speak', slide.id, slide.type, picked ? `picked:${picked.id}` : '(unanswered)', `${segments.length} segment(s)`);
    storyAdventureVoice.speak(segments, language, { onDone });
    preloadAhead();

    return () => {
      alive = false;
      clearReminderTimer();
      // Situation is over (slide change, pick, unmount, Escape…):
      // previous audio must never bleed into the next situation (§11).
      storyAdventureVoice.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide.id, picked?.id, language, enabled, suspended, replayNonce]);

  /** "Listen again": stop, clear timers, and re-run the current situation. */
  const replay = useCallback(() => {
    storyAdventureVoice.stop();
    clearReminderTimer();
    reminderCountRef.current = 0;
    setReplayNonce((n) => n + 1);
  }, [clearReminderTimer]);

  /**
   * Retry chip tap (spec §7): clear the engine's outage state inside the
   * tap gesture, then re-run the CURRENT situation — through Gemini only.
   */
  const retryVoice = useCallback(() => {
    dlog('retry voice (chip tap) — re-attempting Gemini');
    storyAdventureVoice.retryVoice();
    replay();
  }, [replay]);

  return {
    replay,
    retryVoice,
    speaking,
    /** True while Gemini narration is down → overlay shows the retry chip. */
    voiceUnavailable: unavailable,
    /** True while the current read's audio is being prepared (§12 chip). */
    voicePreparing: preparing,
    supported: storyAdventureVoice.available(),
  };
}
