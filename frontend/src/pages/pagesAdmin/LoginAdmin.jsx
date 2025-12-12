import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoHermina from "../../assets/logo-hermina-baru.svg";
import { login } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

export default function LoginAdmin() {
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { updateAuthState } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setShowError(false);
    setLoading(true);

    if (!nip || !password) {
      setErrorMessage("ID Pegawai (NIP) dan Password wajib diisi!");
      setShowError(true);
      setLoading(false);
      return;
    }

    try {
      // Call backend login endpoint using API service
      const data = await login(nip, password);

      console.log('[LOGIN] Response data:', data);

      // Update auth state with profile
      if (data.profile) {
        updateAuthState(data.profile);
        console.log('[LOGIN] Auth state updated with profile:', data.profile);
      }

      // Show success message
      setShowSuccess(true);

      // Wait for state update, then navigate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('[LOGIN] Navigating to dashboard, role:', data.profile?.role);
      if (data.profile?.role === 'perawat_kamala') {
        navigate("/admin/dashboard-kamala", { replace: true });
      } else if (data.profile?.role === 'perawat_padma') {
        navigate("/admin/dashboard-padma", { replace: true });
      } else {
        navigate("/admin/dashboard", { replace: true });
      }

    } catch (err) {
      console.error("Login error:", err.message);
      setErrorMessage(err.message || 'Terjadi kesalahan saat login');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Kiri */}
      <div className="w-1/3 bg-green-800 text-white flex flex-col justify-center items-center px-10">
        <img src={logoHermina} alt="Logo Hermina" className="w-28 mb-6" />
        <h1 className="text-2xl font-semibold mb-2">Selamat Datang di</h1>
        <h2 className="text-3xl font-bold mb-4">Sistem Informasi IGD</h2>
        <p className="text-sm opacity-90 text-center max-w-md">
          RS Hermina - Dashboard Monitoring Real-Time
        </p>
      </div>

      {/* Kanan */}
      <div className="w-2/3 flex items-center justify-center bg-white">
        <form
          onSubmit={handleLogin}
          className="w-3/4 max-w-md bg-white p-8 rounded-xl"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-1 text-center">
            Masuk ke Akun Anda
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            Silakan masukkan kredensial Anda untuk mengakses sistem
          </p>

          {/* NIP */}
          <label className="block text-sm font-semibold mb-1">
            ID Pegawai (NIP)
          </label>
          <input
            type="text"
            value={nip}
            onChange={(e) => setNip(e.target.value)}
            placeholder="Masukkan ID Pegawai"
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-green-700 focus:ring-0"
          />

          {/* Password */}
          <label className="block text-sm font-semibold mb-1 mt-4">
            Password
          </label>
          <div className="relative mb-3">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan Password"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-green-700 focus:ring-0"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-500"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex items-center mb-5">
            <input type="checkbox" className="mr-2 accent-green-600" />
            <span className="text-sm text-gray-700">Ingat Saya</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-md transition disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>

          <p className="text-sm text-gray-600 text-center mt-4">
            Lupa password?{" "}
            <a href="#" className="text-green-700 hover:underline font-medium">
              Hubungi IT Support
            </a>
          </p>
        </form>
      </div>

      {/* Popup Error */}
      <AnimatePresence>
        {showError && (
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
              className="bg-white p-6 rounded-xl shadow-lg text-center w-80"
            >
              <AlertCircle className="w-14 h-14 text-red-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Gagal Masuk
              </h3>
              <p className="text-gray-600 text-sm mb-4">{errorMessage}</p>
              <button
                onClick={() => setShowError(false)}
                className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition"
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup Sukses (jika ada) */}
      <AnimatePresence>
        {showSuccess && (
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
              className="bg-white p-6 rounded-xl shadow-lg text-center w-80"
            >
              <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Berhasil Masuk
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Selamat datang kembali!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
