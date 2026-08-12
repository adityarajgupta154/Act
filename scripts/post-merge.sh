#!/bin/bash
set -e
pnpm install --frozen-lockfile
# NOTE (Aug 2026): `pnpm --filter db push` (drizzle-kit → Supabase) is
# deliberately NOT run here. No artifact imports @workspace/db yet, and the
# stored SUPABASE_DATABASE_URL is not a valid postgres connection string, so
# the step only broke merges (ENOTFOUND during "Pulling schema").
# Re-add the push once the db package is actually consumed AND a valid
# connection string is configured.
