-- Create storage bucket for post media (photos, videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts-media', 
  'posts-media', 
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
);

-- Create storage bucket for chat media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media', 
  'chat-media', 
  true,
  20971520, -- 20MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip']
);

-- RLS policies for posts-media bucket
CREATE POLICY "Authenticated users can upload post media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'posts-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view post media"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts-media');

CREATE POLICY "Users can delete own post media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'posts-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policies for chat-media bucket
CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view chat media"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');

CREATE POLICY "Users can delete own chat media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);