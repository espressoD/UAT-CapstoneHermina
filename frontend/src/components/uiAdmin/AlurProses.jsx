// src/components/uiAdmin/AlurProses.jsx

import {
  ClipboardCheck,
  Stethoscope,
  FlaskRound,
  Activity, // <-- Diubah
  ClipboardList, // <-- Diubah
  Bed, // <-- (BARU) Ikon untuk Rawat Inap
} from "lucide-react";

// (MODIFIKASI) steps diubah
const steps = [
  { id: 1, title: "Pendaftaran & Pemeriksaan", icon: ClipboardCheck },
  { id: 2, title: "Pemeriksaan Dokter IGD", icon: Stethoscope },
  { id: 3, title: "Pemeriksaan Penunjang", icon: FlaskRound },
  { id: 4, title: "Tindakan & Pengobatan", icon: Activity },
  { id: 5, title: "Keputusan Akhir Pasien", icon: ClipboardList },
  { id: 6, title: "Disposisi Ruangan", icon: Bed }, // <-- (BARU) Tahap 6
];

// Komponen Step tunggal
const Step = ({ number, icon: Icon, title, isActive }) => (
  <div className="flex items-center justify-center space-x-1 sm:space-x-2 flex-1 min-w-0">
    {/* Nomor Step */}
    <div
      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${
        isActive ? "bg-green-500" : "bg-gray-300"
      } text-white flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0`}
    >
      {number}
    </div>

    {/* Ikon */}
    <Icon
      size={14}
      className={`flex-shrink-0 ${
        isActive ? "text-green-600" : "text-gray-400"
      }`}
    />

    {/* Teks */}
    <span
      className={`truncate text-[10px] sm:text-xs md:text-sm font-medium text-gray-800`}
      title={title}
    >
      {title}
    </span>
  </div>
);

export default function AlurProses() {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
        Alur Proses Pasien
      </h3>
      <div className="flex flex-nowrap justify-between items-center w-full">
        {steps.map((step) => (
          <Step
            key={step.id}
            number={step.id}
            icon={step.icon}
            title={step.title}
            isActive={true} // Nanti ini bisa diganti data dinamis
          />
        ))}
      </div>
    </div>
  );
}
