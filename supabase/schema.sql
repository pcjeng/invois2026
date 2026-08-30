-- ============================================================
-- Invois App — Skema Supabase
-- Cara guna: Supabase Dashboard → SQL Editor → New query →
-- tampal keseluruhan fail ini → Run
-- ============================================================

create table if not exists company_profile (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  address text default '',
  phone text default '',
  email text default '',
  logo_url text default '',
  signature_url text default '',
  default_tax_rate numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text default '',
  phone text default '',
  email text default '',
  created_at timestamptz not null default now()
);

create table if not exists saved_items (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  unit text default '',
  unit_price numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null,
  doc_number integer,
  status text not null default 'Draft',
  issue_date date,
  due_date date,
  customer_id uuid references customers(id) on delete set null,
  customer_name text default '',
  customer_address text default '',
  customer_phone text default '',
  customer_email text default '',
  discount numeric not null default 0,
  tax_rate numeric not null default 0,
  subtotal numeric not null default 0,
  total numeric not null default 0,
  notes text default '',
  payment_method text default '',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists document_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  position integer not null default 0,
  description text not null,
  quantity numeric not null default 0,
  unit text default '',
  unit_price numeric not null default 0,
  amount numeric not null default 0
);

create index if not exists idx_documents_type on documents(doc_type);
create index if not exists idx_documents_created on documents(created_at desc);
create index if not exists idx_document_items_doc on document_items(document_id);

-- ------------------------------------------------------------
-- Row Level Security (RLS)
-- Aplikasi peribadi seorang pengguna: polisi terbuka untuk anon key.
-- NOTA KESELAMATAN: sesiapa yang ada URL + anon key boleh baca/tulis data.
-- Untuk ketatkan kemudian:
--   1) Tambah Supabase Auth pada aplikasi (login email/password), kemudian
--   2) Ganti polisi di bawah kepada contoh:
--      create policy "auth only" on documents
--        for all to authenticated
--        using (true) with check (true);
--   dan buang polisi "public ..." yang lama.
-- ------------------------------------------------------------
alter table company_profile enable row level security;
alter table customers        enable row level security;
alter table saved_items      enable row level security;
alter table documents        enable row level security;
alter table document_items   enable row level security;

create policy "public all company_profile" on company_profile for all using (true) with check (true);
create policy "public all customers"       on customers        for all using (true) with check (true);
create policy "public all saved_items"     on saved_items      for all using (true) with check (true);
create policy "public all documents"       on documents        for all using (true) with check (true);
create policy "public all document_items"  on document_items   for all using (true) with check (true);

-- Contoh data pertama (buang tanda '--' di bawah kalau nak terus guna):
-- insert into company_profile (name, address, phone, email)
-- values ('Syarikat Saya', 'No 1, Jalan Contoh, 47100 Shah Alam, Selangor', '012-345 6789', 'nama@syarikat.my');
--
-- insert into customers (name, address, phone)
-- values ('SMK LIBARAN', 'Jalan Contoh, Sandakan, Sabah', '089-123 456');
