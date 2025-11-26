import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, XCircle } from "lucide-react";
import PrimaryButton from "../../components/ui/PrimaryButton";
import PatientHeader from "../../components/layout/PatientHeader";

export default function KondisiSalah() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const attemptedNumber = state?.attempted || "—";

  const handleRetry = () => navigate("/cek-antrian");

  return (
    <div className="flex min-h-screen flex-col">
      <PatientHeader
          rightSlot={
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80">
              <AlertTriangle size={14} className="text-[#F9C440]" />
              Validasi Gagal
            </span>
          }
        />

        <main className="flex-1 pb-20">
          <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 pt-10 md:px-12 md:pt-16">
            <div className="rounded-[34px] border border-white/12 bg-white/8 p-10 text-center shadow-[0_18px_38px_-26px_rgba(0,76,44,0.32)] backdrop-blur-[6px]">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-[#FF8F8F]/35 bg-[#FFE5E5]/80">
                <XCircle size={56} className="text-[#FF5A5A]" />
              </div>
              <h1 className="mt-6 text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Nomor Pasien Tidak Ditemukan
              </h1>
              <p className="mt-3 text-sm text-white/68">
                The patient number you entered is not registered in the Hermina IGD system or the session has already been closed.
              </p>

              <div className="mx-auto mt-8 inline-flex flex-col items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-10 py-6 text-white">
                <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">
                  Nomor yang dimasukkan
                </span>
                <p className="text-2xl font-semibold text-white">{attemptedNumber}</p>
              </div>

              <div className="mt-10 flex justify-center">
                <PrimaryButton onClick={handleRetry} variant="accent" icon={ArrowLeft} iconPosition="left" className="w-full max-w-xs">
                  Coba Lagi
                </PrimaryButton>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[30px] border border-white/12 bg-white/8 p-7 text-white shadow-[0_16px_32px_-22px_rgba(0,76,44,0.28)] backdrop-blur-[6px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#F9C440]">Langkah verifikasi cepat</p>
                <ul className="mt-4 space-y-3 text-sm text-white/68">
                  <li>• Pastikan huruf "IGD" dan angka sesuai dengan gelang atau tiket pendaftaran.</li>
                  <li>• Gunakan huruf kapital dan tanda strip "-" sesuai format contoh: IGD-001.</li>
                  <li>• Jika layanan telah selesai lebih dari 12 jam, data otomatis diarsipkan.</li>
                </ul>
              </div>

              <div className="rounded-[30px] border border-white/12 bg-white/8 p-7 text-white shadow-[0_16px_32px_-22px_rgba(0,76,44,0.28)] backdrop-blur-[6px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#F9C440]">Bantuan tambahan</p>
                <div className="mt-4 space-y-3 text-sm text-white/68">
                  <p>Tim kami selalu senantiasa membantu anda</p>
                  <div className="rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-left">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Hotline IGD Hermina</p>
                    <p className="mt-2 text-lg font-semibold text-white">(022) 6072525</p>
                    <p className="text-xs text-white/56">Sertakan nomor antrian saat menghubungi petugas.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/12 bg-white/8">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-8 text-xs text-white/70 md:flex-row md:items-center md:justify-between md:px-12">
            <span>© {new Date().getFullYear()} Rumah Sakit Hermina Pasteur • Patient Experience Center</span>
            <span>Keamanan data setara HIPAA • Enkripsi TLS 1.3</span>
          </div>
        </footer>
    </div>
  );
}
