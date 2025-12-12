// config/index.js
require('dotenv').config();

const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  webhookUrl: process.env.WEBHOOK_URL || '',
  
  // Hashids configuration
  hashidsSecret: process.env.HASHIDS_SECRET || 'hermina-pasteur-igd-2025-secure-key',
  hashidsMinLength: 10,
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'hermina-igd-jwt-secret-key-2025-change-in-production',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '1d',      // 1 day
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',    // 7 days
  },
  
  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
  
  // CORS configuration
  corsOrigins: [
    process.env.CORS_ORIGIN || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5173',
    'http://34.123.111.227',
    'https://yourdomain.com'
  ],
};

module.exports = config;
