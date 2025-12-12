// controllers/publicController.js
const supabase = require('../config/database');
const hashids = require('../config/hashids');
const { devLog } = require('../middleware/logger');
const { normalizeStepTimestamps } = require('../utils/helpers');

/**
 * Validate nomor antrian (tanpa encoding)
 * POST /api/public/validate-antrian
 */
const validateAntrian = async (req, res) => {
  const { nomor_antrian } = req.body;
  
  if (!nomor_antrian) {
    return res.status(400).json({ error: 'Nomor antrian wajib diisi.' });
  }
  
  const nomorProcessed = nomor_antrian.toUpperCase().replace(/\s/g, '');
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  try {
    const { data: dataKunjungan, error: errorKunjungan } = await supabase
      .from('kunjungan')
      .select('id, nomor_antrian, created_at')
      .eq('nomor_antrian', nomorProcessed)
      .gte('created_at', twentyFourHoursAgo)
      .single();
    
    if (errorKunjungan || !dataKunjungan) {
      return res.status(404).json({ error: 'Nomor antrian tidak ditemukan atau sudah kedaluwarsa.' });
    }
    
    res.json({ 
      nomor_antrian: dataKunjungan.nomor_antrian,
      valid: true
    });
  } catch (error) {
    console.error('Error validating nomor antrian:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

/**
 * Encode nomor antrian (backward compatibility)
 * POST /api/public/encode-antrian
 */
const encodeAntrian = async (req, res) => {
  const { nomor_antrian } = req.body;
  
  if (!nomor_antrian) {
    return res.status(400).json({ error: 'Nomor antrian wajib diisi.' });
  }
  
  const nomorProcessed = nomor_antrian.toUpperCase().replace(/\s/g, '');
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  try {
    const { data: dataKunjungan, error: errorKunjungan } = await supabase
      .from('kunjungan')
      .select('id, nomor_antrian, created_at')
      .eq('nomor_antrian', nomorProcessed)
      .gte('created_at', twentyFourHoursAgo)
      .single();
    
    if (errorKunjungan || !dataKunjungan) {
      return res.status(404).json({ error: 'Nomor antrian tidak ditemukan atau sudah kedaluwarsa.' });
    }
    
    // Format baru (InisialXXX)
    const match = nomorProcessed.match(/^([A-Z]+)(\d{3,5})$/);
    
    let hashedId;
    if (match) {
      const inisial = match[1];
      const urutan = parseInt(match[2], 10);
      
      const inisialCodes = [];
      for (let i = 0; i < inisial.length; i++) {
        inisialCodes.push(inisial.charCodeAt(i));
      }
      
      const components = [...inisialCodes, urutan];
      hashedId = hashids.encode(components);
      
      devLog(`Encoded nomor antrian ${nomorProcessed} (new format) -> ${hashedId}`);
    } else {
      // Format lama atau format tidak dikenal - fallback
      const components = [];
      if (nomorProcessed.length >= 9) {
        const dd = parseInt(nomorProcessed.substring(0, 2), 10);
        const mm = parseInt(nomorProcessed.substring(2, 4), 10);
        const hh = parseInt(nomorProcessed.substring(4, 6), 10);
        const xxx = parseInt(nomorProcessed.substring(6), 10);
        components.push(dd, mm, hh, xxx);
      } else {
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
};

/**
 * Get public status by nomor antrian or hash
 * GET /api/public/status?q=...
 */
const getPublicStatus = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Nomor antrian wajib diisi.' });
  }
  
  let nomorAntrian = null;
  
  // Prioritas 1: Coba decode sebagai hash
  const decodedComponents = hashids.decode(q);
  
  if (decodedComponents && decodedComponents.length > 0) {
    devLog(`Decoded hash ${q} -> components:`, decodedComponents);
    
    const hasCharCodes = decodedComponents.some(c => c >= 65 && c <= 90);
    
    if (hasCharCodes) {
      // Format baru
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
        const padding = urutan > 999 ? (urutan > 9999 ? 5 : 4) : 3;
        nomorAntrian = `${inisial.join('')}${String(urutan).padStart(padding, '0')}`;
        devLog(`Reconstructed nomor antrian (new format): ${nomorAntrian}`);
      }
    } else {
      // Format lama
      if (decodedComponents.length === 4) {
        const [dd, mm, hh, xxx] = decodedComponents;
        nomorAntrian = `${String(dd).padStart(2, '0')}${String(mm).padStart(2, '0')}${String(hh).padStart(2, '0')}${String(xxx).padStart(3, '0')}`;
        devLog(`Reconstructed nomor antrian (old format): ${nomorAntrian}`);
      } else {
        nomorAntrian = decodedComponents.join('');
      }
    }
  } else {
    // Prioritas 2: Anggap sebagai nomor antrian langsung
    nomorAntrian = q.toUpperCase();
    devLog(`Using direct nomor antrian (backward compatible): ${nomorAntrian}`);
  }
  
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  try {
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
};

/**
 * Get public monitor data - filtered by active beds in specific unit
 * GET /api/public/monitor?unit=kamala|padma
 */
const getMonitor = async (req, res) => {
  try {
    const { unit } = req.query;
    
    // Validasi unit parameter
    if (!unit || !['kamala', 'padma'].includes(unit.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Parameter unit wajib diisi (kamala atau padma)' 
      });
    }

    const unitLower = unit.toLowerCase();
    
    // Step 1: Get active beds for the specified unit
    const { data: activeBeds, error: bedsError } = await supabase
      .from('beds')
      .select('bed_number')
      .eq('unit', unitLower)
      .eq('is_active', true);

    if (bedsError) {
      console.error('Error mengambil data beds:', bedsError);
      return res.status(500).json({ error: 'Gagal mengambil data beds' });
    }

    // Extract bed numbers
    const bedNumbers = activeBeds.map(bed => bed.bed_number);
    
    // If no active beds, return empty array
    if (bedNumbers.length === 0) {
      return res.json([]);
    }

    devLog(`[Monitor ${unitLower.toUpperCase()}] Active beds:`, bedNumbers);

    // Step 2: Get kunjungan data filtered by active beds only (no unit filter)
    // Kamala beds: numeric (1, 2, 3...)
    // Padma beds: alphanumeric (A1, B1, C1...)
    const { data, error } = await supabase
      .from('kunjungan')
      .select(`
        *,
        pasien (
          *
        )
      `)
      .eq('status_kunjungan', 'Aktif')
      .in('bed_number', bedNumbers)
      .not('bed_number', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error mengambil data monitor:', error);
      return res.status(500).json({ error: error.message });
    }

    const flattenedData = data.map(item => ({
      ...item,
      step_timestamps: normalizeStepTimestamps(item.step_timestamps),
      nama: item.pasien?.nama,
      medrec: item.pasien?.medrec,
      jenis_kelamin: item.pasien?.jenis_kelamin,
      tanggal_lahir: item.pasien?.tanggal_lahir,
      nama_wali: item.pasien?.nama_wali,
      hubungan_wali: item.pasien?.hubungan_wali,
      telepon_wali: item.pasien?.telepon_wali,
    }));

    devLog(`[Monitor ${unitLower.toUpperCase()}] Found ${flattenedData.length} kunjungan`);
    res.json(flattenedData);
    
  } catch (error) {
    console.error('Error pada getMonitor:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

module.exports = {
  validateAntrian,
  encodeAntrian,
  getPublicStatus,
  getMonitor
};
