"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import DashboardGuard from "@/components/dashboard/DashboardGuard";
import Navbar from "@/components/layout/Navbar";

export default function DashboardPage() {
  return (
    <DashboardGuard>
      <div className="min-h-screen flex flex-col bg-[#0a0b10]">
        <Navbar />

        <main className="flex-1 flex items-center justify-center p-6">
          <div
            className="w-full max-w-[460px] rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8 text-center"
            style={{
              background: "#ffffff",
              border: "1.5px solid #105666",
              boxShadow: "0 16px 48px rgba(16,86,102,0.18)",
            }}
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: "rgba(16,86,102,0.12)",
                border: "1.5px solid #105666",
              }}
            >
              <CheckCircle className="w-6 h-6" style={{ color: "#105666" }} />
            </div>

            {/* Heading */}
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "#105666" }}
            >
              Welcome to RoomSync!
            </h1>

            {/* Sub-text */}
            <p
              className="mt-2.5 text-[13.5px] leading-relaxed"
              style={{ color: "#5a6e70" }}
            >
              Your profile is complete. Our AI matching engine is now calculating
              compatibility scores with potential roommates in your selected area.
            </p>

            {/* Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/onboarding"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:bg-[#105666]/5 hover:opacity-90"
                style={{
                  border: "1.5px solid #105666",
                  color: "#105666",
                  background: "transparent",
                }}
              >
                Edit Profile
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:opacity-90"
                style={{
                  background: "#105666",
                  color: "#F7F4D5",
                  boxShadow: "0 4px 14px rgba(16,86,102,0.25)",
                }}
              >
                Go to Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    </DashboardGuard>
  );
}
