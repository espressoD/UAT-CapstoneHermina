// src/pages/pagesAdmin/DashboardAdmin.jsx
import { useState, useEffect, useMemo, useRef } from "react"; // 🚀 Tambah useRef
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Plus } from "lucide-react";

import { supabase } from "../../supabaseClient";
import AdminHeader from "../../components/uiAdmin/AdminHeader";
import InfoSection from "../../components/uiAdmin/InfoSection";
import AlurProses from "../../components/uiAdmin/AlurProses";
import PasienTable from "../../components/uiAdmin/PasienTable";
import DetailPasienSlideIn from "../../components/uiAdmin/DetailPasienSlideIn";
import PasienSelesai from "./PasienSelesai";
import { useAuth } from "../../context/AuthContext";
import AdminInfoSkeleton from "../../components/ui/AdminInfoSkeleton";

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

export default function DashboardAdmin({ unit = "Padma", hideUnitTabs = false, showHeader = true }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("aktif");
  const { session, userProfile, loading: authLoading } = useAuth();

  // Determine initial unit and tab visibility based on user role
  const getInitialUnit = () => {
    if (userProfile?.role === 'perawat_kamala') return 'Kamala';
    if (userProfile?.role === 'perawat_padma') return 'Padma';
    return unit;
  };

  const shouldHideUnitTabs = () => {
    // Hide tabs for perawat roles or when explicitly set
    return hideUnitTabs || userProfile?.role === 'perawat_kamala' || userProfile?.role === 'perawat_padma';
  };

  const [activeUnit, setActiveUnit] = useState(getInitialUnit()); // Default dari prop atau role
  const [jenisFilter, setJenisFilter] = useState(""); // State filter jenis pasien
  const [keputusanAkhirFilter, setKeputusanAkhirFilter] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  const [allKunjungan, setAllKunjungan] = useState([]);

  const [perawatList, setPerawatList] = useState([]);
  const [dokterGpList, setDokterGpList] = useState([]);
  const [dokterDpjpList, setDokterDpjpList] = useState([]);
  const [petugasJagaKey, setPetugasJagaKey] = useState(0); // Key untuk force re-render PetugasJagaCard
  const [headerReady, setHeaderReady] = useState(false);
  const isHeaderReadySet = useRef(false); // Ref untuk mencegah multiple updates
  const hasFetchedData = useRef(false); // Ref untuk mencegah double fetch

  // Effect terpisah untuk track header ready state
  useEffect(() => {
    if (!authLoading && userProfile && !isHeaderReadySet.current) {
      setHeaderReady(true);
      isHeaderReadySet.current = true; // Tandai sudah di-set
      devLog("Header ready set to true");
    }
  }, [authLoading, userProfile]);

  // Effect untuk set activeUnit berdasarkan role saat userProfile berubah
  useEffect(() => {
    if (userProfile) {
      if (userProfile.role === 'perawat_kamala') {
        setActiveUnit('Kamala');
      } else if (userProfile.role === 'perawat_padma') {
        setActiveUnit('Padma');
      }
    }
  }, [userProfile]);

  useEffect(() => {
    // Skip jika sudah pernah fetch dan auth masih loading
    if (hasFetchedData.current && authLoading) {
      devLog("Data sudah di-fetch dan auth masih loading, skip re-fetch");
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      // Tunggu auth selesai loading dan session tersedia
      if (authLoading) {
        devLog("Auth masih loading...");
        setLoading(false);
        return;
      }

      if (!session || !session.access_token) {
        devLog("Menunggu sesi untuk fetch data...");
        setLoading(false);
        return; // Berhenti di sini
      }

      const authHeader = {
        'Authorization': `Bearer ${session.access_token}`
      };

      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const [
          kunjunganRes,
          perawatRes,
          gpRes,
          dpjpRes
        ] = await Promise.all([
          fetch(`${API_URL}/api/v2/kunjungan?status=Aktif`, { headers: authHeader }),
          fetch(`${API_URL}/api/v2/perawat`, { headers: authHeader }),
          fetch(`${API_URL}/api/v2/dokter-gp`, { headers: authHeader }),
          fetch(`${API_URL}/api/v2/dokter-dpjp`, { headers: authHeader })
        ]);

        // Cek semua response
        if (!kunjunganRes.ok) throw new Error("Gagal mengambil data kunjungan");
        if (!perawatRes.ok) throw new Error("Gagal mengambil data perawat");
        if (!gpRes.ok) throw new Error("Gagal mengambil data dokter GP");
        if (!dpjpRes.ok) throw new Error("Gagal mengambil data dokter DPJP");

        const kunjunganResult = await kunjunganRes.json();
        const perawatData = await perawatRes.json();
        const gpData = await gpRes.json();
        const dpjpData = await dpjpRes.json();

        // Handle new response structure from backend
        const kunjunganData = kunjunganResult.data || kunjunganResult;
        setAllKunjungan(kunjunganData);
        setPerawatList(perawatData);
        setDokterGpList(gpData);
        setDokterDpjpList(dpjpData);

        // Tandai sudah fetch hanya sekali
        if (!hasFetchedData.current) {
          hasFetchedData.current = true;
          devLog("Initial data fetch complete");
        }

      } catch (error) {
        devError("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    // Hanya fetch jika belum pernah fetch ATAU session baru tersedia
    if (!hasFetchedData.current && !authLoading && session) {
      fetchData();
    }

  }, [session, authLoading]); // Keep dependencies but use ref to prevent re-fetch

  // Separate useEffect for realtime subscription
  useEffect(() => {
    if (!session?.access_token) return;

    let refetchTimeout;

    const channel = supabase
      .channel('db-kunjungan-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kunjungan'
        },
        (payload) => {
          devLog('Perubahan terdeteksi di tabel kunjungan!', payload);
          
          // Clear previous timeout untuk debounce multiple changes
          clearTimeout(refetchTimeout);
          
          // Debounce refetch dengan delay minimal (200ms) untuk batch updates
          refetchTimeout = setTimeout(async () => {
            if (!session?.access_token) return;

            try {
              const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
              const res = await fetch(`${API_URL}/api/v2/kunjungan?status=Aktif`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
              });
              if (res.ok) {
                const result = await res.json();
                const data = result.data || result;
                setAllKunjungan(data);
              }
            } catch (error) {
              devError("Error refetching kunjungan:", error);
            }
          }, 200); // Kurangi delay ke 200ms untuk faster sync antar komputer
        }
      )
      .subscribe();

    return () => {
      clearTimeout(refetchTimeout);
      supabase.removeChannel(channel);
    };
  }, [session]); // Setup subscription when session is ready

  // Realtime subscription untuk tabel settings (petugas jaga, ESI, dll)
  useEffect(() => {
    if (!session?.access_token) return;

    const settingsChannel = supabase
      .channel('db-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settings'
        },
        (payload) => {
          devLog('Perubahan terdeteksi di tabel settings!', payload);
          // Force re-render PetugasJagaCard dengan mengubah key
          setPetugasJagaKey(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
    };
  }, [session]);

  // Filter unit
  const PADMA_PENJAMIN = ["Umum", "Asuransi Lainnya"];
  const KAMALA_PENJAMIN = ["JKN"];

  const pasienAktif = useMemo(() => {
    return allKunjungan.filter(
      (k) => k.status_kunjungan && k.status_kunjungan.toLowerCase() === "aktif" &&
        (activeUnit === "Padma" ? PADMA_PENJAMIN.includes(k.penjamin) : KAMALA_PENJAMIN.includes(k.penjamin)) &&
        (!jenisFilter || k.jenis_pasien === jenisFilter)
    );
  }, [allKunjungan, activeUnit, jenisFilter]);

  const pasienSelesai = useMemo(() => {
    const now = Date.now();
    const hours168InMs = 168 * 60 * 60 * 1000; // 168 jam dalam milidetik

    const filtered = allKunjungan.filter((k) => {
      // Filter status selesai
      if (!k.status_kunjungan || k.status_kunjungan.toLowerCase() !== "selesai") {
        return false;
      }
      // Filter unit
      if (activeUnit === "Padma" && !PADMA_PENJAMIN.includes(k.penjamin)) return false;
      if (activeUnit === "Kamala" && !KAMALA_PENJAMIN.includes(k.penjamin)) return false;
      // Filter jenis pasien
      if (jenisFilter && k.jenis_pasien !== jenisFilter) return false;

      // Dapatkan waktu selesai dari step_timestamps
      const timestamps = k.step_timestamps || {};
      let waktuSelesai = null;

      // Jika pasien dihapus, ambil end_time dari step terakhir yang ada
      if (k.keputusan_akhir === "dihapus") {
        const currentStep = k.current_step || 1;
        const currentStepKey = `tahap_${currentStep}`;
        if (timestamps[currentStepKey]?.end_time) {
          waktuSelesai = new Date(timestamps[currentStepKey].end_time).getTime();
        } else if (k.updated_at) {
          waktuSelesai = new Date(k.updated_at).getTime();
        }
      }
      // Jika rawat inap, ambil dari tahap_6.end_time
      else if (k.keputusan_akhir === "rawat" && timestamps.tahap_6?.end_time) {
        waktuSelesai = new Date(timestamps.tahap_6.end_time).getTime();
      }
      // Jika bukan rawat inap, ambil dari tahap_5.end_time
      else if (timestamps.tahap_5?.end_time) {
        waktuSelesai = new Date(timestamps.tahap_5.end_time).getTime();
      }
      // Fallback ke updated_at jika tidak ada timestamp
      else if (k.updated_at) {
        waktuSelesai = new Date(k.updated_at).getTime();
      }

      // Filter hanya yang selesai dalam 168 jam terakhir
      if (waktuSelesai) {
        const selisih = now - waktuSelesai;
        return selisih <= hours168InMs;
      }

      return false;
    });

    // Sort berdasarkan waktu selesai (terbaru di atas)
    return filtered.sort((a, b) => {
      const getWaktuSelesai = (k) => {
        const timestamps = k.step_timestamps || {};
        if (k.keputusan_akhir === "dihapus") {
          const currentStep = k.current_step || 1;
          const currentStepKey = `tahap_${currentStep}`;
          if (timestamps[currentStepKey]?.end_time) {
            return new Date(timestamps[currentStepKey].end_time).getTime();
          } else if (k.updated_at) {
            return new Date(k.updated_at).getTime();
          }
        } else if (k.keputusan_akhir === "rawat" && timestamps.tahap_6?.end_time) {
          return new Date(timestamps.tahap_6.end_time).getTime();
        } else if (timestamps.tahap_5?.end_time) {
          return new Date(timestamps.tahap_5.end_time).getTime();
        } else if (k.updated_at) {
          return new Date(k.updated_at).getTime();
        }
        return 0;
      };

      return getWaktuSelesai(b) - getWaktuSelesai(a); // Descending (terbaru di atas)
    });
  }, [allKunjungan, activeUnit, jenisFilter]);

  // Statistik hanya mengikuti unit dan status aktif, tidak filter jenis pasien
  const statCounts = useMemo(() => {
    const counts = {
      "Umum": 0,
      "Anak": 0,
      "Kebidanan": 0,
    };
    allKunjungan.forEach((k) => {
      if (
        k.status_kunjungan &&
        k.status_kunjungan.toLowerCase() === "aktif" &&
        (activeUnit === "Padma"
          ? PADMA_PENJAMIN.includes(k.penjamin)
          : KAMALA_PENJAMIN.includes(k.penjamin))
      ) {
        const jenis = k.jenis_pasien ? k.jenis_pasien.trim() : null;
        if (counts.hasOwnProperty(jenis)) {
          counts[jenis]++;
        }
      }
    });
    return counts;
  }, [allKunjungan, activeUnit]);

  const handlePatientSelect = (patient) => setSelectedPatient(patient);
  const handleClosePanel = () => setSelectedPatient(null);

  const handleDataUpdated = (updatedKunjungan) => {
    setAllKunjungan((prevKunjungan) =>
      prevKunjungan.map((k) =>
        k.id === updatedKunjungan.id ? updatedKunjungan : k
      )
    );

    setSelectedPatient(updatedKunjungan);
  };

  // ... (variants & shimmer tidak berubah) ...
  const variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.25, ease: "easeIn" } },
  };
  const shimmer = "relative overflow-hidden bg-gray-200 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent";

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="mt-6 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`${shimmer} h-12 rounded-lg`} />
          ))}
        </div>
      );
    }

    return (
      <motion.div
        key={activeTab + activeUnit}
        variants={variants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="mt-6"
      >
        {activeTab === "aktif" ? (
          <PasienTable
            data={pasienAktif}
            onPatientSelect={handlePatientSelect}
            unit={activeUnit}
          />
        ) : (
          <PasienSelesai data={pasienSelesai} keputusanAkhirFilter={keputusanAkhirFilter} />
        )}
      </motion.div>
    );
  };

  return (
    <div className="relative min-h-screen">
      <div className="min-h-screen bg-gray-100 p-6 md:p-8">
        {/* HEADER - Tampilkan skeleton saat auth loading atau userProfile belum ada */}
        {!headerReady ? (
          <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
            <div className="animate-pulse flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-gray-200 rounded-full"></div>
                <div className="h-5 w-32 bg-gray-200 rounded"></div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-4 w-48 bg-gray-200 rounded"></div>
                <div className="h-10 w-40 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          </div>
        ) : (
          <AdminHeader activeUnit={shouldHideUnitTabs() ? activeUnit : null} />
        )}

        {/* 🚀 STAT & PETUGAS JAGA (BUAT STATS DINAMIS) */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`${shimmer} h-24 rounded-lg`} />
              ))}
            </div>
            <div className={`${shimmer} h-48 rounded-lg`} />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mt-6"
          >
            <InfoSection 
              statCounts={statCounts}
              petugasJagaKey={petugasJagaKey}
              perawatData={perawatList}
              dokterGpData={dokterGpList}
            />
          </motion.div>
        )}

        {/* ALUR PROSES (Tidak berubah) */}
        <div className="mt-6">
          {loading ? (
            <div className={`${shimmer} h-40 rounded-lg`} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <AlurProses />
            </motion.div>
          )}
        </div>

        {/* UNIT SELECTOR - Baris paling atas */}
        {!shouldHideUnitTabs() && (
          <div className="mt-8 flex flex-row items-center gap-4 border-b border-gray-300 pb-2">
            {/* Tombol Unit Padma */}
            <button
              onClick={() => setActiveUnit("Padma")}
              className={`px-6 py-3 rounded-lg font-bold text-base transition-all duration-200 shadow-sm ${activeUnit === "Padma"
                ? "bg-purple-500 text-white border-b-4 border-purple-700"
                : "bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700"
                }`}
              style={{ minWidth: 180 }}
            >
              Unit Padma
            </button>
            {/* Tombol Unit Kamala */}
            <button
              onClick={() => setActiveUnit("Kamala")}
              className={`px-6 py-3 rounded-lg font-bold text-base transition-all duration-200 shadow-sm ${activeUnit === "Kamala"
                ? "bg-pink-400 text-white border-b-4 border-pink-600"
                : "bg-gray-100 text-gray-700 hover:bg-pink-100 hover:text-pink-600"
                }`}
              style={{ minWidth: 180 }}
            >
              Unit Kamala
            </button>
          </div>
        )}

        {/* TAB AKTIF/SELESAI - Baris kedua */}
        <div className="mt-4 flex flex-row items-center gap-2 border-b border-gray-200 pb-1">
          <div className="flex flex-row gap-2 flex-1">
            {['aktif', 'selesai'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-all duration-200 ${activeTab === tab
                    ? "bg-green-100 text-green-700 border-b-2 border-green-600"
                    : "text-gray-500 hover:text-green-600"
                  }`}
                style={{ minWidth: 140 }}
              >
                {tab === "aktif" ? "Pasien Aktif" : "Pasien Selesai Hari Ini"}
              </button>
            ))}
          </div>
          <div className="flex flex-row justify-end items-center gap-2 flex-1">
            <select
              value={jenisFilter}
              onChange={e => setJenisFilter(e.target.value)}
              className="px-4 py-2 rounded-lg font-semibold text-sm bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ minWidth: 160 }}
            >
              <option value="">Semua Jenis Pasien</option>
              <option value="Umum">Umum</option>
              <option value="Anak">Anak</option>
              <option value="Kebidanan">Kebidanan</option>
            </select>
            {activeTab === "selesai" && (
              <select
                value={keputusanAkhirFilter}
                onChange={e => setKeputusanAkhirFilter(e.target.value)}
                className="px-4 py-2 rounded-lg font-semibold text-sm bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
                style={{ minWidth: 160 }}
              >
                <option value="">Semua Keputusan Akhir</option>
                <option value="rawat">Rawat Inap</option>
                <option value="rawat_jalan">Rawat Jalan</option>
                <option value="rujuk">Rujuk</option>
                <option value="meninggal">Meninggal</option>
                <option value="dihapus">Dihapus</option>
              </select>
            )}
          </div>
        </div>

        {/* TAB CONTENT (Sudah di-handle 'renderTabContent') */}
        <AnimatePresence mode="wait">{renderTabContent()}</AnimatePresence>
      </div>
      

      {/* SLIDE DETAIL PASIEN (Tidak berubah) */}
      <DetailPasienSlideIn
        patient={selectedPatient}
        isOpen={!!selectedPatient}
        onClose={handleClosePanel}
        onDataUpdated={handleDataUpdated}

        perawatData={perawatList}
        dokterGpData={dokterGpList}
        dokterDpjpData={dokterDpjpList}
      />
    </div>
  );
}
