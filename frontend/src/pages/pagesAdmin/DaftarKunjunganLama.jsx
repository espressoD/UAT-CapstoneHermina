// src/pages/DaftarKunjunganLama.jsx
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  UserRoundPlus,
  Phone,
  FileText,
  Info,
  CheckCircle2,
  AlertTriangle,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import logoHermina from "../../assets/logo-hermina-baru.svg";
import { useAuth } from "../../context/AuthContext";
import { getDashboardRoute } from "../../utils/navigationHelper";

export default function DaftarKunjunganLama() {
  const navigate = useNavigate();
  const { pasienId } = useParams();
  const { session, userProfile } = useAuth();

  const [jenisPasien, setJenisPasien] = useState("");

  const [pasien, setPasien] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (!pasienId) {
      console.error("Tidak ada ID Pasien di URL");
      setLoading(false);
      return;
    }

    const fetchPasienData = async () => {
      if (!session || !session.access_token) {

        if (loading) setLoading(false); 
        return;
      }

      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(
          `${API_URL}/api/v2/pasien/${pasienId}`,
          {
            headers: { // KIRIM TOKEN
            'Authorization': `Bearer ${session.access_token}`
          }
        }
        );
        if (!response.ok) {
          throw new Error("Pasien tidak ditemukan");
        }
        const data = await response.json();
        setPasien(data);
      } catch (error) {
        console.error("Error fetching pasien data:", error);
        navigate("/admin/cari-pasien");
      } finally {
        setLoading(false);
      }
    };

    fetchPasienData();
  }, [pasienId, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!jenisPasien) {
      alert("Harap pilih Jenis Pasien.");
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    setShowConfirmModal(false);

    const dataKunjunganBaru = {
      pasien_id: pasien.id,
      jenis_pasien: jenisPasien,
    };

    try {
      if (!session || !session.access_token) {
        throw new Error("Sesi Anda berakhir. Harap login ulang.");
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(
        `${API_URL}/api/v2/kunjungan`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          },
          body: JSON.stringify(dataKunjunganBaru),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Gagal menyimpan kunjungan");
      }

      setShowModal(true);
    } catch (error) {
      console.error("Error saat menyimpan kunjungan:", error);
      alert(`Terjadi kesalahan: ${error.message}`);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate(getDashboardRoute(userProfile));
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 10 },
    visible: (i = 1) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
    }),
  };
  const shimmer =
    "relative overflow-hidden bg-gray-200 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent";

  if (loading || !pasien) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header>{/* ... (Header bisa di-copy-paste) ... */}</header>
        <main className="flex-1 p-6">
          <motion.div
            key="skeleton"
            className="max-w-6xl mx-auto space-y-4"
          >
            <div className={`${shimmer} h-8 w-56 rounded-md`} />
            <div className={`${shimmer} h-40 rounded-lg`} />
            <div className={`${shimmer} h-64 rounded-lg`} />
            <div className={`${shimmer} h-10 rounded-md`} />
          </motion.div>
        </main>
      </div>
    );
  }

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
            <div className="text-sm leading-tight truncate max-w-[180px]">
              <p className="font-semibold truncate">
                {userProfile?.nama_lengkap || "Pengguna"}
                </p>
                <p className="text-green-100 text-xs">
                {userProfile?.jabatan || "Petugas"}
              </p>
              </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6">
        <motion.div
          key="content"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="max-w-6xl mx-auto bg-white rounded-lg shadow p-8"
        >
          <button
            onClick={() => navigate("/admin/cari-pasien")}
            className="flex items-center gap-2 text-sm text-green-700 hover:underline mb-4"
          >
            <ArrowLeft size={16} /> Kembali ke Pencarian
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Daftarkan Kunjungan Pasien (Lama)
          </h2>

          {/* Data Pasien (Terkunci) */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              Data Pasien (Terkunci)
              <Info size={16} className="text-gray-400" />
            </h3>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="bg-gray-200 text-gray-600 w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg">
                  {pasien.nama.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">
                    {pasien.nama}
                  </p>
                  <p className="text-sm text-gray-500">Pasien Terdaftar</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm text-gray-700 border-t sm:border-t-0 sm:border-l sm:pl-6 pt-3 sm:pt-0">
                <div className="flex items-start gap-2">
                  <FileText
                    size={16}
                    className="text-green-700 mt-0.5 flex-shrink-0"
                  />
                  <span>
                    <strong>No. RM:</strong> {pasien.medrec}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <User
                    size={16}
                    className="text-green-700 mt-0.5 flex-shrink-0"
                  />
                  <span>
                    <strong>Wali:</strong> {pasien.nama_wali || "-"}
                  </span>
                </div>
                <div className="flex items-start gap-2 sm:col-span-2">
                  <Phone
                    size={16}
                    className="text-green-700 mt-0.5 flex-shrink-0"
                  />
                  <span>
                    <strong>No. Telp Wali:</strong> {pasien.telepon_wali || "-"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Informasi Kunjungan (Form) */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 border-b border-green-700 pb-2 mb-4">
              Informasi Kunjungan Hari Ini
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Jenis Pasien */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Jenis Pasien <span className="text-red-500">*</span>
                </label>
                <select
                  value={jenisPasien}
                  onChange={(e) => setJenisPasien(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 bg-gray-50 focus:ring-2 focus:ring-green-600 focus:outline-none"
                >
                  <option value="">Pilih jenis pasien...</option>
                  <option value="Anak">Anak</option>
                  <option value="Kebidanan">Kebidanan</option>
                  <option value="Bedah">Bedah</option>
                  <option value="Non Bedah">Non Bedah</option>
                </select>
              </div>

              {/* Tombol Submit */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-md font-semibold flex items-center justify-center gap-2 transition"
                >
                  <UserRoundPlus size={18} /> Simpan & Daftarkan Kunjungan
                </button>
              </div>
            </form>
          </section>
        </motion.div>
      </main>

      {/* Modal Konfirmasi */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm text-center"
            >
              <AlertTriangle
                size={40}
                className="text-yellow-500 mx-auto mb-3"
              />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Konfirmasi Simpan Data
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                Apakah Anda yakin data yang diinput sudah benar?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={confirmSave}
                  className="bg-green-600 text-white font-medium px-6 py-2 rounded-md hover:bg-green-700 transition"
                >
                  Ya, Simpan
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="bg-gray-300 text-gray-700 font-medium px-6 py-2 rounded-md hover:bg-gray-400 transition"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Sukses */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center"
          >
            <CheckCircle2
              size={60}
              className="text-green-600 mx-auto mb-4 animate-bounce"
            />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Kunjungan Tersimpan!
            </h2>
            <p className="text-gray-600 mb-6">
              Kunjungan pasien lama berhasil disimpan.
            </p>
            <button
              onClick={handleCloseModal}
              className="bg-green-700 hover:bg-green-800 text-white font-medium px-6 py-2 rounded-md transition"
            >
              Oke
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
