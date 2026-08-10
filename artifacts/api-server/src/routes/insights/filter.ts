/**
 * Insights banned-terms output filter — the NON-DIAGNOSTIC guarantee,
 * enforced in code (spec: "NEVER produce psychological or medical
 * conclusions"). The prompt forbids these framings too, but prompts are
 * not guarantees: every model-written string passes through this
 * deterministic filter, and anything that trips it is DROPPED wholesale
 * (fail-closed — no rewriting, no partial salvage).
 *
 * The server-fixed disclaimer is intentionally NOT filtered: it must name
 * the very concepts ("psychological", "medical", "diagnostic") that model
 * output may never apply to a child.
 */

/** English terms — matched on word boundaries, case-insensitive. */
const BANNED_EN = [
  "anxiety",
  "anxious",
  "depression",
  "depressed",
  "adhd",
  "add\\b", // attention-deficit shorthand (word-bounded to spare "add")
  "autism",
  "autistic",
  "disorder",
  "diagnosis",
  "diagnose",
  "diagnostic",
  "diagnosed",
  "iq",
  "intelligence",
  "intelligent",
  "unintelligent",
  "mental illness",
  "mentally ill",
  "mental health",
  "mental condition",
  "psychiatric",
  "psychiatrist",
  "psychological",
  "psychologist",
  "abnormal",
  "weak child",
  "weak student",
  "poor learner",
  "slow learner",
  "learning disability",
  "learning disorder",
  "dyslexia",
  "dyslexic",
  "therapy",
  "therapist",
  "trauma",
  "traumatized",
  "syndrome",
  "hyperactive",
  "hyperactivity",
  "schizophrenia",
  "schizophrenic",
  "bipolar",
  "ocd",
  "obsessive compulsive",
  "ptsd",
  "psychosis",
  "psychotic",
  "special needs",
  "dyscalculia",
  "dysgraphia",
  "impairment",
  "impaired",
  "retard", // stem: retarded / retardation
  "deficit",
  "medication",
  "clinical",
];

/** Hindi terms/phrases — plain substring match (Devanagari). */
const BANNED_HI = [
  "मानसिक बीमारी",
  "मानसिक रोग",
  "मानसिक स्वास्थ्य",
  "मानसिक स्थिति",
  "अवसाद",
  "डिप्रेशन",
  "एंग्जायटी",
  "एंग्ज़ायटी",
  "चिंता विकार",
  "विकार",
  "निदान",
  "बुद्धिमत्ता",
  "बुद्धि स्तर",
  "मंदबुद्धि",
  "कमज़ोर बच्चा",
  "कमजोर बच्चा",
  "कमज़ोर छात्र",
  "कमजोर छात्र",
  "मनोवैज्ञानिक",
  "मनोचिकित्सक",
  "मनोरोग",
  "ऑटिज़्म",
  "ऑटिज्म",
  "एडीएचडी",
  "डिस्लेक्सिया",
  "असामान्य",
  "थेरेपी",
  "आघात",
  "सिज़ोफ्रेनिया",
  "सिजोफ्रेनिया",
  "बाइपोलर",
  "ओसीडी",
  "पीटीएसडी",
  "मनोविकृति",
  "विशेष आवश्यकता",
  "दिव्यांग",
  "डिस्कैल्कुलिया",
  "दवा",
  "इलाज",
];

const EN_RE = new RegExp(`\\b(?:${BANNED_EN.join("|")})\\b`, "i");

/** True when the text contains any banned diagnostic/psychological term. */
export function hasBannedInsightTerm(text: string): boolean {
  if (EN_RE.test(text)) return true;
  return BANNED_HI.some((t) => text.includes(t));
}

export interface AiItem {
  text: string;
  zoneId?: string;
}

/** Keep only clean items; report how many were dropped. */
export function filterInsightItems(items: AiItem[]): { kept: AiItem[]; dropped: number } {
  const kept = items.filter((i) => !hasBannedInsightTerm(i.text));
  return { kept, dropped: items.length - kept.length };
}

/** Canonical safe encouragement — used when the model's line was dropped. */
export const SAFE_ENCOURAGEMENT: Record<"en" | "hi", string> = {
  en: "Every explorer learns at their own pace — regular play and gentle practice are already building strong rights-awareness. Keep going!",
  hi: "हर खोजी अपनी गति से सीखता है — नियमित खेल और हल्का अभ्यास ही अधिकारों की मज़बूत समझ बनाता है। खेलते रहिए!",
};

/**
 * Server-fixed non-diagnostic disclaimer (spec §13/§16) — attached to every
 * reply, never model-generated, never filtered.
 */
export const INSIGHTS_DISCLAIMER: Record<"en" | "hi", string> = {
  en: "These insights describe game-based learning patterns only. This is not a psychological, medical, or diagnostic assessment, and it cannot determine any child's mental or medical condition. If you have any concern about a child's development or wellbeing, please talk to a qualified professional.",
  hi: "ये जानकारियाँ केवल गेम-आधारित सीखने के पैटर्न बताती हैं। यह कोई मनोवैज्ञानिक, चिकित्सीय या नैदानिक आकलन नहीं है, और यह किसी बच्चे की मानसिक या चिकित्सा स्थिति तय नहीं कर सकती। बच्चे के विकास या भलाई से जुड़ी किसी भी चिंता के लिए कृपया योग्य विशेषज्ञ से बात करें।",
};
