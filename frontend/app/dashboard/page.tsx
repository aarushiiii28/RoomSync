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
      <div className="min-h-screen flex flex-col bg-transparent">
        <Navbar />

        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-10 sm:pt-12 pb-10 flex flex-col h-full">

          {/* ── Outer card wrapping the whole page content ── */}
          <div
            className="rounded-2xl overflow-hidden shadow-2xl flex-1 flex flex-col h-full"
            style={{ background: "#F8ECE8" }}
          >
            {/* ── Welcome header bar ── */}
            <div
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-8 py-5 sm:py-6"
              style={{ background: "#494F66" }}
            >
              <div>
                <h1 className="text-[20px] sm:text-[24px] font-bold tracking-tight text-white font-sans">
                  Welcome back, {firstName}!
                </h1>
                <p className="text-[12.5px] sm:text-[13px] font-medium mt-1" style={{ color: "#A6ACBE" }}>
                  Your profile is complete. Here are your roommate matches.
                </p>
              </div>

              <Link
                href="/onboarding"
                className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[12.5px] sm:text-[13px] font-semibold transition-all hover:bg-white/10 text-white flex-shrink-0"
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.08)",
                }}
              >
                Edit Profile
              </Link>
            </div>

            {/* ── Match grid content area ── */}
            <div className="p-3.5 sm:p-7 lg:p-11">
              <RecommendationsGrid topN={10} />
            </div>
          </div>
        </main>
      </div>
    </DashboardGuard>
  );
}
