"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { steps } from "./data";

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

export default function HowItWorks() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const goNext = () => {
    if (current < steps.length - 1) {
      setDirection(1);
      setCurrent((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (current > 0) {
      setDirection(-1);
      setCurrent((prev) => prev - 1);
    }
  };

  const step = steps[current];

  return (
    <section id="how-it-works" className="relative overflow-hidden min-h-screen flex flex-col">

      <div className="max-w-5xl mx-auto px-8 pt-24 pb-16 text-center flex-shrink-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="mt-2 text-4xl md:text-5xl font-bold text-white leading-tight">
            Finding the perfect roommate<br />
            shouldn't feel like gambling.
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg leading-8 text-zinc-400">
            RoomSync understands how you actually live, then intelligently recommends
            roommates you'll genuinely enjoy sharing a space with.
          </p>
        </motion.div>
      </div>

      {/* Step counter dots */}
      <div className="flex justify-center gap-3 mb-10 flex-shrink-0">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDirection(i > current ? 1 : -1);
              setCurrent(i);
            }}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === current
                ? "bg-pink-400 scale-125"
                : "bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>

      {/* Carousel area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden px-24 pb-24">

        {/* Back arrow — visible on step 2 and 3 */}
        {current > 0 && (
          <button
            onClick={goPrev}
            className="
              absolute left-8 z-20
              w-14 h-14 rounded-full
              flex items-center justify-center
              border border-white/15 bg-white/5 backdrop-blur-xl
              text-white
              hover:bg-white/10 hover:border-pink-400/50
              hover:shadow-[0_0_20px_rgba(244,114,182,0.25)]
              transition-all duration-300
            "
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Slide panel */}
        <div className="w-full max-w-4xl overflow-hidden">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
              className="flex flex-col md:flex-row items-center gap-12 md:gap-20"
            >
              {/* Text side */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-6">
                  <span
                    className="
                      w-10 h-10 rounded-full flex-shrink-0
                      flex items-center justify-center
                      text-sm font-bold text-white
                      bg-gradient-to-br from-pink-400 to-rose-400
                      shadow-[0_0_20px_rgba(244,114,182,0.45)]
                    "
                  >
                    {step.id}
                  </span>
                  <span className="text-xs font-semibold tracking-[0.3em] uppercase text-pink-400">
                    Step {step.id}
                  </span>
                </div>

                <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  {step.title}
                </h3>

                <p className={`mt-6 text-lg text-zinc-400 leading-8 ${step.illustration ? "max-w-md" : "max-w-2xl"}`}>
                  {step.description}
                </p>
              </div>

              {/* Illustration side */}
              {step.illustration && (
                <div className="w-full md:w-[340px] flex-shrink-0">
                  {step.illustration}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Forward arrow — visible on step 1 and 2 */}
        {current < steps.length - 1 && (
          <button
            onClick={goNext}
            className="
              absolute right-8 z-20
              w-14 h-14 rounded-full
              flex items-center justify-center
              border border-white/15 bg-white/5 backdrop-blur-xl
              text-white
              hover:bg-white/10 hover:border-pink-400/50
              hover:shadow-[0_0_20px_rgba(244,114,182,0.25)]
              transition-all duration-300
            "
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

    </section>
  );
}