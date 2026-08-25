"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import type { CandidateMatchItem } from "@/types/matching";

const SIGNAL_LABELS: Record<string, string> = {
  sleep_compatibility: "Sleep",
  work_compatibility: "Work",
  cleanliness_compatibility: "Cleanliness",
  social_compatibility: "Social",
  privacy_compatibility: "Privacy",
  routine_compatibility: "Routine",
  behavioral_alignment_score: "Behaviour",
};

const SIGNAL_COLORS: Record<string, string> = {
  sleep_compatibility: "#494F66",
  work_compatibility: "#3D2A62",
  cleanliness_compatibility: "#7c3aed",
  social_compatibility: "#D97870",
  privacy_compatibility: "#059669",
  routine_compatibility: "#d97706",
  behavioral_alignment_score: "#0d9488",
};

const PREDICTION_CONFIG = {
  High: {
    bg: "rgba(73,79,102,0.10)",
    border: "#494F66",
    text: "#494F66",
    dot: "#494F66",
  },
  Medium: {
    bg: "rgba(217,119,6,0.10)",
    border: "#d97706",
    text: "#b45309",
    dot: "#d97706",
  },
  Low: {
    bg: "rgba(220,38,38,0.10)",
    border: "#dc2626",
    text: "#b91c1c",
    dot: "#dc2626",
  },
};

function SignalBar({
  label,
  value,
  color,
  delay,
}: {
  label: string;
  value: number;
  color: string;
  delay: number;
}) {
  const pct = Math.round(value);
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[12px] font-medium" style={{ color: "#494F66" }}>
          {label}
        </span>
        <span className="text-[12px] font-bold tabular-nums" style={{ color }}>
          {pct}%
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(73,79,102,0.10)" }}
      >
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay, ease: "easeOut" }}
          style={{
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 6px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

interface MatchCardProps {
  candidate: CandidateMatchItem;
  index: number;
}

export default function MatchCard({ candidate, index }: MatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const pred = candidate.prediction as "High" | "Medium" | "Low";
  const cfg = PREDICTION_CONFIG[pred] ?? PREDICTION_CONFIG.Medium;
  const confidencePct = Math.round(candidate.confidence * 100);

  const signalKeys = [
    "sleep_compatibility",
    "work_compatibility",
    "cleanliness_compatibility",
    "social_compatibility",
    "privacy_compatibility",
    "routine_compatibility",
    "behavioral_alignment_score",
  ];

  const displayName =
    [candidate.first_name, candidate.last_name].filter(Boolean).join(" ") ||
    "Unknown";

  // Only age and place of living shown in the primary row
  const ageAndLocation = [
    candidate.age ? `${candidate.age} yrs` : null,
    candidate.city ? candidate.city : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // Extra details shown when expanded
  const extraDetails = [candidate.occupation, candidate.gender]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 * index, ease: "easeOut" }}
      className="relative rounded-xl overflow-hidden transition-all duration-200"
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

      {/* ── Collapsed Clickable Header Row ── */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer select-none hover:bg-[#F8ECE8]/30 transition-colors focus:outline-none"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Profile Picture */}
          <div
            className="relative w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center shadow-xs"
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
              <span className="text-lg font-bold" style={{ color: "#494F66" }}>
                {(candidate.first_name?.[0] ?? "?").toUpperCase()}
              </span>
            )}
          </div>

          {/* Name (Enlarged) + Age and Place of living */}
          <div className="min-w-0 flex-1">
            <h3
              className="text-[17px] sm:text-[19px] font-bold truncate tracking-tight"
              style={{ color: "#2D3246" }}
            >
              {displayName}
            </h3>
            {ageAndLocation ? (
              <p
                className="text-[13px] font-medium mt-0.5 truncate"
                style={{ color: "#494F66" }}
              >
                {ageAndLocation}
              </p>
            ) : (
              <p
                className="text-[13px] font-medium mt-0.5 truncate text-zinc-400"
              >
                Location & Age not specified
              </p>
            )}
          </div>
        </div>

        {/* Right side: Badge + Chevron expand icon */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
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
            {pred}
          </div>

          <div
            className="w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-200"
            style={{
              background: "#F8ECE8",
              color: "#494F66",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <ChevronDown size={15} />
          </div>
        </div>
      </button>

      {/* ── Expandable Description & Breakdown (Shown when clicked) ── */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              className="p-5 sm:p-6 border-t space-y-4"
              style={{
                background: "#FAF4F2",
                borderColor: "#EBD6CF",
              }}
            >
              {/* Extra info chip if available */}
              {extraDetails && (
                <div className="flex items-center gap-2 pb-1">
                  <span
                    className="text-[12px] font-semibold px-2.5 py-1 rounded-md"
                    style={{
                      background: "#ffffff",
                      border: "1px solid #EBD6CF",
                      color: "#494F66",
                    }}
                  >
                    {extraDetails}
                  </span>
                </div>
              )}

              {/* Confidence score box */}
              <div
                className="px-4 py-3 rounded-xl flex items-center justify-between"
                style={{
                  background: "#ffffff",
                  border: "1px solid #EBD6CF",
                }}
              >
                <div>
                  <p
                    className="text-[10px] uppercase tracking-[0.18em] font-bold"
                    style={{ color: "#8b92a5" }}
                  >
                    ML Confidence
                  </p>
                  <p
                    className="text-[26px] font-bold leading-none mt-1"
                    style={{ color: "#2D3246" }}
                  >
                    {confidencePct}
                    <span
                      className="text-[14px] font-semibold ml-0.5"
                      style={{ color: "#8b92a5" }}
                    >
                      %
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-[10px] uppercase tracking-[0.18em] font-bold"
                    style={{ color: "#8b92a5" }}
                  >
                    Compatibility
                  </p>
                  <p
                    className="text-[13px] font-bold mt-1"
                    style={{ color: cfg.text }}
                  >
                    {pred} Match
                  </p>
                </div>
              </div>

              {/* Sub-dimensional signals */}
              <div
                className="p-4 rounded-xl space-y-2.5"
                style={{
                  background: "#ffffff",
                  border: "1px solid #EBD6CF",
                }}
              >
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2"
                  style={{ color: "#8b92a5" }}
                >
                  Compatibility Signals
                </p>
                {signalKeys.map((key, i) => {
                  const val = candidate.feature_signals[key];
                  if (val === undefined) return null;
                  return (
                    <SignalBar
                      key={key}
                      label={SIGNAL_LABELS[key] ?? key}
                      value={val}
                      color={SIGNAL_COLORS[key] ?? "#494F66"}
                      delay={0.05 * i}
                    />
                  );
                })}
              </div>

              {/* Rule-based score footer */}
              <div
                className="p-3.5 rounded-xl flex items-center justify-between"
                style={{
                  background: "#ffffff",
                  border: "1px solid #EBD6CF",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      background: "#F6D7CF",
                      border: "1.5px solid #E5ADA2",
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "#D97870" }}
                    />
                  </div>
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: "#8b92a5" }}
                  >
                    Rule Score
                  </span>
                </div>
                <span
                  className="text-[12px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{
                    background: "#F6D7CF",
                    border: "1.5px solid #E5ADA2",
                    color: "#D97870",
                  }}
                >
                  {Math.round(candidate.rule_based_explainability.rule_score)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
