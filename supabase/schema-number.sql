-- ============================================================
-- Invois App — FORMAT NOMBOR DOKUMEN BARU (ikut tarikh)
-- ============================================================
-- Format: YYYYMMDD + turutan 5 digit, cth: 2026090100001
-- Nombor lama (100, 101...) masih disimpan — dokumen baharu sahaja
-- yang guna format ini. WAJIB run SEBELUM buat dokumen baharu,
-- kerana nombor 17 digit melampaui had lajur integer lama.
-- ============================================================

alter table documents alter column doc_number type bigint using doc_number::bigint;
