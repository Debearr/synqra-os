create table if not exists exec_summaries (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) not null,
  label text not null,
  product_name text,
  data_json jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table exec_summaries enable row level security;

-- Policies
create policy "Users can view their own summaries"
  on exec_summaries for select
  using (auth.uid() = owner_id);

create policy "Users can insert their own summaries"
  on exec_summaries for insert
  with check (auth.uid() = owner_id);

create policy "Users can update their own summaries"
  on exec_summaries for update
  using (auth.uid() = owner_id);

create policy "Users can delete their own summaries"
  on exec_summaries for delete
  using (auth.uid() = owner_id);

