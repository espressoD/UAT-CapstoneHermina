// routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const { healthController } = require('../controllers');

/**
 * @route   GET /health
 * @desc    Health check endpoint for Docker/monitoring
 * @access  Public
 */
router.get('/', healthController.healthCheck);

module.exports = router;
