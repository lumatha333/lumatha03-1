-- stories_setup.sql
-- Idempotent setup for Lumatha story uploads.
-- Supports bucket names used across codebases: "stories", "stories-media", and fallback "posts-media".

-- 1) Storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'stories',
    'stories',
    true,
    52428800,
    array['image/jpeg','image/png','image/webp','image/gif','audio/webm','audio/mp4','audio/ogg','video/webm','video/mp4']
  )
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'stories-media',
    'stories-media',
    true,
    52428800,
    array['image/jpeg','image/png','image/webp','image/gif','audio/webm','audio/mp4','audio/ogg','video/webm','video/mp4']
  )
on conflict (id) do nothing;

-- 2) Storage RLS policies (story buckets)
create policy if not exists "Auth users can upload stories"
on storage.objects for insert to authenticated
with check (bucket_id in ('stories', 'stories-media', 'posts-media'));

create policy if not exists "Auth users can update own story files"
on storage.objects for update to authenticated
using (bucket_id in ('stories', 'stories-media', 'posts-media') and owner = auth.uid())
with check (bucket_id in ('stories', 'stories-media', 'posts-media') and owner = auth.uid());

create policy if not exists "Auth users can delete own story files"
on storage.objects for delete to authenticated
using (bucket_id in ('stories', 'stories-media', 'posts-media') and owner = auth.uid());

create policy if not exists "Public read stories files"
on storage.objects for select to public
using (bucket_id in ('stories', 'stories-media', 'posts-media'));

-- 3) Stories table aligned to current app columns
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_url text not null,
  media_type text not null,
  caption text,
  visibility text default 'public',
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz default now()
);

alter table public.stories enable row level security;

create policy if not exists "Users manage own stories"
on public.stories for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "Public can read stories"
on public.stories for select to public
using (true);
