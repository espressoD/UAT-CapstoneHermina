
const variantClasses = {
  primary:
    "bg-gradient-to-r from-[#007C3A] via-[#009B4C] to-[#03B060] text-white shadow-[0_18px_46px_-24px_rgba(0,155,76,0.58)] hover:from-[#00904D] hover:via-[#00A857] hover:to-[#26C278]",
  accent:
    "bg-gradient-to-r from-[#FFE487] via-[#FDD24A] to-[#F9C440] text-[#2B4528] shadow-[0_20px_52px_-28px_rgba(249,196,64,0.5)] hover:from-[#FFDF75] hover:via-[#FDD24A] hover:to-[#F5B71A]",
  outline:
    "border border-[#62C289]/45 bg-transparent text-white hover:border-[#F8C53E] hover:text-[#F8C53E]",
  ghost:
    "bg-transparent text-white/80 hover:text-[#F8C53E]",
};

/**
 * Tombol utama dengan beberapa varian gaya.
 * @param {object} props
 * @param {() => void} [props.onClick]
 * @param {React.ReactNode} props.children
 * @param {React.ElementType} [props.icon]
 * @param {"primary"|"accent"|"outline"|"ghost"} [props.variant]
 * @param {"left"|"right"} [props.iconPosition]
 * @param {string} [props.className]
 * @param {"button"|"submit"|"reset"} [props.type]
 */
export default function PrimaryButton({
  onClick,
  children,
  icon: Icon,
  variant = "primary",
  iconPosition = "right",
  className = "",
  type = "button",
  ...rest
}) {
  const baseClasses =
    "group inline-flex items-center justify-center gap-3 rounded-full px-8 py-3 text-xs font-semibold uppercase tracking-[0.32em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFF00] disabled:cursor-not-allowed disabled:opacity-50";

  const variantClass = variantClasses[variant] || variantClasses.primary;

  const iconTransitionClass =
    iconPosition === "left"
      ? "group-hover:-translate-x-0.5"
      : "group-hover:translate-x-0.5";

  const iconElement =
    Icon && (
      <Icon
        size={18}
        className={`transition-transform duration-200 ${iconTransitionClass}`}
      />
    );

  const classes = `${baseClasses} ${variantClass} ${className}`.trim();

  return (
    <button type={type} onClick={onClick} className={classes} {...rest}>
      {iconPosition === "left" && iconElement}
      <span className="tracking-[0.24em]">{children}</span>
      {iconPosition === "right" && iconElement}
    </button>
  );
}
