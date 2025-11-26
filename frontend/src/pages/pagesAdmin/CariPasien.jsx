// src/pages/CariPasien.jsx
import { useState } from "react";
import {
  Search,
  UserX,
  Users,
  FileText,
  ArrowLeft,
  Phone,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logoHermina from "../../assets/logo-hermina-baru.svg";
import { useAuth } from "../../context/AuthContext";
import { getDashboardRoute } from "../../utils/navigationHelper";

export default function CariPasien() {
  const navigate = useNavigate();
  const { session, userProfile } = useAuth();

  const [searchValue, setSearchValue] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const shimmer =
    "relative overflow-hidden bg-gray-200 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent";

  const handleSearch = async () => {
    if (!searchValue.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      if (!session || !session.access_token) {
                console.error("Sesi tidak ditemukan. Harap login ulang.");
                setResult(false);
                return;
              }

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(
        `${API_URL}/api/v2/pasien/cari?q=${searchValue}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.warn("Pencarian gagal:", errorData.error);
        setResult(false);
      } else {
        const data = await response.json();
        setResult(data);
      }
    } catch (error) {
      console.error("Gagal fetch ke server:", error);
      setResult(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePilihPasien = (pasien) => {
    navigate(`/admin/daftar-kunjungan-lama/${pasien.id}`);
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 10 },
    visible: (i = 1) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" },
    }),
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* HEADER */}
      <header className="bg-green-700 text-white shadow-md py-3 px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={logoHermina} alt="Logo Hermina" className="h-8 w-8" />
          <h1 className="text-lg font-semibold tracking-wide">
            Pendaftaran Pasien IGD
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-green-800/40 px-3 py-1.5 rounded-full">
            <div className="bg-white text-green-700 font-bold rounded-full w-8 h-8 flex items-center justify-center">
              {userProfile?.nama_lengkap ? userProfile.nama_lengkap.substring(0, 2).toUpperCase() : "??"}
            </div>
            <div className="text-sm leading-tight truncate max-w-[160px]">
              <p className="font-semibold truncate">
                {userProfile?.nama_lengkap || "Pengguna"}
                </p>
                <p className="text-green-100 text-xs">
                {userProfile?.jabatan || "Petugas"}
              </p>
              </div>
          </div>
          <button
            onClick={() => navigate(getDashboardRoute(userProfile))}
            className="flex items-center gap-2 bg-white text-green-700 hover:bg-green-50 transition-colors px-3 py-1.5 rounded-md font-medium shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Dashboard</span>
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Pendaftaran Pasien IGD
          </h2>
          <p className="text-center text-gray-500 mb-6">
            Cari data pasien untuk mendaftarkan kunjungan baru
          </p>

          {/* Input Search */}
          <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg mb-4">
            <Search className="text-gray-400 ml-3" size={18} />
            <input
              type="text"
              placeholder="Masukkan No Rekam Medis pasien..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 bg-transparent px-3 py-2 text-gray-800 text-sm focus:outline-none"
            />
          </div>

          {/* Button */}
          <button
            onClick={handleSearch}
            disabled={loading}
            className={`w-full font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition ${
              loading
                ? "bg-green-400 cursor-not-allowed text-white"
                : "bg-green-700 hover:bg-green-800 text-white"
            }`}
          >
            <Search size={16} />
            {loading ? "Mencari Pasien..." : "Cari Pasien"}
          </button>

          {/* Separator */}
          <div className="flex items-center my-4">
            <hr className="flex-1 border-gray-200" />
            <span className="px-3 text-gray-400 text-sm">atau</span>
            <hr className="flex-1 border-gray-200" />
          </div>

          {/* Daftarkan Pasien Baru */}
          <p className="text-center text-sm text-gray-600">
            Pasien Belum Pernah Berkunjung?{" "}
            <button
              onClick={() => navigate("/admin/input-pasien-baru")}
              className="text-green-700 font-semibold hover:underline"
            >
              Daftarkan Pasien Baru →
            </button>
          </p>

          {/* ====================== HASIL ====================== */}
          <AnimatePresence mode="wait">
            {/* Skeleton */}
            {loading && (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-6 space-y-4"
              >
                <div className={`${shimmer} h-6 w-1/2 rounded-md`} />
                <div className={`${shimmer} h-32 rounded-lg`} />
              </motion.div>
            )}

            {/* Pasien Ditemukan */}
            {!loading && result && (
              <motion.div
                key="found"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="mt-6"
              >
                <div className="bg-green-50 border border-green-200 text-green-800 text-sm font-medium px-4 py-2 rounded-md mb-4">
                  Hasil Pencarian: 1 Pasien Ditemukan
                </div>

                <div className="bg-white border rounded-lg shadow-sm p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-100 text-green-800 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                      {result.nama
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">
                        {result.nama}
                      </p>
                      <p className="text-sm text-gray-500">Pasien Terdaftar</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 border-t pt-4">
                    <div className="flex items-start gap-2">
                      <FileText size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>No. Rekam Medis:</strong> {result.medrec}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <User size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Jenis Kelamin:</strong> {result.jenis_kelamin || "-"}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Nama Wali:</strong> {result.nama_wali || "-"}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Hubungan:</strong> {result.hubungan_wali || "-"}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 sm:col-span-2">
                      <Phone size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>No. Telepon Wali:</strong> {result.telepon_wali || "-"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePilihPasien(result)}
                    className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2 rounded-lg mt-4 transition"
                  >
                    Daftarkan Kunjungan IGD
                  </button>
                </div>
              </motion.div>
            )}

            {/* Pasien Tidak Ditemukan */}
            {!loading && result === false && (
              <motion.div
                key="not-found"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="mt-6"
              >
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-2 rounded-md mb-4">
                  Hasil Pencarian: Pasien Tidak Ditemukan
                </div>
                <div className="border-2 border-dashed border-gray-200 bg-white rounded-lg p-8 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="bg-red-100 text-red-500 p-3 rounded-full">
                      <UserX size={32} />
                    </div>
                  </div>
                  <p className="font-semibold text-gray-800 text-lg">
                    Pasien Tidak Ditemukan
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Data pasien dengan No. Rekam Medis tersebut tidak ada di sistem.
                  </p>
                  <button
                    onClick={() => navigate("/admin/input-pasien-baru")}
                    className="mt-4 bg-green-700 hover:bg-green-800 text-white font-medium py-2 px-4 rounded-md transition"
                  >
                    Daftarkan sebagai Pasien Baru
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
