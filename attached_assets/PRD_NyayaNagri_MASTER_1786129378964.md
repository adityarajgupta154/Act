# PRD — "Nyaya Nagri" (working title)
### Gamified Legal Literacy Platform for Children's Rights in India (Age 8–18)
**Version:** 2.0 (Master — combines original v1.0 scope with v2.0 new feature pack) | **Prepared for:** SIH1281 — Development of gamified platform on Children's Rights

---

## 1. Problem Statement (Recap)

Children in India (8–18 years) largely remain unaware of the legal rights and protections available to them under Indian law. Traditional legal education is text-heavy, adult-oriented, and disconnected from a child's lived experience. This causes underreporting of abuse, exploitation, and rights violations, and prevents children from becoming informed, empowered citizens.

## 2. Vision

A 3D, open-world, AI-guided gamified platform where a child explores an interactive map of India, completes real-life-scenario "Rights Quests" broken into levels, builds their own avatar, and is personally guided throughout by an AI companion (plus scoped AI role-play characters) — building legal literacy without ever feeling like a legal textbook.

## 3. Target Users & Personas

| Age Band | Persona | Design Implication |
|---|---|---|
| 8–11 (Early Childhood → Middle Childhood) | "Explorer" — low reading fluency, needs audio + visual-first learning, simple cause-effect scenarios | Bright, cartoon-style 3D characters, voice-over-first, short quests (5–7 min), heavy use of "good touch/bad touch," safety, RTE-style content |
| 12–15 (Early Adolescence) | "Investigator" — can read independently, curious about fairness/justice, peer-influenced | Branching moral-dilemma scenarios, light courtroom/authority simulation, cyberbullying & online safety focus |
| 16–18 (Late Adolescence) | "Advocate" — preparing for adulthood, needs practical/legal-process knowledge (ID proof, JJ Act transition, labour rights, marriage age, consent, digital rights) | Realistic simulations of FIR filing, CWC/JJB process, RTI-lite exercises, career/labour rights, leadership & peer-mentoring features |

All personas are designed to be **inclusive regardless of gender, disability, socio-economic background, and language**, per the original problem statement.

## 4. Legal & Regulatory Scope (Comprehensive Act Mapping, Age 8–18)

This is the **authoritative content backbone** — every quest, scenario, and AI-avatar/persona answer must trace back to one of these instruments.

### 4.1 Constitutional Foundation
| Article | Right | Age Relevance |
|---|---|---|
| Art. 14, 15, 15(3) | Equality, non-discrimination, special provisions for children | All ages |
| Art. 21 | Right to life & personal liberty | All ages |
| Art. 21A | Free & compulsory education (6–14 yrs) | 8–14 |
| Art. 23 | Prohibition of trafficking & forced labour | All ages |
| Art. 24 | Prohibition of child labour in hazardous work | Below 14 (adolescents 14–18 in hazardous work also protected) |
| Art. 39(e)(f) | State duty to prevent abuse, ensure healthy development | All ages |
| Art. 45 | Early childhood care & education (DPSP) | Context-setting (below 6, referenced for younger siblings module) |
| Art. 51A(k) | Parent/guardian duty to provide education (Fundamental Duty) | 6–14 |

### 4.2 Central Acts (Primary Content Source)

| Act | Core Coverage | Applicable Age | In-game Module |
|---|---|---|---|
| **Protection of Children from Sexual Offences (POCSO) Act, 2012** + POCSO Rules 2020 | Protects every child below 18 from sexual abuse, harassment, exploitation; mandatory reporting; child-friendly investigation/trial | 8–18 (universal) | "Safe Zone" quest arc — good touch/bad touch (8–11), consent & digital safety (12–15), reporting process & POCSO courts (16–18) |
| **Juvenile Justice (Care and Protection of Children) Act, 2015** (amended 2021) | Two categories — Children in Conflict with Law (JJB) and Children in Need of Care & Protection (CWC); SJPU, DCPU, SCPS as supporting authorities | 8–18, critical for 16–18 (JJ Board transition understanding) | "Justice System Simulator" — walk through what happens when a child interacts with police/CWC/JJB, told from a rights-protective (not punitive) lens |
| **Right of Children to Free and Compulsory Education (RTE) Act, 2009** | Free & compulsory education, 6–14 yrs, 25% EWS quota in private schools, no expulsion/detention till elementary completion | 6–14 (core), awareness content extends to 15–18 as "what changes after 14" | "School Rights" quest — EWS admission rights, no-detention policy, right to safe school environment |
| **Child Labour (Prohibition & Regulation) Act, 1986 / Amendment 2016** | Prohibits employment of children under 14 in all occupations; regulates & restricts hazardous work for adolescents 14–18 | Below 14 = full prohibition; 14–18 = hazardous-work protection | "Right to Childhood" quest — spotting child labour, understanding adolescent work protections |
| **Prohibition of Child Marriage Act, 2006** | Bans marriage below 18 for girls / 21 for boys; provides annulment & legal aid mechanisms | 12–18 primarily | **NEW v2.0:** "Family & Community Shield" quest (Zone 6) — was only referenced in v1.0, now has dedicated content for 12–15 and 16–18 |
| **Commissions for Protection of Child Rights Act, 2005** | Establishes NCPCR & SCPCRs to monitor implementation of child protection laws | All ages (civic literacy) | Folded into the "Meet the Authorities" hub inside Zone 6 (v2.0) |
| **Information Technology Act, 2000 (as amended)** + IT Rules 2021 | Cybercrime provisions relevant to online child sexual abuse material, cyberbullying, cyber harassment | 10–18 (digital-native age band) | "Digital Rights & Safety" quest — cyberbullying, online grooming red flags, safe reporting via Cyber Crime Helpline 155260 |
| **Immoral Traffic (Prevention) Act, 1956** | Anti-trafficking provisions | 12–18 (age-sensitive framing) | Woven into "Justice System Simulator" as an advanced-level scenario for 16–18 only |
| **Persons with Disabilities Act (RPWD), 2016** — child provisions | Right to inclusive education, non-discrimination for children with disabilities | 8–18 | Cross-cutting accessibility narrative + a dedicated "Every Child Counts" inclusion module |
| **Digital Personal Data Protection (DPDP) Act, 2023** | Parental/guardian consent required for processing children's personal data online | Governs the platform itself (not just content) | Drives the app's own consent & data-minimization design (see §7) |

### 4.3 Supporting Institutions & Schemes (for the "Who Can Help Me" in-game directory)
- **CHILDLINE 1098** — 24/7 helpline, now integrated with Emergency Response Support System 112
- **POCSO e-Box** — online complaint mechanism (NCPCR)
- **Mission Vatsalya (2022)** — integrated child protection scheme merging CWC/JJB support, child helpline, institutional care, foster care
- **National/State Commissions for Protection of Child Rights (NCPCR/SCPCR)**
- **Juvenile Justice Board (JJB)**, **Child Welfare Committee (CWC)**, **Special Juvenile Police Unit (SJPU)**, **District Child Protection Unit (DCPU)**
- **Cyber Crime Helpline (155260)** and National Cyber Crime Reporting Portal

> **Design Rule:** The platform NEVER attempts to replace or duplicate these reporting systems. It only educates and deep-links to them. This is a core ethical safeguard and a strong differentiator for judges.

## 5. Goals Mapped to the Original 6 Impact/Deliverable Points

1. **Functional prototype** → Playable 3D web build (Replit-hosted) covering at least 2 fully complete quest arcs + AI avatar + 1 language pair (Hindi/English) by prototype stage.
2. **User testing & feedback data** → In-app micro-surveys, pre/post rights-literacy quiz score delta, session analytics (time-on-task, quest/level completion rate).
3. **Comprehensive report & presentation** → Documented design decisions, legal-accuracy review process, ethical/data-privacy considerations (this PRD is the seed document).
4. **Increased legal literacy** → Measured via pre/post assessment score improvement per quest arc.
5. **Empowerment to stand up for rights** → Measured via in-app "what would you do" decision scenarios + optional peer-support pod engagement.
6. **Engagement in legal processes/systems** → Measured via completion of "Justice System Simulator" + click-through to real helplines/resources (tracked anonymously, opt-in only).

## 6. Functional Requirements — Core (v1.0)

### 6.1 3D Interactive World
- Stylized low-poly 3D map of India (Three.js) — states unlock progressively or are freely explorable
- Each state/region node opens a themed "Rights Quest" (see §4.2 module mapping)
- Simple third-person or top-down character movement; controls must work on both desktop (keyboard) and mobile (touch joystick) since target users may only have phone access

### 6.2 AI Avatar Companion — "Adhikar Didi/Bhaiya"
- Persistent, animated on-screen guide (2D animated sprite MVP → 3D avatar in later phase)
- Personality tone adapts by selected age band (8–11 simple/playful, 12–15 curious/peer-like, 16–18 respectful/practical)
- Capabilities: explains quest objectives, answers "why" questions about a right using pre-approved legal content, offers encouragement, and — critically — **recognizes distress/disclosure language and immediately surfaces Childline 1098 / Cyber Crime 155260 contact info**, without attempting to "handle" the disclosure itself
- Hard guardrails (must be enforced in system prompt): no medical/legal advice beyond pre-approved factual content, no collection of personally identifiable information, no private/unmoderated chat with strangers, escalate-don't-solve for any real disclosure

### 6.3 Adaptive & Modular Learning
- Age-band selection at onboarding (with parent/teacher-assisted setup option for younger users)
- Difficulty/reading-level auto-adjusts based on quiz performance
- Progress dashboard (child-facing: badges/stars; teacher/parent-facing, opt-in: literacy growth summary — no sensitive disclosure data ever surfaced here)

### 6.4 Accessibility & Inclusion
- Hindi + English at MVP; **Marathi/Tamil/Bengali/Gujarati (added v2.0)** as stretch goals
- Full audio narration for every text block (non-readers, visually impaired)
- Dyslexia-friendly font toggle, high-contrast mode, adjustable text size
- Offline-friendly lightweight assets where possible (bandwidth-constrained users)
- RPWD-aligned inclusive character representation (a supporting character with a disability, portrayed positively — not tokenistic)

### 6.5 Social & Community Features
- Moderated "Rights Circles" — small peer discussion pods, NGO/teacher-moderated only, no open DMs
- Periodic "Ask a Legal Expert" AMA text sessions (scheduled, moderated, logged)
- No public profile pictures, no location sharing, no real-name requirement — pseudonymous by design

### 6.6 Integration with Support Services
- One-tap access to Childline 1098 / Cyber Crime 155260 / POCSO e-Box, visible at all times via a persistent "Get Help Now" button (not buried in menus)
- Clear, age-appropriate explainer on **what happens after you call** (reduces fear of reporting)

---

## 7. Functional Requirements — New in v2.0

The following are **additive** modules layered on top of §6. Nothing in §6 changes.

### 7.1 Level-Based Progression System
- Each zone (existing 5 + 2 new zones in §7.6) is broken into **3–4 Levels** (e.g. Level 1 = story/narration, Level 2 = branching decision scenario, Level 3 = mini-game reinforcement, Level 4 = boss quiz — must pass to unlock the next zone).
- A **Level-Select screen** appears on entering a zone: a simple node/path map showing locked/unlocked/completed levels.
- Levels within a zone unlock sequentially; the zone itself unlocks the next zone only once its final level is passed (existing zone-lock logic from §6.1 stays intact, this is a layer underneath it).
- Completed levels can be replayed for practice without affecting the analytics score already recorded.

### 7.2 Player Avatar Creation & Customization
- Separate from the AI companion (§6.2) — this is the **child's own playable character**.
- Simple avatar builder at first-time onboarding (after age-band selection): base look, skin-tone range, hair/clothing style, starter accessories — illustrated/cartoon assets only, **no photo upload, no camera access, no biometric data, ever**.
- Display **nickname only** (never a real name), reusing the §6.5 no-real-name rule.
- Accessories/outfits unlock through gameplay (via the economy layer, §7.3) — **no real-money transactions anywhere in the product**.
- Avatar appears as the player's marker on the zone/level map and as a HUD icon — cosmetic only, never affects difficulty or content.
- Editable later from Settings.

### 7.3 Game Economy Layer
- **XP** — earned per level completed, drives a "Player Rank" (kept visually/labelled distinct from in-zone "Level X of Zone Y" to avoid confusion).
- **Coins** — earned alongside XP, spendable ONLY on cosmetic avatar unlocks. No real money anywhere.
- **Daily Streak** — gentle, non-punishing consecutive-day counter — no guilt-based dark patterns, consistent with child-wellbeing-first design.
- **Titles** — small unlockable flavor text (e.g., "Safe Zone Guardian") shown on a private profile, never shared publicly.
- **Leaderboard** — **cohort-scoped only** (within one teacher-created classroom/session group), pseudonymous nicknames, opt-in (default off). A global/public/cross-school leaderboard is explicitly **out of scope** and must not be added without a full child-safety review.

### 7.4 AI Role-Play Persona System
- Adds AI-driven characters beyond the single companion avatar: **Police Officer, Lawyer, Teacher, Judge, Parent/Guardian**, each a simple 2D sprite with its own narrowly-scoped system prompt (same secure server-side API pattern as §6.2).
- Each persona may discuss **only** its designated in-scene topic (e.g., "Judge" only explains what a JJB/CWC hearing conceptually looks like) and must politely refuse to go off-topic.
- **Every §6.2 safety guardrail (no PII, no advice beyond pre-approved facts, immediate distress-disclosure escalation) applies individually and without exception to every persona** — never assumed as "inherited," must be explicitly enforced per persona.
- Every persona-driven scene opens with a clear disclaimer: "This is a role-play, not a real [Police Officer/Lawyer/etc.]"
- Interview UI uses safe suggested-question chips by default, plus optional short free text (still fully guardrailed).
- Primary use: powers a more interactive version of the "Justice System Simulator" (Zone 4) for the 12–15 and 16–18 age bands; the gentler 8–11 flowchart-style version needs no personas.

### 7.5 Mini-Game Variety Pack
New level *types* that plug into the Level System (§7.1) via a `levelType` field on the existing quest schema:
- **Memory Cards** — match a right/law to its correct short description.
- **Hidden Object** (8–11 band only) — spot 3–4 "red flag" cues in a static, non-distressing illustrated scene.
- **Puzzle/Sorting** — drag-and-sort scenario cards into "Safe" / "Tell a Trusted Adult" / "Emergency — Call Childline."
- **Scenario Selection** — a faster single-screen decision-and-feedback format for quick reinforcement.

### 7.6 Two New Zones
Topics referenced in §4 but with no dedicated content in v1.0:

**Zone 0 — "Know Yourself"** (plays before Zone 1): foundational Constitutional basics (Art. 14/15/21), the concept of "what a right is," identity and self-respect framing across all age bands.

**Zone 6 — "Family & Community Shield"** (plays after the original 5 zones): covers the Prohibition of Child Marriage Act, 2006 (previously only listed in §4.2, no zone existed) and general age-appropriate home-safety/domestic-violence awareness, following the exact same non-graphic, empowering-resolution content rules as the existing Safe Zone. Also consolidates the "Who Protects My Rights" authority directory (§4.3) into an explorable in-zone "Meet the Authorities" hub.

### 7.7 AI Dynamic Story Variation Layer (Guardrailed)
- Optional, toggle-able layer giving cosmetic freshness to already-approved static scenes (character names, minor setting/dialogue phrasing only), via the same secure server-side API pattern.
- **Hard-locked, never regenerated:** choice correctness, all quiz content, and any safety-critical text (helpline numbers, Get Help wording, escalation text) — these are always passed through unmodified.
- If disabled or if the API call fails, falls back cleanly to the fully static v1.0 content with zero functional loss.
- Purpose: adds "no two playthroughs are identical" freshness without ever compromising the platform's core legal-accuracy guarantee (§9).

### 7.8 Teacher Assignment System + Certificates
- Extends the existing opt-in teacher/parent dashboard (§6.3): teachers can mark zones/levels as "assigned" to their cohort with an optional due-date label.
- Aggregate-only "Assignment Completion %" view — never shows an individual child's specific choices or scores, consistent with the existing §6.3 privacy rule.
- On completing a zone, a simple downloadable/printable certificate can be generated (zone name, completion date, pseudonymous ID or a parent-entered first name only — never other PII).

### 7.9 Additional Language: Gujarati
Added to the §6.4 stretch-goal language list, using the identical i18n bundle architecture — no new infrastructure required.

---

## 8. High-Level System Architecture

```
[Browser Client - Replit hosted]
   ├─ Three.js 3D World Renderer (map, zones, levels, characters, player avatar)
   ├─ AI Avatar Module
   │     ├─ Companion avatar (Adhikar Didi/Bhaiya) + Role-Play Personas (Judge/Police/Lawyer/Teacher/Parent)
   │     ├─ Conversation logic → Claude API (Claude Fable, age-band + persona-scoped system prompts + safety guardrails)
   │     ├─ TTS/STT → Web Speech API
   │     └─ Avatar animation layer (2D Rive/Lottie MVP → 3D later)
   ├─ Player Avatar Builder (cosmetic customization, no photo/camera)
   ├─ Quest & Level Engine (state machine per quest arc, level structure, branching scenarios, mini-game level types)
   ├─ Story Variation Layer (optional, guardrailed cosmetic AI rewriting of locked-safe fields only)
   ├─ Adaptive Learning Engine (progress + difficulty logic)
   ├─ Game Economy Module (XP, Coins, Streak, Titles, cohort-scoped Leaderboard)
   ├─ Localization Layer (i18n content bundles: English, Hindi, + Marathi/Tamil/Bengali/Gujarati stretch)
   └─ Accessibility Layer (audio, font, contrast toggles)

[Backend - Replit DB / lightweight server]
   ├─ Anonymous user/progress store (pseudonymous IDs only)
   ├─ Content/quest JSON store (versioned, reviewable, includes levelType + locked-field schema)
   ├─ Analytics aggregator (for impact measurement, no PII)
   ├─ Teacher cohort/assignment store (aggregate-only views)
   └─ Moderation queue (for community features)
```

## 9. Ethical & Safety Considerations (for the report/presentation deliverable)

1. Platform is an **awareness and confidence-building tool**, not a legal-advice or crisis-response service — every screen that could be mistaken for the latter must redirect to real authorities (Childline, CWC, police, cyber helpline).
2. The AI companion avatar AND every role-play persona must never simulate being a real counsellor or authority figure — each must clearly present itself as a guide/companion or a labelled role-play, not a real person, at every appearance.
3. No real-time unmoderated communication between children and unknown adults or other children.
4. Guardian/teacher consent and data minimization by default (DPDP Act, 2023) — this now also covers the avatar builder (no photos/biometrics) and certificate generation (no unrequested PII).
5. Content must be reviewed for trauma-sensitivity — sensitive topics (abuse, trafficking, child marriage, domestic violence) shown through implication and safe narrative distance, not graphic depiction, especially for the 8–11 band.
6. The Game Economy contains zero real-money mechanics, zero pay-to-win, and zero manipulative streak-guilt patterns.
7. The Leaderboard is cohort-scoped and pseudonymous only; a global/public leaderboard requires a full safety review before it could ever be considered.
8. The AI Dynamic Story Variation Layer must never regenerate legal facts, choice correctness, quiz content, or safety/helpline text — these remain hard-coded, read-only fields at all times.

## 10. Deliverables & Milestones

| Milestone | Output |
|---|---|
| M1 | PRD (this doc) + legal content matrix finalized |
| M2 | 3D world shell + navigation (Replit/Three.js) |
| M3 | AI Avatar MVP (text-based, 1 age band) integrated |
| M4 | Quest Arc 1 (POCSO/Safe Zone) fully playable |
| M5 | Quest Arc 2 (Justice System Simulator) fully playable |
| M6 | Adaptive learning + progress dashboard |
| M7 | Accessibility + Hindi/English localization pass |
| M8 | Community/moderated features + support-service integration |
| M9 | User testing round, feedback collection, analytics report |
| M10 | Final report + presentation deck |
| **M11 (v2.0)** | Level system, player avatar builder, game economy layer |
| **M12 (v2.0)** | AI role-play personas + mini-game variety pack |
| **M13 (v2.0)** | Zone 0 "Know Yourself" + Zone 6 "Family & Community Shield" |
| **M14 (v2.0)** | Guardrailed story variation layer + teacher assignments/certificates + Gujarati |
| **M15 (v2.0)** | Full v1.0 + v2.0 integration QA pass |

## 11. Out of Scope (for hackathon prototype phase)
- Real-time human counsellor chat (routed externally instead)
- Native mobile app builds (web-first, responsive)
- Full multi-state regional language coverage (Hindi/English MVP, Marathi/Tamil/Bengali/Gujarati stretch)
- Blockchain/NFT badge systems (not needed to prove core impact)
- Real-money transactions of any kind
- Global/public/cross-school leaderboards

## 12. Success Metrics Summary

**Core (v1.0):**
- ≥70% improvement in pre/post rights-literacy quiz scores in user testing
- ≥80% quest completion rate among test users
- Positive qualitative feedback on "I know who to talk to if something is wrong" (self-reported confidence metric)
- Zero safety incidents in community/AI-avatar interactions during testing

**New (v2.0):**
- Level completion rate per zone (more granular than zone-level completion)
- Daily Streak engagement distribution (informational only — never used to guilt or penalize)
- Cohort leaderboard opt-in rate (measures adoption of the safety-scoped design)
- Certificate downloads per completed zone (proxy for perceived achievement/parent engagement)
