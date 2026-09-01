-- ============================================================
-- Invois App — MEDAN COP SYARIKAT (stamp_url)
-- Jalankan SEBELUM guna upload Cop Syarikat dalam Settings.
-- ============================================================

alter table company_profile add column if not exists stamp_url text default '';
