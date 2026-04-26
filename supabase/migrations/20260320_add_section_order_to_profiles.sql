-- Add section_order column to profiles table for per-user section management
-- This replaces localStorage-based section ordering with per-user Supabase storage

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS section_order jsonb DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_section_order ON public.profiles (id) 
WHERE section_order IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.section_order IS 'JSON array of managed section order: ["home", "learn", "adventure", "messages", "randomConnect", "marketplace"]';
