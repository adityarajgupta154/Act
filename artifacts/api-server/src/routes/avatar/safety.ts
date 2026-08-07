/**
 * Nyaya Nagri — Avatar safety layer (Task 2, hardened)
 *
 * DETERMINISTIC escalation for distress/disclosure language. Per PRD §9,
 * safety/helpline responses must be HARD-CODED, never AI-generated:
 *   - INPUT GATE: every piece of client-supplied text (current message AND
 *     all history turns) is scanned BEFORE any model call.
 *   - OUTPUT GATE: if the model's own reply looks like a safety escalation
 *     (it mentions a helpline), the reply is REPLACED with the canonical
 *     hard-coded text below — the model can never phrase (or misquote)
 *     helpline guidance itself.
 *
 * The lexicon is intentionally biased toward recall: a false positive shows
 * helpline info (harmless); a false negative leaves a child talking to a
 * model about real harm.
 */

const DISTRESS_PATTERNS: RegExp[] = [
  // --- Direct harm disclosures, present tense ---
  /\b(hurt|hurts|hurting|hit|hits|hitting|beat|beats|beating|slap|slaps|slapping|touch|touches|touched|touching|grab|grabs|grabbed|abus\w*|molest\w*|assault\w*|rap(e|es|ed|ing))\b.{0,40}\b(me|my body)\b/i,
  /\b(someone|somebody|he|she|they|my \w+)\b.{0,40}\b(hurts?|hurting|hits?|hitting|beats?|beating|touch(es|ed|ing)?|grab(s|bed|bing)?|abus\w*|molest\w*|rap(es|ed|ing)?|threatens?|threatening|forces?|forcing|blackmails?|blackmailing)\b.{0,30}\b(me|us)\b/i,

  // --- Past-tense / passive first-person disclosures ---
  /\b(i was|i got|i have been|i'?ve been|i am being|i'?m being)\b.{0,30}\b(abused|raped|molested|touched|beaten|hit|hurt|slapped|threatened|blackmailed|bullied|forced|groomed|harassed)\b/i,
  /\b(did|does|doing|do)\b.{0,25}\b(something|things|stuff)\b.{0,25}\b(sexual|bad|wrong|dirty)\b.{0,25}\b(to|with)\s+me\b/i,

  // --- Violent / abusive family or known adult ---
  /\bmy\s+(father|mother|dad|mom|papa|mummy|mama|uncle|aunt|aunty|chacha|mama|brother|sister|bhaiya|didi|cousin|teacher|sir|madam|neighbou?r|step\s?\w+|parents?|family)\b.{0,50}\b(violent|drinks? and|drunk|beats?|beating|hits?|hitting|hurts?|hurting|slaps?|abus\w*|molest\w*|touch(es|ed|ing)?|scares? me|threatens?)\b/i,

  // --- First-person fear / unsafe statements ---
  /\b(i('| a)?m| i am|im)\b.{0,20}\b(scared|afraid|terrified|frightened|not safe|unsafe|in danger)\b/i,
  /\b(i|me)\b.{0,30}\b(don'?t feel safe|feel unsafe|am being (hurt|abused|bullied|threatened|blackmailed|groomed))\b/i,

  // --- Self-harm ---
  /\b(kill (myself|me)|hurt(ing)? myself|cut(ting)? myself|harm(ing)? myself|end my life|suicide|want to die|self.?harm|khudkushi|marna chaht(a|i) h(u|oo)n?)\b/i,

  // --- Sextortion / image-based abuse ---
  /\b(shar(e|ed|ing)|post(ed|ing)?|send(ing)?|sent|leak(ed|ing)?|upload(ed|ing)?)\b.{0,35}\b(my|of me)\b.{0,25}\b(photos?|pictures?|pics?|videos?|nudes?)\b/i,
  /\b(threaten(s|ed|ing)?|blackmail(s|ed|ing)?|dhamki)\b.{0,45}\b(photos?|pictures?|pics?|videos?|nudes?|me|mujhe)\b/i,
  /\b(asked?|asking|wants?|forcing|forced)\b.{0,30}\b(me|mujhe)\b.{0,30}\b(photos?|pictures?|pics?|videos?|nudes?|undress|clothes off)\b/i,

  // --- Requests for personal help with harm ---
  /\b(help me|save me|what (should|do) i do)\b.{0,50}\b(hurt|abus\w*|hit|beat|touch\w*|molest\w*|rap(e|ed)|scared|afraid|threat\w*|blackmail\w*|bully\w*|bullied|groom\w*)\b/i,
  /\b(bull(y|ies|ied|ying))\b.{0,30}\b(me|my)\b/i,

  // --- Coercion / secrecy ---
  /\b(forc(es|ed|ing)? me|makes? me do|made me do|told me not to tell|keep (it|this) (a )?secret|can'?t tell anyone)\b/i,

  // --- Hindi / Hinglish (romanized) disclosures ---
  /\b(mujhe|mereko|mujhko|humko|hume)\b.{0,35}\b(maar(ta|ti|te|a|i|e)?|peet(ta|ti|te|a)?|chhu(ta|ti|te)?|chhe(d|dta|dti)|pareshan|dhamk(i|ata|ati)|dar(r)?\s*lag|bacha(o|iye)?|madad)/i,
  /\b(maarta|maarti|maarte|peetta|peetti|pareshaan?|chhedta|chhedti|chhuta|chhuti|dhamkata|dhamkati|darata|darati)\b.{0,20}\b(hai|hain|h)\b/i,
  /\bgalat (tarah|tarike|jagah) se\b.{0,25}\b(chhu|touch|haath)/i,
  /\b(bachao|bacha lo|madad k(aro|ijiye)|meri madad)\b/i,
  // --- Hindi (Devanagari) common disclosure fragments ---
  /(मुझे\s*(मार|पीट|छू|डरा|धमक)|बचाओ|मदद\s*कर|मुझे\s*डर|गलत\s*तरीके)/,
];

/**
 * Hard-coded escalation reply. NEVER generated, NEVER altered by AI.
 * Helpline numbers here must always match the Get Help Now dialog.
 */
export const ESCALATION_REPLY = [
  'Thank you for trusting me — what you just shared sounds really important, and you deserve real help from a real person.',
  'Please talk to an adult you trust, like a parent, teacher, or relative.',
  'You can also call Childline free at 1098 any time, day or night (or 155260 for anything happening online).',
  'The "Get Help Now" button on your screen has these numbers whenever you need them. You are brave for speaking up.',
].join(' ');

/** Returns true when a single text looks like a real disclosure or distress. */
export function detectDistress(message: string): boolean {
  const text = message.normalize('NFKC');
  return DISTRESS_PATTERNS.some((p) => p.test(text));
}

/** Input gate: scan EVERY piece of client-supplied text. */
export function scanForDistress(texts: string[]): boolean {
  return texts.some((t) => detectDistress(t));
}

/**
 * Output gate: the model is forbidden from phrasing helpline guidance
 * itself. If its reply references a helpline (correctly or not), we replace
 * the whole reply with the canonical hard-coded escalation text. This is
 * deliberately fail-closed: a false positive still shows correct, complete
 * help resources.
 */
const OUTPUT_ESCALATION_RE = /1098|155\s?260|childline|child\s?line|cyber\s?crime\s?(helpline|number)|helpline/i;

export function requiresCanonicalEscalation(reply: string): boolean {
  return OUTPUT_ESCALATION_RE.test(reply);
}
