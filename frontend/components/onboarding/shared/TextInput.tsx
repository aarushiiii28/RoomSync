import { InputHTMLAttributes, ReactNode, forwardRef } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  suffix?: string;
  hasError?: boolean;
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ icon, suffix, hasError, className = "", ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E849B] pointer-events-none flex items-center justify-center">
            {icon}
          </span>
        )}

        <input
          ref={ref}
          {...props}
          className={`
            w-full
            h-11
            ${icon ? "pl-10" : "pl-3.5"}
            ${suffix ? "pr-12" : "pr-3.5"}
            rounded-lg
            bg-white
            border
            ${hasError ? "border-red-400 focus:border-red-500 ring-1 ring-red-400" : "border-[#EBD6CF] focus:border-[#494F66]"}
            text-[#2D3246]
            text-[14px]
            placeholder:text-[#A6ACBE]
            outline-none
            shadow-xs
            transition-all duration-200
            disabled:opacity-60
            disabled:cursor-not-allowed
            ${className}
          `}
        />

        {suffix && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#7E849B] pointer-events-none font-medium">
            {suffix}
          </span>
        )}
      </div>
    );
  }
);

TextInput.displayName = "TextInput";

export default TextInput;
