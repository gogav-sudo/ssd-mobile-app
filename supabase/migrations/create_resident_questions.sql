CREATE TABLE IF NOT EXISTS public.resident_questions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  telegram_chat_id text NOT NULL,
  full_name text NOT NULL,
  object_name text NOT NULL,
  question_text text NOT NULL
);

-- Match existing unrestricted pattern used by employees/shifts/incidents.
ALTER TABLE public.resident_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all - resident_questions select" ON public.resident_questions;
CREATE POLICY "Allow all - resident_questions select" ON public.resident_questions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all - resident_questions insert" ON public.resident_questions;
CREATE POLICY "Allow all - resident_questions insert" ON public.resident_questions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all - resident_questions update" ON public.resident_questions;
CREATE POLICY "Allow all - resident_questions update" ON public.resident_questions
  FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_resident_questions_created_at ON public.resident_questions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resident_questions_object_name ON public.resident_questions (object_name);
CREATE INDEX IF NOT EXISTS idx_resident_questions_telegram_chat_id ON public.resident_questions (telegram_chat_id);
