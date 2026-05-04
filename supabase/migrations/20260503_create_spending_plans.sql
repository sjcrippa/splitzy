create table spending_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  month text not null,
  monthly_amount numeric not null check (monthly_amount > 0),
  created_at timestamptz default now() not null,
  constraint spending_plans_user_month_unique unique (user_id, month)
);

alter table spending_plans enable row level security;

create policy "Users can view own spending plans"
  on spending_plans for select using (auth.uid() = user_id);
create policy "Users can insert own spending plans"
  on spending_plans for insert with check (auth.uid() = user_id);
create policy "Users can update own spending plans"
  on spending_plans for update using (auth.uid() = user_id);
create policy "Users can delete own spending plans"
  on spending_plans for delete using (auth.uid() = user_id);
