"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import type { CandidateMatchItem } from "@/types/matching";

export const PREDICTION_CONFIG = {
  High: {
    bg: "#dcfce7",
    border: "#22c55e",
    text: "#15803d",
    dot: "#16a34a",
  },
  Medium: {
    bg: "#ffedd5",
    border: "#f97316",
    text: "#c2410c",
    dot: "#ea580c",
  },
  Low: {
    bg: "#fee2e2",
    border: "#ef4444",
    text: "#b91c1c",
    dot: "#dc2626",
  },
};

interface MatchCardProps {
  candidate: CandidateMatchItem;
  index: number;
}

export default function MatchCard({ candidate, index }: MatchCardProps) {
  const pred = candidate.prediction as "High" | "Medium" | "Low";
  const cfg = PREDICTION_CONFIG[pred] ?? PREDICTION_CONFIG.Medium;

  const displayName =
    [candidate.first_name, candidate.last_name].filter(Boolean).join(" ") ||
    "Unknown";

  // Age, place of living, and gender shown in the primary row
  const ageAndLocation = [
    candidate.age ? `${candidate.age} yrs` : null,
    candidate.city ? candidate.city : null,
    candidate.gender
      ? candidate.gender.charAt(0).toUpperCase() + candidate.gender.slice(1).replace("_", "-")
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 * index, ease: "easeOut" }}
      className="relative rounded-xl overflow-hidden transition-all duration-200 group"
      style={{
        background: "#ffffff",
        border: "1.5px solid #EBD6CF",
        boxShadow: "0 2px 12px rgba(73,79,102,0.06)",
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2.5px]"
        style={{
          background: "linear-gradient(90deg, #D97870, #E5ADA2, #F6D7CF)",
        }}
      />

      {/* ── Clickable Match Row Navigating to Match Profile ── */}
      <Link
        href={`/dashboard/matches/${candidate.candidate_id}`}
        className="w-full p-3.5 sm:p-5 flex items-center justify-between gap-2.5 sm:gap-4 text-left select-none hover:bg-[#F8ECE8]/40 transition-colors block cursor-pointer"
      >
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
          {/* Profile Picture (Circular format) */}
          <div
            className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center shadow-xs"
            style={{
              border: "1.5px solid #EBD6CF",
              background: "#F6D7CF",
            }}
          >
            {candidate.profile_photo_url ? (
              <Image
                src={candidate.profile_photo_url}
                alt={displayName}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <span className="text-base sm:text-lg font-bold" style={{ color: "#494F66" }}>
                {(candidate.first_name?.[0] ?? "?").toUpperCase()}
              </span>
            )}
          </div>

          {/* Name (Enlarged) + Age and Place of living */}
          <div className="min-w-0 flex-1">
            <h3
              className="text-[15.5px] sm:text-[19px] font-bold truncate tracking-tight group-hover:text-[#D97870] transition-colors"
              style={{ color: "#2D3246" }}
            >
              {displayName}
            </h3>
            {ageAndLocation ? (
              <p
                className="text-[12px] sm:text-[13px] font-medium mt-0.5 truncate"
                style={{ color: "#494F66" }}
              >
                {ageAndLocation}
              </p>
            ) : (
              <p className="text-[12px] sm:text-[13px] font-medium mt-0.5 truncate text-zinc-400">
                Location & Age not specified
              </p>
            )}
          </div>
        </div>

        {/* Right side: Badge with equal fixed length + Message button + Navigation arrow */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Prediction badge with equal fixed width w-20 */}
          <div
            className="w-18 sm:w-20 h-6 sm:h-7 py-0.5 flex items-center justify-center gap-1 sm:gap-1.5 rounded-full text-[10px] sm:text-[11px] font-bold"
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

          <div
            className="hidden sm:flex w-7 h-7 rounded-full items-center justify-center group-hover:translate-x-0.5 transition-all duration-200"
            style={{
              background: "#F8ECE8",
              color: "#494F66",
            }}
          >
            <ChevronRight size={15} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
