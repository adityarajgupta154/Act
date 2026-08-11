-- Nyaya Nagri — Supabase schema
-- Generated from lib/db/src/schema/*.ts (Drizzle ORM definitions)
-- PRD §9.4: zero PII; all data is pseudonymous or game-cosmetic only.

-- 1. PLAYERS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Pseudonymous device session id, e.g. "nn-abc123-xyz". Never a real name.
  session_id          TEXT        NOT NULL UNIQUE,
  -- True only after guardian consent completes onboarding.
  onboarded           BOOLEAN     NOT NULL DEFAULT FALSE,
  -- '8-11' | '12-15' | '16-18' — drives content, not identity.
  age_band            TEXT        NOT NULL,
  -- Cartoon avatar config (game nickname + cosmetic ids). No PII.
  avatar              JSONB,
  xp                  INTEGER     NOT NULL DEFAULT 0,
  coins               INTEGER     NOT NULL DEFAULT 0,
  owned_accessories   TEXT[]      NOT NULL DEFAULT '{}',
  -- Cohort leaderboard opt-in; default false (PRD §9.7).
  leaderboard_opt_in  BOOLEAN     NOT NULL DEFAULT FALSE,
  -- Reserved non-PII key/value slots from ProgressState.extras.
  extras              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. PLAYER PROGRESS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_progress (
  player_id           UUID    PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  -- Zone completion flags: { "zone1": true, ... }
  completed_zones     JSONB   NOT NULL DEFAULT '{}'::jsonb,
  -- Level completion flags: { "zone1:level2": true, ... }
  level_progress      JSONB   NOT NULL DEFAULT '{}'::jsonb,
  -- Story Adventure completions: { "right-to-life": true, ... }
  story_progress      JSONB   NOT NULL DEFAULT '{}'::jsonb,
  -- Quiz scores per quest: { "q1": { "pre": 2, "post": 5 }, ... }
  quiz_scores         JSONB   NOT NULL DEFAULT '{}'::jsonb,
  -- Activity level results: { "zone1:level3": { "score": 4, "total": 6 } }
  activity_scores     JSONB   NOT NULL DEFAULT '{}'::jsonb,
  -- Practice/replay counts: { "zone1:level2": 3, ... }
  replay_counts       JSONB   NOT NULL DEFAULT '{}'::jsonb,
  -- Silent pre-quiz answers: { "q1": [0, 2, 1], ... }
  pre_answers_by_quest JSONB  NOT NULL DEFAULT '{}'::jsonb,
  -- Badge ids earned: { "story-right-to-life": true, ... }
  badges              JSONB   NOT NULL DEFAULT '{}'::jsonb,
  -- Flavor title ids (private, never shown publicly).
  titles              JSONB   NOT NULL DEFAULT '{}'::jsonb,
  -- Daily streak: { "count": 5, "lastDay": "2026-08-11" }
  streak              JSONB   NOT NULL DEFAULT '{"count":0,"lastDay":null}'::jsonb,
  -- Rolling activity event log — option indices + derived stats, no PII.
  activity_log        JSONB   NOT NULL DEFAULT '[]'::jsonb,
  -- Insights bookkeeping + cached AI narrative.
  insights_meta       JSONB   NOT NULL DEFAULT '{}'::jsonb,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PLAYER SETTINGS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_settings (
  player_id     UUID    PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  language      TEXT    NOT NULL DEFAULT 'en',   -- 'en' | 'hi'
  narration     BOOLEAN NOT NULL DEFAULT TRUE,   -- read aloud (on by default)
  dyslexia_font BOOLEAN NOT NULL DEFAULT FALSE,
  high_contrast BOOLEAN NOT NULL DEFAULT FALSE,
  text_size     TEXT    NOT NULL DEFAULT 'medium', -- 'small' | 'medium' | 'large'
  ambient_sound BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. PLAYER CERTIFICATES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_certificates (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  zone_id         TEXT        NOT NULL,  -- e.g. "zone1"
  certificate_id  TEXT        NOT NULL,  -- stable cert id from client
  earned_at       TIMESTAMPTZ NOT NULL,  -- first completion — the issue date on the cert
  CONSTRAINT uq_player_zone UNIQUE (player_id, zone_id)
);

-- 5. INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_players_session_id        ON players(session_id);
CREATE INDEX IF NOT EXISTS idx_player_certificates_player ON player_certificates(player_id);
