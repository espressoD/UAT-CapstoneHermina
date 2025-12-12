import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Clock3,
  HeartPulse,
  QrCode,
  Scan,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import PrimaryButton from "../../components/ui/PrimaryButton";
import PatientHeader from "../../components/layout/PatientHeader";

const featureHighlights = [
  {
    icon: HeartPulse,
    title: "Realtime Progres",
    description:
      "Pantau setiap tahapan IGD secara langsung tanpa harus bertanya ke petugas.",
  },
  {
    icon: ShieldCheck,
    title: "Data Terintegrasi",
    description:
      "Tersinkronisasi dengan sistem medis Hermina dan aman dengan enkripsi modern.",
  },
  {
    icon: Sparkles,
    title: "Antarmuka Modern",
    description:
      "Tampilan bersih dan responsif yang ramah bagi keluarga pasien di segala usia.",
  },
  {
    icon: Scan,
    title: "Scan Barcode",
    description:
      "Masukkan nomor secara manual atau pindai barcode pasien IGD.",
  },
];

const quickSteps = [
  {
    step: "01",
    title: "Masukkan Nomor IGD",
    description:
      "Gunakan kode pada gelang pasien atau tiket pendaftaran yang diterima di meja registrasi.",
  },
  {
    step: "02",
    title: "Lihat Kartu Proses",
    description:
      "Ketahui tahapan pemeriksaan, tindakan, hingga keputusan perawatan lanjutan.",
  },
  {
    step: "03",
    title: "Update Otomatis",
    description:
      "Status berubah otomatis ketika tim medis menyelesaikan tindakan untuk pasien.",
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const handleStart = () => navigate("/cek-antrian");

  return (
    <div className="flex min-h-screen flex-col">
      <PatientHeader
          rightSlot={
            <span className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80">
              <QrCode size={14} className="text-[#F9C440]" />
              Portal Pasien IGD • Hermina Pasteur
            </span>
          }
        />

        <main className="flex-1 pb-20">
          <section className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 pt-10 md:px-12 md:pt-14">
            <div className="rounded-[36px] border border-white/12 bg-white/8 p-10 shadow-[0_18px_38px_-26px_rgba(0,76,44,0.32)] backdrop-blur-sm">
              <div className="grid gap-12 xl:grid-cols-[1.25fr_0.95fr]">
                <div className="space-y-10">
                  <div className="space-y-4">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#F9C440]">
                      Experience Hermina 2.0
                    </span>
                    <h1 className="text-4xl font-semibold leading-[1.05] text-white sm:text-5xl">
                      Kendalikan progres IGD Anda dalam satu ekosistem modern
                    </h1>
                    <p className="max-w-2xl text-sm text-white/65 sm:text-base">
                      Portal pasien Hermina menghadirkan pembaruan status darurat secara instan, transparan, dan mudah dimengerti untuk keluarga pasien IGD.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="relative rounded-[36px] border border-white/14 bg-gradient-to-br from-[#0B7A41] via-[#11A15B] to-[#0A6B3C] p-10 text-white shadow-[0_18px_34px_-22px_rgba(6,104,57,0.24)]">
                    <div className="flex items-center justify-between text-xs text-white/70">
                      <span>Hermina Pasteur • IGD</span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#F9C440]">
                        <Activity size={16} />
                        Live Tracking
                      </span>
                    </div>
                    <h2 className="mt-6 text-2xl font-semibold text-white">
                      Mulai Dengan Nomor Kunjungan IGD Anda
                    </h2>
                    <p className="mt-2 text-sm text-white/65">
                      Masukkan nomor kunjungan atau pindai barcode untuk memonitor progres tanpa menunggu giliran.
                    </p>

                    <div className="mt-8 flex flex-col gap-3">
                      <PrimaryButton onClick={handleStart} variant="accent" icon={ArrowRight} className="w-full">
                        Masuk ke Portal IGD
                      </PrimaryButton>
                      <p className="text-[11px] text-white/60">
                        Tidak ada nomor? Hubungi petugas registrasi untuk bantuan.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="xl:col-span-2 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {featureHighlights.map(({ icon: Icon, title, description }) => (
                    <div
                      key={title}
                      className="rounded-3xl border border-white/12 bg-white/8 p-6 text-white shadow-[0_12px_28px_-20px_rgba(0,76,44,0.26)] transition hover:border-white/18 hover:bg-white/12"
                    >
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-[#5BE39A]">
                        <Icon size={20} />
                      </div>
                      <h3 className="text-lg font-semibold text-white">{title}</h3>
                      <p className="mt-2 text-sm text-white/68">{description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/12 bg-white/8 p-10 shadow-[0_16px_32px_-22px_rgba(0,76,44,0.28)] backdrop-blur-[10px]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#F9C440]">Langkah Cepat</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                    Cara kerja portal pasien IGD Hermina
                  </h2>
                </div>
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {quickSteps.map(({ step, title, description }) => (
                  <div
                    key={step}
                    className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/8 p-6 text-white shadow-[0_12px_28px_-20px_rgba(0,76,44,0.24)]"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">
                      Langkah {step}
                    </span>
                    <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
                    <p className="mt-3 text-sm text-white/65">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/12 bg-white/8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-xs text-white/70 md:flex-row md:items-center md:justify-between md:px-12">
            <span>
              © {new Date().getFullYear()} Rumah Sakit Hermina Pasteur • Patient Experience Center
            </span>
            <span></span>
          </div>
        </footer>
    </div>
  );
}
