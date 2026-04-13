-- ============================================
-- SPLITZY: Full Migration Script
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Enable UUID generation
create extension if not exists "uuid-ossp";

-- 2. Create tables
-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  avatar_url text,
  partner_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Partner invitations
create table public.partner_invitations (
  id uuid default uuid_generate_v4() primary key,
  inviter_id uuid references public.profiles(id) on delete cascade not null,
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days')
);

-- Categories
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  icon text not null,
  is_default boolean default false,
  user_id uuid references public.profiles(id) on delete cascade
);

-- Expenses
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  paid_by uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) not null,
  amount numeric not null check (amount > 0),
  description text not null,
  type text not null check (type in ('personal', 'shared')),
  split_mode text not null default '50/50' check (split_mode in ('50/50', 'custom')),
  split_pct numeric check (split_pct >= 0 and split_pct <= 100),
  date date not null default current_date,
  created_at timestamptz default now()
);

-- Budgets
create table public.budgets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) not null,
  amount numeric not null check (amount > 0),
  month date not null,
  type text not null check (type in ('personal', 'shared')),
  unique (user_id, category_id, month, type)
);

-- 3. Seed default categories
insert into public.categories (name, icon, is_default) values
  ('Comida', 'restaurant', true),
  ('Transporte', 'directions-car', true),
  ('Servicios', 'receipt', true),
  ('Entretenimiento', 'movie', true),
  ('Salud', 'local-hospital', true),
  ('Hogar', 'home', true),
  ('Otros', 'more-horiz', true);

-- 4. Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.partner_invitations enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;

-- 5. RLS Policies

-- Profiles
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can read partner profile"
  on public.profiles for select
  using (id = (select partner_id from public.profiles where id = auth.uid()));

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Partner invitations
create policy "Users can create invitations"
  on public.partner_invitations for insert
  with check (auth.uid() = inviter_id);

create policy "Users can read own invitations"
  on public.partner_invitations for select
  using (auth.uid() = inviter_id);

create policy "Anyone can read invitation by token"
  on public.partner_invitations for select
  using (true);

create policy "Users can update invitations"
  on public.partner_invitations for update
  using (true);

-- Categories
create policy "Users can read default categories"
  on public.categories for select
  using (is_default = true);

create policy "Users can read own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can create categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- Expenses
create policy "Users can read own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "Users can read partner shared expenses"
  on public.expenses for select
  using (
    type = 'shared'
    and user_id = (select partner_id from public.profiles where id = auth.uid())
  );

create policy "Users can create expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own expenses"
  on public.expenses for update
  using (auth.uid() = user_id);

create policy "Users can delete own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- Budgets
create policy "Users can read own budgets"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy "Users can create budgets"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own budgets"
  on public.budgets for update
  using (auth.uid() = user_id);

create policy "Users can delete own budgets"
  on public.budgets for delete
  using (auth.uid() = user_id);

-- 6. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7. Enable realtime for expenses
alter publication supabase_realtime add table public.expenses;
