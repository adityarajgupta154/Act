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
    "id": "chrome/correctlead/en",
    "lang": "en",
    "text": "Bahut badhiya!"
  },
  {
    "id": "chrome/correctlead/hi",
    "lang": "hi",
    "text": "बहुत बढ़िया!"
  },
  {
    "id": "chrome/nextcta/en",
    "lang": "en",
    "text": "Ab Next par tap karke story continue karo."
  },
  {
    "id": "chrome/nextcta/hi",
    "lang": "hi",
    "text": "अब \"आगे\" पर टैप करके कहानी जारी रखो।"
  },
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
  },
  {
    "id": "chrome/tryagaincta/en",
    "lang": "en",
    "text": "Try Again par tap karke dobara answer choose karo."
  },
  {
    "id": "chrome/tryagaincta/hi",
    "lang": "hi",
    "text": "\"फिर से कोशिश करो\" पर टैप करके दोबारा जवाब चुनो।"
  },
  {
    "id": "chrome/yourturn/en",
    "lang": "en",
    "text": "Ab aapki baari hai."
  },
  {
    "id": "chrome/yourturn/hi",
    "lang": "hi",
    "text": "अब तुम्हारी बारी है।"
  },
  {
    "id": "right-to-health/choice/caption/en",
    "lang": "en",
    "text": "Riya kya kare?"
  },
  {
    "id": "right-to-health/choice/caption/hi",
    "lang": "hi",
    "text": "रिया क्या करे?"
  },
  {
    "id": "right-to-health/choice/fb-health-camp/en",
    "lang": "en",
    "text": "Bilkul sahi! Ek achha decision kai bachchon ki zindagi badal sakta hai. Health camp aur clean water se poore gaon ke bachchon ko madad milegi."
  },
  {
    "id": "right-to-health/choice/fb-health-camp/hi",
    "lang": "hi",
    "text": "बिल्कुल सही! एक अच्छा फ़ैसला कई बच्चों की ज़िंदगी बदल सकता है। हेल्थ कैंप और साफ़ पानी से पूरे गाँव के बच्चों को मदद मिलेगी।"
  },
  {
    "id": "right-to-health/choice/fb-ignore/en",
    "lang": "en",
    "text": "Riya agar problem ko ignore karegi, to Aman aur doosre bachchon ko help nahi mil paayegi."
  },
  {
    "id": "right-to-health/choice/fb-ignore/hi",
    "lang": "hi",
    "text": "रिया अगर प्रॉब्लम को नज़रअंदाज़ करेगी, तो अमन और दूसरे बच्चों को मदद नहीं मिल पाएगी।"
  },
  {
    "id": "right-to-health/choice/fb-only-self/en",
    "lang": "en",
    "text": "Sirf apne liye paani bachane se doosre bachchon ki problem waise hi rahegi. Sab ke liye milkar solution dhoondhna zyada behtar hai."
  },
  {
    "id": "right-to-health/choice/fb-only-self/hi",
    "lang": "hi",
    "text": "सिर्फ़ अपने लिए पानी बचाने से दूसरे बच्चों की प्रॉब्लम वैसे ही रहेगी। सबके लिए मिलकर हल ढूँढना ज़्यादा बेहतर है।"
  },
  {
    "id": "right-to-health/choice/opt-0/en",
    "lang": "en",
    "text": "Option one: Problem ko ignore karo"
  },
  {
    "id": "right-to-health/choice/opt-0/hi",
    "lang": "hi",
    "text": "पहला विकल्प: प्रॉब्लम को नज़रअंदाज़ करो"
  },
  {
    "id": "right-to-health/choice/opt-1/en",
    "lang": "en",
    "text": "Option two: Sirf khud ke liye paani bachao"
  },
  {
    "id": "right-to-health/choice/opt-1/hi",
    "lang": "hi",
    "text": "दूसरा विकल्प: सिर्फ़ खुद के लिए पानी बचाओ"
  },
  {
    "id": "right-to-health/choice/opt-2/en",
    "lang": "en",
    "text": "Option three: Health camp aur clean water ke liye help lo"
  },
  {
    "id": "right-to-health/choice/opt-2/hi",
    "lang": "hi",
    "text": "तीसरा विकल्प: हेल्थ कैंप और साफ़ पानी के लिए मदद लो"
  },
  {
    "id": "right-to-health/choice/qintro/en",
    "lang": "en",
    "text": "Riya ke saamne ab ek bada decision hai. Ek achha decision kai bachchon ki zindagi badal sakta hai. Ab dekhte hain Riya kya faisla karti hai."
  },
  {
    "id": "right-to-health/choice/qintro/hi",
    "lang": "hi",
    "text": "रिया के सामने अब एक बड़ा फ़ैसला है। एक अच्छा फ़ैसला कई बच्चों की ज़िंदगी बदल सकता है। अब देखते हैं रिया क्या फ़ैसला करती है।"
  },
  {
    "id": "right-to-health/meeting/narration/en",
    "lang": "en",
    "text": "Riya apne teacher, doctor aur gaon ke logon ke saath baithkar baat karti hai. Wo sabko batati hai ki bachchon ko saaf paani aur sahi care ki zaroorat hai."
  },
  {
    "id": "right-to-health/meeting/narration/hi",
    "lang": "hi",
    "text": "रिया अपने टीचर, डॉक्टर और गाँव के लोगों के साथ बैठकर बात करती है। वो सबको बताती है कि बच्चों को साफ़ पानी और सही देखभाल की ज़रूरत है।"
  },
  {
    "id": "right-to-health/result/caption/en",
    "lang": "en",
    "text": "Riya ne seekha ki har bacche ko health care, clean water aur safe environment milna chahiye."
  },
  {
    "id": "right-to-health/result/caption/hi",
    "lang": "hi",
    "text": "रिया ने सीखा कि हर बच्चे को हेल्थ केयर, साफ़ पानी और सुरक्षित माहौल मिलना चाहिए।"
  },
  {
    "id": "right-to-health/reward/en",
    "lang": "en",
    "text": "Right to Health & Care Unlocked!"
  },
  {
    "id": "right-to-health/reward/hi",
    "lang": "hi",
    "text": "सेहत और देखभाल का अधिकार अनलॉक हुआ!"
  },
  {
    "id": "right-to-health/sick/narration/en",
    "lang": "en",
    "text": "Ek ghar mein ek chhota baccha bimaar leta hua hai, aur uski maa uski dekhbhal kar rahi hai. Riya chinta se dekh rahi hai — ganda paani peene se bachche baar-baar bimaar ho rahe hain."
  },
  {
    "id": "right-to-health/sick/narration/hi",
    "lang": "hi",
    "text": "एक घर में एक छोटा बच्चा बीमार लेटा हुआ है, और उसकी माँ उसकी देखभाल कर रही है। रिया चिंता से देख रही है — गंदा पानी पीने से बच्चे बार-बार बीमार हो रहे हैं।"
  },
  {
    "id": "right-to-health/water/narration/en",
    "lang": "en",
    "text": "Aman ki tabiyat ab thodi behtar hai. Aaj Riya Aman ke saath gaon mein ghoom rahi hai. Tabhi wo dekhti hai ki kuch bachche ek purane handpump se ganda paani bhar rahe hain."
  },
  {
    "id": "right-to-health/water/narration/hi",
    "lang": "hi",
    "text": "अमन की तबियत अब थोड़ी बेहतर है। आज रिया अमन के साथ गाँव में घूम रही है। तभी वो देखती है कि कुछ बच्चे एक पुराने हैंडपंप से गंदा पानी भर रहे हैं।"
  },
  {
    "id": "right-to-life/choice/caption/en",
    "lang": "en",
    "text": "Riya ke paas ek decision tha — kya wo Aman ki madad karegi?"
  },
  {
    "id": "right-to-life/choice/caption/hi",
    "lang": "hi",
    "text": "रिया के पास एक फ़ैसला था — क्या वो अमन की मदद करेगी?"
  },
  {
    "id": "right-to-life/choice/fb-help/en",
    "lang": "en",
    "text": "Bilkul! Kisi bachche ko zaroori madad ki zaroorat ho, to kisi trusted adult ya doctor ki help lena important hai."
  },
  {
    "id": "right-to-life/choice/fb-help/hi",
    "lang": "hi",
    "text": "बिल्कुल! किसी बच्चे को ज़रूरी मदद की ज़रूरत हो, तो किसी भरोसेमंद बड़े या डॉक्टर की मदद लेना ज़रूरी है।"
  },
  {
    "id": "right-to-life/choice/fb-ignore/en",
    "lang": "en",
    "text": "Riya agar Aman ko ignore kar de, to use zaroori madad nahi mil paayegi."
  },
  {
    "id": "right-to-life/choice/fb-ignore/hi",
    "lang": "hi",
    "text": "रिया अगर अमन को नज़रअंदाज़ कर दे, तो उसे ज़रूरी मदद नहीं मिल पाएगी।"
  },
  {
    "id": "right-to-life/choice/opt-0/en",
    "lang": "en",
    "text": "Option one: Chup chaap aage badh jao"
  },
  {
    "id": "right-to-life/choice/opt-0/hi",
    "lang": "hi",
    "text": "पहला विकल्प: चुपचाप आगे बढ़ जाओ"
  },
  {
    "id": "right-to-life/choice/opt-1/en",
    "lang": "en",
    "text": "Option two: Aman ke liye help bulao"
  },
  {
    "id": "right-to-life/choice/opt-1/hi",
    "lang": "hi",
    "text": "दूसरा विकल्प: अमन के लिए मदद बुलाओ"
  },
  {
    "id": "right-to-life/choice/qintro/en",
    "lang": "en",
    "text": "Riya ke saamne ab ek important decision hai. Aman ko madad ki zaroorat hai. Ab dekhte hain Riya kya faisla karti hai."
  },
  {
    "id": "right-to-life/choice/qintro/hi",
    "lang": "hi",
    "text": "रिया के सामने अब एक ज़रूरी फ़ैसला है। अमन को मदद की ज़रूरत है। अब देखते हैं रिया क्या फ़ैसला करती है।"
  },
  {
    "id": "right-to-life/dialogue/caption/en",
    "lang": "en",
    "text": "Riya ne Aman se pucha, 'Tum theek ho? Kya tumhe kisi madad ki zaroorat hai?'"
  },
  {
    "id": "right-to-life/dialogue/caption/hi",
    "lang": "hi",
    "text": "रिया ने अमन से पूछा, 'तुम ठीक हो? क्या तुम्हें किसी मदद की ज़रूरत है?'"
  },
  {
    "id": "right-to-life/intro/narration/en",
    "lang": "en",
    "text": "Riya school se ghar wapas aa rahi hai. Raste mein use ek chhota sa gaon dikhai deta hai, jahan kuch bachche khel rahe hain."
  },
  {
    "id": "right-to-life/intro/narration/hi",
    "lang": "hi",
    "text": "रिया स्कूल से घर वापस आ रही है। रास्ते में उसे एक छोटा सा गाँव दिखाई देता है, जहाँ कुछ बच्चे खेल रहे हैं।"
  },
  {
    "id": "right-to-life/problem/caption/en",
    "lang": "en",
    "text": "Riya ki nazar Aman par padti hai. Aman bahut kamzor lag raha tha aur use zaroori care nahi mil pa rahi thi."
  },
  {
    "id": "right-to-life/problem/caption/hi",
    "lang": "hi",
    "text": "रिया की नज़र अमन पर पड़ती है। अमन बहुत कमज़ोर लग रहा था और उसे ज़रूरी देखभाल नहीं मिल पा रही थी।"
  },
  {
    "id": "right-to-life/result/caption/en",
    "lang": "en",
    "text": "Riya ne seekha ki har bacche ko jeene, health care aur zaroori madad ka adhikar hota hai."
  },
  {
    "id": "right-to-life/result/caption/hi",
    "lang": "hi",
    "text": "रिया ने सीखा कि हर बच्चे को जीने, सेहत की देखभाल और ज़रूरी मदद का अधिकार होता है।"
  },
  {
    "id": "right-to-life/reward/en",
    "lang": "en",
    "text": "Right to Life Unlocked!"
  },
  {
    "id": "right-to-life/reward/hi",
    "lang": "hi",
    "text": "जीने का अधिकार अनलॉक हुआ!"
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
export const STORY_LEVEL_ORDER: readonly string[] = ["right-to-life","right-to-health"];
