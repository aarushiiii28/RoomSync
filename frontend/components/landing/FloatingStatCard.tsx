"use client";

import { motion } from "framer-motion";

interface FloatingStatCardProps {
  label: string;
  value: string;
  delay?: number;
  className?: string;
  glowColor?: string;
}

export default function FloatingStatCard({
  label,
  value,
  delay = 0,
  className = "",
  glowColor = "rgba(139,92,246,0.25)",
}: FloatingStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{
          duration: 3 + delay,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay * 0.5,
        }}
        className={`
          relative px-3.5 py-2.5
          rounded-xl
          border border-white/10
          bg-white/5
          backdrop-blur-md
          cursor-default
          select-none
          ${className}
        `}
        style={{
          boxShadow: `0 4px 20px ${glowColor}, 0 0 0 0.5px rgba(255,255,255,0.04)`,
        }}
        whileHover={{
          scale: 1.06,
          boxShadow: `0 8px 32px ${glowColor.replace("0.25", "0.5")}, 0 0 0 1px rgba(255,255,255,0.08)`,
        }}
      >
        <p className="text-[10px] font-medium tracking-widest text-gray-500 uppercase">{label}</p>
        <p className="mt-0.5 text-[15px] font-semibold text-white">{value}</p>
      </motion.div>
    </motion.div>
  );
}
