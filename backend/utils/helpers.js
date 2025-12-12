// utils/helpers.js
const supabase = require('../config/database');
const { devLog } = require('../middleware/logger');

/**
 * Extract initials from a name
 * @param {string} nama - Full name
 * @returns {string} Initials (2-3 characters)
 */
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

/**
 * Generate daily visit number (Initials + 3-4 digit sequence)
 * @param {string} namaPasien - Patient name
 * @param {number} retryCount - Retry attempt count
 * @returns {Promise<string>} Generated visit number
 */
async function generateNomorKunjungan(namaPasien, retryCount = 0) {
  const MAX_RETRIES = 5;
  
  try {
    // Ambil inisial dari nama
    const inisial = getInitials(namaPasien);
    
    // Hitung jumlah kunjungan hari ini (sejak jam 00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    
    // Query dengan pessimistic locking approach
    const { data: lastKunjungan, error: queryError } = await supabase
      .from('kunjungan')
      .select('nomor_antrian')
      .gte('created_at', todayISO)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (queryError) {
      console.error('Error querying last kunjungan:', queryError);
      const timestamp = Date.now() % 10000;
      return `${inisial}${String(timestamp).padStart(4, '0')}`;
    }
    
    // Hitung urutan berikutnya
    let urutan = 1;
    
    if (lastKunjungan && lastKunjungan.length > 0) {
      // Filter hanya nomor dengan format valid (Inisial + 3-5 digit)
      const validNomors = lastKunjungan
        .map(k => k.nomor_antrian)
        .filter(nomor => /^[A-Z]{1,3}\d{3,5}$/.test(nomor));
      
      if (validNomors.length > 0) {
        const maxUrutan = validNomors.reduce((max, nomor) => {
          const match = nomor.match(/\d+$/);
          if (match) {
            const num = parseInt(match[0], 10);
            return num > max ? num : max;
          }
          return max;
        }, 0);
        
        urutan = maxUrutan + 1;
        devLog(`Found ${validNomors.length} valid nomors today, max urutan: ${maxUrutan}, next: ${urutan}`);
      } else {
        devLog('No valid nomor antrian found today, starting from 1');
      }
    }
    
    // Handle overflow (> 999): gunakan 4 digit
    let nomorKunjungan;
    if (urutan > 999) {
      if (urutan > 9999) {
        console.error(`⚠️ CRITICAL: Urutan melebihi 9999 (${urutan}) - menggunakan timestamp`);
        const timestamp = Date.now() % 100000;
        nomorKunjungan = `${inisial}${String(timestamp).padStart(5, '0')}`;
      } else {
        console.warn(`⚠️ Warning: Urutan melebihi 999 (${urutan}) - menggunakan 4 digit`);
        nomorKunjungan = `${inisial}${String(urutan).padStart(4, '0')}`;
      }
    } else {
      nomorKunjungan = `${inisial}${String(urutan).padStart(3, '0')}`;
    }
    
    devLog(`Generated nomor kunjungan: ${nomorKunjungan} (${namaPasien} - urutan ${urutan})`);
    
    return nomorKunjungan;
  } catch (error) {
    console.error('Error generating nomor kunjungan:', error);
    
    // Retry dengan exponential backoff
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 100;
      devLog(`Retrying generate nomor kunjungan (attempt ${retryCount + 1}/${MAX_RETRIES}) after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateNomorKunjungan(namaPasien, retryCount + 1);
    }
    
    // Final fallback
    console.error('⚠️ All retries failed, using timestamp-based fallback');
    const inisial = getInitials(namaPasien);
    const timestamp = Date.now() % 10000;
    return `${inisial}${String(timestamp).padStart(4, '0')}`;
  }
}

/**
 * Normalize step_timestamps from old format to new format
 * @param {Object} stepTimestamps - Step timestamps object
 * @returns {Object} Normalized step timestamps
 */
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

/**
 * Flatten kunjungan data with pasien data
 * @param {Object} item - Kunjungan item with nested pasien
 * @returns {Object} Flattened data
 */
function flattenKunjunganData(item) {
  return {
    ...item,
    step_timestamps: normalizeStepTimestamps(item.step_timestamps),
    nama: item.pasien?.nama || 'Tanpa Nama',
    medrec: item.pasien?.medrec || '-',
    jenis_kelamin: item.pasien?.jenis_kelamin || null,
    tanggal_lahir: item.pasien?.tanggal_lahir || null,
    umur: item.pasien?.umur || null,    
    nama_wali: item.pasien?.nama_wali,
    hubungan_wali: item.pasien?.hubungan_wali,
    telepon_wali: item.pasien?.telepon_wali,
    pasien: undefined
  };
}

/**
 * Generate random 8-digit medrec number
 * @returns {string} Random medrec number
 */
function generateMedrec() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

/**
 * Get default settings object
 * @returns {Object} Default settings
 */
function getDefaultSettings() {
  return {
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
}

module.exports = {
  getInitials,
  generateNomorKunjungan,
  normalizeStepTimestamps,
  flattenKunjunganData,
  generateMedrec,
  getDefaultSettings
};
