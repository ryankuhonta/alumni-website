-- Migration 024: Default privileges for alumni_v2 schema
--
-- Why: `GRANT ALL ON ALL TABLES IN SCHEMA` only applies to tables that exist
-- at the time it runs. Tables created later (e.g. job_likes in 021) do NOT
-- inherit the grant, which causes "permission denied for table" from
-- supabase-js even when RLS policies are correct.
--
-- This sets default privileges so every FUTURE table/sequence/function created
-- in alumni_v2 by the migration role (postgres) is automatically accessible.
--
-- Supabase is also ending automatic Data API grants for new tables on
-- Oct 30, 2026 - this migration makes us immune to that change.

-- Tables
ALTER DEFAULT PRIVILEGES IN SCHEMA alumni_v2
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA alumni_v2
  GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA alumni_v2
  GRANT ALL ON TABLES TO service_role;

-- Sequences (needed for serial/identity columns)
ALTER DEFAULT PRIVILEGES IN SCHEMA alumni_v2
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA alumni_v2
  GRANT USAGE, SELECT ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA alumni_v2
  GRANT ALL ON SEQUENCES TO service_role;

-- Functions / RPCs
ALTER DEFAULT PRIVILEGES IN SCHEMA alumni_v2
  GRANT EXECUTE ON FUNCTIONS TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA alumni_v2
  GRANT EXECUTE ON FUNCTIONS TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA alumni_v2
  GRANT EXECUTE ON FUNCTIONS TO service_role;
