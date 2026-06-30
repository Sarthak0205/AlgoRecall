
CREATE TABLE public.problems (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  platform text NOT NULL DEFAULT 'LeetCode',
  difficulty text NOT NULL DEFAULT 'Medium',
  topic text NOT NULL DEFAULT 'General',
  url text,
  notes text,
  solved_date date NOT NULL DEFAULT CURRENT_DATE,
  interval_index int NOT NULL DEFAULT 0,
  next_review_date date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
  last_reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.problems TO authenticated;
GRANT ALL ON public.problems TO service_role;

ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own problems" ON public.problems
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own problems" ON public.problems
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own problems" ON public.problems
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own problems" ON public.problems
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX problems_user_due_idx ON public.problems (user_id, next_review_date);
CREATE INDEX problems_user_created_idx ON public.problems (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON public.problems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
