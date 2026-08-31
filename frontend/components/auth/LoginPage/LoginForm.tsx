"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "lucide-react";

import AuthInput from "../shared/AuthInput";
import PasswordInput from "../shared/PasswordInput";
import PrimaryButton from "../shared/PrimaryButton";
import Divider from "../shared/Divider";
import SocialLogin from "./SocialLogin";

import { login } from "@/services/auth";
import { getMyOnboarding } from "@/services/onboarding";

export default function LoginForm({
  onForgotPassword,
}: {
  onForgotPassword: () => void;
}) {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    try {
      setLoading(true);
      await login({ username, password });

      // Check existing onboarding state to route appropriately
      try {
        await getMyOnboarding();
        // Onboarding complete -> redirect to dashboard
        router.replace("/dashboard");
      } catch (onboardingErr: unknown) {
        const errorObj = onboardingErr as { response?: { status?: number } };
        if (errorObj?.response?.status === 404) {
          // Onboarding incomplete -> redirect to onboarding wizard
          router.replace("/onboarding");
        } else {
          setError(
            "Failed to verify onboarding status. Please try logging in again."
          );
        }
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setError(
        errorObj?.response?.data?.detail ?? "Invalid username or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <AuthInput
        icon={<User size={16} />}
        placeholder="Username / Email Address"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={loading}
        autoComplete="username"
      />

      <PasswordInput
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        autoComplete="current-password"
      />

      {error && (
        <div className="text-sm text-red-400">
          <span>{error}</span>
          {error.toLowerCase().includes("verify your email") && (
            <Link
              href={`/verify-email?email=${encodeURIComponent(username)}`}
              className="text-[#D97870] font-semibold underline ml-1 hover:text-white transition-colors"
            >
              Verify now
            </Link>
          )}
        </div>
      )}

      {/* Remember Me + Forgot Password */}
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2.5 text-[13px] text-[#8b92a5] cursor-pointer select-none">
          <input
            type="checkbox"
            disabled={loading}
            className="
              w-3.5 h-3.5
              rounded-[4px]
              border border-white/20
              bg-transparent
              accent-[#F8B4C8]
              cursor-pointer
            "
          />
          Remember me
        </label>

        <button
          type="button"
          onClick={onForgotPassword}
          className="
            text-[13px]
            text-[#F8B4C8]
            hover:opacity-80
            transition-all
            duration-200
            cursor-pointer
          "
        >
          Forgot password?
        </button>
      </div>

      <div className="pt-1">
        <PrimaryButton disabled={loading}>
          {loading ? "Signing in..." : "Log in"}
        </PrimaryButton>
      </div>

      <Divider />

      <SocialLogin />

      <p className="text-center text-[13px] text-[#8b92a5] pt-1">
        New here?{" "}
        <Link
          href="/register"
          className="
            text-[#F8B4C8]
            hover:opacity-80
            font-medium
            transition-all
            duration-200
          "
        >
          Create an account
        </Link>
      </p>

    </form>
  );
}