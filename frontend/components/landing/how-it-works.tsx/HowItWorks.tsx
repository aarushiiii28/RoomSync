"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { steps } from "./data";

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : direction < 0 ? -60 : 0,
    opacity: direction === 0 ? 1 : 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
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
    <section className="relative overflow-hidden flex flex-col">

      <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-14 sm:pt-24 pb-10 sm:pb-16 text-center flex-shrink-0">
        <div>
          <h2 className="mt-2 text-2xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
            Finding the perfect roommate<br />
            shouldn&apos;t feel like gambling.
          </h2>
          <p className="mt-4 sm:mt-6 max-w-2xl mx-auto text-sm sm:text-base md:text-lg leading-7 sm:leading-8 text-zinc-400">
            RoomSync understands how you actually live, then intelligently recommends
            roommates you&apos;ll genuinely enjoy sharing a space with.
          </p>
        </div>
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
      <div className="relative flex-1 flex items-center justify-center overflow-hidden px-10 sm:px-16 md:px-24 pb-14 sm:pb-24">

        {/* Back arrow — visible on step 2 and 3 */}
        {current > 0 && (
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous step"
            className="
              absolute left-1 sm:left-8 z-30
              w-10 h-10 sm:w-14 sm:h-14 rounded-full
              flex items-center justify-center
              text-white cursor-pointer
              opacity-60 hover:opacity-100
              active:scale-90
              transition-all duration-200
            "
          >
            <ChevronLeft size={18} className="sm:hidden" />
            <ChevronLeft size={24} className="hidden sm:block" />
          </button>
        )}

        {/* Slide panel */}
        <div className="w-full max-w-4xl overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = offset.x;
                if (swipe < -40) {
                  goNext();
                } else if (swipe > 40) {
                  goPrev();
                }
              }}
              className="flex flex-col md:flex-row md:items-center gap-4 sm:gap-6 md:gap-16 cursor-grab active:cursor-grabbing"
            >
              {/* Text side on desktop / Top + Description on mobile */}
              <div className="flex-1 min-w-0">
                {/* Mobile top row: Badge + Title on left, Illustration on right */}
                <div className="flex flex-row items-center justify-between gap-3 md:block">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-6">
                      <span
                        className="
                          w-7 h-7 sm:w-10 sm:h-10 rounded-full flex-shrink-0
                          flex items-center justify-center
                          text-xs sm:text-sm font-bold text-white
                          bg-gradient-to-br from-pink-400 to-rose-400
                          shadow-[0_0_20px_rgba(244,114,182,0.45)]
                        "
                      >
                        {step.id}
                      </span>
                      <span className="text-[11px] sm:text-xs font-semibold tracking-[0.3em] uppercase text-pink-400">
                        Step {step.id}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-3xl md:text-4xl font-bold text-white leading-snug sm:leading-tight">
                      {step.title}
                    </h3>
                  </div>

                  {/* Illustration on mobile next to title */}
                  {step.illustration && (
                    <div className="w-[100px] sm:w-[130px] flex-shrink-0 md:hidden flex items-center justify-center">
                      {step.illustration}
                    </div>
                  )}
                </div>

                {/* Description text — uses full width across the whole line below the images on mobile */}
                <p className="mt-3 sm:mt-6 text-[13.5px] sm:text-base md:text-lg text-zinc-300 md:text-zinc-400 leading-relaxed sm:leading-7 md:leading-8 w-full md:max-w-md">
                  {step.description}
                </p>
              </div>

              {/* Illustration side on Desktop (md+) */}
              {step.illustration && (
                <div className="hidden md:flex w-[240px] md:w-[340px] flex-shrink-0 items-center justify-center">
                  {step.illustration}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Forward arrow — visible on step 1 and 2 */}
        {current < steps.length - 1 && (
          <button
            type="button"
            onClick={goNext}
            aria-label="Next step"
            className="
              absolute right-1 sm:right-8 z-30
              w-10 h-10 sm:w-14 sm:h-14 rounded-full
              flex items-center justify-center
              text-white cursor-pointer
              opacity-60 hover:opacity-100
              active:scale-90
              transition-all duration-200
            "
          >
            <ChevronRight size={18} className="sm:hidden" />
            <ChevronRight size={24} className="hidden sm:block" />
          </button>
        )}
      </div>

    </section>
  );
}