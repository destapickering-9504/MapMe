-- public.saved_trips — per-user saved route payloads (OptimizeResponse JSON).
-- Depends: auth.users (Supabase Auth, already present).

create table if not exists public.saved_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists saved_trips_user_created_at_idx
  on public.saved_trips (user_id, created_at desc);

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
