do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_link_type') then
    create type public.profile_link_type as enum (
      'instagram',
      'youtube',
      'tiktok',
      'twitter',
      'email'
    );
  end if;
end $$;

create table if not exists public.profile_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.profile_link_type not null,
  url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_profile_links_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_links_updated
before update on public.profile_links
for each row
execute procedure public.handle_profile_links_updated_at();

alter table public.profile_links
  enable row level security;

create policy "Users manage own profile links"
on public.profile_links
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Anyone can read active profile links"
on public.profile_links
for select
using (is_active = true);

create index if not exists profile_links_user_id_created_at_idx
  on public.profile_links (user_id, created_at);
