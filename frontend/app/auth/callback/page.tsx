"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { googleLogin } from "@/services/auth";
import { getMyOnboarding } from "@/services/onboarding";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  // Use a ref to prevent double-firing in React strict mode
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;

    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (errorParam) {
      processedRef.current = true;
      setError(errorDescription || errorParam);
      return;
    }

    if (!code) {
      processedRef.current = true;
      setError("No authorization code found.");
      return;
    }

    processedRef.current = true;

    async function processLogin() {
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
        const redirectUri = `${origin}/auth/callback`;
        await googleLogin(code as string, redirectUri);

        // Check onboarding state
        try {
          await getMyOnboarding();
          router.replace("/dashboard");
        } catch (onboardingErr: unknown) {
          const errorObj = onboardingErr as { response?: { status?: number } };
          if (errorObj?.response?.status === 404) {
            router.replace("/onboarding");
          } else {
            setError("Failed to verify onboarding status. Please log in again.");
          }
        }
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: { detail?: string } } };
        setError(errorObj?.response?.data?.detail || "Authentication failed. Please try again.");
      }
    }

    processLogin();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#11131a] p-6">
        <div className="w-full max-w-[400px] bg-[#161925] p-8 rounded-3xl border border-white/5 shadow-2xl text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Failed</h1>
          <p className="text-[#D97870] mb-6">{error}</p>
          <button
            onClick={() => router.replace("/login")}
            className="text-[13px] text-[#8b92a5] hover:text-white transition-colors"
          >
            &larr; Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#11131a]">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-[#F8B4C8]/30 border-t-[#F8B4C8] rounded-full animate-spin mb-4" />
        <p className="text-white font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#11131a]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-[#F8B4C8]/30 border-t-[#F8B4C8] rounded-full animate-spin mb-4" />
          <p className="text-white font-medium">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
