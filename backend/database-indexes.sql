-- ========================================
-- INDEXING SCRIPT FOR KUNJUNGAN & PASIEN
-- Optimasi untuk query pasien aktif dan selesai
-- ========================================

-- 1. Index untuk filter status_kunjungan (paling sering digunakan)
CREATE INDEX IF NOT EXISTS idx_kunjungan_status 
ON kunjungan(status_kunjungan);

-- 2. Index untuk sorting by created_at (semua query sort by created_at DESC)
CREATE INDEX IF NOT EXISTS idx_kunjungan_created_at 
ON kunjungan(created_at DESC);

-- 3. Composite index untuk query utama: filter status + sort by created_at
-- Ini adalah index PALING PENTING untuk performa
CREATE INDEX IF NOT EXISTS idx_kunjungan_status_created 
ON kunjungan(status_kunjungan, created_at DESC);

-- 4. Index untuk filter keputusan_akhir
CREATE INDEX IF NOT EXISTS idx_kunjungan_keputusan 
ON kunjungan(keputusan_akhir);

-- 5. Composite index untuk kombinasi filter: status + keputusan + sort
-- Untuk query dengan kedua filter sekaligus
CREATE INDEX IF NOT EXISTS idx_kunjungan_status_keputusan_created 
ON kunjungan(status_kunjungan, keputusan_akhir, created_at DESC);

-- 6. Index untuk join dengan tabel pasien
-- Pastikan foreign key terindex
CREATE INDEX IF NOT EXISTS idx_kunjungan_pasien_id 
ON kunjungan(pasien_id);

-- 7. Index untuk date range filtering (removed - NOW() is not IMMUTABLE)
-- Note: Full index on created_at already exists, sufficient for date range queries

-- 8. Composite partial index untuk pasien aktif (query paling sering)
CREATE INDEX IF NOT EXISTS idx_kunjungan_aktif_created 
ON kunjungan(created_at DESC)
WHERE status_kunjungan = 'Aktif';

-- 9. Composite partial index untuk pasien selesai
CREATE INDEX IF NOT EXISTS idx_kunjungan_selesai_created 
ON kunjungan(created_at DESC)
WHERE status_kunjungan = 'Selesai';

-- ========================================
-- INDEXES UNTUK TABEL PASIEN
-- ========================================

-- 10. Index untuk search by nama (ILIKE pattern matching)
-- Menggunakan pg_trgm extension untuk fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index trigram untuk ILIKE search pada nama
CREATE INDEX IF NOT EXISTS idx_pasien_nama_trgm 
ON pasien USING gin (nama gin_trgm_ops);

-- 11. Index biasa untuk nama (untuk exact match atau prefix search)
CREATE INDEX IF NOT EXISTS idx_pasien_nama 
ON pasien(nama);

-- 12. Index untuk medrec (jika belum ada dari unique constraint)
CREATE INDEX IF NOT EXISTS idx_pasien_medrec 
ON pasien(medrec);

-- ========================================
-- INDEXES UNTUK QUERY KOMBINASI ADVANCED
-- ========================================

-- 13. Index untuk nomor_antrian (untuk public status tracking)
CREATE INDEX IF NOT EXISTS idx_kunjungan_nomor_antrian 
ON kunjungan(nomor_antrian);

-- 14. Index untuk tracking kunjungan berdasarkan unit
CREATE INDEX IF NOT EXISTS idx_kunjungan_unit 
ON kunjungan(unit) WHERE unit IS NOT NULL;

-- 15. Index untuk tracking bed assignment
CREATE INDEX IF NOT EXISTS idx_kunjungan_bed_number 
ON kunjungan(bed_number) WHERE bed_number IS NOT NULL;

-- ========================================
-- ANALYZE UNTUK UPDATE STATISTIK
-- ========================================

-- Update table statistics untuk query planner
ANALYZE kunjungan;
ANALYZE pasien;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check existing indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('kunjungan', 'pasien')
ORDER BY tablename, indexname;

-- Check index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename IN ('kunjungan', 'pasien')
ORDER BY idx_scan DESC;

-- ========================================
-- PERFORMANCE NOTES
-- ========================================

/*
PRIORITAS INDEX (berdasarkan query pattern):

HIGH PRIORITY (wajib):
- idx_kunjungan_status_created: Untuk semua query pasien aktif/selesai dengan pagination
- idx_kunjungan_pasien_id: Untuk join dengan tabel pasien
- idx_pasien_nama_trgm: Untuk search by nama

MEDIUM PRIORITY (recommended):
- idx_kunjungan_status_keputusan_created: Untuk filter kombinasi
- idx_kunjungan_aktif_created: Partial index untuk query pasien aktif
- idx_kunjungan_selesai_created: Partial index untuk query pasien selesai

LOW PRIORITY (optional):
- idx_kunjungan_unit: Jika sering filter by unit
- idx_kunjungan_bed_number: Jika sering filter by bed

MAINTENANCE:
- Jalankan VACUUM ANALYZE secara berkala
- Monitor index bloat dengan pg_stat_user_indexes
- Drop unused indexes jika idx_scan = 0 setelah beberapa waktu

EXPECTED PERFORMANCE IMPROVEMENT:
- Query pasien aktif: 50-80% faster
- Query pasien selesai: 50-80% faster  
- Search by nama: 70-90% faster
- Date range queries: 40-60% faster
*/
