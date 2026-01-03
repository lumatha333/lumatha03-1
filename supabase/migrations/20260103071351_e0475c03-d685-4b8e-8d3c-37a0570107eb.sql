-- Create document storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents
CREATE POLICY "Users can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Users can delete own documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create comment_reactions table
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all reactions" ON public.comment_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON public.comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reactions" ON public.comment_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.comment_reactions FOR DELETE USING (auth.uid() = user_id);

-- Create custom_challenges table for user-created challenges
CREATE TABLE IF NOT EXISTS public.custom_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.custom_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custom challenges" ON public.custom_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create custom challenges" ON public.custom_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own custom challenges" ON public.custom_challenges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own custom challenges" ON public.custom_challenges FOR DELETE USING (auth.uid() = user_id);

-- Create discover_visits table for tracking place visits
CREATE TABLE IF NOT EXISTS public.discover_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  place_id VARCHAR(100) NOT NULL,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, place_id)
);

ALTER TABLE public.discover_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own visits" ON public.discover_visits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add visits" ON public.discover_visits FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create travel_loves table for love reactions on travel places
CREATE TABLE IF NOT EXISTS public.travel_loves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  place_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, place_id)
);

ALTER TABLE public.travel_loves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all loves" ON public.travel_loves FOR SELECT USING (true);
CREATE POLICY "Users can add loves" ON public.travel_loves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own loves" ON public.travel_loves FOR DELETE USING (auth.uid() = user_id);