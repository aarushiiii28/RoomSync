"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Briefcase,
  User as UserIcon,
  Calendar,
  AlertCircle,
} from "lucide-react";

import DashboardGuard from "@/components/dashboard/DashboardGuard";
import Navbar from "@/components/layout/Navbar";
import { getRecommendations } from "@/services/matching";
import { PREDICTION_CONFIG } from "@/components/dashboard/MatchCard";
import type { CandidateMatchItem } from "@/types/matching";

const SIGNAL_LABELS: Record<string, string> = {
  sleep_compatibility: "Sleep Compatibility",
  work_compatibility: "Work & Study Habits",
  cleanliness_compatibility: "Cleanliness & Organization",
  social_compatibility: "Social & Guest Dynamics",
  privacy_compatibility: "Privacy Preferences",
  routine_compatibility: "Daily Routine Harmony",
  behavioral_alignment_score: "Behavioral & Chemistry Alignment",
};

// All bars use the cohesive pink brand color
const PINK_BAR_COLOR = "#D97870";

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params?.id as string;

  const [candidate, setCandidate] = useState<CandidateMatchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMatch() {
      if (!candidateId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getRecommendations(50);
        const match = data.matches.find((m) => m.candidate_id === candidateId);
        if (match) {
          setCandidate(match);
        } else {
          setError("Candidate match not found.");
        }
      } catch (err) {
        console.error("Error loading candidate details:", err);
        setError("Failed to load match profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadMatch();
  }, [candidateId]);

  const pred = candidate?.prediction as "High" | "Medium" | "Low";
  const cfg = candidate ? PREDICTION_CONFIG[pred] ?? PREDICTION_CONFIG.Medium : PREDICTION_CONFIG.Medium;

  const displayName = candidate
    ? [candidate.first_name, candidate.last_name].filter(Boolean).join(" ") || "Roommate Match"
    : "Roommate Match";

  const signalKeys = [
    "sleep_compatibility",
    "work_compatibility",
    "cleanliness_compatibility",
    "social_compatibility",
    "privacy_compatibility",
    "routine_compatibility",
    "behavioral_alignment_score",
  ];

  return (
    <DashboardGuard>
      <div className="min-h-screen flex flex-col bg-transparent">
        <Navbar />

        <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-12 pb-16">
          {/* Back Button */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white/90 bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md transition-all group cursor-pointer"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Matches</span>
            </Link>
          </div>

          {/* Loading State */}
          {loading && (
            <div
              className="rounded-2xl p-16 flex flex-col items-center justify-center gap-3 shadow-2xl"
              style={{ background: "#F8ECE8" }}
            >
              <Loader2 className="w-9 h-9 animate-spin" style={{ color: "#D97870" }} />
              <p className="text-[14px] font-medium" style={{ color: "#494F66" }}>
                Loading match profile details...
              </p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div
              className="rounded-2xl p-12 text-center shadow-2xl"
              style={{ background: "#F8ECE8" }}
            >
              <div
                className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
                style={{ background: "#F6D7CF", border: "1.5px solid #E5ADA2" }}
              >
                <AlertCircle className="w-7 h-7" style={{ color: "#D97870" }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "#2D3246" }}>
                {error}
              </h2>
              <p className="text-[13px] mb-6" style={{ color: "#494F66" }}>
                We couldn't retrieve the details for this match.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all"
                style={{
                  background: "#F6D7CF",
                  border: "1.5px solid #E5ADA2",
                  color: "#D97870",
                }}
              >
                Return to Matches
              </Link>
            </div>
          )}

          {/* Candidate Profile Loaded */}
          {!loading && candidate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: "#F8ECE8" }}
            >
              {/* ── Top Header Banner ── */}
              <div
                className="p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative"
                style={{ background: "#494F66" }}
              >
                <div className="flex items-center gap-5 sm:gap-6 min-w-0">
                  {/* Circular Profile Picture */}
                  <div
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center shadow-lg"
                    style={{
                      border: "3px solid #EBD6CF",
                      background: "#F6D7CF",
                    }}
                  >
                    {candidate.profile_photo_url ? (
                      <Image
                        src={candidate.profile_photo_url}
                        alt={displayName}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <span className="text-3xl font-bold font-sans" style={{ color: "#494F66" }}>
                        {(candidate.first_name?.[0] ?? "?").toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name and Summary Info */}
                  <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold font-sans text-white tracking-tight truncate">
                      {displayName}
                    </h1>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-[13px] font-medium text-[#A6ACBE]">
                      {candidate.age && (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-[#F6D7CF]" />
                          <span>{candidate.age} years old</span>
                        </span>
                      )}
                      {candidate.city && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-[#F6D7CF]" />
                          <span>{candidate.city}</span>
                        </span>
                      )}
                      {candidate.gender && (
                        <span className="flex items-center gap-1.5 capitalize">
                          <UserIcon size={14} className="text-[#F6D7CF]" />
                          <span>{candidate.gender}</span>
                        </span>
                      )}
                      {candidate.occupation && (
                        <span className="flex items-center gap-1.5">
                          <Briefcase size={14} className="text-[#F6D7CF]" />
                          <span>{candidate.occupation}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Equal Length Badge (Sleek vertical height, only "High" / "Medium" / "Low") */}
                <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                  <div
                    className="w-20 h-7 py-0.5 flex items-center justify-center gap-1.5 rounded-full text-[11px] font-bold shadow-xs"
                    style={{
                      background: cfg.bg,
                      border: `1.5px solid ${cfg.border}`,
                      color: cfg.text,
                    }}
                  >
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      style={{ background: cfg.dot }}
                    />
                    <span>{pred}</span>
                  </div>
                </div>
              </div>

              {/* ── Main Breakdown Content ── */}
              <div className="p-7 sm:p-9 lg:p-11 space-y-6">
                {/* Compatibility Score (On existing pink background, left-aligned, no white box, no Rule badge) */}
                <div className="flex flex-col items-start gap-0.5">
                  <p
                    className="text-[12px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: "#8b92a5" }}
                  >
                    Compatibility
                  </p>
                  <p
                    className="text-4xl sm:text-5xl font-bold font-sans tracking-tight"
                    style={{ color: "#2D3246" }}
                  >
                    {Math.round(candidate.rule_based_explainability.rule_score)}
                    <span
                      className="text-2xl sm:text-3xl font-semibold ml-1"
                      style={{ color: "#8b92a5" }}
                    >
                      %
                    </span>
                  </p>
                </div>

                {/* Sub-dimensional Compatibility Signals */}
                <div
                  className="p-6 sm:p-8 rounded-2xl shadow-sm space-y-5"
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid #EBD6CF",
                  }}
                >
                  <div className="border-b pb-3" style={{ borderColor: "#EBD6CF" }}>
                    <h2 className="font-sans text-xl font-bold" style={{ color: "#2D3246" }}>
                      Compatibility Signals Breakdown
                    </h2>
                  </div>

                  <div className="space-y-4 pt-1">
                    {signalKeys.map((key, i) => {
                      const val = candidate.feature_signals[key];
                      if (val === undefined) return null;
                      const pct = Math.round(val);

                      return (
                        <div key={key} className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[13px] font-semibold" style={{ color: "#2D3246" }}>
                              {SIGNAL_LABELS[key] ?? key}
                            </span>
                            <span
                              className="text-[13px] font-bold tabular-nums"
                              style={{ color: PINK_BAR_COLOR }}
                            >
                              {pct}%
                            </span>
                          </div>
                          <div
                            className="h-2 rounded-full overflow-hidden"
                            style={{ background: "rgba(73,79,102,0.08)" }}
                          >
                            <motion.div
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: 0.05 * i, ease: "easeOut" }}
                              style={{
                                background: `linear-gradient(90deg, #F6D7CF, ${PINK_BAR_COLOR})`,
                                boxShadow: `0 0 6px ${PINK_BAR_COLOR}40`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </DashboardGuard>
  );
}
