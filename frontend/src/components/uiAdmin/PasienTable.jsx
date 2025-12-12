// src/components/uiAdmin/PasienTable.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Check, 
  Search,
  Timer,
  CheckCircle2,
  Paperclip,
  Circle,
  AlertTriangle,
  Bell,
  X,
  Plus,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getSettings, 
  getBedsByUnit, 
  createBed, 
  deleteBed, 
  updateKunjungan 
} from "../../config/api";

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
        const data = await getSettings();
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
        const data = await getSettings();
          // Load unit-specific timing settings
          const unitKey = unit.toLowerCase() === "padma" ? "batas_waktu_padma" : "batas_waktu_kamala";
          if (data[unitKey]) {
            setBatasWaktu(data[unitKey]);
          } else if (data.batas_waktu_tahap) {
            // Fallback to old settings if unit-specific not found
            setBatasWaktu(data.batas_waktu_tahap);
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
export default function PasienTable({ data, onPatientSelect, unit = "kamala", onDataUpdate }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [alarmNotifications, setAlarmNotifications] = useState([]);
  const [activeAlarms, setActiveAlarms] = useState(new Set());
  const [dismissedAlarms, setDismissedAlarms] = useState(new Map());
  const audioRef = useRef(null);
  
  // Local state for optimistic updates
  const [localData, setLocalData] = useState(data);
  
  // Sync local data with props data
  useEffect(() => {
    setLocalData(data);
  }, [data]);
  
  // State untuk bed management
  const [beds, setBeds] = useState([]);
  const [loadingBeds, setLoadingBeds] = useState(true);

  // State untuk modal konfirmasi delete bed
  const [deleteModal, setDeleteModal] = useState({ show: false, bedId: null, bedDbId: null });

  // State untuk drag and drop
  const [draggedPatient, setDraggedPatient] = useState(null);
  const [dragOverBed, setDragOverBed] = useState(null);

  // Load beds from database
  useEffect(() => {
    const fetchBeds = async () => {
      try {
        const bedsData = await getBedsByUnit(unit);
        
        // Sort beds berdasarkan bed_number
        const sortedBeds = bedsData.sort((a, b) => {
          if (unit.toLowerCase() === 'kamala') {
            // Kamala: sort by number
            return parseInt(a.bed_number) - parseInt(b.bed_number);
          } else {
            // Padma: sort by letter then number (A1, B1, C1...)
            return a.bed_number.localeCompare(b.bed_number);
          }
        });
        
        setBeds(sortedBeds);
        setLoadingBeds(false);
      } catch (error) {
        console.error('Error fetching beds:', error);
        setLoadingBeds(false);
      }
    };

    fetchBeds();
  }, [unit]);

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

  // Handler untuk menambah bed baru (Padma dan Kamala)
  const handleAddBed = async () => {
    let bedNumber;
    
    if (unit.toLowerCase() === 'kamala') {
      // Kamala: cari gap/nomor yang hilang, atau tambah baru di akhir
      const existingNumbers = beds
        .map(bed => parseInt(bed.bed_number))
        .filter(num => !isNaN(num))
        .sort((a, b) => a - b);
      
      // Cari nomor yang hilang (gap)
      let foundGap = false;
      for (let i = 1; i <= existingNumbers.length + 1; i++) {
        if (!existingNumbers.includes(i)) {
          bedNumber = String(i);
          foundGap = true;
          break;
        }
      }
      
      // Jika tidak ada gap, gunakan nomor berikutnya
      if (!foundGap) {
        const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
        bedNumber = String(maxNumber + 1);
      }
    } else {
      // Padma: cari gap/huruf yang hilang, atau tambah baru di akhir
      const existingLetters = beds
        .map(bed => bed.bed_number.charAt(0))
        .filter(letter => /[A-Z]/.test(letter))
        .map(letter => letter.charCodeAt(0))
        .sort((a, b) => a - b);
      
      // Cari huruf yang hilang (gap)
      let foundGap = false;
      for (let charCode = 65; charCode <= (existingLetters[existingLetters.length - 1] || 64) + 1; charCode++) {
        if (!existingLetters.includes(charCode)) {
          bedNumber = `${String.fromCharCode(charCode)}1`;
          foundGap = true;
          break;
        }
      }
      
      // Jika tidak ada gap, gunakan huruf berikutnya
      if (!foundGap) {
        const maxCharCode = existingLetters.length > 0 ? Math.max(...existingLetters) : 64;
        bedNumber = `${String.fromCharCode(maxCharCode + 1)}1`;
      }
    }
    
    try {
      const newBed = await createBed({
          bed_number: bedNumber,
          unit: unit.toLowerCase()
        });
      
      // Add new bed and sort
      const updatedBeds = [...beds, newBed].sort((a, b) => {
        if (unit.toLowerCase() === 'kamala') {
          return parseInt(a.bed_number) - parseInt(b.bed_number);
        } else {
          return a.bed_number.localeCompare(b.bed_number);
        }
      });
      
      setBeds(updatedBeds);
      
    } catch (error) {
      console.error('Error adding bed:', error);
      alert(error.message || 'Gagal menambah bed. Silakan coba lagi.');
    }
  };

  // Handler untuk klik bed kosong - navigasi ke Input Pasien Baru dengan bed number
  const handleEmptyBedClick = (bedId) => {
    // Navigate ke InputPasienBaru dengan state bed number
    navigate('/admin/input-pasien-baru', { 
      state: { 
        bedNumber: bedId,
        unit: unit 
      } 
    });
  };

  // Handler untuk menghapus bed
  const handleDeleteBed = (bed, e) => {
    // Stop propagation agar tidak trigger onClick parent (navigate)
    e.stopPropagation();
    
    // Tampilkan modal konfirmasi
    setDeleteModal({ 
      show: true, 
      bedId: bed.bed_number,
      bedDbId: bed.id 
    });
  };

  // Konfirmasi delete bed
  const confirmDeleteBed = async () => {
    try {
      await deleteBed(deleteModal.bedDbId);

      // Remove from local state
      setBeds(beds.filter(bed => bed.id !== deleteModal.bedDbId));
      setDeleteModal({ show: false, bedId: null, bedDbId: null });
      
    } catch (error) {
      console.error('Error deleting bed:', error);
      alert(error.message || 'Gagal menghapus bed. Silakan coba lagi.');
      setDeleteModal({ show: false, bedId: null, bedDbId: null });
    }
  };

  // Cancel delete bed
  const cancelDeleteBed = () => {
    setDeleteModal({ show: false, bedId: null, bedDbId: null });
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, kunjungan) => {
    setDraggedPatient(kunjungan);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget);
  };

  const handleDragOver = (e, bedId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverBed(bedId);
  };

  const handleDragLeave = () => {
    setDragOverBed(null);
  };

  const handleDrop = async (e, targetBedId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedPatient) return;

    // Cek apakah bed target kosong
    const bedOccupied = localData.find(k => k.bed_number === targetBedId);
    if (bedOccupied) {
      alert('Bed sudah terisi! Pilih bed yang kosong.');
      setDraggedPatient(null);
      setDragOverBed(null);
      return;
    }

    // Optimistic update - update local state immediately
    setLocalData(prevData => 
      prevData.map(kunjungan => 
        kunjungan.id === draggedPatient.id 
          ? { ...kunjungan, bed_number: targetBedId }
          : kunjungan
      )
    );
    
    // Clear drag states immediately for instant feedback
    setDraggedPatient(null);
    setDragOverBed(null);

    // Update bed number pasien via API
    try {
      await updateKunjungan(draggedPatient.id, {
          bed_number: targetBedId
        });

      // TIDAK call onDataUpdate() - biarkan realtime subscription handle sync
      // Ini mencegah race condition antara optimistic update dan parent refetch
      
    } catch (error) {
      console.error('Error moving patient:', error);
      alert('Gagal memindahkan pasien. Silakan coba lagi.');
      // Revert optimistic update on error
      setLocalData(data);
    }
  };

  const handleDragEnd = () => {
    setDraggedPatient(null);
    setDragOverBed(null);
  };

  const filteredData = useMemo(() => {
    if (!localData) return [];

    // Logika filter untuk 'medrec' dan 'nama pasien'
    const query = searchQuery.toLowerCase();

    return localData.filter((kunjungan) => {
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
  }, [localData, searchQuery]);

  // Komponen Empty Bed (bed kosong dengan skeleton)
  const EmptyBed = ({ bedLabel, bedId, onClick, onDelete }) => (
    <div
      onClick={onClick}
      onDragOver={(e) => handleDragOver(e, bedId)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, bedId)}
      className={`relative cursor-pointer transition-all hover:scale-105 hover:shadow-lg group ${
        dragOverBed === bedId ? 'ring-4 ring-blue-500 scale-105' : ''
      }`}
      style={{
        filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05))',
      }}
    >
      {/* Badge Bed Number */}
      <div className="absolute -top-2 -left-2 z-10 bg-slate-700 text-white px-3 py-1 rounded-md text-xs font-bold shadow-md">
        BED {bedLabel}
      </div>

      {/* Tombol Delete */}
      <button
        onClick={onDelete}
        className="absolute -top-2 -right-2 z-10 bg-red-600 hover:bg-red-700 text-white p-2 rounded-md shadow-md transition-colors opacity-0 group-hover:opacity-100"
        title="Hapus bed"
      >
        <Trash2 size={14} />
      </button>

      <svg 
        viewBox="0 0 300 580" 
        className="w-full h-auto"
        style={{
          filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.08))',
        }}
      >
        {/* Border dengan opacity rendah */}
        <rect
          x="2"
          y="2"
          width="296"
          height="576"
          rx="12"
          fill="none"
          stroke={dragOverBed === bedId ? "#3B82F6" : "#D1D5DB"}
          strokeWidth={dragOverBed === bedId ? "4" : "2"}
          strokeDasharray="8 4"
          opacity={dragOverBed === bedId ? "1" : "0.4"}
        />
        
        {/* LAYER 1: KASUR (Base) */}
        <rect
          x="10"
          y="100"
          width="280"
          height="468"
          rx="8"
          fill="#F3F4F6"
          opacity="0.3"
        />
        
        {/* LAYER 2: BANTAL (Header) */}
        <path
          d="M 10 100 L 10 30 Q 10 15, 25 12 Q 50 8, 75 12 Q 100 16, 125 12 Q 150 8, 175 12 Q 200 16, 225 12 Q 250 8, 275 12 Q 290 15, 290 30 L 290 100 Q 275 95, 255 98 Q 235 101, 215 98 Q 195 95, 175 98 Q 155 101, 150 100 Q 145 101, 125 98 Q 105 95, 85 98 Q 65 101, 45 98 Q 25 95, 10 100 Z"
          fill="#9CA3AF"
          opacity="0.2"
        />
        
        {/* LAYER 3: SELIMUT */}
        <path
          d="M 10 100 
             Q 25 85, 45 100 Q 65 115, 85 100 Q 105 85, 125 100 Q 145 115, 165 100 Q 185 85, 205 100 Q 225 115, 245 100 Q 265 85, 290 100
             L 290 558
             Q 265 543, 245 558 Q 225 573, 205 558 Q 185 543, 165 558 Q 145 573, 125 558 Q 105 543, 85 558 Q 65 573, 45 558 Q 25 543, 10 558
             L 10 100 Z"
          fill="#E5E7EB"
          opacity="0.25"
          stroke="rgba(0,0,0,0.03)"
          strokeWidth="1"
        />

        {/* Text "Bed Kosong" di tengah */}
        <foreignObject x="50" y="280" width="200" height="100">
          <div className="flex flex-col items-center justify-center h-full">
            <div className={`text-xl font-semibold mb-2 ${dragOverBed === bedId ? 'text-blue-500' : 'text-gray-400'}`}>
              {dragOverBed === bedId ? 'Drop di sini' : 'Bed Kosong'}
            </div>
            <div className="text-gray-300 text-sm">
              {dragOverBed === bedId ? 'Lepas untuk memindahkan' : 'Klik untuk tambah pasien'}
            </div>
          </div>
        </foreignObject>

        {/* Hover effect icon */}
        <foreignObject x="130" y="350" width="40" height="40">
          <div className={`transition-opacity ${dragOverBed === bedId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <Plus size={40} className={dragOverBed === bedId ? 'text-blue-500' : 'text-gray-400'} />
          </div>
        </foreignObject>
      </svg>
    </div>
  );


  return (
    <>
      {/* Delete Bed Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
            onClick={cancelDeleteBed}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Content */}
              <div className="px-6 py-8">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Hapus Bed
                </h2>
                <p className="text-gray-800 text-base font-medium mt-4">
                  Apakah Anda yakin ingin menghapus bed <span className="font-bold text-gray-900">{deleteModal.bedId}</span>?
                </p>
              </div>

              {/* Footer - Buttons */}
              <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end border-t border-gray-200">
                <button
                  onClick={cancelDeleteBed}
                  className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-md transition-colors duration-200"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDeleteBed}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors duration-200 shadow-sm"
                >
                  Ya, Hapus Bed
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* 🏥 BED GRID LAYOUT - 5 Kolom dengan Bed Management */}
      <div className="p-6 bg-gray-50">
        {/* Header dengan tombol tambah bed */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">
            Bed IGD {unit.charAt(0).toUpperCase() + unit.slice(1)} - Total: {beds.length} bed
          </h3>
          <button
            onClick={handleAddBed}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            Tambah Bed
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Loading state */}
          {loadingBeds ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              Memuat data beds...
            </div>
          ) : beds.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              Belum ada bed. Klik "Tambah Bed" untuk menambahkan.
            </div>
          ) : (
            beds.map((bed) => {
              // Cari pasien yang ada di bed ini
              const patientInBed = filteredData.find(k => k.bed_number === bed.bed_number);
            
            if (patientInBed) {
              // Render bed terisi (pasien aktif)
              const kunjungan = patientInBed;
              const triaseKey = kunjungan.triase || "default";
          
              // Tentukan warna berdasarkan jenis kelamin (data sudah di-flatten dari backend)
              const jenisKelamin = kunjungan.jenis_kelamin;
              
              // Warna untuk selimut (body) - lebih terang
              const blanketColor = jenisKelamin === 'Laki-Laki' || jenisKelamin === 'Laki-laki'
                ? '#DBEAFE' // blue-100
                : jenisKelamin === 'Perempuan' 
                ? '#FCE7F3' // pink-100
                : '#F3F4F6'; // gray-100
              
              // Warna untuk bantal (header) - lebih gelap
              const pillowColor = jenisKelamin === 'Laki-Laki' || jenisKelamin === 'Laki-laki'
                ? '#3B82F6' // blue-500
                : jenisKelamin === 'Perempuan' 
                ? '#EC4899' // pink-500
                : '#6B7280'; // gray-500
              
              // Border color berdasarkan triase
              const borderColor = triaseKey === 'resusitasi' ? '#EF4444' // red-500
                : triaseKey === 'emergency' ? '#F59E0B' // amber-500
                : triaseKey === 'semi' ? '#10B981' // green-500
                : '#D1D5DB'; // gray-300

              return (
                <div
                  key={kunjungan.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, kunjungan)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onPatientSelect(kunjungan)}
                  className="relative cursor-move transition-all hover:scale-105"
                  style={{
                    filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                    opacity: draggedPatient?.id === kunjungan.id ? 0.5 : 1,
                  }}
                  title="Drag untuk memindahkan ke bed lain"
                >
                  {/* Badge Bed Number */}
                  <div className="absolute -top-2 -left-2 z-10 bg-slate-700 text-white px-3 py-1 rounded-md text-xs font-bold shadow-md">
                    BED {bed.bed_number}
                  </div>

                  {/* 🛏️ SVG BED SHAPE - VERTIKAL DENGAN 3 LAYER */}
                  <svg 
                    viewBox="0 0 300 580" 
                    className="w-full h-auto"
                    style={{
                      filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.15))',
                    }}
                  >
                    {/* Border Triase */}
                    <rect
                      x="2"
                      y="2"
                      width="296"
                      height="576"
                      rx="12"
                      fill="none"
                      stroke={borderColor}
                      strokeWidth="4"
                    />
                    
                    {/* LAYER 1: KASUR (Base - Abu-abu sebagai dasar) */}
                    <rect
                      x="10"
                      y="100"
                      width="280"
                      height="468"
                      rx="8"
                      fill="#D1D5DB"
                      opacity="0.6"
                    />
                    
                    {/* LAYER 2: BANTAL (Header - Atas) */}
                    <path
                      d="M 10 100 L 10 30 Q 10 15, 25 12 Q 50 8, 75 12 Q 100 16, 125 12 Q 150 8, 175 12 Q 200 16, 225 12 Q 250 8, 275 12 Q 290 15, 290 30 L 290 100 Q 275 95, 255 98 Q 235 101, 215 98 Q 195 95, 175 98 Q 155 101, 150 100 Q 145 101, 125 98 Q 105 95, 85 98 Q 65 101, 45 98 Q 25 95, 10 100 Z"
                      fill={pillowColor}
                      opacity="0.95"
                    />
                    
                    {/* Highlight gelombang atas bantal */}
                    <path
                      d="M 25 12 Q 50 8, 75 12 Q 100 16, 125 12 Q 150 8, 175 12 Q 200 16, 225 12 Q 250 8, 275 12"
                      fill="none"
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth="2.5"
                    />
                    
                    {/* Shadow bawah bantal */}
                    <path
                      d="M 25 98 Q 45 101, 65 98 Q 85 95, 105 98 Q 125 101, 145 98 Q 165 101, 185 98 Q 205 95, 225 98 Q 245 101, 265 98 Q 280 95, 290 98"
                      fill="none"
                      stroke="rgba(0,0,0,0.15)"
                      strokeWidth="2"
                    />
                    
                    {/* LAYER 3: SELIMUT BERGELOMBANG (Menutupi kasur dari atas) */}
                    <path
                      d="M 10 100 
                         Q 25 85, 45 100 Q 65 115, 85 100 Q 105 85, 125 100 Q 145 115, 165 100 Q 185 85, 205 100 Q 225 115, 245 100 Q 265 85, 290 100
                         L 290 558
                         Q 265 543, 245 558 Q 225 573, 205 558 Q 185 543, 165 558 Q 145 573, 125 558 Q 105 543, 85 558 Q 65 573, 45 558 Q 25 543, 10 558
                         L 10 100 Z"
                      fill={blanketColor}
                      opacity="0.92"
                      stroke="rgba(0,0,0,0.08)"
                      strokeWidth="1"
                    />
                    
                    {/* Highlight gelombang atas selimut */}
                    <path
                      d="M 10 100 Q 25 85, 45 100 Q 65 115, 85 100 Q 105 85, 125 100 Q 145 115, 165 100 Q 185 85, 205 100 Q 225 115, 245 100 Q 265 85, 290 100"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="3"
                    />
                    
                    {/* Highlight gelombang bawah selimut */}
                    <path
                      d="M 10 558 Q 25 543, 45 558 Q 65 573, 85 558 Q 105 543, 125 558 Q 145 573, 165 558 Q 185 543, 205 558 Q 225 573, 245 558 Q 265 543, 290 558"
                      fill="none"
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth="3"
                    />

                    {/* === KONTEN BANTAL === */}
                    <foreignObject x="20" y="15" width="260" height="75">
                      <div className="flex flex-col items-center justify-center h-full text-white px-2">
                        <div className="text-xl tracking-wide drop-shadow-md truncate w-full text-center px-2" title={kunjungan.nama}>
                          {kunjungan.nama || "..."}
                        </div>
                        <div className="text-xs mt-1 opacity-90 font-bold">
                          No. Antrian: {kunjungan.nomor_antrian}
                        </div>
                        <div className="text-[10px] mt-0.5 opacity-75">
                          {formatCreatedAt(kunjungan.created_at)}
                        </div>
                      </div>
                    </foreignObject>

                    {/* === KONTEN SELIMUT === */}
                    <foreignObject x="15" y="115" width="270" height="448">
                      <div className="p-3 space-y-3 h-full">
                        
                        {/* Tim Medis */}
                        <div>
                          <div className="text-[10px] font-bold text-gray-700 uppercase mb-1">
                            Tim Medis
                          </div>
                          <div className="space-y-1">
                            {kunjungan.dpjp && (
                              <div className="bg-white/80 border border-gray-300 rounded px-2 py-0.5">
                                <p className="text-[8px] text-gray-600 font-semibold uppercase">DPJP</p>
                                <p className="text-[10px] text-gray-900 truncate">{kunjungan.dpjp}</p>
                              </div>
                            )}
                            {kunjungan.gp && (
                              <div className="bg-white/80 border border-gray-300 rounded px-2 py-0.5">
                                <p className="text-[8px] text-gray-600 font-semibold uppercase">GP</p>
                                <p className="text-[10px] text-gray-900 truncate">{kunjungan.gp}</p>
                              </div>
                            )}
                            {kunjungan.perawat && (
                              <div className="bg-white/80 border border-gray-300 rounded px-2 py-0.5">
                                <p className="text-[8px] text-gray-600 font-semibold uppercase">Perawat</p>
                                <p className="text-[10px] text-gray-900 truncate">{kunjungan.perawat}</p>
                              </div>
                            )}
                            {!kunjungan.dpjp && !kunjungan.gp && !kunjungan.perawat && (
                              <p className="text-[10px] text-gray-500">Belum ditentukan</p>
                            )}
                          </div>
                        </div>

                        {/* Penunjang */}
                        <div>
                          <div className="text-[10px] font-bold text-gray-700 uppercase mb-1">
                            Penunjang
                          </div>
                          <div className="text-[10px] bg-white/80 border border-gray-300 rounded px-2 py-1">
                            {(() => {
                              const currentStep = kunjungan.current_step || 1;
                              if (currentStep <= 3) return "Belum Melakukan Pemeriksaan";
                              return kunjungan.pemeriksaan_penunjang?.skip 
                                ? "Tidak Melakukan Pemeriksaan" 
                                : "Sudah Melakukan Pemeriksaan";
                            })()}
                          </div>
                        </div>

                        {/* Proses Tahapan */}
                        <div>
                          <div className="text-[10px] font-bold text-gray-700 uppercase mb-1">
                            Proses
                          </div>
                          <div className="space-y-0.5">
                            <ProsesSteps 
                              currentStep={kunjungan.current_step || 1}
                              createdAt={kunjungan.created_at}
                              stepTimestamps={kunjungan.step_timestamps}
                              onAlarmTriggered={handleAlarmTriggered}
                              kunjunganId={kunjungan.id}
                              pasienNama={kunjungan.nama}
                              unit={unit}
                            />
                          </div>
                        </div>

                        {/* Timer Total */}
                        <div>
                          <div className="text-[10px] font-bold text-gray-700 uppercase mb-1">
                            Total Waktu
                          </div>
                          <TotalLiveTimer 
                            startTime={kunjungan.created_at}
                            triase={kunjungan.triase}
                            unit={unit}
                          />
                        </div>
                      </div>
                    </foreignObject>
                  </svg>
                </div>
              );
            } else {
              // Render bed kosong
              return (
                <EmptyBed 
                  key={bed.id}
                  bedId={bed.bed_number}
                  bedLabel={bed.bed_number}
                  onClick={() => handleEmptyBedClick(bed.bed_number)}
                  onDelete={(e) => handleDeleteBed(bed, e)}
                />
              );
            }
          })
          )}
        </div>
      </div>
    </div>
    </>
  );
}