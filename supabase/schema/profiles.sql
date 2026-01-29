-- Profiles table keeps auth user metadata such as username and avatar URL
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  is_user_visited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
before update on public.profiles
for each row
execute procedure public.handle_profiles_updated_at();

alter table public.profiles
  enable row level security;

create policy "Users can read own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update using (auth.uid() = id);

-- Storage bucket for profile images (run once)
insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do nothing;

create policy "Anyone can view profile images"
on storage.objects
for select using (bucket_id = 'profile-images');

create policy "Users can insert their profile images"
on storage.objects
for insert
with check (bucket_id = 'profile-images' and auth.uid() = owner);

create policy "Users can delete their profile images"
on storage.objects
for delete using (bucket_id = 'profile-images' and auth.uid() = owner);
