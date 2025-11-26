// backend/seed.js

const supabase = require('./supabaseClient');

// --- DATA PASIEN PALSU ---
const DUMMY_PASIEN = [
  // 4 Pasien Asli Anda
  {
    nik: '3171010101900001',
    nama: 'Asep Sunandar',
    medrec: '190001',
    tempat_lahir: 'Bandung',
    tanggal_lahir: '1990-01-01',
    nama_wali: 'Siti Aminah (Istri)',
    telepon_wali: '081234567890',
  },
  {
    nik: '3171020202920002',
    nama: 'Budi Hartono',
    medrec: '292002',
    tempat_lahir: 'Surabaya',
    tanggal_lahir: '1992-02-02',
    nama_wali: 'Agus (Ayah)',
    telepon_wali: '081234567891',
  },
  {
    nik: '3171030303940003',
    nama: 'Citra Lestari',
    medrec: '394003',
    tempat_lahir: 'Medan',
    tanggal_lahir: '1994-03-03',
    nama_wali: 'Dewi (Ibu)',
    telepon_wali: '081234567892',
  },
  {
    nik: '3171040404960004',
    nama: 'Dewi Anggraini',
    medrec: '496004',
    tempat_lahir: 'Jakarta',
    tanggal_lahir: '1996-04-04',
    nama_wali: 'Eko (Suami)',
    telepon_wali: '081234567893',
  },
  // 🚀 6 PASIEN BARU
  {
    nik: '3171050505980005',
    nama: 'Eko Prasetyo',
    medrec: '598005',
    tempat_lahir: 'Yogyakarta',
    tanggal_lahir: '1998-05-05',
    nama_wali: 'Fajar (Kakak)',
    telepon_wali: '081234567894',
  },
  {
    nik: '3171060606000006',
    nama: 'Fajar Nugroho',
    medrec: '600006',
    tempat_lahir: 'Semarang',
    tanggal_lahir: '2000-06-06',
    nama_wali: 'Gita (Adik)',
    telepon_wali: '081234567895',
  },
  {
    nik: '3171070707020007',
    nama: 'Gita Permata',
    medrec: '702007',
    tempat_lahir: 'Makassar',
    tanggal_lahir: '2002-07-07',
    nama_wali: 'Hendra (Ayah)',
    telepon_wali: '081234567896',
  },
  {
    nik: '3171080808040008',
    nama: 'Hendra Wijaya',
    medrec: '804008',
    tempat_lahir: 'Palembang',
    tanggal_lahir: '2004-08-08',
    nama_wali: 'Indah (Istri)',
    telepon_wali: '081234567897',
  },
  {
    nik: '3171090909060009',
    nama: 'Indah Cahyani',
    medrec: '906009',
    tempat_lahir: 'Denpasar',
    tanggal_lahir: '2006-09-09',
    nama_wali: 'Joko (Suami)',
    telepon_wali: '081234567898',
  },
  {
    nik: '3171101010080010',
    nama: 'Joko Susilo',
    medrec: '008010',
    tempat_lahir: 'Manado',
    tanggal_lahir: '2008-10-10',
    nama_wali: 'Kurnia (Ibu)',
    telepon_wali: '081234567899',
  },
];

// Fungsi utama untuk menjalankan seed
async function runSeed() {
  console.log('🌱 Mulai proses seeding...');

  try {
    // --- LANGKAH 1: HAPUS DATA LAMA (OPSIONAL TAPI DISARANKAN) ---
    // Kita hapus data kunjungan dulu (karena punya foreign key)
    console.log('Menghapus data kunjungan lama...');
    await supabase.from('kunjungan').delete().neq('id', 0);
    // Hapus data pasien
    console.log('Menghapus data pasien lama...');
    await supabase.from('pasien').delete().neq('id', 0);
    
    // --- LANGKAH 2: MASUKKAN PASIEN BARU ---
    console.log('Memasukkan data pasien baru...');
    const { data: dataPasien, error: errorPasien } = await supabase
      .from('pasien')
      .insert(DUMMY_PASIEN)
      .select(); // Penting: .select() untuk mengambil data yang baru dibuat (terutama ID)

    if (errorPasien) {
      console.error('Gagal memasukkan data pasien:', errorPasien.message);
      return;
    }

    console.log(`✅ Berhasil memasukkan ${dataPasien.length} pasien.`);
    // console.log(dataPasien); // Uncomment untuk debug

    // --- LANGKAH 3: MASUKKAN KUNJUNGAN BARU ---
    // 4 Kunjungan Asli
    const DUMMY_KUNJUNGAN = [
      {
        pasien_id: dataPasien[0].id, // Asep
        keluhan_utama: 'Nyeri dada tembus ke punggung',
        triase: 'resusitasi',
        jenis_pasien: 'Non Bedah',
        current_step: 3,
        status_kunjungan: 'Aktif',
        dpjp: 'dr. Andika Setiawan, Sp.JP',
        gp: 'dr. Rina Amelia',
        perawat: 'Ns. Budi Hartono, S.Kep',
        step_timestamps: {
          "1": { "start": "2025-11-13T10:00:00Z", "end": "2025-11-13T10:05:00Z" },
          "2": { "start": "2025-11-13T10:05:00Z", "end": "2025-11-13T10:20:00Z" },
          "3": { "start": "2025-11-13T10:20:00Z", "end": null }
        }
      },
      {
        pasien_id: dataPasien[1].id, // Budi
        keluhan_utama: 'Patah tulang terbuka di kaki',
        triase: 'emergency',
        jenis_pasien: 'Bedah',
        current_step: 2,
        status_kunjungan: 'Aktif',
        gp: 'dr. M. Iqbal',
        perawat: 'Ns. Sinta Dewi, A.Md.Kep',
        step_timestamps: {
          "1": { "start": "2025-11-13T11:00:00Z", "end": "2025-11-13T11:10:00Z" },
          "2": { "start": "2025-11-13T11:10:00Z", "end": null }
        }
      },
      {
        pasien_id: dataPasien[2].id, // Citra
        keluhan_utama: 'Demam 3 hari',
        triase: 'semi',
        jenis_pasien: 'Anak',
        current_step: 5,
        status_kunjungan: 'Selesai',
        keputusan_akhir: 'rawat_jalan',
        gp: 'dr. Felicia Tan',
        perawat: 'Ns. Agus Salim, S.Kep',
        step_timestamps: {
          "1": { "start": "2025-11-13T09:00:00Z", "end": "2025-11-13T09:05:00Z" },
          "2": { "start": "2025-11-13T09:05:00Z", "end": "2025-11-13T09:25:00Z" },
          "3": { "start": "2025-11-13T09:25:00Z", "end": "2025-11-13T09:30:00Z" },
          "4": { "start": "2025-11-13T09:30:00Z", "end": "2025-11-13T09:40:00Z" },
          "5": { "start": "2025-11-13T09:40:00Z", "end": "2025-11-13T09:45:00Z" }
        }
      },
      {
        pasien_id: dataPasien[3].id, // Dewi
        keluhan_utama: 'Kontraksi hebat, pendarahan',
        triase: 'resusitasi',
        jenis_pasien: 'Kebidanan',
        current_step: 6,
        status_kunjungan: 'Selesai',
        keputusan_akhir: 'rawat',
        dpjp: 'dr. Budi Rahardjo, Sp.B',
        disposisi_ruangan: 'Ruang Rawat Mawar (Kelas 1)',
        gp: 'dr. Rina Amelia',
        perawat: 'Ns. Sinta Dewi, A.Md.Kep',
        step_timestamps: {
          "1": { "start": "2025-11-13T12:00:00Z", "end": "2025-11-13T12:02:00Z" },
          "2": { "start": "2025-11-13T12:02:00Z", "end": "2025-11-13T12:15:00Z" },
          "3": { "start": "2025-11-13T12:15:00Z", "end": "2025-11-13T12:30:00Z" },
          "4": { "start": "2025-11-13T12:30:00Z", "end": "2025-11-13T12:45:00Z" },
          "5": { "start": "2025-11-13T12:45:00Z", "end": "2025-11-13T12:50:00Z" },
          "6": { "start": "2025-11-13T12:50:00Z", "end": "2025-11-13T12:55:00Z" }
        }
      },
      
      // 🚀 6 KUNJUNGAN BARU
      {
        pasien_id: dataPasien[4].id, // Eko
        keluhan_utama: 'Sakit kepala berat, mual',
        triase: 'emergency',
        jenis_pasien: 'Non Bedah',
        current_step: 4,
        status_kunjungan: 'Aktif',
        gp: 'dr. M. Iqbal',
        perawat: 'Ns. Agus Salim, S.Kep',
        step_timestamps: {
          "1": { "start": "2025-11-13T13:00:00Z", "end": "2025-11-13T13:05:00Z" },
          "2": { "start": "2025-11-13T13:05:00Z", "end": "2025-11-13T13:20:00Z" },
          "3": { "start": "2025-11-13T13:20:00Z", "end": "2025-11-13T13:40:00Z" },
          "4": { "start": "2025-11-13T13:40:00Z", "end": null }
        }
      },
      {
        pasien_id: dataPasien[5].id, // Fajar
        keluhan_utama: 'Luka bakar di tangan',
        triase: 'semi',
        jenis_pasien: 'Bedah',
        current_step: 5,
        status_kunjungan: 'Selesai',
        keputusan_akhir: 'rawat_jalan',
        gp: 'dr. Felicia Tan',
        perawat: 'Ns. Budi Hartono, S.Kep',
        step_timestamps: {
          "1": { "start": "2025-11-13T14:00:00Z", "end": "2025-11-13T14:05:0Z" },
          "2": { "start": "2025-11-13T14:05:00Z", "end": "2025-11-13T14:15:00Z" },
          "3": { "start": "2025-11-13T14:15:00Z", "end": "2025-11-13T14:20:00Z" },
          "4": { "start": "2025-11-13T14:20:00Z", "end": "2025-11-13T14:30:00Z" },
          "5": { "start": "2025-11-13T14:30:00Z", "end": "2025-11-13T14:35:00Z" }
        }
      },
      {
        pasien_id: dataPasien[6].id, // Gita
        keluhan_utama: 'Muntah terus menerus',
        triase: 'semi',
        jenis_pasien: 'Anak',
        current_step: 1,
        status_kunjungan: 'Aktif',
        perawat: 'Ns. Sinta Dewi, A.Md.Kep',
        step_timestamps: {
          "1": { "start": "2025-11-13T15:00:00Z", "end": null }
        }
      },
      {
        pasien_id: dataPasien[7].id, // Hendra
        keluhan_utama: 'Kecelakaan lalu lintas, tidak sadar',
        triase: 'resusitasi',
        jenis_pasien: 'Bedah',
        current_step: 5,
        status_kunjungan: 'Selesai',
        keputusan_akhir: 'meninggal',
        gp: 'dr. Rina Amelia',
        perawat: 'Ns. Agus Salim, S.Kep',
        step_timestamps: {
          "1": { "start": "2025-11-13T16:00:00Z", "end": "2025-11-13T16:02:00Z" },
          "2": { "start": "2025-11-13T16:02:00Z", "end": "2025-11-13T16:10:00Z" },
          "3": { "start": "2025-11-13T16:10:00Z", "end": "2025-11-13T16:20:00Z" },
          "4": { "start": "2025-11-13T16:20:00Z", "end": "2025-11-13T16:30:00Z" },
          "5": { "start": "2025-11-13T16:30:00Z", "end": "2025-11-13T16:32:00Z" }
        }
      },
      {
        pasien_id: dataPasien[8].id, // Indah
        keluhan_utama: 'Sulit bernapas',
        triase: 'emergency',
        jenis_pasien: 'Non Bedah',
        current_step: 3,
        status_kunjungan: 'Aktif',
        gp: 'dr. M. Iqbal',
        perawat: 'Ns. Budi Hartono, S.Kep',
        step_timestamps: {
          "1": { "start": "2025-11-13T17:00:00Z", "end": "2025-11-13T17:05:00Z" },
          "2": { "start": "2025-11-13T17:05:00Z", "end": "2025-11-13T17:15:00Z" },
          "3": { "start": "2025-11-13T17:15:00Z", "end": null }
        }
      },
      {
        pasien_id: dataPasien[9].id, // Joko
        keluhan_utama: 'Demam tinggi dan kejang',
        triase: 'emergency',
        jenis_pasien: 'Anak',
        current_step: 6,
        status_kunjungan: 'Selesai',
        keputusan_akhir: 'rawat',
        dpjp: 'dr. Citra Lestari, Sp.A',
        disposisi_ruangan: 'Ruang Rawat Melati (Kelas 2)',
        gp: 'dr. Felicia Tan',
        perawat: 'Ns. Sinta Dewi, A.Md.Kep',
        step_timestamps: {
          "1": { "start": "2025-11-13T18:00:00Z", "end": "2025-11-13T18:05:00Z" },
          "2": { "start": "2025-11-13T18:05:00Z", "end": "2025-11-13T18:20:00Z" },
          "3": { "start": "2025-11-13T18:20:00Z", "end": "2025-11-13T18:40:00Z" },
          "4": { "start": "2025-11-13T18:40:00Z", "end": "2025-11-13T18:50:00Z" },
          "5": { "start": "2025-11-13T18:50:00Z", "end": "2025-11-13T18:55:00Z" },
          "6": { "start": "2025-11-13T18:55:00Z", "end": "2025-11-13T19:00:00Z" }
        }
      },
    ];

    console.log('Memasukkan data kunjungan baru...');
    const { data: dataKunjungan, error: errorKunjungan } = await supabase
      .from('kunjungan')
      .insert(DUMMY_KUNJUNGAN);

    if (errorKunjungan) {
      console.error('Gagal memasukkan data kunjungan:', errorKunjungan.message);
      return;
    }

    console.log(`✅ Berhasil memasukkan ${DUMMY_KUNJUNGAN.length} kunjungan.`);
    console.log('Database seeding selesai! 🚀');

  } catch (error) {
    console.error('Terjadi error saat seeding:', error.message);
  }
}

// Jalankan fungsi
runSeed();