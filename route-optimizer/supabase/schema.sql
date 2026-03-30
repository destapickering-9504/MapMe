-- Run this in Supabase → SQL Editor after creating a project.
-- Enables per-user saved route payloads (OptimizeResponse JSON).

create table if not exists public.saved_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists saved_trips_user_created_at_idx
  on public.saved_trips (user_id, created_at desc);

-- Favorites for planner sidebar (star from route history).
alter table public.saved_trips
  add column if not exists is_favorite boolean not null default false;

create index if not exists saved_trips_user_favorite_idx
  on public.saved_trips (user_id, is_favorite)
  where is_favorite = true;

alter table public.saved_trips enable row level security;

create policy "saved_trips_select_own"
  on public.saved_trips for select
  using (auth.uid() = user_id);

create policy "saved_trips_insert_own"
  on public.saved_trips for insert
  with check (auth.uid() = user_id);

create policy "saved_trips_update_own"
  on public.saved_trips for update
  using (auth.uid() = user_id);

create policy "saved_trips_delete_own"
  on public.saved_trips for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Avatars bucket (profile photos). Run after Storage is enabled on the project.
-- Default bucket name matches frontend VITE_AVATAR_BUCKET (default: avatars).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );
