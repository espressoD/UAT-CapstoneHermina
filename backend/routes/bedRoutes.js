// routes/bedRoutes.js
const express = require('express');
const router = express.Router();
const { bedController } = require('../controllers');
const { authenticate, optionalAuth } = require('../middleware/auth');

/**
 * @route   GET /api/v2/beds/:unit
 * @desc    Get all beds by unit
 * @access  Private
 */
router.get('/:unit', authenticate, bedController.getBedsByUnit);

/**
 * @route   POST /api/v2/beds
 * @desc    Create new bed
 * @access  Private
 */
router.post('/', authenticate, bedController.createBed);

/**
 * @route   DELETE /api/v2/beds/:id
 * @desc    Delete bed (soft delete)
 * @access  Private
 */
router.delete('/:id', authenticate, bedController.deleteBed);

module.exports = router;
