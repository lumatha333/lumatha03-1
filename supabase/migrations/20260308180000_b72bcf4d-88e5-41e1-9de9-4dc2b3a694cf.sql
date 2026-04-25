-- Keep adventure points monotonic and mirror them into arcade_progress leaderboard XP.
CREATE OR REPLACE FUNCTION public.sync_leaderboard_from_user_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_points integer;
  derived_level integer;
BEGIN
  safe_points := GREATEST(COALESCE(NEW.total_points, 0), COALESCE(OLD.total_points, 0), 0);
  NEW.total_points := safe_points;
  NEW.updated_at := now();

  derived_level := GREATEST(1, FLOOR(safe_points / 100.0)::integer + 1);

  INSERT INTO public.arcade_progress (user_id, xp, level, updated_at)
  VALUES (NEW.user_id, safe_points, derived_level, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    xp = GREATEST(public.arcade_progress.xp, EXCLUDED.xp),
    level = GREATEST(public.arcade_progress.level, EXCLUDED.level),
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_points_sync_leaderboard ON public.user_points;

CREATE TRIGGER trg_user_points_sync_leaderboard
BEFORE INSERT OR UPDATE OF total_points ON public.user_points
FOR EACH ROW
EXECUTE FUNCTION public.sync_leaderboard_from_user_points();

-- Backfill existing rows so leaderboard XP matches the best-known total points.
INSERT INTO public.arcade_progress (user_id, xp, level, updated_at)
SELECT
  up.user_id,
  GREATEST(0, COALESCE(up.total_points, 0)) AS xp,
  GREATEST(1, FLOOR(GREATEST(0, COALESCE(up.total_points, 0)) / 100.0)::integer + 1) AS level,
  now()
FROM public.user_points up
ON CONFLICT (user_id)
DO UPDATE SET
  xp = GREATEST(public.arcade_progress.xp, EXCLUDED.xp),
  level = GREATEST(public.arcade_progress.level, EXCLUDED.level),
  updated_at = now();
