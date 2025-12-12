// controllers/settingsController.js
const supabase = require('../config/database');
const { getDefaultSettings } = require('../utils/helpers');

/**
 * Get settings
 * GET /api/v2/settings
 */
const getSettings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    // Jika tidak ada data, return default settings
    if (!data) {
      return res.json(getDefaultSettings());
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching settings:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update settings
 * PUT /api/v2/settings
 */
const updateSettings = async (req, res) => {
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
      // Insert new
      const defaultSettings = getDefaultSettings();
      const insertData = {
        esi_kuning_jam: esi_kuning_jam ?? defaultSettings.esi_kuning_jam,
        esi_kuning_menit: esi_kuning_menit ?? defaultSettings.esi_kuning_menit,
        esi_merah_jam: esi_merah_jam ?? defaultSettings.esi_merah_jam,
        esi_merah_menit: esi_merah_menit ?? defaultSettings.esi_merah_menit,
        batas_waktu_tahap: batas_waktu_tahap ?? defaultSettings.batas_waktu_tahap,
        batas_waktu_kamala: batas_waktu_kamala ?? defaultSettings.batas_waktu_kamala,
        batas_waktu_padma: batas_waktu_padma ?? defaultSettings.batas_waktu_padma,
        petugas_jaga: petugas_jaga ?? defaultSettings.petugas_jaga
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
};

module.exports = {
  getSettings,
  updateSettings
};
