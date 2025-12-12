import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Headset,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Wifi,
  Loader,
} from "lucide-react";
import PrimaryButton from "../../components/ui/PrimaryButton";
import PatientHeader from "../../components/layout/PatientHeader";
import BarcodeScanner from "../../components/ui/BarcodeScanner";

const quickInsights = [
  {
    icon: Sparkles,
    label: "IGD Experience",
    primary: "Hermina Pasteur",
    secondary: "Realtime & Transparan",
  },
  {
    icon: BadgeCheck,
    label: "Validasi",
    primary: "Cek Mandiri",
    secondary: "Tanpa antre di loket",
  },
  {
    icon: Clock3,
    label: "Pembaruan",
    primary: "Ter-Update",
    secondary: "Disinkronkan otomatis",
  },
];

export default function CekAntrian() {
  const navigate = useNavigate();
  const [nomorAntrian, setNomorAntrian] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleScanSuccess = async (decodedText) => {
    console.log('📱 Scanned:', decodedText);
    
    // Jika hasil scan adalah URL (dari QR code PrintableTicket)
    if (decodedText.includes('/status/')) {
      const parts = decodedText.split('/status/');
      if (parts.length > 1) {
        const hash = parts[1].split('?')[0];
        navigate(`/status/${hash}`);
        return;
      }
    }
    
    // Jika hasil scan adalah nomor antrian langsung
    const extractedNomor = decodedText.trim().toUpperCase();
    setNomorAntrian(extractedNomor);
    
    // Auto-submit
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const encodeResponse = await fetch(
        `${API_URL}/api/public/encode-antrian`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nomor_antrian: extractedNomor })
        }
      );

      if (encodeResponse.ok) {
        const { hash } = await encodeResponse.json();
        navigate(`/status/${hash}`);
      } else {
        navigate("/salah", { state: { attempted: extractedNomor } });
      }
    } catch (error) {
      console.error("Error:", error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const sanitized = nomorAntrian.replace(/\s/g, '').toUpperCase();
    if (!sanitized) return;

    setLoading(true);

    try {
      // Encode nomor antrian ke hash
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const encodeResponse = await fetch(
        `${API_URL}/api/public/encode-antrian`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nomor_antrian: sanitized })
        }
      );

      if (encodeResponse.ok) {
        // SUKSES: Nomor antrian valid, dapat hash
        const { hash } = await encodeResponse.json();
        // Navigate menggunakan hash (bukan nomor antrian asli)
        navigate(`/status/${hash}`);
      } else {
        // GAGAL: Tidak ditemukan, kedaluwarsa, atau sudah selesai
        navigate("/salah", { state: { attempted: sanitized } });
      }

    } catch (error) {
      // Error jaringan
      console.error("Gagal menghubungi server:", error);
      navigate("/salah", { state: { attempted: sanitized } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <PatientHeader
          showBack
          backTo="/"
          rightSlot={
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80">
              <Search size={14} className="text-[#F9C440]" />
              Validasi Nomor IGD
            </span>
          }
        />

        <main className="flex-1 pb-12">
          <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pt-10 md:px-12 md:pt-16">
            <div className="rounded-[32px] border border-white/12 bg-white/8 p-8 shadow-[0_22px_52px_-32px_rgba(0,76,44,0.3)] backdrop-blur-md">
              <div className="grid gap-10 lg:grid-cols-[1.25fr_0.95fr]">
                
                {/* Kolom kiri 'quickInsights' */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">Hermina Experience</p>
                    <h1 className="text-4xl font-semibold leading-[1.05] text-white sm:text-5xl">
                      Validasi nomor IGD dalam satu tampilan premium
                    </h1>
                    <p className="max-w-2xl text-sm text-white/65 sm:text-base">
                      Masukkan kode pada gelang pasien untuk membuka portal progres IGD Hermina dengan visual modern dan informasi yang selalu terkini.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {quickInsights.map(({ icon: Icon, label, primary, secondary }) => (
                      <div
                        key={label}
                        className="rounded-3xl border border-white/12 bg-white/8 p-6 text-left shadow-[0_18px_48px_-30px_rgba(0,76,44,0.3)] transition hover:border-white/18 hover:bg-white/12"
                      >
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/12 text-[#7EF0B3]">
                          <Icon size={18} strokeWidth={1.6} />
                        </span>
                        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/62">{label}</p>
                        <p className="mt-3 text-2xl font-semibold text-white">{primary}</p>
                        <p className="mt-1 text-xs leading-relaxed text-white/55">{secondary}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kolom kanan (Form) */}
                <div className="relative">
                  <div className="relative rounded-[32px] border border-white/14 bg-gradient-to-br from-[#0B7A41] via-[#11A15B] to-[#0A6B3C] p-10 text-white shadow-[0_18px_36px_-22px_rgba(6,104,57,0.24)]">
                    <div className="flex items-center justify-between text-xs text-white/70">
                      <span className="inline-flex items-center gap-2">
                        <QrCode size={16} className="text-[#7EF0B3]" />
                        Validasi Nomor IGD
                      </span>
                      <span className="uppercase tracking-[0.35em]">Portal IGD</span>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                      <div className="space-y-3 text-center">
                        <h2 className="text-2xl font-semibold text-white">
                          Masukkan Nomor Kunjungan Pasien Anda                        </h2>
                        <p className="text-sm text-white/65">
                          Contoh format: <span className="font-semibold text-[#B1FFD6]">ABC123</span>
                        </p>
                      </div>

                      <label className="block text-left text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                        Nomor Kunjungan
                      </label>
                      <input
                        value={nomorAntrian}
                        onChange={(event) => setNomorAntrian(event.target.value)}
                        placeholder="MASUKKAN NOMOR"
                        className="w-full rounded-2xl border border-white/18 bg-white px-6 py-4 text-center text-lg font-black tracking-[0.32em] text-[#012315] shadow-[0_25px_70px_-55px_rgba(0,76,44,0.42)] transition focus:border-[#00B56A] focus:outline-none focus:ring-2 focus:ring-[#00B56A]/28"
                        maxLength={12}
                        autoFocus
                        disabled={loading} // 🚀 Tambah disable
                      />

                      <div className="space-y-3">
                        <PrimaryButton 
                          type="submit" 
                          variant="accent" 
                          icon={loading ? Loader : ArrowRight} 
                          className="w-full" 
                          disabled={loading}
                        >
                          {loading ? "Memvalidasi..." : "Masuk ke Portal IGD"}
                        </PrimaryButton>
                        <PrimaryButton
                          type="button"
                          variant="outline"
                          icon={QrCode}
                          iconPosition="left"
                          className="w-full border-white/22 bg-white/10 text-white hover:border-white/30 hover:bg-white/16"
                          onClick={() => setShowScanner(true)}
                          disabled={loading}
                        >
                          Pindai Barcode
                        </PrimaryButton>
                      </div>

                      <p className="text-center text-[11px] text-white/60">
                        Nomor tidak ditemukan? Hubungi petugas registrasi untuk verifikasi manual.
                      </p>

                      <div className="mt-6 space-y-3 rounded-2xl border border-white/12 bg-white/10 px-5 py-4 text-xs text-white/66">
                        <div className="flex items-start gap-3">
                          <ShieldCheck size={16} className="mt-0.5 text-[#7EF0B3]" />
                          <div>
                            <p className="font-semibold uppercase tracking-[0.28em] text-white/70">Keamanan Data</p>
                            <p className="mt-1 leading-relaxed text-white/60">
                              Seluruh validasi dilindungi enkripsi end-to-end dan audit berkala.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Wifi size={16} className="mt-0.5 text-[#F9C440]" />
                          <div>
                            <p className="font-semibold uppercase tracking-[0.28em] text-white/70">Sistem Sinkron</p>
                            <p className="mt-1 leading-relaxed text-white/60">
                              Pembaruan status pasien realtime langsung dari dashboard IGD.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Headset size={16} className="mt-0.5 text-[#5BE39A]" />
                          <div>
                            <p className="font-semibold uppercase tracking-[0.28em] text-white/70">Bantuan 24/7</p>
                            <p className="mt-1 leading-relaxed text-white/60">
                              Konsultasikan kendala langsung ke Hermina Care Center kapan pun dibutuhkan.
                            </p>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-[30px] border border-white/12 bg-white/8 p-7 shadow-[0_16px_36px_-26px_rgba(0,76,44,0.24)] backdrop-blur-[10px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">Panduan Cepat</p>
                <ul className="mt-4 space-y-3 text-sm text-white/70">
                  <li>• Pastikan format yang digunakan untuk memeriksa alur pasien sudah benar.</li>
                  <li>• Jika kode tidak ditemukan, verifikasi ulang kepada petugas yang berjaga.</li>
                  <li>• Sistem mengarsipkan data otomatis setelah penanganan selesai selama 24 jam.</li>
                </ul>
              </div>
              <div className="rounded-[30px] border border-white/12 bg-white/8 p-7 text-white shadow-[0_16px_36px_-26px_rgba(0,76,44,0.24)] backdrop-blur-[10px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">Support Hermina</p>
                <div className="mt-4 space-y-3 text-sm text-white/70">
                  <p>Tim assistance siap membantu Anda setiap saat lewat Hermina Care Center.</p>
                  <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/65">Hotline IGD Hermina</p>
                    <p className="mt-2 text-lg font-semibold text-white">(0266) 6072525</p>
                    <p className="text-xs text-white/55">Sertakan nomor antrian saat menghubungi petugas.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/12 bg-white/8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-xs text-white/70 md:flex-row md:items-center md:justify-between md:px-12">
            <span>© {new Date().getFullYear()} Rumah Sakit Hermina Pasteur • Patient Experience Center</span>
            <span>Pengolahan data terenkripsi • Keamanan pasien prioritas utama</span>
          </div>
        </footer>

        {/* Barcode Scanner Modal */}
        <BarcodeScanner
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScanSuccess={handleScanSuccess}
        />
    </div>
  );
}
