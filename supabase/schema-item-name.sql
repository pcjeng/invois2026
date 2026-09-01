-- ============================================================
-- Invois App — MEDAN NAMA ITEM (item_name) pada baris dokumen
-- ============================================================
-- Jalankan SEBELUM save dokumen dengan versi aplikasi baharu,
-- jika tidak akan keluar ralat "Could not find the 'item_name' column".
-- ============================================================

alter table document_items add column if not exists item_name text default '';
