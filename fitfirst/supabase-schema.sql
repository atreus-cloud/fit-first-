-- FitFirst Supabase schema v1
create extension if not exists pgcrypto;
create table if not exists public.foods (
 id uuid primary key default gen_random_uuid(), source text not null, source_id text, name text not null,
 name_normalized text generated always as (lower(trim(name))) stored, category text, cuisine text,
 basis text default 'per 100 g', basis_grams numeric default 100,
 kcal numeric, protein_g numeric, carbs_g numeric, fat_g numeric, fiber_g numeric, sugar_g numeric, sodium_mg numeric,
 recipe_json jsonb, confidence text default 'database', created_at timestamptz default now(), updated_at timestamptz default now(),
 unique(source,source_id)
);
create index if not exists foods_name_search_idx on public.foods using gin (to_tsvector('simple',name));
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade, display_name text, daily_kcal integer default 2000,
 protein_g integer default 150, carbs_g integer default 220, fat_g integer default 65,
 starting_weight_kg numeric, goal_weight_kg numeric, diet_type text default 'non-vegetarian', cuisine_preferences text[], created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.food_logs (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
 logged_at timestamptz default now(), meal_type text, food_id uuid references public.foods(id), food_name text not null,
 source text, portion_label text, quantity numeric default 1, weight_g numeric,
 kcal numeric, protein_g numeric, carbs_g numeric, fat_g numeric, fiber_g numeric, sugar_g numeric, sodium_mg numeric,
 ai_estimated boolean default false, ai_confidence text, notes text, photo_path text, created_at timestamptz default now()
);
create index if not exists food_logs_user_date_idx on public.food_logs(user_id,logged_at desc);
create table if not exists public.weights (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
 recorded_at date default current_date, weight_kg numeric not null, note text, created_at timestamptz default now()
);
create table if not exists public.custom_foods (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
 name text not null, portion_label text, grams numeric, kcal numeric, protein_g numeric, carbs_g numeric, fat_g numeric,
 fiber_g numeric, sugar_g numeric, sodium_mg numeric, created_at timestamptz default now()
);
create table if not exists public.recipes (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
 name text not null, ingredients jsonb not null default '[]', servings numeric default 1,
 total_kcal numeric, total_protein_g numeric, total_carbs_g numeric, total_fat_g numeric,
 created_at timestamptz default now(), updated_at timestamptz default now()
);
-- Enable RLS. Configure policies before exposing Supabase client credentials to the browser.
alter table public.profiles enable row level security;
alter table public.food_logs enable row level security;
alter table public.weights enable row level security;
alter table public.custom_foods enable row level security;
alter table public.recipes enable row level security;
alter table public.foods enable row level security;
create policy "Foods readable by app users" on public.foods for select using (true);
create policy "Profile owner access" on public.profiles for all using (auth.uid()=id) with check (auth.uid()=id);
create policy "Food log owner access" on public.food_logs for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "Weight owner access" on public.weights for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "Custom food owner access" on public.custom_foods for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "Recipe owner access" on public.recipes for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
