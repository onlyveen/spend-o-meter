-- Spend-O-Meter database schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- Enum: payment_mode
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_mode') then
    create type payment_mode as enum ('cash', 'credit_card', 'upi', 'debit_card');
  end if;
end$$;

-- ============================================================
-- Table: profiles
-- One row per auth user, auto-created on signup (see trigger
-- below). Lets the UI show *who* logged an expense, since the
-- client can't read other users' auth.users rows directly.
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "Authenticated users can view all profiles" on profiles;
create policy "Authenticated users can view all profiles"
  on profiles for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up,
-- falling back to a title-cased version of their email handle
-- when no full_name was supplied at signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      initcap(replace(split_part(new.email, '@', 1), '.', ' '))
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users created before this table existed.
insert into public.profiles (id, email, full_name)
select
  id,
  email,
  coalesce(
    nullif(trim(raw_user_meta_data->>'full_name'), ''),
    nullif(trim(raw_user_meta_data->>'name'), ''),
    initcap(replace(split_part(email, '@', 1), '.', ' '))
  )
from auth.users
on conflict (id) do nothing;

-- ============================================================
-- Table: expenses
-- ============================================================
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  date date not null default current_date,
  amount numeric(12, 2) not null check (amount > 0),
  category text not null,
  payment_mode payment_mode not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_date_idx on expenses (user_id, date);
create index if not exists expenses_user_category_idx on expenses (user_id, category);

-- ============================================================
-- Table: budget
-- ============================================================
create table if not exists budget (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  category text not null,
  monthly_limit numeric(12, 2) not null check (monthly_limit >= 0),
  month text not null, -- format: YYYY-MM
  unique (user_id, category, month)
);

create index if not exists budget_user_month_idx on budget (user_id, month);

-- ============================================================
-- Table: categories
-- User-managed spending categories. `name` is plain text (not a
-- foreign key target) so renaming/deleting never breaks existing
-- expenses/budget rows, which also just store category as text.
-- ============================================================
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  icon text not null default '✦',
  period text not null default 'monthly' check (period in ('monthly', 'yearly')),
  is_savings boolean not null default false,
  default_limit numeric(12, 2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists categories_user_sort_idx on categories (user_id, sort_order);

-- ============================================================
-- Migration: budget/categories used to be unique per-user. Now
-- that data is shared across all users in the project, uniqueness
-- must drop user_id so two users editing the same category don't
-- create duplicate rows instead of updating the shared one.
-- (No-ops safely if already migrated or the old constraint name
-- doesn't match, since the new constraint is added regardless.)
-- ============================================================
alter table budget drop constraint if exists budget_user_id_category_month_key;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'budget_category_month_key') then
    alter table budget add constraint budget_category_month_key unique (category, month);
  end if;
end$$;

alter table categories drop constraint if exists categories_user_id_name_key;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'categories_name_key') then
    alter table categories add constraint categories_name_key unique (name);
  end if;
end$$;

-- ============================================================
-- Row Level Security
-- All auth users in this Supabase project share one household's
-- data (any signed-in user can see/edit all expenses, budget, and
-- categories) — this is a shared-account app, not multi-tenant.
-- `user_id` is kept on each row to record who logged it, not to
-- restrict access.
-- ============================================================
alter table expenses enable row level security;
alter table budget enable row level security;
alter table categories enable row level security;

drop policy if exists "Users can manage their own expenses" on expenses;
drop policy if exists "Authenticated users can manage all expenses" on expenses;
create policy "Authenticated users can manage all expenses"
  on expenses for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Users can manage their own budget" on budget;
drop policy if exists "Authenticated users can manage all budget" on budget;
create policy "Authenticated users can manage all budget"
  on budget for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Users can manage their own categories" on categories;
drop policy if exists "Authenticated users can manage all categories" on categories;
create policy "Authenticated users can manage all categories"
  on categories for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- Seed: default budget for the current month
-- Replace the month value below or re-run for each new month.
-- This seed only works after a user has signed up since it needs
-- auth.uid() of a logged-in session. Easiest path: insert these
-- via the in-app "Budget Setup" page on first run, which uses the
-- defaults below automatically.
-- ============================================================
-- insert into budget (user_id, category, monthly_limit, month) values
--   (auth.uid(), 'Groceries', 8000, to_char(now(), 'YYYY-MM')),
--   (auth.uid(), 'Eating Out', 5000, to_char(now(), 'YYYY-MM')),
--   (auth.uid(), 'Shopping', 10000, to_char(now(), 'YYYY-MM')),
--   (auth.uid(), 'Cabs', 2500, to_char(now(), 'YYYY-MM')),
--   (auth.uid(), 'Baby', 5000, to_char(now(), 'YYYY-MM')),
--   (auth.uid(), 'Subscriptions', 4658, to_char(now(), 'YYYY-MM')),
--   (auth.uid(), 'Medical', 2000, to_char(now(), 'YYYY-MM')),
--   (auth.uid(), 'Misc', 5000, to_char(now(), 'YYYY-MM'));
