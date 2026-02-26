
-- Create marketplace_profiles table for separate marketplace identity
CREATE TABLE public.marketplace_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  bio TEXT DEFAULT '',
  qualification TEXT DEFAULT '',
  location TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT marketplace_bio_length CHECK (length(bio) <= 120)
);

-- Enable RLS
ALTER TABLE public.marketplace_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view marketplace profiles"
  ON public.marketplace_profiles FOR SELECT USING (true);

CREATE POLICY "Users can create own marketplace profile"
  ON public.marketplace_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own marketplace profile"
  ON public.marketplace_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_marketplace_profiles_updated_at
  BEFORE UPDATE ON public.marketplace_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger to sync likes_count on marketplace_listings
CREATE OR REPLACE FUNCTION public.update_marketplace_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE marketplace_listings SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE marketplace_listings SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER marketplace_likes_count_trigger
  AFTER INSERT OR DELETE ON public.marketplace_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_marketplace_likes_count();

-- Add trigger to sync comments_count on marketplace_listings
CREATE OR REPLACE FUNCTION public.update_marketplace_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE marketplace_listings SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE marketplace_listings SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER marketplace_comments_count_trigger
  AFTER INSERT OR DELETE ON public.marketplace_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_marketplace_comments_count();
