-- ChessVerse — Supabase schema
-- Run this in Supabase SQL Editor once after creating the project.

create extension if not exists "uuid-ossp";

-- ─── profiles ─────────────────────────────────────────────
-- One row per authenticated user. Linked to auth.users via id.
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text not null check (length(username) between 2 and 24),
  city          text,
  elo           integer not null default 1200,
  games_played  integer not null default 0,
  wins          integer not null default 0,
  losses        integer not null default 0,
  draws         integer not null default 0,
  is_pro        boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_elo_idx  on public.profiles (elo desc);
create index if not exists profiles_city_idx on public.profiles (city);

-- ─── RLS ──────────────────────────────────────────────────
-- Anyone can read profiles (for leaderboard).
-- Only the authenticated owner can insert/update their own row.
alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ─── trigger: auto-create profile on signup ──────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, city)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1), 'Player'),
    coalesce(new.raw_user_meta_data->>'city', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ─── games (optional history of finished games) ──────────
create table if not exists public.games (
  id          uuid primary key default uuid_generate_v4(),
  white_id    uuid references public.profiles(id),
  black_id    uuid references public.profiles(id),
  pgn         text not null,
  result      text not null check (result in ('1-0', '0-1', '1/2-1/2')),
  played_at   timestamptz not null default now()
);

alter table public.games enable row level security;

drop policy if exists "Games are viewable by everyone" on public.games;
create policy "Games are viewable by everyone"
  on public.games for select using (true);

drop policy if exists "Users can insert their own games" on public.games;
create policy "Users can insert their own games"
  on public.games for insert
  with check (auth.uid() = white_id or auth.uid() = black_id);
