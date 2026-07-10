"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  placeholder?: string;
}

export default function PasswordInput({ placeholder = "Password" }: PasswordInputProps) {
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
        type={show ? "text" : "password"}
        placeholder={placeholder}
        className="
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

          focus:border-violet-500/40
          focus:bg-[#0f121a]
        "
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