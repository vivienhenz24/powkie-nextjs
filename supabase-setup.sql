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

