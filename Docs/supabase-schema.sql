-- PaceWise Database Schema for Supabase
-- Run this in the Supabase SQL editor to set up the database

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Create users table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Budget configurations
create table public.budget_configs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  total_money numeric not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  currency text default '₹',
  theme text default 'system',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- People (people the user tracks debt with)
create table public.people (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  avatar_url text,
  balance numeric default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Transactions
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('expense', 'income', 'bill', 'person')),
  amount numeric not null,
  date timestamp with time zone not null,
  category text,
  reason text,
  source text,
  person_id uuid references public.people(id) on delete set null,
  person_name text,
  direction text check (direction in ('gave', 'took', 'received', 'paid')),
  is_settlement boolean default false,
  payment_method text,
  note text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for performance
create index idx_budget_configs_user_id on public.budget_configs(user_id);
create index idx_people_user_id on public.people(user_id);
create index idx_transactions_user_id on public.transactions(user_id);
create index idx_transactions_date on public.transactions(date);
create index idx_transactions_person_id on public.transactions(person_id);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.budget_configs enable row level security;
alter table public.people enable row level security;
alter table public.transactions enable row level security;

-- RLS Policies for profiles
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- RLS Policies for budget_configs
create policy "Users can view their own budget configs" on public.budget_configs
  for select using (auth.uid() = user_id);

create policy "Users can insert their own budget configs" on public.budget_configs
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own budget configs" on public.budget_configs
  for update using (auth.uid() = user_id);

create policy "Users can delete their own budget configs" on public.budget_configs
  for delete using (auth.uid() = user_id);

-- RLS Policies for people
create policy "Users can view their own people" on public.people
  for select using (auth.uid() = user_id);

create policy "Users can insert their own people" on public.people
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own people" on public.people
  for update using (auth.uid() = user_id);

create policy "Users can delete their own people" on public.people
  for delete using (auth.uid() = user_id);

-- RLS Policies for transactions
create policy "Users can view their own transactions" on public.transactions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own transactions" on public.transactions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own transactions" on public.transactions
  for update using (auth.uid() = user_id);

create policy "Users can delete their own transactions" on public.transactions
  for delete using (auth.uid() = user_id);

-- Grant permissions
grant usage on schema public to authenticated;
grant all privileges on all tables in schema public to authenticated;
grant all privileges on all sequences in schema public to authenticated;
