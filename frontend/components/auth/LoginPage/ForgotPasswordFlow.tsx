"use client";

import { useState, useEffect } from "react";
import { Mail, KeyRound, Clock, RotateCcw } from "lucide-react";
import AuthInput from "../shared/AuthInput";
import PasswordInput from "../shared/PasswordInput";
import PrimaryButton from "../shared/PrimaryButton";
import { forgotPassword, confirmForgotPassword } from "@/services/auth";

export default function ForgotPasswordFlow({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes = 300 seconds

  // Timer countdown effect for code phase
  useEffect(() => {
    if (phase !== "code" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(email.trim());
      setPhase("code");
      setTimeLeft(300); // reset to 5 minutes
      setSuccess("A reset code has been sent to your email.");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setError(
        errorObj?.response?.data?.detail ?? "Failed to request password reset."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setError("");
    setSuccess("");

    try {
      setResending(true);
      await forgotPassword(email.trim());
      setTimeLeft(300); // reset timer
      setSuccess("A new reset code has been sent to your email.");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setError(
        errorObj?.response?.data?.detail ?? "Failed to resend reset code."
      );
    } finally {
      setResending(false);
    }
  }

  async function handleCodeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!code.trim()) {
      setError("Reset code is required.");
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (timeLeft === 0) {
      setError("The verification code has expired. Please click 'Resend Code'.");
      return;
    }

    try {
      setLoading(true);
      await confirmForgotPassword(email.trim(), code.trim(), newPassword);
      setSuccess("Password reset successfully! You can now log in.");
      // Auto-return to login after 2 seconds
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setError(
        errorObj?.response?.data?.detail ?? "Failed to reset password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {success && (
        <div className="text-sm text-green-400 bg-green-400/10 p-3 rounded-xl border border-green-400/20">
          {success}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">
          {error}
        </div>
      )}

      {phase === "email" ? (
        <form onSubmit={handleEmailSubmit} className="space-y-4 mt-2">
          <AuthInput
            icon={<Mail size={16} />}
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
          />

          <div className="pt-2">
            <PrimaryButton disabled={loading}>
              {loading ? "Sending Code..." : "Send Reset Code"}
            </PrimaryButton>
          </div>
        </form>
      ) : (
        <form onSubmit={handleCodeSubmit} className="space-y-3.5 mt-2">
          <AuthInput
            icon={<KeyRound size={16} />}
            placeholder="Reset Code from Email"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading || resending}
          />

          <PasswordInput
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading || resending}
            autoComplete="new-password"
          />

          <PasswordInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading || resending}
            autoComplete="new-password"
          />

          {/* Countdown & Resend timer section */}
          <div className="flex items-center justify-between px-1 py-1 text-xs text-[#8b92a5]">
            <div className="flex items-center gap-1.5">
              <Clock size={13} className={timeLeft > 0 ? "text-[#F8B4C8]" : "text-red-400"} />
              {timeLeft > 0 ? (
                <span>
                  Code expires in <span className="font-mono font-medium text-white">{formatTime(timeLeft)}</span>
                </span>
              ) : (
                <span className="text-red-400">Code expired</span>
              )}
            </div>

            {timeLeft === 0 ? (
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending || loading}
                className="flex items-center gap-1 text-[#F8B4C8] hover:text-[#fcd2dd] font-medium transition-colors cursor-pointer"
              >
                <RotateCcw size={12} className={resending ? "animate-spin" : ""} />
                {resending ? "Sending..." : "Resend Code"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending || loading}
                className="text-[#8b92a5] hover:text-zinc-300 transition-colors"
                title="Resend code if not received"
              >
                {resending ? "Sending..." : "Resend code"}
              </button>
            )}
          </div>

          <div className="pt-2">
            <PrimaryButton disabled={loading || resending || !!success.includes("successfully")}>
              {loading ? "Resetting..." : "Set New Password"}
            </PrimaryButton>
          </div>
        </form>
      )}

      <div className="text-center pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={loading || resending}
          className="text-[13px] text-[#8b92a5] hover:text-white transition-colors"
        >
          &larr; Back to Login
        </button>
      </div>
    </div>
  );
}
