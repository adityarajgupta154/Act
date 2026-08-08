/**
 * Nyaya Nagri — Hard-coded avatar zone greetings, English + Hindi (Task 10)
 *
 * Moved out of AvatarWidget so both languages live beside each other.
 * Per PRD §9.8 these are static, hand-written strings — never AI-generated.
 * Tone per Task 2 rules: 8-11 playful/simple, 12-15 older-sibling,
 * 16-18 practical. Hindi keeps the same legal precision: qualified wording
 * ("अपराध हो सकता है"), exact helpline digits, no promises of outcomes.
 */
import type { Language } from '@/data/settingsStore';
import type { AgeBand } from '@/data/progressStore';
import type { LevelKind } from '@/quests/schema';

type GreetingMap = Record<string, Record<AgeBand, string>>;

const GREETINGS_EN: GreetingMap = {
  zone0: {
    '8-11':
      "Welcome to the Know Yourself zone! Before we visit anywhere else, here is the biggest secret in Nyaya Nagri: YOU matter, exactly as you are. In this zone we discover the invisible shields called rights that every child in India carries. Let's meet Pihu and find yours. I'm here if you have questions!",
    '12-15':
      "Welcome to the Know Yourself zone. Everything in this city stands on one book: the Constitution of India. This quest shows you Articles 14, 15, and 21 in plain language — equality, no discrimination, and a life with dignity — and how to recognise unfair treatment when it happens right in front of you. Ready?",
    '16-18':
      "Welcome to the Know Yourself zone. Before the specific laws, the foundation: Articles 14, 15, 15(3), and 21 — equality before the law, the bar on discrimination, the State's power to specially protect children, and personal liberty with dignity. Every zone after this one is built on these four. Worth knowing precisely.",
  },
  zone1: {
    '8-11':
      "Welcome to the Safe Zone! Here we learn one BIG rule: your body belongs to YOU. Let's play a story about saying no, telling a trusted grown-up, and staying safe. I'm right here if you have questions!",
    '12-15':
      "Welcome to the Safe Zone. This quest covers real stuff: consent, personal boundaries, and how to spot manipulation online before it traps you or a friend. There's a law on your side here called POCSO. Ready when you are.",
    '16-18':
      "Welcome to the Safe Zone. This quest gets practical about the POCSO Act: what counts as an offence, why a minor's consent isn't legally valid, how child-friendly reporting, identity protection, and Special Courts actually work, and how to support a friend who confides in you. Knowledge worth having.",
  },
  zone2: {
    '8-11':
      "Welcome to the Right to Childhood zone! Every child has the right to learn, play, and rest, and there is a law in India that protects that. Let's follow Meera's story about noticing a child who needed a friend. I'm here if you have questions!",
    '12-15':
      "Welcome to the Right to Childhood zone. This quest is about child labour: where the law draws the line between helping your family and work that steals someone's schooling and safety, and exactly who to inform when you spot it. Ready?",
    '16-18':
      "Welcome to the Right to Childhood zone. You're close to working age, so this one is practical: what jobs the law lets you take at 14-18, why hazardous work stays off-limits until 18, the hour and night-work rules employers owe you, and how it all protects your education. Useful stuff.",
  },
  zone3: {
    '8-11':
      "Welcome to the School Rights zone! Did you know every child aged 6 to 14 in India has the right to free elementary education? Government schools charge no fees, and no child can be turned away because of money. Let's follow Tara's story and see how the law keeps the school gate open. I'm here if you have questions!",
    '12-15':
      "Welcome to the School Rights zone. The RTE Act gives you rights you can actually stand on: free elementary education, the 25 percent entry-level quota in private schools, no expulsion before Class 8, and a ban on physical punishment and humiliation. Let's see what they mean in real life.",
    '16-18':
      "Welcome to the School Rights zone. You're past the RTE guarantee age, so this quest is about what changes after 14 and what doesn't: how education stays open, the protections every under-18 student keeps, and where a serious school grievance actually goes. Practical territory.",
  },
  zone4: {
    '8-11':
      "Welcome to the Justice System zone! Did you know India has special helpers whose whole job is keeping children safe? Let's follow Golu's story and meet Childline 1098 and the kind Child Welfare Committee. A child who needs help is never in trouble for asking. I'm here if you have questions!",
    '12-15':
      "Welcome to the Justice System zone. This quest walks you step by step down the protection path: who to call when a child needs protection, what the Child Welfare Committee actually does, where a child stays in the meantime, and why the plan always aims at family, never punishment. Let's walk it.",
    '16-18':
      "Welcome to the Justice System zone. This simulation covers both pathways of the Juvenile Justice Act: care and protection through the CWC, and what really happens when someone under 18 is accused of an offence — SJPU, the Juvenile Justice Board, and why the law is built for rehabilitation, not punishment. Worth knowing precisely.",
  },
  zone5: {
    '8-11':
      "Welcome to the Digital Safety zone! Screens are fun, but here is a secret: online, people are not always who they say they are. Let's follow Anu's story and learn the Rules of the Screen — what stays private, and who to tell if something feels wrong. I'm here if you have questions!",
    '12-15':
      "Welcome to the Digital Safety zone. This quest covers the real stuff: spotting cyberbullying and what actually helps, the grooming red flags that show up in DMs and games, and the tools on your side — block, report, trusted adults, the Cyber Crime Helpline 155260, and Childline 1098. Ready?",
    '16-18':
      "Welcome to the Digital Safety zone. This one is about digital consent and the law: why forwarding someone's private image can be an offence, how the rules protect everyone under 18, and the practical playbook for harassment and sextortion — records, platform grievance tools, the National Cyber Crime Reporting Portal, and 155260. Knowledge worth having.",
  },
  zone6: {
    '8-11':
      "Welcome to the Family & Community Shield zone — the last stop on your journey! This one is about something every child deserves: a home that feels safe and warm, like a nest. We'll meet Golu, learn what to do when home feels stormy, and meet the kind helpers whose whole job is keeping children safe. And remember — Childline 1098 is always there. I'm right here if you have questions!",
    '12-15':
      "Welcome to the Family & Community Shield zone. This final quest covers real things: the Prohibition of Child Marriage Act — why the law says not before 18 for girls and 21 for boys — the right to say no and get help, and what to do when home doesn't feel safe. You'll also meet the real authorities built to protect children. Childline 1098 is with you all the way. Ready?",
    '16-18':
      "Welcome to the Family & Community Shield zone — the final zone. Here it gets practical: the Prohibition of Child Marriage Act, 2006 (minimum ages 18 and 21), how a child marriage can be legally challenged and annulled with free legal aid, and how to stand by a friend whose home is not safe — without playing detective. You'll also meet the full roster of child-protection authorities. Knowledge that protects real people.",
  },
};

const GREETINGS_HI: GreetingMap = {
  zone0: {
    '8-11':
      'खुद को जानो ज़ोन में स्वागत है! किसी और जगह जाने से पहले, न्याय नगरी का सबसे बड़ा राज़ सुनो: तुम मायने रखते हो, बिल्कुल जैसे तुम हो। इस ज़ोन में हम वे अनदेखी ढालें खोजेंगे जिन्हें अधिकार कहते हैं और जो भारत का हर बच्चा साथ रखता है। चलो पीहू से मिलें और तुम्हारी ढालें ढूँढें। सवाल हों तो मैं यहीं हूँ!',
    '12-15':
      'खुद को जानो ज़ोन में स्वागत है। इस पूरे शहर की नींव एक किताब है: भारत का संविधान। यह क्वेस्ट तुम्हें आसान भाषा में अनुच्छेद 14, 15 और 21 दिखाती है — बराबरी, भेदभाव पर रोक, और गरिमा भरा जीवन — और यह भी कि आँखों के सामने नाइंसाफ़ी हो तो उसे पहचानो कैसे। तैयार हो?',
    '16-18':
      'खुद को जानो ज़ोन में स्वागत है। खास कानूनों से पहले, नींव: अनुच्छेद 14, 15, 15(3) और 21 — कानून के सामने बराबरी, भेदभाव पर रोक, बच्चों की खास सुरक्षा बनाने की राज्य की शक्ति, और गरिमा के साथ निजी स्वतंत्रता। इसके बाद का हर ज़ोन इन्हीं चार पर खड़ा है। इन्हें ठीक से जानना काम की बात है।',
  },
  zone1: {
    '8-11':
      'सेफ़ ज़ोन में स्वागत है! यहाँ हम एक बड़ा नियम सीखते हैं: तुम्हारा शरीर सिर्फ़ तुम्हारा है। चलो एक कहानी खेलें — ना कहना, किसी भरोसेमंद बड़े को बताना, और सुरक्षित रहना। कोई सवाल हो तो मैं यहीं हूँ!',
    '12-15':
      'सेफ़ ज़ोन में स्वागत है। इस क्वेस्ट में असली बातें हैं: सहमति, निजी सीमाएँ, और ऑनलाइन चालाकी को पहचानना, इससे पहले कि वह तुम्हें या किसी दोस्त को फँसा ले। यहाँ तुम्हारी तरफ़ एक कानून है — पॉक्सो (POCSO)। जब तैयार हो, बताओ।',
    '16-18':
      'सेफ़ ज़ोन में स्वागत है। यह क्वेस्ट पॉक्सो कानून (POCSO) को व्यावहारिक ढंग से समझाती है: क्या-क्या अपराध हो सकता है, नाबालिग की सहमति कानूनन मान्य क्यों नहीं होती, बाल-हितैषी रिपोर्टिंग, पहचान की सुरक्षा और विशेष अदालतें असल में कैसे काम करती हैं, और भरोसा करके अपनी बात बताने वाले दोस्त का साथ कैसे दें। यह जानकारी काम की है।',
  },
  zone2: {
    '8-11':
      'बचपन का अधिकार ज़ोन में स्वागत है! हर बच्चे को पढ़ने, खेलने और आराम करने का अधिकार है, और भारत में एक कानून इसकी रक्षा करता है। चलो मीरा की कहानी देखें, जिसने एक ऐसे बच्चे को देखा जिसे एक दोस्त की ज़रूरत थी। सवाल हों तो मैं यहीं हूँ!',
    '12-15':
      'बचपन का अधिकार ज़ोन में स्वागत है। यह क्वेस्ट बाल मज़दूरी के बारे में है: कानून कहाँ रेखा खींचता है — परिवार की मदद और ऐसे काम के बीच जो किसी की पढ़ाई और सुरक्षा छीन लेता है — और ऐसा दिखे तो ठीक-ठीक किसे बताना है। तैयार हो?',
    '16-18':
      'बचपन का अधिकार ज़ोन में स्वागत है। तुम काम करने की उम्र के करीब हो, इसलिए यह क्वेस्ट व्यावहारिक है: 14-18 की उम्र में कानून कौन से काम करने देता है, खतरनाक काम 18 साल तक क्यों मना रहता है, घंटों और रात के काम के वे नियम जो काम देने वाले को मानने ही होते हैं, और यह सब तुम्हारी पढ़ाई की रक्षा कैसे करता है। काम की बातें।',
  },
  zone3: {
    '8-11':
      'स्कूल अधिकार ज़ोन में स्वागत है! क्या तुम जानते हो, भारत में 6 से 14 साल के हर बच्चे को मुफ़्त प्रारंभिक शिक्षा का अधिकार है? सरकारी स्कूल फ़ीस नहीं लेते, और पैसों की वजह से किसी बच्चे को लौटाया नहीं जा सकता। चलो तारा की कहानी में देखें कि कानून स्कूल का दरवाज़ा खुला कैसे रखता है। सवाल हों तो मैं यहीं हूँ!',
    '12-15':
      'स्कूल अधिकार ज़ोन में स्वागत है। आरटीई कानून (RTE) तुम्हें ऐसे अधिकार देता है जिन पर तुम सच में टिक सकते हो: मुफ़्त प्रारंभिक शिक्षा, निजी स्कूलों में प्रवेश-स्तर की 25 प्रतिशत सीटें, कक्षा 8 पूरी होने से पहले स्कूल से न निकाला जाना, और शारीरिक सज़ा व अपमान पर रोक। चलो देखें असल ज़िंदगी में इनका क्या मतलब है।',
    '16-18':
      'स्कूल अधिकार ज़ोन में स्वागत है। तुम आरटीई की गारंटी वाली उम्र से आगे हो, इसलिए यह क्वेस्ट बताती है कि 14 के बाद क्या बदलता है और क्या नहीं: पढ़ाई के रास्ते कैसे खुले रहते हैं, 18 से कम उम्र के हर विद्यार्थी की कौन सी सुरक्षा बनी रहती है, और स्कूल की कोई गंभीर शिकायत असल में कहाँ जाती है। काम की बातें।',
  },
  zone4: {
    '8-11':
      'न्याय प्रणाली ज़ोन में स्वागत है! क्या तुम जानते हो, भारत में ऐसे खास मददगार हैं जिनका पूरा काम ही बच्चों को सुरक्षित रखना है? चलो गोलू की कहानी में चाइल्डलाइन 1098 और दयालु बाल कल्याण समिति से मिलें। मदद माँगने पर कोई बच्चा कभी मुसीबत में नहीं पड़ता। सवाल हों तो मैं यहीं हूँ!',
    '12-15':
      'न्याय प्रणाली ज़ोन में स्वागत है। यह क्वेस्ट तुम्हें सुरक्षा के रास्ते पर कदम-कदम आगे ले चलती है: जब किसी बच्चे को सुरक्षा चाहिए तो किसे बुलाएँ, बाल कल्याण समिति असल में क्या करती है, इस बीच बच्चा कहाँ रहता है, और योजना का लक्ष्य हमेशा परिवार क्यों होता है, सज़ा कभी नहीं। चलो चलें।',
    '16-18':
      'न्याय प्रणाली ज़ोन में स्वागत है। यह सिमुलेशन किशोर न्याय कानून (JJ Act) के दोनों रास्ते दिखाता है: बाल कल्याण समिति (CWC) के ज़रिए देखभाल और सुरक्षा, और जब 18 से कम उम्र के किसी पर आरोप लगे तो असल में क्या होता है — SJPU, किशोर न्याय बोर्ड, और यह कानून सुधार के लिए क्यों बना है, सज़ा के लिए नहीं। ठीक से जानने लायक।',
  },
  zone5: {
    '8-11':
      'डिजिटल सुरक्षा ज़ोन में स्वागत है! स्क्रीन मज़ेदार होती है, पर एक ज़रूरी बात: ऑनलाइन लोग हमेशा वही नहीं होते जो वे बताते हैं। चलो अनु की कहानी से स्क्रीन के नियम सीखें — क्या निजी रहता है, और कुछ गलत लगे तो किसे बताना है। सवाल हों तो मैं यहीं हूँ!',
    '12-15':
      'डिजिटल सुरक्षा ज़ोन में स्वागत है। इस क्वेस्ट में असली बातें हैं: साइबरबुलिंग को पहचानना और क्या सच में मदद करता है, DM और गेम्स में दिखने वाले ग्रूमिंग के खतरे के संकेत, और तुम्हारी तरफ़ के औज़ार — ब्लॉक, रिपोर्ट, भरोसेमंद बड़े, साइबर क्राइम हेल्पलाइन 155260, और चाइल्डलाइन 1098। तैयार हो?',
    '16-18':
      'डिजिटल सुरक्षा ज़ोन में स्वागत है। यह क्वेस्ट डिजिटल सहमति और कानून के बारे में है: किसी की निजी तस्वीर आगे भेजना अपराध क्यों हो सकता है, नियम 18 से कम उम्र के हर व्यक्ति की रक्षा कैसे करते हैं, और परेशान करने या धमकाने पर व्यावहारिक तरीका — रिकॉर्ड रखना, प्लेटफ़ॉर्म के शिकायत टूल, राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल, और 155260। यह जानकारी काम की है।',
  },
  zone6: {
    '8-11':
      'परिवार और समुदाय की ढाल ज़ोन में स्वागत है — तुम्हारे सफ़र का आख़िरी पड़ाव! यह ज़ोन उस चीज़ के बारे में है जो हर बच्चे का हक़ है: एक ऐसा घर जो घोंसले जैसा सुरक्षित और गर्म लगे। हम गोलू से मिलेंगे, सीखेंगे कि घर में तूफ़ान जैसा लगे तो क्या करना है, और उन प्यारे मददगारों से मिलेंगे जिनका पूरा काम ही बच्चों को सुरक्षित रखना है। और याद रखो — चाइल्डलाइन 1098 हमेशा साथ है। सवाल हों तो मैं यहीं हूँ!',
    '12-15':
      'परिवार और समुदाय की ढाल ज़ोन में स्वागत है। इस आख़िरी क्वेस्ट में असली बातें हैं: बाल विवाह रोकथाम कानून — कानून क्यों कहता है कि लड़कियों के लिए 18 और लड़कों के लिए 21 से पहले शादी नहीं — ना कहने और मदद पाने का हक़, और घर सुरक्षित न लगे तो क्या करना है। साथ ही तुम बच्चों की रक्षा के लिए बनी असली संस्थाओं से मिलोगे। चाइल्डलाइन 1098 हर कदम पर साथ है। तैयार हो?',
    '16-18':
      'परिवार और समुदाय की ढाल ज़ोन में स्वागत है — आख़िरी ज़ोन। यहाँ बात व्यावहारिक है: बाल विवाह रोकथाम अधिनियम 2006 (न्यूनतम उम्र 18 और 21), बाल विवाह को कानूनी रूप से चुनौती देकर मुफ़्त कानूनी मदद से रद्द कैसे कराया जा सकता है, और जिस दोस्त का घर सुरक्षित नहीं है उसका साथ कैसे दिया जाए — जासूस बने बिना। तुम बाल सुरक्षा संस्थाओं की पूरी टीम से भी मिलोगे। यह जानकारी असल ज़िंदगी में काम आती है।',
  },
};

const GREETINGS: Record<Language, GreetingMap> = {
  en: GREETINGS_EN,
  hi: GREETINGS_HI,
};

export function getZoneGreeting(
  zoneId: string,
  ageBand: AgeBand,
  language: Language,
): string | null {
  return GREETINGS[language][zoneId]?.[ageBand] ?? null;
}

/**
 * Task 15: short level-entry greetings. Hard-coded, hand-written templates
 * (never AI-generated, PRD §9.8) with only the localized zone name and the
 * level number interpolated — the same strings work for every zone and age
 * band, so no band/character mismatch is possible. Western numerals only.
 */
type LevelGreetingKind = LevelKind;

const LEVEL_GREETINGS: Record<
  Language,
  Record<LevelGreetingKind, (n: number, zoneName: string) => string>
> = {
  en: {
    story: (n, zoneName) =>
      `Level ${n} of ${zoneName}: the story begins. Read carefully — soon the choices will be yours. I am here if you have questions.`,
    decision: (n, zoneName) =>
      `Level ${n} of ${zoneName}: now the big choices are yours. Take your time — every choice teaches something.`,
    quiz: (n, zoneName) =>
      `Level ${n} of ${zoneName}: the quiz checkpoint. Show what you have learned — you can do this.`,
    memory: (n, zoneName) =>
      `Level ${n} of ${zoneName}: Memory Match. Flip the cards and match each right with what it means. Take your time — there is no hurry here.`,
    hidden: (n, zoneName) =>
      `Level ${n} of ${zoneName}: Find the Clues. Look closely at the picture and tap what is not right for a child. You have sharp eyes.`,
    sorting: (n, zoneName) =>
      `Level ${n} of ${zoneName}: Sort It Out. Put each situation where it belongs — you know more than you think.`,
    scenario: (n, zoneName) =>
      `Level ${n} of ${zoneName}: Quick Decision. One moment, one choice — trust what you have learned.`,
    authorities: (n, zoneName) =>
      `Level ${n} of ${zoneName}: Meet the Authorities. Tap each card to meet a real helper for children — the law put every one of them on your side.`,
  },
  hi: {
    story: (n, zoneName) =>
      `${zoneName} का लेवल ${n}: कहानी शुरू होती है। ध्यान से पढ़ो — आगे फ़ैसले तुम्हें लेने हैं। कोई सवाल हो तो मैं यहीं हूँ।`,
    decision: (n, zoneName) =>
      `${zoneName} का लेवल ${n}: अब बड़े फ़ैसले तुम्हारे हाथ में हैं। आराम से सोचो — हर फ़ैसला कुछ सिखाता है।`,
    quiz: (n, zoneName) =>
      `${zoneName} का लेवल ${n}: क्विज़ चेकपॉइंट। दिखाओ तुमने क्या सीखा — तुम यह कर सकते हो।`,
    memory: (n, zoneName) =>
      `${zoneName} का लेवल ${n}: मेमोरी मिलान। कार्ड पलटो और हर अधिकार को उसके मतलब से मिलाओ। आराम से खेलो — यहाँ कोई जल्दी नहीं है।`,
    hidden: (n, zoneName) =>
      `${zoneName} का लेवल ${n}: सुराग ढूँढो। तस्वीर को ध्यान से देखो और जो किसी बच्चे के लिए ठीक नहीं है उसे टैप करो। तुम्हारी नज़र तेज़ है।`,
    sorting: (n, zoneName) =>
      `${zoneName} का लेवल ${n}: सही जगह चुनो। हर स्थिति को उसकी सही जगह पर रखो — तुम जितना सोचते हो उससे ज़्यादा जानते हो।`,
    scenario: (n, zoneName) =>
      `${zoneName} का लेवल ${n}: झटपट फ़ैसला। एक पल, एक फ़ैसला — जो सीखा है उस पर भरोसा रखो।`,
    authorities: (n, zoneName) =>
      `${zoneName} का लेवल ${n}: मददगारों से मिलो। हर कार्ड टैप करो और बच्चों के असली मददगारों से मिलो — कानून ने इनमें से हर एक को तुम्हारी तरफ़ खड़ा किया है।`,
  },
};

export function getLevelGreeting(
  levelNumber: number,
  kind: LevelGreetingKind,
  zoneName: string,
  language: Language,
): string {
  return LEVEL_GREETINGS[language][kind](levelNumber, zoneName);
}
