"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function AiOrb() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const springX = useSpring(rawX, { stiffness: 60, damping: 20 });
  const springY = useSpring(rawY, { stiffness: 60, damping: 20 });

  const rotateX = useTransform(springY, [-1, 1], [12, -12]);
  const rotateY = useTransform(springX, [-1, 1], [-12, 12]);

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
    <div ref={containerRef} className="relative flex items-center justify-center w-[220px] h-[220px] scale-100">

      {/* Outer ambient glow rings */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "radial-gradient(circle, rgba(255,182,193,0.35) 0%, rgba(255,105,180,0.15) 50%, transparent 75%)",
          filter: "blur(20px)",
        }}
      />
      <motion.div
        className="absolute inset-[-20px] rounded-full"
        animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{
          background: "radial-gradient(circle, rgba(255,182,193,0.15) 0%, rgba(255,105,180,0.08) 50%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      {/* Rotating ring 1 */}
      <motion.div
        className="absolute inset-[20px] rounded-full border border-pink-300/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        style={{ borderStyle: "dashed" }}
      />

      {/* Rotating ring 2 */}
      <motion.div
        className="absolute inset-[8px] rounded-full border border-pink-200/15"
        animate={{ rotate: -360 }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      />

      {/* Orbit dot on ring 1 */}
      <motion.div
        className="absolute w-4 h-4 rounded-full bg-cyan-400"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        style={{
          top: "50%",
          left: "50%",
          marginTop: -8,
          marginLeft: -8,
          transformOrigin: "8px 120px",
          boxShadow: "0 0 12px 3px rgba(6,182,212,0.8)",
        }}
      />

      {/* Orbit dot on ring 2 */}
      <motion.div
        className="absolute w-3 h-3 rounded-full bg-fuchsia-400"
        animate={{ rotate: -360 }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        style={{
          top: "50%",
          left: "50%",
          marginTop: -6,
          marginLeft: -6,
          transformOrigin: "6px 104px",
          boxShadow: "0 0 10px 3px rgba(217,70,239,0.8)",
        }}
      />

      {/* Core orb with mouse parallax */}
      <motion.div
        style={{ rotateX, rotateY, transformPerspective: 800 }}
        className="relative w-[115px] h-[115px] rounded-full"
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
          className="absolute top-[15%] left-[18%] w-[35%] h-[25%] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)",
            filter: "blur(4px)",
          }}
        />

        {/* Pulsing inner glow */}
        <motion.div
          className="absolute inset-[20px] rounded-full"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "radial-gradient(circle, rgba(255,200,210,0.4) 0%, transparent 70%)",
            filter: "blur(10px)",
          }}
        />
      </motion.div>

    </div>
  );
}
