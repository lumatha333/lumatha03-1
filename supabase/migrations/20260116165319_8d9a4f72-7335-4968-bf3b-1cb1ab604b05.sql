-- Add a reference_id text column for adventure and other non-UUID comments
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS reference_id TEXT;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_comments_reference_id ON public.comments(reference_id);

-- Add comment explaining the columns:
-- post_id: For home feed posts (UUID, foreign key)
-- document_id: For education documents (UUID, foreign key)  
-- reference_id: For adventure items (text, format: adventure_type_id)