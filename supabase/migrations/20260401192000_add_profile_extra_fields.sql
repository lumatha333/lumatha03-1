alter table public.profiles
  add column if not exists school_name text,
  add column if not exists hobbies text,
  add column if not exists favorite_club text,
  add column if not exists favorite_show_movie_song text,
  add column if not exists favorite_actor_athlete_person text,
  add column if not exists games text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists profile_visibility jsonb not null default '{}'::jsonb;

update public.profiles
set profile_visibility = coalesce(profile_visibility, '{}'::jsonb)
where profile_visibility is null;