// src/pages/pagesAdmin/SettingsAkunAdmin.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, Timer, AlertTriangle, UserPlus, X, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoHermina from "../../assets/logo-hermina-baru.svg";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../supabaseClient";
import { getDashboardRoute } from "../../utils/navigationHelper";

export default function SettingsAkunAdmin() {
  const navigate = useNavigate();
  const { userProfile, session } = useAuth();
  
  // Function to get correct dashboard route based on user role - using helper
  const getBackToDashboard = () => getDashboardRoute(userProfile);
  
      // State untuk show/hide password pada form tambah akun
      const [showAkunPassword, setShowAkunPassword] = useState(false);
    // State untuk form tambah akun baru
    const [formAkun, setFormAkun] = useState({
      email: "",
      nama_lengkap: "",
      id_pegawai: "",
      jabatan: "",
      password: "",
      role: "",
      unit: ""
    });
    const [akunError, setAkunError] = useState("");
    const [akunSuccess, setAkunSuccess] = useState("");

    // Handler input
    const handleAkunInput = (e) => {
      const { name, value } = e.target;
      setFormAkun((prev) => ({ ...prev, [name]: value }));
    };

    // Validasi dan submit akun baru
    const handleSubmitAkun = async (e) => {
      e.preventDefault();
      setAkunError("");
      setAkunSuccess("");
      
      // Validasi
      if (!formAkun.email || !formAkun.nama_lengkap || !formAkun.id_pegawai || !formAkun.jabatan || !formAkun.password || !formAkun.role) {
        setAkunError("Semua field wajib diisi!");
        return;
      }
      if (!formAkun.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
        setAkunError("Email tidak valid!");
        return;
      }
      if (formAkun.password.length < 6) {
        setAkunError("Password minimal 6 karakter!");
        return;
      }
      
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        
        const response = await fetch(`${API_URL}/api/v2/admin/create-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formAkun.email,
            nama_lengkap: formAkun.nama_lengkap,
            id_pegawai: formAkun.id_pegawai,
            jabatan: formAkun.jabatan,
            password: formAkun.password,
            role: formAkun.role,
            unit: formAkun.unit || null
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          setAkunError(data.error || "Gagal membuat akun baru!");
          return;
        }
        
        setAkunSuccess("Akun berhasil dibuat!");
        setFormAkun({ email: "", nama_lengkap: "", id_pegawai: "", jabatan: "", password: "", role: "", unit: "" });
        setTimeout(() => setAkunSuccess(""), 3000);
      } catch (err) {
        console.error('Error creating account:', err);
        setAkunError(err.message || "Gagal membuat akun baru!");
      }
    };
  // State for unit selector
  const [activeUnit, setActiveUnit] = useState("kamala"); // "kamala" or "padma"

  const [activeTab, setActiveTab] = useState("profil"); // profil, esi, batasWaktu, petugasJaga

  // State untuk password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // State untuk ESI per unit
  const [esiKamala, setEsiKamala] = useState({
    kuningJam: "0",
    kuningMenit: "30",
    merahJam: "1",
    merahMenit: "0"
  });
  const [esiPadma, setEsiPadma] = useState({
    kuningJam: "0",
    kuningMenit: "30",
    merahJam: "1",
    merahMenit: "0"
  });

  // State untuk batas waktu per tahap (dalam menit) per unit
  const [batasWaktuKamala, setBatasWaktuKamala] = useState({
    tahap1: 15,  // Pendaftaran & Pemeriksaan Awal
    tahap2: 30,  // Pemeriksaan Dokter IGD
    tahap3: 45,  // Pemeriksaan Penunjang
    tahap4: 30,  // Tindakan & Pengobatan
    tahap5: 15,  // Keputusan Akhir
    tahap6: 20,  // Disposisi Pasien (Rawat Inap)
  });
  const [batasWaktuPadma, setBatasWaktuPadma] = useState({
    tahap1: 15,  // Pendaftaran & Pemeriksaan Awal
    tahap2: 30,  // Pemeriksaan Dokter IGD
    tahap3: 45,  // Pemeriksaan Penunjang
    tahap4: 30,  // Tindakan & Pengobatan
    tahap5: 15,  // Keputusan Akhir
    tahap6: 20,  // Disposisi Pasien (Rawat Inap)
  });

  // State untuk Pengaturan Petugas Jaga
  const [dokterGpList, setDokterGpList] = useState([]);
  const [dokterDpjpList, setDokterDpjpList] = useState([]);
  const [perawatList, setPerawatList] = useState([]);
  
  // State untuk input Petugas Jaga
  const [penanggungJawab, setPenanggungJawab] = useState([]);
  const [perawatJaga, setPerawatJaga] = useState([]);
  const [dokterIgdJaga, setDokterIgdJaga] = useState([]);
  
  // State untuk dropdown search
  const [searchPJ, setSearchPJ] = useState("");
  const [searchPerawat, setSearchPerawat] = useState("");
  const [searchDokterIgd, setSearchDokterIgd] = useState("");
  const [showDropdownPJ, setShowDropdownPJ] = useState(false);
  const [showDropdownPerawat, setShowDropdownPerawat] = useState(false);
  const [showDropdownDokterIgd, setShowDropdownDokterIgd] = useState(false);
  
  const dropdownPJRef = useRef(null);
  const dropdownPerawatRef = useRef(null);
  const dropdownDokterIgdRef = useRef(null);

  // Load settings dari database saat component mount
  useEffect(() => {
    // Fetch settings dari database
    const fetchSettings = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/v2/settings`);
        if (response.ok) {
          const data = await response.json();
          
          // Set ESI settings per unit
          if (data.esi_kamala) {
            setEsiKamala({
              kuningJam: String(data.esi_kamala.kuningJam || 0),
              kuningMenit: String(data.esi_kamala.kuningMenit || 30),
              merahJam: String(data.esi_kamala.merahJam || 1),
              merahMenit: String(data.esi_kamala.merahMenit || 0)
            });
          } else if (data.esi_kuning_jam !== undefined) {
            // Fallback to old settings for Kamala
            setEsiKamala({
              kuningJam: String(data.esi_kuning_jam || 0),
              kuningMenit: String(data.esi_kuning_menit || 30),
              merahJam: String(data.esi_merah_jam || 1),
              merahMenit: String(data.esi_merah_menit || 0)
            });
          }
          if (data.esi_padma) {
            setEsiPadma({
              kuningJam: String(data.esi_padma.kuningJam || 0),
              kuningMenit: String(data.esi_padma.kuningMenit || 30),
              merahJam: String(data.esi_padma.merahJam || 1),
              merahMenit: String(data.esi_padma.merahMenit || 0)
            });
          }
          
          // Set batas waktu tahap per unit
          if (data.batas_waktu_kamala) {
            setBatasWaktuKamala(data.batas_waktu_kamala);
          } else if (data.batas_waktu_tahap) {
            setBatasWaktuKamala(data.batas_waktu_tahap);
          }
          if (data.batas_waktu_padma) {
            setBatasWaktuPadma(data.batas_waktu_padma);
          }
          
          // Set petugas jaga
          if (data.petugas_jaga) {
            setPenanggungJawab(data.petugas_jaga.penanggungJawab || []);
            setPerawatJaga(data.petugas_jaga.perawatJaga || []);
            setDokterIgdJaga(data.petugas_jaga.dokterIgdJaga || []);
          }
        } else {
          console.error('Failed to fetch settings');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    const loadSettings = async () => {
      await fetchSettings();
    };

    loadSettings();

    // Fetch data dari database
    fetchPetugasData();
  }, []);

  // Fetch data petugas dari database
  const fetchPetugasData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      // Fetch Dokter GP
      const gpResponse = await fetch(`${API_URL}/api/v2/dokter-gp`);
      if (gpResponse.ok) {
        const gpData = await gpResponse.json();
        setDokterGpList(gpData);
      }

      // Fetch Dokter DPJP
      const dpjpResponse = await fetch(`${API_URL}/api/v2/dokter-dpjp`);
      if (dpjpResponse.ok) {
        const dpjpData = await dpjpResponse.json();
        setDokterDpjpList(dpjpData);
      }

      // Fetch Perawat
      const perawatResponse = await fetch(`${API_URL}/api/v2/perawat`);
      if (perawatResponse.ok) {
        const perawatData = await perawatResponse.json();
        setPerawatList(perawatData);
      }
    } catch (error) {
      console.error('Error fetching petugas data:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownPJRef.current && !dropdownPJRef.current.contains(event.target)) {
        setShowDropdownPJ(false);
      }
      if (dropdownPerawatRef.current && !dropdownPerawatRef.current.contains(event.target)) {
        setShowDropdownPerawat(false);
      }
      if (dropdownDokterIgdRef.current && !dropdownDokterIgdRef.current.contains(event.target)) {
        setShowDropdownDokterIgd(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConfirmLogout = async () => {
    setShowLogoutPopup(false);
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    }
    
    setTimeout(() => {
      navigate("/admin/login");
    }, 300);
  };

  const handleSavePassword = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    // Validasi
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("Semua field password wajib diisi!");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Password baru dan konfirmasi tidak cocok!");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Password baru minimal 6 karakter!");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    try {
      // Update password menggunakan Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccessMessage("Password berhasil diperbarui!");
      
      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      setTimeout(() => {
        setSuccessMessage("");
      }, 2000);
    } catch (error) {
      console.error("Error updating password:", error);
      setErrorMessage(error.message || "Gagal memperbarui password");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleSaveESI = async (e) => {
    e.preventDefault(); 
    
    const currentEsi = activeUnit === "kamala" ? esiKamala : esiPadma;
    const esiSettings = activeUnit === "kamala" 
      ? {
          esi_kamala: {
            kuningJam: parseInt(currentEsi.kuningJam) || 0,
            kuningMenit: parseInt(currentEsi.kuningMenit) || 0,
            merahJam: parseInt(currentEsi.merahJam) || 0,
            merahMenit: parseInt(currentEsi.merahMenit) || 0
          }
        }
      : {
          esi_padma: {
            kuningJam: parseInt(currentEsi.kuningJam) || 0,
            kuningMenit: parseInt(currentEsi.kuningMenit) || 0,
            merahJam: parseInt(currentEsi.merahJam) || 0,
            merahMenit: parseInt(currentEsi.merahMenit) || 0
          }
        };
    


    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/v2/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(esiSettings)
      });

      if (response.ok) {
        setSuccessMessage("Pengaturan ESI berhasil disimpan ke server!");
        setTimeout(() => {
          setSuccessMessage("");
        }, 1500);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving ESI settings:', error);
      setErrorMessage("Gagal menyimpan pengaturan ESI!");
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
    }
  };

  const handleBatasWaktuChange = (tahap, value) => {
    const numValue = value === '' ? '' : parseInt(value) || '';
    if (activeUnit === "kamala") {
      setBatasWaktuKamala(prev => ({
        ...prev,
        [tahap]: numValue
      }));
    } else {
      setBatasWaktuPadma(prev => ({
        ...prev,
        [tahap]: numValue
      }));
    }
  };

  const handleSaveBatasWaktu = async (e) => {
    e.preventDefault();
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const body = activeUnit === "kamala"
        ? { batas_waktu_kamala: batasWaktuKamala }
        : { batas_waktu_padma: batasWaktuPadma };
      const response = await fetch(`${API_URL}/api/v2/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setSuccessMessage("Pengaturan batas waktu per tahap berhasil disimpan ke server!");
        setTimeout(() => {
          setSuccessMessage("");
        }, 1500);
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving batas waktu:', error);
      setErrorMessage("Gagal menyimpan pengaturan batas waktu!");
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
    }
  };

  // Handler untuk Petugas Jaga
  const handleAddPenanggungJawab = (petugas) => {
    if (penanggungJawab.length < 2) {
      setPenanggungJawab([...penanggungJawab, petugas]);
      setSearchPJ("");
      setShowDropdownPJ(false);
    }
  };

  const handleRemovePenanggungJawab = (index) => {
    setPenanggungJawab(penanggungJawab.filter((_, i) => i !== index));
  };

  const handleAddPerawat = (perawat) => {
    if (perawatJaga.length < 14) {
      setPerawatJaga([...perawatJaga, perawat]);
      setSearchPerawat("");
      setShowDropdownPerawat(false);
    }
  };

  const handleRemovePerawat = (index) => {
    setPerawatJaga(perawatJaga.filter((_, i) => i !== index));
  };

  const handleAddDokterIgd = (dokter) => {
    if (dokterIgdJaga.length < 3) {
      setDokterIgdJaga([...dokterIgdJaga, dokter]);
      setSearchDokterIgd("");
      setShowDropdownDokterIgd(false);
    }
  };

  const handleRemoveDokterIgd = (index) => {
    setDokterIgdJaga(dokterIgdJaga.filter((_, i) => i !== index));
  };

  const handleSavePetugasJaga = async (e) => {
    e.preventDefault();
    
    const petugasJagaSettings = {
      penanggungJawab,
      perawatJaga,
      dokterIgdJaga
    };
    


    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/v2/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          petugas_jaga: petugasJagaSettings
        })
      });

      if (response.ok) {
        setSuccessMessage("Pengaturan Petugas Jaga berhasil disimpan ke server!");
        setTimeout(() => {
          setSuccessMessage("");
        }, 1500);
      } else {
        throw new Error('Failed to save petugas jaga');
      }
    } catch (error) {
      console.error('Error saving petugas jaga:', error);
      setErrorMessage("Gagal menyimpan pengaturan Petugas Jaga!");
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
    }
  };

  // Combine all staff for Penanggung Jawab dropdown
  const getAllStaff = () => {
    const allStaff = [];
    
    // Add Dokter GP
    dokterGpList.forEach(dokter => {
      allStaff.push({
        id: `gp_${dokter.examiner_key}`,
        nama: dokter.nama,
        type: 'Dokter IGD',
        code: dokter.doctor_code
      });
    });
    
    // Add Dokter DPJP
    dokterDpjpList.forEach(dokter => {
      allStaff.push({
        id: `dpjp_${dokter.id}`,
        nama: dokter.nama,
        type: 'Dokter DPJP',
        spesialisasi: dokter.spesialisasi
      });
    });
    
    // Add Perawat
    perawatList.forEach(perawat => {
      allStaff.push({
        id: `perawat_${perawat.id_pegawai}`,
        nama: perawat.nama,
        type: 'Perawat',
        peran: perawat.peran
      });
    });
    
    return allStaff;
  };

  // Filter functions
  const getFilteredPJ = () => {
    return getAllStaff().filter(staff =>
      staff.nama.toLowerCase().includes(searchPJ.toLowerCase()) &&
      !penanggungJawab.some(pj => pj.id === staff.id)
    );
  };

  const getFilteredPerawat = () => {
    return perawatList.filter(perawat =>
      perawat.nama.toLowerCase().includes(searchPerawat.toLowerCase()) &&
      !perawatJaga.some(p => p.id_pegawai === perawat.id_pegawai)
    );
  };

  const getFilteredDokterIgd = () => {
    return dokterGpList.filter(dokter =>
      dokter.nama.toLowerCase().includes(searchDokterIgd.toLowerCase()) &&
      !dokterIgdJaga.some(d => d.examiner_key === dokter.examiner_key)
    );
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* === HEADER === */}
      <div className="bg-green-700 text-white py-3 px-6 flex justify-between items-center shadow">
        <div>
          <h1 className="font-semibold text-lg flex items-center gap-2">
            <img
              src={logoHermina}
              alt="Logo Hermina"
              className="w-6 h-6"
            />
            Pengaturan Akun
          </h1>
          <p className="text-xs text-green-100 mt-0.5">
            Mode: <span className="font-semibold">SUPERADMIN</span> - Akses Penuh
          </p>
        </div>
        <button
          onClick={() => navigate(getBackToDashboard())}
          className="text-sm hover:underline flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Kembali ke Dashboard
        </button>
      </div>

      {/* === TAB NAVIGATION === */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("profil")}
              className={`px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "profil"
                  ? "text-green-700 border-b-2 border-green-700"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Profil Saya
            </button>
            <button
              onClick={() => setActiveTab("esi")}
              className={`px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "esi"
                  ? "text-green-700 border-b-2 border-green-700"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Pengaturan ESI
            </button>
            <button
              onClick={() => setActiveTab("batasWaktu")}
              className={`px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "batasWaktu"
                  ? "text-green-700 border-b-2 border-green-700"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Pengaturan Per Tahap
            </button>
            <button
              onClick={() => setActiveTab("petugasJaga")}
              className={`px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "petugasJaga"
                  ? "text-green-700 border-b-2 border-green-700"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Pengaturan Petugas Jaga
            </button>
              <button
                onClick={() => setActiveTab("daftarAkun")}
                className={`px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === "daftarAkun"
                    ? "text-green-700 border-b-2 border-green-700"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Daftar Akun
              </button>
          </div>
          {/* === UNIT SELECTOR === */}
          {(activeTab === "esi" || activeTab === "batasWaktu") && (
            <div className="flex gap-1 mt-2 justify-left">
              <button
                onClick={() => setActiveUnit("kamala")}
                className={`px-6 py-2 text-sm font-medium rounded-t transition-all border-b-2 ${
                  activeUnit === "kamala"
                    ? "text-green-700 border-green-700 bg-green-50"
                    : "text-gray-600 hover:text-gray-800 border-transparent bg-white"
                }`}
              >
                Kamala
              </button>
              <button
                onClick={() => setActiveUnit("padma")}
                className={`px-6 py-2 text-sm font-medium rounded-t transition-all border-b-2 ${
                  activeUnit === "padma"
                    ? "text-green-700 border-green-700 bg-green-50"
                    : "text-gray-600 hover:text-gray-800 border-transparent bg-white"
                }`}
              >
                Padma
              </button>
            </div>
          )}
        </div>
      </div>

      {/* === BODY === */}
      <div className="p-8 max-w-6xl mx-auto md:pb-8">
        
        {/* TAB: PROFIL SAYA */}
        {activeTab === "profil" && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* PROFIL SAYA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white shadow-md rounded-xl p-6"
            >
              <h2 className="font-semibold text-gray-800 mb-4">Profil Saya</h2>
              <div className="flex flex-col items-center">
                <div className="bg-green-700 text-white rounded-full w-24 h-24 flex items-center justify-center text-3xl font-bold mb-4">
                  {userProfile?.nama_lengkap ? userProfile.nama_lengkap.substring(0, 2).toUpperCase() : "??"}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {userProfile?.nama_lengkap || "Memuat..."}
                </h3>
                <p className="text-gray-500 mb-4 text-sm">{userProfile?.jabatan || "..."}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 font-medium">Nama Lengkap</label>
                  <input
                    type="text"
                    value={userProfile?.nama_lengkap || ""}
                    className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">ID Pegawai (NIP)</label>
                  <input
                    type="text"
                    value={userProfile?.id_pegawai || "-"}
                    className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Peran</label>
                  <input
                    type="text"
                    value={userProfile?.jabatan || ""}
                    className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Unit</label>
                  <input
                    type="text"
                    value="IGD RS Hermina"
                    className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                    readOnly
                  />
                </div>
              </div>
            </motion.div>

            {/* KEAMANAN & AKSES */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
              className="bg-white shadow-md rounded-xl p-6"
            >
              <h2 className="font-semibold text-gray-800 mb-4">Keamanan & Akses</h2>

              {errorMessage && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-4">
                {/* Password Saat Ini */}
                <div>
                  <label className="text-sm text-gray-600 font-medium">Password Saat Ini</label>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan password saat ini"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm pr-10 focus:ring-2 focus:ring-green-600"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                      className="absolute right-3 top-2.5 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Password Baru */}
                <div>
                  <label className="text-sm text-gray-600 font-medium">Password Baru</label>
                  <div className="relative mt-1">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan password baru"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm pr-10 focus:ring-2 focus:ring-green-600"
                    />
                    <button
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      type="button"
                      className="absolute right-3 top-2.5 text-gray-500"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Konfirmasi Password Baru */}
                <div>
                  <label className="text-sm text-gray-600 font-medium">Konfirmasi Password Baru</label>
                  <div className="relative mt-1">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Masukkan ulang password baru"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm pr-10 focus:ring-2 focus:ring-green-600"
                    />
                    <button
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      type="button"
                      className="absolute right-3 top-2.5 text-gray-500"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Button Simpan */}
                <button
                  onClick={handleSavePassword}
                  className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2 rounded-md transition mt-2"
                >
                  Simpan Perubahan Password
                </button>
              </div>

              {/* Keluar dari Sistem */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Keluar dari Sistem</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Klik tombol di bawah untuk keluar dari akun Anda.
                </p>
                <button
                  onClick={() => setShowLogoutPopup(true)}
                  className="w-full border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-medium py-2 rounded-md transition"
                >
                  Keluar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* TAB: PENGATURAN ESI */}
        {activeTab === "esi" && (
          <motion.form
            onSubmit={handleSaveESI}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white shadow-md rounded-xl p-6"
          >
            <h2 className="font-semibold text-gray-800 mb-2">Pengaturan Emergency Severity Index (ESI)</h2>
            <p className="text-sm text-gray-500 mb-6">
              Atur batas waktu (Jam & Menit) sebelum timer pasien berubah warna.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Batas Kuning BLOK */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                <label className="text-base text-yellow-800 font-semibold flex items-center gap-2">
                  <Timer size={20} className="text-yellow-600" />
                  Batas Waktu KUNING
                </label>
                <p className="text-sm text-yellow-700">
                  Pasien akan menjadi kuning setelah waktu ini terlewati.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      value={activeUnit === "kamala" ? esiKamala.kuningJam : esiPadma.kuningJam}
                      onChange={(e) => {
                        if (activeUnit === "kamala") {
                          setEsiKamala({...esiKamala, kuningJam: e.target.value});
                        } else {
                          setEsiPadma({...esiPadma, kuningJam: e.target.value});
                        }
                      }}
                      className="w-20 border-none bg-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500"
                    />
                    <span className="text-sm text-yellow-800">Jam</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={activeUnit === "kamala" ? esiKamala.kuningMenit : esiPadma.kuningMenit}
                      onChange={(e) => {
                        if (activeUnit === "kamala") {
                          setEsiKamala({...esiKamala, kuningMenit: e.target.value});
                        } else {
                          setEsiPadma({...esiPadma, kuningMenit: e.target.value});
                        }
                      }}
                      className="w-20 border-none bg-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500"
                    />
                    <span className="text-sm text-yellow-800">Menit</span>
                  </div>
                </div>
              </div>

              {/* Batas Merah BLOK */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                <label className="text-base text-red-800 font-semibold flex items-center gap-2">
                  <Timer size={20} className="text-red-600" />
                  Batas Waktu MERAH
                </label>
                <p className="text-sm text-red-700">
                  Pasien akan menjadi merah setelah waktu ini terlewati.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      value={activeUnit === "kamala" ? esiKamala.merahJam : esiPadma.merahJam}
                      onChange={(e) => {
                        if (activeUnit === "kamala") {
                          setEsiKamala({...esiKamala, merahJam: e.target.value});
                        } else {
                          setEsiPadma({...esiPadma, merahJam: e.target.value});
                        }
                      }}
                      className="w-20 border-none bg-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                    />
                    <span className="text-sm text-red-800">Jam</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={activeUnit === "kamala" ? esiKamala.merahMenit : esiPadma.merahMenit}
                      onChange={(e) => {
                        if (activeUnit === "kamala") {
                          setEsiKamala({...esiKamala, merahMenit: e.target.value});
                        } else {
                          setEsiPadma({...esiPadma, merahMenit: e.target.value});
                        }
                      }}
                      className="w-20 border-none bg-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                    />
                    <span className="text-sm text-red-800">Menit</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto mt-6 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md transition-all duration-300 shadow"
            >
              Simpan Pengaturan ESI
            </button>
          </motion.form>
        )}

        {/* TAB: PENGATURAN BATAS WAKTU PER TAHAP */}
        {activeTab === "batasWaktu" && (
          <motion.form
            onSubmit={handleSaveBatasWaktu}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white shadow-md rounded-xl p-6"
          >
            <h2 className="font-semibold text-gray-800 mb-2">Pengaturan Batas Waktu Per Tahap</h2>
            <p className="text-sm text-gray-500 mb-6">
              Atur batas waktu maksimal untuk setiap tahap proses pasien. Timer akan berubah warna jika melebihi batas waktu yang ditentukan.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tahap 1 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="text-sm font-semibold text-blue-800 flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                  Tahap 1
                </label>
                <p className="text-xs text-blue-700 mb-3">Pendaftaran & Pemeriksaan Awal</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={activeUnit === "kamala" ? batasWaktuKamala.tahap1 : batasWaktuPadma.tahap1}
                    onChange={(e) => handleBatasWaktuChange('tahap1', e.target.value)}
                    placeholder="0"
                    className="w-20 border-none bg-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                  <span className="text-sm text-blue-800">Menit</span>
                </div>
              </div>

              {/* Tahap 2 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <label className="text-sm font-semibold text-green-800 flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">2</div>
                  Tahap 2
                </label>
                <p className="text-xs text-green-700 mb-3">Pemeriksaan Dokter IGD</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={activeUnit === "kamala" ? batasWaktuKamala.tahap2 : batasWaktuPadma.tahap2}
                    onChange={(e) => handleBatasWaktuChange('tahap2', e.target.value)}
                    placeholder="0"
                    className="w-20 border-none bg-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 shadow-sm"
                  />
                  <span className="text-sm text-green-800">Menit</span>
                </div>
              </div>

              {/* Tahap 3 */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <label className="text-sm font-semibold text-purple-800 flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">3</div>
                  Tahap 3
                </label>
                <p className="text-xs text-purple-700 mb-3">Pemeriksaan Penunjang</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={activeUnit === "kamala" ? batasWaktuKamala.tahap3 : batasWaktuPadma.tahap3}
                    onChange={(e) => handleBatasWaktuChange('tahap3', e.target.value)}
                    placeholder="0"
                    className="w-20 border-none bg-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 shadow-sm"
                  />
                  <span className="text-sm text-purple-800">Menit</span>
                </div>
              </div>

              {/* Tahap 4 */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <label className="text-sm font-semibold text-orange-800 flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-bold">4</div>
                  Tahap 4
                </label>
                <p className="text-xs text-orange-700 mb-3">Tindakan & Pengobatan</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={activeUnit === "kamala" ? batasWaktuKamala.tahap4 : batasWaktuPadma.tahap4}
                    onChange={(e) => handleBatasWaktuChange('tahap4', e.target.value)}
                    placeholder="0"
                    className="w-20 border-none bg-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 shadow-sm"
                  />
                  <span className="text-sm text-orange-800">Menit</span>
                </div>
              </div>

              {/* Tahap 5 */}
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <label className="text-sm font-semibold text-teal-800 flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">5</div>
                  Tahap 5
                </label>
                <p className="text-xs text-teal-700 mb-3">Keputusan Akhir</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={activeUnit === "kamala" ? batasWaktuKamala.tahap5 : batasWaktuPadma.tahap5}
                    onChange={(e) => handleBatasWaktuChange('tahap5', e.target.value)}
                    placeholder="0"
                    className="w-20 border-none bg-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 shadow-sm"
                  />
                  <span className="text-sm text-teal-800">Menit</span>
                </div>
              </div>

              {/* Tahap 6 */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <label className="text-sm font-semibold text-indigo-800 flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">6</div>
                  Tahap 6
                </label>
                <p className="text-xs text-indigo-700 mb-3">Disposisi Pasien (Rawat Inap)</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={activeUnit === "kamala" ? batasWaktuKamala.tahap6 : batasWaktuPadma.tahap6}
                    onChange={(e) => handleBatasWaktuChange('tahap6', e.target.value)}
                    placeholder="0"
                    className="w-20 border-none bg-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                  <span className="text-sm text-indigo-800">Menit</span>
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto mt-6 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md transition-all duration-300 shadow"
            >
              Simpan Pengaturan Batas Waktu
            </button>
          </motion.form>
        )}

        {/* TAB: PENGATURAN PETUGAS JAGA */}
        {activeTab === "petugasJaga" && (
          <motion.form
            onSubmit={handleSavePetugasJaga}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white shadow-md rounded-xl p-6"
          >
            <h2 className="font-semibold text-gray-800 mb-2">Pengaturan Petugas Jaga</h2>
            <p className="text-sm text-gray-500 mb-6">
              Atur petugas yang bertugas di IGD. Data ini akan ditampilkan pada Petugas Jaga Card.
            </p>

            <div className="space-y-6">
              {/* PENANGGUNG JAWAB */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <label className="text-base text-blue-800 font-semibold flex items-center gap-2 mb-3">
                  <UserPlus size={20} className="text-blue-600" />
                  Penanggung Jawab (Maksimal 2)
                </label>
                <p className="text-sm text-blue-700 mb-3">
                  Pilih dari Dokter IGD, Dokter DPJP, atau Perawat
                </p>

                {/* Selected Penanggung Jawab */}
                {penanggungJawab.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {penanggungJawab.map((pj, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded-md px-3 py-2 border border-blue-300">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{pj.nama}</p>
                          <p className="text-xs text-gray-500">{pj.type} {pj.spesialisasi ? `- ${pj.spesialisasi}` : ''}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePenanggungJawab(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dropdown Search */}
                {penanggungJawab.length < 2 && (
                  <div ref={dropdownPJRef} className="relative">
                    <div className="relative">
                      <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={searchPJ}
                        onChange={(e) => {
                          setSearchPJ(e.target.value);
                          setShowDropdownPJ(true);
                        }}
                        onFocus={() => setShowDropdownPJ(true)}
                        placeholder="Cari petugas..."
                        className="w-full pl-10 pr-3 py-2 border border-blue-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {showDropdownPJ && searchPJ && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {getFilteredPJ().map((staff) => (
                          <button
                            key={staff.id}
                            type="button"
                            onClick={() => handleAddPenanggungJawab(staff)}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm"
                          >
                            <p className="font-semibold text-gray-800">{staff.nama}</p>
                            <p className="text-xs text-gray-500">{staff.type} {staff.spesialisasi ? `- ${staff.spesialisasi}` : ''}</p>
                          </button>
                        ))}
                        {getFilteredPJ().length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-500">Tidak ada hasil</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PERAWAT */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                <label className="text-base text-green-800 font-semibold flex items-center gap-2 mb-3">
                  <UserPlus size={20} className="text-green-600" />
                  Perawat (Maksimal 14)
                </label>

                {/* Selected Perawat */}
                {perawatJaga.length > 0 && (
                  <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perawatJaga.map((perawat, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded-md px-3 py-2 border border-green-300">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{perawat.nama}</p>
                          <p className="text-xs text-gray-500">{perawat.peran}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePerawat(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dropdown Search */}
                {perawatJaga.length < 14 && (
                  <div ref={dropdownPerawatRef} className="relative">
                    <div className="relative">
                      <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={searchPerawat}
                        onChange={(e) => {
                          setSearchPerawat(e.target.value);
                          setShowDropdownPerawat(true);
                        }}
                        onFocus={() => setShowDropdownPerawat(true)}
                        placeholder="Cari perawat..."
                        className="w-full pl-10 pr-3 py-2 border border-green-300 rounded-md text-sm focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    {showDropdownPerawat && searchPerawat && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {getFilteredPerawat().map((perawat) => (
                          <button
                            key={perawat.id_pegawai}
                            type="button"
                            onClick={() => handleAddPerawat(perawat)}
                            className="w-full text-left px-4 py-2 hover:bg-green-50 text-sm"
                          >
                            <p className="font-semibold text-gray-800">{perawat.nama}</p>
                            <p className="text-xs text-gray-500">{perawat.peran}</p>
                          </button>
                        ))}
                        {getFilteredPerawat().length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-500">Tidak ada hasil</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* DOKTER IGD */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
                <label className="text-base text-purple-800 font-semibold flex items-center gap-2 mb-3">
                  <UserPlus size={20} className="text-purple-600" />
                  Dokter IGD (Maksimal 3)
                </label>

                {/* Selected Dokter IGD */}
                {dokterIgdJaga.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {dokterIgdJaga.map((dokter, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded-md px-3 py-2 border border-purple-300">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{dokter.nama}</p>
                          <p className="text-xs text-gray-500">Kode: {dokter.doctor_code}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDokterIgd(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dropdown Search */}
                {dokterIgdJaga.length < 3 && (
                  <div ref={dropdownDokterIgdRef} className="relative">
                    <div className="relative">
                      <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={searchDokterIgd}
                        onChange={(e) => {
                          setSearchDokterIgd(e.target.value);
                          setShowDropdownDokterIgd(true);
                        }}
                        onFocus={() => setShowDropdownDokterIgd(true)}
                        placeholder="Cari dokter IGD..."
                        className="w-full pl-10 pr-3 py-2 border border-purple-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    {showDropdownDokterIgd && searchDokterIgd && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {getFilteredDokterIgd().map((dokter) => (
                          <button
                            key={dokter.examiner_key}
                            type="button"
                            onClick={() => handleAddDokterIgd(dokter)}
                            className="w-full text-left px-4 py-2 hover:bg-purple-50 text-sm"
                          >
                            <p className="font-semibold text-gray-800">{dokter.nama}</p>
                            <p className="text-xs text-gray-500">Kode: {dokter.doctor_code}</p>
                          </button>
                        ))}
                        {getFilteredDokterIgd().length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-500">Tidak ada hasil</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto mt-6 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md transition-all duration-300 shadow"
            >
              Simpan Pengaturan Petugas Jaga
            </button>
          </motion.form>
        )}

        {/* TAB: DAFTAR AKUN */}
        {activeTab === "daftarAkun" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white shadow-md rounded-xl p-8 max-w-md mx-auto"
          >
            <h2 className="font-semibold text-gray-800 mb-6">Tambah Akun Baru</h2>
            {akunError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {akunError}
              </div>
            )}
            {akunSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {akunSuccess}
              </div>
            )}
            <form className="space-y-6" onSubmit={handleSubmitAkun}>
              <div>
                <label className="text-sm text-gray-600 font-medium">Email</label>
                <input name="email" type="email" className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Email" required value={formAkun.email} onChange={handleAkunInput} />
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Nama Lengkap</label>
                <input name="nama_lengkap" type="text" className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Nama Lengkap" required value={formAkun.nama_lengkap} onChange={handleAkunInput} />
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">ID Pegawai</label>
                <input name="id_pegawai" type="text" className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="ID Pegawai" required value={formAkun.id_pegawai} onChange={handleAkunInput} />
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Jabatan</label>
                <input name="jabatan" type="text" className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Jabatan" required value={formAkun.jabatan} onChange={handleAkunInput} />
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Password</label>
                <div className="relative mt-1">
                  <input
                    name="password"
                    type={showAkunPassword ? "text" : "password"}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm pr-10"
                    placeholder="Password"
                    required
                    minLength={6}
                    value={formAkun.password}
                    onChange={handleAkunInput}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAkunPassword(!showAkunPassword)}
                    className="absolute right-3 top-2.5 text-gray-500"
                  >
                    {showAkunPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Role</label>
                <select name="role" className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm" required value={formAkun.role} onChange={handleAkunInput}>
                  <option value="">Pilih Role</option>
                  <option value="admin">Admin</option>
                  <option value="perawat_kamala">Perawat Kamala</option>
                  <option value="perawat_padma">Perawat Padma</option>
                </select>
              </div>
              
              <button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2 rounded-md transition mt-2">Simpan Akun</button>
            </form>
          </motion.div>
        )}
        
      </div>

      {/* --- (MODIFIKASI) POPUP KONFIRMASI KELUAR (Animasi Smooth) --- */}
      <AnimatePresence>
        {showLogoutPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" // <-- Hapus backdrop-blur
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }} // <-- Ganti scale ke y
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.25 }} // <-- Ganti spring ke tween
              className="bg-white p-6 rounded-2xl shadow-2xl text-center w-96 border border-gray-100"
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Konfirmasi Keluar</h3>
              <p className="text-gray-600 mb-5">Apakah Anda yakin ingin keluar dari sistem?</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleConfirmLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-all duration-200"
                >
                  Ya, Keluar
                </button>
                <button
                  onClick={() => setShowLogoutPopup(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-all duration-200"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- (MODIFIKASI) POPUP SUKSES DINAMIS (Animasi Smooth) --- */}
      <AnimatePresence>
        {!!successMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" // <-- Hapus backdrop-blur
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }} // <-- Ganti scale ke y
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.25 }} // <-- Ganti spring ke tween
              className="bg-white p-6 rounded-2xl shadow-2xl text-center w-80"
            >
              <h3 className="text-lg font-semibold text-green-700 mb-2">Berhasil!</h3>
              <p className="text-gray-600 mb-4 text-sm">
                {successMessage}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
