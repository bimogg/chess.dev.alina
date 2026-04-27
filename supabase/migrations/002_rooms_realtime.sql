-- Ensure realtime multiplayer rooms exist and are published to Realtime.

create table if not exists public.rooms (
  id            text primary key,
  fen           text not null,
  pgn           text not null default '',
  turn          text not null check (turn in ('w', 'b')),
  white_player  text,
  black_player  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.touch_rooms_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rooms_touch_updated_at on public.rooms;
create trigger rooms_touch_updated_at
  before update on public.rooms
  for each row execute function public.touch_rooms_updated_at();

alter table public.rooms enable row level security;

drop policy if exists "Rooms are readable by everyone" on public.rooms;
create policy "Rooms are readable by everyone"
  on public.rooms for select
  using (true);

drop policy if exists "Rooms are insertable by everyone" on public.rooms;
create policy "Rooms are insertable by everyone"
  on public.rooms for insert
  with check (true);

drop policy if exists "Rooms are updatable by everyone" on public.rooms;
create policy "Rooms are updatable by everyone"
  on public.rooms for update
  using (true)
  with check (true);

-- Required for Supabase Realtime postgres_changes subscriptions.
alter publication supabase_realtime add table public.rooms;
