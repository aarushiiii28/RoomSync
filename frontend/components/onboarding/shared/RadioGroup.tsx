import React, { ReactNode } from "react";

export interface RadioOption<T extends string | number = string | number> {
  value: T;
  label: string;
  hint?: string;
  icon?: ReactNode;
}

interface RadioGroupProps<T extends string | number = string | number> {
  name: string;
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export default function RadioGroup<T extends string | number = string | number>({
  name,
  options,
  value,
  onChange,
  className = "",
}: RadioGroupProps<T>) {
  return (
    <div className={`space-y-1 ${className}`} role="radiogroup">
      {options.map((opt) => {
        const isSelected = value === opt.value;
        const id = `${name}-${opt.value}`;

        return (
          <label
            key={opt.value}
            htmlFor={id}
            className={`
              flex items-center gap-2.5 py-1 px-1 rounded cursor-pointer select-none group transition-colors duration-150
              hover:bg-black/[0.02] focus-within:ring-1 focus-within:ring-[#D97870]/40
            `}
          >
            <input
              type="radio"
              id={id}
              name={name}
              value={opt.value}
              checked={isSelected}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />

            {/* Circular Radio Indicator */}
            <div
              className={`
                w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all duration-150
                ${
                  isSelected
                    ? "border-[#D97870] bg-[#E5ADA2]"
                    : "border-[#B8BDCC] bg-white group-hover:border-[#7E849B]"
                }
              `}
            >
              {isSelected && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </div>

            {/* Option Label & Text */}
            <span
              className={`text-[13.5px] leading-normal transition-colors duration-150 ${
                isSelected
                  ? "font-semibold text-[#2D3246]"
                  : "font-normal text-[#494F66] group-hover:text-[#2D3246]"
              }`}
            >
              {opt.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
