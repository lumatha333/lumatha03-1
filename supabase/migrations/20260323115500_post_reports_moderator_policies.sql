-- Strengthen report moderation workflow and expose safe aggregate counts.

-- Ensure report-count view tracks only pending reports.
CREATE OR REPLACE VIEW public.post_report_counts AS
SELECT
  pr.post_id,
  COUNT(*)::int AS reports_count,
  MAX(pr.created_at) AS last_reported_at
FROM public.post_reports pr
WHERE pr.status = 'pending'
GROUP BY pr.post_id;

GRANT SELECT ON public.post_report_counts TO authenticated;
GRANT SELECT ON public.post_report_counts TO anon;

-- Harden user report policy (cannot report own post).
DROP POLICY IF EXISTS "Users can report posts" ON public.post_reports;
CREATE POLICY "Users can report posts"
ON public.post_reports
FOR INSERT
WITH CHECK (
  auth.uid() = reporter_id
  AND EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = post_id
      AND p.user_id <> auth.uid()
  )
);

-- Moderator read/update access using JWT app/user metadata role hints.
DROP POLICY IF EXISTS "Moderators can view all post reports" ON public.post_reports;
CREATE POLICY "Moderators can view all post reports"
ON public.post_reports
FOR SELECT
USING (
  COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('admin', 'moderator')
  OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'moderator')
);

DROP POLICY IF EXISTS "Moderators can update post reports" ON public.post_reports;
CREATE POLICY "Moderators can update post reports"
ON public.post_reports
FOR UPDATE
USING (
  COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('admin', 'moderator')
  OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'moderator')
)
WITH CHECK (
  COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('admin', 'moderator')
  OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'moderator')
);
