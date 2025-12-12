// middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config');
const supabase = require('../config/database');
const { devLog } = require('./logger');

/**
 * Generate Access Token
 * @param {Object} payload - User data to encode
 * @returns {string} JWT access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessTokenExpiry
  });
};

/**
 * Generate Refresh Token
 * @param {Object} payload - User data to encode
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshTokenExpiry
  });
};

/**
 * Verify JWT Token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    devLog('[JWT] Token verification failed:', error.message);
    return null;
  }
};

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Token tidak ditemukan. Silakan login terlebih dahulu.' 
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ 
        success: false,
        error: 'Token tidak valid atau sudah kadaluarsa.' 
      });
    }

    // Attach decoded user to request object
    req.user = decoded;
    devLog('[AUTH] User authenticated:', decoded.id);
    
    next();
  } catch (error) {
    console.error('[AUTH] Error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token sudah kadaluarsa. Silakan login kembali.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token tidak valid.',
        code: 'INVALID_TOKEN'
      });
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Terjadi kesalahan autentikasi.' 
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't block if not
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      if (decoded) {
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    // Don't block request on auth failure for optional auth
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const authorize = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          error: 'Autentikasi diperlukan.' 
        });
      }

      // Check role from JWT payload
      if (!req.user.role) {
        // If role not in token, fetch from database
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', req.user.id)
          .single();

        if (error || !profile) {
          return res.status(403).json({ 
            success: false,
            error: 'Profil user tidak ditemukan.' 
          });
        }

        req.user.role = profile.role;
      }

      if (!allowedRoles.includes(req.user.role)) {
        devLog('[AUTH] User role not authorized:', req.user.role);
        return res.status(403).json({ 
          success: false,
          error: 'Anda tidak memiliki akses ke resource ini.' 
        });
      }

      next();
    } catch (error) {
      console.error('[AUTH] Authorization error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Terjadi kesalahan otorisasi.' 
      });
    }
  };
};

/**
 * Refresh token handler
 * Handles token refresh requests
 */
const refreshTokenHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token diperlukan.'
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token tidak valid atau sudah kadaluarsa.'
      });
    }

    // Verify user still exists and is active
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, nama_lengkap, jabatan, role, id_pegawai')
      .eq('id', decoded.id)
      .single();

    if (error || !profile) {
      return res.status(401).json({
        success: false,
        error: 'User tidak ditemukan.'
      });
    }

    // Generate new tokens
    const tokenPayload = {
      id: profile.id,
      id_pegawai: profile.id_pegawai,
      nama_lengkap: profile.nama_lengkap,
      jabatan: profile.jabatan,
      role: profile.role
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken({ id: profile.id });

    res.status(200).json({
      success: true,
      message: 'Token berhasil diperbarui.',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error('[REFRESH TOKEN] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan server.'
    });
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  refreshTokenHandler
};
