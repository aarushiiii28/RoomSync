"use client";

import Link from "next/link";
import { Mail, User } from "lucide-react";

import AuthInput from "../shared/AuthInput";
import PasswordInput from "../shared/PasswordInput";
import PrimaryButton from "../shared/PrimaryButton";
import Divider from "../shared/Divider";
import SocialLogin from "./SocialLogin";

export default function RegisterForm() {
  return (
    <form className="space-y-4">

      <div className="grid grid-cols-2 gap-3">
        <AuthInput
          type="text"
          placeholder="First name"
          icon={<User size={16} />}
        />
        <AuthInput
          type="text"
          placeholder="Last name"
          icon={<User size={16} />}
        />
      </div>

      <AuthInput
        type="email"
        placeholder="Email address"
        icon={<Mail size={16} />}
      />

      <PasswordInput placeholder="Password" />

      <PasswordInput placeholder="Confirm password" />

      {/* Terms */}
      <label className="flex items-start gap-2.5 text-sm text-zinc-400 cursor-pointer select-none pt-1">
        <input
          type="checkbox"
          className="
            w-4 h-4
            mt-0.5
            flex-shrink-0
            rounded
            border border-white/20
            bg-transparent
            accent-violet-500
            cursor-pointer
          "
        />
        <span>
          I agree to the{" "}
          <Link href="#" className="text-violet-400 hover:text-violet-300 transition-colors duration-200">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="text-violet-400 hover:text-violet-300 transition-colors duration-200">
            Privacy Policy
          </Link>
        </span>
      </label>

      <div className="pt-1">
        <PrimaryButton>
          Create account
        </PrimaryButton>
      </div>

      <Divider />

      <SocialLogin />

      <p className="text-center text-sm text-zinc-400 pt-1">
        Already have an account?{" "}
        <Link
          href="/login"
          className="
            text-violet-400
            hover:text-violet-300
            transition-colors
            duration-200
          "
        >
          Sign in
        </Link>
      </p>

    </form>
  );
}
