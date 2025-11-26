create table if not exists public.custom_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_template_id uuid references public.default_templates(id),
  category text,
  background_image_url text,
  background_color text,
  is_background_colored boolean not null default false,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_custom_templates_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_custom_templates_updated
before update on public.custom_templates
for each row
execute procedure public.handle_custom_templates_updated_at();

alter table public.custom_templates enable row level security;

create policy "Users manage own custom templates"
on public.custom_templates
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

