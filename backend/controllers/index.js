// controllers/index.js
const pasienController = require('./pasienController');
const kunjunganController = require('./kunjunganController');
const staffController = require('./staffController');
const settingsController = require('./settingsController');
const publicController = require('./publicController');
const authController = require('./authController');
const bedController = require('./bedController');
const healthController = require('./healthController');

module.exports = {
  pasienController,
  kunjunganController,
  staffController,
  settingsController,
  publicController,
  authController,
  bedController,
  healthController
};
