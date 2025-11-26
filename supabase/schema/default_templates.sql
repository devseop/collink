-- Default templates master data
create table if not exists public.default_templates (
  id uuid primary key default gen_random_uuid(),
  category text,
  thumbnail_url text,
  background_image_url text,
  background_color text,
  is_background_colored boolean not null default false,
  items jsonb
);

alter table public.default_templates enable row level security;

create policy "Anyone can read default templates"
on public.default_templates
for select
using (true);

