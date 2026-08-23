import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: Option[];
  hasError?: boolean;
}

const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
  ({ options, hasError, className = "", ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          {...props}
          className={`
            w-full
            h-11
            pl-3.5
            pr-10
            rounded-lg
            bg-white
            border
            ${hasError ? "border-red-400 focus:border-red-500" : "border-[#EBD6CF] focus:border-[#494F66]"}
            text-[#2D3246]
            text-[14px]
            outline-none
            shadow-xs
            transition-all duration-200
            appearance-none
            cursor-pointer
            disabled:opacity-60
            disabled:cursor-not-allowed
            ${className}
          `}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white text-[#2D3246]">
              {opt.label}
            </option>
          ))}
        </select>

        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7E849B] pointer-events-none">
          <ChevronDown size={16} />
        </span>
      </div>
    );
  }
);

SelectInput.displayName = "SelectInput";

export default SelectInput;
