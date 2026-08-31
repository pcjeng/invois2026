-- ============================================================
-- Invois App — NAIKTARAF KESELAMATAN: Login Admin
-- ============================================================
-- Jalankan fail ini dalam Supabase → SQL Editor SELEPAS versi
-- aplikasi dengan skrin login telah di-deploy.
--
-- Apa yang ia buat:
--   1) Buang polisi RLS terbuka (anon) yang lama
--   2) Ganti dengan polisi untuk peranan 'authenticated' sahaja
--      → sesiapa yang TIDAK login takkan nampak / boleh ubah apa-apa data
--
-- Selepas ini, akaun admin dibuat di:
--   Supabase → Authentication → Users → Add user → Create new user
--   (email + kata laluan awak, tick "Auto Confirm User")
-- ============================================================

-- 1) Buang polisi awam lama
drop policy if exists "public all company_profile" on company_profile;
drop policy if exists "public all customers"       on customers;
drop policy if exists "public all saved_items"     on saved_items;
drop policy if exists "public all documents"       on documents;
drop policy if exists "public all document_items"  on document_items;

-- 2) Polisi baharu: hanya 'authenticated' (admin yang login)
create policy "authenticated all company_profile" on company_profile
  for all to authenticated using (true) with check (true);

create policy "authenticated all customers" on customers
  for all to authenticated using (true) with check (true);

create policy "authenticated all saved_items" on saved_items
  for all to authenticated using (true) with check (true);

create policy "authenticated all documents" on documents
  for all to authenticated using (true) with check (true);

create policy "authenticated all document_items" on document_items
  for all to authenticated using (true) with check (true);

-- Selesai. Cadangan tambahan (buat dalam Dashboard, bukan SQL):
--   Authentication → Sign In / Providers → Email → matikan "Enable Sign Up"
--   supaya orang lain tidak boleh mendaftar akaun sendiri.
