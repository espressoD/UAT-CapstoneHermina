// src/pages/pagesAdmin/SettingsAkunAdminBiasa.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoHermina from "../../assets/logo-hermina-baru.svg";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../supabaseClient";
import { getDashboardRoute } from "../../utils/navigationHelper";

export default function SettingsAkunAdminBiasa() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  // State untuk password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Function to get correct dashboard route based on user role - using helper
  const getBackToDashboard = () => getDashboardRoute(userProfile);

  const handleConfirmLogout = async () => {
    setShowLogoutPopup(false);
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    }
    
    setTimeout(() => {
      navigate("/admin/login");
    }, 300);
  };

  const handleSavePassword = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    // Validasi
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("Semua field password wajib diisi!");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Password baru dan konfirmasi tidak cocok!");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Password baru minimal 6 karakter!");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    try {
      // Update password menggunakan Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccessMessage("Password berhasil diperbarui!");
      
      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      setTimeout(() => {
        setSuccessMessage("");
      }, 2000);
    } catch (error) {
      console.error("Error updating password:", error);
      setErrorMessage(error.message || "Gagal memperbarui password");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* === HEADER === */}
      <div className="bg-green-700 text-white py-3 px-6 flex justify-between items-center shadow">
        <div>
          <h1 className="font-semibold text-lg flex items-center gap-2">
            <img
              src={logoHermina}
              alt="Logo Hermina"
              className="w-6 h-6"
            />
            Pengaturan Akun
          </h1>
          <p className="text-xs text-green-100 mt-0.5">
            Mode: <span className="font-semibold">ADMIN</span> - Ubah Password & Keluar
          </p>
        </div>
        <button
          onClick={() => navigate(getBackToDashboard())}
          className="text-sm hover:underline flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Kembali ke Dashboard
        </button>
      </div>

      {/* === INFO ALERT === */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mx-8 mt-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Informasi:</span> Sebagai Admin, Anda hanya dapat mengubah password dan keluar dari sistem. 
              Untuk pengaturan ESI, batas waktu per tahap, dan petugas jaga, silakan hubungi Superadmin.
            </p>
          </div>
        </div>
      </div>

      {/* === BODY === */}
      <div className="p-8 grid md:grid-cols-2 gap-8 max-w-6xl mx-auto md:pb-8">
        {/* PROFIL SAYA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white shadow-md rounded-xl p-6"
        >
          <h2 className="font-semibold text-gray-800 mb-4">Profil Saya</h2>
          <div className="flex flex-col items-center">
            <div className="bg-green-700 text-white rounded-full w-24 h-24 flex items-center justify-center text-3xl font-bold mb-4">
              {userProfile?.nama_lengkap ? userProfile.nama_lengkap.substring(0, 2).toUpperCase() : "??"}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {userProfile?.nama_lengkap || "Memuat..."}
            </h3>
            <p className="text-gray-500 mb-4 text-sm">{userProfile?.jabatan || "..."}</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 font-medium">Nama Lengkap</label>
              <input
                type="text"
                value={userProfile?.nama_lengkap || ""}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                readOnly
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 font-medium">ID Pegawai (NIP)</label>
              <input
                type="text"
                value={userProfile?.id_pegawai || "-"}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                readOnly
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 font-medium">Peran</label>
              <input
                type="text"
                value={userProfile?.jabatan || ""}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                readOnly
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 font-medium">Unit</label>
              <input
                type="text"
                value="IGD RS Hermina"
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                readOnly
              />
            </div>
          </div>
        </motion.div>

        {/* KEAMANAN & AKSES */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
          className="bg-white shadow-md rounded-xl p-6"
        >
          <h2 className="font-semibold text-gray-800 mb-4">Keamanan & Akses</h2>

          {errorMessage && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {errorMessage}
            </div>
          )}

          <div className="space-y-4">
            {/* Password Saat Ini */}
            <div>
              <label className="text-sm text-gray-600 font-medium">Password Saat Ini</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan password saat ini"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm pr-10 focus:ring-2 focus:ring-green-600"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                  className="absolute right-3 top-2.5 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Password Baru */}
            <div>
              <label className="text-sm text-gray-600 font-medium">Password Baru</label>
              <div className="relative mt-1">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm pr-10 focus:ring-2 focus:ring-green-600"
                />
                <button
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  type="button"
                  className="absolute right-3 top-2.5 text-gray-500"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Password */}
            <div>
              <label className="text-sm text-gray-600 font-medium">Konfirmasi Password Baru</label>
              <div className="relative mt-1">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Masukkan ulang password baru"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm pr-10 focus:ring-2 focus:ring-green-600"
                />
                <button
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  type="button"
                  className="absolute right-3 top-2.5 text-gray-500"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleSavePassword}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-md transition-all duration-300 shadow"
            >
              Simpan Perubahan Password
            </button>
          </div>

          <hr className="my-6" />

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Keluar dari Sistem</h3>
            <p className="text-sm text-gray-500 mb-3">
              Klik tombol di bawah untuk keluar dari akun Anda.
            </p>
            <button
              onClick={() => setShowLogoutPopup(true)}
              className="w-full border border-red-400 text-red-600 hover:bg-red-600 hover:text-white font-medium py-2 rounded-md transition-all duration-300"
            >
              Keluar
            </button>
          </div>
        </motion.div>
      </div>

      {/* --- POPUP KONFIRMASI KELUAR --- */}
      <AnimatePresence>
        {showLogoutPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
              className="bg-white p-6 rounded-2xl shadow-2xl text-center w-96 border border-gray-100"
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Konfirmasi Keluar</h3>
              <p className="text-gray-600 mb-5">Apakah Anda yakin ingin keluar dari sistem?</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleConfirmLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-all duration-200"
                >
                  Ya, Keluar
                </button>
                <button
                  onClick={() => setShowLogoutPopup(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-all duration-200"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- POPUP SUKSES --- */}
      <AnimatePresence>
        {!!successMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
              className="bg-white p-6 rounded-2xl shadow-2xl text-center w-80"
            >
              <h3 className="text-lg font-semibold text-green-700 mb-2">Berhasil!</h3>
              <p className="text-gray-600 mb-4 text-sm">
                {successMessage}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
