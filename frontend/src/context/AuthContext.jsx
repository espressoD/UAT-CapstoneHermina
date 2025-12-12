// src/context/AuthContext.jsx

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getAccessToken, 
  getUserProfile, 
  clearAuthData, 
  getMe,
  isAuthenticated as checkAuth 
} from '../config/api';

const AuthContext = createContext();

// Helper function to log only in development
const devLog = (...args) => {
  if (import.meta.env.DEV) {
    console.log('[AuthContext]', ...args);
  }
};

const devError = (...args) => {
  if (import.meta.env.DEV) {
    console.error('[AuthContext]', ...args);
  }
};

export function AuthProvider({ children }) {
  const [userProfile, setUserProfile] = useState(() => getUserProfile());
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => checkAuth());

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      devLog('Initializing auth...');
      setLoading(true);

      try {
        const token = getAccessToken();
        const cachedProfile = getUserProfile();

        if (token && cachedProfile) {
          devLog('Token and cached profile found');
          if (isMounted) {
            setUserProfile(cachedProfile);
            setIsAuthenticated(true);
          }
          
          // Optionally verify token is still valid by calling /me
          try {
            const response = await getMe();
            if (response.profile && isMounted) {
              devLog('Profile verified from server:', response.profile);
              setUserProfile(response.profile);
            }
          } catch (error) {
            devError('Token verification failed:', error.message);
            // Token might be expired, clear auth data
            clearAuthData();
            if (isMounted) {
              setIsAuthenticated(false);
              setUserProfile(null);
            }
          }
        } else if (token && !cachedProfile) {
          // Token exists but no profile, fetch from server
          devLog('Token found but no cached profile, fetching...');
          try {
            const response = await getMe();
            if (response.profile && isMounted) {
              setUserProfile(response.profile);
              setIsAuthenticated(true);
            }
          } catch (error) {
            devError('Failed to fetch profile:', error.message);
            clearAuthData();
            if (isMounted) {
              setIsAuthenticated(false);
            }
          }
        } else {
          // No token - user is not logged in (this is normal on login page)
          devLog('No token found - user not authenticated');
          if (isMounted) {
            setIsAuthenticated(false);
            setUserProfile(null);
          }
        }
      } catch (error) {
        devError('Auth initialization error:', error);
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          devLog('Auth initialization complete');
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update auth state (called after login)
  const updateAuthState = useCallback((profile) => {
    devLog('Updating auth state with profile:', profile);
    setUserProfile(profile);
    setIsAuthenticated(true);
  }, []);

  // Clear auth state (called after logout)
  const clearAuthState = useCallback(() => {
    devLog('Clearing auth state');
    clearAuthData();
    setUserProfile(null);
    setIsAuthenticated(false);
  }, []);

  // Listen for storage changes (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken') {
        if (!e.newValue) {
          // Token was removed (logout in another tab)
          devLog('Token removed in another tab, clearing state');
          setUserProfile(null);
          setIsAuthenticated(false);
        } else if (e.newValue && !e.oldValue) {
          // Token was added (login in another tab)
          devLog('Token added in another tab, refreshing state');
          const profile = getUserProfile();
          setUserProfile(profile);
          setIsAuthenticated(true);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = {
    userProfile,
    userRole: userProfile?.role || null,
    loading,
    isAuthenticated,
    updateAuthState,
    clearAuthState,
    // Backward compatibility
    session: isAuthenticated ? { access_token: getAccessToken() } : null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
