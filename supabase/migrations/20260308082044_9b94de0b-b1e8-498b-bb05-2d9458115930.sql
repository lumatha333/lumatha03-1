
CREATE TABLE public.arcade_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  total_playtime INTEGER NOT NULL DEFAULT 0,
  games_played JSONB NOT NULL DEFAULT '{}'::jsonb,
  high_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  achievements TEXT[] NOT NULL DEFAULT '{}',
  favorite_game TEXT,
  unlocked_themes TEXT[] NOT NULL DEFAULT ARRAY['default'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.arcade_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own arcade progress"
  ON public.arcade_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own arcade progress"
  ON public.arcade_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own arcade progress"
  ON public.arcade_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
