-- ============================================================
-- Invois App — NAIKTARAF SaaS: multi-pengguna + Cloudinary
-- ============================================================
-- Jalankan SELEPAS deployment versi SaaS siap (GitHub Actions lulus).
-- Susunan keselamatan data: setiap pengguna nampak DATA DIA SAHAJA
-- melalui polisi RLS user_id = auth.uid().
--
-- SELESAI RUN SQL NI, JANGAN LUPA LANGKAH 4 (pindahan data lama)
-- supaya dokumen sedia ada muncul dalam akaun admin awak.
-- ============================================================

-- 1) Lajur tambahan
alter table company_profile add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table customers        add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table saved_items      add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table documents        add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table documents        add column if not exists pdf_url text;
alter table document_items   add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists idx_company_profile_user on company_profile(user_id);
create index if not exists idx_customers_user       on customers(user_id);
create index if not exists idx_saved_items_user     on saved_items(user_id);
create index if not exists idx_documents_user       on documents(user_id);
create index if not exists idx_document_items_user  on document_items(user_id);

-- 2) Buang polisi lama (awam DAN "authenticated semua" versi sebelum ini)
drop policy if exists "public all company_profile"        on company_profile;
drop policy if exists "public all customers"              on customers;
drop policy if exists "public all saved_items"            on saved_items;
drop policy if exists "public all documents"              on documents;
drop policy if exists "public all document_items"         on document_items;
drop policy if exists "authenticated all company_profile" on company_profile;
drop policy if exists "authenticated all customers"       on customers;
drop policy if exists "authenticated all saved_items"     on saved_items;
drop policy if exists "authenticated all documents"       on documents;
drop policy if exists "authenticated all document_items"  on document_items;

-- 3) Polisi per-pengguna: setiap baris milik seorang user sahaja
create policy "own rows company_profile" on company_profile
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own rows customers" on customers
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own rows saved_items" on saved_items
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own rows documents" on documents
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own rows document_items" on document_items
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- 4) PINDAHAN DATA LAMA KE AKAUN ADMIN (WAJIB untuk data sedia ada)
--    Ganti EMAIL_ANDA dengan email admin awak (yang dah didaftar),
--    kemudian BUANG tanda '--' di depan setiap baris dan RUN:
-- ============================================================
-- update company_profile set user_id = (select id from auth.users where email = 'EMAIL_ANDA') where user_id is null;
-- update customers        set user_id = (select id from auth.users where email = 'EMAIL_ANDA') where user_id is null;
-- update saved_items      set user_id = (select id from auth.users where email = 'EMAIL_ANDA') where user_id is null;
-- update documents        set user_id = (select id from auth.users where email = 'EMAIL_ANDA') where user_id is null;
-- update document_items d set user_id = (select user_id from documents doc where doc.id = d.document_id) where user_id is null;
-- ============================================================

-- Nota Cloudinary: tiada kena mengena dengan Supabase — daftar percuma di
-- cloudinary.com, buat Upload Preset (Signing Mode: Unsigned), kemudian isi
-- VITE_CLOUDINARY_CLOUD_NAME dan VITE_CLOUDINARY_UPLOAD_PRESET dalam .env
-- (langkah ada dalam README).
