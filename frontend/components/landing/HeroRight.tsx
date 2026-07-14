"use client";

import { motion } from "framer-motion";
import AiOrb from "./AiOrb";

export default function HeroRight() {
  return (
    <div className="flex-1 flex justify-center items-center relative min-h-[400px]">
      {/* Large ambient glow behind everything */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 55% 45%, rgba(139,92,246,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Main composition wrapper */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative flex flex-col items-center gap-0 -mt-8"
      >
        <div className="relative flex items-center justify-center">
          <AiOrb />
        </div>
      </motion.div>
    </div>
  );
}