import { ReactNode, InputHTMLAttributes } from "react";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: ReactNode;
}

export default function AuthInput({
  icon,
  className = "",
  ...props
}: AuthInputProps) {
  return (
    <div className="relative">
      <span
        className="
          absolute left-4 top-1/2 -translate-y-1/2
          text-zinc-500
          pointer-events-none
        "
      >
        {icon}
      </span>

      <input
        {...props}
        className={`
          w-full
          h-12
          pl-11 pr-4
          rounded-lg
          bg-[#0d1017]
          border border-white/5
          text-white
          text-[14px]
          placeholder:text-zinc-500
          outline-none
          transition-all duration-200
          focus:border-[#F8B4C8]/50
          focus:bg-[#0f121a]
          disabled:opacity-60
          ${className}
        `}
      />
    </div>
  );
}