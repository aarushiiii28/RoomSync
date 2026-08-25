"use client";

import { motion } from "framer-motion";
import Image from "next/image";
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
  sleep_compatibility: "#105666",
  work_compatibility: "#0284c7",
  cleanliness_compatibility: "#7c3aed",
  social_compatibility: "#db2777",
  privacy_compatibility: "#059669",
  routine_compatibility: "#d97706",
  behavioral_alignment_score: "#0d9488",
};

const PREDICTION_CONFIG = {
  High: {
    bg: "rgba(16,86,102,0.10)",
    border: "#105666",
    text: "#105666",
    glow: "rgba(16,86,102,0.2)",
    dot: "#105666",
  },
  Medium: {
    bg: "rgba(217,119,6,0.10)",
    border: "#d97706",
    text: "#b45309",
    glow: "rgba(217,119,6,0.2)",
    dot: "#d97706",
  },
  Low: {
    bg: "rgba(220,38,38,0.10)",
    border: "#dc2626",
    text: "#b91c1c",
    glow: "rgba(220,38,38,0.2)",
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
        <span className="text-[12px] font-medium text-[#475569]">{label}</span>
        <span className="text-[12px] font-bold tabular-nums" style={{ color }}>
          {pct}%
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(16,86,102,0.08)" }}
      >
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay, ease: "easeOut" }}
          style={{
            background: `linear-gradient(90deg, ${color}99, ${color})`,
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
  const pred = candidate.prediction as "High" | "Medium" | "Low";
  const cfg = PREDICTION_CONFIG[pred] ?? PREDICTION_CONFIG.Medium;
  const confidencePct = Math.round(candidate.confidence * 100);

  // Ordered signal keys — same order as backend schema
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

  const subtitle = [
    candidate.occupation,
    candidate.city,
    candidate.age ? `${candidate.age} yrs` : null,
    candidate.gender,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08 * index, ease: "easeOut" }}
      className="relative rounded-2xl overflow-hidden shadow-xl"
      style={{
        background: "#ffffff",
        border: "1.5px solid #105666",
        boxShadow: "0 16px 48px rgba(16,86,102,0.14)",
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, #105666, rgba(16,86,102,0.5), transparent)",
        }}
      />

      <div className="p-5 sm:p-6">
        {/* ── Header: avatar + name + prediction badge ── */}
        <div className="flex items-start gap-4 mb-5">
          {/* Avatar */}
          <div
            className="relative w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center shadow-xs"
            style={{
              border: "1.5px solid #105666",
              background: "rgba(16,86,102,0.08)",
            }}
          >
            {candidate.profile_photo_url ? (
              <Image
                src={candidate.profile_photo_url}
                alt={displayName}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <span
                className="text-xl font-bold"
                style={{ color: "#105666" }}
              >
                {(candidate.first_name?.[0] ?? "?").toUpperCase()}
              </span>
            )}
          </div>

          {/* Name / subtitle */}
          <div className="flex-1 min-w-0">
            <h3
              className="text-[16px] font-bold truncate tracking-tight"
              style={{ color: "#105666" }}
            >
              {displayName}
            </h3>
            {subtitle && (
              <p
                className="text-[12px] font-medium mt-0.5 truncate"
                style={{ color: "#5a6e70" }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Prediction badge */}
          <div
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
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
        </div>

        {/* ── Confidence score box ── */}
        <div
          className="mb-5 px-4 py-3.5 rounded-xl flex items-center justify-between"
          style={{
            background: "rgba(16,86,102,0.04)",
            border: "1px solid rgba(16,86,102,0.15)",
          }}
        >
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.18em] font-bold"
              style={{ color: "#5a6e70" }}
            >
              ML Confidence
            </p>
            <p
              className="text-[28px] font-bold leading-none mt-1"
              style={{ color: "#105666" }}
            >
              {confidencePct}
              <span
                className="text-[15px] font-semibold ml-0.5"
                style={{ color: "#5a6e70" }}
              >
                %
              </span>
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-[10px] uppercase tracking-[0.18em] font-bold"
              style={{ color: "#5a6e70" }}
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

        {/* ── Divider ── */}
        <div
          className="h-[1px] mb-5"
          style={{ background: "rgba(16,86,102,0.12)" }}
        />

        {/* ── Feature signals ── */}
        <div className="space-y-3">
          {signalKeys.map((key, i) => {
            const val = candidate.feature_signals[key];
            if (val === undefined) return null;
            return (
              <SignalBar
                key={key}
                label={SIGNAL_LABELS[key] ?? key}
                value={val}
                color={SIGNAL_COLORS[key] ?? "#105666"}
                delay={0.08 * index + 0.4 + i * 0.06}
              />
            );
          })}
        </div>

        {/* ── Rule-based score footer ── */}
        <div className="mt-5 pt-3.5 border-t border-[#105666]/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(16,86,102,0.12)",
                border: "1.5px solid #105666",
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#105666]" />
            </div>
            <span className="text-[11px] font-semibold text-[#5a6e70]">
              Rule Score
            </span>
          </div>
          <span
            className="text-[12px] font-bold px-2.5 py-0.5 rounded-full"
            style={{
              background: "rgba(16,86,102,0.08)",
              border: "1.5px solid #105666",
              color: "#105666",
            }}
          >
            {Math.round(candidate.rule_based_explainability.rule_score)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
