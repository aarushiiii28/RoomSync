"use client";

import {
  InputHTMLAttributes,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";

type PasswordInputProps = InputHTMLAttributes<HTMLInputElement>;

export default function PasswordInput({
  className = "",
  ...props
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <span
        className="
          absolute left-4 top-1/2 -translate-y-1/2
          text-zinc-500
          pointer-events-none
        "
      >
        <Lock size={16} />
      </span>

      <input
        {...props}
        type={show ? "text" : "password"}
        className={`
          w-full
          h-12
          pl-11 pr-12
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

      <button
        type="button"
        onClick={() => setShow(!show)}
        className="
          absolute right-4 top-1/2 -translate-y-1/2
          text-zinc-500
          hover:text-zinc-300
          transition-colors duration-200
        "
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}