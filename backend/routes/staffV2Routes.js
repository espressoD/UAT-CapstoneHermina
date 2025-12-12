// routes/staffV2Routes.js
const express = require('express');
const router = express.Router();
const { staffController } = require('../controllers');
const { authenticate } = require('../middleware/auth');

// ========================================
// V2 ENDPOINTS - Protected
// ========================================

// All staff v2 routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v2/perawat
 * @desc    Get all perawat v2 with role
 * @access  Private
 */
router.get('/perawat', staffController.getPerawatV2);

/**
 * @route   GET /api/v2/dokter-gp
 * @desc    Get all dokter GP v2
 * @access  Private
 */
router.get('/dokter-gp', staffController.getDokterGPV2);

/**
 * @route   GET /api/v2/dokter-dpjp
 * @desc    Get all dokter DPJP v2
 * @access  Private
 */
router.get('/dokter-dpjp', staffController.getDokterDPJPV2);

/**
 * @route   GET /api/v2/ruangan
 * @desc    Get all ruangan
 * @access  Private
 */
router.get('/ruangan', staffController.getRuangan);

module.exports = router;
