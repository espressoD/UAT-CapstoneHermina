// routes/staffRoutes.js
const express = require('express');
const router = express.Router();
const { staffController } = require('../controllers');
const { authenticate } = require('../middleware/auth');

// ========================================
// V1 ENDPOINTS (Legacy) - Protected
// ========================================

// All staff routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/perawat
 * @desc    Get all perawat (v1)
 * @access  Private
 */
router.get('/perawat', staffController.getPerawat);

/**
 * @route   GET /api/dokter_gp
 * @desc    Get all dokter GP (v1)
 * @access  Private
 */
router.get('/dokter_gp', staffController.getDokterGP);

/**
 * @route   GET /api/dokter_dpjp
 * @desc    Get all dokter DPJP (v1)
 * @access  Private
 */
router.get('/dokter_dpjp', staffController.getDokterDPJP);

module.exports = router;
