// server.js

const express = require('express');
const cors = require('cors');
const Hashids = require('hashids/cjs');
const app = express();

// Environment variables
const port = process.env.PORT || 3001;
const webhookUrl = process.env.WEBHOOK_URL || '';
const isProduction = process.env.NODE_ENV === 'production';

// Hashids configuration for secure nomor antrian
const SECRET_KEY = process.env.HASHIDS_SECRET || 'hermina-pasteur-igd-2025-secure-key';
const hashids = new Hashids(SECRET_KEY, 10); // minimum length 10 characters

const supabase = require('./supabaseClient');

// Allow multiple origins (development + production)
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:5173',
  'http://localhost:5174',  // Vite fallback port
  'http://localhost:5173',  // Development
  'http://34.123.111.227',  // Production IP
  'https://yourdomain.com'  // Production domain (jika ada)
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || isProduction) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Helper function to log only in development
const devLog = (...args) => {
  if (!isProduction) {
    console.log(...args);
  }
};

// Helper: Ekstrak inisial dari nama
function getInitials(nama) {
  if (!nama) return 'XX';
  
  // Split nama berdasarkan spasi dan ambil huruf pertama setiap kata
  const words = nama.trim().split(/\s+/);
  let initials = '';
  
  // Ambil maksimal 3 huruf pertama dari setiap kata
  for (let i = 0; i < Math.min(words.length, 3); i++) {
    if (words[i].length > 0) {
      initials += words[i][0].toUpperCase();
    }
  }
  
  // Jika hanya 1 huruf, tambahkan huruf kedua dari kata pertama
  if (initials.length === 1 && words[0].length > 1) {
    initials += words[0][1].toUpperCase();
  }
  
  // Fallback jika tidak ada inisial valid
  return initials || 'XX';
}

// Helper: Generate nomor kunjungan harian (Inisial + 3-4 digit urutan)
async function generateNomorKunjungan(namaPasien, retryCount = 0) {
  const MAX_RETRIES = 5;
  
  try {
    // Ambil inisial dari nama
    const inisial = getInitials(namaPasien);
    
    // Hitung jumlah kunjungan hari ini (sejak jam 00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    
    // Query dengan pessimistic locking approach:
    // Dapatkan nomor antrian terakhir hari ini untuk memastikan uniqueness
    const { data: lastKunjungan, error: queryError } = await supabase
      .from('kunjungan')
      .select('nomor_antrian')
      .gte('created_at', todayISO)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (queryError) {
      console.error('Error querying last kunjungan:', queryError);
      // Fallback ke timestamp-based untuk uniqueness
      const timestamp = Date.now() % 10000;
      return `${inisial}${String(timestamp).padStart(4, '0')}`;
    }
    
    // Hitung urutan berikutnya
    let urutan = 1;
    
    if (lastKunjungan && lastKunjungan.length > 0) {
      const lastNomor = lastKunjungan[0].nomor_antrian;
      // Extract angka dari nomor antrian terakhir (contoh: MR075 -> 75)
      const match = lastNomor.match(/\d+$/);
      if (match) {
        urutan = parseInt(match[0], 10) + 1;
      }
    }
    
    // Handle overflow (> 999): gunakan 4 digit
    let nomorKunjungan;
    if (urutan > 999) {
      if (urutan > 9999) {
        // Extreme case: lebih dari 9999 pasien/hari
        console.error(`⚠️ CRITICAL: Urutan melebihi 9999 (${urutan}) - menggunakan timestamp`);
        const timestamp = Date.now() % 100000;
        nomorKunjungan = `${inisial}${String(timestamp).padStart(5, '0')}`;
      } else {
        // 1000-9999: gunakan 4 digit
        console.warn(`⚠️ Warning: Urutan melebihi 999 (${urutan}) - menggunakan 4 digit`);
        nomorKunjungan = `${inisial}${String(urutan).padStart(4, '0')}`;
      }
    } else {
      // Normal case: 1-999, gunakan 3 digit
      nomorKunjungan = `${inisial}${String(urutan).padStart(3, '0')}`;
    }
    
    devLog(`Generated nomor kunjungan: ${nomorKunjungan} (${namaPasien} - urutan ${urutan})`);
    
    return nomorKunjungan;
  } catch (error) {
    console.error('Error generating nomor kunjungan:', error);
    
    // Retry dengan exponential backoff untuk handle concurrent requests
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 100; // 100ms, 200ms, 400ms, 800ms, 1600ms
      devLog(`Retrying generate nomor kunjungan (attempt ${retryCount + 1}/${MAX_RETRIES}) after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateNomorKunjungan(namaPasien, retryCount + 1);
    }
    
    // Final fallback setelah semua retry gagal: gunakan timestamp untuk uniqueness
    console.error('⚠️ All retries failed, using timestamp-based fallback');
    const inisial = getInitials(namaPasien);
    const timestamp = Date.now() % 10000;
    return `${inisial}${String(timestamp).padStart(4, '0')}`;
  }
}

// Helper: Normalisasi step_timestamps dari format lama ke baru
function normalizeStepTimestamps(stepTimestamps) {
  if (!stepTimestamps || typeof stepTimestamps !== 'object') {
    return {};
  }

  const normalized = {};
  
  for (let i = 1; i <= 6; i++) {
    const oldKey = String(i);
    const newKey = `tahap_${i}`;
    
    // Sudah format baru
    if (stepTimestamps[newKey]) {
      normalized[newKey] = stepTimestamps[newKey];
    }
    // Konversi dari format lama
    else if (stepTimestamps[oldKey]) {
      const oldData = stepTimestamps[oldKey];
      normalized[newKey] = {
        start_time: oldData.start,
        end_time: oldData.end !== undefined ? oldData.end : null,
        status: oldData.end ? 'completed' : 'in_progress'
      };
    }
  }
  
  return normalized;
}

app.get('/api/v2/pasien/cari', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      error: 'Harap berikan query parameter ?q=...'
    });
  }

  const { data, error } = await supabase
    .from('pasien')
    .select('*')
    .eq('medrec', q)
    .single();

  if (error) {
    console.error('Error mencari pasien:', error.message);
    return res.status(404).json({ error: 'Pasien tidak ditemukan' });
  }

  res.json(data);
});

app.get('/api/v2/pasien/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('pasien')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error mengambil data pasien tunggal:', error.message);
    return res.status(404).json({ error: 'Data pasien tidak ditemukan' });
  }
  res.json(data);
});

app.get('/api/v2/kunjungan', async (req, res) => {
  const { data, error } = await supabase
    .from('kunjungan')
    .select(`
      *,
      pasien (
        *
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error mengambil data V2:', error);
    return res.status(500).json({ error: error.message });
  }

  // Flatten data untuk setiap kunjungan
  const flattenedData = data.map(item => ({
    ...item,
    step_timestamps: normalizeStepTimestamps(item.step_timestamps),
    nama: item.pasien?.nama,
    medrec: item.pasien?.medrec,
    nama_wali: item.pasien?.nama_wali,
    hubungan_wali: item.pasien?.hubungan_wali,
    telepon_wali: item.pasien?.telepon_wali,
  }));

  res.json(flattenedData);
});

app.get('/api/v2/kunjungan/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('kunjungan')
    .select(`
      *,
      pasien (
        *
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error mengambil data kunjungan tunggal V2:', error.message);
    return res.status(404).json({ error: 'Data kunjungan tidak ditemukan' });
  }

  // Flatten data untuk kemudahan frontend
  const flattenedData = {
    ...dataKunjungan,
    step_timestamps: normalizeStepTimestamps(dataKunjungan.step_timestamps),
    nama: dataKunjungan.pasien?.nama,
    medrec: dataKunjungan.pasien?.medrec,
    nama_wali: dataKunjungan.pasien?.nama_wali,
    hubungan_wali: dataKunjungan.pasien?.hubungan_wali,
    telepon_wali: data.pasien?.telepon_wali,
  };

  res.json(flattenedData);
});

app.patch('/api/v2/kunjungan/:id', async (req, res) => {
  const { id } = req.params;
  
  const { 
    status_kunjungan, 
    dpjp, 
    gp, 
    perawat, 
    current_step,
    keluhan_utama,
    tanda_vital,
    triase,
    riwayat_alergi,
    asesmen,
    pemeriksaan_penunjang,
    resep,
    tindakan_keperawatan,
    keputusan_akhir,
    disposisi_ruangan,
    step_timestamps,
    alasan_hapus,
    alasan_rujuk
  } = req.body;

  const updateData = {};
  
  if (status_kunjungan !== undefined) updateData.status_kunjungan = status_kunjungan;
  if (dpjp !== undefined) updateData.dpjp = dpjp;
  if (gp !== undefined) updateData.gp = gp;
  if (perawat !== undefined) updateData.perawat = perawat;
  if (current_step !== undefined) updateData.current_step = current_step;
  
  if (keluhan_utama !== undefined) updateData.keluhan_utama = keluhan_utama;
  if (tanda_vital !== undefined) updateData.tanda_vital = tanda_vital;
  if (triase !== undefined) updateData.triase = triase;
  if (riwayat_alergi !== undefined) updateData.riwayat_alergi = riwayat_alergi;
  if (asesmen !== undefined) updateData.asesmen = asesmen;
  if (pemeriksaan_penunjang !== undefined) updateData.pemeriksaan_penunjang = pemeriksaan_penunjang;
  if (resep !== undefined) updateData.resep = resep;
  if (tindakan_keperawatan !== undefined) updateData.tindakan_keperawatan = tindakan_keperawatan;
  if (keputusan_akhir !== undefined) updateData.keputusan_akhir = keputusan_akhir;
  if (disposisi_ruangan !== undefined) updateData.disposisi_ruangan = disposisi_ruangan;
  if (step_timestamps !== undefined) updateData.step_timestamps = step_timestamps;
  if (alasan_hapus !== undefined) updateData.alasan_hapus = alasan_hapus;
  if (alasan_rujuk !== undefined) updateData.alasan_rujuk = alasan_rujuk;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'Tidak ada data untuk di-update.' });
  }

  const { data, error } = await supabase
      .from('kunjungan')
      .update(updateData)
      .eq('id', id)
      .select('*, pasien(*)') // <-- INI PERBAIKANNYA
      .single();

  if (error) {
    console.error('Error mengupdate data kunjungan:', error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

app.delete('/api/v2/kunjungan/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('kunjungan')
    .delete()
    .eq('id', id)
    .select('*, pasien(*)')
    .single();

  if (error) {
    console.error('Error menghapus data kunjungan:', error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json(data); 
});


app.post('/api/v2/kunjungan', async (req, res) => {  
  const {
    nama,
    umur,
    jenisKelamin,
    namaWali,
    hubunganWali,
    teleponWali,
    jenisPasien,
    penjamin,
    nomorAsuransi,
    keluhanUtama,
  } = req.body;

  if (!nama || !namaWali || !teleponWali) {
    return res.status(400).json({ error: 'Nama, Nama Wali, dan Telepon Wali wajib diisi.' });
  }
  
  // Retry logic untuk handle concurrent requests
  const MAX_INSERT_RETRIES = 3;
  let insertAttempt = 0;
  let kunjunganInserted = false;
  let dataKunjungan = null;
  
  try {
    const medrec = Math.floor(10000000 + Math.random() * 90000000).toString();
    const pasienData = {
      nama: nama,
      medrec: medrec,
      umur: umur || null,
      jenis_kelamin: jenisKelamin || null,
      nama_wali: namaWali,
      hubungan_wali: hubunganWali,
      telepon_wali: teleponWali
    };
    
    const { data: dataPasien, error: errorPasien } = await supabase
    .from('pasien')
    .upsert(pasienData, { 
      onConflict: 'medrec'
    })
    .select()
    .single();
    
    if (errorPasien) {
      console.error('Error saat upsert pasien:', errorPasien);
      throw new Error(errorPasien.message);
    }
    
    const pasienId = dataPasien.id;
    
    const inisialStepTimestamps = {
      tahap_1: {
        start_time: new Date().toISOString(),
        end_time: null,
        status: 'in_progress'
      }
    };
    
    // Retry loop untuk handle duplicate nomor_antrian (concurrent requests)
    while (insertAttempt < MAX_INSERT_RETRIES && !kunjunganInserted) {
      insertAttempt++;
      
      // Generate nomor kunjungan SEBELUM insert (format: InisialXXX)
      const nomorKunjungan = await generateNomorKunjungan(nama);
      
      const kunjunganData = {
        pasien_id: pasienId,
        nomor_antrian: nomorKunjungan,
        jenis_pasien: jenisPasien,
        penjamin: penjamin,
        nomor_asuransi: nomorAsuransi,
        keluhan_utama: keluhanUtama || null,
        status_kunjungan: 'Aktif',
        current_step: 1,
        step_timestamps: inisialStepTimestamps
      };
      
      const { data: insertedData, error: errorKunjungan } = await supabase
        .from('kunjungan')
        .insert(kunjunganData)
        .select()
        .single();
      
      if (errorKunjungan) {
        // Check jika error adalah duplicate key
        if (errorKunjungan.code === '23505' || errorKunjungan.message?.includes('duplicate')) {
          console.warn(`⚠️ Duplicate nomor antrian detected (${nomorKunjungan}), retrying... (attempt ${insertAttempt}/${MAX_INSERT_RETRIES})`);
          
          if (insertAttempt >= MAX_INSERT_RETRIES) {
            throw new Error('Gagal membuat kunjungan setelah beberapa percobaan. Silakan coba lagi.');
          }
          
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 100 * insertAttempt));
          continue; // Retry dengan nomor baru
        } else {
          // Error lain, tidak perlu retry
          console.error('Error saat insert kunjungan:', errorKunjungan);
          throw new Error(errorKunjungan.message);
        }
      }
      
      // Insert berhasil
      dataKunjungan = insertedData;
      kunjunganInserted = true;
      
      // WORKAROUND: Jika database punya trigger yang override nomor_antrian,
      // kita update lagi setelah insert untuk memastikan nilai kita yang dipakai
      if (dataKunjungan.nomor_antrian !== nomorKunjungan) {
        devLog(`⚠️ Nomor antrian di-override oleh database (${dataKunjungan.nomor_antrian} -> ${nomorKunjungan}), melakukan update...`);
        
        const { data: updatedKunjungan, error: updateError } = await supabase
          .from('kunjungan')
          .update({ nomor_antrian: nomorKunjungan })
          .eq('id', dataKunjungan.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('⚠️ Warning: Gagal update nomor antrian:', updateError.message);
        } else {
          Object.assign(dataKunjungan, updatedKunjungan);
          devLog(`✅ Berhasil update nomor antrian ke: ${nomorKunjungan}`);
        }
      }
    }
    
    // Kirim webhook jika sudah berhasil insert
    try {
      if (webhookUrl && dataKunjungan) {
        const webhookBody = {
          nama_pasien: nama,
          nomor_wali: teleponWali,
          kode_pasien: medrec, 
          nomor_antrian: dataKunjungan.nomor_antrian
        };
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookBody)
        }).catch(webhookError => {
          console.error('Error saat mencoba memanggil webhook:', webhookError.message);
        });
      }
    } catch (webhookError) {
      console.error('Error persiapan webhook (sinkron):', webhookError.message);
    }
    
    res.status(201).json({
      pasien: dataPasien,
      kunjungan: dataKunjungan
    });

  } catch (error) {
    console.error('Error pada proses kunjungan V2:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/perawat', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('perawat')
      .select('nama, id_pegawai')
      .order('nama', { ascending: true });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching perawat:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// V2 Endpoints untuk Pengaturan Petugas Jaga
app.get('/api/v2/perawat', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('perawat')
      .select('id_pegawai, nama, peran')
      .order('nama', { ascending: true });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching perawat v2:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dokter_gp', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dokter_gp')
      .select('nama, examiner_key')
      .order('nama', { ascending: true });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching dokter_gp:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v2/dokter-gp', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dokter_gp')
      .select('examiner_key, doctor_code, nama')
      .order('nama', { ascending: true });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching dokter_gp v2:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dokter_dpjp', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dokter_dpjp')
      .select('id, nama, spesialisasi')
      .order('nama', { ascending: true });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching dokter_dpjp:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v2/dokter-dpjp', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dokter_dpjp')
      .select('id, nama, gender, spesialisasi')
      .order('nama', { ascending: true });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching dokter_dpjp v2:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v2/ruangan', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ruangan')
      .select('*')
      .order('nama_ruangan', { ascending: true });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching ruangan:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk settings
app.get('/api/v2/settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    // Jika tidak ada data, return default settings
    if (!data) {
      const defaultSettings = {
        esi_kuning_jam: 0,
        esi_kuning_menit: 30,
        esi_merah_jam: 1,
        esi_merah_menit: 0,
        batas_waktu_tahap: {
          tahap1: 15,
          tahap2: 30,
          tahap3: 45,
          tahap4: 30,
          tahap5: 15,
          tahap6: 20
        },
        batas_waktu_kamala: {
          tahap1: 15,
          tahap2: 30,
          tahap3: 45,
          tahap4: 30,
          tahap5: 15,
          tahap6: 20
        },
        batas_waktu_padma: {
          tahap1: 15,
          tahap2: 30,
          tahap3: 45,
          tahap4: 30,
          tahap5: 15,
          tahap6: 20
        },
        petugas_jaga: {
          penanggungJawab: [],
          perawatJaga: [],
          dokterIgdJaga: []
        }
      };
      return res.json(defaultSettings);
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching settings:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/v2/settings', async (req, res) => {
  try {
    const { 
      esi_kuning_jam, 
      esi_kuning_menit, 
      esi_merah_jam, 
      esi_merah_menit,
      batas_waktu_tahap,
      batas_waktu_kamala,
      batas_waktu_padma,
      petugas_jaga
    } = req.body;

    // Cek apakah sudah ada data settings
    const { data: existing, error: existingError } = await supabase
      .from('settings')
      .select('*')
      .limit(1);

    if (existingError) {
      console.error('Error checking existing settings:', existingError);
    }

    // Prepare update data - hanya include field yang dikirim
    const updateData = {};
    if (esi_kuning_jam !== undefined) updateData.esi_kuning_jam = esi_kuning_jam;
    if (esi_kuning_menit !== undefined) updateData.esi_kuning_menit = esi_kuning_menit;
    if (esi_merah_jam !== undefined) updateData.esi_merah_jam = esi_merah_jam;
    if (esi_merah_menit !== undefined) updateData.esi_merah_menit = esi_merah_menit;
    if (batas_waktu_tahap !== undefined) updateData.batas_waktu_tahap = batas_waktu_tahap;
    if (batas_waktu_kamala !== undefined) updateData.batas_waktu_kamala = batas_waktu_kamala;
    if (batas_waktu_padma !== undefined) updateData.batas_waktu_padma = batas_waktu_padma;
    if (petugas_jaga !== undefined) updateData.petugas_jaga = petugas_jaga;

    let result;
    if (existing && existing.length > 0) {
      // Update existing
      const { data, error } = await supabase
        .from('settings')
        .update(updateData)
        .eq('id', existing[0].id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating settings:', error);
        throw error;
      }
      result = data;
    } else {
      // Insert new - pastikan semua field required ada
      const insertData = {
        esi_kuning_jam: esi_kuning_jam || 0,
        esi_kuning_menit: esi_kuning_menit || 30,
        esi_merah_jam: esi_merah_jam || 1,
        esi_merah_menit: esi_merah_menit || 0,
        batas_waktu_tahap: batas_waktu_tahap || {
          tahap1: 15,
          tahap2: 30,
          tahap3: 45,
          tahap4: 30,
          tahap5: 15,
          tahap6: 20
        },
        batas_waktu_kamala: batas_waktu_kamala || {
          tahap1: 15,
          tahap2: 30,
          tahap3: 45,
          tahap4: 30,
          tahap5: 15,
          tahap6: 20
        },
        batas_waktu_padma: batas_waktu_padma || {
          tahap1: 15,
          tahap2: 30,
          tahap3: 45,
          tahap4: 30,
          tahap5: 15,
          tahap6: 20
        },
        petugas_jaga: petugas_jaga || {
          penanggungJawab: [],
          perawatJaga: [],
          dokterIgdJaga: []
        }
      };
      
      const { data, error } = await supabase
        .from('settings')
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting settings:', error);
        throw error;
      }
      result = data;
    }

    res.json(result);
  } catch (error) {
    console.error('Error saving settings:', error.message, error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk encode nomor antrian (cek manual)
// Endpoint untuk validasi nomor antrian (tanpa encoding)
app.post('/api/public/validate-antrian', async (req, res) => {
  const { nomor_antrian } = req.body;
  
  if (!nomor_antrian) {
    return res.status(400).json({ error: 'Nomor antrian wajib diisi.' });
  }
  
  const nomorProcessed = nomor_antrian.toUpperCase().replace(/\s/g, '');
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  try {
    // Verifikasi bahwa nomor antrian valid dan aktif (dalam 24 jam terakhir)
    const { data: dataKunjungan, error: errorKunjungan } = await supabase
      .from('kunjungan')
      .select('id, nomor_antrian, created_at')
      .eq('nomor_antrian', nomorProcessed)
      .gte('created_at', twentyFourHoursAgo)
      .single();
    
    if (errorKunjungan || !dataKunjungan) {
      return res.status(404).json({ error: 'Nomor antrian tidak ditemukan atau sudah kedaluwarsa.' });
    }
    
    // Return nomor antrian yang valid
    res.json({ 
      nomor_antrian: dataKunjungan.nomor_antrian,
      valid: true
    });
  } catch (error) {
    console.error('Error validating nomor antrian:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// Endpoint lama untuk backward compatibility (encode-antrian)
app.post('/api/public/encode-antrian', async (req, res) => {
  const { nomor_antrian } = req.body;
  
  if (!nomor_antrian) {
    return res.status(400).json({ error: 'Nomor antrian wajib diisi.' });
  }
  
  const nomorProcessed = nomor_antrian.toUpperCase().replace(/\s/g, '');
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  try {
    // Verifikasi bahwa nomor antrian valid dan aktif (dalam 24 jam terakhir)
    const { data: dataKunjungan, error: errorKunjungan } = await supabase
      .from('kunjungan')
      .select('id, nomor_antrian, created_at')
      .eq('nomor_antrian', nomorProcessed)
      .gte('created_at', twentyFourHoursAgo)
      .single();
    
    if (errorKunjungan || !dataKunjungan) {
      return res.status(404).json({ error: 'Nomor antrian tidak ditemukan atau sudah kedaluwarsa.' });
    }
    
    // Untuk format baru (InisialXXX), extract komponen:
    // Contoh: MR075 -> inisial="MR", urutan=75
    // Support 3-5 digits untuk handle overflow (hingga 99999)
    const match = nomorProcessed.match(/^([A-Z]+)(\d{3,5})$/);
    
    let hashedId;
    if (match) {
      // Format baru: hash inisial + angka
      const inisial = match[1];
      const urutan = parseInt(match[2], 10);
      
      // Convert inisial ke array of char codes
      const inisialCodes = [];
      for (let i = 0; i < inisial.length; i++) {
        inisialCodes.push(inisial.charCodeAt(i));
      }
      
      // Combine dengan urutan: [charCode1, charCode2, ..., urutan]
      const components = [...inisialCodes, urutan];
      hashedId = hashids.encode(components);
      
      devLog(`Encoded nomor antrian ${nomorProcessed} (new format) -> ${hashedId}`);
    } else {
      // Format lama atau format tidak dikenal - fallback
      // Parse sebagai DDMMHHxxx
      const components = [];
      if (nomorProcessed.length >= 9) {
        const dd = parseInt(nomorProcessed.substring(0, 2), 10);
        const mm = parseInt(nomorProcessed.substring(2, 4), 10);
        const hh = parseInt(nomorProcessed.substring(4, 6), 10);
        const xxx = parseInt(nomorProcessed.substring(6), 10);
        components.push(dd, mm, hh, xxx);
      } else {
        // Fallback: convert ke number array
        for (let i = 0; i < nomorProcessed.length; i++) {
          const char = nomorProcessed[i];
          if (!isNaN(char)) {
            components.push(parseInt(char, 10));
          } else {
            components.push(char.charCodeAt(0));
          }
        }
      }
      hashedId = hashids.encode(components);
      devLog(`Encoded nomor antrian ${nomorProcessed} (old format) -> ${hashedId}`);
    }
    
    if (!hashedId) {
      console.error('Failed to encode nomor antrian:', nomorProcessed);
      return res.status(500).json({ error: 'Gagal meng-encode nomor antrian.' });
    }
    
    res.json({ 
      hash: hashedId,
      nomor_antrian: dataKunjungan.nomor_antrian
    });
  } catch (error) {
    console.error('Error encoding nomor antrian:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

app.get('/api/public/status', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Nomor antrian wajib diisi.' });
  }
  
  let nomorAntrian = null;
  
  // Prioritas 1: Coba decode sebagai hash terlebih dahulu
  const decodedComponents = hashids.decode(q);
  
  if (decodedComponents && decodedComponents.length > 0) {
    // Hash valid, reconstruct nomor antrian dari components
    devLog(`Decoded hash ${q} -> components:`, decodedComponents);
    
    // Cek apakah format baru (ada char codes >= 65) atau format lama (semua < 65)
    const hasCharCodes = decodedComponents.some(c => c >= 65 && c <= 90);
    
    if (hasCharCodes) {
      // Format baru: [charCode1, charCode2, ..., urutan]
      const inisial = [];
      let urutan = null;
      
      for (let i = 0; i < decodedComponents.length; i++) {
        const val = decodedComponents[i];
        if (val >= 65 && val <= 90) {
          inisial.push(String.fromCharCode(val));
        } else {
          urutan = val;
        }
      }
      
      if (inisial.length > 0 && urutan !== null) {
        // Gunakan padding dinamis berdasarkan ukuran urutan
        const padding = urutan > 999 ? (urutan > 9999 ? 5 : 4) : 3;
        nomorAntrian = `${inisial.join('')}${String(urutan).padStart(padding, '0')}`;
        devLog(`Reconstructed nomor antrian (new format): ${nomorAntrian}`);
      }
    } else {
      // Format lama: [DD, MM, HH, xxx]
      if (decodedComponents.length === 4) {
        const [dd, mm, hh, xxx] = decodedComponents;
        nomorAntrian = `${String(dd).padStart(2, '0')}${String(mm).padStart(2, '0')}${String(hh).padStart(2, '0')}${String(xxx).padStart(3, '0')}`;
        devLog(`Reconstructed nomor antrian (old format): ${nomorAntrian}`);
      } else {
        nomorAntrian = decodedComponents.join('');
      }
    }
  } else {
    // Prioritas 2: Jika bukan hash, anggap sebagai nomor antrian langsung (backward compatible)
    nomorAntrian = q.toUpperCase();
    devLog(`Using direct nomor antrian (backward compatible): ${nomorAntrian}`);
  }
  
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  try {
    // Query berdasarkan nomor antrian yang sudah didecode
    const { data: dataKunjungan, error: errorKunjungan } = await supabase
    .from('kunjungan')
    .select('*') 
    .eq('nomor_antrian', nomorAntrian) 
    .gte('created_at', twentyFourHoursAgo) 
    .single();
    
    if (errorKunjungan || !dataKunjungan) {
      return res.status(404).json({ error: 'Nomor antrian tidak ditemukan atau sudah kedaluwarsa.' });
    }
    
    const { data: dataPasien, error: errorPasien } = await supabase
    .from('pasien')
    .select('nama, medrec, nama_wali, hubungan_wali, telepon_wali')
    .eq('id', dataKunjungan.pasien_id) 
    .single();
    if (errorPasien) {
      console.error('Error mengambil data pasien terpisah:', errorPasien.message);
    }

    const flattenedData = {
      ...dataKunjungan,
      step_timestamps: normalizeStepTimestamps(dataKunjungan.step_timestamps),
      nama: dataPasien?.nama,
      medrec: dataPasien?.medrec,
      nama_wali: dataPasien?.nama_wali,
      hubungan_wali: dataPasien?.hubungan_wali,
      telepon_wali: dataPasien?.telepon_wali,
    };
    res.json(flattenedData);
  } catch (error) {
    console.error('Error saat mencari kunjungan publik:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// Endpoint untuk Monitor IGD (public, tidak perlu auth)
app.get('/api/public/monitor', async (req, res) => {
  const { data, error } = await supabase
    .from('kunjungan')
    .select(`
      *,
      pasien (
        *
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error mengambil data monitor:', error);
    return res.status(500).json({ error: error.message });
  }

  // Flatten data untuk setiap kunjungan
  const flattenedData = data.map(item => ({
    ...item,
    step_timestamps: normalizeStepTimestamps(item.step_timestamps),
    nama: item.pasien?.nama,
    medrec: item.pasien?.medrec,
    nama_wali: item.pasien?.nama_wali,
    hubungan_wali: item.pasien?.hubungan_wali,
    telepon_wali: item.pasien?.telepon_wali,
  }));

  res.json(flattenedData);
});

// Endpoint untuk create admin account (hanya untuk superadmin)
app.post('/api/v2/admin/create-account', async (req, res) => {
  try {
    const { email, nama_lengkap, id_pegawai, jabatan, password, role } = req.body;

    // Validasi input
    if (!email || !nama_lengkap || !id_pegawai || !jabatan || !password || !role) {
      return res.status(400).json({ error: 'Semua field wajib diisi!' });
    }

    // Validasi email format
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      return res.status(400).json({ error: 'Email tidak valid!' });
    }

    // Validasi password minimal 6 karakter
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter!' });
    }

    // Validasi role
    const validRoles = ['admin', 'perawat_kamala', 'perawat_padma'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid!' });
    }

    console.log('Creating admin account for:', email, role);

    // Cek apakah email sudah terdaftar
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email);

    if (existingUser && existingUser.length > 0) {
      console.log('Email already exists');
      return res.status(409).json({ error: 'Email sudah terdaftar!' });
    }

    // Create user di Supabase Auth menggunakan admin API
    console.log('Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nama_lengkap,
        id_pegawai,
        jabatan,
        role
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return res.status(500).json({ error: authError.message || 'Gagal membuat user di Auth!' });
    }

    console.log('Auth user created with ID:', authData.user.id);

    // Insert data ke tabel profiles
    console.log('Inserting to profiles table...');
    const { data: adminUser, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        nama_lengkap,
        id_pegawai,
        jabatan,
        role
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting profiles:', insertError);
      
      // Rollback: hapus user dari auth jika insert gagal
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log('Rollback: deleted auth user');
      } catch (deleteError) {
        console.error('Error during rollback:', deleteError);
      }
      
      return res.status(500).json({ error: insertError.message || 'Gagal menyimpan data admin!' });
    }

    console.log('Admin user created successfully:', adminUser);

    res.status(201).json({
      message: 'Akun admin berhasil dibuat!',
      user: adminUser
    });

  } catch (error) {
    console.error('Error creating admin account:', error);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan server.' });
  }
});

// Health check endpoint for Docker/monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

app.listen(port, () => {
  devLog(`Backend server berjalan di http://localhost:${port}`);
  devLog(`CORS origins: ${allowedOrigins.join(', ')}`);
  devLog(`Environment: ${isProduction ? 'production' : 'development'}`);
});