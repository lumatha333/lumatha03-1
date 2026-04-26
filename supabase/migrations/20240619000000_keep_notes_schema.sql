-- ============================================================================
-- KEEP NOTES TABLE MIGRATION
-- Full schema for the notes feature in Lumatha app
-- ============================================================================

-- 1. Create the keep_notes table with full schema
CREATE TABLE IF NOT EXISTS public.keep_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- User ownership
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Note content
    title TEXT,
    body TEXT,
    
    -- Media attachments (array of storage URLs)
    media_urls TEXT[] DEFAULT '{}',
    
    -- Note type classification
    note_type TEXT DEFAULT 'text' CHECK (note_type IN ('text', 'image', 'drawing', 'video', 'mixed')),
    
    -- Visual customization
    color TEXT DEFAULT '#1a2332',
    
    -- Organization
    is_pinned BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    
    -- Additional metadata
    tags TEXT[] DEFAULT '{}',
    word_count INTEGER DEFAULT 0
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_keep_notes_user_id ON public.keep_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_keep_notes_updated_at ON public.keep_notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_keep_notes_is_pinned ON public.keep_notes(is_pinned);
CREATE INDEX IF NOT EXISTS idx_keep_notes_is_archived ON public.keep_notes(is_archived);
CREATE INDEX IF NOT EXISTS idx_keep_notes_user_updated ON public.keep_notes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_keep_notes_user_pinned ON public.keep_notes(user_id, is_pinned, updated_at DESC);

-- 3. Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_keep_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_keep_notes_updated_at ON public.keep_notes;
CREATE TRIGGER trigger_keep_notes_updated_at
    BEFORE UPDATE ON public.keep_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_keep_notes_updated_at();

-- 4. Enable RLS on the table
ALTER TABLE public.keep_notes ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Policy: Users can only SELECT their own notes
CREATE POLICY "Users can view their own notes"
ON public.keep_notes
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can only INSERT their own notes (force user_id match)
CREATE POLICY "Users can insert their own notes"
ON public.keep_notes
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Users can only UPDATE their own notes
CREATE POLICY "Users can update their own notes"
ON public.keep_notes
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Users can only DELETE their own notes
CREATE POLICY "Users can delete their own notes"
ON public.keep_notes
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- STORAGE BUCKET SETUP FOR NOTE MEDIA
-- ============================================================================

-- Note: Create the bucket manually in Supabase Dashboard or use the Storage API
-- Bucket name: "note-media"
-- Settings:
--   - Public bucket: true (allows public read access)
--   - File size limit: 50MB
--   - Allowed MIME types: image/*, video/*

-- Storage RLS Policies (to be applied after bucket creation):

-- Policy: Authenticated users can upload to their own folder
-- CREATE POLICY "Users can upload to their own note folder"
-- ON storage.objects
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'note-media' 
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- );

-- Policy: Users can update their own files
-- CREATE POLICY "Users can update their own note files"
-- ON storage.objects
-- FOR UPDATE
-- TO authenticated
-- USING (
--   bucket_id = 'note-media'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- );

-- Policy: Users can delete their own files
-- CREATE POLICY "Users can delete their own note files"
-- ON storage.objects
-- FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'note-media'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- );

-- Policy: Anyone can read files (public bucket)
-- CREATE POLICY "Anyone can read note media"
-- ON storage.objects
-- FOR SELECT
-- TO anon, authenticated
-- USING (bucket_id = 'note-media');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.keep_notes IS 'User notes with media support for Lumatha app';
COMMENT ON COLUMN public.keep_notes.media_urls IS 'Array of Supabase Storage URLs for attached images/videos';
COMMENT ON COLUMN public.keep_notes.note_type IS 'Classification: text, image, drawing, video, or mixed';
COMMENT ON COLUMN public.keep_notes.color IS 'Background accent color for the note card';
