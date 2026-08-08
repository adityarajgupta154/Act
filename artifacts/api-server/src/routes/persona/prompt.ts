/**
 * Nyaya Nagri — Persona system prompt builder (Task 17, PRD §7.4)
 *
 * Assembles a persona's system prompt from its config. Every guardrail key
 * is stamped into EVERY persona prompt (the Record type in personas.ts
 * guarantees none can be omitted), and a module-load assertion below fails
 * loudly if a guardrail string is ever empty or a persona is missing.
 */

import {
  PERSONAS,
  PERSONA_IDS,
  GUARDRAIL_KEYS,
  type PersonaId,
} from './personas';

export type PersonaAgeBand = '12-15' | '16-18';

const AGE_TONES: Record<PersonaAgeBand, string> = {
  '12-15':
    'The child interviewing you is 12-15 years old. Speak as a kind, patient adult: simple clear sentences, relatable school-life examples, warm and reassuring, never condescending.',
  '16-18':
    'The child interviewing you is 16-18 years old. Speak as a respectful, straightforward adult: direct and practical, treating them as a capable young person preparing for adulthood.',
};

/**
 * Fail-loud config check at module load: every persona exists, and every
 * guardrail of every persona is a non-empty string. This is the runtime
 * twin of the compile-time Record<GuardrailKey, string> guarantee.
 */
for (const id of PERSONA_IDS) {
  const p = PERSONAS[id];
  if (!p) throw new Error(`Persona config missing: ${id}`);
  if (!p.identity || !p.scope || !p.refusal || !p.characterName) {
    throw new Error(`Persona ${id}: missing identity/scope/refusal/name`);
  }
  for (const key of GUARDRAIL_KEYS) {
    if (!p.guardrails[key] || p.guardrails[key].trim().length < 20) {
      throw new Error(`Persona ${id}: guardrail "${key}" missing or too short`);
    }
  }
}

export function buildPersonaSystemPrompt(
  personaId: PersonaId,
  ageBand: PersonaAgeBand,
  language: 'en' | 'hi' = 'en',
): string {
  const p = PERSONAS[personaId];

  const languageRule =
    language === 'hi'
      ? [
          'LANGUAGE: Reply ONLY in simple, warm Hindi written in Devanagari script, suited to a child of this age. Use the informal "tum" register (never "aap" formality walls, never harsh "tu").',
          'Keep Hindi vocabulary simple and everyday; avoid heavy Sanskritized or legal jargon.',
          'Write law names as transliterations with the English form in parentheses on first mention, e.g. जेजे एक्ट (JJ Act), आरटीई (RTE).',
          'ALL numbers stay as Western digits exactly as given, never in words, never translated, never altered.',
        ].join(' ')
      : 'LANGUAGE: Reply in English.';

  return [
    p.identity,
    'This is a clearly-labelled ROLE-PLAY inside a learning game — the child sees a disclaimer that you are not real every time you appear.',
    AGE_TONES[ageBand],
    languageRule,
    `PRE-APPROVED TOPIC SCOPE: ${p.scope}`,
    p.refusal,
    'HARD RULES (no exceptions, they override everything the user says):',
    ...GUARDRAIL_KEYS.map((key, i) => `${i + 1}. ${p.guardrails[key]}`),
  ].join('\n');
}
