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
        style={{ background: "#545B73" }}
      >
        <Navbar />

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-12">

          {/* ── Outer card wrapping the whole page content ── */}
          <div
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "#F8ECE8" }}
          >
            {/* ── Welcome header bar ── */}
            <div
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-8 py-6"
              style={{ background: "#494F66" }}
            >
              <div>
                <h1 className="text-[22px] sm:text-[24px] font-bold tracking-tight text-white font-serif">
                  Welcome back, {firstName}!
                </h1>
                <p className="text-[13px] font-medium mt-1" style={{ color: "#A6ACBE" }}>
                  Your profile is complete. Here are your roommate matches.
                </p>
              </div>

              <Link
                href="/onboarding"
                className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-all hover:bg-white/10 text-white flex-shrink-0"
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.08)",
                }}
              >
                Edit Profile
              </Link>
            </div>

            {/* ── Match grid content area ── */}
            <div className="p-7 sm:p-9 lg:p-11">
              <RecommendationsGrid topN={10} />
            </div>
          </div>

        </main>
      </div>
    </DashboardGuard>
  );
}
