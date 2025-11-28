// src/pages/InputPasienBaru.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserRoundPlus,
  CheckCircle2, // (MODIFIKASI) Mengganti CheckCircle dengan CheckCircle2
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoHermina from "../../assets/logo-hermina-baru.svg";
import { useAuth } from "../../context/AuthContext";
import { getDashboardRoute } from "../../utils/navigationHelper";

export default function InputPasienBaru() {
  const navigate = useNavigate();
  const { session, userProfile } = useAuth();

  const [formData, setFormData] = useState({
    nama: "",
    umur: "",
    jenisKelamin: "",
    namaWali: "",
    hubunganWali: "",
    teleponWali: "",
    jenisPasien: "",
    penjamin: "Umum",
    nomorAsuransi: "",
  });

  const [popupType, setPopupType] = useState(null); // "error", "confirm", "success"
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submission

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nama.trim()) {
      setPopupType("error");
      return;
    }

    setPopupType("confirm");
  };

const handleConfirmSave = async () => {
  // Prevent double submission
  if (isSubmitting) return;
  
  if (!session || !session.access_token) {
    console.error("Sesi tidak ditemukan. Harap login ulang.");
    setPopupType(null);
    alert("Sesi Anda berakhir. Harap login ulang.");
    return;
  }

  setIsSubmitting(true);
  
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/v2/kunjungan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error dari server:', errorData);
        setPopupType(null);
        alert(`Gagal menyimpan: ${errorData.error || 'Terjadi kesalahan pada server'}`);
        return;
      }

      const dataYangDisimpan = await response.json();


      setPopupType("success");

    } catch (error) {
      console.error("Terjadi error saat menyimpan:", error);
      setPopupType(null); 
      alert(`Terjadi kesalahan jaringan: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClosePopup = () => setPopupType(null);

  const handleCloseSuccess = () => navigate(getDashboardRoute(userProfile));

  // Variants animasi popup
  const backdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } }, 
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const popup = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
          {/* HEADER (Tidak ada perubahan) */}
          <header className="bg-green-700 text-white shadow-md py-3 px-6 flex justify-between items-center">
            {/* LEFT SIDE - LOGO + TITLE */}
            <div className="flex items-center gap-3">
              <img src={logoHermina} alt="Logo Hermina" className="h-8 w-8" />
              <h1 className="text-lg font-semibold tracking-wide">
                Pendaftaran Pasien IGD
              </h1>
            </div>
    
            {/* RIGHT SIDE - USER INFO + BUTTON */}
            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="flex items-center gap-3 bg-green-800/40 px-3 py-1.5 rounded-full">
                <div className="bg-white text-green-700 font-bold rounded-full w-8 h-8 flex items-center justify-center">
                  {userProfile?.nama_lengkap ? userProfile.nama_lengkap.substring(0, 2).toUpperCase() : "??"}
                </div>
                <div className="text-sm leading-tight max-w-[140px] overflow-hidden">
                  <p className="font-semibold truncate" title={userProfile?.nama_lengkap || "Pengguna"}>
                    {userProfile?.nama_lengkap || "Pengguna"}
                    </p>
                    <p className="text-green-100 text-xs truncate">
                      {userProfile?.jabatan || "Petugas"}
                      </p>
                      </div>
                      </div>
                      </div>
                      </header>

      {/* MAIN (Tidak ada perubahan) */}
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-8">
          <button
            onClick={() => navigate("/admin/cari-pasien")}
            className="flex items-center gap-2 text-sm text-green-700 hover:underline mb-6"
          >
            <ArrowLeft size={16} /> Kembali ke Pencarian
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Input Data Pasien Baru
          </h2>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* INFORMASI KUNJUNGAN (Tidak ada perubahan) */}

            {/* IDENTITAS PASIEN (Tidak ada perubahan) */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 border-b border-green-700 pb-2 mb-4">
                Identitas Pasien
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    placeholder="Masukkan nama lengkap pasien..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Umur (Tahun)
                  </label>
                  <input
                    type="number"
                    name="umur"
                    value={formData.umur}
                    onChange={handleChange}
                    placeholder="Masukkan umur dalam tahun..."
                    min="0"
                    max="150"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
                  />
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    name="jenisKelamin"
                    value={formData.jenisKelamin}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 bg-gray-50 focus:ring-2 focus:ring-green-600 focus:outline-none"
                  >
                    <option value="">Pilih jenis kelamin...</option>
                    <option value="Laki-Laki">Laki-Laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                {/* Jenis Pasien — ✅ tambahan baru */}
                <div>
                <label className="block text-sm font-medium text-gray-700">
                  Jenis Pasien <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  name="jenisPasien"
                  value={formData.jenisPasien}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 bg-gray-50 focus:ring-2 focus:ring-green-600 focus:outline-none"
                >
                    <option value="">Pilih jenis pasien...</option>
                    <option value="Umum">Umum</option>
                    <option value="Anak">Anak</option>
                    <option value="Kebidanan">Kebidanan</option>
                </select>
                </div>
              </div>
            </section>

            {/* PENANGGUNG JAWAB / WALI (Tidak ada perubahan) */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 border-b border-green-700 pb-2 mb-4">
                Penanggung Jawab / Wali
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nama Wali <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="namaWali"
                    value={formData.namaWali}
                    onChange={handleChange}
                    placeholder="Masukkan nama wali..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Hubungan dengan Pasien <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="hubunganWali"
                    value={formData.hubunganWali}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
                  >
                    <option value="">Pilih hubungan...</option>
                    <option value="Orang Tua">Orang Tua</option>
                    <option value="Suami/Istri">Suami/Istri</option>
                    <option value="Anak">Anak</option>
                    <option value="Saudara">Saudara</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    No. Telepon Wali <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="teleponWali"
                    value={formData.teleponWali}
                    onChange={handleChange}
                    placeholder="Contoh: 08123456789"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
                  />
                </div>
              </div>
            </section>

            {/* PENJAMIN / PEMBAYARAN (Tidak ada perubahan) */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 border-b border-green-700 pb-2 mb-4">
                Penjamin / Pembayaran
              </h3>

              <div className="flex flex-wrap gap-6 mb-4">
                {["Umum", "JKN", "Asuransi Lainnya"].map(
                  (item) => (
                    <label key={item} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="penjamin"
                        value={item}
                        checked={formData.penjamin === item}
                        onChange={handleChange}
                      />
                      {item}
                    </label>
                  )
                )}
              </div>

              {(formData.penjamin === "JKN" ||
                formData.penjamin === "Asuransi Lainnya") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nomor {formData.penjamin === "JKN" ? "JKN" : "Asuransi"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="nomorAsuransi"
                    value={formData.nomorAsuransi}
                    onChange={handleChange}
                    type="text"
                    placeholder={`Masukkan nomor ${formData.penjamin === "JKN" ? "JKN" : "asuransi"}...`}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
                  />
                </div>
              )}
            </section>

            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-md font-semibold flex items-center justify-center gap-2 transition"
              >
                <UserRoundPlus size={18} /> Simpan & Daftarkan Kunjungan
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* POPUP DENGAN ANIMASI */}
      <AnimatePresence>
        {popupType && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
            variants={backdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl p-6 text-center w-[90%] max-w-md"
              variants={popup}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* CONFIRM MODAL (Tidak ada perubahan dari sebelumnya) */}
              {popupType === "confirm" && (
                <>
                  <AlertTriangle className="w-14 h-14 text-yellow-500 mx-auto mb-3" /> 
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">
                    Konfirmasi Simpan Data
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Apakah Anda yakin data yang diinput sudah benar?
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={handleConfirmSave}
                      disabled={isSubmitting}
                      className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Menyimpan..." : "Ya, Simpan"}
                    </button>
                    <button
                      onClick={handleClosePopup}
                      disabled={isSubmitting}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-5 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Batal
                    </button>
                  </div>
                </>
              )}

              {/* (MODIFIKASI) SUCCESS MODAL */}
              {popupType === "success" && (
                <>
                  <CheckCircle2 // (MODIFIKASI) Mengganti ikon
                    className="text-green-600 w-16 h-16 mx-auto mb-4 animate-bounce" // (MODIFIKASI) Menambahkan animate-bounce
                  />
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">
                    Kunjungan Tersimpan!
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Data pasien baru berhasil disimpan dan didaftarkan.
                  </p>
                  <button
                    onClick={handleCloseSuccess}
                    className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-md"
                  >
                    Oke
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
