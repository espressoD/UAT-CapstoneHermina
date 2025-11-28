// src/components/uiAdmin/DetailPasienSlideIn.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  X,
  CheckCircle2,
  Paperclip,
  Circle,
  ChevronDown,
  Home,
  Bed,
  UserMinus,
  AlertTriangle,
  ArrowRightCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

// --- (Helper-helper Timer & Format tidak berubah) ---
function formatDuration(milliseconds) {
  if (milliseconds === null || milliseconds < 0) return "00:00:00";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (num) => num.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

const severityTextMap = {
  resusitasi: "RESUSITASI",
  emergency: "URGENT",
  semi: "SEMI-URGENT",
};

// --- (Sub-komponen kecil: EditableField, TextAreaField, dll tidak berubah) ---
const EditableField = ({ label, name, value, onChange, placeholder = "" }) => (
  <div className="mb-3">
    <label htmlFor={name} className="text-xs text-gray-500 font-medium">
      {label}
    </label>
    <input
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-green-500"
    />
  </div>
);
const TextAreaField = ({ label, name, value, onChange, placeholder = "", rows = 3 }) => (
  <div className="mb-3">
    <label htmlFor={name} className="text-xs text-gray-500 font-medium">
      {label}
    </label>
    <textarea
      id={name}
      name={name}
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-green-500"
    />
  </div>
);
const CheckboxField = ({ label, name, checked, onChange }) => (
  <div className="flex items-center mb-2">
    <input
      id={name}
      name={name}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
    />
    <label htmlFor={name} className="ml-2 text-sm text-gray-700">
      {label}
    </label>
  </div>
);
const AccordionItem = ({ title, icon, isOpen, onToggle, children }) => (
  <div className="border-b border-gray-200 bg-white">
    <button
      onClick={onToggle}
      className="flex justify-between items-center w-full p-4 text-left hover:bg-gray-50 transition-colors"
      type="button"
    >
      <div className="flex items-center space-x-3 w-full">
        {icon}
        {title}
      </div>
      <ChevronDown
        size={20}
        className={`text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
      />
    </button>
    {isOpen && <div className="p-4 pt-0 pb-5">{children}</div>}
  </div>
);
const ChoiceButton = ({ label, icon, type, isSelected, onClick }) => {
  const base = "w-full flex items-center space-x-3 p-3 rounded-lg border text-sm font-medium transition-all duration-200 shadow";
  const styles = {
    pulang: isSelected
      ? "bg-green-600 border-green-700 text-white shadow-md scale-[1.03]"
      : "bg-white border-gray-300 text-gray-700 hover:bg-green-50/10 hover:text-green-700",
    rawat: isSelected
      ? "bg-orange-500 border-orange-600 text-white shadow-md scale-[1.03]"
      : "bg-white border-gray-300 text-gray-700 hover:bg-orange-50/10 hover:text-orange-700",
    rujuk: isSelected
      ? "bg-teal-600 border-teal-700 text-white shadow-md scale-[1.03]"
      : "bg-white border-gray-300 text-gray-700 hover:bg-teal-50/10 hover:text-teal-700",
    meninggal: isSelected
      ? "bg-black border-gray-800 text-white shadow-md scale-[1.03]"
      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100",
  };
  return (
    <button onClick={onClick} className={`${base} ${styles[type]}`} type="button">
      {icon}
      <span>{label}</span>
    </button>
  );
};
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="mt-2 text-sm text-gray-600">{children}</div>
        </div>
        <div className="bg-gray-50 px-5 py-3 flex justify-end space-x-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Ya, Konfirmasi
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
// --- (Akhir Sub-komponen) ---


// --- Sub-komponen Timer (di-drive oleh stepData) ---
const StepTimer = ({ status, startTime, endTime }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval = null;
    if (status === "in_progress" && startTime) {
      const startMs = new Date(startTime).getTime();
      const update = () => setElapsed(new Date().getTime() - startMs);
      update(); // Jalankan sekali
      interval = setInterval(update, 1000);
    } else if (status === "completed" && startTime && endTime) {
      setElapsed(new Date(endTime).getTime() - new Date(startTime).getTime());
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval); // Pastikan interval dibersihkan
  }, [status, startTime, endTime]);

  const baseClasses = "text-xs font-medium px-2 py-0.5 rounded-full";
  if (status === "completed") {
    return (
      <span className={`${baseClasses} bg-green-100 text-green-700`}>
        {formatDuration(elapsed)}
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className={`${baseClasses} bg-blue-100 text-blue-700 tabular-nums`}>
        {formatDuration(elapsed)}
      </span>
    );
  }
  return (
    <span className={`${baseClasses} bg-gray-100 text-gray-500`}>
      00:00:00
    </span>
  );
};

// --- (Variants framer-motion tidak berubah) ---
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.22 } },
};
const panelVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 88, damping: 18 } },
  exit: { x: "100%", opacity: 0, transition: { duration: 0.33, ease: "easeInOut" } },
};

// === Komponen Utama ===
export default function DetailPasienSlideIn({ 
  patient, 
  isOpen, 
  onClose, 
  onDataUpdated,
  perawatData = [],
  dokterGpData = [],
  dokterDpjpData = []
}) {
  
  const {session } = useAuth();
  const [localPatient, setLocalPatient] = useState(patient || null);
  const [openAccordion, setOpenAccordion] = useState([1]);
  
  // --- State Dropdown ---
  const [perawatSearch, setPerawatSearch] = useState("");
  const [filteredPerawat, setFilteredPerawat] = useState([]);
  const [dokterIgdSearch, setDokterIgdSearch] = useState("");
  const [filteredDokterIgd, setFilteredDokterIgd] = useState([]);
  const [dpjpSearch, setDpjpSearch] = useState("");
  const [filteredDpjp, setFilteredDpjp] = useState([]);
  const [ruanganSearch, setRuanganSearch] = useState("");
  const [ruanganList, setRuanganList] = useState([]);
  const [filteredRuangan, setFilteredRuangan] = useState([]);  const perawatRef = useRef(null);
  const dokterIgdRef = useRef(null);
  const dpjpRef = useRef(null);
  const ruanganRef = useRef(null);

  const [isPerawatDropdownOpen, setIsPerawatDropdownOpen] = useState(false);
  const [isDokterIgdDropdownOpen, setIsDokterIgdDropdownOpen] = useState(false);
  const [isDpjpDropdownOpen, setIsDpjpDropdownOpen] = useState(false);
  const [isRuanganDropdownOpen, setIsRuanganDropdownOpen] = useState(false);

  // --- State untuk Timer & Alur ---
  const [stepData, setStepData] = useState({});
  const [totalProcessTime, setTotalProcessTime] = useState(null);
  
  // --- State Modal ---
  const [isTahap1ModalOpen, setIsTahap1ModalOpen] = useState(false);
  const [isTahap2ModalOpen, setIsTahap2ModalOpen] = useState(false);
  const [isTahap3ModalOpen, setIsTahap3ModalOpen] = useState(false);
  const [isTahap4ModalOpen, setIsTahap4ModalOpen] = useState(false);
  const [isTahap5ModalOpen, setIsTahap5ModalOpen] = useState(false);
  const [isSuccessHapusModalOpen, setIsSuccessHapusModalOpen] = useState(false);
  const [isTahap6ModalOpen, setIsTahap6ModalOpen] = useState(false);
  const [isHapusModalOpen, setIsHapusModalOpen] = useState(false);
  const [alasanHapus, setAlasanHapus] = useState("");
  const [isConfirmHapusModalOpen, setIsConfirmHapusModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  // --- useEffect UTAMA (Sudah benar dengan logika step_timestamps) ---
  useEffect(() => {
    if (isOpen && patient) {
      // Set form data (localPatient) dari prop
      setLocalPatient({
        ...patient,
        keluhan_utama: patient.keluhan_utama || "",
        riwayat_alergi: patient.riwayat_alergi || "",
        tanda_vital: patient.tanda_vital || {
          td_sistolik: "", td_diastolik: "", nadi: "", pernapasan: "", suhu: "", spo2: "", bb: "",
        },
        triase: patient.triase || null,
        perawat: patient.perawat || "",
        gp: patient.gp || "",
        asesmen: patient.asesmen || "",
        pemeriksaan_penunjang: patient.pemeriksaan_penunjang || {
          labList: [], labLainnya: "", radiologiList: [], radLainnya: "", fungsionalList: [], funLainnya: "", skip: false,
        },
        resep: patient.resep || "",
        tindakan_keperawatan: patient.tindakan_keperawatan || "",
        keputusan_akhir: patient.keputusan_akhir || null,
        dpjp: patient.dpjp || "",
        disposisi_ruangan: patient.disposisi_ruangan || "",
      });

      // Reset dropdown search text
      setPerawatSearch(patient.perawat || "");
      setDokterIgdSearch(patient.gp || "");
      setDpjpSearch(patient.dpjp || "");
      setRuanganSearch(patient.disposisi_ruangan || "");
      setFilteredPerawat(perawatData);
      setFilteredDokterIgd(dokterGpData);
      setFilteredDpjp(dokterDpjpData);

      // Fetch data ruangan dari API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      fetch(`${API_URL}/api/v2/ruangan`)
        .then(res => {

          return res.json();
        })
        .then(data => {

          setRuanganList(data);
          setFilteredRuangan(data);
        })
        .catch(err => console.error('Error fetching ruangan:', err));

      // --- LOGIKA 'stepData' BARU (gunakan numeric index dan format baru) ---
      const timestampsFromDb = patient.step_timestamps || {};
      const currentStep = patient.current_step || 1;
      let newStepData = {};
      let lastEndTime = new Date(patient.created_at);

      for (let i = 1; i <= 6; i++) {
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
          } else {
            newStepData[i] = { status: "pending", startTime: null, endTime: null };
          }
        }
      }
      
      if (currentStep === 1 && !timestampsFromDb["tahap_1"]) {
         newStepData[1] = { status: "in_progress", startTime: new Date(patient.created_at), endTime: null };
      }

      setStepData(newStepData);
      setOpenAccordion([currentStep]);
      setTotalProcessTime(null);
    } else if (!isOpen) {
      setLocalPatient(null);
    }
  }, [isOpen, patient, perawatData, dokterGpData, dokterDpjpData]);

  // --- (Efek disable scroll & klik di luar tidak berubah) ---
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (perawatRef.current && !perawatRef.current.contains(event.target)) setIsPerawatDropdownOpen(false);
      if (dokterIgdRef.current && !dokterIgdRef.current.contains(event.target)) setIsDokterIgdDropdownOpen(false);
      if (dpjpRef.current && !dpjpRef.current.contains(event.target)) setIsDpjpDropdownOpen(false);
      if (ruanganRef.current && !ruanganRef.current.contains(event.target)) setIsRuanganDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

const handlePerawatSearchChange = (e) => {
  const query = e.target.value;
  setPerawatSearch(query);
    if (query) {
      const filtered = perawatData.filter((perawat) =>
        perawat.nama.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredPerawat(filtered);
  } else {
    setFilteredPerawat(perawatData);
  }
  setIsPerawatDropdownOpen(true);
};

const handleDokterIgdSearchChange = (e) => {
  const query = e.target.value;
  setDokterIgdSearch(query);
  if (query) {
    const filtered = dokterGpData.filter((dokter) =>
      dokter.nama.toLowerCase().includes(query.toLowerCase())
  );
  setFilteredDokterIgd(filtered);
} else {
  setFilteredDokterIgd(dokterGpData);
}
setIsDokterIgdDropdownOpen(true);
};

const handleDpjpSearchChange = (e) => {
  const query = e.target.value;
  setDpjpSearch(query);
  if (query) {
    const filtered = dokterDpjpData.filter((dokter) =>
      dokter.nama.toLowerCase().includes(query.toLowerCase())
  );
  setFilteredDpjp(filtered);
} else {
  setFilteredDpjp(dokterDpjpData);
}
setIsDpjpDropdownOpen(true);
};

  const handleRuanganSearchChange = (e) => {
    const query = e.target.value;
    setRuanganSearch(query);
    if (query) {
      const filtered = ruanganList.filter((ruangan) =>
        ruangan.nama_ruangan.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredRuangan(filtered);
    } else {
      setFilteredRuangan(ruanganList);
    }
    setIsRuanganDropdownOpen(true);
  };

  // --- Handlers Form (Sudah benar) ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setLocalPatient((prev) => ({ ...prev, [name]: value }));
  };
  const handleTandaVitalChange = (e) => {
    const { name, value } = e.target;
    setLocalPatient((prev) => ({
      ...prev,
      tanda_vital: {
        ...prev.tanda_vital,
        [name]: value,
      },
    }));
  };
  const handlePemeriksaanPenunjangChange = (listName, option, isChecked) => {
    setLocalPatient((prev) => {
      const list = (prev.pemeriksaan_penunjang && prev.pemeriksaan_penunjang[listName]) ? prev.pemeriksaan_penunjang[listName] : [];
      return {
        ...prev,
        pemeriksaan_penunjang: {
          ...prev.pemeriksaan_penunjang,
          [listName]: isChecked
            ? [...list, option]
            : list.filter((x) => x !== option),
        },
      };
    });
  };
  const handlePenunjangLainnyaChange = (listName, value) => {
     setLocalPatient((prev) => ({
        ...prev,
        pemeriksaan_penunjang: {
          ...prev.pemeriksaan_penunjang,
          [listName]: value,
        },
      }));
  };
  const handleSkipPenunjangChange = (e) => {
    const isChecked = e.target.checked;
     setLocalPatient((prev) => ({
        ...prev,
        pemeriksaan_penunjang: {
          labList: [], labLainnya: "", radiologiList: [], radLainnya: "", fungsionalList: [], funLainnya: "",
          skip: isChecked,
        },
      }));
  };
  const handleChoiceChange = (choice) => {
    setLocalPatient((prev) => ({ ...prev, keputusan_akhir: prev.keputusan_akhir === choice ? null : choice }));
  };
  const handleToggle = (id) => {
    setOpenAccordion((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };
  const handleSelectPerawat = (perawat) => {
    setPerawatSearch(perawat.nama);
    setLocalPatient((prev) => ({ ...prev, perawat: perawat.nama }));
    setIsPerawatDropdownOpen(false);
  };
  const handleSelectDokterIgd = (dokter) => {
    setDokterIgdSearch(dokter.nama);
    setLocalPatient((prev) => ({ ...prev, gp: dokter.nama }));
    setIsDokterIgdDropdownOpen(false);
  };
  const handleSelectDpjp = (dokter) => {
    setDpjpSearch(dokter.nama);
    setLocalPatient((prev) => ({ ...prev, dpjp: dokter.nama }));
    setIsDpjpDropdownOpen(false);
  };
  const handleSelectRuangan = (ruangan) => {
    setRuanganSearch(ruangan.nama_ruangan);
    setLocalPatient((prev) => ({ ...prev, disposisi_ruangan: ruangan.nama_ruangan }));
    setIsRuanganDropdownOpen(false);
  };
  
  // --- 🚀 FUNGSI PENYIMPAN DATA (Timestamp Diperbarui) ---
  const handleSaveStep = async (payload, currentStepDone) => {
    const now = new Date().toISOString();
    
    // Tentukan step berikutnya
    let nextStep = currentStepDone + 1;
    if (currentStepDone === 5 && payload.keputusan_akhir !== "rawat") {
      nextStep = 5; // Tetap di step 5 jika rawat jalan/meninggal
    }
    if (currentStepDone === 6) {
      nextStep = 6; // Tetap di step 6
    }

    const oldTimestamps = localPatient.step_timestamps || {};
    const currentStepKey = `tahap_${currentStepDone}`;
    const nextStepKey = `tahap_${nextStep}`;

    // Buat data timestamp baru
    const newTimestamps = {
      ...oldTimestamps,
      [currentStepKey]: {
        start_time: oldTimestamps[currentStepKey]?.start_time || stepData[currentStepDone]?.startTime?.toISOString() || new Date(localPatient.created_at).toISOString(),
        end_time: now,
        status: 'completed',
      },
    };

    // Jika proses belum selesai, tambahkan 'start_time' untuk step berikutnya
    if (currentStepDone !== nextStep) {
      newTimestamps[nextStepKey] = {
        start_time: now,
        end_time: null,
        status: 'in_progress',
      };
    }

    const dataToSave = { 
      ...payload, 
      current_step: nextStep,
      step_timestamps: newTimestamps
    };

    // Jika proses selesai, pastikan 'current_step' tidak bertambah
    if (currentStepDone === nextStep) {
      dataToSave.current_step = currentStepDone;
    }

    if (!session || !session.access_token) {
      alert("Sesi Anda berakhir. Harap login ulang.");
      console.error("Gagal menyimpan: Sesi tidak ditemukan.");
      return false;
    }
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(
          `${API_URL}/api/v2/kunjungan/${localPatient.id}`,
          {
            method: "PATCH",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`
            },
            body: JSON.stringify(dataToSave),
          }
        );

      if (!response.ok) throw new Error("Gagal menyimpan data ke server");

      const updatedKunjungan = await response.json();
      onDataUpdated(updatedKunjungan);
      return true;

    } catch (error) {
      console.error("Gagal menyimpan tahap:", error);
      alert(`Error: ${error.message}`);
      return false;
    }
  };

  // --- 🚀 PERBARUI SEMUA Handlers Konfirmasi Modal (Mengirim step yang benar) ---
  
  // Tahap 1
  const handleConfirmTahap1 = () => {
    if (!localPatient.triase) {
      alert("Harap pilih Kategori Triase."); return;
    }
    setIsTahap1ModalOpen(true);
  };
  const handleModal1Confirm = async () => {
    const payload = {
      keluhan_utama: localPatient.keluhan_utama,
      tanda_vital: localPatient.tanda_vital,
      triase: localPatient.triase,
      perawat: localPatient.perawat,
      gp: localPatient.gp,
      riwayat_alergi: localPatient.riwayat_alergi,
    };
    
    // 🚀 PERBAIKAN: Kirim '1' (Tahap 1 Selesai)
    const success = await handleSaveStep(payload, 1);
    if (success) {
      setIsTahap1ModalOpen(false);
      setOpenAccordion((prev) => [...prev.filter((i) => i !== 1), 2]);
    }
  };
  const handleModal1Cancel = () => setIsTahap1ModalOpen(false);

  // Tahap 2
  const handleConfirmTahap2 = () => {
    setIsTahap2ModalOpen(true);
  };
  const handleModal2Confirm = async () => {
    const payload = {
      asesmen: localPatient.asesmen,
    };
    // 🚀 PERBAIKAN: Kirim '2'
    const success = await handleSaveStep(payload, 2);
    if (success) {
      setIsTahap2ModalOpen(false);
      setOpenAccordion((prev) => [...prev.filter((i) => i !== 2), 3]);
    }
  };
  const handleModal2Cancel = () => setIsTahap2ModalOpen(false);
  
  // Tahap 3
  const handleConfirmTahap3 = () => {
    setIsTahap3ModalOpen(true);
  };
  const handleModal3Confirm = async () => {
    const payload = {
      pemeriksaan_penunjang: localPatient.pemeriksaan_penunjang,
    };
    // 🚀 PERBAIKAN: Kirim '3'
    const success = await handleSaveStep(payload, 3);
    if (success) {
      setIsTahap3ModalOpen(false);
      setOpenAccordion((prev) => [...prev.filter((i) => i !== 3), 4]);
    }
  };
  const handleModal3Cancel = () => setIsTahap3ModalOpen(false);

  // Tahap 4
  const handleConfirmTahap4 = () => {
    setIsTahap4ModalOpen(true);
  };
  const handleModal4Confirm = async () => {
    const payload = {
      resep: localPatient.resep,
      tindakan_keperawatan: localPatient.tindakan_keperawatan,
    };
    // 🚀 PERBAIKAN: Kirim '4'
    const success = await handleSaveStep(payload, 4);
    if (success) {
      setIsTahap4ModalOpen(false);
      setOpenAccordion((prev) => [...prev.filter((i) => i !== 4), 5]);
    }
  };
  const handleModal4Cancel = () => setIsTahap4ModalOpen(false);

  // Tahap 5
  const handleConfirmTahap5 = () => {
    if (!localPatient.keputusan_akhir) {
      alert("Harap pilih Keputusan Akhir."); return;
    }
    if (localPatient.keputusan_akhir === "rawat" && !localPatient.dpjp) {
      alert("Harap pilih DPJP untuk pasien Rawat Inap."); return;
    }
    if (localPatient.keputusan_akhir === "rujuk" && !localPatient.alasan_rujuk) {
      alert("Harap isi Alasan Rujuk."); return;
    }
    setIsTahap5ModalOpen(true);
  };
  const handleModal5Confirm = async () => {
    const payload = {
      keputusan_akhir: localPatient.keputusan_akhir,
      dpjp: localPatient.dpjp,
      alasan_rujuk: localPatient.alasan_rujuk,
    };
    
    const status = (localPatient.keputusan_akhir === "rawat") ? "Aktif" : "Selesai";
    
    // 🚀 PERBAIKAN: Kirim '5'
    const success = await handleSaveStep({ ...payload, status_kunjungan: status }, 5);
    
    if (success) {
      setIsTahap5ModalOpen(false);
      if (status === "Selesai") {
        onClose(); 
      } else {
        setOpenAccordion((prev) => [...prev.filter((i) => i !== 5), 6]);
      }
    }
  };
  const handleModal5Cancel = () => setIsTahap5ModalOpen(false);

  // Tahap 6
  const handleConfirmTahap6 = () => {
    if (!localPatient.disposisi_ruangan) {
      alert("Harap pilih Ruangan Disposisi."); return;
    }
    setIsTahap6ModalOpen(true);
  };
  const handleModal6Confirm = async () => {
    const payload = {
      disposisi_ruangan: localPatient.disposisi_ruangan,
      status_kunjungan: "Selesai",
    };
    
    // 🚀 PERBAIKAN: Kirim '6'
    const success = await handleSaveStep(payload, 6);
    if (success) {
      setIsTahap6ModalOpen(false);
      onClose();
    }
  };
  const handleModal6Cancel = () => setIsTahap6ModalOpen(false);

  // Fungsi Hapus Pasien
  const handleHapusPasien = () => {
    setIsHapusModalOpen(true);
  };
  
  const handleHapusConfirm = async () => {
    if (!alasanHapus.trim()) {
      setAlertMessage("Harap isi alasan penghapusan pasien.");
      setIsAlertModalOpen(true);
      setTimeout(() => setIsAlertModalOpen(false), 1000);
      return;
    }
    setIsConfirmHapusModalOpen(true);
  };

  // Eksekusi hapus pasien setelah konfirmasi ulang
  const executeHapusPasien = async () => {
    const now = new Date().toISOString();
    const oldTimestamps = localPatient.step_timestamps || {};
    const currentStepNum = localPatient.current_step || 1;
    const currentStepKey = `tahap_${currentStepNum}`;

    // Buat timestamp untuk step saat ini (end_time = now)
    const newTimestamps = {
      ...oldTimestamps,
      [currentStepKey]: {
        start_time: oldTimestamps[currentStepKey]?.start_time || stepData[currentStepNum]?.startTime?.toISOString() || new Date(localPatient.created_at).toISOString(),
        end_time: now,
        status: 'completed',
      },
    };

    const dataToSave = {
      status_kunjungan: "Selesai",
      keputusan_akhir: "dihapus",
      alasan_hapus: alasanHapus,
      current_step: currentStepNum,
      step_timestamps: newTimestamps,
    };

    if (!session || !session.access_token) {
      alert("Sesi Anda berakhir. Harap login ulang.");
      console.error("Gagal menyimpan: Sesi tidak ditemukan.");
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(
        `${API_URL}/api/v2/kunjungan/${localPatient.id}`,
        {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          },
          body: JSON.stringify(dataToSave),
        }
      );

      if (!response.ok) throw new Error("Gagal menghapus pasien");

      const updatedKunjungan = await response.json();
      onDataUpdated(updatedKunjungan);
      setIsHapusModalOpen(false);
      setIsConfirmHapusModalOpen(false);
      setAlasanHapus("");
      // Tampilkan modal sukses (jangan tutup parent dulu)
      setIsSuccessHapusModalOpen(true);
    } catch (error) {
      console.error("Gagal menghapus pasien:", error);
      if (window && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent("show-toast", {
          detail: {
            type: "error",
            message: `Error: ${error.message}`
          }
        }));
      }
    }
  };
  const handleConfirmHapusCancel = () => {
    setIsConfirmHapusModalOpen(false);
  };
  
  const handleHapusCancel = () => {
    setIsHapusModalOpen(false);
    setAlasanHapus("");
  };

  // --- (Fungsi getStepIcon tidak berubah) ---
  const getStepIcon = (stepNumber) => {
    const completedIcon = <CheckCircle2 size={20} className="text-green-500" />;
    const inProgressIcon = <Paperclip size={20} className="text-blue-500" />;
    const pendingIcon = <Circle size={20} className="text-gray-400" />;
    const status = (stepData && stepData[stepNumber]) ? stepData[stepNumber].status : 'pending';
    switch (status) {
      case "completed": return completedIcon;
      case "in_progress": return inProgressIcon;
      default: return pendingIcon;
    }
  };

  // --- (Pengecekan Render tidak berubah) ---
  if (!localPatient || !isOpen) return null;
  const stopPropagation = (e) => e.stopPropagation();

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            className="fixed inset-0 bg-black/30 z-40"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-gray-50 shadow-xl z-50 flex flex-col"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={stopPropagation}
          >
            {/* Header (Data Dinamis) */}
            <div className="flex justify-between items-center p-4 bg-white border-b">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Detail Pasien: {localPatient.pasien?.nama ?? "Memuat..."}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  <span>Gender: {localPatient.pasien?.jenis_kelamin ?? "-"}</span>
                  <span className="mx-2">|</span>
                  <span>Umur: {localPatient.pasien?.umur 
                    ? `${localPatient.pasien.umur} tahun`
                    : localPatient.pasien?.tanggal_lahir ? (() => {
                      const today = new Date();
                      const birthDate = new Date(localPatient.pasien.tanggal_lahir);
                      let age = today.getFullYear() - birthDate.getFullYear();
                      const monthDiff = today.getMonth() - birthDate.getMonth();
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                      }
                      return `${age} tahun`;
                    })() : "-"}</span>
                  <span className="mx-2">|</span>
                  <span className="font-bold">
                    Triase: {localPatient.triase ? (severityTextMap[localPatient.triase] || localPatient.triase.toUpperCase()) : "-"}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleHapusPasien}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
                  type="button"
                >
                  Hapus
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content (scrollable) */}
            <div className="overflow-y-auto h-[calc(100%-64px)]">
              
              {/* === 1: Pendaftaran (Form terhubung ke localPatient) === */}
              <AccordionItem
                title={
                  <div className="flex justify-between items-center w-full pr-2">
                    <span className="font-medium text-gray-800">Tahap 1: Pendaftaran & Pemeriksaan Awal</span>
                    <StepTimer
                      status={stepData[1]?.status}
                      startTime={stepData[1]?.startTime}
                      endTime={stepData[1]?.endTime}
                    />
                  </div>
                }
                icon={getStepIcon(1)}
                isOpen={openAccordion.includes(1)}
                onToggle={() => handleToggle(1)}
              >
                <div
                  className={
                    (stepData[1]?.status === 'completed') ? "opacity-50 pointer-events-none" : ""
                  }
                >
                  {/* Kategori Triase Pasien */}
                  <div className="mt-6">
                    <label className="text-sm font-semibold text-gray-800 block mb-2">
                      Kategori Triase Pasien <span className="text-red-500">(wajib diisi)</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      {[
                        { label: "RESUSITASI", color: "bg-red-600", type: "resusitasi" },
                        { label: "URGENT / EMERGENCY", color: "bg-yellow-500", type: "emergency" },
                        { label: "FALSE EMERGENCY / SEMI-URGENT", color: "bg-green-600", type: "semi" },
                      ].map((item) => (
                        <button
                          key={item.type}
                          onClick={() => setLocalPatient((prev) => ({ ...prev, triase: item.type }))}
                          className={`w-full sm:w-auto flex-1 text-sm font-semibold text-white py-2 px-4 rounded-lg shadow transition-all duration-200 border-2
                            ${
                              localPatient.triase === item.type
                                ? "ring-2 ring-offset-2 ring-green-400 scale-[1.03] border-green-600"
                                : "border-transparent hover:opacity-90"
                            }
                            ${item.color}`}
                          type="button"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    {localPatient.triase && (
                      <div className="space-y-4 mt-2">
                        {/* Dropdown Perawat (Hubungkan ke 'perawatSearch' & 'handleSelectPerawat') */}
                        <div className="relative" ref={perawatRef}>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Perawat yang Melakukan Triase:
                          </label>
                          <div className="relative">
                            <input type="text" placeholder="Cari atau pilih perawat..." value={perawatSearch} onChange={handlePerawatSearchChange} onFocus={() => setIsPerawatDropdownOpen(true)} autoComplete="off" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm pr-10 focus:ring-2 focus:ring-green-600 outline-none" />
                            {/* ... (ikon) ... */}
                          </div>
                          <AnimatePresence>
                            {isPerawatDropdownOpen && filteredPerawat.length > 0 && (
                              <motion.div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {filteredPerawat.map((perawat) => (
                                  <button 
                                  key={perawat.id_pegawai || perawat.nama}
                                  type="button" 
                                  onClick={() => handleSelectPerawat(perawat)} 
                                  className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-green-50"
                                  >
                                    <p className="font-medium">{perawat.nama}</p>
                                    {perawat.id_pegawai && (
                                      <p className="text-xs text-gray-500">ID: {perawat.id_pegawai}</p>
                                      )}
                                      </button>
                                    ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {/* Dropdown Dokter (Hubungkan ke 'dokterIgdSearch' & 'handleSelectDokterIgd') */}
                        <div className="relative" ref={dokterIgdRef}>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Dokter IGD:
                          </label>
                          <div className="relative">
                            <input type="text" placeholder="Cari atau pilih dokter IGD..." value={dokterIgdSearch} onChange={handleDokterIgdSearchChange} onFocus={() => setIsDokterIgdDropdownOpen(true)} autoComplete="off" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm pr-10 focus:ring-2 focus:ring-green-600 outline-none" />
                            {/* ... (ikon) ... */}
                          </div>
                          <AnimatePresence>
                            {isDokterIgdDropdownOpen && filteredDokterIgd.length > 0 && (
                              <motion.div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {filteredDokterIgd.map((dokter) => (
                                  <button 
                                  key={dokter.examiner_key || dokter.id} 
                                  type="button" 
                                  onClick={() => handleSelectDokterIgd(dokter)} 
                                  className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-green-50"
                                  >
                                    <p className="font-medium">{dokter.nama}</p>
                                    {dokter.examiner_key && (
                                      <p className="text-xs text-gray-500">Examiner Key: {dokter.examiner_key}</p>
                                    )}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {stepData[1]?.status !== 'completed' && (
                    <button
                      onClick={handleConfirmTahap1}
                      className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow"
                      type="button"
                    >
                      Konfirmasi Tahap 1 & Lanjut
                    </button>
                  )}
                </div>
              </AccordionItem>
              {/* === AKHIR ACCORDION 1 === */}


              {/* === 2: Pemeriksaan Dokter IGD === */}
              <AccordionItem
                title={
                  <div className="flex justify-between items-center w-full pr-2">
                    <span className="font-medium text-gray-800">Tahap 2: Pemeriksaan oleh Dokter IGD</span>
                    <StepTimer
                      status={stepData[2]?.status}
                      startTime={stepData[2]?.startTime}
                      endTime={stepData[2]?.endTime}
                    />
                  </div>
                }
                icon={getStepIcon(2)}
                isOpen={openAccordion.includes(2)}
                onToggle={() => handleToggle(2)}
              >
                <div
                  className={
                    stepData[1]?.status !== 'completed' ? "opacity-50 pointer-events-none" : ""
                  }
                >
                  {stepData[2]?.status === 'completed' ? (
                    <div className="flex items-center justify-center gap-3 py-8">
                      <CheckCircle2 size={24} className="text-green-600" />
                      <span className="text-base font-semibold text-green-700">
                        Pemeriksaan Tahap 2 sudah selesai
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={handleConfirmTahap2}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow"
                      type="button"
                    >
                      Konfirmasi Tahap 2 & Lanjut
                    </button>
                  )}
                </div>
              </AccordionItem>
              {/* === AKHIR ACCORDION 2 === */}


              {/* === 3: Pemeriksaan Penunjang === */}
              <AccordionItem
                title={
                  <div className="flex justify-between items-center w-full pr-2">
                    <span className="font-medium text-gray-800">Tahap 3: Pemeriksaan Penunjang</span>
                    <StepTimer
                      status={stepData[3]?.status}
                      startTime={stepData[3]?.startTime}
                      endTime={stepData[3]?.endTime}
                    />
                  </div>
                }
                icon={getStepIcon(3)}
                isOpen={openAccordion.includes(3)}
                onToggle={() => handleToggle(3)}
              >
                <div
                  className={
                    stepData[2]?.status !== 'completed' ? "opacity-50 pointer-events-none" : ""
                  }
                >
                  {stepData[3]?.status === 'completed' ? (
                    <div className="flex items-center justify-center gap-3 py-8">
                      <CheckCircle2 size={24} className="text-green-600" />
                      <span className="text-base font-semibold text-green-700">
                        Pemeriksaan Tahap 3 sudah selesai
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setLocalPatient((prev) => ({
                            ...prev,
                            pemeriksaan_penunjang: {
                              labList: [], labLainnya: "", radiologiList: [], radLainnya: "", 
                              fungsionalList: [], funLainnya: "", skip: false,
                            },
                          }));
                          handleConfirmTahap3();
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md text-sm font-semibold shadow-md transition"
                        type="button"
                      >
                        Melakukan Pemeriksaan Penunjang
                      </button>
                      <button
                        onClick={() => {
                          setLocalPatient((prev) => ({
                            ...prev,
                            pemeriksaan_penunjang: {
                              labList: [], labLainnya: "", radiologiList: [], radLainnya: "", 
                              fungsionalList: [], funLainnya: "", skip: true,
                            },
                          }));
                          handleConfirmTahap3();
                        }}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-md text-sm font-semibold shadow-md transition"
                        type="button"
                      >
                        Tidak Melakukan Pemeriksaan Penunjang
                      </button>
                    </div>
                  )}
                </div>
              </AccordionItem>
              {/* === AKHIR ACCORDION 3 === */}

              
              {/* === 4: Tindakan & Pengobatan === */}
              <AccordionItem
                title={
                  <div className="flex justify-between items-center w-full pr-2">
                    <span className="font-medium text-gray-800">Tahap 4: Tindakan & Pengobatan</span>
                    <StepTimer
                      status={stepData[4]?.status}
                      startTime={stepData[4]?.startTime}
                      endTime={stepData[4]?.endTime}
                    />
                  </div>
                }
                icon={getStepIcon(4)}
                isOpen={openAccordion.includes(4)}
                onToggle={() => handleToggle(4)}
              >
                <div
                  className={
                    stepData[3]?.status !== 'completed' ? "opacity-50 pointer-events-none" : ""
                  }
                >
                  {stepData[4]?.status === 'completed' ? (
                    <div className="flex items-center justify-center gap-3 py-8">
                      <CheckCircle2 size={24} className="text-green-600" />
                      <span className="text-base font-semibold text-green-700">
                        Pemeriksaan Tahap 4 sudah selesai
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={handleConfirmTahap4}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow"
                      type="button"
                    >
                      Konfirmasi Tahap 4 & Lanjut
                    </button>
                  )}
                </div>
              </AccordionItem>
              {/* === AKHIR ACCORDION 4 === */}


              {/* === 5: Keputusan Akhir === */}
              <AccordionItem
                title={
                  <div className="flex justify-between items-center w-full pr-2">
                    <span className="font-medium text-gray-800">Tahap 5: Keputusan Akhir</span>
                    <StepTimer
                      status={stepData[5]?.status}
                      startTime={stepData[5]?.startTime}
                      endTime={stepData[5]?.endTime}
                    />
                  </div>
                }
                icon={getStepIcon(5)}
                isOpen={openAccordion.includes(5)}
                onToggle={() => handleToggle(5)}
              >
                <div
                  className={
                    stepData[4]?.status !== 'completed' ? "opacity-50 pointer-events-none" : ""
                  }
                >
                  <div
                    className={
                      stepData[5]?.status === 'completed' ? "opacity-50 pointer-events-none" : ""
                    }
                  >
                    <div className="space-y-3">
                      <ChoiceButton
                        label="Rawat Jalan"
                        icon={<Home size={18} />}
                        type="pulang" 
                        isSelected={localPatient.keputusan_akhir === "rawat_jalan"}
                        onClick={() => handleChoiceChange("rawat_jalan")}
                      />
                      <ChoiceButton
                        label="Rawat Inap"
                        icon={<Bed size={18} />}
                        type="rawat"
                        isSelected={localPatient.keputusan_akhir === "rawat"}
                        onClick={() => handleChoiceChange("rawat")}
                      />
                      <ChoiceButton
                        label="Rujuk"
                        icon={<ArrowRightCircle size={18} />}
                        type="rujuk"
                        isSelected={localPatient.keputusan_akhir === "rujuk"}
                        onClick={() => handleChoiceChange("rujuk")}
                      />
                      <ChoiceButton
                        label="Meninggal"
                        icon={<UserMinus size={18} />}
                        type="meninggal"
                        isSelected={localPatient.keputusan_akhir === "meninggal"}
                        onClick={() => handleChoiceChange("meninggal")}
                      />
                    </div>

                    {localPatient.keputusan_akhir === "rujuk" && (
                      <div className="mt-6 pt-4 border-t border-gray-200 space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">
                            Alasan Rujuk: <span className="text-red-500">(wajib diisi)</span>
                          </label>
                          <textarea
                            value={localPatient.alasan_rujuk || ""}
                            onChange={(e) => setLocalPatient(prev => ({ ...prev, alasan_rujuk: e.target.value }))}
                            placeholder="Contoh: Memerlukan fasilitas spesialis yang tidak tersedia di RS ini"
                            rows={3}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                    )}

                    {localPatient.keputusan_akhir === "rawat" && (
                      <div className="mt-6 pt-4 border-t border-gray-200 space-y-4">
                        {/* Combobox DPJP */}
                        <div className="relative" ref={dpjpRef}>
                          <label
                            htmlFor="dpjp"
                            className="text-sm font-medium text-gray-700 block mb-1"
                          >
                            Dokter Spesialis (DPJP): <span className="text-red-500">(wajib diisi)</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="dpjp"
                              name="dpjp"
                              value={dpjpSearch}
                              onChange={handleDpjpSearchChange}
                              onFocus={() => setIsDpjpDropdownOpen(true)}
                              placeholder="Cari dokter spesialis..."
                              autoComplete="off"
                              className="w-full border border-gray-300 rounded-md pl-3 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            {/* ... (ikon) ... */}
                          </div>
                          <AnimatePresence>
                            {isDpjpDropdownOpen && filteredDpjp.length > 0 && (
                              <motion.div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {filteredDpjp.map((dokter) => (
                                  <button
                                    key={dokter.id || dokter.nama}
                                    type="button"
                                    onClick={() => handleSelectDpjp(dokter)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-green-50"
                                  >
                                    <p className="font-medium">{dokter.nama}</p>
                                    {dokter.spesialisasi && (
                                      <p className="text-xs text-gray-500">{dokter.spesialisasi}</p>
                                    )}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {/* Catatan Rawat Inap (Belum ada di DB) */}
                      </div>
                    )}

                    {stepData[5]?.status !== 'completed' && (
                      <button
                        onClick={handleConfirmTahap5}
                        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow"
                        type="button"
                      >
                        Konfirmasi Tahap 5
                      </button>
                    )}
                  </div>
                </div>
              </AccordionItem>
              {/* === AKHIR ACCORDION 5 === */}


              {/* === 6: Disposisi Ruangan === */}
              {stepData[5]?.status === 'completed' && localPatient.keputusan_akhir === "rawat" && (
                <AccordionItem
                  title={
                    <div className="flex justify-between items-center w-full pr-2">
                      <span className="font-medium text-gray-800">Tahap 6: Disposisi Ruangan</span>
                      <StepTimer
                        status={stepData[6]?.status}
                        startTime={stepData[6]?.startTime}
                        endTime={stepData[6]?.endTime}
                      />
                    </div>
                  }
                  icon={getStepIcon(6)}
                  isOpen={openAccordion.includes(6)}
                  onToggle={() => handleToggle(6)}
                >
                  <div
                    className={
                      stepData[6]?.status === 'completed' ? "opacity-50 pointer-events-none" : ""
                    }
                  >
                    <div className="space-y-4">
                      {/* Combobox Ruangan */}
                      <div className="relative" ref={ruanganRef}>
                        <label htmlFor="disposisiRuangan" className="text-sm font-medium text-gray-700 block mb-1">
                          Ruangan Disposisi: <span className="text-red-500">(wajib diisi)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="disposisiRuangan"
                            name="disposisi_ruangan"
                            value={ruanganSearch}
                            onChange={handleRuanganSearchChange}
                            onFocus={() => setIsRuanganDropdownOpen(true)}
                            placeholder="Cari ruangan..."
                            autoComplete="off"
                            className="w-full border border-gray-300 rounded-md pl-3 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          {/* ... (ikon) ... */}
                        </div>
                        <AnimatePresence>
                          {isRuanganDropdownOpen && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                            >
                              {filteredRuangan.length > 0 ? (
                                filteredRuangan.map((ruangan) => (
                                  <button
                                    key={ruangan.id}
                                    type="button"
                                    onClick={() => handleSelectRuangan(ruangan)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-green-50 transition-colors"
                                  >
                                    {ruangan.nama_ruangan}
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                  {ruanganList.length === 0 ? 'Memuat data ruangan...' : 'Tidak ada ruangan ditemukan'}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      {/* Catatan Disposisi (Belum ada di DB) */}
                    </div>

                    {stepData[6]?.status !== 'completed' && (
                      <button
                        onClick={handleConfirmTahap6}
                        className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow"
                        type="button"
                      >
                        Konfirmasi & Selesaikan Alur
                      </button>
                    )}
                  </div>
                </AccordionItem>
              )}
              {/* === AKHIR ACCORDION 6 === */}

              {/* === Tampilan Total Waktu Proses === */}
              {totalProcessTime && (
                <div className="p-4 mt-4 bg-white border-t border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Proses Selesai
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Total waktu proses (dari Pendaftaran s/d Selesai):
                  </p>
                  <div className="text-3xl font-bold text-green-600 mt-1">
                    {totalProcessTime}
                  </div>
                </div>
              )}
            </div> {/* Akhir Scrollable Content */}


            {/* === Render Modal (Tidak berubah) === */}
            <AnimatePresence>
              <ConfirmationModal isOpen={isTahap1ModalOpen} onClose={handleModal1Cancel} onConfirm={handleModal1Confirm} title="Konfirmasi Pendaftaran & Pemeriksaan Awal" />
              <ConfirmationModal isOpen={isTahap2ModalOpen} onClose={handleModal2Cancel} onConfirm={handleModal2Confirm} title="Konfirmasi Pemeriksaan Dokter IGD" />
              <ConfirmationModal isOpen={isTahap3ModalOpen} onClose={handleModal3Cancel} onConfirm={handleModal3Confirm} title="Konfirmasi Pemeriksaan Penunjang" />
              <ConfirmationModal isOpen={isTahap4ModalOpen} onClose={handleModal4Cancel} onConfirm={handleModal4Confirm} title="Konfirmasi Tindakan & Pengobatan" />
              <ConfirmationModal isOpen={isTahap5ModalOpen} onClose={handleModal5Cancel} onConfirm={handleModal5Confirm} title="Konfirmasi Keputusan Akhir" />
              <ConfirmationModal isOpen={isTahap6ModalOpen} onClose={handleModal6Cancel} onConfirm={handleModal6Confirm} title="Konfirmasi Disposisi Ruangan" />
              
              {/* Modal Hapus Pasien */}
              {isHapusModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4"
                  onClick={handleHapusCancel}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="bg-white rounded-lg shadow-xl w-full max-w-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Hapus Pasien</h3>
                      <p className="text-sm text-gray-600 mb-4">Pasien akan dipindahkan ke tab Pasien Selesai Hari Ini. Mohon isi alasan penghapusan:</p>
                      <textarea
                        value={alasanHapus}
                        onChange={(e) => setAlasanHapus(e.target.value)}
                        placeholder="Tuliskan alasan penghapusan pasien..."
                        rows={4}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div className="bg-gray-50 px-5 py-3 flex justify-end space-x-3 rounded-b-lg">
                      <button
                        type="button"
                        onClick={handleHapusCancel}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleHapusConfirm}
                        className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700"
                      >
                        Ya, Hapus Pasien
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
              {/* Modal Konfirmasi Ulang Hapus Pasien */}
              {isConfirmHapusModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center p-4"
                  onClick={handleConfirmHapusCancel}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="bg-white rounded-lg shadow-xl w-full max-w-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Konfirmasi Hapus Pasien</h3>
                      <p className="text-sm text-gray-700 mb-2">Anda yakin ingin menghapus pasien ini? Tindakan ini tidak dapat dibatalkan.</p>
                      <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-2">
                        <h4 className="text-sm font-semibold text-red-800 mb-1">Alasan Penghapusan</h4>
                        <p className="text-sm text-red-700 whitespace-pre-line">{alasanHapus}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3 flex justify-end space-x-3 rounded-b-lg">
                      <button
                        type="button"
                        onClick={handleConfirmHapusCancel}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={executeHapusPasien}
                        className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700"
                      >
                        Konfirmasi Hapus
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
          </motion.div>
        </>
      )}
      
      {/* Modal Alert Custom */}
      <AnimatePresence>
        {isAlertModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[90] flex items-center justify-center p-4"
            onClick={() => setIsAlertModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 flex flex-col items-center text-center">
                {/* Icon Alert Triangle */}
                <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                  <AlertTriangle className="text-yellow-600 w-10 h-10" strokeWidth={2} />
                </div>
                
                {/* Pesan */}
                <p className="text-base text-gray-800 font-medium">
                  {alertMessage}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modal Sukses Hapus Pasien */}
      <AnimatePresence>
        {isSuccessHapusModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-4"
            onClick={() => {
              setIsSuccessHapusModalOpen(false);
              onClose();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 flex flex-col items-center text-center">
                {/* Icon Centang Hijau */}
                <CheckCircle2 
                  className="text-green-600 w-16 h-16 mx-auto mb-4 animate-bounce" 
                />
                
                {/* Judul */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Pasien Berhasil Dihapus!
                </h3>
                
                {/* Deskripsi */}
                <p className="text-sm text-gray-600 mb-6">
                  Data pasien telah dipindahkan ke tab Pasien Selesai Hari Ini.
                </p>
                
                {/* Tombol Oke */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccessHapusModalOpen(false);
                    onClose();
                  }}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium shadow-sm transition-colors"
                >
                  Oke
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
