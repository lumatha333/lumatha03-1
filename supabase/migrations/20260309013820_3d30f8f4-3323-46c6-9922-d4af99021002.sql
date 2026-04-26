-- Extend posts table for advanced creation modes
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS feeling text,
  ADD COLUMN IF NOT EXISTS post_type text NOT NULL DEFAULT 'post',
  ADD COLUMN IF NOT EXISTS bg_color text,
  ADD COLUMN IF NOT EXISTS allow_comments boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_sharing boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS shield_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS tagged_user_ids uuid[] NOT NULL DEFAULT '{}';

-- Ensure media_urls has a predictable default
ALTER TABLE public.posts
  ALTER COLUMN media_urls SET DEFAULT '{}';

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_posts_audience ON public.posts (audience);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON public.posts (post_type);
CREATE INDEX IF NOT EXISTS idx_posts_expires_at ON public.posts (expires_at);

-- Refresh SELECT policy to support audience-based visibility
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;

CREATE POLICY "Audience-aware post visibility"
ON public.posts
FOR SELECT
USING (
  auth.uid() = user_id
  OR (
    visibility = 'public'
    AND COALESCE(is_private, false) = false
    AND (
      COALESCE(audience, 'global') IN ('global', 'regional', 'ghost')
      OR (
        COALESCE(audience, 'global') = 'following'
        AND EXISTS (
          SELECT 1
          FROM public.follows f
          WHERE f.follower_id = auth.uid()
            AND f.following_id = posts.user_id
        )
      )
    )
  )
);