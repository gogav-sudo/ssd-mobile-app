-- Logs every free-text question employees ask the Knowledge Base search,
-- along with the outcome, for supervisor review. New table only — does not
-- touch employees, shifts, incidents, or knowledge_base.
CREATE TABLE IF NOT EXISTS kb_queries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  telegram_chat_id TEXT,
  full_name TEXT,
  question TEXT,
  matched_title TEXT,
  status TEXT
);

CREATE INDEX IF NOT EXISTS idx_kb_queries_created_at ON kb_queries (created_at DESC);

-- Matches the other 4 core tables (employees, shifts, incidents,
-- knowledge_base), which all currently have RLS disabled — this app has no
-- Supabase auth session, so RLS policies keyed on auth.uid() would block the
-- anon client entirely. Keeping RLS off here is consistent with the existing
-- schema and avoids the same silent-write-failure issue hit with the
-- shift-photos storage bucket.
ALTER TABLE kb_queries DISABLE ROW LEVEL SECURITY;
