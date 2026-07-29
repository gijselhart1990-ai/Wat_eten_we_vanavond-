create table if not exists public.foodplanner_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  week jsonb not null default '{}'::jsonb,
  week_portions jsonb not null default '{}'::jsonb,
  shopping_list jsonb not null default '[]'::jsonb,
  checked jsonb not null default '{}'::jsonb,
  favorites jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.foodplanner_state enable row level security;

create policy "Users can read their own foodplanner state"
  on public.foodplanner_state for select
  using (auth.uid() = user_id);

create policy "Users can create their own foodplanner state"
  on public.foodplanner_state for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own foodplanner state"
  on public.foodplanner_state for update
  using (auth.uid() = user_id);
