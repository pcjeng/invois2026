-- ============================================================
-- Invois App — JADUAL BAYARAN (payments) untuk invois
-- Jalankan SEBELUM merekod bayaran dalam editor invois.
-- ============================================================

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  pay_date date not null default current_date,
  method text default '',
  amount numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table payments enable row level security;

create policy "own rows payments" on payments
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists idx_payments_doc on payments(document_id);
