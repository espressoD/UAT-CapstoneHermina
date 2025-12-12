// controllers/bedController.js
const supabase = require('../config/database');
const { devLog } = require('../middleware/logger');

/**
 * Get all beds by unit
 * GET /api/v2/beds/:unit
 */
const getBedsByUnit = async (req, res) => {
  const { unit } = req.params;

  devLog('[GET BEDS] Fetching beds for unit:', unit);

  try {
    const { data: beds, error } = await supabase
      .from('beds')
      .select('*')
      .eq('unit', unit.toLowerCase())
      .eq('is_active', true)
      .order('bed_number', { ascending: true });

    if (error) throw error;

    devLog('[GET BEDS] Found beds:', beds?.length || 0);
    res.status(200).json(beds || []);

  } catch (error) {
    console.error('[GET BEDS] Error:', error);
    res.status(500).json({ 
      error: error.message || 'Gagal mengambil data beds.' 
    });
  }
};

/**
 * Create new bed
 * POST /api/v2/beds
 */
const createBed = async (req, res) => {
  const { bed_number, unit } = req.body;

  devLog('[CREATE BED] Creating bed:', bed_number, 'for unit:', unit);

  if (!bed_number || !unit) {
    return res.status(400).json({ 
      error: 'bed_number dan unit wajib diisi!' 
    });
  }

  try {
    // Check if bed already exists (inactive)
    const { data: existingBed } = await supabase
      .from('beds')
      .select('*')
      .eq('bed_number', bed_number)
      .eq('unit', unit.toLowerCase())
      .eq('is_active', false)
      .single();

    // If bed exists but inactive, reactivate it
    if (existingBed) {
      const { data: reactivatedBed, error: reactivateError } = await supabase
        .from('beds')
        .update({ 
          is_active: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', existingBed.id)
        .select()
        .single();

      if (reactivateError) throw reactivateError;

      devLog('[CREATE BED] Reactivated existing bed:', reactivatedBed);
      return res.status(200).json(reactivatedBed);
    }

    // Create new bed if doesn't exist
    const { data: newBed, error } = await supabase
      .from('beds')
      .insert([
        {
          bed_number: bed_number,
          unit: unit.toLowerCase(),
          is_active: true,
          created_by: req.user?.id || null
        }
      ])
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return res.status(409).json({ 
          error: `Bed ${bed_number} sudah ada di unit ${unit}!` 
        });
      }
      throw error;
    }

    devLog('[CREATE BED] Success:', newBed);
    res.status(201).json(newBed);

  } catch (error) {
    console.error('[CREATE BED] Error:', error);
    res.status(500).json({ 
      error: error.message || 'Gagal membuat bed baru.' 
    });
  }
};

/**
 * Delete bed (soft delete)
 * DELETE /api/v2/beds/:id
 */
const deleteBed = async (req, res) => {
  const { id } = req.params;

  devLog('[DELETE BED] Deleting bed ID:', id);

  try {
    // Soft delete: set is_active = false
    const { data: deletedBed, error } = await supabase
      .from('beds')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!deletedBed) {
      return res.status(404).json({ 
        error: 'Bed tidak ditemukan.' 
      });
    }

    devLog('[DELETE BED] Success:', deletedBed);
    res.status(200).json({ 
      message: 'Bed berhasil dihapus.',
      bed: deletedBed 
    });

  } catch (error) {
    console.error('[DELETE BED] Error:', error);
    res.status(500).json({ 
      error: error.message || 'Gagal menghapus bed.' 
    });
  }
};

module.exports = {
  getBedsByUnit,
  createBed,
  deleteBed
};
