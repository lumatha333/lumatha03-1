-- Make chat-media bucket public so images/videos actually load
UPDATE storage.buckets SET public = true WHERE id = 'chat-media';