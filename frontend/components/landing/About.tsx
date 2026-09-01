"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const stats = [
  { value: "98%", label: "Match Satisfaction", sub: "based on lifestyle compatibility" },
  { value: "3×", label: "Better Outcomes", sub: "vs traditional listings" },
  { value: "12+", label: "Compatibility Signals", sub: "analyzed per user pair" },
  { value: "< 5 min", label: "Profile Setup", sub: "to get your first matches" },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: "easeOut" },
  }),
};

export default function About() {
  const { isAuthenticated, profileComplete } = useAuth();
  
  const targetHref = isAuthenticated
    ? profileComplete
      ? "/dashboard"
      : "/onboarding"
    : "/register";

  return (
    <section
      id="about"
      className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden"
    >
      {/* Ambient background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[120px] bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">

        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <span className="uppercase tracking-[0.3em] text-xs font-semibold text-[#F8B4C8]">
            ABOUT
          </span>

          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight font-sans">
            About{" "}
            <span className="bg-clip-text text-transparent bg-[linear-gradient(90deg,#F28695_0%,#F2BFB4_50%,#F1CCA6_100%)]">
              RoomSync
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg leading-relaxed text-zinc-200 max-w-2xl mx-auto">
            RoomSync was built out of a simple frustration — finding a compatible roommate
            through random listings is broken. We set out to fix it using behavioral science
            and AI, so people can share spaces they actually enjoy living in.
          </p>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-16 sm:mb-20">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md p-5 sm:p-6 text-center hover:border-pink-500/30 hover:bg-white/20 transition-all duration-300"
            >
              <p className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-[linear-gradient(135deg,#F28695,#F2BFB4)]">
                {stat.value}
              </p>
              <p className="mt-1.5 text-[13px] sm:text-sm font-semibold text-white">{stat.label}</p>
              <p className="mt-1 text-[11px] sm:text-[12px] text-zinc-200 leading-snug">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Mission Statement ── */}
        <div className="mb-16 sm:mb-20">
          <div className="max-w-3xl">
            <span className="uppercase tracking-[0.25em] text-[11px] font-semibold text-pink-400">
              Our Mission
            </span>
            <h3 className="mt-3 text-2xl sm:text-3xl font-bold text-white leading-snug">
              Compatibility is a science,<br />
              <span className="text-zinc-200 font-normal">not a guess.</span>
            </h3>
            <p className="mt-5 text-[14px] sm:text-[15px] leading-7 text-zinc-400">
              Every recommended match on RoomSync is powered by a multi-signal compatibility engine
              that weighs sleep schedules, cleanliness standards, social boundaries, study habits,
              and personality dimensions — not just a location and a price range.
            </p>
            <p className="mt-4 text-[14px] sm:text-[15px] leading-7 text-zinc-200">
              We believe the best shared living experiences start long before move-in day. They
              start with the right introduction.
            </p>

            {/* Divider with quote */}
            <div className="mt-8 pl-5 border-l-2 border-pink-400/50">
              <p className="text-[14px] italic text-zinc-200 leading-6">
                "The average person spends 3–6 months in a bad living situation before finding
                the courage to move. We think that number should be zero."
              </p>
              <p className="mt-2 text-[12px] text-zinc-300 font-medium">— RoomSync Team</p>
            </div>
          </div>
        </div>

        {/* ── CTA Banner ── */}
        <div
          className="relative rounded-3xl overflow-hidden border border-white/10 p-8 sm:p-12 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(242,134,149,0.12) 0%, rgba(161,124,246,0.08) 50%, rgba(242,191,180,0.10) 100%)",
          }}
        >
          {/* Glow blob */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="w-80 h-40 rounded-full blur-[80px] opacity-20 bg-gradient-to-r from-pink-400 to-rose-300" />
          </div>

          <div className="relative">
            <p className="uppercase tracking-[0.3em] text-[11px] font-semibold text-pink-400 mb-3">
              Ready to find your match?
            </p>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Your ideal roommate is already on RoomSync.
            </h3>
            <p className="text-zinc-200 text-[14px] sm:text-[15px] leading-relaxed max-w-xl mx-auto mb-8">
              Build your compatibility profile in under 5 minutes and get matched with roommates
              who actually fit your lifestyle.
            </p>
            <Link
              href={targetHref}
              className="
                inline-flex items-center gap-2.5
                px-7 sm:px-9 py-3 sm:py-3.5
                rounded-full
                font-bold text-[14px] sm:text-[15px]
                text-[#161925]
                bg-[linear-gradient(135deg,#F28695,#F2BFB4)]
                shadow-[0_0_32px_rgba(242,134,149,0.4)]
                hover:shadow-[0_0_48px_rgba(242,134,149,0.6)]
                hover:scale-[1.03]
                active:scale-[0.98]
                transition-all duration-200
              "
            >
              Get Started Free
              <span aria-hidden className="text-lg">→</span>
            </Link>
          </div>
        </div>

        {/* ── Footer-style tiny note ── */}
        <p className="text-center text-[12px] text-zinc-300 mt-10">
          RoomSync is a people-first platform. No landlord listings. No spam. Just compatible people.
        </p>

      </div>
    </section>
  );
}
