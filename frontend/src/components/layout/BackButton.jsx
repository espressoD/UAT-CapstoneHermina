import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Tombol navigasi kembali dengan gaya portal pasien Hermina.
 * @param {{ to?: string; label?: string; className?: string }} props
 */
export default function BackButton({ to, label = "Kembali", className = "" }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  const classes = `group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/80 transition-all duration-200 hover:border-[#FFFF00] hover:text-[#FFFF00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFF00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#03120d] ${className}`.trim();

  return (
    <button onClick={handleBack} className={classes}>
      <ArrowLeft
        size={16}
        className="transition-transform duration-200 group-hover:-translate-x-0.5"
      />
      <span>{label}</span>
    </button>
  );
}
