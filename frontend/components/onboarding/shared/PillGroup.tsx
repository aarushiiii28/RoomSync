import { ReactNode } from "react";

export interface PillOption<T extends string = string> {
  value: T;
  label: string;
  icon?: ReactNode;
  hint?: string;
}

interface PillGroupProps<T extends string = string> {
  options: PillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4 | 5 | 6;
  size?: "sm" | "md";
  className?: string;
}

export default function PillGroup<T extends string = string>({
  options,
  value,
  onChange,
  columns,
  size = "md",
  className = "",
}: PillGroupProps<T>) {
  const getGridCols = () => {
    switch (columns) {
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      case 4:
        return "grid-cols-2 sm:grid-cols-4";
      case 5:
        return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5";
      case 6:
        return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";
      default:
        return "flex flex-wrap";
    }
  };

  const isGrid = Boolean(columns);

  return (
    <div className={`${isGrid ? `grid gap-2 ${getGridCols()}` : "flex flex-wrap gap-2"} ${className}`}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`
              flex items-center justify-center gap-2
              ${size === "sm" ? "px-3 py-2 text-[12px]" : "px-4 py-2.5 text-[13px]"}
              rounded-lg
              font-medium
              transition-all duration-200
              cursor-pointer
              select-none
              text-center
              shadow-xs
              ${
                isSelected
                  ? "bg-[#E5ADA2] text-[#2D3246] font-semibold border border-transparent shadow-sm"
                  : "bg-white border border-[#EBD6CF] text-[#494F66] hover:bg-[#FDF9F7] hover:border-[#DEC5BD]"
              }
            `}
          >
            {opt.icon && (
              <span className={isSelected ? "text-[#2D3246]" : "text-[#7E849B]"}>
                {opt.icon}
              </span>
            )}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
