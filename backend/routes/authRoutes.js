// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { authenticate, refreshTokenHandler } = require('../middleware/auth');

/**
 * @route   POST /api/v2/auth/login
 * @desc    Login endpoint - authenticate via backend
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/v2/auth/logout
 * @desc    Logout endpoint
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/v2/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', refreshTokenHandler);

/**
 * @route   GET /api/v2/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   POST /api/v2/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
