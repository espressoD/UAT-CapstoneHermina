// controllers/healthController.js

/**
 * Health check endpoint for Docker/monitoring
 * GET /health
 */
const healthCheck = (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
};

module.exports = {
  healthCheck
};
