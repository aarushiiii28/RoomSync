"use client";

import { motion } from "framer-motion";

const milestones = ["01", "02", "03"];

export default function ProgressLine() {
  return (
    <div className="hidden lg:block absolute top-8 left-0 w-full z-0">

      {/* Background Line */}

      <div className="absolute left-0 right-0 top-6 h-px bg-white/10" />

      {/* Animated Gradient Line */}

      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: "100%" }}
        viewport={{ once: true }}
        transition={{
          duration: 1.8,
          ease: "easeInOut",
        }}
        className="
          absolute
          left-0
          top-16
          h-px
          bg-gradient-to-r
          from-violet-500
          via-fuchsia-500
          to-cyan-400
        "
      />

      {/* Milestones */}

      <div className="relative flex justify-between">

        {milestones.map((number, index) => (
          <motion.div
            key={number}
            initial={{
              opacity: 0,
              scale: 0.5,
            }}
            whileInView={{
              opacity: 1,
              scale: 1,
            }}
            viewport={{ once: true }}
            transition={{
              delay: index * 0.4,
              duration: 0.45,
            }}
            className="
              w-14
              h-14
              rounded-full
              border
              border-white/10
              bg-[#16181D]
              backdrop-blur-xl
              flex
              items-center
              justify-center
              text-sm
              font-semibold
              text-white
              shadow-lg
              shadow-violet-500/10
            "
          >
            {number}
          </motion.div>
        ))}

      </div>
    </div>
  );
}