import { ReactNode } from "react";

interface ToggleSwitchProps {
  label: string;
  description?: string;
  icon?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export default function ToggleSwitch({
  label,
  description,
  icon,
  checked,
  onChange,
  className = "",
}: ToggleSwitchProps) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`
        flex items-center justify-between gap-4 p-3.5 rounded-lg border transition-all duration-200 cursor-pointer select-none shadow-xs
        ${
          checked
            ? "bg-white border-[#E5ADA2] ring-1 ring-[#E5ADA2]/50"
            : "bg-white border-[#EBD6CF] hover:border-[#DEC5BD] hover:bg-[#FDF9F7]"
        }
        ${className}
      `}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
              checked ? "bg-[#E5ADA2]/30 text-[#2D3246]" : "bg-[#F7EBE8] text-[#7E849B]"
            }`}
          >
            {icon}
          </div>
        )}
        <div>
          <p className="text-[13px] font-semibold text-[#2D3246]">{label}</p>
          {description && (
            <p className="text-[11px] text-[#7E849B]">{description}</p>
          )}
        </div>
      </div>

      <div
        className={`
          w-[52px] h-7 rounded-full transition-colors duration-200 flex items-center p-1 shrink-0 cursor-pointer
          ${checked ? "bg-[#E5ADA2]" : "bg-[#E5D2CB]"}
        `}
      >
        <div
          className={`
            w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out
            ${checked ? "translate-x-6" : "translate-x-0"}
          `}
        />
      </div>
    </div>
  );
}
