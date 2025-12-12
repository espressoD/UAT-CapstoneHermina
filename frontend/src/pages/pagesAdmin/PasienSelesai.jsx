// src/pages/pagesAdmin/PasienSelesai.jsx
import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { 
  X, 
  Timer, 
  CheckCircle2, 
  ShieldAlert, 
  User, 
  Stethoscope, 
  FlaskRound, 
  Award,
  Bed,
  Home,
  UserMinus,
  Search,
  Download,
  ArrowRightCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Papa from 'papaparse'; 

// --- Helper untuk format durasi (dari file Anda) ---
const formatDuration = (milliseconds) => {
  if (milliseconds < 0 || !milliseconds) return "00:00:00";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// --- (BARU) Helper untuk format tanggal dari Supabase ---
const formatTimestamp = (isoString) => {
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

// Helper untuk format tanggal DD/MM/YYYY (untuk CSV)
const formatTimestampCSV = (isoString) => {
  if (!isoString) return "-";
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};


// --- Komponen Modal Rekap (diperbarui untuk data V2) ---
// 🚀 'pasien' prop sekarang adalah objek 'kunjungan' lengkap
const RekapAlurPasienModal = ({ isOpen, onClose, pasien: kunjungan }) => {
  if (!isOpen || !kunjungan) return null;

  // --- 🚀 LOGIKA BARU: Hitung durasi dari 'step_timestamps' ---
  const durasi = {};
  let totalDurasiMs = 0;
  const timestamps = kunjungan.step_timestamps || {};

  const getMs = (stepKey) => {
    const data = timestamps[stepKey];
    if (data && data.start_time && data.end_time) {
      return new Date(data.end_time).getTime() - new Date(data.start_time).getTime();
    }
    return null;
  };

  // Hitung durasi per tahap (semua tahap termasuk Tahap 1)
  durasi.tahap1 = getMs("tahap_1"); // Pendaftaran & Pemeriksaan Awal
  durasi.tahap2 = getMs("tahap_2"); // Asesmen Dokter
  durasi.tahap3 = getMs("tahap_3"); // Penunjang
  durasi.tahap4 = getMs("tahap_4"); // Tindakan
  durasi.tahap5 = getMs("tahap_5"); // Keputusan
  durasi.tahap6 = getMs("tahap_6"); // Disposisi

  // Hitung total durasi: Penjumlahan EXACT dari durasi setiap tahap (tidak ada pembulatan)
  try {
    totalDurasiMs = 0;
    
    // Penjumlahan langsung dari durasi yang sudah dihitung
    if (durasi.tahap1 !== null) totalDurasiMs += durasi.tahap1;
    if (durasi.tahap2 !== null) totalDurasiMs += durasi.tahap2;
    if (durasi.tahap3 !== null) totalDurasiMs += durasi.tahap3;
    if (durasi.tahap4 !== null) totalDurasiMs += durasi.tahap4;
    if (durasi.tahap5 !== null) totalDurasiMs += durasi.tahap5;
    if (durasi.tahap6 !== null) totalDurasiMs += durasi.tahap6;

  } catch (e) {
    console.error("Error menghitung total durasi:", e);
  }
  // --- Akhir Logika Durasi ---

  // (Sisanya dari file Anda, tidak berubah)
  let statusInfo = {
    text: "Selesai (Rawat Jalan)",
    color: "bg-green-600 text-white"
  };
  if (kunjungan.keputusan_akhir === "rawat") {
    statusInfo = { text: "Selesai (Rawat Inap)", color: "bg-blue-600 text-white" };
  } else if (kunjungan.keputusan_akhir === "meninggal") {
    statusInfo = { text: "Selesai (Meninggal)", color: "bg-gray-800 text-white" };
  } else if (kunjungan.keputusan_akhir === "rujuk") {
    statusInfo = { text: "Rujuk", color: "bg-teal-600 text-white" };
  } else if (kunjungan.keputusan_akhir === "dihapus") {
    statusInfo = { text: "Dihapus", color: "bg-red-600 text-white" };
  }
  const keputusanPenunjang = kunjungan.pemeriksaan_penunjang?.skip ? 'tidak_perlu' : 'sudah';
  // Jika data pemeriksaan_penunjang belum ada, default 'belum_diperiksa'
  let keputusanPenunjangFinal = 'belum_diperiksa';
  if (kunjungan.pemeriksaan_penunjang) {
    keputusanPenunjangFinal = kunjungan.pemeriksaan_penunjang?.skip ? 'tidak_perlu' : 'sudah';
  }

  // Badge jenis pasien
  const jenisPasien = kunjungan.jenis_pasien || "-";
  // Warna badge disamakan dengan StatCard
  const badgeColor = {
    "Umum": "bg-orange-500 text-white",
    "Anak": "bg-cyan-500 text-white",
    "Kebidanan": "bg-green-500 text-white",
    "Non Bedah": "bg-blue-500 text-white",
    "Bedah": "bg-orange-500 text-white",
    "-": "bg-gray-100 text-gray-500"
  }[jenisPasien] || "bg-gray-100 text-gray-500";

    // Badge penjamin
    let penjaminLabel = kunjungan.penjamin || "-";
    if (kunjungan.penjamin && kunjungan.penjamin.toLowerCase() === "asuransi lainnya") {
      penjaminLabel = "Asuransi";
    }
    let penjaminColor = "";
    if (kunjungan.penjamin && kunjungan.penjamin.toLowerCase() === "umum") {
      penjaminColor = "bg-blue-600 text-white"; // Padma (Non-BPJS)
    } else {
      penjaminColor = "bg-green-600 text-white"; // Kamala (BPJS/JKN)
    }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="modal-backdrop-rekap"
            className="fixed inset-0 bg-black/30 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="modal-panel-rekap"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-lg flex flex-col" // max-w-lg agar lebih lebar
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            {/* Header Modal */}
            <div className="flex justify-between items-center p-4 pb-2 border-b border-gray-200 flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Rekap Alur Pasien
                </h3>
                <div className="mt-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 flex items-center gap-2">
                  {/* Icon pasien opsional */}
                  <User className="text-gray-400" size={20} />
                  <span className="text-lg font-bold text-gray-800">{kunjungan.nama}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border text-center ${badgeColor}`}>{jenisPasien}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border text-center ${penjaminColor}`}>{penjaminLabel}</span>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 ml-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Konten Modal */}
            <div className="p-4">
              <div className="space-y-2"> 
                {/* Info Triase (dari data V2) */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1.5">Pemeriksaan Awal (Triase)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                      <label className="text-xs text-gray-500">Kategori Triase</label>
                      <p className={`text-sm font-bold ${
                        kunjungan.triase === 'resusitasi' ? 'text-red-600' :
                        kunjungan.triase === 'emergency' ? 'text-yellow-600' :
                        kunjungan.triase === 'semi' ? 'text-green-600' :
                        'text-gray-600'
                      }`}>
                        {kunjungan.triase === 'resusitasi' ? 'RESUSITASI' :
                         kunjungan.triase === 'emergency' ? 'EMERGENCY' :
                         kunjungan.triase === 'semi' ? 'FALSE-EMERGENCY' :
                         kunjungan.triase || "-"}
                      </p>
                    </div>
                    <div className="bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                      <label className="text-xs text-gray-500">Perawat Triase</label>
                      <p className="text-sm font-medium text-gray-800">{kunjungan.perawat || "-"}</p>
                    </div>
                    <div className="bg-gray-50 px-2 py-1 rounded-md border border-gray-200 col-span-2">
                      <label className="text-xs text-gray-500">Dokter IGD</label>
                      <p className="text-sm font-medium text-gray-800">{kunjungan.gp || "-"}</p>
                    </div>
                    {kunjungan.keputusan_akhir === "rawat" && kunjungan.dpjp && (
                      <div className="bg-gray-50 px-2 py-1 rounded-md border border-gray-200 col-span-2">
                        <label className="text-xs text-gray-500">Dokter DPJP (Rawat Inap)</label>
                        <p className="text-sm font-medium text-gray-800">{kunjungan.dpjp}</p>
                      </div>
                    )}
                    {kunjungan.keputusan_akhir === "rawat" && kunjungan.disposisi_ruangan && (
                      <div className="bg-gray-50 px-2 py-1 rounded-md border border-gray-200 col-span-2">
                        <label className="text-xs text-gray-500">Ruang Rawat Inap</label>
                        <p className="text-sm font-medium text-gray-800">{kunjungan.disposisi_ruangan}</p>
                      </div>
                    )}
                    <div className="bg-gray-50 px-2 py-1 rounded-md border border-gray-200 col-span-2">
                      <label className="text-xs text-gray-500">Pemeriksaan Penunjang</label>
                      <p className="text-sm font-medium text-gray-800">
                        {keputusanPenunjangFinal === 'sudah'
                          ? 'Pasien Sudah Melakukan Pemeriksaan'
                          : keputusanPenunjangFinal === 'tidak_perlu'
                            ? 'Pasien Tidak Perlu Pemeriksaan'
                            : 'Pasien Belum Diperiksa'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Info Durasi (Sekarang REAL) */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1.5">Durasi Tahapan</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex justify-between items-center">
                      <span className="flex items-center gap-2"><ShieldAlert size={14} /> Pendaftaran & Pemeriksaan Awal:</span>
                      <span className="font-semibold">{formatDuration(durasi.tahap1)}</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="flex items-center gap-2"><Stethoscope size={14} /> Pemeriksaan Dokter IGD:</span>
                      <span className="font-semibold">{formatDuration(durasi.tahap2)}</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="flex items-center gap-2"><FlaskRound size={14} /> Pemeriksaan Penunjang:</span>
                      <span className="font-semibold">{formatDuration(durasi.tahap3)}</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="flex items-center gap-2"><CheckCircle2 size={14} /> Tindakan & Pengobatan:</span>
                      <span className="font-semibold">{formatDuration(durasi.tahap4)}</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="flex items-center gap-2"><User size={14} /> Keputusan Akhir:</span>
                      <span className="font-semibold">{formatDuration(durasi.tahap5)}</span>
                    </li>
                    {kunjungan.keputusan_akhir === "rawat" && (
                      <li className="flex justify-between items-center">
                        <span className="flex items-center gap-2"><Bed size={14} /> Disposisi Pasien:</span>
                        <span className="font-semibold">{formatDuration(durasi.tahap6)}</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* --- Status Akhir --- */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1.5">Status Akhir</h4>
                  <div className="flex">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                      <Award size={16} />
                      {statusInfo.text}
                    </span>
                  </div>
                  {/* Container alasan penghapusan di bawah badge 'Dihapus' */}
                  {kunjungan.keputusan_akhir === "dihapus" && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3">
                      <h4 className="text-sm font-semibold text-red-800 mb-1">Alasan Penghapusan</h4>
                      <p className="text-sm text-red-700 whitespace-pre-line">{kunjungan.alasan_hapus || "-"}</p>
                    </div>
                  )}
                  {/* Container alasan rujuk di bawah badge 'Rujuk' */}
                  {kunjungan.keputusan_akhir === "rujuk" && kunjungan.alasan_rujuk && (
                    <div className="mt-3 bg-teal-50 border border-teal-200 rounded-md p-3">
                      <h4 className="text-sm font-semibold text-teal-800 mb-1">Alasan Rujuk</h4>
                      <p className="text-sm text-teal-700 whitespace-pre-line">{kunjungan.alasan_rujuk}</p>
                    </div>
                  )}
                </div>

                {/* Alasan Hapus (jika pasien dihapus) */}

                {/* Total Waktu (Sekarang REAL) */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-base font-bold text-gray-900">Total Waktu Proses</span>
                  <span className="text-xl font-bold text-blue-600">{formatDuration(totalDurasiMs)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
// --- Akhir Komponen Modal Rekap ---


// 🚀 Self-fetching dengan backend pagination
export default function PasienSelesai({ keputusanAkhirFilter = "" }) {
  const { session } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPasien, setSelectedPasien] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [startDateDisplay, setStartDateDisplay] = useState("");
  const [endDateDisplay, setEndDateDisplay] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  // Backend data states
  const [pasienSelesaiData, setPasienSelesaiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50
  });
    // Fetch function untuk backend pagination
  const fetchPasienSelesai = async (page = 1) => {
    if (!session?.access_token) return;
    
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const url = new URL(`${API_URL}/api/v2/kunjungan`);
      
      // Pagination
      url.searchParams.append('page', page);
      url.searchParams.append('limit', itemsPerPage);
      url.searchParams.append('status', 'Selesai');
      
      // Filter: Keputusan Akhir
      if (keputusanAkhirFilter && keputusanAkhirFilter !== '') {
        url.searchParams.append('keputusan_akhir', keputusanAkhirFilter);
      }
      
      // Filter: Search
      if (appliedSearch && appliedSearch.trim() !== '') {
        url.searchParams.append('search', appliedSearch.trim());
      }
      
      // Filter: Date Range (YYYY-MM-DD format)
      if (startDateDisplay && endDateDisplay) {
        const startDate = parseDisplayDate(startDateDisplay);
        const endDate = parseDisplayDate(endDateDisplay);
        
        if (startDate && endDate) {
          // Validasi max 7 hari
          const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
          if (diffDays > 7) {
            window.dispatchEvent(new CustomEvent('show-toast', {
              detail: { message: 'Rentang tanggal maksimal 7 hari!', type: 'error' }
            }));
            setLoading(false);
            return;
          }
          
          url.searchParams.append('startDate', startDate.toISOString().split('T')[0]);
          url.searchParams.append('endDate', endDate.toISOString().split('T')[0]);
        }
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch');
      }
      
      const result = await response.json();
      setPasienSelesaiData(result.data || []);
      setPaginationInfo(result.pagination || {
        currentPage: page,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: itemsPerPage
      });
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching pasien selesai:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: error.message, type: 'error' }
      }));
    } finally {
      setLoading(false);
    }
  };
  
  // useEffect untuk fetch when filters change
  useEffect(() => {
    if (session?.access_token) {
      fetchPasienSelesai(1); // Reset to page 1
    }
  }, [appliedSearch, startDateDisplay, endDateDisplay, keputusanAkhirFilter, session]);
  
  // Manual search handlers
  const handleSearch = () => {
    setAppliedSearch(searchQuery);
  };
  
  const handleClearSearch = () => {
    setSearchQuery("");
    setAppliedSearch("");
  };
  
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  // Handler untuk input tanggal dengan format DD/MM/YYYY
  const handleDateInput = (value, setter) => {
    // Hanya izinkan angka dan /
    const cleaned = value.replace(/[^\d\/]/g, '');
    
    // Auto-format saat user mengetik
    let formatted = cleaned;
    if (cleaned.length >= 2 && !cleaned.includes('/')) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length >= 5 && cleaned.split('/').length === 2) {
      const parts = cleaned.split('/');
      formatted = parts[0] + '/' + parts[1].slice(0, 2) + '/' + parts[1].slice(2);
    }
    
    setter(formatted);
  };
  
  // Helper untuk convert DD/MM/YYYY ke Date object
  const parseDisplayDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 10) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const [dd, mm, yyyy] = parts;
    const day = parseInt(dd, 10);
    const month = parseInt(mm, 10);
    const year = parseInt(yyyy, 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return null;
    
    return new Date(year, month - 1, day);
  };

  const handleRowClick = (kunjungan) => {
    setSelectedPasien(kunjungan); // 'kunjungan' adalah objek data V2
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedPasien(null);
    }, 300); 
  };

  // Helper untuk mendapatkan waktu selesai dalam bentuk Date object (untuk filter)
  const getWaktuSelesaiRaw = (kunjungan) => {
    const timestamps = kunjungan.step_timestamps || {};
    let finalTimestamp = null;
    
    if (kunjungan.keputusan_akhir === "dihapus") {
      const currentStep = kunjungan.current_step || 1;
      const stepKey = `tahap_${currentStep}`;
      finalTimestamp = timestamps[stepKey] ? timestamps[stepKey].end_time : null;
    } else if (kunjungan.keputusan_akhir === "rawat") {
      finalTimestamp = timestamps["tahap_6"] ? timestamps["tahap_6"].end_time : null;
    } else {
      finalTimestamp = timestamps["tahap_5"] ? timestamps["tahap_5"].end_time : null;
    }

    if (!finalTimestamp) {
      finalTimestamp = kunjungan.updated_at;
    }
    
    return finalTimestamp ? new Date(finalTimestamp) : null;
  };

  // Reset page ke 1 ketika search/filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDateDisplay, endDateDisplay, keputusanAkhirFilter]);

  // Data sudah filtered di backend, langsung gunakan
  const filteredPasien = pasienSelesaiData;
  
  // Old client-side filter (REMOVED - now handled by backend)
  /* const filteredPasien = useMemo(() => {
    if (!pasienSelesaiData) return [];
  }, [pasienSelesaiData, searchQuery, startDateDisplay, endDateDisplay, keputusanAkhirFilter]); */

  // Pagination dari backend
  const totalPages = paginationInfo.totalPages;
  const totalItems = paginationInfo.totalItems;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchPasienSelesai(page); // Fetch dari backend
    }
  };

  // 🚀 (BARU) Fungsi untuk mendapatkan Waktu Selesai yang REAL
  const getWaktuSelesai = (kunjungan) => {
    const timestamps = kunjungan.step_timestamps || {};
    let finalTimestamp = null;
    
    // Jika pasien dihapus, gunakan end_time dari tahap terakhir yang tercatat
    if (kunjungan.keputusan_akhir === "dihapus") {
      // Cari end_time dari tahap terakhir yang tersedia
      const currentStep = kunjungan.current_step || 1;
      const stepKey = `tahap_${currentStep}`;
      finalTimestamp = timestamps[stepKey] ? timestamps[stepKey].end_time : null;
    } else if (kunjungan.keputusan_akhir === "rawat") {
      finalTimestamp = timestamps["tahap_6"] ? timestamps["tahap_6"].end_time : null;
    } else {
      finalTimestamp = timestamps["tahap_5"] ? timestamps["tahap_5"].end_time : null;
    }

    // Fallback jika timestamp tidak ada, gunakan updated_at
    if (!finalTimestamp) {
      finalTimestamp = kunjungan.updated_at;
    }
    
    return formatTimestamp(finalTimestamp);
  };

  // Helper untuk mendapatkan durasi per tahap
  const getDurasiTahap = (kunjungan, tahapNum) => {
    const timestamps = kunjungan.step_timestamps || {};
    const stepKey = `tahap_${tahapNum}`;
    const data = timestamps[stepKey];
    if (data && data.start_time && data.end_time) {
      return new Date(data.end_time).getTime() - new Date(data.start_time).getTime();
    }
    return 0;
  };

  // Helper untuk mendapatkan total durasi
  const getTotalDurasi = (kunjungan) => {
    let totalMs = 0;
    for (let i = 1; i <= 6; i++) {
      totalMs += getDurasiTahap(kunjungan, i);
    }
    return totalMs;
  };

  // Export CSV dengan fetch all filtered data
  const handleExportCSV = async () => {
    if (!session?.access_token) return;
    
    setIsExporting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const url = new URL(`${API_URL}/api/v2/kunjungan`);
      
      // Apply same filters but no pagination (limit=5000 for export)
      url.searchParams.append('page', '1');
      url.searchParams.append('limit', '5000');
      url.searchParams.append('status', 'Selesai');
      
      if (keputusanAkhirFilter && keputusanAkhirFilter !== '') {
        url.searchParams.append('keputusan_akhir', keputusanAkhirFilter);
      }
      
      if (appliedSearch && appliedSearch.trim() !== '') {
        url.searchParams.append('search', appliedSearch.trim());
      }
      
      if (startDateDisplay && endDateDisplay) {
        const startDate = parseDisplayDate(startDateDisplay);
        const endDate = parseDisplayDate(endDateDisplay);
        
        if (startDate && endDate) {
          url.searchParams.append('startDate', startDate.toISOString().split('T')[0]);
          url.searchParams.append('endDate', endDate.toISOString().split('T')[0]);
        }
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch export data');
      }
      
      const result = await response.json();
      const exportData = result.data || [];
      
      if (exportData.length === 0) {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: 'Tidak ada data untuk diexport!', type: 'error' }
        }));
        return;
      }
      
      // Generate CSV from all data
      const csvData = exportData.map(kunjungan => ({
        'Nomor Antrian': kunjungan.nomor_antrian || '-',
        'Nama Pasien': kunjungan.nama || '-',
        'Tanggal Masuk': formatTimestampCSV(kunjungan.created_at),
        'Waktu Selesai': getWaktuSelesaiCSV(kunjungan),
        'Total Durasi': formatDuration(getTotalDurasi(kunjungan)),
        'Jenis Pasien': kunjungan.jenis_pasien || '-',
        'Penjamin': kunjungan.penjamin || '-',
        'ESI Level': kunjungan.triase?.esi || '-',
        'Durasi Tahap 1': formatDuration(getDurasiTahap(kunjungan, 1)),
        'Durasi Tahap 2': formatDuration(getDurasiTahap(kunjungan, 2)),
        'Durasi Tahap 3': formatDuration(getDurasiTahap(kunjungan, 3)),
        'Durasi Tahap 4': formatDuration(getDurasiTahap(kunjungan, 4)),
        'Durasi Tahap 5': formatDuration(getDurasiTahap(kunjungan, 5)),
        'Durasi Tahap 6': formatDuration(getDurasiTahap(kunjungan, 6)),
        'Status Akhir': kunjungan.keputusan_akhir || '-',
        'Disposisi Ruangan': kunjungan.disposisi_ruangan || '-',
        'Alasan Hapus': kunjungan.alasan_hapus || '-',
        'Alasan Rujuk': kunjungan.alasan_rujuk || '-'
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const urlBlob = URL.createObjectURL(blob);
      const today = new Date().toISOString().split('T')[0];
      
      link.setAttribute('href', urlBlob);
      link.setAttribute('download', `Rekap_Pasien_Selesai_${today}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { 
          message: `CSV berhasil diunduh! (${exportData.length} data)`, 
          type: 'success' 
        }
      }));
    } catch (error) {
      console.error('Error exporting CSV:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Gagal mengexport data!', type: 'error' }
      }));
    } finally {
      setIsExporting(false);
    }
  };

  // Helper untuk mendapatkan waktu selesai formatted untuk CSV (DD/MM/YYYY)
  const getWaktuSelesaiCSV = (kunjungan) => {
    const timestamps = kunjungan.step_timestamps || {};
    let finalTimestamp = null;
    
    if (kunjungan.keputusan_akhir === "dihapus") {
      const currentStep = kunjungan.current_step || 1;
      const stepKey = `tahap_${currentStep}`;
      finalTimestamp = timestamps[stepKey] ? timestamps[stepKey].end_time : null;
    } else if (kunjungan.keputusan_akhir === "rawat") {
      finalTimestamp = timestamps["tahap_6"] ? timestamps["tahap_6"].end_time : null;
    } else {
      finalTimestamp = timestamps["tahap_5"] ? timestamps["tahap_5"].end_time : null;
    }

    if (!finalTimestamp) {
      finalTimestamp = kunjungan.updated_at;
    }
    
    return formatTimestampCSV(finalTimestamp);
  };



  return (
    <>
      <div className="mt-6 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        
        {/* --- Date Filter & Export Button --- */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Dari:</label>
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={startDateDisplay}
                onChange={(e) => handleDateInput(e.target.value, setStartDateDisplay)}
                maxLength={10}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-32"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sampai:</label>
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={endDateDisplay}
                onChange={(e) => handleDateInput(e.target.value, setEndDateDisplay)}
                maxLength={10}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-32"
              />
            </div>
            <button
              onClick={() => {
                setStartDateDisplay("");
                setEndDateDisplay("");
                setSearchQuery("");
                setAppliedSearch("");
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-200"
            >
              Reset Filter
            </button>
            <button
              onClick={handleExportCSV}
              disabled={isExporting || loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors duration-200 whitespace-nowrap"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Mengunduh...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Unduh Laporan
                </>
              )}
            </button>
            <span className="text-xs text-gray-500">*Maksimal rentang 7 hari</span>
          </div>
        </div>
        {/* --- Akhir Date Filter & Export Button --- */}
        
        {/* --- Search Bar dengan Button --- */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center flex-1 gap-2 bg-white border border-gray-300 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-green-500">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama pasien atau ruangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="w-full text-sm bg-transparent focus:outline-none placeholder-gray-400 text-gray-700"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
            >
              <Search size={16} />
              Cari
            </button>
            {appliedSearch && (
              <button
                onClick={handleClearSearch}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 text-sm font-medium rounded-md transition-colors duration-200 whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
          {appliedSearch && (
            <div className="mt-2 text-sm text-gray-600">
              Hasil pencarian: <span className="font-semibold">"{appliedSearch}"</span>
            </div>
          )}
        </div>
        {/* --- Akhir Search Bar --- */}

        <table className="w-full text-sm text-gray-700">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-6 py-3 font-semibold">Pasien</th>
              <th className="px-6 py-3 font-semibold">Tanggal Masuk</th>
              <th className="px-6 py-3 font-semibold">Waktu Selesai</th>
              <th className="px-6 py-3 font-semibold">Ruangan</th>
              <th className="px-6 py-3 font-semibold">Status Akhir</th>
            </tr>
          </thead>
          <tbody>
            {/* Show loading skeleton */}
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td colSpan="5" className="px-6 py-3">
                    <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
                  </td>
                </tr>
              ))
            ) : filteredPasien && filteredPasien.length > 0 ? (
              filteredPasien.map((kunjungan) => {
                
                // --- 🚀 Logika Dinamis (Persyaratan Anda) ---
                const { keputusan_akhir } = kunjungan;
                
                // Logika inisial: 1 kata = 1 huruf, 2 kata = 2 huruf, 3+ kata = 3 huruf
                const namaWords = (kunjungan.nama || "").split(" ").filter(word => word.length > 0);
                let inisial = "";
                if (namaWords.length === 1) {
                  inisial = namaWords[0][0].toUpperCase();
                } else if (namaWords.length === 2) {
                  inisial = (namaWords[0][0] + namaWords[1][0]).toUpperCase();
                } else if (namaWords.length >= 3) {
                  inisial = (namaWords[0][0] + namaWords[1][0] + namaWords[2][0]).toUpperCase();
                }
                let tanggalMasuk = formatTimestamp(kunjungan.created_at);
                let waktuSelesai = getWaktuSelesai(kunjungan); // 🚀 Panggil fungsi baru

                // Tentukan style berdasarkan 'keputusan_akhir'
                let statusInfo = {
                  text: "Rawat Jalan",
                  icon: <Home size={14} />,
                  color: "bg-green-100 text-green-700",
                  rowColor: "hover:bg-gray-100 cursor-pointer",
                  textColor: "text-gray-900",
                  inisialBg: "bg-gray-200 text-gray-700"
                };

                if (keputusan_akhir === "rawat") {
                  statusInfo = {
                    text: "Rawat Inap",
                    icon: <Bed size={14} />,
                    color: "bg-blue-100 text-blue-700",
                    rowColor: "bg-blue-50 text-blue-900 hover:bg-blue-100 cursor-pointer",
                    textColor: "text-blue-900",
                    inisialBg: "bg-blue-200 text-blue-800"
                  };
                } else if (keputusan_akhir === "meninggal") {
                  statusInfo = {
                    text: "Meninggal",
                    icon: <UserMinus size={14} />,
                    color: "bg-gray-200 text-gray-800",
                    rowColor: "bg-gray-100 text-gray-900 hover:bg-gray-200 cursor-pointer",
                    textColor: "text-gray-900",
                    inisialBg: "bg-gray-300 text-gray-800"
                  };
                } else if (keputusan_akhir === "rujuk") {
                  statusInfo = {
                    text: "Rujuk",
                    icon: <ArrowRightCircle size={14} />,
                    color: "bg-teal-100 text-teal-700",
                    rowColor: "bg-teal-50 text-teal-900 hover:bg-teal-100 cursor-pointer",
                    textColor: "text-teal-900",
                    inisialBg: "bg-teal-200 text-teal-800"
                  };
                } else if (keputusan_akhir === "dihapus") {
                  statusInfo = {
                    text: "Dihapus",
                    icon: <UserMinus size={14} />,
                    color: "bg-red-100 text-red-700",
                    rowColor: "bg-red-50 text-red-900 hover:bg-red-100 cursor-pointer",
                    textColor: "text-red-900",
                    inisialBg: "bg-red-200 text-red-800"
                  };
                }
                // --- Akhir Logika Dinamis ---

                return (
                  <tr
                    key={kunjungan.id}
                    onClick={() => handleRowClick(kunjungan)}
                    className={`border-t border-gray-200 transition-colors duration-150 ${statusInfo.rowColor}`}
                  >
                    <td className="px-6 py-3 flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${statusInfo.inisialBg}`}
                      >
                        {inisial}
                      </div>
                      <span className={`font-medium ${statusInfo.textColor}`}>
                        {kunjungan.nomor_antrian}
                      </span>
                    </td>

                    <td className={`px-6 py-3 font-medium ${statusInfo.textColor}`}>
                      {tanggalMasuk}
                    </td>

                    <td className={`px-6 py-3 ${statusInfo.textColor}`}>
                      {waktuSelesai}
                    </td>

                    <td className={`px-6 py-3 ${statusInfo.textColor}`}>
                      {keputusan_akhir === "rawat" ? (kunjungan.disposisi_ruangan || "-") : "-"}
                    </td>

                    <td className="px-6 py-3">
                      <span
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                      >
                        {statusInfo.icon}
                        {statusInfo.text}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr className="border-t border-gray-200">
                <td colSpan="5" className="text-center py-10 text-gray-500">
                  {appliedSearch ? `Tidak ada pasien dengan pencarian "${appliedSearch}"` : "Tidak ada data pasien selesai."}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {filteredPasien.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Menampilkan <span className="font-semibold">{totalItems > 0 ? startIndex + 1 : 0}</span> - <span className="font-semibold">{endIndex}</span> dari <span className="font-semibold">{totalItems}</span> pasien
              {appliedSearch && ` (hasil pencarian "${appliedSearch}")`}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 flex items-center gap-1"
              >
                <ChevronLeft size={16} />
                Sebelumnya
              </button>
              
              <div className="flex items-center gap-1">
                {/* Show first page */}
                {currentPage > 3 && (
                  <>
                    <button
                      onClick={() => goToPage(1)}
                      className="px-3 py-2 rounded-md text-sm font-medium bg-white border border-gray-300 hover:bg-gray-100 text-gray-700"
                    >
                      1
                    </button>
                    {currentPage > 4 && <span className="px-2 text-gray-500">...</span>}
                  </>
                )}
                
                {/* Show pages around current page */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page >= currentPage - 2 && page <= currentPage + 2)
                  .map(page => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        page === currentPage
                          ? 'bg-green-600 text-white'
                          : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                
                {/* Show last page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && <span className="px-2 text-gray-500">...</span>}
                    <button
                      onClick={() => goToPage(totalPages)}
                      className="px-3 py-2 rounded-md text-sm font-medium bg-white border border-gray-300 hover:bg-gray-100 text-gray-700"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 flex items-center gap-1"
              >
                Selanjutnya
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- Render Modal --- */}
      <RekapAlurPasienModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        pasien={selectedPasien}
      />
    </>
  );
}
