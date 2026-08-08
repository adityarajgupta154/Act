/**
 * Persona safety layer smoke test (Task 17)
 * Run: cd artifacts/api-server && pnpm dlx tsx scripts/persona.safety.smoke.ts
 *
 * Asserts the deterministic persona safety contract for EVERY persona
 * individually (the Task 2 guardrails are explicitly declared per persona,
 * never assumed inherited):
 *   - all 5 personas exist with complete configs;
 *   - every guardrail key is present, non-trivial, and stamped into the
 *     final system prompt of every persona x age band x language combo;
 *   - persona prompts forbid stating helpline numbers (the hard-coded Get
 *     Help Now dialog owns those) and contain no digits-based helplines;
 *   - the shared deterministic input gate and fail-closed output gate used
 *     by the persona route are the SAME functions as the avatar route
 *     (single-source canonical escalation text);
 *   - no emojis anywhere in persona-facing config text;
 *   - Zod schema restricts personas to the 12-15 / 16-18 bands and known
 *     persona ids.
 */
import {
  PERSONAS,
  PERSONA_IDS,
  GUARDRAIL_KEYS,
  type PersonaId,
} from '../src/routes/persona/personas';
import { buildPersonaSystemPrompt, type PersonaAgeBand } from '../src/routes/persona/prompt';
import {
  detectDistress,
  requiresCanonicalEscalation,
  getEscalationReply,
  redactPii,
  PII_PLACEHOLDER,
  ESCALATION_REPLY,
  ESCALATION_REPLY_HI,
} from '../src/routes/avatar/safety';
import { PersonaChatBody } from '@workspace/api-zod';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok - ${msg}`);
}

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const BANDS: PersonaAgeBand[] = ['12-15', '16-18'];
const LANGS = ['en', 'hi'] as const;

// --- 1. Config completeness, per persona ------------------------------------
assert(PERSONA_IDS.length === 5, 'exactly 5 personas configured');
for (const id of ['police', 'lawyer', 'teacher', 'judge', 'parent'] as PersonaId[]) {
  assert(PERSONA_IDS.includes(id), `persona "${id}" exists`);
  const p = PERSONAS[id];
  assert(p.characterName.length > 0, `${id}: has a character name`);
  assert(p.scope.length > 100, `${id}: has a substantive pre-approved scope`);
  assert(p.refusal.includes('Get Help'), `${id}: refusal routes real matters to Get Help`);
  for (const key of GUARDRAIL_KEYS) {
    assert(
      (p.guardrails[key] ?? '').trim().length >= 20,
      `${id}: guardrail "${key}" explicitly declared`,
    );
  }
  // Personas must never be instructed to state helpline digits themselves —
  // the output gate would replace such replies; canonical text is the
  // single source for helpline numbers.
  const allText = [p.identity, p.scope, p.refusal, ...Object.values(p.guardrails)].join(' ');
  assert(!/1098|155\s?260/.test(allText), `${id}: config contains no helpline digits`);
  assert(!EMOJI_RE.test(allText), `${id}: config contains no emojis`);
}

// --- 2. Every persona prompt carries every guardrail, all bands/langs --------
for (const id of PERSONA_IDS) {
  for (const band of BANDS) {
    for (const lang of LANGS) {
      const prompt = buildPersonaSystemPrompt(id, band, lang);
      for (const key of GUARDRAIL_KEYS) {
        assert(
          prompt.includes(PERSONAS[id].guardrails[key]),
          `${id}/${band}/${lang}: prompt contains guardrail "${key}"`,
        );
      }
      assert(prompt.includes('ROLE-PLAY'), `${id}/${band}/${lang}: prompt states role-play framing`);
      assert(
        prompt.includes(PERSONAS[id].scope),
        `${id}/${band}/${lang}: prompt contains ONLY-discuss scope`,
      );
      if (lang === 'hi') {
        assert(prompt.includes('tum'), `${id}/${band}/hi: Hindi tum register rule present`);
        assert(prompt.includes('Devanagari'), `${id}/${band}/hi: Devanagari rule present`);
      }
    }
  }
}

// --- 3. Same deterministic gates as the avatar route -------------------------
// (The route imports these exact functions from ../avatar/safety, so the
// canonical escalation text is single-source. Sanity-check the contract.)
assert(detectDistress('someone hits me at home'), 'input gate: EN disclosure escalates');
assert(detectDistress('कोई मुझे ब्लैकमेल कर रहा है'), 'input gate: HI disclosure escalates');
assert(!detectDistress('what does the Juvenile Justice Board do?'), 'input gate: on-topic question passes');
assert(!detectDistress('जेजे बोर्ड में क्या होता है?'), 'input gate: HI on-topic question passes');
assert(
  requiresCanonicalEscalation('You can call Childline at 1098.'),
  'output gate: helpline phrasing is replaced',
);
assert(
  requiresCanonicalEscalation('किसी हेल्पलाइन से बात करो।'),
  'output gate: HI helpline phrasing is replaced',
);
assert(getEscalationReply('en') === ESCALATION_REPLY, 'canonical EN escalation is single-source');
assert(getEscalationReply('hi') === ESCALATION_REPLY_HI, 'canonical HI escalation is single-source');

// --- 4. PII ingress gate: deterministic redaction before the AI provider -----
assert(
  !redactPii('my number is 98765 43210 call me').includes('98765'),
  'pii gate: 10-digit phone (spaced) redacted',
);
assert(
  redactPii('my number is 9876543210').includes(PII_PLACEHOLDER),
  'pii gate: phone replaced with placeholder',
);
assert(
  !redactPii('मेरा नंबर ९८७६५४३२१० है').includes('९८७६५४३२१०'),
  'pii gate: Devanagari-digit phone redacted',
);
assert(
  !redactPii('write to me at kid@example.com ok').includes('kid@example.com'),
  'pii gate: email redacted',
);
assert(
  !redactPii('my insta is @deepak.2012 add me').includes('@deepak.2012'),
  'pii gate: social handle redacted',
);
assert(
  redactPii('You can call Childline at 1098 or 155260.').includes('1098'),
  'pii gate: helpline 1098 preserved (below digit-run threshold)',
);
assert(
  redactPii('Section 12(1)(c) of the Act of 1987').includes('12(1)(c)'),
  'pii gate: legal section numbers preserved',
);
assert(
  redactPii('within 24 hours, a child aged 16-17').includes('24 hours'),
  'pii gate: small numbers (hours, ages) preserved',
);
assert(
  redactPii('What outcomes can the Board order for a child?') ===
    'What outcomes can the Board order for a child?',
  'pii gate: clean chip text passes through unchanged',
);

// --- 5. Zod schema: bands and persona ids are restricted ---------------------
const good = PersonaChatBody.safeParse({
  message: 'What happens at a JJB hearing?',
  personaId: 'judge',
  ageBand: '12-15',
  language: 'en',
});
assert(good.success, 'schema accepts a valid persona request');
assert(
  !PersonaChatBody.safeParse({ message: 'hi', personaId: 'judge', ageBand: '8-11' }).success,
  'schema rejects ageBand 8-11 (no personas for the youngest band)',
);
assert(
  !PersonaChatBody.safeParse({ message: 'hi', personaId: 'wizard', ageBand: '12-15' }).success,
  'schema rejects unknown personaId',
);
assert(
  !PersonaChatBody.safeParse({ message: '', personaId: 'police', ageBand: '12-15' }).success,
  'schema rejects empty message',
);
assert(
  !PersonaChatBody.safeParse({
    message: 'x'.repeat(501),
    personaId: 'police',
    ageBand: '12-15',
  }).success,
  'schema rejects over-length message',
);

console.log('\nAll persona safety smoke checks passed.');
