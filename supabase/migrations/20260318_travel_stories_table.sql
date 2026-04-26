-- Create travel_stories table for cross-account story sharing
CREATE TABLE IF NOT EXISTS public.travel_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  location text,
  content text NOT NULL,
  cover_image text,
  moods text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  photos text[] DEFAULT '{}',
  audience text NOT NULL DEFAULT 'global', -- 'global', 'nepal', 'friends'
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_travel_stories_user_id ON public.travel_stories (user_id);
CREATE INDEX IF NOT EXISTS idx_travel_stories_audience ON public.travel_stories (audience);
CREATE INDEX IF NOT EXISTS idx_travel_stories_created_at ON public.travel_stories (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_travel_stories_likes_count ON public.travel_stories (likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_travel_stories_is_deleted ON public.travel_stories (is_deleted);

-- Enable RLS
ALTER TABLE public.travel_stories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own stories
CREATE POLICY "Users can select own stories"
ON public.travel_stories
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can see global stories from others
CREATE POLICY "Users can select global stories from others"
ON public.travel_stories
FOR SELECT
USING (
  auth.uid() != user_id
  AND audience = 'global'
  AND is_deleted = false
);

-- Policy: Users can see nepal stories if they're from nepal
CREATE POLICY "Users can select nepal stories if from nepal"
ON public.travel_stories
FOR SELECT
USING (
  auth.uid() != user_id
  AND audience = 'nepal'
  AND is_deleted = false
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = travel_stories.user_id
      AND p.country = 'Nepal'
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.country = 'Nepal'
  )
);

-- Policy: Users can see friends-only stories from friends
CREATE POLICY "Users can select friends-only stories from friends"
ON public.travel_stories
FOR SELECT
USING (
  auth.uid() != user_id
  AND audience = 'friends'
  AND is_deleted = false
  AND EXISTS (
    SELECT 1 FROM public.follows f
    WHERE f.follower_id = auth.uid()
      AND f.following_id = travel_stories.user_id
  )
);

-- Policy: Users can create stories
CREATE POLICY "Users can insert own stories"
ON public.travel_stories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own stories
CREATE POLICY "Users can update own stories"
ON public.travel_stories
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own stories (soft delete)
CREATE POLICY "Users can delete own stories"
ON public.travel_stories
FOR DELETE
USING (auth.uid() = user_id);

-- Create travel_story_likes table for like tracking
CREATE TABLE IF NOT EXISTS public.travel_story_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.travel_stories (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Index for like queries
CREATE INDEX IF NOT EXISTS idx_travel_story_likes_story_id ON public.travel_story_likes (story_id);
CREATE INDEX IF NOT EXISTS idx_travel_story_likes_user_id ON public.travel_story_likes (user_id);

-- Enable RLS for travel_story_likes
ALTER TABLE public.travel_story_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view likes
CREATE POLICY "Anyone can view travel story likes"
ON public.travel_story_likes
FOR SELECT
USING (true);

-- Policy: Users can create likes on public stories
CREATE POLICY "Users can like travel stories"
ON public.travel_story_likes
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.travel_stories ts
    WHERE ts.id = story_id
      AND (
        ts.user_id = auth.uid()
        OR (ts.audience = 'global' AND ts.is_deleted = false)
        OR (ts.audience = 'nepal' AND ts.is_deleted = false AND EXISTS (
          SELECT 1 FROM public.profiles p1, public.profiles p2
          WHERE p1.id = ts.user_id AND p1.country = 'Nepal'
            AND p2.id = auth.uid() AND p2.country = 'Nepal'
        ))
        OR (ts.audience = 'friends' AND ts.is_deleted = false AND EXISTS (
          SELECT 1 FROM public.follows f
          WHERE f.follower_id = auth.uid() AND f.following_id = ts.user_id
        ))
      )
  )
);

-- Policy: Users can delete their own likes
CREATE POLICY "Users can unlike travel stories"
ON public.travel_story_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Create travel_story_comments table
CREATE TABLE IF NOT EXISTS public.travel_story_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.travel_stories (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for comment queries
CREATE INDEX IF NOT EXISTS idx_travel_story_comments_story_id ON public.travel_story_comments (story_id);
CREATE INDEX IF NOT EXISTS idx_travel_story_comments_user_id ON public.travel_story_comments (user_id);

-- Enable RLS for travel_story_comments
ALTER TABLE public.travel_story_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view comments on visible stories
CREATE POLICY "Anyone can view travel story comments"
ON public.travel_story_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.travel_stories ts
    WHERE ts.id = story_id
      AND (
        ts.user_id = auth.uid()
        OR (ts.audience = 'global' AND ts.is_deleted = false)
        OR (ts.audience = 'nepal' AND ts.is_deleted = false AND EXISTS (
          SELECT 1 FROM public.profiles p1, public.profiles p2
          WHERE p1.id = ts.user_id AND p1.country = 'Nepal'
            AND p2.id = auth.uid() AND p2.country = 'Nepal'
        ))
        OR (ts.audience = 'friends' AND ts.is_deleted = false AND EXISTS (
          SELECT 1 FROM public.follows f
          WHERE f.follower_id = auth.uid() AND f.following_id = ts.user_id
        ))
      )
  )
);

-- Policy: Users can create comments on visible stories
CREATE POLICY "Users can create travel story comments"
ON public.travel_story_comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.travel_stories ts
    WHERE ts.id = story_id
      AND (
        ts.user_id = auth.uid()
        OR (ts.audience = 'global' AND ts.is_deleted = false)
        OR (ts.audience = 'nepal' AND ts.is_deleted = false AND EXISTS (
          SELECT 1 FROM public.profiles p1, public.profiles p2
          WHERE p1.id = ts.user_id AND p1.country = 'Nepal'
            AND p2.id = auth.uid() AND p2.country = 'Nepal'
        ))
        OR (ts.audience = 'friends' AND ts.is_deleted = false AND EXISTS (
          SELECT 1 FROM public.follows f
          WHERE f.follower_id = auth.uid() AND f.following_id = ts.user_id
        ))
      )
  )
);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update own travel story comments"
ON public.travel_story_comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete own travel story comments"
ON public.travel_story_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update travel_stories like count
CREATE OR REPLACE FUNCTION public.update_travel_story_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.travel_stories
  SET likes_count = (
    SELECT COUNT(*) FROM public.travel_story_likes
    WHERE story_id = COALESCE(NEW.story_id, OLD.story_id)
  )
  WHERE id = COALESCE(NEW.story_id, OLD.story_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER travel_story_likes_count_trigger
AFTER INSERT OR DELETE ON public.travel_story_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_travel_story_likes_count();

-- Trigger to update travel_stories comments count
CREATE OR REPLACE FUNCTION public.update_travel_story_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.travel_stories
  SET comments_count = (
    SELECT COUNT(*) FROM public.travel_story_comments
    WHERE story_id = COALESCE(NEW.story_id, OLD.story_id)
  )
  WHERE id = COALESCE(NEW.story_id, OLD.story_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER travel_story_comments_count_trigger
AFTER INSERT OR DELETE ON public.travel_story_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_travel_story_comments_count();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_travel_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER travel_stories_updated_at_trigger
BEFORE UPDATE ON public.travel_stories
FOR EACH ROW
EXECUTE FUNCTION public.update_travel_stories_updated_at();
