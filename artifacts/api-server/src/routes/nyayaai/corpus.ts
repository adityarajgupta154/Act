/**
 * Nyaya AI — retrieval corpus (lightweight RAG, SIH requirement).
 *
 * Every passage below is a hand-written, pre-approved summary of an
 * instrument from the PRD §4 "Legal & Regulatory Scope" content backbone —
 * the SAME authoritative act mapping that powers every quest and AI surface.
 * The primary public source for all of these laws is India Code
 * (https://www.indiacode.nic.in/), the Government of India's official
 * repository of Central and State legislation.
 *
 * GROUNDING RULES (PRD §9.8 — legal facts are hard-coded, never generated):
 *   - Gemini may state legal facts ONLY from passages retrieved from this
 *     corpus for the current question; no passage → the model must say it
 *     is not sure (enforced in the system prompt).
 *   - Passages carry the act NAME + YEAR exactly as in the PRD. We cite the
 *     India Code SITE as the source; we never fabricate deep links or
 *     section-level citations the corpus does not contain.
 *   - Passages NEVER contain helpline digits or "call this number" phrasing:
 *     helpline guidance is exclusively owned by the deterministic escalation
 *     path, and the fail-closed output gate would (correctly) replace any
 *     reply that echoed helpline digits from a passage.
 *   - Trauma-sensitivity (PRD §9.5): sensitive subjects are described in
 *     protective, non-graphic language.
 */

export interface CorpusEntry {
  /** Stable id for tests/logging. */
  id: string;
  /** Zone this law is taught in (world/zones.ts ids, e.g. "zone3"). */
  zoneId: string;
  /** Act / article name exactly as in the PRD §4 backbone. */
  act: string;
  /** Public source for the full text (official site — never a guessed deep link). */
  url: string;
  /**
   * Match terms: English + romanized Hindi + Devanagari + a few Gujarati
   * terms. Latin-only keywords are matched on word boundaries; others by
   * substring. Keep terms lowercase.
   */
  keywords: string[];
  /** 2-3 gentle, factual sentences. The ONLY text Gemini may cite as law. */
  text: string;
}

const INDIA_CODE = "https://www.indiacode.nic.in/";

export const CORPUS: CorpusEntry[] = [
  {
    id: "const-equality",
    zoneId: "zone0",
    act: "Constitution of India — Articles 14, 15 and 15(3)",
    url: INDIA_CODE,
    keywords: [
      "equal", "equality", "discrimination", "unfair", "caste", "religion",
      "girl", "boy", "samanta", "bhedbhav", "समानता", "भेदभाव", "बराबरी",
      "ભેદભાવ", "સમાનતા",
    ],
    text:
      "Article 14 of the Constitution of India says every person, including every child, is equal before the law. Article 15 does not allow unfair treatment because of religion, caste, sex, or place of birth, and Article 15(3) specially allows the government to make extra protections for children.",
  },
  {
    id: "const-life-liberty",
    zoneId: "zone0",
    act: "Constitution of India — Article 21",
    url: INDIA_CODE,
    keywords: [
      "life", "liberty", "freedom", "dignity", "article 21", "azadi",
      "jeevan", "जीवन", "आज़ादी", "स्वतंत्रता", "સ્વતંત્રતા",
    ],
    text:
      "Article 21 of the Constitution protects every person's right to life and personal liberty. For children this means the right to live safely, with dignity, and to grow up free from harm.",
  },
  {
    id: "const-child-development",
    zoneId: "zone0",
    act: "Constitution of India — Articles 39(e) and 39(f)",
    url: INDIA_CODE,
    keywords: [
      "healthy", "development", "protect", "exploitation", "state duty",
      "grow", "childhood", "बचपन", "विकास", "શોષણ",
    ],
    text:
      "Articles 39(e) and 39(f) of the Constitution direct the State to protect children from abuse and exploitation, and to make sure every child can develop in a healthy, free, and dignified way.",
  },
  {
    id: "rte-act",
    zoneId: "zone3",
    act: "Right of Children to Free and Compulsory Education (RTE) Act, 2009 — with Article 21A",
    url: INDIA_CODE,
    keywords: [
      "education", "school", "study", "rte", "free", "compulsory", "fees",
      "admission", "expel", "expulsion", "detention", "fail", "exam",
      "teacher", "padhai", "shiksha", "vidyalaya", "शिक्षा", "स्कूल",
      "पढ़ाई", "दाखिला", "શિક્ષણ", "ભણતર", "સ્કૂલ",
    ],
    text:
      "Article 21A of the Constitution and the RTE Act, 2009 give every child aged 6 to 14 the right to free and compulsory education in a nearby school. Private schools must keep 25% of their entry-class seats for children from economically weaker families, and no child can be expelled or held back in a class before finishing elementary school.",
  },
  {
    id: "const-education-duty",
    zoneId: "zone3",
    act: "Constitution of India — Articles 45 and 51A(k)",
    url: INDIA_CODE,
    keywords: [
      "parents duty", "guardian", "early childhood", "anganwadi",
      "small children", "below six", "fundamental duty", "माता-पिता",
      "कर्तव्य",
    ],
    text:
      "Article 51A(k) of the Constitution makes it a fundamental duty of parents and guardians to provide education opportunities to their child aged 6 to 14. Article 45 asks the State to provide early childhood care and education for children below 6 years.",
  },
  {
    id: "child-labour-act",
    zoneId: "zone2",
    act: "Child Labour (Prohibition & Regulation) Act, 1986 (Amendment 2016) — with Article 24",
    url: INDIA_CODE,
    keywords: [
      "labour", "labor", "work", "working", "job", "factory", "shop",
      "dhaba", "hotel", "hazardous", "employment", "kaam", "majdoori",
      "naukri", "मजदूरी", "मज़दूरी", "काम", "बाल श्रम", "બાળમજૂરી", "કામ",
    ],
    text:
      "The Child Labour (Prohibition & Regulation) Act, 1986, strengthened in 2016, does not allow children below 14 to be employed in any occupation, with narrow exceptions like helping the family outside school hours. Adolescents aged 14 to 18 cannot be made to do hazardous (dangerous) work. Article 24 of the Constitution also prohibits child labour in dangerous workplaces like factories and mines.",
  },
  {
    id: "pocso-act",
    zoneId: "zone1",
    act: "Protection of Children from Sexual Offences (POCSO) Act, 2012 (with POCSO Rules, 2020)",
    url: INDIA_CODE,
    keywords: [
      "touch", "unsafe touch", "bad touch", "good touch", "uncomfortable",
      "harassment", "abuse", "pocso", "secret", "molest", "consent",
      "गलत", "छूना", "पॉक्सो", "છેડતી", "પોક્સો",
    ],
    text:
      "The POCSO Act, 2012 protects every child below 18 from sexual abuse, harassment, and exploitation. Adults who know that such harm happened to a child are required by law to report it, and courts must handle these cases in a child-friendly way, so the child feels safe while telling the truth.",
  },
  {
    id: "jj-act",
    zoneId: "zone4",
    act: "Juvenile Justice (Care and Protection of Children) Act, 2015 (amended 2021)",
    url: INDIA_CODE,
    keywords: [
      "police", "arrest", "jail", "court", "justice", "juvenile", "crime",
      "cwc", "jjb", "child welfare committee", "conflict with law",
      "orphan", "care", "protection", "न्याय", "पुलिस", "अदालत", "जेल",
      "પોલીસ", "ન્યાય",
    ],
    text:
      "The Juvenile Justice Act, 2015 protects two groups of children: children who need care and protection (helped by the Child Welfare Committee, CWC) and children in conflict with the law (handled by the Juvenile Justice Board, JJB). A child is never treated like an adult criminal — the law focuses on care, protection, and giving the child a fresh start.",
  },
  {
    id: "pcma-act",
    zoneId: "zone6",
    act: "Prohibition of Child Marriage Act (PCMA), 2006",
    url: INDIA_CODE,
    keywords: [
      "marriage", "married", "marry", "wedding", "bride", "groom", "shaadi",
      "vivah", "शादी", "विवाह", "बाल विवाह", "લગ્ન", "બાળ લગ્ન",
    ],
    text:
      "The Prohibition of Child Marriage Act, 2006 says a girl cannot be married before 18 and a boy before 21. A child who was married below that age can ask the court to cancel (annul) the marriage, and adults who arrange or perform a child marriage can be punished.",
  },
  {
    id: "cpcr-act",
    zoneId: "zone6",
    act: "Commissions for Protection of Child Rights Act, 2005 (NCPCR & SCPCRs)",
    url: INDIA_CODE,
    keywords: [
      "commission", "ncpcr", "scpcr", "complaint", "authority", "watchdog",
      "who protects", "government body", "आयोग", "शिकायत",
    ],
    text:
      "The Commissions for Protection of Child Rights Act, 2005 created the National Commission for Protection of Child Rights (NCPCR) and State Commissions (SCPCRs). Their job is to check that children's rights and child-protection laws are actually followed, and to look into complaints when they are not.",
  },
  {
    id: "it-act",
    zoneId: "zone5",
    act: "Information Technology Act, 2000 (as amended, with IT Rules 2021)",
    url: INDIA_CODE,
    keywords: [
      "online", "internet", "cyber", "cyberbullying", "bully", "bullying",
      "troll", "trolling", "hack", "hacked", "hacking", "password", "photo",
      "video", "screenshot", "stranger", "game chat", "social media",
      "instagram", "whatsapp", "phone",
      "साइबर", "ऑनलाइन", "फ़ोटो", "ઓનલાઈન", "સાયબર",
    ],
    text:
      "The Information Technology Act, 2000 makes online harms punishable — like cyberbullying, breaking into someone's account, pretending to be another person, and sharing someone's private pictures without permission. Children have the right to be safe online, and online abuse aimed at children is treated as a serious crime.",
  },
  {
    id: "dpdp-act",
    zoneId: "zone5",
    act: "Digital Personal Data Protection (DPDP) Act, 2023",
    url: INDIA_CODE,
    keywords: [
      "data", "privacy", "personal information", "consent", "permission",
      "app", "tracking", "ads", "account", "sign up", "निजता", "डेटा",
      "ડેટા", "ગોપનીયતા",
    ],
    text:
      "The Digital Personal Data Protection (DPDP) Act, 2023 protects everyone's personal data. For children below 18, apps and websites need a parent's or guardian's verifiable consent before using the child's data, and they are not allowed to track children or show them targeted advertising.",
  },
  {
    id: "trafficking",
    zoneId: "zone4",
    act: "Immoral Traffic (Prevention) Act, 1956 — with Article 23",
    url: INDIA_CODE,
    keywords: [
      "trafficking", "forced labour", "forced work", "begging", "taken away",
      "kidnap", "sold", "तस्करी", "जबरदस्ती",
    ],
    text:
      "Article 23 of the Constitution and the Immoral Traffic (Prevention) Act, 1956 prohibit human trafficking and forced labour. Nobody is allowed to buy, sell, move, or force another person — child or adult — to work or go somewhere against their will, and the law punishes people who do this.",
  },
];
