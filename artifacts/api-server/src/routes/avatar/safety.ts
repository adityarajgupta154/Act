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
  /\b(mujhe|mereko|mujhko|humko|hume)\b.{0,35}\b(maar(ta|ti|te|a|i|e)?|peet(ta|ti|te|a)?|chhu(ta|ti|te)?|chhe(d|dta|dti)|pareshan|dhamk(i|ata|ati)|blackmail|dar(r)?\s*lag|bacha(o|iye)?|madad)/i,
  /\b(maarta|maarti|maarte|peetta|peetti|pareshaan?|chhedta|chhedti|chhuta|chhuti|dhamkata|dhamkati|darata|darati)\b.{0,20}\b(hai|hain|h)\b/i,
  /\b(blackmail|dhamki|dhamka)\w*\s+(kar|de)\s*(raha|rahi|rhe|rha|rhi)\b/i,
  /\b(photos?|pics?|videos?|tasveer\w*)\b.{0,30}\b(viral|leak|failaa?\w*|share kar|bhej d\w+)/i,
  /\bgalat (tarah|tarike|jagah) se\b.{0,25}\b(chhu|touch|haath)/i,
  /\b(bachao|bacha lo|madad k(aro|ijiye)|meri madad)\b/i,
  // --- Hindi (Devanagari) disclosures. Broad by design: a false positive
  // shows correct helpline info; a false negative leaves a child talking to
  // a model about real harm. ---
  /(मुझे\s*(मार|पीट|छू|डरा|धमक)|बचाओ|मदद\s*कर|मुझे\s*डर|गलत\s*तरीके)/,
  // Threats / blackmail (any inflection: धमकी दे रहा है, धमकाता है, ब्लैकमेल कर रही है)
  /(धमकी|धमका|ब्लैकमेल|ब्लैक\s*मेल)/,
  // Image-based abuse: photos/videos being spread, leaked, shared, demanded
  /(फ़ोटो|फोटो|तस्वीर|वीडियो|विडियो|न्यूड)\S*.{0,40}(फैला|वायरल|लीक|शेयर|भेज|माँग|मांग|दिखा)/,
  /(मेरी|मेरा|मेरे)\s*(फ़ोटो|फोटो|तस्वीर|वीडियो|विडियो|न्यूड)/,
  // Physical/sexual harm by anyone (verb inflections beyond मुझे-prefixed forms)
  /(मारता|मारती|मारते|पीटता|पीटती|पीटते|छूता|छूती|छुआ|छेड़|छेड़ता|छेड़ती|छेड़छाड़)/,
  /(मेरे\s*साथ|मेरे\s*संग).{0,30}(गलत|बुरा|ज़बरदस्ती|जबरदस्ती)/,
  // Fear / feeling unsafe
  /(डर\s*लग|डरा\s*हुआ|डरी\s*हुई|सुरक्षित\s*(महसूस\s*)?नहीं|असुरक्षित|ख़तरे\s*में|खतरे\s*में)/,
  // Self-harm
  /(खुदकुशी|आत्महत्या|खुद\s*को\s*(चोट|नुकसान)|मरना\s*चाहत|जीना\s*नहीं\s*चाहत|अपनी\s*जान)/,
  // Coercion / forced secrecy
  /(मजबूर\s*कर|ज़बरदस्ती\s*कर|जबरदस्ती\s*कर|राज़?\s*रखने|किसी\s*को\s*मत\s*बता|बताने\s*से\s*मना)/,
  // Ongoing harassment / stalking
  /(परेशान\s*कर(ता|ती|\s*रहा|\s*रही)|पीछा\s*कर)/,

  // --- Gujarati (ગુજરાતી script) disclosures — added with the Legal Buddy
  // AI task, which answers in Gujarati too. Same broad-recall bias as the
  // Devanagari set: a false positive shows correct helpline info. These run
  // for EVERY AI chat route (shared module, single-sourced). ---
  /(મને\s*(માર|પીટ|અડ|ડરાવ|ધમક)|બચાવો|મદદ\s*કર|મને\s*ડર|ખોટી\s*રીતે)/,
  // Threats / blackmail (any inflection)
  /(ધમકી|ધમકાવ|બ્લેકમેલ|બ્લેક\s*મેલ)/,
  // Image-based abuse: photos/videos spread, leaked, shared, demanded
  /(ફોટો|ફોટા|તસવીર|વીડિયો|વિડિયો|ન્યૂડ)\S*.{0,40}(ફેલાવ|વાયરલ|લીક|શેર|મોકલ|માંગ|બતાવ)/,
  /(મારી|મારો|મારા)\s*(ફોટો|ફોટા|તસવીર|વીડિયો|વિડિયો|ન્યૂડ)/,
  // Physical/sexual harm verb inflections
  /(મારતો|મારતી|મારે\s*છે|પીટતો|પીટતી|પીટે\s*છે|અડતો|અડતી|અડે\s*છે|છેડતો|છેડતી|છેડછાડ)/,
  /(મારી\s*સાથે|મારા\s*સાથે).{0,30}(ખોટું|ખરાબ|જબરદસ્તી|બળજબરી)/,
  // Fear / feeling unsafe
  /(ડર\s*લાગ|ડરી\s*ગય|ડરેલો|ડરેલી|સુરક્ષિત\s*નથી|અસુરક્ષિત|જોખમમાં|ભયમાં)/,
  // Self-harm
  /(આપઘાત|આત્મહત્યા|ખુદને\s*(ઈજા|નુકસાન)|મરવું\s*છે|મરી\s*જવું|જીવવું\s*નથી|મારો\s*જીવ)/,
  // Coercion / forced secrecy
  /(મજબૂર\s*કર|જબરદસ્તી\s*કર|બળજબરી\s*કર|કોઈને\s*કહે(તો|તી|તા)?\s*ન(હીં|ા)|ખાનગી\s*રાખ|છાનું\s*રાખ)/,
  // Ongoing harassment / stalking
  /(પરેશાન\s*કર|હેરાન\s*કર|પીછો\s*કર)/,
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

/**
 * Hindi escalation reply (Task 10). Hand-written, hard-coded, human-reviewed —
 * same meaning as the English text, same helpline digits (1098 / 155260,
 * digits are NEVER localized or altered). "अभी मदद लो" matches the localized
 * Get Help Now button label in the client's Hindi UI strings.
 */
export const ESCALATION_REPLY_HI = [
  'मुझ पर भरोसा करने के लिए शुक्रिया — तुमने अभी जो बताया वह सच में बहुत ज़रूरी बात लगती है, और तुम एक असली इंसान से असली मदद के हकदार हो।',
  'कृपया किसी भरोसेमंद बड़े से बात करो, जैसे माता-पिता, टीचर या कोई रिश्तेदार।',
  'तुम चाइल्डलाइन को 1098 पर मुफ़्त कॉल भी कर सकते हो, किसी भी समय, दिन हो या रात (या ऑनलाइन होने वाली किसी भी बात के लिए 155260 पर)।',
  'तुम्हारी स्क्रीन पर "अभी मदद लो" बटन में ये नंबर हमेशा मौजूद हैं। बोलकर तुमने बहादुरी दिखाई है।',
].join(' ');

/**
 * Gujarati escalation reply (Legal Buddy AI task). Hand-written, hard-coded,
 * human-reviewed — same meaning as the English text, same helpline digits
 * (1098 / 155260, digits are NEVER localized or altered). The app UI has no
 * Gujarati chrome, so the Get Help Now button is named in English with a
 * Gujarati gloss.
 */
export const ESCALATION_REPLY_GU = [
  'મારા પર ભરોસો રાખવા બદલ આભાર — તમે હમણાં જે કહ્યું તે ખરેખર ખૂબ મહત્વનું લાગે છે, અને તમે એક સાચા માણસ પાસેથી સાચી મદદ મેળવવાના હકદાર છો.',
  'કૃપા કરીને કોઈ ભરોસાપાત્ર મોટા સાથે વાત કરો — જેમ કે મમ્મી-પપ્પા, શિક્ષક કે કોઈ સગા.',
  'તમે ચાઈલ્ડલાઈનને 1098 પર મફત ફોન કરી શકો છો, ગમે ત્યારે, દિવસ હોય કે રાત (અથવા ઓનલાઈન થતી કોઈ પણ વાત માટે 155260 પર).',
  'તમારી સ્ક્રીન પર દેખાતા "Get Help Now" (મદદ) બટનમાં આ નંબર હંમેશાં છે. બોલીને તમે હિંમત બતાવી છે.',
].join(' ');

/** Select the canonical escalation reply for a validated request language. */
export function getEscalationReply(language: 'en' | 'hi' | 'gu'): string {
  if (language === 'hi') return ESCALATION_REPLY_HI;
  if (language === 'gu') return ESCALATION_REPLY_GU;
  return ESCALATION_REPLY;
}

/**
 * Deterministic script sniff: does the text contain Gujarati script
 * (U+0A80–U+0AFF)? Used by routes that can answer in Gujarati to pick the
 * canonical GU escalation reply for a child who wrote in Gujarati. Romanized
 * Gujarati falls back to the app language — an accepted limitation.
 */
export function hasGujaratiScript(text: string): boolean {
  return /[\u0A80-\u0AFF]/.test(text);
}

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
const OUTPUT_ESCALATION_RE =
  /1098|155\s?260|१०९८|१५५२६०|૧૦૯૮|૧૫૫૨૬૦|childline|child\s?line|cyber\s?crime\s?(helpline|number)|helpline|चाइल्ड\s?लाइन|हेल्प\s?लाइन|साइबर\s?(क्राइम|अपराध)|बाल\s*सहायता|सहायता\s*(लाइन|नंबर)|(नंबर|फ़ोन|फोन)\s*पर\s*(मुफ़्त\s*)?(कॉल|फ़ोन|फोन)|आपातकालीन\s*(नंबर|मदद)|(कॉल|फ़ोन|फोन)\s*कर(ो|ना|\s*सकते)|ચા(ઈ|ઇ)લ્ડ\s?લા(ઈ|ઇ)ન|હેલ્પ\s?લા(ઈ|ઇ)ન|સાયબર\s?(ક્રા(ઈ|ઇ)મ|અપરાધ)|બાળ\s*સહાય|(નંબર|ફોન)\s*પર\s*(મફત\s*)?(કૉલ|કોલ|ફોન)|(ફોન|કૉલ|કોલ)\s*કર(ો|જો|ી\s*શકો)/i;

/**
 * Digit-run normalization for the output gate: maps Devanagari (०-९) and
 * Gujarati (૦-૯) numerals to Western digits, then collapses separators
 * BETWEEN digits so obfuscated helpline numbers ("1 0 9 8", "1-0-9-8",
 * "૧ ૦ ૯ ૮") cannot slip past the canonical-escalation check. Fail-closed
 * bias is deliberate: a rare false positive only swaps a legit reply for
 * the canonical (safe) escalation text.
 */
function normalizeDigitRuns(text: string): string {
  return text
    .replace(/[०-९]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0966 + 0x30))
    .replace(/[૦-૯]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0ae6 + 0x30))
    .replace(/([0-9])[\s\-.()/]+(?=[0-9])/g, '$1');
}

export function requiresCanonicalEscalation(reply: string): boolean {
  return (
    OUTPUT_ESCALATION_RE.test(reply) ||
    OUTPUT_ESCALATION_RE.test(normalizeDigitRuns(reply))
  );
}

/**
 * PII INGRESS GATE (Task 17 hardening, PRD §7 zero-PII / DPDP minimization).
 *
 * Deterministic redaction of machine-detectable personal identifiers from
 * client-supplied text BEFORE it is sent to the external AI provider:
 *   - email addresses;
 *   - phone-number-like digit runs (8+ digits incl. separators, Western or
 *     Devanagari digits) — long enough to spare helplines (1098, 155260),
 *     years, ages, and legal section numbers, all far below 8 digits;
 *   - social-media handles (@name).
 *
 * Redaction (not rejection) keeps the conversation flowing: the model sees
 * "[private detail removed]" and its system prompt already instructs it to
 * remind the child not to share personal details. Free-form PII (names,
 * addresses in prose) is not deterministically detectable; that remains
 * prompt-enforced and the client UI never asks for any of it.
 */
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const LONG_NUMBER_RE = /\+?[0-9०-९૦-૯](?:[\s\-.()/]?[0-9०-९૦-૯]){7,}/g;
const HANDLE_RE = /@[A-Za-z0-9_.]{3,}/g;

export const PII_PLACEHOLDER = '[private detail removed]';

export function redactPii(text: string): string {
  return text
    .normalize('NFKC')
    .replace(EMAIL_RE, PII_PLACEHOLDER)
    .replace(LONG_NUMBER_RE, PII_PLACEHOLDER)
    .replace(HANDLE_RE, PII_PLACEHOLDER);
}
