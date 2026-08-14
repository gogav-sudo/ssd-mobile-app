CREATE TABLE IF NOT EXISTS public.employee_feedback (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  telegram_chat_id text NOT NULL,
  full_name text NOT NULL,
  object_name text NOT NULL,
  feedback_type text NOT NULL, -- 'blocker' | 'improvement'
  feedback_text text NOT NULL,
  shift_date date NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE public.employee_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all - employee_feedback select" ON public.employee_feedback;
CREATE POLICY "Allow all - employee_feedback select" ON public.employee_feedback
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all - employee_feedback insert" ON public.employee_feedback;
CREATE POLICY "Allow all - employee_feedback insert" ON public.employee_feedback
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_employee_feedback_created_at ON public.employee_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_feedback_telegram_chat_id ON public.employee_feedback (telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_employee_feedback_type ON public.employee_feedback (feedback_type);
