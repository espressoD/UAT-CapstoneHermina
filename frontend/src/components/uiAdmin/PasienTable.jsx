// src/components/uiAdmin/PasienTable.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Check, 
  Search,
  Timer,
  CheckCircle2,
  Paperclip,
  Circle,
  AlertTriangle,
  Bell,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Helper untuk format durasi (Tidak berubah) ---
const formatDuration = (milliseconds) => {
  if (milliseconds < 0 || !milliseconds) return "00:00:00";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor((totalSeconds / 3600) % 24);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// --- Komponen StepTimer (Kolom 5) ---
// 🚀 PERBAIKAN: Logika timer 'in_progress' dibuat live + alarm
const StepTimer = ({ status, startTime, endTime, stepNumber, isOverLimit }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval = null;
    
    if (status === 'in_progress' && startTime) {
      const startMs = new Date(startTime).getTime();
      
      const updateTimer = () => {
        setElapsedTime(Date.now() - startMs);
      };
      
      updateTimer();
      interval = setInterval(updateTimer, 1000);

    } else if (status === 'completed' && startTime && endTime) {
      const startMs = new Date(startTime).getTime();
      const endMs = new Date(endTime).getTime();
      setElapsedTime(endMs - startMs);
    } else {
      setElapsedTime(0);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status, startTime, endTime]);

  // Ubah warna jadi merah jika melebihi batas waktu
  const timerColor = 
    (status === 'in_progress' && isOverLimit) ? "text-red-600 font-bold animate-pulse" :
    status === 'in_progress' ? "text-blue-600 font-bold" :
    status === 'completed' ? "text-gray-500" :
    "text-gray-400";

  return (
    <div className={`flex items-center space-x-1 font-medium ${timerColor}`}>
      <Timer size={12} />
      <span>{formatDuration(elapsedTime)}</span>
    </div>
  );
};

// --- timerColorMap (Tidak berubah) ---
const timerColorMap = {
  red: "bg-red-600 text-white",
  yellow: "bg-yellow-400 text-gray-900",
  green: "bg-green-600 text-white",
  black: "bg-black text-white",
};


// --- Komponen TotalLiveTimer (Kolom 6) ---
// Timer dengan pengaturan batas waktu berdasarkan kategori triase
const TotalLiveTimer = ({ startTime, triase, unit = "kamala" }) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [esiSettings, setEsiSettings] = useState(null);

  // Load pengaturan ESI dari database via API
  useEffect(() => {
    const fetchEsiSettings = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/v2/settings`);
        if (response.ok) {
          const data = await response.json();
          // Load unit-specific ESI settings
          const unitKey = unit.toLowerCase() === "padma" ? "esi_padma" : "esi_kamala";
          if (data[unitKey]) {
            setEsiSettings({
              kuningJam: data[unitKey].kuningJam,
              kuningMenit: data[unitKey].kuningMenit,
              merahJam: data[unitKey].merahJam,
              merahMenit: data[unitKey].merahMenit
            });
          } else if (data.esi_kuning_jam !== undefined) {
            // Fallback to old settings if unit-specific not found
            setEsiSettings({
              kuningJam: data.esi_kuning_jam,
              kuningMenit: data.esi_kuning_menit,
              merahJam: data.esi_merah_jam,
              merahMenit: data.esi_merah_menit
            });
          }
        }
      } catch (error) {
        console.error('Error loading ESI settings:', error);
      }
    };
    fetchEsiSettings();
  }, [unit]);

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
  
  // Jika ada pengaturan ESI, gunakan batas waktu dari settings
  if (esiSettings) {
    const kuningMinutes = (parseInt(esiSettings.kuningJam) || 0) * 60 + (parseInt(esiSettings.kuningMenit) || 0);
    const merahMinutes = (parseInt(esiSettings.merahJam) || 0) * 60 + (parseInt(esiSettings.merahMenit) || 0);
    
    if (totalMinutes > merahMinutes) {
      colorKey = "red";
    } else if (totalMinutes > kuningMinutes) {
      colorKey = "yellow";
    }
  } else {
    // Default jika tidak ada settings (fallback ke nilai lama)
    if (totalMinutes > 120) {
      colorKey = "red";
    } else if (totalMinutes > 60) {
      colorKey = "yellow";
    }
  }
  
  const styleClass = timerColorMap[colorKey];

  return (
    <div 
      className={`flex items-center justify-center font-bold text-lg whitespace-nowrap ${styleClass} py-2 rounded-md`}
    >
      {formatDuration(elapsedMs)}
    </div>
  );
};

// --- (Helper-helper lain tidak berubah) ---
// 🚀 PERBAIKAN: Hapus monthMap dan parseTglString, kita tidak membutuhkannya lagi
/*
const monthMap = { ... };
const parseTglString = (tgl) => { ... };
*/

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
const StafInfoBlock = ({ role, name }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5">
    <p className="text-[10px] text-gray-500 font-semibold uppercase">{role}</p>
    <p className="text-xs text-gray-800">{name || "-"}</p>
  </div>
);
const DPJPCell = ({ dpjp, gp, perawat }) => {
  if (!dpjp && !gp && !perawat) {
    return <span className="text-gray-400">-</span>;
  }
  return (
    <div className="space-y-1.5">
      {dpjp && <StafInfoBlock role="DPJP" name={dpjp} />}
      {gp && <StafInfoBlock role="GP" name={gp} />}
      {perawat && <StafInfoBlock role="Perawat/Bidan" name={perawat} />}
    </div>
  );
};

const ProsesSteps = ({ currentStep, createdAt, stepTimestamps, totalSteps = 6, onAlarmTriggered, kunjunganId, pasienNama, unit = "kamala" }) => {
  const [stepData, setStepData] = useState({});
  const [batasWaktu, setBatasWaktu] = useState(null);

  // Load batas waktu dari database via API
  useEffect(() => {
    const fetchBatasWaktu = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/v2/settings`);
        if (response.ok) {
          const data = await response.json();
          // Load unit-specific timing settings
          const unitKey = unit.toLowerCase() === "padma" ? "batas_waktu_padma" : "batas_waktu_kamala";
          if (data[unitKey]) {
            setBatasWaktu(data[unitKey]);
          } else if (data.batas_waktu_tahap) {
            // Fallback to old settings if unit-specific not found
            setBatasWaktu(data.batas_waktu_tahap);
          }
        }
      } catch (error) {
        console.error('Error loading batas waktu:', error);
      }
    };
    fetchBatasWaktu();
  }, [unit]);

  useEffect(() => {
    const timestampsFromDb = stepTimestamps || {};
    let newStepData = {};
    let lastEndTime = new Date(createdAt);

    for (let i = 1; i <= totalSteps; i++) {
      const stepKey = `tahap_${i}`;
      const dbData = timestampsFromDb[stepKey];

      if (dbData && dbData.start_time) {
        newStepData[i] = {
          status: dbData.status || (dbData.end_time ? "completed" : "in_progress"),
          startTime: new Date(dbData.start_time),
          endTime: dbData.end_time ? new Date(dbData.end_time) : null,
        };
        lastEndTime = dbData.end_time ? new Date(dbData.end_time) : new Date(dbData.start_time);
      } else {
        if (i === currentStep) {
          newStepData[i] = { status: "in_progress", startTime: lastEndTime, endTime: null };
        } else if (i < currentStep) {
          newStepData[i] = { status: "completed", startTime: lastEndTime, endTime: lastEndTime };
        } else {
          newStepData[i] = { status: "pending", startTime: null, endTime: null };
        }
      }
    }

    if (currentStep === 1 && !timestampsFromDb["tahap_1"]) {
      newStepData[1] = { status: "in_progress", startTime: new Date(createdAt), endTime: null };
    }

    setStepData(newStepData);
  }, [currentStep, createdAt, stepTimestamps, totalSteps]);

  // Cek apakah ada tahap yang melebihi batas waktu
  useEffect(() => {
    if (!batasWaktu) return;

    const interval = setInterval(() => {
      for (let i = 1; i <= totalSteps; i++) {
        const data = stepData[i];
        if (data && data.status === 'in_progress' && data.startTime) {
          const elapsedMinutes = (Date.now() - new Date(data.startTime).getTime()) / 60000;
          const limitMinutes = batasWaktu[`tahap${i}`] || 30;
          
          if (elapsedMinutes > limitMinutes) {
            onAlarmTriggered({
              kunjunganId,
              pasienNama,
              tahap: i,
              elapsedMinutes: Math.floor(elapsedMinutes),
              limitMinutes
            });
          }
        }
      }
    }, 5000); // Cek setiap 5 detik

    return () => clearInterval(interval);
  }, [stepData, batasWaktu, totalSteps, onAlarmTriggered, kunjunganId, pasienNama]);

  // Cek apakah tahap melebihi batas waktu
  const isStepOverLimit = (step, data) => {
    if (!batasWaktu || data.status !== 'in_progress' || !data.startTime) return false;
    const elapsedMinutes = (Date.now() - new Date(data.startTime).getTime()) / 60000;
    const limitMinutes = batasWaktu[`tahap${step}`] || 30;
    return elapsedMinutes > limitMinutes;
  };

  return (
    <div className="space-y-1">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1;
        const data = stepData[step];
        if (!data) return null;
        
        const isOverLimit = isStepOverLimit(step, data);
        
        return (
          <div key={step} className="flex items-center space-x-2 text-xs">
            <div>
              {(() => {
                if (data.status === 'completed') {
                  return (
                    <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  );
                }
                if (data.status === 'in_progress') {
                  const bgColor = isOverLimit ? "bg-red-600 animate-pulse" : "bg-blue-500";
                  return (
                    <div className={`w-5 h-5 rounded-full ${bgColor} text-white flex items-center justify-center text-xs font-bold`}>
                      {step}
                    </div>
                  );
                }
                return (
                  <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold border border-gray-300">
                    {step}
                  </div>
                );
              })()}
            </div>
            
            <StepTimer 
              status={data.status}
              startTime={data.startTime}
              endTime={data.endTime}
              stepNumber={step}
              isOverLimit={isOverLimit}
            />
          </div>
        );
      })}
    </div>
  );
};

const PasienCell = ({ initial, medrec, nomorAntrian }) => (
  <div className="flex items-center space-x-3 max-w-[220px] overflow-hidden">
    {/* 1. Avatar Inisial (Tidak berubah) */}
    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-300 flex-shrink-0">
      {initial}
    </div>
    
    {/* 2. Blok Teks (Desain Baru) */}
    <div className="overflow-hidden">
      
      {/* Nomor Antrian (Teks Utama, Tebal) */}
      <div 
        className="text-sm font-semibold text-gray-900 truncate" 
        title={nomorAntrian}
      >
        {nomorAntrian || "..."}
      </div>
      
      {/* Medrec (Sub-teks, Abu-abu, Lebih Kecil) */}
      <div 
        className="text-xs text-gray-500 truncate" 
        title={medrec}
      >
        RM: {medrec}
      </div>
    
    </div>
  </div>
);

// --- (triaseBorderMap tidak berubah) ---
const triaseBorderMap = {
  resusitasi: "border-red-500", 
  emergency: "border-yellow-400",
  semi: "border-green-500", 
  default: "border-gray-300", 
};


// --- Komponen utama ---
export default function PasienTable({ data, onPatientSelect, unit = "kamala" }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [alarmNotifications, setAlarmNotifications] = useState([]);
  const [activeAlarms, setActiveAlarms] = useState(new Set());
  const [dismissedAlarms, setDismissedAlarms] = useState(new Map());
  const audioRef = useRef(null);

  // Initialize alarm audio
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxncsBS2AzvLaiTcIGWi77eeeSRANUKXi8LZjHAU3kdfyzHksBS15yO/dkEILFF604Ouqgw0KRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0ALFFy06OyqWBUJRp/h8sBvIQU0h9DyzHksBS16ye/dj0AL');
    audioRef.current.loop = true;
  }, []);

  // Handle alarm triggered
  const handleAlarmTriggered = (alarmData) => {
    const alarmKey = `${alarmData.kunjunganId}-${alarmData.tahap}`;
    
    // Cek apakah alarm ini sudah aktif
    if (activeAlarms.has(alarmKey)) return;

    // Cek apakah alarm ini baru saja di-dismiss (dalam 3 menit)
    const dismissedTime = dismissedAlarms.get(alarmKey);
    if (dismissedTime) {
      const timeSinceDismissed = Date.now() - dismissedTime;
      const threeMinutesMs = 3 * 60 * 1000; // 3 menit dalam milliseconds
      if (timeSinceDismissed < threeMinutesMs) {
        return; // Skip alarm, masih dalam periode 3 menit
      }
    }

    // Tambah ke active alarms
    setActiveAlarms(prev => new Set(prev).add(alarmKey));

    // Tambah notifikasi
    setAlarmNotifications(prev => {
      const exists = prev.some(n => n.kunjunganId === alarmData.kunjunganId && n.tahap === alarmData.tahap);
      if (exists) return prev;
      return [...prev, { ...alarmData, id: alarmKey, timestamp: Date.now() }];
    });

    // Play alarm sound
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(err => console.error('Error playing alarm:', err));
    }
  };

  // Stop alarm dan tutup notifikasi
  const handleDismissAlarm = (alarmId) => {
    // Simpan waktu dismiss untuk snooze 3 menit
    setDismissedAlarms(prev => {
      const newMap = new Map(prev);
      newMap.set(alarmId, Date.now());
      return newMap;
    });

    setAlarmNotifications(prev => prev.filter(n => n.id !== alarmId));
    setActiveAlarms(prev => {
      const newSet = new Set(prev);
      newSet.delete(alarmId);
      return newSet;
    });

    // Stop alarm jika tidak ada notifikasi lagi
    if (alarmNotifications.length <= 1 && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const filteredData = useMemo(() => {
    if (!data) return [];

    // Logika filter untuk 'medrec' dan 'nama pasien'
    const query = searchQuery.toLowerCase();

    return data.filter((kunjungan) => {
      // Jika search bar KOSONG, tampilkan semua
      if (!query) {
        return true;
      }

      // Ambil data medrec dan nama pasien
      const medrec = kunjungan.pasien?.medrec;
      const nama = kunjungan.pasien?.nama;

      // Filter berdasarkan medrec ATAU nama pasien
      const medrecMatch = medrec && String(medrec).toLowerCase().includes(query);
      const namaMatch = nama && String(nama).toLowerCase().includes(query);
      
      return medrecMatch || namaMatch;
    });
  }, [data, searchQuery]);


  return (
    <>
      {/* Alarm Notifications Popup */}
      <AnimatePresence>
        {alarmNotifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 space-y-2"
          >
            {alarmNotifications.map(notif => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className="bg-red-600 text-white rounded-lg shadow-2xl p-4 min-w-[320px] flex items-start gap-3 animate-pulse"
              >
                <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-sm mb-1 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    ALARM - Waktu Melebihi Batas!
                  </div>
                  <div className="text-sm">
                    <div><strong>Pasien:</strong> {notif.pasienNama}</div>
                    <div><strong>Tahap:</strong> {notif.tahap}</div>
                    <div><strong>Waktu:</strong> {notif.elapsedMinutes} menit (Batas: {notif.limitMinutes} menit)</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDismissAlarm(notif.id)}
                  className="text-white hover:bg-red-700 rounded p-1 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* 🔍 Search */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center space-x-2">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Cari medrec atau nama pasien..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm bg-transparent focus:outline-none placeholder-gray-400"
          />
      </div>

      {/* 🧭 Header (Tidak berubah) */}
      <div className="bg-gray-50 text-xs text-gray-700 uppercase font-semibold sticky top-0 z-10 shadow-sm hidden sm:block">
        <div className="grid grid-cols-[1.3fr_2fr_2fr_2fr_1.5fr_1fr] gap-x-6 px-5 py-3">
          <div className="pl-1">Tanggal Masuk</div>
          <div>Pasien (No. Kunjungan & Medrec)</div> {/* Judul kolom disesuaikan */}
          <div>DPJP</div>
          <div>Penunjang</div>
          <div>Proses</div>
          <div className="text-center">Timer</div>
        </div>
      </div>

      {/* 📋 Isi Data */}
      <div className="overflow-y-auto max-h-[900px] divide-y divide-gray-200">
        {filteredData.map((kunjungan) => {
          const tglMasuk = formatCreatedAt(kunjungan.created_at);
          const initial = kunjungan.pasien.nama // 'initial' tetap dari nama
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 3)
            .toUpperCase();
          
          const triaseKey = kunjungan.triase || "default";
          const borderColorClass = triaseBorderMap[triaseKey] || triaseBorderMap.default;
          
          return (
            <div
              key={kunjungan.id}
              className={`grid grid-cols-1 sm:grid-cols-[1.3fr_2fr_2fr_2fr_1.5fr_1fr] gap-x-6 px-5 py-4 hover:bg-gray-100 transition-colors cursor-pointer`}
              onClick={() => onPatientSelect(kunjungan)}
            >
              {/* Kolom 1 - Tanggal */}
              <div
                className={`font-medium text-gray-800 border-l-4 ${borderColorClass} pl-2`}
              >
                {tglMasuk}
              </div>

              {/* Kolom 2 - Pasien */}
              <div>
              <PasienCell 
              initial={initial} 
              medrec={kunjungan.pasien.medrec}
              nomorAntrian={kunjungan.nomor_antrian}
              />
              </div>
              {/* Kolom 3 - DPJP (Data Real) */}
              <div>
                <DPJPCell 
                  dpjp={kunjungan.dpjp} 
                  gp={kunjungan.gp}
                  perawat={kunjungan.perawat}
                />
              </div>

              {/* Kolom 4 - Penunjang (Status Pemeriksaan) */}
              <div className="text-xs truncate" title={
                (() => {
                  const currentStep = kunjungan.current_step || 1;
                  if (currentStep <= 3) return "Belum Melakukan Pemeriksaan";
                  return kunjungan.pemeriksaan_penunjang?.skip 
                    ? "Tidak Melakukan Pemeriksaan" 
                    : "Sudah Melakukan Pemeriksaan";
                })()
              }>
                {(() => {
                  const currentStep = kunjungan.current_step || 1;
                  if (currentStep <= 3) return "Belum Melakukan Pemeriksaan";
                  return kunjungan.pemeriksaan_penunjang?.skip 
                    ? "Tidak Melakukan Pemeriksaan" 
                    : "Sudah Melakukan Pemeriksaan";
                })()}
              </div>

              {/* Kolom 5 - Proses (Data Real, pakai StepTimer) */}
              <div className="mt-2 sm:mt-0">
                <ProsesSteps 
                  currentStep={kunjungan.current_step || 1}
                  createdAt={kunjungan.created_at}
                  stepTimestamps={kunjungan.step_timestamps}
                  onAlarmTriggered={handleAlarmTriggered}
                  kunjunganId={kunjungan.id}
                  pasienNama={kunjungan.pasien.nama}
                  unit={unit}
                />
              </div>

              {/* Kolom 6 - Timer (Tidak berubah) */}
              <TotalLiveTimer 
                startTime={kunjungan.created_at}
                triase={kunjungan.triase}
                unit={unit}
              />
            </div>
          );
        })}

        {filteredData.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            {searchQuery ? "Pasien dengan medrec atau nama tersebut tidak ditemukan." : "Tidak ada pasien aktif."}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
