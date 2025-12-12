// controllers/kunjunganController.js
const supabase = require('../config/database');
const config = require('../config');
const { devLog } = require('../middleware/logger');
const { 
  normalizeStepTimestamps, 
  flattenKunjunganData, 
  generateNomorKunjungan,
  generateMedrec
} = require('../utils/helpers');

/**
 * Get all kunjungan with pagination and filters
 * GET /api/v2/kunjungan
 */
const getKunjungan = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status || 'Aktif'; 
    const { search, startDate, endDate, keputusan_akhir } = req.query;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('kunjungan')
      .select('*, pasien!inner(*)', { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status_kunjungan', status);
    }

    if (keputusan_akhir) {
      query = query.eq('keputusan_akhir', keputusan_akhir);
    }

    if (search) {
      query = query.ilike('pasien.nama', `%${search}%`);
    }

    if (startDate && endDate) {
      query = query
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error(`Supabase Error [Status: ${status}]:`, error);
      throw error;
    }

    const flattenedData = data.map(flattenKunjunganData);

    res.json({
      success: true,
      meta: {
        filterStatus: status,
        filterDecision: keputusan_akhir || 'All', 
        querySearch: search || null
      },
      data: flattenedData,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (err) {
    console.error('Server Error:', err.message);
    res.status(500).json({ 
      success: false, 
      error: 'Gagal memuat data kunjungan.' 
    });
  }
};

/**
 * Update kunjungan by ID
 * PATCH /api/v2/kunjungan/:id
 */
const updateKunjungan = async (req, res) => {
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
    alasan_rujuk,
    bed_number,
    unit
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
  if (bed_number !== undefined) updateData.bed_number = bed_number;
  if (unit !== undefined) updateData.unit = unit;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'Tidak ada data untuk di-update.' });
  }

  const { data, error } = await supabase
    .from('kunjungan')
    .update(updateData)
    .eq('id', id)
    .select('*, pasien(*)')
    .single();

  if (error) {
    console.error('Error mengupdate data kunjungan:', error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
};

/**
 * Delete kunjungan by ID
 * DELETE /api/v2/kunjungan/:id
 */
const deleteKunjungan = async (req, res) => {
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
};

/**
 * Create new kunjungan
 * POST /api/v2/kunjungan
 */
const createKunjungan = async (req, res) => {
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
    bedNumber,
    unit,
  } = req.body;

  if (!nama || !penjamin) {
    return res.status(400).json({ error: 'Nama dan Penjamin wajib diisi.' });
  }
  
  // Validasi nomor asuransi jika penjamin bukan "Umum"
  if (penjamin !== 'Umum' && !nomorAsuransi) {
    return res.status(400).json({ error: 'Nomor Asuransi wajib diisi untuk penjamin selain Umum.' });
  }
  
  const MAX_INSERT_RETRIES = 3;
  let insertAttempt = 0;
  let kunjunganInserted = false;
  let dataKunjungan = null;
  
  try {
    const medrec = generateMedrec();
    const pasienData = {
      nama: nama,
      medrec: medrec,
      umur: umur || null,
      jenis_kelamin: jenisKelamin || null,
      nama_wali: namaWali || null,
      hubungan_wali: hubunganWali || null,
      telepon_wali: teleponWali || null
    };
    
    const { data: dataPasien, error: errorPasien } = await supabase
      .from('pasien')
      .upsert(pasienData, { onConflict: 'medrec' })
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
    
    // Retry loop untuk handle duplicate nomor_antrian
    while (insertAttempt < MAX_INSERT_RETRIES && !kunjunganInserted) {
      insertAttempt++;
      
      const nomorKunjungan = await generateNomorKunjungan(nama);
      
      const kunjunganData = {
        pasien_id: pasienId,
        nomor_antrian: nomorKunjungan,
        jenis_pasien: jenisPasien,
        penjamin: penjamin,
        nomor_asuransi: nomorAsuransi,
        keluhan_utama: keluhanUtama || null,
        bed_number: bedNumber || null,
        unit: unit || null,
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
        if (errorKunjungan.code === '23505' || errorKunjungan.message?.includes('duplicate')) {
          console.warn(`⚠️ Duplicate nomor antrian detected (${nomorKunjungan}), retrying... (attempt ${insertAttempt}/${MAX_INSERT_RETRIES})`);
          
          if (insertAttempt >= MAX_INSERT_RETRIES) {
            throw new Error('Gagal membuat kunjungan setelah beberapa percobaan. Silakan coba lagi.');
          }
          
          await new Promise(resolve => setTimeout(resolve, 100 * insertAttempt));
          continue;
        } else {
          console.error('Error saat insert kunjungan:', errorKunjungan);
          throw new Error(errorKunjungan.message);
        }
      }
      
      dataKunjungan = insertedData;
      kunjunganInserted = true;
      
      // Workaround jika database override nomor_antrian
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
    
    // Kirim webhook
    try {
      if (config.webhookUrl && dataKunjungan) {
        const webhookBody = {
          nama_pasien: nama,
          nomor_wali: teleponWali,
          kode_pasien: medrec, 
          nomor_antrian: dataKunjungan.nomor_antrian
        };
        fetch(config.webhookUrl, {
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
};

module.exports = {
  getKunjungan,
  updateKunjungan,
  deleteKunjungan,
  createKunjungan
};
