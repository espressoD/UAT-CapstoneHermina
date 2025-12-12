// controllers/pasienController.js
const supabase = require('../config/database');

/**
 * Search patient by medrec
 * GET /api/v2/pasien/cari?q=medrec
 */
const searchPasien = async (req, res) => {
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
};

/**
 * Get single patient by ID
 * GET /api/v2/pasien/:id
 */
const getPasienById = async (req, res) => {
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
};

module.exports = {
  searchPasien,
  getPasienById
};
