import { Clock3, PhoneCall } from "lucide-react";
import BackButton from "./BackButton";
import HerminaLogo from "../../assets/logo-hermina-baru.svg";

/**
 * Header standar untuk halaman pasien Hermina.
 * @param {{ showBack?: boolean; backTo?: string; rightSlot?: React.ReactNode; tone?: "dark" | "light" }} props
 */
export default function PatientHeader({
  showBack = false,
  backTo,
  rightSlot,
  tone = "dark",
}) {
  const isLight = tone === "light";
  const chipClasses = isLight
    ? "inline-flex items-center gap-2 rounded-full border border-[#2D7A40]/20 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#1C452A] shadow-sm"
    : "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60";
  const hotlineClasses = isLight
    ? "inline-flex items-center gap-2 text-xs font-medium text-[#1B4630]"
    : "inline-flex items-center gap-2 text-xs font-medium text-white/70";
  const hotlineIconClass = isLight ? "text-[#41924C]" : "text-[#FFFF00]";
  const accentLabelClass = isLight
    ? "text-[10px] font-semibold uppercase tracking-[0.45em] text-[#2D7A40]"
    : "text-[10px] font-semibold uppercase tracking-[0.45em] text-[#CFCD3E]";
  const titleClass = isLight
    ? "text-lg font-semibold text-[#052B17]"
    : "text-lg font-semibold text-white";
  const emblemClasses = isLight
    ? "flex h-14 w-14 items-center justify-center rounded-full border border-[#2D7A40]/20 bg-white backdrop-blur-sm shadow-sm"
    : "flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white backdrop-blur-sm";

  const defaultRightSlot = (
    <>
      <span className={chipClasses}>
        <Clock3 size={14} className={isLight ? "text-[#2D7A40]" : "text-[#CFCD3E]"} />
        IGD 24/7
      </span>
      <span className={hotlineClasses}>
        <PhoneCall size={16} className={hotlineIconClass} />
        1500-488 (Emergency Hotline)
      </span>
    </>
  );

  return (
    <header className="px-6 pt-8 md:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4">
          {showBack && (
            <div className="hidden md:block">
              <BackButton to={backTo} />
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className={emblemClasses}>
              <img
                src={HerminaLogo}
                alt="Logo RS Hermina"
                className="h-10 w-10"
                loading="lazy"
              />
            </div>
            <div className="space-y-1">
              <p className={accentLabelClass}>
                Hermina IGD
              </p>
              <p className={titleClass}>
                Patient Experience Center
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {rightSlot ?? defaultRightSlot}
        </div>
      </div>
      {showBack && (
        <div className="mt-6 md:hidden">
          <BackButton to={backTo} />
        </div>
      )}
    </header>
  );
}
