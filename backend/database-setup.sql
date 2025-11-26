-- ============================================
-- Database Setup untuk Nomor Kunjungan Baru
-- ============================================
-- File ini berisi SQL scripts untuk setup database
-- Jalankan di Supabase SQL Editor
-- ============================================

-- ============================================
-- UPDATE: Tambahan untuk Multi-Unit Timer Settings
-- ============================================
-- Jika tabel settings sudah ada, pastikan ada kolom untuk
-- batas_waktu_kamala dan batas_waktu_padma
-- Ini untuk support timing berbeda per unit IGD

-- Cek struktur tabel settings
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'settings' 
ORDER BY ordinal_position;

-- Jika kolom belum ada, tambahkan:
-- ALTER TABLE settings ADD COLUMN IF NOT EXISTS batas_waktu_kamala jsonb;
-- ALTER TABLE settings ADD COLUMN IF NOT EXISTS batas_waktu_padma jsonb;

-- ============================================

-- 1. CEK STRUKTUR TABEL KUNJUNGAN
-- Lihat kolom dan tipe data
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'kunjungan' 
ORDER BY ordinal_position;

-- 2. CEK TRIGGER YANG ADA
-- Cek apakah ada trigger yang auto-generate nomor_antrian
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'kunjungan';

-- Atau dengan query Postgres native:
SELECT * FROM pg_trigger 
WHERE tgrelid = 'kunjungan'::regclass;

-- 3. HAPUS DEFAULT VALUE (jika ada)
-- Jika kolom nomor_antrian punya default value auto-generate
ALTER TABLE kunjungan 
ALTER COLUMN nomor_antrian DROP DEFAULT;

-- 4. TAMBAH UNIQUE CONSTRAINT (RECOMMENDED)
-- Pastikan nomor_antrian unique per hari untuk prevent duplicate
-- NOTE: Hati-hati jika sudah ada data, mungkin perlu cleanup dulu

-- Option A: Unique constraint sederhana (nomor antrian globally unique)
-- Gunakan ini jika nomor antrian harus unique selamanya, tidak reset per hari
CREATE UNIQUE INDEX IF NOT EXISTS idx_kunjungan_nomor_antrian 
ON kunjungan (nomor_antrian);

-- Option B: Unique constraint per hari (lebih flexible untuk reset harian)
-- Gunakan CAST untuk membuat function immutable
-- FIX: Ganti DATE(created_at) dengan cast yang immutable
CREATE UNIQUE INDEX IF NOT EXISTS idx_kunjungan_nomor_antrian_daily 
ON kunjungan (nomor_antrian, (created_at::date));

-- Option C: Jika option B masih error, gunakan expression index
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_kunjungan_nomor_antrian_daily 
-- ON kunjungan (nomor_antrian, date_trunc('day', created_at));

-- Option D: Paling simple - unique pada nomor_antrian saja (RECOMMENDED)
-- Karena backend sudah handle reset harian, tidak perlu constraint per hari
-- DROP INDEX IF EXISTS idx_kunjungan_nomor_antrian_daily;
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_kunjungan_nomor_antrian 
-- ON kunjungan (nomor_antrian);

-- 5. TAMBAH INDEX UNTUK PERFORMA
-- Index untuk query "cari kunjungan hari ini" lebih cepat
CREATE INDEX IF NOT EXISTS idx_kunjungan_created_at 
ON kunjungan (created_at DESC);

-- Index untuk query status check (public endpoint)
CREATE INDEX IF NOT EXISTS idx_kunjungan_nomor_created 
ON kunjungan (nomor_antrian, created_at);

-- Index untuk filter by date (untuk query hari ini)
CREATE INDEX IF NOT EXISTS idx_kunjungan_created_date 
ON kunjungan ((created_at::date));

-- 6. HAPUS TRIGGER AUTO-GENERATE (jika ada)
-- Ganti 'trigger_name' dengan nama trigger yang ditemukan di step 2
-- Contoh:
-- DROP TRIGGER IF EXISTS auto_generate_nomor_antrian ON kunjungan;
-- DROP FUNCTION IF EXISTS generate_nomor_antrian_func();

-- 7. CLEANUP DATA LAMA (OPTIONAL)
-- Jika ingin reset semua nomor antrian ke format baru
-- WARNING: Hati-hati, ini akan hapus semua kunjungan!
-- Uncomment jika yakin ingin reset

-- DELETE FROM kunjungan WHERE created_at < NOW() - INTERVAL '30 days';

-- 8. VERIFIKASI SETUP
-- Cek bahwa tidak ada lagi auto-generation
SELECT 
    column_name, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'kunjungan' 
AND column_name = 'nomor_antrian';

-- Hasil yang diharapkan:
-- column_name: nomor_antrian
-- column_default: NULL (tidak ada default value)

-- 9. TEST INSERT MANUAL
-- Test bahwa nomor_antrian bisa di-set manual dari backend
-- INSERT INTO kunjungan (
--     pasien_id, 
--     nomor_antrian, 
--     status_kunjungan, 
--     current_step
-- ) VALUES (
--     1, -- ganti dengan pasien_id yang valid
--     'TEST001',
--     'Aktif',
--     1
-- );

-- 10. CEK DATA TERAKHIR
-- Lihat 10 kunjungan terakhir dan nomor antrian
SELECT 
    id,
    nomor_antrian,
    status_kunjungan,
    created_at
FROM kunjungan 
ORDER BY created_at DESC 
LIMIT 10;

-- ============================================
-- MONITORING QUERIES
-- ============================================

-- Hitung jumlah kunjungan hari ini
SELECT COUNT(*) as total_hari_ini
FROM kunjungan 
WHERE created_at >= CURRENT_DATE;

-- Lihat distribusi nomor antrian hari ini
SELECT 
    nomor_antrian,
    created_at
FROM kunjungan 
WHERE created_at >= CURRENT_DATE
ORDER BY created_at;

-- Cek apakah ada duplicate nomor antrian
SELECT 
    nomor_antrian, 
    COUNT(*) as jumlah
FROM kunjungan
WHERE created_at >= CURRENT_DATE
GROUP BY nomor_antrian
HAVING COUNT(*) > 1;

-- Lihat nomor antrian terakhir yang di-generate
SELECT 
    nomor_antrian,
    created_at
FROM kunjungan 
WHERE created_at >= CURRENT_DATE
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- NOTES
-- ============================================
-- 1. Jalankan queries di atas satu per satu di Supabase SQL Editor
-- 2. Backup data sebelum menjalankan ALTER TABLE atau DROP commands
-- 3. Test di development environment dulu sebelum production
-- 4. Monitor logs backend setelah setup untuk memastikan tidak ada error
