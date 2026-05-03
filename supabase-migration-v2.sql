-- ============================================
-- SPLITZY V2: Obligaciones Compartidas
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Helper function: get partner_id for current user
create or replace function public.get_partner_id()
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  select partner_id from public.profiles where id = auth.uid();
$$;

-- 2. Shared obligations table
create table public.shared_obligations (
  id uuid default uuid_generate_v4() primary key,
  created_by uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  icon text not null default 'receipt',
  obligation_type text not null check (obligation_type in ('fixed', 'variable')),
  fixed_amount numeric check (
    (obligation_type = 'fixed' and fixed_amount is not null and fixed_amount > 0)
    or (obligation_type = 'variable' and fixed_amount is null)
  ),
  recurrence text not null default 'monthly' check (recurrence in ('monthly', 'weekly', 'one_time', 'none')),
  split_mode text not null default '50/50' check (split_mode in ('50/50', 'custom')),
  split_pct numeric check (split_pct is null or (split_pct >= 0 and split_pct <= 100)),
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- 3. Obligation payments table
create table public.obligation_payments (
  id uuid default uuid_generate_v4() primary key,
  obligation_id uuid references public.shared_obligations(id) on delete cascade not null,
  paid_by uuid references public.profiles(id) on delete cascade not null,
  amount numeric not null check (amount > 0),
  description text,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- 4. Helper: check if user can access an obligation
create or replace function public.can_access_obligation(obl_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.shared_obligations
    where id = obl_id
    and (
      created_by = auth.uid()
      or created_by = (select partner_id from public.profiles where id = auth.uid())
    )
  );
$$;

-- 5. Enable RLS
alter table public.shared_obligations enable row level security;
alter table public.obligation_payments enable row level security;

-- 6. RLS Policies for shared_obligations

-- Both partners can read
create policy "Users can read own obligations"
  on public.shared_obligations for select
  using (created_by = auth.uid() or created_by = public.get_partner_id());

-- Only creator can insert
create policy "Users can create obligations"
  on public.shared_obligations for insert
  with check (auth.uid() = created_by);

-- Only creator can update
create policy "Users can update own obligations"
  on public.shared_obligations for update
  using (auth.uid() = created_by);

-- Only creator can delete
create policy "Users can delete own obligations"
  on public.shared_obligations for delete
  using (auth.uid() = created_by);

-- 7. RLS Policies for obligation_payments

-- Both partners can read payments of accessible obligations
create policy "Users can read obligation payments"
  on public.obligation_payments for select
  using (public.can_access_obligation(obligation_id));

-- Both partners can add payments
create policy "Users can create obligation payments"
  on public.obligation_payments for insert
  with check (
    public.can_access_obligation(obligation_id)
    and auth.uid() = paid_by
  );

-- Only payer can delete their payment
create policy "Users can delete own payments"
  on public.obligation_payments for delete
  using (auth.uid() = paid_by);

-- 8. Indexes
create index idx_obligations_created_by on public.shared_obligations(created_by);
create index idx_obligations_active on public.shared_obligations(is_active) where is_active = true;
create index idx_payments_obligation_id on public.obligation_payments(obligation_id);
create index idx_payments_paid_by on public.obligation_payments(paid_by);
create index idx_payments_date on public.obligation_payments(date);

-- 9. Enable realtime
alter publication supabase_realtime add table public.shared_obligations;
alter publication supabase_realtime add table public.obligation_payments;
