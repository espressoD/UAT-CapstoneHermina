// routes/pasienRoutes.js
const express = require('express');
const router = express.Router();
const { pasienController } = require('../controllers');
const { authenticate } = require('../middleware/auth');

// All pasien routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v2/pasien/cari
 * @desc    Search patient by medrec
 * @access  Private
 */
router.get('/cari', pasienController.searchPasien);

/**
 * @route   GET /api/v2/pasien/:id
 * @desc    Get single patient by ID
 * @access  Private
 */
router.get('/:id', pasienController.getPasienById);

module.exports = router;
