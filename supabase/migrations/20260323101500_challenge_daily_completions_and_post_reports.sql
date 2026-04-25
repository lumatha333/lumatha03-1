-- Daily challenge completion tracking + travel story report pipeline

-- 1) Daily challenge completion table
CREATE TABLE IF NOT EXISTS public.challenge_daily_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  date_key date NOT NULL,
  count integer NOT NULL DEFAULT 0 CHECK (count >= 0 AND count <= 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date_key)
);

CREATE INDEX IF NOT EXISTS idx_challenge_daily_completions_user_date
  ON public.challenge_daily_completions (user_id, date_key DESC);

ALTER TABLE public.challenge_daily_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own daily challenge completions" ON public.challenge_daily_completions;
CREATE POLICY "Users can view own daily challenge completions"
ON public.challenge_daily_completions
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily challenge completions" ON public.challenge_daily_completions;
CREATE POLICY "Users can insert own daily challenge completions"
ON public.challenge_daily_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily challenge completions" ON public.challenge_daily_completions;
CREATE POLICY "Users can update own daily challenge completions"
ON public.challenge_daily_completions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_challenge_daily_completions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_challenge_daily_completions_updated_at ON public.challenge_daily_completions;
CREATE TRIGGER trg_challenge_daily_completions_updated_at
BEFORE UPDATE ON public.challenge_daily_completions
FOR EACH ROW
EXECUTE FUNCTION public.set_challenge_daily_completions_updated_at();

-- 2) Generic post reports table for travel story reporting / auto-hide pipeline
CREATE TABLE IF NOT EXISTS public.post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_post_reports_post_id ON public.post_reports (post_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_reporter_id ON public.post_reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_status ON public.post_reports (status);

ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can report posts" ON public.post_reports;
CREATE POLICY "Users can report posts"
ON public.post_reports
FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view own post reports" ON public.post_reports;
CREATE POLICY "Users can view own post reports"
ON public.post_reports
FOR SELECT
USING (auth.uid() = reporter_id);

-- Optional helper view for moderation dashboards and feed filtering.
CREATE OR REPLACE VIEW public.post_report_counts AS
SELECT
  pr.post_id,
  COUNT(*)::int AS reports_count,
  MAX(pr.created_at) AS last_reported_at
FROM public.post_reports pr
GROUP BY pr.post_id;
