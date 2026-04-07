-- LunaBirth Cloud Sync Schema
-- Run this in your Supabase project's SQL Editor (Database → SQL Editor → New query).
--
-- Design: snapshot-based storage. Each table holds one JSON document per session.
-- Simple, correct for the data volume (~85 KB), avoids complex row-level merging.
--
-- RLS policies:
--   Primary (owner): full access to their session's rows.
--   Partner:         SELECT on everything in the session.
--                    (Writes are locked at the snapshot level — only the owner syncs.)

-- ─── Enable UUID extension ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Sessions ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_ids  UUID[] NOT NULL DEFAULT '{}',
  invite_code  TEXT NOT NULL UNIQUE,
  settings     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Owner: full access
CREATE POLICY "owner_full_access_sessions" ON sessions
  FOR ALL USING (owner_id = auth.uid());

-- Partner: read-only
CREATE POLICY "partner_read_sessions" ON sessions
  FOR SELECT USING (auth.uid() = ANY(partner_ids));

-- Anyone signed in can look up a session by invite_code to join
CREATE POLICY "anyone_read_by_invite_code" ON sessions
  FOR SELECT USING (true);  -- filtered to specific invite_code in application code

-- ─── Contraction snapshots ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contraction_snapshots (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
  data        JSONB NOT NULL DEFAULT '[]',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contraction_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_full_access_contractions" ON contraction_snapshots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM sessions WHERE id = session_id AND owner_id = auth.uid())
  );

CREATE POLICY "partner_read_contractions" ON contraction_snapshots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM sessions WHERE id = session_id AND auth.uid() = ANY(partner_ids))
  );

-- Auto-update updated_at on change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER contraction_snapshots_updated_at
  BEFORE UPDATE ON contraction_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Hydration snapshots ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hydration_snapshots (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
  data        JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE hydration_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_full_access_hydration" ON hydration_snapshots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM sessions WHERE id = session_id AND owner_id = auth.uid())
  );

CREATE POLICY "partner_read_hydration" ON hydration_snapshots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM sessions WHERE id = session_id AND auth.uid() = ANY(partner_ids))
  );

CREATE TRIGGER hydration_snapshots_updated_at
  BEFORE UPDATE ON hydration_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Todo snapshots ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS todo_snapshots (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
  data        JSONB NOT NULL DEFAULT '[]',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE todo_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_full_access_todos" ON todo_snapshots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM sessions WHERE id = session_id AND owner_id = auth.uid())
  );

CREATE POLICY "partner_read_todos" ON todo_snapshots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM sessions WHERE id = session_id AND auth.uid() = ANY(partner_ids))
  );

CREATE TRIGGER todo_snapshots_updated_at
  BEFORE UPDATE ON todo_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Enable Realtime on snapshot tables ───────────────────────────────────────
-- Run these in Supabase Dashboard → Database → Replication, or via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE contraction_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE todo_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE hydration_snapshots;
