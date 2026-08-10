# Nyaya Nagri — Justice City

A gamified 3D web platform that teaches children in India (ages 8-18) about
their legal rights and duties through an explorable low-poly city of seven
zones (Zone 0 "Know Yourself" through Zone 6 "Family & Community Shield"),
a level-based progression system, story quests, mini-game levels, quizzes,
a player avatar with an earn-only economy, safety-gated AI guides (companion
plus five role-play personas), badges, and titles. Built as a Smart India
Hackathon prototype (SIH1281). Fully bilingual: English + Hindi.

## How to run

The project is a pnpm monorepo with two relevant packages:

| Package | What it is | Dev command |
| --- | --- | --- |
| `artifacts/nyaya-nagri` | React + Vite + React Three Fiber frontend | `pnpm --filter @workspace/nyaya-nagri run dev` |
| `artifacts/api-server` | Express 5 backend (safety-gated AI chat: Nyaya AI assistant + role-play personas) | `pnpm --filter @workspace/api-server run dev` |

1. `pnpm install` at the repo root.
2. Start both dev servers (on Replit these run as workflows automatically).
3. Open the frontend preview (served at `/`). The frontend proxies
   `api/nyaya-ai/chat` and `api/persona/chat` to the API server.
4. Nyaya AI (the in-game assistant) requires the `GEMINI_API_KEY` secret; the
   role-play personas require Anthropic access via Replit AI Integrations
   (`AI_INTEGRATIONS_ANTHROPIC_API_KEY` / `_BASE_URL`). Without keys the
   assistants return their safe fallback message — everything else works
   offline.

### Smoke tests (no browser needed)

```bash
cd artifacts/nyaya-nagri
pnpm dlx tsx scripts/engine.smoke.ts          # all 7 zones x 3 age bands x EN+HI through the quest engine
pnpm dlx tsx scripts/levels.smoke.ts          # level system, activity payloads, level-kind names
pnpm dlx tsx scripts/economy.smoke.ts         # XP/coins/ranks/titles/streak + save reconciliation
pnpm dlx tsx scripts/onboarding.smoke.ts      # onboarding, consent, avatar builder, ambient audio
pnpm dlx tsx scripts/help.smoke.ts            # Get Help Now / helpline content + safety reminders
pnpm dlx tsx scripts/community.smoke.ts       # moderated community content + leaderboard scoping
pnpm dlx tsx scripts/dashboard.render.smoke.tsx  # headless progress-dashboard render (child + teacher views)
pnpm exec tsc --noEmit                        # typecheck (also enforces EN/HI string parity)

cd ../api-server
pnpm dlx tsx scripts/avatar.safety.smoke.ts   # companion input/output gates (safety-critical)
pnpm dlx tsx scripts/persona.safety.smoke.ts  # all 5 role-play personas: per-persona guardrails, shared gates, PII redaction
```

Run ALL of them after touching zones, economy, i18n, or anything
safety-adjacent. `scripts/` is not part of the typecheck project (tsx is
transpile-only), so smoke fixtures must be updated by hand when interfaces
grow.

## Folder structure

```
artifacts/nyaya-nagri/
  public/audio/ambient.mp3   Calm instrumental background loop (mutable in Settings)
  scripts/                   Smoke tests (run with tsx, no browser required)
  src/
    a11y/                    Accessibility helpers (narration, reduced motion)
    audio/ambient.ts         Ambient loop manager (autoplay-policy aware, fail-silent)
    avatar/                  AI companion widget + client for the safety-gated chat API
    community/               Hand-written moderated community content + screen (no free
                             text) + opt-in, cohort-scoped, pseudonymous leaderboard
    data/
      progressStore.ts       Progress/levels/badges/economy/age band; consent-gated
                             localStorage persistence; forged saves reconciled on load
      settingsStore.ts       Language, narration, accessibility, ambient sound (localStorage)
    economy/                 XP/coins/ranks/titles/gentle streak + cosmetic avatar shop
                             (earn-only; zero real-money mechanics)
    i18n/                    UIStrings EN+HI bundles (compile-time parity), zone greetings,
                             level greetings
    onboarding/              Intro, age band, guardian consent (DPDP-aware), player
                             avatar builder
    persona/                 Role-play persona interview UI (disclaimer, suggested-question
                             chips, guardrailed free text) + 2D sprites
    player/                  Player avatar: builder, config sanitizer (enumerated cosmetic
                             ids only), edit overlay, in-world character
    quests/
      schema.ts              Quest JSON schema + runtime validator (see below)
      engine.ts              Pure quest state machine (scenes, quiz, adaptive recap)
      levels.ts              Per-zone level statuses + sequential unlock
      registry.ts            resolveQuest(zoneId, ageBand, language) — 21 EN + 21 HI quests
      content/               Hand-written quest JSONs (7 zones x 3 bands; content/hi/ twins)
      recaps.ts / recaps.hi.ts  Aligned bilingual recap items for every quest
      activities/            Mini-game levels: MemoryLevel, HiddenObjectLevel, SortingLevel,
                             ScenarioLevel, AuthoritiesLevel
      QuestPlayer.tsx        Quest UI (narration, choices, quizzes, safety reminder)
      LevelSelect.tsx        Node/path level-select map shown on entering a zone
    ui/                      HUD, Get Help dialog, settings, progress dashboard, overlays
    world/                   R3F low-poly city, 7 zone markers, player controller, minimap
  plus shared components/, hooks/, lib/, pages/
artifacts/api-server/        Express 5: POST /api/nyaya-ai/chat + POST /api/persona/chat,
                             one shared fail-closed safety pipeline (input distress gate,
                             PII redaction, output helpline gate) for every AI surface
```

## Quest JSON structure

Every quest is static, hand-written data (never AI-generated) validated by
`src/quests/schema.ts`:

```jsonc
{
  "questId": "school_rights_12_15", // unique; same id across languages
  "zoneId": "zone1",             // zone0..zone6 (sequential unlock)
  "ageBand": "12-15",            // "8-11" | "12-15" | "16-18"
  "language": "hi",              // REQUIRED "hi" in content/hi/ twins; omitted = "en"
  "title": "...",
  "levels": [                    // 3-4 levels per quest (PRD §7.5 calls this
                                 // field `levelType`; implemented as `kind`)
    { "levelId": "level1", "kind": "story",    "sceneIds": ["s1","s2"], "entryScene": "s1" },
    { "levelId": "level2", "kind": "decision", "sceneIds": ["s3","s4"], "entryScene": "s3" },
    { "levelId": "level_memory", "kind": "memory", "memory": { /* activity payload */ } },
    { "levelId": "level3", "kind": "quiz" }    // boss quiz — passing completes the zone
  ],
  "scenes": [
    {
      "sceneId": "s1",
      "narration": "...",
      "stageLabel": "...",        // optional process-map chip (Zone 4 simulator)
      "choices": [
        {
          "text": "...",
          "outcome": "correct",   // "correct" | "incorrect" | "neutral"
          "feedback": "...",      // short empowering explanation
          "nextScene": "s2"        // omit to end the scenes (branching allowed)
        }
      ]
    }
  ],
  "quizQuestions": [               // 3-5; the quiz level checkpoint
    {
      "question": "...",
      "options": ["...", "..."],
      "correctIndex": 0,
      "explanation": "..."
    }
  ]
}
```

Level kinds: `story`, `decision`, `quiz` (every quest) plus at most one
activity level per quest — `memory` (flip-and-match), `hidden` (spot the
red-flag cues, 8-11 only), `sorting` (drag cards into Safe / Tell a Trusted
Adult / Emergency 1098), `scenario` (single-screen quick decision), or
`authorities` (Zone 6 "Meet the Authorities" tap-through hub). Each activity
kind carries a same-named payload block validated by the schema; EN/HI twins
are structurally parity-checked (same scenes, outcomes, branching, correct
answers, activity structure) so a translation can never change legal meaning.

Flow: enter zone → level-select map → levels unlock sequentially → boss quiz;
a quiz score below 50% queues aligned recap cards (`recaps.ts` /
`recaps.hi.ts`) before completion. Completing the final level completes the
zone, awards the bonus, and unlocks the next zone. Completed levels can be
replayed for practice without altering recorded scores.

## Not yet implemented (planned in the PRD, absent from this build)

- **AI Dynamic Story Variation Layer (PRD §7.7)** — there is currently NO
  variation module, toggle, or server route; every scene is fully static.
  If it is ever built, the PRD hard-lock applies: choice correctness, quiz
  content, and all safety/helpline text are read-only and never regenerated.
- **Teacher assignments + zone certificates (PRD §7.8)** — not built. When
  built, views stay aggregate-only and a certificate may carry only the
  pseudonymous id or a parent-entered first name — never other PII.
- **Gujarati (PRD §7.9)** — not built; the app is English + Hindi.

## Safety rules checklist (verified by smoke tests; never regress these)

- [ ] **Get Help Now** button visible and tappable on EVERY screen — including
      onboarding, quests, activity levels, overlays, shop, persona interviews,
      and community (z-50, never hidden).
- [ ] Helpline digits are NEVER altered or localized: Childline **1098**,
      Cyber Crime **155260** (PRD-mandated), plus cybercrime.gov.in and the
      NCPCR POCSO e-Box. Western numerals in both languages.
- [ ] **Zero PII**: no real names, photos, phone numbers, schools, addresses,
      or accounts anywhere. Progress uses a random pseudonymous session id.
      The ONLY free-text field in the app is the avatar nickname (16 chars
      max, presented as a game name, never a real name); onboarding is
      otherwise choices and a checkbox only.
- [ ] **Avatar builder no-photo rule**: the player avatar is built from
      enumerated illustrated cosmetic ids only (`sanitizeAvatar` rejects
      anything else) — no photo upload, no camera access, no biometrics,
      ever.
- [ ] Guardian consent (DPDP-aware) gates ALL device persistence: neither
      progress nor settings (even the language picked during onboarding)
      touch localStorage until a parent/guardian/teacher accepts.
- [ ] Consent copy fully discloses that guide messages are sent to an
      external AI service to create the reply, are not saved by the app,
      and asks guardians to remind children not to share personal details.
- [ ] All legal facts, quests, quizzes, and recaps are **hard-coded,
      hand-written content** — never AI-generated at runtime (PRD §9.8).
- [ ] AI output gates are **fail-closed** on EVERY AI surface: replies must
      cite the hard-coded legal corpus, helpline-phrasing replies get
      replaced with the canonical escalation text, and distress phrases
      escalate (canonical reply + pulse + auto-open the Get Help screen).
- [ ] **Per-persona guardrails**: every role-play persona (Police Officer,
      Lawyer, Teacher, Judge, Parent/Guardian) carries its own explicit
      guardrail block — scope-only answers, no advice beyond pre-approved
      facts, no PII, distress escalation, helpline lock, no emojis, and a
      visible "this is a role-play, not a real ..." disclaimer — enforced
      individually per persona and never assumed as inherited (PRD §7.4).
      Both chat routes share the same input distress gate, PII redaction,
      and output gate (`persona.safety.smoke.ts`).
- [ ] **Economy no-monetization rule**: coins and XP are earned from levels
      and zones only and spent only on cosmetic shop items. Zero real-money
      mechanics, zero pay-to-win, zero paid currency — no ₹ prices, no
      purchase links anywhere. Streak copy is gentle by design (guilt
      phrasing like "don't break" is banned by smoke test).
- [ ] **Leaderboard cohort-scoping rule**: the leaderboard is opt-in
      (default OFF), shows pseudonymous handle + XP only, and is scoped to
      the hard-coded demo cohort — no global/public or cross-cohort query
      exists. A global leaderboard requires a full safety review first
      (PRD §9.7).
- [ ] Qualified legal wording only: "can be an offence" / "अपराध हो सकता है"
      — never absolute promises of outcomes.
- [ ] Sensitive topics (abuse, exploitation, child marriage, unsafe homes)
      by implication only — no graphic depiction, empowering resolutions,
      especially for the 8-11 band; harsh red is reserved for the Get Help
      button and true alerts.
- [ ] **No emojis anywhere** in content or UI.
- [ ] Hindi style: simple child-friendly Hindi (tum register), acts
      transliterated with English parens — e.g. "पॉक्सो (POCSO)".

Known real-world note: the national cyber helpline has migrated from 155260
to **1930**; this prototype follows the PRD text (155260). Verify all
helplines and URLs with legal experts before any real deployment.
