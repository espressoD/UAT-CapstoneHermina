// middleware/logger.js
const config = require('../config');

/**
 * Development-only logging utility
 */
const devLog = (...args) => {
  if (!config.isProduction) {
    console.log(...args);
  }
};

/**
 * Request logger middleware
 * Logs incoming requests in development mode
 */
const requestLogger = (req, res, next) => {
  if (!config.isProduction) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  }
  next();
};

/**
 * Response time logger middleware
 */
const responseTimeLogger = (req, res, next) => {
  if (!config.isProduction) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[RESPONSE] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
  }
  next();
};

module.exports = {
  devLog,
  requestLogger,
  responseTimeLogger
};
