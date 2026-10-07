create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text,
  merchant_name text,
  receipt_date date,
  subtotal numeric,
  tax_amount numeric,
  total_amount numeric,
  currency text default 'INR',
  category text default 'Other',
  items jsonb default '[]'::jsonb,
  confidence numeric,
  anomaly_type text,
  anomaly_reason text,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.receipts enable row level security;

-- Create policies so users can only access their own receipts
create policy "Users can view their own receipts" 
  on public.receipts for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own receipts" 
  on public.receipts for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own receipts" 
  on public.receipts for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own receipts" 
  on public.receipts for delete 
  using (auth.uid() = user_id);

-- Speeds up the per-user, date-ordered dashboard query.
create index if not exists receipts_user_date_idx
  on public.receipts (user_id, receipt_date desc);
