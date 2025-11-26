// src/pages/TampilanMonitorIGD.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Stethoscope,
  FlaskRound,
  Activity,
  ClipboardList,
  Bed,
} from "lucide-react";
import logoHermina from "../../assets/logo-hermina-baru.svg";
import { supabase } from "../../supabaseClient";

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

// === Helper Functions ===
const formatDuration = (milliseconds) => {
  if (milliseconds < 0 || !milliseconds) return "00:00:00";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const formatCreatedAt = (isoString) => {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta"
  }).replace(/\./g, ':');
};

// === Komponen Kecil ===
const StafInfoBlock = ({ role, name }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 w-[240px]">
    <p className="text-xs text-gray-500 font-semibold uppercase">{role}</p>
    <p className="text-sm text-gray-800 truncate" title={name}>{name || "-"}</p>
  </div>
);

const DPJPCell = ({ dpjp, gp, perawat }) => {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <StafInfoBlock role="DPJP" name={dpjp || "-"} />
      <StafInfoBlock role="GP" name={gp || "-"} />
      <StafInfoBlock role="Perawat/Bidan" name={perawat || "-"} />
    </div>
  );
};

const ProsesSteps = ({ currentStep, createdAt, stepTimestamps, keputusanAkhir, totalSteps = 6 }) => {
  const [stepData, setStepData] = useState({});

  useEffect(() => {
    const timestampsFromDb = stepTimestamps || {};
    let newStepData = {};
    let lastEndTime = new Date(createdAt);

    // Filter tahap 6 jika keputusan akhir bukan rawat inap
    const effectiveTotalSteps = keputusanAkhir === "rawat" ? totalSteps : 5;

    for (let i = 1; i <= effectiveTotalSteps; i++) {
      const stepKey = `tahap_${i}`;
      const dbData = timestampsFromDb[stepKey];

      if (dbData) {
        newStepData[i] = {
          status: dbData.status || (dbData.end_time ? "completed" : "in_progress"),
          startTime: new Date(dbData.start_time),
          endTime: dbData.end_time ? new Date(dbData.end_time) : null,
        };
        lastEndTime = dbData.end_time ? new Date(dbData.end_time) : new Date(dbData.start_time);
      } else {
        if (i === currentStep) {
          newStepData[i] = { status: "in_progress", startTime: lastEndTime, endTime: null };
        } else {
          newStepData[i] = { status: "pending", startTime: null, endTime: null };
        }
      }
    }

    if (currentStep === 1 && !timestampsFromDb["tahap_1"]) {
      newStepData[1] = { status: "in_progress", startTime: new Date(createdAt), endTime: null };
    }

    setStepData(newStepData);
  }, [currentStep, createdAt, stepTimestamps, keputusanAkhir, totalSteps]);

  const effectiveTotalSteps = keputusanAkhir === "rawat" ? totalSteps : 5;

  return (
    <div className="flex items-center space-x-2">
      {Array.from({ length: effectiveTotalSteps }).map((_, index) => {
        const step = index + 1;
        const data = stepData[step];
        if (!data) return null;

        if (data.status === 'completed') {
          return (
            <div key={step} className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
              <Check size={16} strokeWidth={3} />
            </div>
          );
        }
        if (data.status === 'in_progress') {
          return (
            <div key={step} className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-base font-bold">
              {step}
            </div>
          );
        }
        return (
          <div key={step} className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-base font-bold border border-gray-300">
            {step}
          </div>
        );
      })}
    </div>
  );
};

const PasienCell = ({ initial }) => (
  <div className="flex items-center">
    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base border border-blue-300 flex-shrink-0">
      {initial}
    </div>
  </div>
);

const timerColorMap = {
  red: "bg-red-600 text-white",
  yellow: "bg-yellow-400 text-gray-900",
  green: "bg-green-600 text-white",
};

// === (MODIFIKASI) Alur Proses ===
const alurSteps = [
  { id: 1, title: "Pendaftaran & Pemeriksaan", icon: ClipboardCheck },
  { id: 2, title: "Pemeriksaan Dokter IGD", icon: Stethoscope },
  { id: 3, title: "Pemeriksaan Penunjang", icon: FlaskRound }, // <-- Diubah (sesuai DetailPasienSlideIn)
  { id: 4, title: "Tindakan & Pengobatan", icon: Activity },    // <-- Diubah (sesuai DetailPasienSlideIn)
  { id: 5, title: "Keputusan Akhir Pasien", icon: ClipboardList }, // <-- Diubah (sesuai DetailPasienSlideIn)
  { id: 6, title: "Disposisi Ruangan", icon: Bed },            // <-- (BARU)
];
// --- Akhir Modifikasi ---

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction < 0 ? "100%" : "-100%", opacity: 0 }),
};

// TotalLiveTimer Component untuk menampilkan timer real-time
const TotalLiveTimer = ({ startTime, triase }) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [esiSettings, setEsiSettings] = useState(null);

  useEffect(() => {
    const fetchEsiSettings = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/v2/settings`);
        if (response.ok) {
          const data = await response.json();
          setEsiSettings({
            kuningJam: data.esi_kuning_jam,
            kuningMenit: data.esi_kuning_menit,
            merahJam: data.esi_merah_jam,
            merahMenit: data.esi_merah_menit
          });
        }
      } catch (error) {
        devError('Error loading ESI settings:', error);
      }
    };
    fetchEsiSettings();
  }, []);

  useEffect(() => {
    if (!startTime) return;
    const startMs = new Date(startTime).getTime();
    const updateTimer = () => {
      setElapsedMs(Date.now() - startMs);
    };
    updateTimer(); 
    const interval = setInterval(updateTimer, 1000); 
    return () => clearInterval(interval); 
  }, [startTime]);

  const totalMinutes = elapsedMs / 60000;
  let colorKey = "green";
  
  if (esiSettings) {
    const kuningMinutes = (parseInt(esiSettings.kuningJam) || 0) * 60 + (parseInt(esiSettings.kuningMenit) || 0);
    const merahMinutes = (parseInt(esiSettings.merahJam) || 0) * 60 + (parseInt(esiSettings.merahMenit) || 0);
    
    if (totalMinutes > merahMinutes) {
      colorKey = "red";
    } else if (totalMinutes > kuningMinutes) {
      colorKey = "yellow";
    }
  } else {
    if (totalMinutes > 120) {
      colorKey = "red";
    } else if (totalMinutes > 60) {
      colorKey = "yellow";
    }
  }
  
  const styleClass = timerColorMap[colorKey];

  return (
    <div className={`flex items-center justify-center font-bold text-3xl whitespace-nowrap ${styleClass} py-7 px-5 rounded-2xl w-full h-full shadow-md`}>
      {formatDuration(elapsedMs)}
    </div>
  );
};

// === Komponen Utama ===
export default function TampilanMonitorIGD({ unit }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pasienAktif, setPasienAktif] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data real-time dari API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/public/monitor`);
        if (!response.ok) throw new Error("Gagal mengambil data kunjungan");
        const data = await response.json();
        
        // Filter hanya pasien aktif dan sesuai unit
        let aktif = data.filter(
          (k) => k.status_kunjungan && k.status_kunjungan.toLowerCase() === "aktif"
        );
        if (unit === "kamala") {
          aktif = aktif.filter(
            (k) => k.penjamin && k.penjamin.toLowerCase() === "jkn"
          );
        } else if (unit === "padma") {
          aktif = aktif.filter(
            (k) => k.penjamin && ["umum", "asuransi lainnya"].includes(k.penjamin.toLowerCase())
          );
        }
        setPasienAktif(aktif);
      } catch (error) {
        devError("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Polling interval untuk memastikan data selalu update (setiap 5 detik)
    const pollingInterval = setInterval(() => {
      fetchData();
    }, 5000);
    
    // Subscribe ke realtime changes dari Supabase
    const channel = supabase
      .channel(`monitor-kunjungan-changes-${unit || 'all'}`)
      .on(
        'postgres_changes',
        { 
          event: '*',
          schema: 'public', 
          table: 'kunjungan'
        },
        (payload) => {
          devLog('Perubahan terdeteksi di Monitor IGD!', payload);
          fetchData(); // Refresh data saat ada perubahan
        }
      )
      .subscribe();
    
    return () => {
      clearInterval(pollingInterval);
      supabase.removeChannel(channel);
    };
  }, [unit]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [[page, direction], setPage] = useState([1, 0]);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(pasienAktif.length / itemsPerPage);
  const currentItems = pasienAktif.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  useEffect(() => {
    if (totalPages <= 1) return;
    const interval = setInterval(() => {
      setPage(([p]) => [(p % totalPages) + 1, 1]);
    }, 10000);
    return () => clearInterval(interval);
  }, [totalPages]);

  const formattedDate = currentTime.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = currentTime
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
    .replace(/\./g, ":");

  // Helper untuk mendapatkan border color berdasarkan triase
  const getTriaseBorderColor = (triase) => {
    const triaseKey = triase?.toLowerCase() || "default";
    const colorMap = {
      resusitasi: "border-red-500",
      emergency: "border-yellow-400",
      semi: "border-green-500",
      default: "border-gray-300",
    };
    return colorMap[triaseKey] || colorMap.default;
  };

  // Helper untuk mendapatkan status penunjang
  const getStatusPenunjang = (kunjungan) => {
    const currentStep = kunjungan.current_step || 1;
    
    // Jika masih di tahap <= 3, tampilkan "Belum Melakukan Pemeriksaan"
    if (currentStep <= 3) {
      return "Belum Melakukan Pemeriksaan";
    }
    
    // Jika sudah melewati tahap 3, cek apakah skip atau tidak
    if (kunjungan.pemeriksaan_penunjang?.skip) {
      return "Tidak Melakukan Pemeriksaan";
    }
    
    return "Sudah Melakukan Pemeriksaan";
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen p-5 flex flex-col gap-5">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between bg-white p-5 rounded-xl shadow-sm">
        <div className="flex items-center space-x-4">
          <img src={logoHermina} alt="Hermina" className="w-16 h-16 rounded-full bg-green-50 p-1" />
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            Dashboard IGD
            {unit === 'kamala' && (
              <span className="px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-m font-bold border border-pink-300 shadow-md">Kamala</span>
            )}
            {unit === 'padma' && (
              <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-m font-bold border border-purple-400 shadow-md">Padma</span>
            )}
          </h1>
        </div>
        <div className="text-right mt-2 md:mt-0">
          <p className="text-2xl font-medium text-gray-600">
            {formattedDate} {formattedTime}
          </p>
        </div>
      </header>

      {/* Alur Proses (Menggunakan alurSteps yang sudah dimodifikasi) */}
      <div className="bg-white p-5 rounded-lg shadow-sm">
        <h3 className="text-2xl font-semibold text-gray-800 mb-5">Alur Proses Pasien</h3>
        {/* --- (MODIFIKASI) Layout Alur Proses --- */}
        <div className="flex justify-between items-center">
          {alurSteps.map((s) => (
            <div 
              key={s.id} 
              // (MODIFIKASI) Hapus flex-1 dan min-w-0
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-base font-bold flex-shrink-0">
                {s.id}
              </div>
              <s.icon size={22} className="text-green-600 flex-shrink-0" />
              <span 
                // (MODIFIKASI) Hapus truncate, tambah whitespace-nowrap
                className="text-lg font-medium text-gray-800 whitespace-nowrap" 
                title={s.title}
              >
                {s.title}
              </span>
            </div>
          ))}
        </div>
        {/* --- Akhir Modifikasi --- */}
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="bg-white text-base text-gray-700 uppercase font-semibold border-b border-gray-200 hidden sm:block">
          <div className="flex items-stretch justify-between">
            <div className="flex items-center px-6 py-5 gap-5">
              <div className="w-[160px] pl-2">Tanggal Masuk</div>
              <div className="w-[75px] text-center">Pasien</div>
              <div className="w-[780px] text-center">Petugas Medis</div>
              <div className="w-[270px]">Penunjang</div>
              <div className="w-[210px] text-center">Proses</div>
            </div>
            <div className="w-[250px] flex items-center justify-center">Timer</div>
          </div>
        </div>

        {/* Isi */}
        <div className="relative overflow-hidden flex-1">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "tween", ease: "easeInOut", duration: 0.6 }}
            >
              {currentItems.length > 0 ? (
                currentItems.map((kunjungan) => {
                  const namaParts = kunjungan.pasien.nama.split(" ");
                  const initial = namaParts.length <= 3
                    ? namaParts.map((n) => n[0]).join("").toUpperCase()
                    : namaParts.slice(0, 3).map((n) => n[0]).join("").toUpperCase();
                  const tglMasuk = formatCreatedAt(kunjungan.created_at);
                  const borderColorClass = getTriaseBorderColor(kunjungan.triase);
                  const statusPenunjang = getStatusPenunjang(kunjungan);

                  return (
                    <div key={kunjungan.id} className="flex justify-between border-b border-gray-200 items-stretch py-3">
                      <div className="flex items-center px-6 py-5 gap-5">
                        <div className={`font-medium text-lg text-gray-800 border-l-4 ${borderColorClass} pl-3 w-[160px]`}>
                          {tglMasuk}
                        </div>
                        <div className="w-[75px] flex justify-center">
                          <PasienCell initial={initial} />
                        </div>
                        <div className="w-[780px]">
                          <DPJPCell 
                            dpjp={kunjungan.dpjp}
                            gp={kunjungan.gp}
                            perawat={kunjungan.perawat}
                          />
                        </div>
                        
                        {/* Status Penunjang */}
                        <div className="w-[270px] text-base truncate" title={statusPenunjang}>
                          {statusPenunjang}
                        </div>

                        <div className="w-[210px] flex justify-center">
                          <ProsesSteps 
                            currentStep={kunjungan.current_step || 1}
                            createdAt={kunjungan.created_at}
                            stepTimestamps={kunjungan.step_timestamps}
                            keputusanAkhir={kunjungan.keputusan_akhir}
                          />
                        </div>
                      </div>
                      <div className="w-[250px] flex items-stretch px-5">
                        <TotalLiveTimer 
                          startTime={kunjungan.created_at}
                          triase={kunjungan.triase}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-gray-500">
                  Tidak ada pasien aktif saat ini.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pagination */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <span className="text-base text-gray-700">
            Halaman <b>{page}</b> dari <b>{totalPages}</b>
          </span>
          <button onClick={() => setPage(([p]) => [(p % totalPages) + 1, 1])} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-md">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
