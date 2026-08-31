"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function HeroButtons() {
  const { isAuthenticated, profileComplete } = useAuth();

  const targetHref = isAuthenticated
    ? profileComplete
      ? "/dashboard"
      : "/onboarding"
    : "/register";

  return (
    <div className="mt-3 sm:mt-8 md:mt-12 flex items-center justify-center lg:justify-start gap-4 w-full">
      <Link
        href={targetHref}
        className="
          inline-flex items-center justify-center
          w-auto
          rounded-xl
          bg-[#F8B4C8]
          text-[#161925]
          px-5 sm:px-9
          py-2.5 sm:py-3.5
          text-[13.5px] sm:text-base
          font-bold
          transition
          hover:scale-105
          hover:opacity-95
          active:scale-95
          cursor-pointer
          shadow-[0_6px_24px_rgba(248,180,200,0.35)]
        "
      >
        Explore Your Matches
      </Link>
    </div>
  );
}