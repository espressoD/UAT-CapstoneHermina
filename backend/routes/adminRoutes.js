// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/v2/admin/create-account
 * @desc    Create admin account (superadmin only)
 * @access  Private (Admin only)
 */
router.post('/create-account', authenticate, authorize(['admin']), authController.createAdminAccount);

module.exports = router;
