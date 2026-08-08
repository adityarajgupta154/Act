# Nyaya Nagri — Justice City

A gamified 3D web platform that teaches children in India (ages 8-18) about
their legal rights and duties through an explorable low-poly city, story
quests, quizzes, badges, and a safety-gated AI guide. Built as a Smart India
Hackathon prototype (SIH1281). Fully bilingual: English + Hindi.

## How to run

The project is a pnpm monorepo with two relevant packages:

| Package | What it is | Dev command |
| --- | --- | --- |
| `artifacts/nyaya-nagri` | React + Vite + React Three Fiber frontend | `pnpm --filter @workspace/nyaya-nagri run dev` |
| `artifacts/api-server` | Express 5 backend (safety-gated avatar chat) | `pnpm --filter @workspace/api-server run dev` |

1. `pnpm install` at the repo root.
2. Start both dev servers (on Replit these run as workflows automatically).
3. Open the frontend preview (served at `/`). The frontend proxies
   `api/avatar/chat` to the API server.
4. The avatar chat requires Anthropic access via Replit AI Integrations
   (`AI_INTEGRATIONS_ANTHROPIC_API_KEY` / `_BASE_URL`). Without it the guide
   returns its safe fallback message — everything else works offline.

### Smoke tests (no browser needed)

```bash
cd artifacts/nyaya-nagri
pnpm dlx tsx scripts/engine.smoke.ts      # all 5 zones x 3 age bands x EN+HI through the quest engine
pnpm dlx tsx scripts/help.smoke.ts        # Get Help Now / helpline content
pnpm dlx tsx scripts/community.smoke.ts   # moderated community content
pnpm dlx tsx scripts/onboarding.smoke.ts  # onboarding, consent, ambient audio (Task 13)
pnpm exec tsc --noEmit                    # typecheck (also enforces EN/HI string parity)

cd ../api-server
pnpm dlx tsx scripts/avatar.safety.smoke.ts  # avatar output gate (safety-critical)
```

## Folder structure

```
artifacts/nyaya-nagri/
  public/audio/ambient.mp3   Calm instrumental background loop (mutable in Settings)
  scripts/                   Smoke tests (run with tsx, no browser required)
  src/
    audio/ambient.ts         Ambient loop manager (autoplay-policy aware, fail-silent)
    avatar/                  AI guide widget + client for the safety-gated chat API
    community/               Hand-written moderated community content + screen (no free text)
    data/
      progressStore.ts       Progress/badges/age band; consent-gated localStorage persistence
      settingsStore.ts       Language, narration, accessibility, ambient sound (localStorage)
    i18n/strings.ts          UIStrings interface + EN and HI bundles (compile-time parity)
    onboarding/              Task 13 onboarding: intro, age band, guardian consent (DPDP-aware)
    quests/
      schema.ts              Quest JSON schema + runtime validator (see below)
      engine.ts              Pure quest state machine (pre-quiz, scenes, post-quiz, recaps)
      registry.ts            resolveQuest(zoneId, ageBand, language)
      content/               15 EN + 15 HI hand-written quests (5 zones x 3 age bands)
      recaps*.ts             120 bilingual recap questions for wrong answers
      QuestPlayer.tsx        Quest UI (narration, choices, quizzes, safety reminder)
    ui/                      HUD, Get Help dialog, settings, progress dashboard, overlays
    world/                   R3F low-poly city, 5 zones, player controller, minimap
artifacts/api-server/        Express 5: POST /api/avatar/chat with fail-closed output gate
```

## Quest JSON structure

Every quest is static, hand-written data (never AI-generated) validated by
`src/quests/schema.ts`:

```jsonc
{
  "questId": "zone1-8-11",       // unique; same id across languages
  "zoneId": "zone1",             // zone1..zone5 (sequential unlock)
  "ageBand": "8-11",             // "8-11" | "12-15" | "16-18"
  "language": "hi",              // optional; omitted = "en"
  "title": "...",
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
          "nextScene": "s2"        // omit to end the scenes
        }
      ]
    }
  ],
  "quizQuestions": [               // 3-5; used as silent pre-quiz AND scored post-quiz
    {
      "question": "...",
      "options": ["...", "..."],
      "correctIndex": 0,
      "explanation": "..."
    }
  ]
}
```

Flow: silent pre-quiz → story scenes → scored post-quiz → badge; wrong
post-quiz answers queue aligned recap questions (`recaps.ts` / `recaps.hi.ts`).

## Safety rules checklist (verified by smoke tests; never regress these)

- [ ] **Get Help Now** button visible and tappable on EVERY screen — including
      onboarding, quests, overlays, and community (z-50, never hidden).
- [ ] Helpline digits are NEVER altered or localized: Childline **1098**,
      Cyber Crime **155260** (PRD-mandated), plus cybercrime.gov.in and the
      NCPCR POCSO e-Box. Western numerals in both languages.
- [ ] **Zero PII**: no names, photos, phone numbers, schools, addresses, or
      accounts anywhere. Progress uses a random pseudonymous session id.
      The onboarding flow contains choices and a checkbox only — no text input.
- [ ] Guardian consent (DPDP-aware) gates ALL device persistence: neither
      progress nor settings (even the language picked during onboarding)
      touch localStorage until a parent/guardian/teacher accepts.
- [ ] Consent copy fully discloses that guide messages are sent to an
      external AI service to create the reply, are not saved by the app,
      and asks guardians to remind children not to share personal details.
- [ ] All legal facts, quests, quizzes, and recaps are **hard-coded,
      hand-written content** — never AI-generated at runtime (PRD §9.8).
- [ ] Avatar chat output gate is **fail-closed**: replies must cite the
      hard-coded legal corpus, helpline-phrasing replies get replaced, and
      distress phrases escalate (pulse + auto-open the Get Help screen).
- [ ] Qualified legal wording only: "can be an offence" / "अपराध हो सकता है"
      — never absolute promises of outcomes.
- [ ] Sensitive topics (abuse, exploitation) by implication only; harsh red
      is reserved for the Get Help button and true alerts.
- [ ] **No emojis anywhere** in content or UI.
- [ ] Hindi style: simple child-friendly Hindi (tum register), acts
      transliterated with English parens — e.g. "पॉक्सो (POCSO)".

Known real-world note: the national cyber helpline has migrated from 155260
to **1930**; this prototype follows the PRD text (155260). Verify all
helplines and URLs with legal experts before any real deployment.
