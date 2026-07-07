"use client";

import { motion } from "framer-motion";

const metrics = [
  { label: "Sleep Match",     value: 98, color: "#a78bfa" },
  { label: "Study Habits",    value: 91, color: "#22d3ee" },
  { label: "Privacy",         value: 94, color: "#f472b6" },
  { label: "Lifestyle",       value: 96, color: "#c084fc" },
];

function ProgressBar({ value, color, delay }: { value: number; color: string; delay: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, delay, ease: "easeOut" }}
          style={{
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 6px ${color}80`,
          }}
        />
      </div>
      <span className="text-[11px] font-medium tabular-nums" style={{ color }}>{value}%</span>
    </div>
  );
}

export default function CompatibilityCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
      style={{
        boxShadow:
          "0 0 0 1px rgba(139,92,246,0.18), 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
      className="
        relative z-10
        w-[300px]
        rounded-2xl
        border border-white/8
        bg-white/[0.04]
        backdrop-blur-2xl
        overflow-hidden
        p-6
      "
    >
      {/* Subtle top gradient line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(217,70,239,0.4), transparent)",
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-emerald-400"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          style={{ boxShadow: "0 0 6px rgba(52,211,153,0.8)" }}
        />
        <span className="text-[10px] font-semibold tracking-[0.2em] text-gray-400 uppercase">
          Live AI Engine
        </span>
      </div>

      {/* Score */}
      <div className="mb-5">
        <p className="text-[11px] text-gray-500 mb-1">Your Compatibility Score</p>
        <div className="flex items-end gap-1">
          <motion.span
            className="text-[44px] font-bold leading-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            style={{
              background: "linear-gradient(135deg, #f472b6 0%, #c084fc 50%, #818cf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            96.8
          </motion.span>
          <span className="text-[20px] font-bold text-gray-400 mb-1">%</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-[1px] bg-white/6 mb-4" />

      {/* Metrics */}
      <div className="space-y-3">
        {metrics.map((m, i) => (
          <div key={m.label}>
            <div className="flex justify-between mb-1.5">
              <span className="text-[11px] text-gray-400">{m.label}</span>
            </div>
            <ProgressBar value={m.value} color={m.color} delay={0.7 + i * 0.15} />
          </div>
        ))}
      </div>

      {/* Bottom badge */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)" }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          </div>
          <span className="text-[10px] text-gray-500">AI Matching Engine</span>
        </div>
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(139,92,246,0.15)",
            border: "1px solid rgba(139,92,246,0.25)",
            color: "#c084fc",
          }}
        >
          v2.4
        </span>
      </div>
    </motion.div>
  );
}