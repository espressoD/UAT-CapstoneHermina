// routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const { publicController } = require('../controllers');

/**
 * @route   POST /api/public/validate-antrian
 * @desc    Validate nomor antrian (tanpa encoding)
 * @access  Public
 */
router.post('/validate-antrian', publicController.validateAntrian);

/**
 * @route   POST /api/public/encode-antrian
 * @desc    Encode nomor antrian (backward compatibility)
 * @access  Public
 */
router.post('/encode-antrian', publicController.encodeAntrian);

/**
 * @route   GET /api/public/status
 * @desc    Get public status by nomor antrian or hash
 * @access  Public
 */
router.get('/status', publicController.getPublicStatus);

/**
 * @route   GET /api/public/monitor
 * @desc    Get public monitor data (Monitor IGD)
 * @access  Public
 */
router.get('/monitor', publicController.getMonitor);

module.exports = router;
