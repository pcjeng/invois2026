-- ============================================================
-- Invois App — SISTEM PERANAN: Admin vs User
-- ============================================================
-- Jalankan selepas deployment terkini (Actions lulus).
--
-- Peranan disimpan dalam auth.users.raw_app_meta_data->>'role'
-- dan HANYA boleh ditukar melalui SQL/dashboard ini — pengguna
-- biasa tidak boleh promote diri sendiri dari aplikasi.
--
-- LANGKAH 1 (WAJIB): jadikan diri anda ADMIN.
--   Ganti EMAIL_ANDA dengan email akaun anda, buang '--', RUN:
--
-- update auth.users
--    set raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb) || '{"role":"admin"}'::jsonb
--  where email = 'EMAIL_ANDA';
--
-- LANGKAH 2: run keseluruhan fail ini (fungsi bantu admin).
-- ============================================================

-- Fungsi semak: adakah pengguna semasa admin?
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public, auth as $$
  select coalesce(
    (select u.raw_app_meta_data->>'role' from auth.users u where u.id = auth.uid()),
    'user'
  ) = 'admin'
$$;

-- Senarai pengguna + bilangan dokumen (admin sahaja)
create or replace function public.admin_list_users()
returns table (
  uid uuid,
  user_email text,
  joined_at timestamptz,
  last_login timestamptz,
  is_banned boolean,
  role_name text,
  doc_count bigint
)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then
    raise exception 'Halaman ini untuk admin sahaja';
  end if;
  return query
  select
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    coalesce(u.banned_until > now(), false),
    coalesce(u.raw_app_meta_data->>'role', 'user'),
    (select count(*) from public.documents d where d.user_id = u.id)
  from auth.users u
  order by u.created_at asc;
end $$;

-- Tukar peranan pengguna (admin sahaja)
create or replace function public.admin_set_role(target uuid, new_role text)
returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then
    raise exception 'Halaman ini untuk admin sahaja';
  end if;
  if new_role not in ('admin', 'user') then
    raise exception 'Peranan tidak sah';
  end if;
  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb) || jsonb_build_object('role', new_role)
   where id = target;
end $$;

-- Ban / Unban pengguna (admin sahaja)
create or replace function public.admin_set_banned(target uuid, banned boolean)
returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then
    raise exception 'Halaman ini untuk admin sahaja';
  end if;
  update auth.users
     set banned_until = case when banned then now() + interval '100 years' else null end
   where id = target;
end $$;

grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
grant execute on function public.admin_set_banned(uuid, boolean) to authenticated;

-- ============================================================
-- NOTA:
-- 1) Selepas LANGKAH 1, log keluar & log masuk semula dalam aplikasi
--    supaya JWT baharu membawa role admin → menu Admin akan muncul.
-- 2) Jika user lupa kata laluan / perlu dipadam sepenuhnya, boleh juga
--    gunakan Dashboard → Authentication → Users.
-- 3) Jangan lupa schema-saas.sql (user_id + backfill data lama) jika
--    belum dijalankan lagi.
-- ============================================================
