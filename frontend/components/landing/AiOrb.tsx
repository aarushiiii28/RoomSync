"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function AiOrb() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const springX = useSpring(rawX, { stiffness: 60, damping: 20 });
  const springY = useSpring(rawY, { stiffness: 60, damping: 20 });

  const rotateX = useTransform(springY, [-1, 1], [10, -10]);
  const rotateY = useTransform(springX, [-1, 1], [-10, 10]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      rawX.set((e.clientX - cx) / (rect.width / 2));
      rawY.set((e.clientY - cy) / (rect.height / 2));
    };

    const handleLeave = () => {
      rawX.set(0);
      rawY.set(0);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, [rawX, rawY]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-[220px] h-[220px] pointer-events-none select-none"
    >
      {/* Outer ambient glow rings */}
      <div
        className="absolute inset-0 rounded-full animate-pulse pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255,182,193,0.35) 0%, rgba(255,105,180,0.15) 50%, transparent 75%)",
          filter: "blur(20px)",
        }}
      />
      <div
        className="absolute inset-[-20px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255,182,193,0.15) 0%, rgba(255,105,180,0.08) 50%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      {/* Orbit ring 1 with Blue/Cyan dot — CSS hardware accelerated */}
      <div className="absolute inset-[15px] rounded-full border border-pink-300/20 border-dashed animate-spin-slow pointer-events-none">
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-cyan-400"
          style={{
            boxShadow: "0 0 12px 3px rgba(6,182,212,0.85)",
          }}
        />
      </div>

      {/* Orbit ring 2 with Pink/Fuchsia dot — Counter rotating */}
      <div className="absolute inset-[2px] rounded-full border border-pink-200/15 animate-spin-reverse pointer-events-none">
        <div
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-fuchsia-400"
          style={{
            boxShadow: "0 0 10px 3px rgba(217,70,239,0.85)",
          }}
        />
      </div>

      {/* Core orb with 3D tilt */}
      <motion.div
        style={{ rotateX, rotateY, transformPerspective: 800 }}
        className="relative w-[115px] h-[115px] rounded-full pointer-events-none"
      >
        {/* Inner orb gradient */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle at 35% 35%, rgba(255,220,230,0.95) 0%, rgba(255,182,193,0.85) 35%, rgba(255,130,167,0.9) 65%, rgba(220,90,130,1) 100%)",
            boxShadow:
              "0 0 40px 12px rgba(255,182,193,0.5), 0 0 80px 24px rgba(255,105,180,0.25), inset 0 0 30px rgba(255,255,255,0.12)",
          }}
        />

        {/* Specular highlight */}
        <div
          className="absolute top-[15%] left-[18%] w-[35%] h-[25%] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)",
            filter: "blur(4px)",
          }}
        />

        {/* Pulsing inner glow */}
        <div
          className="absolute inset-[20px] rounded-full animate-pulse pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(255,200,210,0.4) 0%, transparent 70%)",
            filter: "blur(10px)",
          }}
        />
      </motion.div>

    </div>
  );
}
