// src/components/uiAdmin/AdminHeader.jsx

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, LogOut, Settings, AlertTriangle, Monitor } from "lucide-react"; // 🟢 Import Ikon Monitor
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logoHermina from "../../assets/logo-hermina-baru.svg";
import { useAuth } from "../../context/AuthContext";
import { logout } from "../../config/api";

export default function AdminHeader({ activeUnit }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const navigate = useNavigate();

  const { userProfile, loading, clearAuthState } = useAuth();

  // Stabilkan userProfile dengan useMemo untuk mencegah re-render
  const stableUserProfile = useMemo(() => userProfile, [userProfile]);

  // 🕒 Update waktu setiap detik (Tidak ada perubahan)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formattedDate = now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const formattedTime = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setCurrentTime(`${formattedDate} ${formattedTime}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // ⚙️ Navigasi ke halaman pengaturan (Tidak ada perubahan)
  const handleSettings = () => {
    navigate("/admin/settings");
    setShowDropdown(false);
  };

  // 🖥️ Navigasi ke halaman Monitor IGD (BARU)
  const handleMonitorPadma = () => {
    navigate("/admin/monitor-igd-padma"); // Mengarahkan ke route baru
    setShowDropdown(false);
  };

  // 🖥️ Navigasi ke halaman Monitor IGD (BARU)
  const handleMonitorKamala = () => {
    navigate("/admin/monitor-igd-kamala"); // Mengarahkan ke route baru
    setShowDropdown(false);
  };

  // 🚪 Tampilkan popup konfirmasi logout (Tidak ada perubahan)
  const handleLogout = () => {
    setShowLogoutPopup(true);
    setShowDropdown(false);
  };

  // 🔸 Konfirmasi logout (Tidak ada perubahan)
  const confirmLogout = async () => {
    setShowLogoutPopup(false);
    
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
    
    // Clear auth state
    clearAuthState();
    
    navigate("/admin/login");
  };

  return (
    <>
      <header className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm">
        {/* 🏥 Logo & Judul Dashboard (Tidak ada perubahan) */}
        <div className="flex items-center space-x-3">
          <img
            src={logoHermina}
            alt="Logo Hermina"
            className="w-14 h-14 object-contain rounded-full bg-green-50 p-1"
          />
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-3">
            Dashboard IGD
              {activeUnit === 'Kamala' && (
                <span className="px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-l font-bold border-2 border-pink-400 shadow-md">Kamala</span>
              )}
              {activeUnit === 'Padma' && (
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-l font-bold border-2 border-purple-400 shadow-md">Padma</span>
              )}
          </h1>
        </div>

        {/* Waktu + Dropdown Akun (Tidak ada perubahan) */}
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <div className="text-sm text-gray-600">{currentTime}</div>

          <div className="relative group">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center bg-green-100 text-green-700 px-4 py-2 rounded-full font-medium shadow-sm hover:bg-green-200 transition max-w-[180px] md:max-w-[210px]"
            >
              <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2 flex-shrink-0">
                {/* Ganti Inisial Statis */}
                {stableUserProfile?.nama_lengkap ? stableUserProfile.nama_lengkap.substring(0, 2).toUpperCase() : '??'}
                </span>

              <span className="truncate flex-1 text-left overflow-hidden text-ellipsis">
                {/* Ganti Nama Statis */}
                {stableUserProfile?.nama_lengkap || "Pengguna"}
                </span>
              <ChevronDown className="ml-2 w-4 h-4 flex-shrink-0" />
            </button>
            
            <div className="absolute right-0 bottom-[-2.2rem] bg-gray-800 text-white text-xs px-3 py-1 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              {stableUserProfile?.nama_lengkap || 'Pengguna'}
              </div>
              
              {/* Dropdown menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-800">
                      {/* Ganti Nama Statis */}
                      {stableUserProfile?.nama_lengkap || "Pengguna"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {/* Ganti Jabatan Statis */}
                        {stableUserProfile?.jabatan || "Petugas"}
                        </p>
                        </div>
                        
                  <ul className="py-2 text-sm text-gray-700">
                  {/* (BARU) Opsi Tampilan Monitor - Conditional berdasarkan role */}
                  {(stableUserProfile?.role === 'superadmin' || 
                    stableUserProfile?.role === 'admin' || 
                    stableUserProfile?.role === 'perawat_padma') && (
                    <li>
                      <button
                        onClick={handleMonitorPadma}
                        className="flex items-center w-full px-4 py-2 hover:bg-gray-100 transition"
                      >
                        <Monitor className="w-4 h-4 mr-2 text-gray-500" />
                        Tampilan Monitor Padma
                      </button>
                    </li>
                  )}
                  
                  {(stableUserProfile?.role === 'superadmin' || 
                    stableUserProfile?.role === 'admin' || 
                    stableUserProfile?.role === 'perawat_kamala') && (
                    <li>
                      <button
                        onClick={handleMonitorKamala}
                        className="flex items-center w-full px-4 py-2 hover:bg-gray-100 transition"
                      >
                        <Monitor className="w-4 h-4 mr-2 text-gray-500" />
                        Tampilan Monitor Kamala
                      </button>
                    </li>
                  )}
                  {/* Opsi Pengaturan Akun */}
                  <li>
                    <button
                      onClick={handleSettings}
                      className="flex items-center w-full px-4 py-2 hover:bg-gray-100 transition"
                    >
                      <Settings className="w-4 h-4 mr-2 text-gray-500" />
                      Pengaturan Akun
                    </button>
                  </li>
                  {/* Opsi Keluar */}
                  <li>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 hover:bg-gray-100 text-red-600 transition"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Keluar
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 🔹 Popup Logout Modern (Tidak ada perubahan) */}
      <AnimatePresence>
        {showLogoutPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl shadow-xl w-[360px] p-6 text-center"
            >
              <AlertTriangle className="w-14 h-14 text-yellow-500 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Konfirmasi Keluar
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                Apakah Anda yakin ingin keluar dari sistem?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={confirmLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                >
                  Ya, Keluar
                </button>
                <button
                  onClick={() => setShowLogoutPopup(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
