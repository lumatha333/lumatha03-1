-- Travel stories enhancements for Explore feed and saved stories support

ALTER TABLE public.travel_stories
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Backfill description from existing content where possible
UPDATE public.travel_stories
SET description = COALESCE(description, content)
WHERE description IS NULL;

-- Enable RLS on travel_stories if not already enabled
ALTER TABLE public.travel_stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for travel_stories
DROP POLICY IF EXISTS "Users can view travel stories" ON public.travel_stories;
CREATE POLICY "Users can view travel stories"
ON public.travel_stories
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can create travel stories" ON public.travel_stories;
CREATE POLICY "Users can create travel stories"
ON public.travel_stories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their travel stories" ON public.travel_stories;
CREATE POLICY "Users can update their travel stories"
ON public.travel_stories
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their travel stories" ON public.travel_stories;
CREATE POLICY "Users can delete their travel stories"
ON public.travel_stories
FOR DELETE
USING (auth.uid() = user_id);

-- Per-user saved travel stories
CREATE TABLE IF NOT EXISTS public.travel_story_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.travel_stories (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_travel_story_saves_story_id ON public.travel_story_saves (story_id);
CREATE INDEX IF NOT EXISTS idx_travel_story_saves_user_id ON public.travel_story_saves (user_id);

ALTER TABLE public.travel_story_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view travel story saves" ON public.travel_story_saves;
CREATE POLICY "Users can view travel story saves"
ON public.travel_story_saves
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save travel stories" ON public.travel_story_saves;
CREATE POLICY "Users can save travel stories"
ON public.travel_story_saves
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave travel stories" ON public.travel_story_saves;
CREATE POLICY "Users can unsave travel stories"
ON public.travel_story_saves
FOR DELETE
USING (auth.uid() = user_id);
