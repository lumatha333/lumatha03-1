
CREATE TABLE public.diary_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  canvas_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  background text NOT NULL DEFAULT '#0a0f1e',
  audience text NOT NULL DEFAULT 'public',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.diary_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own diary posts" ON public.diary_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view diary posts" ON public.diary_posts FOR SELECT TO authenticated USING (
  audience = 'public' OR user_id = auth.uid() OR 
  (audience = 'friends' AND EXISTS (
    SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = diary_posts.user_id
  ))
);
CREATE POLICY "Users can delete own diary posts" ON public.diary_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own diary posts" ON public.diary_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.diary_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  canvas_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  background text NOT NULL DEFAULT '#0a0f1e',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.diary_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own drafts" ON public.diary_drafts FOR ALL TO authenticated USING (auth.uid() = user_id);
