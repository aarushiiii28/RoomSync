"use client";

import { motion } from "framer-motion";
import { StepData } from "./types";

interface Props {
  step: StepData;
  index: number;
}

export default function Step({ step, index }: Props) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 60,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{
        duration: 0.8,
        delay: index * 0.3,
        ease: "easeOut",
      }}
      className="flex flex-col items-center text-center"
    >
      {/* Illustration */}

      <motion.div
        whileHover={{
          y: -6,
          scale: 1.02,
        }}
        transition={{
          duration: 0.25,
        }}
        className="w-72"
      >
        {step.illustration}
      </motion.div>

      {/* Step Number */}

      <span
        className="
        mt-8
        text-sm
        font-semibold
        tracking-[0.3em]
        uppercase
        text-[#F8B4C8]
      "
      >
        Step {step.id}
      </span>

      {/* Title */}

      <h3
        className="
        mt-3
        text-3xl
        font-semibold
        text-white
      "
      >
        {step.title}
      </h3>

      {/* Description */}

      <p
        className="
        mt-5
        max-w-sm
        text-base
        leading-8
        text-zinc-400
      "
      >
        {step.description}
      </p>
    </motion.div>
  );
}