"use client";

import Link from "next/link";
import DashboardGuard from "@/components/dashboard/DashboardGuard";
import Navbar from "@/components/layout/Navbar";
import RecommendationsGrid from "@/components/dashboard/RecommendationsGrid";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();

  const firstName = user?.firstName || user?.username || "there";

  return (
    <DashboardGuard>
      <div
        className="min-h-screen flex flex-col"
        style={{
          background: "linear-gradient(135deg, #0f1119 0%, #161925 50%, #1a1530 100%)",
        }}
      >
        <Navbar />

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12">

          {/* ── Welcome header ── */}
          <div className="w-full mb-10 flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-4">
            <div>
              <h1 className="text-[22px] sm:text-[24px] font-bold tracking-tight text-white">
                Welcome back, {firstName}!
              </h1>
              <p className="text-[13px] sm:text-[14px] font-medium text-zinc-400 mt-1.5">
                Your profile is complete. Here are your roommate matches.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/onboarding"
                className="px-4 py-2 rounded-xl text-[13px] font-semibold transition-all hover:bg-white/10 text-zinc-200 hover:text-white"
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                }}
              >
                Edit Profile
              </Link>
            </div>
          </div>

          {/* ── ML Recommendations ── */}
          <RecommendationsGrid topN={10} />

        </main>
      </div>
    </DashboardGuard>
  );
}

