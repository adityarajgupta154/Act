/**
 * Nyaya Nagri — In-scene persona interview panel (Task 17, PRD §7.4)
 *
 * A side conversation with a clearly-labelled role-play character. It never
 * affects quest branching, choices, scoring, or progression — finalizeLevel
 * remains the only progression write path. Conversation lives in component
 * memory only (never persisted, DPDP data-minimization).
 *
 * Safety wiring (identical contract to the avatar companion):
 *   - the HARD-CODED role-play disclaimer is always visible (PRD §9.2);
 *   - suggested question chips are static, hand-written content (the safe
 *     default input); free text is short and goes through every server
 *     guardrail;
 *   - an escalated reply opens the real Get Help dialog and pulses the
 *     help button, exactly like the avatar widget (PRD §9.1).
 */
import React, { useEffect, useRef, useState } from 'react';
import { usePersonaChat } from '@workspace/api-client-react';
import type { ScenePersona, PersonaId } from '@/quests/schema';
import type { AgeBand } from '@/data/progressStore';
import { triggerHelpPulse, openHelp } from '@/ui/uiStore';
import { getStrings, type UIStrings } from '@/i18n/strings';
import { PersonaSprite } from './PersonaSprite';
import { Send, Loader2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

type Turn = { role: 'user' | 'assistant'; content: string; escalated?: boolean };

function personaMeta(t: UIStrings, id: PersonaId): { name: string; role: string } {
  switch (id) {
    case 'police':
      return { name: t.personaNamePolice, role: t.personaRolePolice };
    case 'lawyer':
      return { name: t.personaNameLawyer, role: t.personaRoleLawyer };
    case 'teacher':
      return { name: t.personaNameTeacher, role: t.personaRoleTeacher };
    case 'judge':
      return { name: t.personaNameJudge, role: t.personaRoleJudge };
    case 'parent':
      return { name: t.personaNameParent, role: t.personaRoleParent };
  }
}

export function PersonaInterview({
  persona,
  ageBand,
  language,
}: {
  persona: ScenePersona;
  ageBand: AgeBand;
  language: 'en' | 'hi';
}) {
  const t = getStrings(language);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const chat = usePersonaChat();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (turns.length > 0) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [turns]);

  // Defense in depth: personas exist only for the older bands (content
  // validation + the server schema already enforce this).
  if (ageBand === '8-11') return null;

  const meta = personaMeta(t, persona.personaId);

  const ask = async (raw: string) => {
    const question = raw.trim().slice(0, 200);
    if (!question || chat.isPending) return;
    setInput('');
    const history = turns.map((m) => ({ role: m.role, content: m.content }));
    setTurns((prev) => [...prev, { role: 'user' as const, content: question }].slice(-8));
    try {
      const res = await chat.mutateAsync({
        data: {
          message: question,
          personaId: persona.personaId,
          ageBand,
          language,
          history: history.slice(-12),
        },
      });
      setTurns((prev) =>
        [...prev, { role: 'assistant' as const, content: res.reply, escalated: res.escalated }].slice(-8),
      );
      if (res.escalated) {
        // A real distress moment: open the actual Get Help screen (same as
        // the button) — resources must be ONE tap away (PRD §9.1).
        triggerHelpPulse();
        openHelp();
      }
    } catch {
      setTurns((prev) =>
        [...prev, { role: 'assistant' as const, content: t.personaUnavailable }].slice(-8),
      );
    }
  };

  return (
    <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/60 p-4 md:p-5 mb-8">
      {/* HARD-CODED disclaimer — always visible, every time (PRD §9.2). */}
      <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-amber-100 border border-amber-200 rounded-full w-fit">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
        <span className="text-xs md:text-sm font-bold text-amber-800">
          {t.personaDisclaimer(meta.role)}
        </span>
      </div>

      <div className="flex items-start gap-3 md:gap-4">
        <div className="shrink-0 w-16 h-[4.5rem] md:w-20 md:h-[5.5rem]">
          <PersonaSprite personaId={persona.personaId} className="w-full h-full" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-slate-800">{meta.name}</p>
          <p className="text-sm text-slate-600 mb-2">{t.personaIntroLine(meta.name)}</p>
        </div>
      </div>

      {turns.length > 0 && (
        <div className="mt-2 mb-3 max-h-48 overflow-y-auto flex flex-col gap-2 pr-1">
          {turns.map((m, i) => (
            <div
              key={i}
              className={cn(
                'px-3 py-2 rounded-xl text-sm md:text-base leading-relaxed max-w-[90%]',
                m.role === 'user'
                  ? 'self-end bg-indigo-600 text-white'
                  : m.escalated
                    ? 'self-start bg-red-50 text-red-800 border border-red-200'
                    : 'self-start bg-white text-slate-700 border border-slate-200',
              )}
            >
              {m.content}
            </div>
          ))}
          {chat.isPending && (
            <div className="self-start flex items-center gap-2 px-3 py-2 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {t.thinking}
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}
      {turns.length === 0 && chat.isPending && (
        <div className="flex items-center gap-2 px-3 py-2 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {t.thinking}
        </div>
      )}

      {/* Static suggested questions — the safe default input. */}
      <div className="flex flex-wrap gap-2 mt-2">
        {persona.chips.map((chip, i) => (
          <button
            key={i}
            onClick={() => ask(chip)}
            disabled={chat.isPending}
            className="px-3 py-1.5 rounded-full bg-white border border-indigo-200 text-indigo-700 text-sm font-medium hover:bg-indigo-100 active:bg-indigo-200 disabled:opacity-50 transition-colors touch-manipulation"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Short free-text — goes through every server guardrail. */}
      <form
        className="flex gap-2 mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={200}
          placeholder={t.personaInputPlaceholder}
          aria-label={t.personaInputPlaceholder}
          className="flex-1 min-w-0 px-4 py-2 rounded-full border border-slate-200 bg-white text-slate-800 text-sm md:text-base focus:border-indigo-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || chat.isPending}
          className="px-4 py-2 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center gap-1.5 disabled:opacity-50 hover:bg-indigo-700 transition-colors touch-manipulation"
        >
          <Send className="w-4 h-4" aria-hidden="true" /> {t.personaSend}
        </button>
      </form>
    </div>
  );
}
