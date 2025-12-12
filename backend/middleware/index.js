// middleware/index.js
const { errorHandler, notFoundHandler, asyncHandler } = require('./errorHandler');
const { devLog, requestLogger, responseTimeLogger } = require('./logger');
const { 
  authenticate, 
  optionalAuth, 
  authorize,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  refreshTokenHandler 
} = require('./auth');

module.exports = {
  // Error handling
  errorHandler,
  notFoundHandler,
  asyncHandler,
  
  // Logging
  devLog,
  requestLogger,
  responseTimeLogger,
  
  // Authentication & Authorization
  authenticate,
  optionalAuth,
  authorize,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  refreshTokenHandler
};
