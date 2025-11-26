## Uji Coba & Review Pemisahan Dashboard Unit

1. UI dashboard sudah menampilkan selector unit Padma (ungu) dan Kamala (merah muda) di baris paling atas.
2. Tombol Input Pasien Baru sudah sejajar dengan selector unit.
3. Tab Pasien Aktif dan Pasien Selesai Hari Ini tampil di bawah selector unit.
4. Data pasien otomatis terfilter sesuai unit yang dipilih:
   - Padma: hanya pasien dengan penjamin "Umum" dan "Asuransi Lainnya".
   - Kamala: hanya pasien dengan penjamin "JKN".
5. Perubahan unit/tab langsung mengubah data pasien yang tampil.
6. UI responsif, tidak ditemukan error/bug pada filter dan interaksi.
7. Kode filter dan layout sudah sesuai rencana dan hierarki yang diinginkan.

Catatan: Implementasi role & unit pada user di frontend akan dilakukan pada tahap berikutnya.

## [25 Nov 2025] Dokumentasi Perubahan: Penambahan Badge Jenis Pasien & Penjamin

- Menambahkan badge jenis pasien di header modal detail pasien selesai.
- Menambahkan badge penjamin di bawah badge jenis pasien, label mengikuti field asli (misal: "Umum", "BPJS", dll).
- Warna badge penjamin mengikuti warna tombol unit Padma (biru) dan Kamala (hijau).
- Tulisan pada badge jenis pasien dan penjamin dibuat centered.
- Modal dilebarkan agar tampilan badge tetap rapi.
- Validasi tampilan dan posisi badge sesuai permintaan user.

Perubahan ini bertujuan agar identitas pasien dan penjamin lebih jelas, serta konsisten secara visual dengan unit dan filter dashboard.

## [25 Nov 2025] Dokumentasi Perubahan: Fitur Hapus Pasien

- Menambahkan tombol "Hapus" di header DetailPasienSlideIn.jsx dengan padding merah, di sebelah icon "X".
- Menambahkan modal konfirmasi hapus pasien dengan textarea untuk input alasan penghapusan.
- Setelah konfirmasi, pasien dipindahkan ke tab "Pasien Selesai Hari Ini" dengan status selesai dan keputusan_akhir "dihapus".
- Efek penghapusan sama seperti penyelesaian pasien pada langkah 5 dan 6 (timestamp diperbarui, status_kunjungan menjadi "Selesai").
- Menambahkan box khusus untuk menampilkan alasan penghapusan pada modal rekap pasien selesai (background merah).
- Menambahkan logika status info untuk pasien yang dihapus pada tabel pasien selesai (badge "Dihapus" dengan warna merah).

## [25 Nov 2025] Dokumentasi Perubahan: Notifikasi Custom Hapus Pasien

- Alert browser pada workflow hapus pasien diganti dengan notifikasi custom (event "show-toast") untuk pengalaman pengguna yang lebih baik.
- Notifikasi sukses dan error kini muncul sebagai toast, bukan alert bawaan browser.
- Tidak ada lagi popup browser setelah konfirmasi hapus, hanya modal dan toast.

Perubahan ini memastikan workflow hapus pasien lebih profesional dan tidak mengganggu user experience.

Perubahan ini memungkinkan admin untuk menghapus pasien dengan alasan yang jelas, dan pasien yang dihapus tetap tercatat di riwayat pasien selesai.

## [25 Nov 2025] Dokumentasi Perubahan: Rencana Modal Konfirmasi Pasien Terhapus

- Akan dibuat modal konfirmasi custom setelah pasien berhasil dihapus, mirip dengan modal "Kunjungan Tersimpan" (lihat gambar referensi).
- Modal akan menampilkan ikon centang hijau, judul "Pasien Berhasil Dihapus!", dan deskripsi singkat bahwa data pasien telah dipindahkan ke tab Pasien Selesai.
- Tombol "Oke" berwarna hijau untuk menutup modal.
- Modal ini menggantikan notifikasi toast pada workflow hapus pasien agar lebih konsisten dan informatif.

Perubahan ini bertujuan meningkatkan kejelasan dan user experience setelah aksi hapus pasien.

## [25 Nov 2025] Dokumentasi Perubahan: Dashboard Khusus Unit Padma & Kamala

- Membuat file DashboardPadma.jsx dan DashboardKamala.jsx.
- Menambahkan prop hideUnitTabs pada DashboardAdmin agar selector unit tidak tampil di dashboard khusus.
- Menambah routing baru di AdminRoutes.jsx untuk /admin/dashboard-padma dan /admin/dashboard-kamala.
- Setiap dashboard hanya menampilkan data sesuai unit tanpa tab selector.
- Tidak ditemukan error setelah perubahan.

## [26 Nov 2025] Dokumentasi Fitur Daftar Akun Baru Admin

- Analisis kebutuhan dan struktur data user (role, unit) sudah dilakukan.
- UI form tambah akun di pengaturan admin sudah dibuat, dengan input email, nama lengkap, id pegawai, jabatan, password, dan role.
- Validasi form: semua field wajib diisi, email valid, password minimal 6 karakter.
- Integrasi backend: endpoint POST /api/v2/admin/create-account menerima data dan menyimpan ke Supabase Auth serta tabel admin_users.
- Role yang didukung: admin, perawat kamala, perawat padma.
- Field unit dihapus sementara, fokus ke pendaftaran admin dan perawat.
- Uji coba pendaftaran admin berhasil, data user masuk ke database dan Auth, error 500 sudah teratasi.
- Logging backend ditambah untuk debugging dan monitoring proses pendaftaran.
- Semua langkah pada todo.md sudah diceklis dan fitur siap digunakan.


## [26 Nov 2025] Dokumentasi Fitur Export CSV Rekap Pasien Selesai

- Menambahkan tombol "Export CSV" di sebelah filter tanggal pada halaman Pasien Selesai.
- Input tanggal menggunakan format DD/MM/YYYY (bukan native date input), dengan auto-format dan validasi.
- Filter tanggal membatasi rentang maksimal 7 hari, jika lebih akan muncul notifikasi toast error.
- Data yang diexport ke CSV mengikuti filter nama dan tanggal yang aktif di UI.
- Format tanggal pada kolom CSV: DD/MM/YYYY HH:mm, sesuai permintaan user.
- Kolom CSV meliputi: Nomor Antrian, Nama Pasien, Tanggal Masuk, Waktu Selesai, Total Durasi, Jenis Pasien, Penjamin, ESI Level, Durasi Tahap 1-6, Status Akhir, Disposisi Ruangan, Alasan Hapus.
- Proses export menggunakan library papaparse, file CSV otomatis diunduh dengan nama "Rekap_Pasien_Selesai_<tanggal>.csv".
- Notifikasi toast muncul jika export berhasil atau gagal (tidak ada data).
- Semua logika dan helper terkait export CSV, filter, dan format tanggal sudah diuji dan berjalan sesuai kebutuhan.

Catatan: Fitur ini memudahkan admin untuk mengambil rekap pasien selesai secara cepat, akurat, dan sesuai format rumah sakit Hermina.
