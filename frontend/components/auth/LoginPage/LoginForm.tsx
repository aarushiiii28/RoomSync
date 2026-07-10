"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

import AuthInput from "../shared/AuthInput";
import PasswordInput from "../shared/PasswordInput";
import PrimaryButton from "../shared/PrimaryButton";
import Divider from "../shared/Divider";
import SocialLogin from "./SocialLogin";

export default function LoginForm() {
  return (
    <form className="space-y-4">

      <AuthInput
        type="email"
        placeholder="Email address"
        icon={<Mail size={16} />}
      />

      <PasswordInput />

      {/* Remember Me + Forgot Password */}
      <div className="flex items-center justify-between pt-1">

        <label className="flex items-center gap-2.5 text-[13px] text-[#8b92a5] cursor-pointer select-none">
          <input
            type="checkbox"
            className="
              w-3.5 h-3.5
              rounded-[4px]
              border border-white/20
              bg-transparent
              accent-violet-500
              cursor-pointer
            "
          />
          Remember me
        </label>

        <button
          type="button"
          className="
            text-[13px]
            text-[#9b51e0]
            hover:text-[#a855f7]
            transition-colors
            duration-200
          "
        >
          Forgot password?
        </button>

      </div>

      <div className="pt-1">
        <PrimaryButton>
          Log in
        </PrimaryButton>
      </div>

      <Divider />

      <SocialLogin />

      <p className="text-center text-[13px] text-[#8b92a5] pt-1">
        New here?{" "}
        <Link
          href="/register"
          className="
            text-[#9b51e0]
            hover:text-[#a855f7]
            transition-colors
            duration-200
          "
        >
          Create an account
        </Link>
      </p>

    </form>
  );
}