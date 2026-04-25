-- AI-Ready Notes Schema for Lumatha
-- Block-based system optimized for AI agents

-- 1. Notes Table (Metadata Layer)
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Metadata fields
  title TEXT,
  type_tag TEXT CHECK (type_tag IN ('idea', 'project', 'meeting', 'journal', 'reminder', 'draft')),
  vibe_theme TEXT DEFAULT 'deepNavy',
  
  -- Status flags
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Reminder functionality
  reminder_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Note Blocks Table (Modular Content Layer)
CREATE TABLE IF NOT EXISTS note_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  
  -- Block type and content
  type TEXT CHECK (type IN ('text', 'heading', 'todo', 'image', 'video', 'audio', 'drawing')),
  content JSONB NOT NULL DEFAULT '{}',
  
  -- Ordering within note
  order_index INTEGER NOT NULL DEFAULT 0,
  
  -- AI Metadata for each block
  ai_metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Note Insights Table (AI Analysis Layer)
CREATE TABLE IF NOT EXISTS note_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  
  -- AI-generated insights
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  key_entities TEXT[] DEFAULT '{}',
  
  -- Action items extracted by AI
  action_items JSONB DEFAULT '[]',
  
  -- Processing status
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Note Attachments Table (Media Storage)
CREATE TABLE IF NOT EXISTS note_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  block_id UUID REFERENCES note_blocks(id) ON DELETE CASCADE,
  
  -- File details
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  
  -- AI processing for media
  ocr_text TEXT,
  transcription TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_type_tag ON notes(type_tag);
CREATE INDEX IF NOT EXISTS idx_notes_is_archived ON notes(is_archived);

CREATE INDEX IF NOT EXISTS idx_note_blocks_note_id ON note_blocks(note_id);
CREATE INDEX IF NOT EXISTS idx_note_blocks_order ON note_blocks(note_id, order_index);

CREATE INDEX IF NOT EXISTS idx_note_insights_note_id ON note_insights(note_id);

-- Row Level Security Policies
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_attachments ENABLE ROW LEVEL SECURITY;

-- Notes: Users can only see their own notes
CREATE POLICY "Users can view own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- Note Blocks: Access through note ownership
CREATE POLICY "Users can view note blocks" ON note_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notes WHERE notes.id = note_blocks.note_id AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create note blocks" ON note_blocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes WHERE notes.id = note_blocks.note_id AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update note blocks" ON note_blocks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM notes WHERE notes.id = note_blocks.note_id AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete note blocks" ON note_blocks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM notes WHERE notes.id = note_blocks.note_id AND notes.user_id = auth.uid()
    )
  );

-- Note Insights: Same access pattern
CREATE POLICY "Users can view note insights" ON note_insights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notes WHERE notes.id = note_insights.note_id AND notes.user_id = auth.uid()
    )
  );

-- Attachments: Same access pattern
CREATE POLICY "Users can view attachments" ON note_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notes WHERE notes.id = note_attachments.note_id AND notes.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_blocks_updated_at
  BEFORE UPDATE ON note_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_insights_updated_at
  BEFORE UPDATE ON note_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-update note's updated_at when block changes
CREATE OR REPLACE FUNCTION update_note_timestamp_on_block_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE notes SET updated_at = NOW() WHERE id = NEW.note_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_note_on_block_change
  AFTER INSERT OR UPDATE ON note_blocks
  FOR EACH ROW EXECUTE FUNCTION update_note_timestamp_on_block_change();

-- Storage bucket for note attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('note-attachments', 'note-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for note attachments
CREATE POLICY "Users can upload note attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'note-attachments' AND 
    auth.uid() = owner
  );

CREATE POLICY "Users can view note attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'note-attachments' AND
    auth.uid() = owner
  );

CREATE POLICY "Users can delete note attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'note-attachments' AND
    auth.uid() = owner
  );
