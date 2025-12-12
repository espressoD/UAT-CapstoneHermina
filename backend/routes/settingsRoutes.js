// routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const { settingsController } = require('../controllers');
const { authenticate } = require('../middleware/auth');

// All settings routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v2/settings
 * @desc    Get settings
 * @access  Private
 */
router.get('/', settingsController.getSettings);

/**
 * @route   PUT /api/v2/settings
 * @desc    Update settings
 * @access  Private
 */
router.put('/', settingsController.updateSettings);

module.exports = router;
