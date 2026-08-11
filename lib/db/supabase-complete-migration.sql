-- Nyaya Nagri — completion migration for the four tables already created.
-- Run this in Supabase SQL Editor after supabase-schema.sql.
--
-- Audit coverage:
--   ProgressState: ageBand, onboarded, avatar, all progress maps, economy,
--   streak, certificates, sessionId, activityLog, insightsMeta, extras
--   SettingsState: every setting field
--   Adult PIN/session unlock: intentionally NOT cloud-stored; this prototype
--   has no server authentication and the PIN is local-only by design.

BEGIN;

-- These two fields were missing from the first schema draft.
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS onboarded BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS extras JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Defensive data constraints: values are game-state values, not arbitrary
-- account/profile data. Existing valid rows are unaffected.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'players_age_band_check'
      AND conrelid = 'public.players'::regclass
  ) THEN
    ALTER TABLE public.players
      ADD CONSTRAINT players_age_band_check
      CHECK (age_band IN ('8-11', '12-15', '16-18'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'players_economy_nonnegative_check'
      AND conrelid = 'public.players'::regclass
  ) THEN
    ALTER TABLE public.players
      ADD CONSTRAINT players_economy_nonnegative_check
      CHECK (xp >= 0 AND coins >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'settings_language_check'
      AND conrelid = 'public.player_settings'::regclass
  ) THEN
    ALTER TABLE public.player_settings
      ADD CONSTRAINT settings_language_check
      CHECK (language IN ('en', 'hi'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'settings_text_size_check'
      AND conrelid = 'public.player_settings'::regclass
  ) THEN
    ALTER TABLE public.player_settings
      ADD CONSTRAINT settings_text_size_check
      CHECK (text_size IN ('small', 'medium', 'large'));
  END IF;
END $$;

-- Keep updated_at correct for future API writes.
CREATE OR REPLACE FUNCTION public.set_nyaya_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS players_set_updated_at ON public.players;
CREATE TRIGGER players_set_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.set_nyaya_updated_at();

DROP TRIGGER IF EXISTS progress_set_updated_at ON public.player_progress;
CREATE TRIGGER progress_set_updated_at
  BEFORE UPDATE ON public.player_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_nyaya_updated_at();

DROP TRIGGER IF EXISTS settings_set_updated_at ON public.player_settings;
CREATE TRIGGER settings_set_updated_at
  BEFORE UPDATE ON public.player_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_nyaya_updated_at();

-- Privacy default: the app has no real authentication wired yet, so the
-- public/anon key must not be able to read or write children's records.
-- After Clerk/Replit Auth is integrated, add narrowly scoped policies using
-- auth.uid() and keep these tables protected.
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_certificates ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Verification 1: should return all expected tables and columns.
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'players', 'player_progress', 'player_settings', 'player_certificates'
  )
ORDER BY table_name, ordinal_position;

-- Verification 2: should return 4 rows, all with rowsecurity = true.
SELECT relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname IN (
    'players', 'player_progress', 'player_settings', 'player_certificates'
  )
ORDER BY relname;