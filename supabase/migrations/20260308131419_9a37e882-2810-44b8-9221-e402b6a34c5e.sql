
-- Create story_views table for tracking who viewed stories and their reactions
CREATE TABLE public.story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction text,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Story owner can see all views on their stories
CREATE POLICY "Story owners can view story views"
  ON public.story_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_views.story_id AND s.user_id = auth.uid()
    )
    OR viewer_id = auth.uid()
  );

-- Users can insert their own views
CREATE POLICY "Users can create story views"
  ON public.story_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- Users can update their own views (to add reaction)
CREATE POLICY "Users can update own story views"
  ON public.story_views FOR UPDATE
  USING (auth.uid() = viewer_id);
