/**
 * GENERATED — do not edit by hand.
 *
 * Source of truth: artifacts/nyaya-nagri/src/story/storyVoiceSegments.ts
 * Regenerate:      pnpm exec tsx scripts/generate-story-voice-manifest.ts
 *                  (from artifacts/nyaya-nagri)
 *
 * This is the Story Adventure TTS route's ALLOWLIST: every line the story
 * voice can ever speak, as fixed hand-written content (PRD §9.8). The
 * route refuses any id not present here — clients can never make the
 * server synthesize free text. No line contains digits (PRD §9: helpline
 * digits live only in Get Help).
 */
export type StoryVoiceManifestEntry = {
  id: string;
  lang: 'en' | 'hi';
  text: string;
};

export const STORY_VOICE_MANIFEST: readonly StoryVoiceManifestEntry[] = [
  {
    "id": "chrome/reminder-0/en",
    "lang": "en",
    "text": "Abhi tak koi option select nahi hua hai. Aapko kaunsa answer sahi lagta hai?"
  },
  {
    "id": "chrome/reminder-0/hi",
    "lang": "hi",
    "text": "अभी तक कोई विकल्प चुना नहीं गया है। तुम्हें कौन सा जवाब सही लगता है?"
  },
  {
    "id": "chrome/reminder-1/en",
    "lang": "en",
    "text": "Riya ko ab ek choice karni hai. Neeche diye gaye options mein se ek choose karo."
  },
  {
    "id": "chrome/reminder-1/hi",
    "lang": "hi",
    "text": "रिया को अब एक फ़ैसला करना है। नीचे दिए गए विकल्पों में से एक चुनो।"
  },
  {
    "id": "chrome/reminder-2/en",
    "lang": "en",
    "text": "Chalo, Riya ki help karte hain. Aapke hisaab se use kya karna chahiye?"
  },
  {
    "id": "chrome/reminder-2/hi",
    "lang": "hi",
    "text": "चलो, रिया की मदद करते हैं। तुम्हारे हिसाब से उसे क्या करना चाहिए?"
  },
  {
    "id": "chrome/reminder-3/en",
    "lang": "en",
    "text": "Ab aapki baari hai. Kisi ek option par tap karke answer do."
  },
  {
    "id": "chrome/reminder-3/hi",
    "lang": "hi",
    "text": "अब तुम्हारी बारी है। किसी एक विकल्प पर टैप करके जवाब दो।"
  },
  {
    "id": "chrome/reminder-4/en",
    "lang": "en",
    "text": "Koi jaldi nahi hai. Sab options ko dhyaan se socho, phir ek chuno."
  },
  {
    "id": "chrome/reminder-4/hi",
    "lang": "hi",
    "text": "कोई जल्दी नहीं है। सब विकल्पों को ध्यान से सोचो, फिर एक चुनो।"
  },
  {
    "id": "chrome/reminder-5/en",
    "lang": "en",
    "text": "Sochne ke liye time lena bilkul theek hai. Jab ready ho, ek option par tap karo."
  },
  {
    "id": "chrome/reminder-5/hi",
    "lang": "hi",
    "text": "सोचने के लिए समय लेना बिल्कुल ठीक है। जब तैयार हो, एक विकल्प पर टैप करो।"
  }
] as const;

/**
 * Story level ids in PLAY order (the STORY_LEVELS sequence) — consumed by
 * the TTS route's prewarm so scarce quota fills early levels first. The
 * allowlist array above is alphabetically sorted, so it cannot express
 * play order itself. (Deliberately a plain readonly array WITHOUT an
 * as-const terminator: the story smoke's drift guard extracts the
 * manifest array by scanning this file for the first array-assignment
 * marker and the last as-const terminator, so nothing after the manifest
 * may repeat either byte sequence — not even inside a comment.)
 */
export const STORY_LEVEL_ORDER: readonly string[] = [];
