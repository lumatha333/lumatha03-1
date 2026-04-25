-- Allow all authenticated users to read arcade progress for leaderboard
CREATE POLICY "Anyone authenticated can view leaderboard"
ON public.arcade_progress
FOR SELECT
TO authenticated
USING (true);

-- Drop the restrictive own-only read policy
DROP POLICY IF EXISTS "Users can read own arcade progress" ON public.arcade_progress;