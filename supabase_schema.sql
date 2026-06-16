-- =====================================================
-- StudyForge Database Schema
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Study Plans table
create table public.study_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  summary text,
  prompt text,
  plan_data jsonb not null,
  start_date date,
  end_date date,
  total_days integer,
  completed_tasks integer[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.study_plans enable row level security;

-- Policies: Users can only access their own plans
create policy "Users can view their own plans"
  on public.study_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert their own plans"
  on public.study_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own plans"
  on public.study_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete their own plans"
  on public.study_plans for delete
  using (auth.uid() = user_id);

-- Index for faster user queries
create index study_plans_user_id_idx on public.study_plans(user_id);
create index study_plans_created_at_idx on public.study_plans(created_at desc);

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_study_plan_updated
  before update on public.study_plans
  for each row execute procedure public.handle_updated_at();
