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
        y: -8,
        scale: 1.02,
      }}
      transition={{
        duration: 0.3,
      }}
      className="
        rounded-3xl
        border
        border-white/10
        bg-[#121923]
        p-10
        text-center
      "
    >
      <div className="h-56 flex items-center justify-center">

        {feature.illustration}

      </div>

      <h3
        className="
          mt-8
          text-3xl
          font-semibold
          text-white
        "
      >
        {feature.title}
      </h3>

      <p
        className="
          mt-5
          text-zinc-400
          leading-8
        "
      >
        {feature.description}
      </p>
    </motion.div>
  );
}