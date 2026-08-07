# Replit + Claude Fable — Task-by-Task Build Prompts (MASTER: Task 0–24)
### For: "Nyaya Nagri" Children's Rights Gamified Platform
### Covers core v1.0 build (Tasks 0–13) + v2.0 new feature pack (Tasks 14–24) in one file

**How to use this file:**
Paste ONE prompt at a time into Replit Agent (Claude Fable model). Wait for each task to fully build and test before moving to the next — this is a heavy project, so building it in isolated, verifiable chunks prevents context overload and broken builds. Each prompt is self-contained and tells the agent exactly what already exists and what to add next. Follow the tasks in strict numeric order, Task 0 through Task 24 — later tasks assume every earlier task is already complete and working, and will tell you not to rebuild or duplicate anything from before.

## TASK 0 — Project Foundation & Architecture Setup

```
You are building a 3D educational game for children (ages 8-18) in India about their legal rights, using Three.js. This is Task 0 of a multi-stage build — set up ONLY the foundation in this task, nothing else.

Create a new Replit project (JavaScript/HTML/CSS, Three.js via CDN or npm). Set up:

1. A clean project structure:
   /src
     /world        (3D scene, map, environment)
     /avatar       (AI companion logic + animation)
     /quests       (quest engine + quest content JSON)
     /ui           (HUD, menus, accessibility controls)
     /i18n         (localization strings)
     /data         (progress storage helpers)
   /assets         (models, textures, audio placeholders)
   index.html
   main.js

2. A basic Three.js scene: a stylized low-poly ground plane representing a simplified map of India (can be a placeholder flat terrain with region markers for now — do not build detailed geography yet), a camera with orbit/follow controls, basic lighting (ambient + directional), and a simple placeholder character (a capsule or box mesh is fine) that can move with WASD (desktop) and an on-screen virtual joystick (mobile/touch).

3. A minimal HUD: title "Nyaya Nagri", a settings icon (non-functional placeholder for now), and a persistent "Get Help Now" button in a corner that currently just shows an alert with the text "Childline 1098 | Cyber Crime 155260" — this button must NEVER be removed in any future task, it is a permanent safety feature.

4. Set up a simple state/progress store using Replit's built-in storage (or localStorage-equivalent in-memory JS object, since browser storage restrictions apply for embedded contexts — use an in-memory JS store with a save/load interface function so it can be swapped for real persistence later).

5. Make sure the scene runs at a stable frame rate on a mid-range device — keep polygon counts low, avoid heavy post-processing.

Do not add quest content, AI avatar logic, or accessibility features yet — those are separate tasks. End by confirming the scene runs, character moves, and the Get Help button works.
```

---

## TASK 1 — Map & Navigation System

```
Continuing the "Nyaya Nagri" project (foundation from Task 0 already exists: Three.js scene, movable character, basic HUD with a permanent Get Help button — do not modify or remove that button).

Now build the map/navigation layer:

1. Replace the placeholder flat terrain with a stylized low-poly "map" made of 5 distinct zone markers (glowing pillars or icons are fine, no need for detailed geography), each representing one Rights Quest:
   - Zone 1: "Safe Zone" (personal safety / POCSO awareness)
   - Zone 2: "Right to Childhood" (child labour awareness)
   - Zone 3: "School Rights" (RTE / education rights)
   - Zone 4: "Justice System Simulator" (Juvenile Justice Act / CWC / JJB walkthrough)
   - Zone 5: "Digital Safety" (cyberbullying / online safety)

2. When the character walks near a zone marker, show a floating label with the zone name and a "Press E / Tap to Enter" prompt.

3. Build a simple zone-lock system: Zone 1 is unlocked by default, others show a lock icon until the previous zone's quest is marked complete in the progress store (use the save/load interface from Task 0).

4. Add a simple minimap or compass UI element in the corner showing the player's position relative to the 5 zones.

5. Add smooth camera transition when entering/exiting a zone (a simple fade-to-black transition is enough, no need for cinematic camera work).

Keep performance light. Do not build the actual quest content inside each zone yet — that comes in later tasks. End by confirming all 5 zones are visible, walkable-to, and show correct lock/unlock state based on progress.
```

---

## TASK 2 — AI Avatar Companion (Core Logic)

```
Continuing the "Nyaya Nagri" project (map, navigation, and zones from Task 1 already exist).

Build the AI Avatar Companion system — this is the child's guide throughout the game, named "Adhikar Didi/Bhaiya."

1. Create a UI panel (dismissible, bottom-corner chat bubble style) that shows the avatar's dialogue as text, with a simple 2D animated placeholder avatar (a simple circular/character sprite with an idle animation loop — do not attempt a 3D avatar yet).

2. Wire this panel to call the Claude API (server-side call, do not expose any API key in client code) with the following system prompt behavior — implement this exactly:

   - The avatar's persona must adapt based on a selected age-band variable already stored in the progress store (default to "12-15" if not set): for 8-11 use very simple, warm, playful language; for 12-15 use a curious, friendly, slightly older-sibling tone; for 16-18 use a respectful, practical, near-adult tone.
   - The avatar ONLY discusses topics related to the specific quest content it's given as context (do not let it go off-topic into unrelated conversation).
   - The avatar must NEVER give medical or legal advice beyond pre-approved factual content passed into its context.
   - The avatar must NEVER ask for or store personally identifiable information (name, address, phone, school name, exact location).
   - CRITICAL SAFETY RULE: if the user's message contains anything resembling a real disclosure of abuse, harm, or a request for personal help (not a hypothetical quiz answer), the avatar must immediately and warmly respond by pointing to Childline 1098 and the in-app "Get Help Now" button, and gently encourage the child to talk to a trusted adult — it must NOT try to counsel, investigate, or continue probing for details.
   - Keep responses short (2-4 sentences), since this is for children.

3. Add a text input (with an optional mic button using the Web Speech API for speech-to-text, and text-to-speech playback of the avatar's replies using Web Speech API's speech synthesis).

4. Add a simple "avatar appears automatically" trigger when the player enters any zone, greeting them and briefly introducing that zone's theme (use placeholder greeting text for each zone for now — real quest scripts come in later tasks).

Test that the chat works end to end, respects the age-band tone, and correctly escalates on a simulated distress message like "someone is hurting me" by showing the help resources instead of trying to handle it.
```

---

## TASK 3 — Quest Engine (Reusable Framework)

```
Continuing the "Nyaya Nagri" project (map, zones, and AI avatar from Tasks 1-2 already exist).

Build a reusable Quest Engine that all 5 zones will plug into — build the ENGINE only in this task, not the specific content for each zone.

1. Create a JSON-based quest schema, e.g.:
   {
     "questId": "safe_zone_8_11",
     "ageBand": "8-11",
     "title": "...",
     "scenes": [
       {
         "sceneId": "scene1",
         "narration": "...",
         "choices": [
           { "text": "...", "outcome": "correct" | "incorrect" | "neutral", "feedback": "...", "nextScene": "scene2" }
         ]
       }
     ],
     "quizQuestions": [
       { "question": "...", "options": ["..."], "correctIndex": 0, "explanation": "..." }
     ]
   }

2. Build a Quest Engine module that:
   - Loads a quest JSON file for the current zone + selected age band
   - Renders narration + branching choices as simple UI (dialogue box + choice buttons), reusing the avatar's chat panel style from Task 2 for visual consistency
   - Tracks the player's choices and shows immediate feedback (correct/incorrect/neutral) with a short explanation
   - At the end of the scene sequence, runs a short quiz (3-5 questions) using the quizQuestions array, and calculates a score
   - Records a "pre-quiz" score (ask the same or similar questions BEFORE the scenario, silently, to measure literacy improvement) and a "post-quiz" score, storing both in the progress store for later analytics
   - On quest completion, unlocks the next zone (using the lock system from Task 1) and awards a simple badge/star shown in the HUD

3. Create ONE placeholder sample quest JSON (simple 2-scene, 3-question quiz, any placeholder rights topic) to verify the engine works end-to-end.

Do not write the real legal content yet — that is Task 4 onward. End by confirming a player can walk into a zone, go through the placeholder quest, answer the quiz, see their score, and unlock the next zone.
```

---

## TASK 4 — Quest Content: Zone 1 "Safe Zone" (POCSO Awareness)

```
Continuing the "Nyaya Nagri" project (Quest Engine from Task 3 already exists and works).

Write and wire up the REAL quest content for Zone 1: "Safe Zone," based on the POCSO Act, 2012 (protection of children under 18 from sexual abuse, harassment, and exploitation; child-friendly reporting).

Create THREE separate quest JSON files (one per age band, following the schema from Task 3):

1. "safe_zone_8_11.json" — Age 8-11: Teach "good touch / bad touch" concept, the idea that a child's body belongs to them, that secrets that make them uncomfortable should always be told to a trusted adult, and that it is never the child's fault. Use a gentle, non-graphic, metaphor-based scenario (e.g., a character who learns it's okay to say "no" and tell someone). Keep language extremely simple. 3-4 scenes, 3 quiz questions.

2. "safe_zone_12_15.json" — Age 12-15: Cover consent, personal boundaries, safe vs unsafe online interactions, and the basics of what POCSO protects against, in age-appropriate non-graphic language. Include a scenario about recognizing manipulation/grooming red flags (online or offline) and choosing to tell a trusted adult or use Childline 1098. 4-5 scenes, 4-5 quiz questions.

3. "safe_zone_16_18.json" — Age 16-18: Cover POCSO's legal framework at a practical level — what counts as an offense, that a minor's "consent" is not legally valid, that reporting is confidential and child-friendly, what a POCSO court process looks like at a high level, and how to support a friend who discloses abuse (listen, don't investigate, help them reach Childline 1098 or a trusted adult). 5 scenes, 5 quiz questions.

IMPORTANT CONTENT RULES for all three:
- No graphic or explicit descriptions of abuse — imply, don't depict.
- Every scenario must end with a clear, positive, empowering resolution (the character seeks help and is supported).
- Every quest must explicitly mention Childline 1098 as a resource at least once.
- Feedback text for choices should explain WHY an answer is right/wrong in simple terms, referencing the underlying right being protected.

Wire these three files into Zone 1 so the correct one loads based on the player's selected age band. Update the AI avatar's zone-entry greeting for Zone 1 to reflect this real content (also age-band specific, matching the tone rules from Task 2).

Test that all three age-band versions play correctly and that quiz scores are recorded.
```

---

## TASK 5 — Quest Content: Zone 2 "Right to Childhood" (Child Labour Awareness)

```
Continuing the "Nyaya Nagri" project (Zone 1 fully complete from Task 4).

Write and wire up quest content for Zone 2: "Right to Childhood," based on the Child Labour (Prohibition & Regulation) Act, 1986 / Amendment 2016 (prohibits employment of children under 14 in all occupations; restricts hazardous work for adolescents 14-18) and Article 24 of the Constitution, plus its connection to the RTE Act (working prevents schooling).

Create THREE age-band quest JSON files following the same schema and content rules as Task 4:

1. Age 8-11: A story about noticing a child their age working instead of going to school, learning that every child has the right to play, learn, and rest, and that this is protected by law — introduce the idea gently, focused on empathy and awareness, not legal complexity.

2. Age 12-15: A branching scenario where the player encounters a peer being made to work in hazardous conditions, learns the difference between age-appropriate family chores/small help and exploitative child labour, and learns who to inform (teacher, Childline 1098, local Child Welfare Committee).

3. Age 16-18: Cover the adolescent (14-18) labour protections specifically — what "hazardous occupation" restrictions mean for their own part-time work rights as they approach working age, and how the law connects to the right to continued education.

Wire into Zone 2, add age-band-specific avatar greeting, test all three paths and quiz recording, following the exact same pattern established in Task 4.
```

---

## TASK 6 — Quest Content: Zone 3 "School Rights" (RTE Act)

```
Continuing the "Nyaya Nagri" project (Zones 1-2 complete).

Write and wire up quest content for Zone 3: "School Rights," based on the Right of Children to Free and Compulsory Education (RTE) Act, 2009 (free & compulsory education ages 6-14, 25% EWS quota in private schools, no expulsion/detention/board exam until elementary completion, right to safe school infrastructure) and Article 21A.

Create THREE age-band quest JSON files (same schema/rules as Task 4):

1. Age 8-11: A simple story about a character whose family cannot afford school fees, learning that education is free and compulsory for them, and that no child can be turned away or expelled for not being able to pay.

2. Age 12-15: A scenario about a friend at risk of being pulled out of school, exploring the EWS 25% quota right in private schools, the "no detention" concept, and the right to a safe, harassment-free school environment — connect to reporting unsafe school situations.

3. Age 16-18: Cover what changes after age 14 (RTE's compulsory-education guarantee ends at 14), the importance of continuing education, and rights related to school-level grievance redressal and safe environment even in secondary/senior secondary school, plus a brief mention of how this connects to child labour protections (Zone 2) for context.

Wire into Zone 3, age-band avatar greetings, test end to end exactly as in prior tasks.
```

---

## TASK 7 — Quest Content: Zone 4 "Justice System Simulator" (JJ Act Walkthrough)

```
Continuing the "Nyaya Nagri" project (Zones 1-3 complete).

Build Zone 4: "Justice System Simulator," based on the Juvenile Justice (Care and Protection of Children) Act, 2015 (amended 2021). This zone should feel different from the others — instead of only branching narrative, build a simple "process map" mini-simulation showing what happens when a child interacts with the child protection system, from a rights-protective (not punitive) angle.

Cover BOTH categories the JJ Act defines:
- "Child in Need of Care and Protection" (CNCP) — e.g., an abandoned, at-risk, or abused child — routed through the Child Welfare Committee (CWC)
- "Child in Conflict with Law" (CCL) — a child accused of an offense — routed through the Special Juvenile Police Unit (SJPU) and Juvenile Justice Board (JJB), emphasizing that the system is designed for reform and rehabilitation, not punishment

Create THREE age-band versions:

1. Age 8-11: Very light-touch — simply introduce that there are kind, dedicated systems (CWC, Childline) whose job is to help and protect children, not punish them, through a simple reassuring story.

2. Age 12-15: An interactive flowchart-style walkthrough — the player clicks through the stages (e.g., "A child is found in need of protection → who is contacted → what CWC does → where the child stays temporarily → reunification/rehabilitation focus"), with short quiz checkpoints.

3. Age 16-18: A more detailed and realistic simulation covering both CNCP and CCL pathways, key authorities (JJB, CWC, SJPU, DCPU) and their roles, and the core principle that the JJ Act prioritizes rehabilitation over punishment for children in conflict with law — include a quiz testing understanding of which authority handles which situation.

Use the same JSON schema and content rules as Task 4 (no graphic content, always end empowering, mention relevant helplines). Wire into Zone 4, add avatar greetings, test thoroughly.
```

---

## TASK 8 — Quest Content: Zone 5 "Digital Safety" (Cyber Rights)

```
Continuing the "Nyaya Nagri" project (Zones 1-4 complete).

Build Zone 5: "Digital Safety," based on IT Act, 2000 (as amended) provisions relevant to children, IT Rules 2021 on online safety, and the connection to POCSO for online sexual exploitation, plus general cyberbullying awareness.

Create THREE age-band quest JSON files (same schema/rules as before):

1. Age 8-11: Simple concepts — not sharing personal photos/info with strangers online, telling a trusted adult if something online feels wrong, the idea that people online aren't always who they say they are.

2. Age 12-15: A branching scenario about recognizing cyberbullying and online grooming red flags, understanding they can block/report and tell a trusted adult, and introduce the Cyber Crime Helpline 155260 and the National Cyber Crime Reporting Portal.

3. Age 16-18: Cover digital consent (not sharing others' images without consent, understanding this can be a legal offense), recognizing and safely responding to online harassment or exploitation, and practical reporting steps via the Cyber Crime Helpline and portal.

Wire into Zone 5, avatar greetings, test end to end.

After this task, all 5 zones should be fully playable across all 3 age bands — confirm this by describing a full playthrough test you performed for at least one age band start to finish.
```

---

## TASK 9 — Adaptive Learning & Progress Dashboard

```
Continuing the "Nyaya Nagri" project (all 5 zones with full content now exist from Tasks 4-8).

Build the Adaptive Learning + Progress Dashboard layer:

1. Adaptive difficulty: if a player's pre-quiz score in a quest is very low, after quest completion offer a short "let's revisit" mini-recap (2-3 simplified sentences + 1 extra reinforcing question) on the specific concept they got wrong, before letting them proceed. If they score well, skip this and let them proceed directly.

2. Build a child-facing progress screen (accessible from the HUD) showing: zones completed, badges/stars earned, and a simple friendly summary (no raw scores/percentages shown to the child — keep it encouraging, e.g., "You've completed 3 out of 5 Rights Quests!").

3. Build a SEPARATE opt-in teacher/parent summary view (behind a simple toggle, clearly labeled, not shown by default) showing aggregated literacy improvement (pre vs post quiz score deltas per zone, in percentage terms) for that single device/session — do NOT show any individual scenario choices or any content that could reveal a real disclosure; this view is for measuring learning impact only, never for monitoring a child's personal situation.

4. Store all analytics using pseudonymous session IDs only — no names, no persistent cross-device identity required.

Test that adaptive recap triggers correctly on a low score, and that both dashboard views render correctly with sample data.
```

---

## TASK 10 — Accessibility & Localization (Hindi/English)

```
Continuing the "Nyaya Nagri" project (all core gameplay from Tasks 1-9 complete).

Build the Accessibility & Localization layer:

1. Set up an i18n system with two language bundles: English and Hindi. Move ALL user-facing strings (UI labels, avatar dialogue templates, quest narration/choices/quiz text you wrote in Tasks 4-8) into language JSON files, and translate them into clear, simple Hindi appropriate for children. Add a language toggle in the settings menu.

2. Add a full audio narration toggle: when enabled, use the Web Speech API to read aloud all narration, choice options, and quiz questions in the currently selected language, so non-readers or visually impaired children can play fully by ear.

3. Add a dyslexia-friendly font toggle (switch to a more readable font family) and a high-contrast color mode toggle, plus a text-size slider (small/medium/large), all in the settings menu.

4. Ensure all interactive elements (buttons, choices) are large enough and clearly labeled for touch use, and add basic keyboard-only navigation support (tab/enter) for the UI panels as a baseline accessibility measure.

Test that switching language updates all quest content correctly, and that audio narration, font, contrast, and text-size toggles all work together without breaking layout.
```

---

## TASK 11 — Moderated Community Features

```
Continuing the "Nyaya Nagri" project (Tasks 1-10 complete).

Build lightweight, SAFE community features — remember the hard safety rule: no open unmoderated chat between children, ever.

1. Build a "Rights Circle" screen showing 3-4 pre-written, rotating discussion prompts related to completed quests (e.g., "What would you do if you saw a friend being treated unfairly? Pick the response that feels most like you" — a multiple-choice reflection, not open text chat).

2. Build a simple "message board" of pre-moderated, pre-written example responses (simulate 5-6 sample peer responses as static content for this prototype, clearly labeled as illustrative) so the feature is demonstrable, with a note in the code comments that in a real deployment this board would be moderated by verified NGO staff/teachers before any content goes live — do NOT build real-time open user-to-user messaging in this prototype, as that is out of scope for safety reasons.

3. Add a simple "Ask a Legal Expert" static FAQ screen with 8-10 pre-written common questions and clear, accurate answers (draw from the legal content already used in Zones 1-5), framed as if compiled from expert AMA sessions — this demonstrates the feature concept without requiring live infrastructure.

Test that these screens are navigable from the main menu and clearly are safe-by-design (no free text input that goes to other real users anywhere in this task).
```

---

## TASK 12 — Support Services Integration Polish

```
Continuing the "Nyaya Nagri" project (Tasks 1-11 complete).

Polish the support-services integration so it is a strong, visible safety net throughout the whole experience:

1. Upgrade the "Get Help Now" button (present since Task 0) into a proper modal/screen showing: Childline 1098 (with a short "what happens when you call" explainer, 3-4 reassuring bullet points), Cyber Crime Helpline 155260 + reporting portal link, and a note about POCSO e-Box for online complaints — all as clear, large, tappable/clickable entries (use tel: links where applicable for one-tap calling on mobile).

2. At the end of each quest (from Task 4-8 content), if the quest's theme is safety-related (Zones 1, 4, 5 especially), show a brief, non-alarming reminder card pointing to this same Get Help screen, so children build repeated familiarity with these resources.

3. Make sure the AI avatar's escalation behavior (Task 2's safety rule) also opens this SAME Get Help screen automatically when triggered, rather than just describing it in text, so the action is one tap away in a real distress moment.

Test that the Get Help screen is reachable from every screen in the app within one tap/click, and that the avatar's escalation path correctly opens it.
```

---

## TASK 13 — Final Polish, Visual Identity & QA Pass

```
Continuing the "Nyaya Nagri" project (all functional features from Tasks 1-12 complete). This is the final polish task.

1. Apply a cohesive, child-friendly visual identity: consistent color palette (bright, warm, non-intimidating — avoid harsh reds/dark themes given the sensitive subject matter, except sparingly for alerts), consistent typography, and simple ambient background audio (calm, non-distracting) that can be muted.

2. Add a welcoming onboarding flow: a short intro (2-3 screens) explaining what the app is, an age-band selection screen, and a simple, clear parental/guardian consent screen (checkbox + short plain-language explanation of what data is stored, per DPDP Act awareness — no real backend auth needed for this prototype, just the UX flow).

3. Run a full QA pass: play through all 5 zones for all 3 age bands, verify the Get Help button is present and functional on every screen, verify language toggle works throughout, verify progress/badges save and display correctly, and check performance (frame rate) is acceptable.

4. Write a short in-code README summarizing: how to run the project, the folder structure, how quest JSON files are structured (so more content can be added later), and a checklist confirming every safety rule from earlier tasks (no PII collection, no open chat, Get Help always visible, avatar escalation works) is intact.

Report back a summary of the final QA pass results and any issues found.
```

---

## TASK 14 — Player Avatar Creation & Customization

```
Continuing the "Nyaya Nagri" project (Tasks 0-13 complete: 3D world, 5 zones, AI companion avatar "Adhikar Didi/Bhaiya," quest engine, adaptive learning, accessibility/localization, community features, support-service integration, and final polish are ALL already built — do not modify or duplicate any of that).

Add a NEW module: Player Avatar Creation & Customization. This is separate from the existing AI companion avatar — this is the child's own playable character.

1. Insert a new onboarding step (after the existing age-band selection, before entering the world) where the child builds their avatar: pick a base character look, a small skin-tone range, hair/clothing style, and 2-3 starter accessories, all from illustrated/cartoon assets only — do NOT add any photo upload or camera capture option anywhere in this flow.

2. Child sets a display nickname only (reuse the existing "no real name" rule already enforced elsewhere in the app) — validate that it isn't left blank, no other validation needed for this prototype.

3. Store the avatar config (look choices + nickname) in the existing progress store (from Task 0) alongside age-band and progress data.

4. Show the player's avatar as their marker on the zone/level map (reuse existing map UI from Task 1) and as a small icon in the HUD corner — cosmetic only, must not affect any gameplay logic, difficulty, or content.

5. Add an "Edit Avatar" option in the settings menu so the child can revisit the builder later.

Test that avatar creation works at onboarding, persists across a session reload (using the existing save/load interface), and displays correctly on the map and HUD without breaking any existing UI.
```

---

## TASK 15 — Level-Based Progression Refactor

```
Continuing the "Nyaya Nagri" project (Tasks 0-14 complete).

Refactor the existing zone/quest structure to add a LEVEL layer inside each zone, without breaking the existing zone-lock system (Task 1) or quest engine (Task 3).

1. Extend the quest JSON schema (from Task 3) with a "levels" array per quest, splitting the existing scene/quiz content for each of the 5 existing zones into 3-4 discrete levels each (e.g., Level 1 = story/narration scenes, Level 2 = branching decision scenario, Level 3 = quiz checkpoint) — reorganize the CONTENT you already wrote in Tasks 4-8 into this level structure, do not rewrite the legal content itself.

2. Build a Level-Select screen shown when entering any zone: a simple node/path map showing each level as locked, unlocked, or completed, using the same visual language as the existing zone map (Task 1) but one layer deeper.

3. Levels unlock sequentially within a zone. The zone only counts as "complete" (and unlocks the next zone, per the existing Task 1 lock system) once its final level is passed — keep this rule wired into the existing progress store logic.

4. Add a "Practice / Replay" option for already-completed levels — replaying does not overwrite the original recorded quiz score used for analytics (Task 9), track replay attempts separately if you store them at all.

5. Update the AI avatar's zone-entry greeting logic (Task 2) to also greet the player when entering a specific level within a zone, using short level-specific context.

Test with at least one fully converted zone (e.g., Zone 1 "Safe Zone") showing correct level lock/unlock/complete states end to end, then confirm the same pattern is applied to the remaining 4 zones.
```

---

## TASK 16 — Game Economy Layer (XP, Coins, Streak, Titles, Leaderboard)

```
Continuing the "Nyaya Nagri" project (Tasks 0-15 complete).

Add a non-monetary game economy layer on top of the existing badge/star system (Task 9) — do not remove the existing badges/stars, this is additive.

1. Award XP and Coins on level completion (Task 15's levels), stored in the progress store. Show a simple "Player Rank" (derived from total XP) in the HUD, clearly labeled as different from the in-zone "Level" concept to avoid confusion (use "Player Rank" and "Level X of Zone Y" as distinct UI labels).

2. Let Coins be spent ONLY on cosmetic avatar accessories (from Task 14's avatar builder) via a simple "Avatar Shop" screen — no real-money purchases anywhere, this is entirely an in-game virtual currency with no monetization.

3. Add a Daily Streak counter (consecutive days played) shown gently in the HUD — no punishing "you lost your streak" guilt messaging, no aggressive push notifications, keep the tone encouraging and low-pressure given this is a children's product.

4. Add unlockable "Titles" (short flavor text like "Safe Zone Guardian") awarded at milestones (e.g., first zone completed), shown on a simple profile screen, never shared publicly.

5. Build a Leaderboard that is COHORT-SCOPED ONLY: it must only show players within the same teacher-created session/classroom group (reuse or extend the teacher dashboard grouping from Task 9), using pseudonymous nicknames, and must be opt-in (default off). Do NOT build any global, cross-school, or public leaderboard — this is a hard safety requirement, not a style choice.

Test that XP/coins award correctly, the avatar shop works, streak increments correctly across simulated day changes, titles unlock at the right milestones, and the leaderboard only ever shows same-cohort pseudonymous entries.
```

---

## TASK 17 — AI Role-Play Persona System

```
Continuing the "Nyaya Nagri" project (Tasks 0-16 complete, including the AI companion avatar system from Task 2).

Add additional AI-driven personas the child can talk to inside specific levels, reusing the exact same server-side Claude API calling pattern already built for the companion avatar in Task 2 (never expose an API key client-side).

1. Create FIVE new persona configs, each a simple 2D animated sprite with its own name, short idle animation, and a narrowly-scoped system prompt: Police Officer, Lawyer, Teacher, Judge, and Parent/Guardian.

2. Each persona may ONLY discuss its designated in-scene topic for the level it appears in (e.g., inside a Zone 4 "Justice System Simulator" level, the "Judge" persona only explains what a JJB/CWC hearing conceptually looks like) — it must refuse to go off-topic, redirecting back to the scene politely.

3. CRITICAL: every safety guardrail already built for the main companion avatar in Task 2 must be implemented for EACH persona individually and without exception — no PII collection, no medical/legal advice beyond pre-approved facts passed into context, and the same distress-disclosure escalation rule (immediately surface Childline 1098 / open the Get Help screen from Task 12, do not attempt to counsel). Do not assume this is "inherited" — explicitly build the guardrail check into each persona's prompt/logic.

4. At the start of any level using a persona, show a clear one-line disclaimer: "This is a role-play, not a real [Police Officer/Lawyer/etc.]" — this must appear every time, not just once per session.

5. Build a simple "interview" UI for these levels: a set of 3-4 suggested question chips the child can tap (safest default), plus an optional short free-text input that still passes through all Task 2/step-3 guardrails.

6. Wire the Judge and Police personas into a redesigned Zone 4 "Justice System Simulator" level (replacing or enhancing the existing flowchart-style walkthrough from Task 7 with this more interactive persona-driven format for the 12-15 and 16-18 age bands specifically; keep the gentler 8-11 version from Task 7 as-is, no personas needed for that age band).

Test each persona stays on-topic, correctly refuses off-topic questions, correctly escalates on a simulated distress message exactly like Task 2's companion avatar does, and that the role-play disclaimer always appears.
```

---

## TASK 18 — Mini-Game Variety Pack

```
Continuing the "Nyaya Nagri" project (Tasks 0-17 complete, including the Level system from Task 15).

Add new level TYPES that plug into the existing level structure (Task 15) and quest JSON schema (Task 3), by adding a "levelType" field to the schema.

1. "Memory Cards" level type: a simple flip-and-match game pairing a right/law name with its correct short description, using content already written in Tasks 4-8 (reformat, do not invent new legal claims).

2. "Hidden Object" level type (8-11 age band only): a static illustrated scene where the child taps 3-4 "red flag" cues (e.g., spotting an unsafe situation), non-graphic and non-distressing per the existing trauma-sensitivity rule from Task 4's content rules — reuse art style already established, keep it gentle.

3. "Puzzle/Sorting" level type: drag-and-sort activity where the child sorts short scenario cards into buckets like "Safe," "Tell a Trusted Adult," and "Emergency — Call Childline," using scenarios adapted from existing zone content.

4. "Scenario Selection" level type: a lighter, faster version of the existing branching-choice format (single screen, one decision, immediate feedback) for quick reinforcement levels.

5. Update the Level-Select screen (Task 15) to visually distinguish level types with a small icon per type.

Wire at least one instance of each new level type into an existing zone as an additional level, test that all four new level types function correctly, record completion/score into the existing progress store, and count correctly toward zone completion alongside the original level types.
```

---

## TASK 19 — New Zone: "Know Yourself" (Zone 0)

```
Continuing the "Nyaya Nagri" project (Tasks 0-18 complete).

Add a NEW zone that plays before the existing Zone 1, using the exact same patterns as the existing 5 zones (map marker from Task 1's system, level structure from Task 15, quest JSON schema from Task 3, same content rules as Task 4: no graphic content, always end empowering, age-band-specific).

Build Zone 0: "Know Yourself" — a short foundational zone covering Constitutional basics: Articles 14, 15, and 21 (equality, non-discrimination, right to life and dignity), and the general concept of "what a right is," before the child dives into topic-specific zones.

Create THREE age-band quest JSON files:
1. Age 8-11: Simple, warm framing — "you matter, you are equal, you deserve respect and safety" — no legal jargon, just the feeling of what a right protects.
2. Age 12-15: Introduce the idea of the Constitution as the source of rights, using Articles 14/15/21 in plain language, with a short scenario about recognizing unfair/discriminatory treatment.
3. Age 16-18: Cover Articles 14, 15, 15(3), and 21 more directly with practical framing (what "equality before law" and "personal liberty" mean in daily situations), setting up context for the more specific zones that follow.

Add this as a new unlocked-by-default zone that must be completed before Zone 1 unlocks (adjust the existing Task 1 zone-lock sequence accordingly). Add an age-band-specific AI avatar greeting for this zone (Task 2 pattern). Test that it plays correctly for all three age bands and that Zone 1 now correctly requires Zone 0 completion first.
```

---

## TASK 20 — New Zone: "Family & Community Shield" (Zone 6)

```
Continuing the "Nyaya Nagri" project (Tasks 0-19 complete, all existing zones 0-5 working).

Add a NEW zone using the same established patterns (map, levels, quest JSON, content rules).

Build Zone 6: "Family & Community Shield," covering two topics referenced in the legal content matrix but never given dedicated content: the Prohibition of Child Marriage Act, 2006, and general age-appropriate awareness of unsafe/abusive home situations (domestic violence context) — plus a consolidated "Meet the Authorities" hub.

Create THREE age-band quest JSON files:
1. Age 8-11: Very gentle — focus on "every home should feel safe," and that if home ever doesn't feel safe, it is never the child's fault and there are people (Childline 1098, trusted adults) who help. No mention of marriage-age legal detail at this age; keep it about home-safety awareness only.
2. Age 12-15: Introduce the Child Marriage Act basics (marriage below 18 for girls/21 for boys is against the law and children have a right to say no/seek help) and expand the home-safety awareness with a light branching scenario about recognizing when to seek outside help.
3. Age 16-18: Cover the Child Marriage Act more practically (legal minimum ages, that a forced/early marriage can be legally challenged, annulment and legal aid exist), plus a realistic-but-non-graphic scenario about supporting a friend in an unsafe home situation (listen, don't investigate, help them reach CWC/Childline).

Also build a "Meet the Authorities" interactive hub within this zone (not a separate menu) letting the player tap through NCPCR/SCPCR, CWC, JJB, SJPU, and DCPU with a one-line explainer each of what they do — reuse this to replace/enhance any existing static explainer screen for this content if one already exists from earlier tasks.

Follow the exact same non-graphic, empowering-resolution, Childline-1098-mention content rules as Task 4. Add avatar greetings, wire into the zone-lock sequence as the final zone, test end to end for all three age bands.
```

---

## TASK 21 — AI Dynamic Story Variation Layer (Guardrailed)

```
Continuing the "Nyaya Nagri" project (Tasks 0-20 complete, all zone content is static, pre-written, and legally reviewed).

Add an OPTIONAL layer that gives cosmetic variety to already-approved scenes, without ever touching legal accuracy. Build this as a toggle-able feature (default can be ON, but must be able to be switched OFF instantly, falling back cleanly to the exact static content from Tasks 4-8, 19, and 20 with zero functional loss).

1. On loading a scene (from the existing quest JSON), make a server-side Claude API call (same safe pattern as Task 2, no client-side API key) that may rewrite ONLY these fields: character names used in narration, minor setting/flavor descriptions, and small dialogue phrasing.

2. HARD LOCK the following fields as read-only, never passed to the AI for regeneration, always rendered exactly as authored: choice text correctness (which option is "correct"/"incorrect"/"neutral"), all quiz questions/options/correct answers/explanations, and any safety-critical text (helpline numbers, Get Help button text, escalation wording). Pass these through unmodified in code, do not even send them to the API for "rewriting."

3. Add a simple settings toggle: "Story Variety: On/Off" — when off, skip the API call entirely and render the original static JSON content exactly as before.

4. Add basic error handling: if the API call fails or returns something that doesn't match the expected structure, silently fall back to the static original content rather than showing an error to the child.

Test with one existing zone that turning the toggle on produces cosmetic variation across two playthroughs while the choices, quiz, and safety text remain byte-for-byte identical to the static original, and that turning it off correctly falls back to fully static content.
```

---

## TASK 22 — Teacher Assignment System + Certificates

```
Continuing the "Nyaya Nagri" project (Tasks 0-21 complete, including the opt-in teacher/parent dashboard from Task 9).

Extend the existing teacher/parent dashboard (Task 9) — do not rebuild it, add to it.

1. Add a simple "Assign" action in the teacher dashboard view letting a teacher mark specific zones/levels as assigned to their cohort, with an optional due-date label (a static UI flag is sufficient for this prototype, no real scheduling/notification backend required).

2. Add an "Assignment Completion %" summary to the existing teacher dashboard aggregate view (Task 9) — must remain aggregate-only, no individual child's specific choices or scores visible, consistent with Task 9's existing privacy rule.

3. On completing all levels in a zone, let the child (or parent, from the parent dashboard) generate a simple downloadable/printable certificate: zone name, completion date, and either the pseudonymous session ID or a parent-entered first name only (never require or store a full name/other PII) — a simple styled HTML-to-print or basic canvas-generated image is sufficient for this prototype.

Test that assigning a zone shows correctly in the teacher view, completion percentage aggregates correctly across a sample cohort, and that a certificate generates correctly with no PII beyond what's explicitly and optionally parent-entered.
```

---

## TASK 23 — Additional Language: Gujarati

```
Continuing the "Nyaya Nagri" project (Tasks 0-22 complete, including the Hindi/English i18n system from Task 10).

Add Gujarati as an additional language option, using the exact same i18n bundle system already built in Task 10 — no new architecture needed.

1. Create a Gujarati language bundle JSON covering ALL user-facing strings currently in the English/Hindi bundles, including any new strings introduced by Tasks 14-22 (avatar builder, level-select, economy/leaderboard UI, persona role-play screens, new Zone 0/6 content, teacher assignment UI, certificate text).

2. Add Gujarati to the existing language toggle in settings (Task 10).

3. Confirm the existing audio narration (Web Speech API, Task 10) supports Gujarati text-to-speech; if the available voice quality is poor, note this clearly in the in-code README (Task 13) as a known limitation rather than silently shipping broken audio.

Test that switching to Gujarati updates all content correctly across every screen added since Task 10, including all new v2.0 features.
```

---

## TASK 24 — Final Integration QA Pass (v2.0)

```
Continuing the "Nyaya Nagri" project (Tasks 0-23 complete — all v1.0 and v2.0 features now exist).

Run a full integration QA pass across the combined v1.0 + v2.0 feature set:

1. Play through the full sequence: Zone 0 ("Know Yourself") → Zones 1-5 (existing) → Zone 6 ("Family & Community Shield"), for at least one full age band, confirming the level-select system, all new level types (memory cards, hidden object, puzzle, scenario selection), the avatar builder, the economy layer (XP/coins/streak/titles), and at least one AI role-play persona scene all function correctly together.

2. Re-verify every hard safety rule still holds with all new features added: Get Help button present on every screen (Task 12), no PII collected anywhere including the new avatar builder and certificate flow, no real-money mechanics anywhere in the economy layer, leaderboard never shows cross-cohort data, every AI persona (companion + 5 new role-play personas) correctly escalates on a simulated distress message, and the Story Variation Layer (Task 21) never alters legal/safety-critical content even with the toggle on.

3. Verify performance: confirm frame rate remains acceptable on a mid/low-end device profile (per v1.0 §7 non-functional requirement) with all new UI layers active.

4. Update the in-code README (originally from Task 13) to document the new folder/module structure, the extended quest JSON schema (levelType field, locked fields for Task 21), and add the new safety-checklist items (per-persona guardrails, avatar builder no-photo rule, economy no-monetization rule, leaderboard cohort-scoping rule) alongside the original checklist.

Report back a full summary of this QA pass, explicitly confirming pass/fail status for every safety rule listed in step 2.
```

---

## Notes on Using These Prompts

- **Order matters** — every task assumes all earlier tasks (both v1.0's Tasks 0–13 and v2.0's Tasks 14–24) are already complete. Don't skip ahead.
- If Claude Fable's output for a task seems incomplete, you can re-paste the same prompt with an added line: `"The previous attempt at this task had [describe issue] — please fix that before proceeding."`
- Keep `PRD_NyayaNagri_MASTER.md` open alongside these prompts — if Claude Fable ever asks for clarification on legal content or a v2.0 feature's intent, paste the relevant section directly.
- Tasks 0–13 map onto milestones M1–M10, and Tasks 14–24 map onto milestones M11–M15, in the PRD — use this file as evidence of a structured, professional development process for your SIH report/presentation.
- **Non-negotiable rules that apply to every task, from Task 0 onward, with no exceptions:** the "Get Help Now" button (Childline 1098 / Cyber Crime 155260) is present on every screen; no real PII, photos, or camera access is ever collected; every AI character (companion avatar and all role-play personas) escalates immediately on any real distress disclosure instead of trying to handle it; no open unmoderated chat between children; no real-money mechanics anywhere; sensitive topics are always shown through implication, never graphic depiction.
