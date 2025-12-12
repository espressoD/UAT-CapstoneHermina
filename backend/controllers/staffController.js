// controllers/staffController.js
const supabase = require('../config/database');

/**
 * Get all perawat (v1)
 * GET /api/perawat
 */
const getPerawat = async (req, res) => {
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
};

/**
 * Get all perawat v2 with role
 * GET /api/v2/perawat
 */
const getPerawatV2 = async (req, res) => {
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
};

/**
 * Get all dokter GP (v1)
 * GET /api/dokter_gp
 */
const getDokterGP = async (req, res) => {
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
};

/**
 * Get all dokter GP v2
 * GET /api/v2/dokter-gp
 */
const getDokterGPV2 = async (req, res) => {
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
};

/**
 * Get all dokter DPJP (v1)
 * GET /api/dokter_dpjp
 */
const getDokterDPJP = async (req, res) => {
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
};

/**
 * Get all dokter DPJP v2
 * GET /api/v2/dokter-dpjp
 */
const getDokterDPJPV2 = async (req, res) => {
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
};

/**
 * Get all ruangan
 * GET /api/v2/ruangan
 */
const getRuangan = async (req, res) => {
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
};

module.exports = {
  getPerawat,
  getPerawatV2,
  getDokterGP,
  getDokterGPV2,
  getDokterDPJP,
  getDokterDPJPV2,
  getRuangan
};
