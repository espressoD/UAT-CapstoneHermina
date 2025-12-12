// src/config/api.js
// Centralized API service with JWT authentication

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Token storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_PROFILE_KEY = 'userProfile';

// Helper function to log only in development
const devLog = (...args) => {
  if (import.meta.env.DEV) {
    console.log('[API]', ...args);
  }
};

const devError = (...args) => {
  if (import.meta.env.DEV) {
    console.error('[API]', ...args);
  }
};

// ========================================
// TOKEN MANAGEMENT
// ========================================

/**
 * Get access token from localStorage
 */
export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Save tokens to localStorage
 */
export const saveTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

/**
 * Save user profile to localStorage
 */
export const saveUserProfile = (profile) => {
  if (profile) localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
};

/**
 * Get user profile from localStorage
 */
export const getUserProfile = () => {
  try {
    const cached = localStorage.getItem(USER_PROFILE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

/**
 * Clear all auth data from localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_PROFILE_KEY);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAccessToken();
};

// ========================================
// TOKEN REFRESH
// ========================================

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    devLog('No refresh token available');
    return null;
  }

  try {
    devLog('Refreshing access token...');
    
    const response = await fetch(`${API_URL}/api/v2/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Token refresh failed');
    }

    devLog('Token refreshed successfully');
    saveTokens(data.accessToken, data.refreshToken);
    
    return data.accessToken;
  } catch (error) {
    devError('Token refresh failed:', error.message);
    clearAuthData();
    return null;
  }
};

// ========================================
// API REQUEST WRAPPER
// ========================================

/**
 * Make authenticated API request with auto token refresh
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const accessToken = getAccessToken();

  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token exists
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    devLog(`${options.method || 'GET'} ${endpoint}`);
    
    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && accessToken) {
      devLog('Got 401, attempting token refresh...');
      
      if (!isRefreshing) {
        isRefreshing = true;
        
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        
        if (newToken) {
          onTokenRefreshed(newToken);
          
          // Retry the original request with new token
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, {
            ...options,
            headers,
          });
        } else {
          // Refresh failed, redirect to login
          window.location.href = '/admin/login';
          throw new Error('Session expired. Please login again.');
        }
      } else {
        // Wait for token refresh
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(async (newToken) => {
            headers['Authorization'] = `Bearer ${newToken}`;
            try {
              const retryResponse = await fetch(url, {
                ...options,
                headers,
              });
              const retryData = await retryResponse.json();
              resolve(retryData);
            } catch (error) {
              reject(error);
            }
          });
        });
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    devError(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
};

// ========================================
// AUTH API
// ========================================

/**
 * Login with ID Pegawai and password
 */
export const login = async (id_pegawai, password) => {
  const response = await fetch(`${API_URL}/api/v2/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id_pegawai, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Login gagal');
  }

  // Save tokens and profile
  saveTokens(data.accessToken, data.refreshToken);
  saveUserProfile(data.profile);

  devLog('Login successful:', data.profile?.nama_lengkap);
  
  return data;
};

/**
 * Logout
 */
export const logout = async () => {
  try {
    await apiRequest('/api/v2/auth/logout', { method: 'POST' });
  } catch (error) {
    devError('Logout error:', error.message);
  } finally {
    clearAuthData();
  }
};

/**
 * Get current user profile
 */
export const getMe = async () => {
  return apiRequest('/api/v2/auth/me');
};

/**
 * Change password
 */
export const changePassword = async (currentPassword, newPassword) => {
  return apiRequest('/api/v2/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
};

// ========================================
// PASIEN API
// ========================================

/**
 * Search patient by medrec
 */
export const searchPasien = async (medrec) => {
  return apiRequest(`/api/v2/pasien/cari?q=${encodeURIComponent(medrec)}`);
};

/**
 * Get patient by ID
 */
export const getPasienById = async (id) => {
  return apiRequest(`/api/v2/pasien/${id}`);
};

// ========================================
// KUNJUNGAN API
// ========================================

/**
 * Get all kunjungan with filters
 */
export const getKunjungan = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.status) queryParams.append('status', params.status);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.search) queryParams.append('search', params.search);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.keputusan_akhir) queryParams.append('keputusan_akhir', params.keputusan_akhir);

  const query = queryParams.toString();
  return apiRequest(`/api/v2/kunjungan${query ? `?${query}` : ''}`);
};

/**
 * Create new kunjungan
 */
export const createKunjungan = async (data) => {
  return apiRequest('/api/v2/kunjungan', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update kunjungan
 */
export const updateKunjungan = async (id, data) => {
  return apiRequest(`/api/v2/kunjungan/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

/**
 * Delete kunjungan
 */
export const deleteKunjungan = async (id) => {
  return apiRequest(`/api/v2/kunjungan/${id}`, {
    method: 'DELETE',
  });
};

// ========================================
// STAFF API
// ========================================

/**
 * Get all perawat
 */
export const getPerawat = async () => {
  return apiRequest('/api/v2/perawat');
};

/**
 * Get all dokter GP
 */
export const getDokterGP = async () => {
  return apiRequest('/api/v2/dokter-gp');
};

/**
 * Get all dokter DPJP
 */
export const getDokterDPJP = async () => {
  return apiRequest('/api/v2/dokter-dpjp');
};

/**
 * Get all ruangan
 */
export const getRuangan = async () => {
  return apiRequest('/api/v2/ruangan');
};

// ========================================
// SETTINGS API
// ========================================

/**
 * Get settings
 */
export const getSettings = async () => {
  return apiRequest('/api/v2/settings');
};

/**
 * Update settings
 */
export const updateSettings = async (data) => {
  return apiRequest('/api/v2/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// ========================================
// BEDS API
// ========================================

/**
 * Get beds by unit
 */
export const getBedsByUnit = async (unit) => {
  return apiRequest(`/api/v2/beds/${unit}`);
};

/**
 * Create new bed
 */
export const createBed = async (data) => {
  return apiRequest('/api/v2/beds', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Delete bed
 */
export const deleteBed = async (id) => {
  return apiRequest(`/api/v2/beds/${id}`, {
    method: 'DELETE',
  });
};

// ========================================
// ADMIN API
// ========================================

/**
 * Create admin account
 */
export const createAdminAccount = async (data) => {
  return apiRequest('/api/v2/admin/create-account', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// ========================================
// PUBLIC API (No auth required)
// ========================================

/**
 * Get public status by nomor antrian
 */
export const getPublicStatus = async (nomorAntrian) => {
  const response = await fetch(`${API_URL}/api/public/status?q=${encodeURIComponent(nomorAntrian)}`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Gagal mendapatkan status');
  }
  
  return data;
};

/**
 * Get public monitor data
 * @param {string} unit - Unit name (kamala or padma)
 */
export const getPublicMonitor = async (unit) => {
  if (!unit) {
    throw new Error('Unit parameter is required');
  }
  
  const response = await fetch(`${API_URL}/api/public/monitor?unit=${unit}`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Gagal mendapatkan data monitor');
  }
  
  return data;
};

// Alias for backward compatibility
export const getKunjunganPublic = getPublicMonitor;

/**
 * Validate nomor antrian
 */
export const validateAntrian = async (nomor_antrian) => {
  const response = await fetch(`${API_URL}/api/public/validate-antrian`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nomor_antrian }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Nomor antrian tidak valid');
  }
  
  return data;
};

/**
 * Encode nomor antrian
 */
export const encodeAntrian = async (nomor_antrian) => {
  const response = await fetch(`${API_URL}/api/public/encode-antrian`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nomor_antrian }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Gagal encode nomor antrian');
  }
  
  return data;
};

// Export API_URL for direct use if needed
export { API_URL };

// Default export with all functions
export default {
  // Token management
  getAccessToken,
  getRefreshToken,
  saveTokens,
  saveUserProfile,
  getUserProfile,
  clearAuthData,
  isAuthenticated,
  refreshAccessToken,
  
  // Generic request
  apiRequest,
  
  // Auth
  login,
  logout,
  getMe,
  
  // Pasien
  searchPasien,
  getPasienById,
  
  // Kunjungan
  getKunjungan,
  createKunjungan,
  updateKunjungan,
  deleteKunjungan,
  
  // Staff
  getPerawat,
  getDokterGP,
  getDokterDPJP,
  getRuangan,
  
  // Settings
  getSettings,
  updateSettings,
  
  // Beds
  getBedsByUnit,
  createBed,
  deleteBed,
  
  // Admin
  createAdminAccount,
  
  // Public
  getPublicStatus,
  getPublicMonitor,
  validateAntrian,
  encodeAntrian,
};
