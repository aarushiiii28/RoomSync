"use client";

import { motion } from "framer-motion";
import { Feature } from "./types";

interface Props {
  feature: Feature;
}

export default function FeatureCard({ feature }: Props) {
  return (
    <motion.div
      whileHover={{
        y: -4,
        scale: 1.015,
        boxShadow: "0 0 32px 6px rgba(244, 114, 182, 0.28), 0 0 60px 12px rgba(244, 114, 182, 0.10)",
      }}
      transition={{
        duration: 0.25,
      }}
      className="
        rounded-2xl
        border
        border-white/10
        bg-[#121923]/90
        backdrop-blur-sm
        p-6
        flex
        flex-col
        items-center
        text-center
        h-full
        transition-colors
        hover:border-pink-500/40
        hover:bg-[#151f2c]
        cursor-default
      "
    >
      <div className="h-32 md:h-36 w-full flex items-center justify-center relative">
        {feature.illustration}
      </div>

      <h3
        className="
          mt-4
          text-lg
          md:text-xl
          font-semibold
          text-white
          tracking-tight
        "
      >
        {feature.title}
      </h3>

      <p
        className="
          mt-2.5
          text-sm
          text-zinc-400
          leading-relaxed
        "
      >
        {feature.description}
      </p>
    </motion.div>
  );
}