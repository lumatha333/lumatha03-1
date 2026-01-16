-- Drop the existing constraint that only allows post_id OR document_id
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comment_target_check;

-- Add a new constraint that allows post_id, document_id, OR reference_id
ALTER TABLE public.comments ADD CONSTRAINT comment_target_check CHECK (
  (post_id IS NOT NULL AND document_id IS NULL AND reference_id IS NULL) OR
  (post_id IS NULL AND document_id IS NOT NULL AND reference_id IS NULL) OR
  (post_id IS NULL AND document_id IS NULL AND reference_id IS NOT NULL)
);