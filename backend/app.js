// app.js
const express = require('express');
const cors = require('cors');

// Configuration
const config = require('./config');
const corsOptions = require('./config/cors');

// Middleware
const { 
  errorHandler, 
  notFoundHandler, 
  requestLogger, 
  responseTimeLogger,
  devLog 
} = require('./middleware');

// Routes
const {
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
} = require('./routes');

// Initialize Express app
const app = express();

// ========================================
// MIDDLEWARE
// ========================================

// CORS middleware
app.use(cors(corsOptions));

// Body parser
app.use(express.json());

// Request logging (development only)
app.use(requestLogger);
app.use(responseTimeLogger);

// ========================================
// ROUTES
// ========================================

// Health check (no prefix)
app.use('/health', healthRoutes);

// Public routes (no auth required)
app.use('/api/public', publicRoutes);

// V2 Auth routes (MUST be before V1 legacy routes due to /api prefix matching)
app.use('/api/v2/auth', authRoutes);

// V2 Admin routes
app.use('/api/v2/admin', adminRoutes);

// V2 API routes
app.use('/api/v2/pasien', pasienRoutes);
app.use('/api/v2/kunjungan', kunjunganRoutes);
app.use('/api/v2', staffV2Routes);
app.use('/api/v2/settings', settingsRoutes);
app.use('/api/v2/beds', bedRoutes);

// V1 Legacy routes (placed after v2 routes to prevent prefix collision)
app.use('/api', staffRoutes);

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ========================================
// SERVER START
// ========================================

const PORT = config.port;

app.listen(PORT, () => {
  devLog(`Backend server berjalan di http://localhost:${PORT}`);
  devLog(`CORS origins: ${config.corsOrigins.join(', ')}`);
  devLog(`Environment: ${config.isProduction ? 'production' : 'development'}`);
});

module.exports = app;
