"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Clock } from "lucide-react";
import LoginImage from "@/components/auth/LoginPage/LoginImage";
import PrimaryButton from "@/components/auth/shared/PrimaryButton";
import { verifyEmail, resendVerification } from "@/services/emailVerification";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5-minute countdown (300 seconds)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update email if query param changes
  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Cooldown countdown timer (60s resend rate limit)
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // 5-minute OTP expiry countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const isExpired = timeLeft === 0;

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  const handleOtpChange = (index: number, value: string) => {
    // Handle pasting a full 6-digit code
    if (value.length > 1) {
      const cleaned = value.replace(/\D/g, "").slice(0, 6);
      if (cleaned.length > 0) {
        const nextOtp = [...otp];
        for (let i = 0; i < 6; i++) {
          nextOtp[i] = cleaned[i] || "";
        }
        setOtp(nextOtp);
        const nextFocus = Math.min(cleaned.length, 5);
        inputRefs.current[nextFocus]?.focus();
      }
      return;
    }

    // Only allow single digit
    const cleaned = value.replace(/\D/g, "");
    const nextOtp = [...otp];
    nextOtp[index] = cleaned;
    setOtp(nextOtp);

    // Auto-focus next input
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fullOtp = otp.join("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please provide your email address.");
      return;
    }

    if (isExpired) {
      setError("This verification code has expired. Please click Resend Code to receive a new OTP.");
      return;
    }

    if (fullOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);
      const res = await verifyEmail(email, fullOtp);
      setSuccess(res.message || "Email verified successfully!");

      setTimeout(() => {
        router.push("/login?verified=true");
      }, 1500);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setError(
        errorObj?.response?.data?.detail ??
          "Verification failed. Please check your code and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if ((cooldown > 0 && !isExpired) || resending) return;
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please provide your email address to resend the code.");
      return;
    }

    try {
      setResending(true);
      const res = await resendVerification(email);
      setSuccess(res.message || "A new verification code has been sent!");
      setCooldown(60);
      setTimeLeft(300); // Reset 5-minute timer
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setError(
        errorObj?.response?.data?.detail ??
          "Could not resend verification code. Please try again later."
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold font-sans text-white tracking-tight">
          Verify your email
        </h1>
        <p className="text-[14px] text-[#A6ACBE] leading-relaxed">
          We&apos;ve sent a 6-digit verification code to{" "}
          <span className="text-white font-medium">{email || "your email"}</span>.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] leading-relaxed animate-in fade-in">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {isExpired && !error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[13px] leading-relaxed animate-in fade-in">
          <Clock size={16} className="shrink-0 mt-0.5" />
          <span>Your OTP has expired. Please click <strong>Resend Code</strong> below to receive a new one.</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[13px] leading-relaxed animate-in fade-in">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-5">
        {!emailParam && (
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-[#A6ACBE] uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 px-3.5 rounded-xl bg-[#232738] border border-white/10 text-white placeholder-white/30 text-[14px] focus:outline-none focus:border-[#D97870] transition-colors"
                required
              />
              <Mail className="absolute right-3.5 top-3 text-white/30" size={18} />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-semibold text-[#A6ACBE] uppercase tracking-wider">
              6-Digit Verification Code
            </label>
            <div className="flex items-center gap-1.5 text-[12px]">
              <Clock size={13} className={isExpired ? "text-red-400" : "text-[#D97870]"} />
              <span className={isExpired ? "text-red-400 font-semibold" : timeLeft <= 60 ? "text-amber-400 font-semibold animate-pulse" : "text-[#A6ACBE]"}>
                {isExpired ? "Expired" : `Expires in ${formatTime(timeLeft)}`}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 sm:gap-2.5">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isExpired}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono text-white rounded-xl bg-[#232738] border border-white/10 focus:border-[#D97870] focus:ring-2 focus:ring-[#D97870]/20 focus:outline-none transition-all shadow-inner disabled:opacity-40 disabled:cursor-not-allowed"
                autoFocus={index === 0}
              />
            ))}
          </div>
        </div>

        <PrimaryButton type="submit" disabled={loading || fullOtp.length !== 6 || isExpired}>
          {loading ? "Verifying..." : isExpired ? "Code Expired" : "Verify Email"}
        </PrimaryButton>
      </form>

      <div className="pt-2 text-center space-y-3">
        <p className="text-[13px] text-[#A6ACBE]">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={(cooldown > 0 && !isExpired) || resending}
            className="text-[#D97870] font-semibold hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            {resending && <RefreshCw size={13} className="animate-spin" />}
            {cooldown > 0 && !isExpired ? `Resend in ${cooldown}s` : "Resend Code"}
          </button>
        </p>

        <div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div
        className="
          w-full max-w-[1040px]
          rounded-3xl
          overflow-hidden
          border border-white/5
          bg-[#161925]
          shadow-2xl
          flex
          min-h-[640px]
        "
      >
        {/* Left half: Image */}
        <div className="relative hidden md:block w-1/2">
          <LoginImage />
        </div>

        {/* Right half: Form Panel */}
        <div className="w-full md:w-1/2 p-10 sm:p-14 lg:p-16 flex flex-col justify-center">
          <Suspense
            fallback={
              <div className="text-center text-[#A6ACBE] text-sm">
                Loading verification...
              </div>
            }
          >
            <VerifyEmailForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
