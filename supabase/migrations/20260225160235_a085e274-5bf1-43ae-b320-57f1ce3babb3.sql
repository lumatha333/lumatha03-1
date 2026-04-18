
-- Create marketplace_listings table
CREATE TABLE public.marketplace_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'sell', -- sell, buy, job, rent
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  currency TEXT DEFAULT 'NPR',
  location TEXT,
  category TEXT,
  media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  media_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'active', -- active, sold, closed
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  qualification TEXT,
  salary_range TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active listings"
  ON public.marketplace_listings FOR SELECT
  USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Users can create own listings"
  ON public.marketplace_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings"
  ON public.marketplace_listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own listings"
  ON public.marketplace_listings FOR DELETE
  USING (auth.uid() = user_id);

-- Marketplace likes
CREATE TABLE public.marketplace_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

ALTER TABLE public.marketplace_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view marketplace likes"
  ON public.marketplace_likes FOR SELECT USING (true);
CREATE POLICY "Users can like listings"
  ON public.marketplace_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike listings"
  ON public.marketplace_likes FOR DELETE USING (auth.uid() = user_id);

-- Marketplace saved
CREATE TABLE public.marketplace_saved (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

ALTER TABLE public.marketplace_saved ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved"
  ON public.marketplace_saved FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save listings"
  ON public.marketplace_saved FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave listings"
  ON public.marketplace_saved FOR DELETE USING (auth.uid() = user_id);

-- Marketplace comments
CREATE TABLE public.marketplace_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view marketplace comments"
  ON public.marketplace_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments"
  ON public.marketplace_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments"
  ON public.marketplace_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments"
  ON public.marketplace_comments FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for marketplace media
INSERT INTO storage.buckets (id, name, public) VALUES ('marketplace-media', 'marketplace-media', true);

CREATE POLICY "Anyone can view marketplace media"
  ON storage.objects FOR SELECT USING (bucket_id = 'marketplace-media');
CREATE POLICY "Auth users can upload marketplace media"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'marketplace-media' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own marketplace media"
  ON storage.objects FOR UPDATE USING (bucket_id = 'marketplace-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own marketplace media"
  ON storage.objects FOR DELETE USING (bucket_id = 'marketplace-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for marketplace
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_comments;

-- Updated_at trigger
CREATE TRIGGER update_marketplace_listings_updated_at
  BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_comments_updated_at
  BEFORE UPDATE ON public.marketplace_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
