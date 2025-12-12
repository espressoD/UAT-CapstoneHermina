// routes/index.js
const pasienRoutes = require('./pasienRoutes');
const kunjunganRoutes = require('./kunjunganRoutes');
const staffRoutes = require('./staffRoutes');
const staffV2Routes = require('./staffV2Routes');
const settingsRoutes = require('./settingsRoutes');
const publicRoutes = require('./publicRoutes');
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const bedRoutes = require('./bedRoutes');
const healthRoutes = require('./healthRoutes');

module.exports = {
  pasienRoutes,
  kunjunganRoutes,
  staffRoutes,
  staffV2Routes,
  settingsRoutes,
  publicRoutes,
  authRoutes,
  adminRoutes,
  bedRoutes,
  healthRoutes
};
