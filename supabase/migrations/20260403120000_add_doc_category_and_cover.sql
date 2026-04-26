alter table public.documents
  add column if not exists category text,
  add column if not exists cover_url text;