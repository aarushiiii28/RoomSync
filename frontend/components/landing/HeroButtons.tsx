"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function HeroButtons() {
  const router = useRouter();
  const { isAuthenticated, profileComplete, loading } = useAuth();

  const handleStartMatching = () => {
    if (loading) return;

    if (!isAuthenticated) {
      router.push("/register");
    } else if (!profileComplete) {
      router.push("/onboarding");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="mt-14 flex items-center gap-4">
      <button
        type="button"
        onClick={handleStartMatching}
        disabled={loading}
        className="
          rounded-xl
          bg-[#F8B4C8]
          text-[#161925]
          px-10
          py-4
          font-bold
          transition
          hover:scale-105
          hover:opacity-95
          cursor-pointer
          shadow-[0_6px_24px_rgba(248,180,200,0.35)]
        "
      >
        Explore Your Matches
      </button>
    </div>
  );
}