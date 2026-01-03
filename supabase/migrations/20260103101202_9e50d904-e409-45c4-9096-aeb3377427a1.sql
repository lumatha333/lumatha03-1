-- Create document_reactions table for storing love reactions on documents
CREATE TABLE IF NOT EXISTS public.document_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL DEFAULT 'love',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(document_id, user_id)
);

-- Enable RLS
ALTER TABLE public.document_reactions ENABLE ROW LEVEL SECURITY;

-- Policies for document_reactions
CREATE POLICY "Users can view all document reactions"
  ON public.document_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can add their own reactions"
  ON public.document_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON public.document_reactions FOR DELETE
  USING (auth.uid() = user_id);