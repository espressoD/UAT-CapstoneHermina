// src/context/AuthContext.jsx

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

// Helper function to log only in development
const devLog = (...args) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

const devError = (...args) => {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
};

const devWarn = (...args) => {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
};

export function AuthProvider({ children }) {
  // Inisialisasi dari localStorage jika ada
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const cached = localStorage.getItem('userProfile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false); // Flag untuk mencegah double init
  const isInitializedRef = useRef(false); // Ref untuk safety timer

  const fetchProfile = async (userId) => {
    devLog("3. Mengambil profil user dengan ID:", userId);
    try {
      // Timeout promise untuk mencegah hang - tingkatkan ke 5 detik
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout fetching profile')), 5000)
      );

      const fetchPromise = supabase
        .from('profiles')
        .select('id, role, nama_lengkap, jabatan, id_pegawai')
        .eq('id', userId)
        .single();

      const result = await Promise.race([fetchPromise, timeoutPromise]);
      
      // Check if result is the timeout error or actual data
      if (result && result.data) {
        devLog("4. Profil ditemukan:", result.data);
        return result.data;
      } else if (result && result.error) {
        devError("Error fetch profile:", result.error.message);
        return null;
      }
      
      return null;
    } catch (err) {
      devError("Exception fetch profile:", err.message);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let safetyTimer;
    let authSubscription;

    const initializeAuth = async () => {
      // Skip jika sudah diinisialisasi
      if (isInitialized) {
        devLog("Auth sudah diinisialisasi, skip...");
        return;
      }

      devLog("1. Memulai Auth...");
      setLoading(true);

      try {
        // Ambil sesi
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        devLog("2. Sesi didapat:", initialSession ? "User Ada" : "Kosong");
        devLog("2b. User ID:", initialSession?.user?.id);

        if (isMounted) {
          setSession(initialSession);
          
          // Cek apakah profile sudah ada di localStorage
          let cachedProfile = null;
          try {
            const cached = localStorage.getItem('userProfile');
            cachedProfile = cached ? JSON.parse(cached) : null;
          } catch {
            cachedProfile = null;
          }
          
          if (initialSession && cachedProfile && cachedProfile.id === initialSession.user.id) {
            // Gunakan cached profile (dari backend login)
            devLog("3. Menggunakan cached profile:", cachedProfile);
            setUserProfile(cachedProfile);
          } else if (!initialSession) {
            // Tidak ada session, clear profile
            devLog("3. No session, clearing profile");
            setUserProfile(null);
            localStorage.removeItem('userProfile');
          } else if (initialSession && !cachedProfile) {
            // Ada session tapi tidak ada cached profile - ini hanya terjadi di page refresh
            // Fetch profile dari database sebagai fallback
            devLog("3. Session exists but no cache, fetching profile...");
            const profile = await fetchProfile(initialSession.user.id);
            if (isMounted && profile) {
              setUserProfile(profile);
              localStorage.setItem('userProfile', JSON.stringify(profile));
            }
          }
          
          setLoading(false);
          setIsInitialized(true);
          isInitializedRef.current = true;
          clearTimeout(safetyTimer);
        }
      } catch (error) {
        devError("Auth initialization error:", error);
        if (isMounted) {
          setLoading(false);
          setIsInitialized(true);
          isInitializedRef.current = true;
        }
      }
    };

    initializeAuth();

    // --- PENGAMAN ANTI-STUCK ---
    safetyTimer = setTimeout(() => {
      if (isMounted && !isInitializedRef.current) {
        devWarn("⚠️ Auth terlalu lama, memaksa selesai loading.");
        setLoading(false);
        setIsInitialized(true);
        isInitializedRef.current = true;
      }
    }, 5000); // Kurangi dari 8s ke 5s

    // Auth state listener - SIMPLIFIED
    const setupAuthListener = async () => {
      const { data } = await supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          devLog("Auth event:", event);
          
          if (!isMounted) return;
          
          if (event === 'SIGNED_IN') {
            // SIGNED_IN dari login - baca profile dari localStorage
            setSession(currentSession);
            const cached = localStorage.getItem('userProfile');
            if (cached) {
              const profile = JSON.parse(cached);
              setUserProfile(profile);
              devLog("Profile loaded from localStorage on SIGNED_IN:", profile);
            }
          } else if (event === 'TOKEN_REFRESHED') {
            // Token di-refresh, update session saja
            setSession(currentSession);
            devLog("Session updated from TOKEN_REFRESHED");
          } else if (event === 'SIGNED_OUT') {
            // Clear semua state saat logout
            setSession(null);
            setUserProfile(null);
            localStorage.removeItem('userProfile');
            setIsInitialized(false);
            devLog("User signed out, cleared state");
          }
        }
      );
      authSubscription = data.subscription;
    };

    setupAuthListener();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array - hanya run sekali

  const value = {
    session,
    userProfile,
    userRole: userProfile?.role || null,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
