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
    let isAuthListenerReady = false; // Flag untuk mencegah race condition

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
          if (initialSession) {
            // Cek apakah profile sudah ada di localStorage
            let cachedProfile = null;
            try {
              const cached = localStorage.getItem('userProfile');
              cachedProfile = cached ? JSON.parse(cached) : null;
            } catch {
              cachedProfile = null;
            }
            
            if (cachedProfile && cachedProfile.id === initialSession.user.id) {
              // Gunakan cached profile, skip fetch
              devLog("3. Menggunakan cached profile:", cachedProfile);
              setUserProfile(cachedProfile);
              setLoading(false);
              setIsInitialized(true); // Tandai sudah diinisialisasi
              isInitializedRef.current = true; // Update ref
              isAuthListenerReady = true; // Tandai listener siap
              clearTimeout(safetyTimer);
            } else {
              // Fetch profile baru
              const profile = await fetchProfile(initialSession.user.id);
              devLog("Profile hasil fetch:", profile);
              if (isMounted && profile) {
                setUserProfile(profile);
                // Simpan ke localStorage untuk persistence
                localStorage.setItem('userProfile', JSON.stringify(profile));
                setIsInitialized(true); // Tandai sudah diinisialisasi
                isInitializedRef.current = true; // Update ref
                isAuthListenerReady = true; // Tandai listener siap
                // Clear safety timer setelah berhasil
                clearTimeout(safetyTimer);
              }
              devLog("5. Selesai Loading.");
              setLoading(false);
            }
          } else {
            // Jika tidak ada session, hapus profile dari localStorage
            localStorage.removeItem('userProfile');
            setUserProfile(null);
            setIsInitialized(true); // Tandai sudah diinisialisasi
            isInitializedRef.current = true; // Update ref
            isAuthListenerReady = true; // Tandai listener siap
            devLog("5. Selesai Loading.");
            setLoading(false);
          }
        }
      } catch (error) {
        devError("Auth initialization error:", error);
        if (isMounted) {
          setLoading(false);
          setIsInitialized(true); // Tandai sudah diinisialisasi meski error
          isInitializedRef.current = true; // Update ref
          isAuthListenerReady = true;
        }
      }
    };

    initializeAuth();

    // --- PENGAMAN ANTI-STUCK ---
    // Jika dalam 8 detik masih loading, paksa berhenti loading
    // HANYA jika belum diinisialisasi (cek menggunakan ref)
    safetyTimer = setTimeout(() => {
      if (isMounted && !isInitializedRef.current) {
        devWarn("⚠️ Auth terlalu lama, memaksa selesai loading.");
        setLoading(false);
        setIsInitialized(true);
        isInitializedRef.current = true;
      } else if (isInitializedRef.current) {
        devLog("✅ Auth sudah initialized, safety timer dibatalkan");
      }
    }, 8000);

    // Auth state listener
    const setupAuthListener = async () => {
      const { data } = await supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          devLog("Auth event:", event);
          
          // PENTING: Skip semua event jika listener belum siap (masih initialization)
          if (!isAuthListenerReady) {
            devLog("Listener belum siap, skip event:", event);
            return;
          }
          
          if (isMounted) {
            // Hanya fetch profile untuk SIGNED_IN (login baru)
            // Skip untuk TOKEN_REFRESHED agar tidak double fetch saat tab refocus
            if (currentSession && event === 'SIGNED_IN') {
               devLog("Fetching profile dari auth listener (SIGNED_IN)...");
               setSession(currentSession); // Update session hanya saat SIGNED_IN
               const profile = await fetchProfile(currentSession.user.id);
               if (isMounted && profile) {
                 setUserProfile(profile);
                 // Simpan ke localStorage
                 localStorage.setItem('userProfile', JSON.stringify(profile));
                 setLoading(false); // Set loading false setelah profile didapat
               }
            } else if (event === 'TOKEN_REFRESHED') {
              // Token di-refresh (tab refocus), tapi SKIP semua state updates
              devLog("Token refreshed - NO state updates to prevent re-render");
              // JANGAN set session atau state apapun
              // Session tetap valid, gunakan cached profile dari localStorage
            } else if (event === 'SIGNED_OUT') {
               setSession(null);
               setUserProfile(null);
               localStorage.removeItem('userProfile');
               setIsInitialized(false); // Reset flag saat logout
            }
          }
        }
      );
      authSubscription = data.subscription;
    };

    setupAuthListener();

    // Handle visibility change (tab switching) - JANGAN re-initialize
    let visibilityTimeout;
    const handleVisibilityChange = () => {
      // Clear timeout sebelumnya untuk debounce
      clearTimeout(visibilityTimeout);
      
      if (document.visibilityState === 'visible' && isInitialized) {
        // Debounce 500ms untuk mencegah multiple trigger
        visibilityTimeout = setTimeout(() => {
          devLog("Tab kembali visible, tapi auth sudah initialized - skip refresh");
          // Tidak melakukan apa-apa, biarkan cached state tetap digunakan
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      clearTimeout(visibilityTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
