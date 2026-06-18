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
-- Row Level Security
-- This is a single-user app per Supabase project, but RLS still
-- scopes every row to the authenticated user for safety.
-- ============================================================
alter table expenses enable row level security;
alter table budget enable row level security;

drop policy if exists "Users can manage their own expenses" on expenses;
create policy "Users can manage their own expenses"
  on expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own budget" on budget;
create policy "Users can manage their own budget"
  on budget for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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
