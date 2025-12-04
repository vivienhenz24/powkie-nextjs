-- Create profiles table
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policy: Users can view their own profile
create policy "Users can view their own profile"
on public.profiles
for select
using ( auth.uid() = user_id );

-- Policy: Users can insert their own profile
create policy "Users can insert their own profile"
on public.profiles
for insert
with check ( auth.uid() = user_id );

-- Policy: Users can update their own profile
create policy "Users can update their own profile"
on public.profiles
for update
using ( auth.uid() = user_id );

-- Function to automatically create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Player'));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function when a new user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at on profile updates
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ===========================================
-- Games tables for hosting and joining games
-- ===========================================

-- Table: games (a hosted poker game)
create table public.games (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  game_type text not null,
  address text not null,
  lng double precision not null,
  lat double precision not null,
  game_date date not null,
  start_time time not null,
  buy_in text not null,
  max_players integer,
  created_at timestamptz default now()
);

-- Table: game_players (players who joined a game)
create table public.game_players (
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (game_id, player_id)
);

-- Enable RLS
alter table public.games enable row level security;
alter table public.game_players enable row level security;

-- Policy: any authenticated user can see available games
create policy "Authenticated users can view games"
on public.games
for select
using ( auth.role() = 'authenticated' );

-- Policy: only the host can insert/update/delete their games
create policy "Hosts can create games"
on public.games
for insert
with check ( auth.uid() = host_id );

create policy "Hosts can update their games"
on public.games
for update
using ( auth.uid() = host_id );

create policy "Hosts can delete their games"
on public.games
for delete
using ( auth.uid() = host_id );

-- Policy: authenticated users can see who joined which games
create policy "Authenticated users can view game players"
on public.game_players
for select
using ( auth.role() = 'authenticated' );

-- Policy: users can join/leave games as themselves
create policy "Users can join games"
on public.game_players
for insert
with check ( auth.uid() = player_id );

create policy "Users can leave games"
on public.game_players
for delete
using ( auth.uid() = player_id );

