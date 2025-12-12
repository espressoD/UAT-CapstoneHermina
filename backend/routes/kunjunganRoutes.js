// routes/kunjunganRoutes.js
const express = require('express');
const router = express.Router();
const { kunjunganController } = require('../controllers');
const { authenticate } = require('../middleware/auth');

// All kunjungan routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v2/kunjungan
 * @desc    Get all kunjungan with pagination and filters
 * @access  Private
 */
router.get('/', kunjunganController.getKunjungan);

/**
 * @route   POST /api/v2/kunjungan
 * @desc    Create new kunjungan
 * @access  Private
 */
router.post('/', kunjunganController.createKunjungan);

/**
 * @route   PATCH /api/v2/kunjungan/:id
 * @desc    Update kunjungan by ID
 * @access  Private
 */
router.patch('/:id', kunjunganController.updateKunjungan);

/**
 * @route   DELETE /api/v2/kunjungan/:id
 * @desc    Delete kunjungan by ID
 * @access  Private
 */
router.delete('/:id', kunjunganController.deleteKunjungan);

module.exports = router;
