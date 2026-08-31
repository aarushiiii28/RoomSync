"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Briefcase,
  User as UserIcon,
  Calendar,
  AlertCircle,
  X,
  RotateCw,
  CheckCircle2,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

import DashboardGuard from "@/components/dashboard/DashboardGuard";
import Navbar from "@/components/layout/Navbar";
import { getRecommendations, getWhyThisMatch } from "@/services/matching";
import { PREDICTION_CONFIG } from "@/components/dashboard/MatchCard";
import type { CandidateMatchItem, MatchBriefingResponse } from "@/types/matching";
import { createOrOpenConversation } from "@/services/chat";

const SIGNAL_LABELS: Record<string, string> = {
  sleep_compatibility: "Sleep Compatibility",
  work_compatibility: "Work & Study Habits",
  cleanliness_compatibility: "Cleanliness & Organization",
  social_compatibility: "Social & Guest Dynamics",
  privacy_compatibility: "Privacy Preferences",
  routine_compatibility: "Daily Routine Harmony",
  behavioral_alignment_score: "Behavioral & Chemistry Alignment",
};

// All bars use the cohesive pink brand color
const PINK_BAR_COLOR = "#D97870";

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params?.id as string;

  const [candidate, setCandidate] = useState<CandidateMatchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // "Why This Match" state — component-local, strictly per-viewer
  const [briefing, setBriefing] = useState<MatchBriefingResponse | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingError, setBriefingError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  // AbortController ref to cancel in-flight briefing requests on navigation
  const briefingAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // 1. Abort any in-flight briefing request from previous candidate
    if (briefingAbortRef.current) {
      briefingAbortRef.current.abort();
      briefingAbortRef.current = null;
    }

    // 2. Reset all briefing states on candidate navigation
    setBriefing(null);
    setShowBriefing(false);
    setBriefingLoading(false);
    setBriefingError(null);
    setIsForbidden(false);

    async function loadMatch() {
      if (!candidateId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getRecommendations(50);
        const match = data.matches.find((m) => m.candidate_id === candidateId);
        if (match) {
          setCandidate(match);
        } else {
          setError("Candidate match not found.");
        }
      } catch (err) {
        console.error("Error loading candidate details:", err);
        setError("Failed to load match profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadMatch();

    return () => {
      if (briefingAbortRef.current) {
        briefingAbortRef.current.abort();
        briefingAbortRef.current = null;
      }
    };
  }, [candidateId]);

  const handleFetchBriefing = async () => {
    if (!candidateId || briefingLoading) return;

    // Cancel any existing request
    if (briefingAbortRef.current) {
      briefingAbortRef.current.abort();
    }

    const controller = new AbortController();
    briefingAbortRef.current = controller;
    const targetCandidateId = candidateId;

    setShowBriefing(true);
    setBriefingLoading(true);
    setBriefingError(null);
    setIsForbidden(false);

    try {
      const data = await getWhyThisMatch(targetCandidateId, controller.signal);

      // Race guard: only set briefing if user is still on this candidate and not aborted
      if (targetCandidateId === candidateId && !controller.signal.aborted) {
        setBriefing(data);
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) return; // Discard canceled requests

      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 403) {
        setIsForbidden(true);
        setBriefingError("This match briefing is no longer available.");
      } else {
        setIsForbidden(false);
        setBriefingError("Unable to load match briefing. Please check your connection.");
      }
    } finally {
      if (targetCandidateId === candidateId && !controller.signal.aborted) {
        setBriefingLoading(false);
      }
    }
  };

  const handleStartChat = async () => {
    if (!candidateId || startingChat) return;
    setStartingChat(true);
    try {
      const conv = await createOrOpenConversation(candidateId);
      router.push(`/dashboard/chat/${conv.id}`);
    } catch (err: any) {
      console.error("Failed to start chat:", err);
      if (err.response?.status === 403) {
        alert("You are no longer authorized to match with this candidate.");
      } else {
        alert("Unable to start conversation. Please try again.");
      }
    } finally {
      setStartingChat(false);
    }
  };

  const handleToggleBriefing = () => {
    if (showBriefing) {
      setShowBriefing(false);
    } else {
      setShowBriefing(true);
      if (!briefing && !briefingLoading) {
        handleFetchBriefing();
      }
    }
  };

  const pred = candidate?.prediction as "High" | "Medium" | "Low";
  const cfg = candidate ? PREDICTION_CONFIG[pred] ?? PREDICTION_CONFIG.Medium : PREDICTION_CONFIG.Medium;

  const displayName = candidate
    ? [candidate.first_name, candidate.last_name].filter(Boolean).join(" ") || "Roommate Match"
    : "Roommate Match";

  const signalKeys = [
    "sleep_compatibility",
    "work_compatibility",
    "cleanliness_compatibility",
    "social_compatibility",
    "privacy_compatibility",
    "routine_compatibility",
    "behavioral_alignment_score",
  ];

  return (
    <DashboardGuard>
      <div className="min-h-screen flex flex-col bg-transparent">
        <Navbar />

        <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-12 pb-16">
          {/* Loading State */}
          {loading && (
            <div
              className="rounded-2xl p-16 flex flex-col items-center justify-center gap-3 shadow-2xl"
              style={{ background: "#F8ECE8" }}
            >
              <Loader2 className="w-9 h-9 animate-spin" style={{ color: "#D97870" }} />
              <p className="text-[14px] font-medium" style={{ color: "#494F66" }}>
                Loading match profile details...
              </p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div
              className="rounded-2xl p-12 text-center shadow-2xl"
              style={{ background: "#F8ECE8" }}
            >
              <div
                className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
                style={{ background: "#F6D7CF", border: "1.5px solid #E5ADA2" }}
              >
                <AlertCircle className="w-7 h-7" style={{ color: "#D97870" }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "#2D3246" }}>
                {error}
              </h2>
              <p className="text-[13px] mb-6" style={{ color: "#494F66" }}>
                We couldn't retrieve the details for this match.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all"
                style={{
                  background: "#F6D7CF",
                  border: "1.5px solid #E5ADA2",
                  color: "#D97870",
                }}
              >
                Return to Matches
              </Link>
            </div>
          )}

          {/* Candidate Profile Loaded */}
          {!loading && candidate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: "#F8ECE8" }}
            >
              {/* ── Top Header Banner ── */}
              <div
                className="p-5 sm:p-7 md:p-10 flex flex-row items-start gap-2 sm:gap-3 relative"
                style={{ background: "#494F66" }}
              >
                {/* Back Arrow — vertically centered with the photo */}
                <Link
                  href="/dashboard"
                  className="text-white/80 hover:text-white transition-all -ml-1 p-1.5 mt-1 flex items-center justify-center cursor-pointer group shrink-0"
                  title="Back to Matches"
                >
                  <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </Link>

                {/* Right column: [photo + name] then [details] — all left-aligned */}
                <div className="flex flex-col gap-3 min-w-0 flex-1">

                  {/* Row 1: Photo + Name */}
                  <div className="flex flex-row items-center gap-3 sm:gap-4 min-w-0">
                    {/* Circular Profile Picture */}
                    <div
                      className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center shadow-lg"
                      style={{
                        border: "3px solid #EBD6CF",
                        background: "#F6D7CF",
                      }}
                    >
                      {candidate.profile_photo_url ? (
                        <Image
                          src={candidate.profile_photo_url}
                          alt={displayName}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <span className="text-xl sm:text-2xl font-bold font-sans" style={{ color: "#494F66" }}>
                          {(candidate.first_name?.[0] ?? "?").toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Name — same row as photo */}
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-sans text-white tracking-tight min-w-0 flex-1">
                      {displayName}
                    </h1>
                  </div>

                  {/* Row 2: Details — left edge aligned with photo */}
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[12.5px] sm:text-[13px] font-medium text-[#A6ACBE]">
                        {candidate.age && (
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-[#F6D7CF]" />
                            <span>{candidate.age} yrs</span>
                          </span>
                        )}
                        {candidate.city && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-[#F6D7CF]" />
                            <span>{candidate.city}</span>
                          </span>
                        )}
                        {candidate.gender && (
                          <span className="flex items-center gap-1.5 capitalize">
                            <UserIcon size={13} className="text-[#F6D7CF]" />
                            <span>{candidate.gender}</span>
                          </span>
                        )}
                        {candidate.occupation && (
                          <span className="flex items-center gap-1.5">
                            <Briefcase size={13} className="text-[#F6D7CF]" />
                            <span>{candidate.occupation}</span>
                          </span>
                        )}
                      </div>

                      {candidate.bio && candidate.bio.trim().length > 0 && (
                        <p className="mt-2.5 text-[13px] sm:text-[14px] text-[#F8ECE8]/90 font-normal leading-relaxed max-w-2xl">
                          {candidate.bio}
                        </p>
                      )}
                    </div>

                    {/* Prediction Badge */}
                    <div className="flex items-center shrink-0">
                      <div
                        className="w-20 h-7 py-0.5 flex items-center justify-center gap-1.5 rounded-full text-[11px] font-bold shadow-xs"
                        style={{
                          background: cfg.bg,
                          border: `1.5px solid ${cfg.border}`,
                          color: cfg.text,
                        }}
                      >
                        <motion.div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1.8, repeat: Infinity }}
                          style={{ background: cfg.dot }}
                        />
                        <span>{pred}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* ── Main Breakdown Content ── */}
              <div className="p-4 sm:p-7 lg:p-11 space-y-6">
                {/* Compatibility Score & Why This Match Action Button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col items-start gap-0.5">
                    <p
                      className="text-[12px] font-bold uppercase tracking-[0.2em]"
                      style={{ color: "#8b92a5" }}
                    >
                      Compatibility
                    </p>
                    <p
                      className="text-3xl sm:text-4xl md:text-5xl font-bold font-sans tracking-tight"
                      style={{ color: "#2D3246" }}
                    >
                      {Math.round(candidate.rule_based_explainability.rule_score)}
                      <span
                        className="text-xl sm:text-2xl font-semibold ml-1"
                        style={{ color: "#8b92a5" }}
                      >
                        %
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                    <button
                      onClick={handleStartChat}
                      disabled={startingChat}
                      className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 active:scale-[0.98] disabled:opacity-70"
                      style={{
                        background: "rgba(217,120,112,0.15)",
                        color: "#D97870",
                        border: "1px solid rgba(217,120,112,0.3)",
                      }}
                    >
                      {startingChat ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <MessageSquare size={16} />
                      )}
                      Message
                    </button>

                    <button
                      onClick={handleToggleBriefing}
                      className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-xs hover:opacity-95 active:scale-[0.98] cursor-pointer text-center whitespace-nowrap"
                      style={{
                        background: "linear-gradient(135deg, #494F66 0%, #3B4054 100%)",
                        color: "#ffffff",
                        border: "1px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      Why This Match?
                    </button>
                  </div>
                </div>

                {/* ── Why This Match Section (Opens directly below Score & Button) ── */}
                <AnimatePresence>
                  {showBriefing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -8 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 overflow-hidden"
                    >
                      {/* Loading State */}
                      {briefingLoading && (
                        <div className="p-8 rounded-2xl bg-white border border-[#EBD6CF] shadow-xs flex flex-col items-center justify-center gap-3 relative">
                          <button
                            onClick={() => setShowBriefing(false)}
                            className="absolute top-4 right-4 text-[#8b92a5] hover:text-[#2D3246] hover:bg-[#F8ECE8] p-1.5 rounded-lg transition-all cursor-pointer"
                            title="Close"
                          >
                            <X size={18} />
                          </button>
                          <Loader2 className="w-7 h-7 animate-spin text-[#D97870]" />
                          <p className="text-[13.5px] font-medium text-[#494F66]">
                            Generating your private match briefing...
                          </p>
                        </div>
                      )}

                      {/* 403 Forbidden State */}
                      {!briefingLoading && isForbidden && (
                        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#EBD6CF] shadow-xs flex items-center justify-between">
                          <div className="flex items-center gap-2.5 text-[14px] text-[#D97870] font-medium">
                            <AlertCircle size={18} className="shrink-0" />
                            <span>This match briefing is no longer available.</span>
                          </div>
                          <button
                            onClick={() => setShowBriefing(false)}
                            className="text-[#8b92a5] hover:text-[#2D3246] hover:bg-[#F8ECE8] p-1.5 rounded-lg transition-all cursor-pointer"
                            title="Close"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      )}

                      {/* Error / Fallback State — Image 2 Design */}
                      {!briefingLoading && !isForbidden && (briefingError || (briefing && (briefing.headline === "We don't have enough information to explain this match yet." || briefing.headline.includes("not enough information")))) && (
                        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#EBD6CF] shadow-xs space-y-4">
                          <div className="flex items-center justify-between">
                            <h2 className="font-sans text-xl font-bold text-[#2D3246]">
                              Oops! Something went wrong
                            </h2>
                            <button
                              onClick={() => setShowBriefing(false)}
                              className="text-[#8b92a5] hover:text-[#2D3246] hover:bg-[#F8ECE8] p-1.5 rounded-lg transition-all cursor-pointer"
                              title="Close"
                            >
                              <X size={20} />
                            </button>
                          </div>

                          <p className="text-[14px] text-[#494F66] leading-relaxed">
                            We couldn&apos;t generate the match insights right now. This is likely a temporary issue.
                          </p>

                          <p className="text-[14px] font-semibold text-[#2D3246]">
                            Please try again in a moment.
                          </p>

                          <div className="pt-1">
                            <button
                              onClick={handleFetchBriefing}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all shadow-xs hover:opacity-90 active:scale-[0.98] cursor-pointer"
                              style={{
                                background: "linear-gradient(135deg, #494F66 0%, #3B4054 100%)",
                                color: "#ffffff",
                                border: "1px solid rgba(255,255,255,0.15)",
                              }}
                            >
                              <RotateCw size={14} />
                              <span>Try Again</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Genuine Success State */}
                      {!briefingLoading && briefing && briefing.headline !== "We don't have enough information to explain this match yet." && !briefing.headline.includes("not enough information") && (
                        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#EBD6CF] shadow-xs space-y-6">
                          {/* Header & Headline with Close Button */}
                          <div className="border-b pb-4 space-y-1.5" style={{ borderColor: "#EBD6CF" }}>
                            <div className="flex items-center justify-between">
                              <h2 className="font-sans text-xl font-bold text-[#2D3246]">
                                Why This Match?
                              </h2>
                              <button
                                onClick={() => setShowBriefing(false)}
                                className="text-[#8b92a5] hover:text-[#2D3246] hover:bg-[#F8ECE8] p-1.5 rounded-lg transition-all cursor-pointer"
                                title="Close"
                              >
                                <X size={20} />
                              </button>
                            </div>
                            <p className="text-[14.5px] font-medium text-[#494F66] leading-relaxed">
                              {briefing.headline}
                            </p>
                          </div>

                          {/* Values & Living Style */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-[#F8ECE8]/60 border border-[#EBD6CF] space-y-1.5">
                              <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#686E85]">
                                What They Value
                              </h3>
                              <p className="text-[13.5px] text-[#494F66] leading-relaxed">
                                {briefing.what_they_value}
                              </p>
                            </div>
                            <div className="p-4 rounded-xl bg-[#F8ECE8]/60 border border-[#EBD6CF] space-y-1.5">
                              <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#686E85]">
                                Living Style & Routine
                              </h3>
                              <p className="text-[13.5px] text-[#494F66] leading-relaxed">
                                {briefing.living_style}
                              </p>
                            </div>
                          </div>

                          {/* Alignment, Discussion Points, and Conversation Starters */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
                            {/* Alignment Points */}
                            <div className="p-4 rounded-xl bg-[#F4F9F4] border border-[#C8E6C9] space-y-2.5">
                              <div className="flex items-center gap-1.5 text-[#2E7D32]">
                                <CheckCircle2 size={16} />
                                <h4 className="text-[12.5px] font-bold uppercase tracking-wide">
                                  Key Alignments
                                </h4>
                              </div>
                              <ul className="space-y-1.5 text-[13px] text-[#2E7D32]/90">
                                {briefing.alignment_points.map((pt, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-[#2E7D32] font-bold">•</span>
                                    <span>{pt}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Differences to Discuss */}
                            <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#E8DCC4] space-y-2.5">
                              <div className="flex items-center gap-1.5 text-[#8D6E63]">
                                <MessageSquare size={16} />
                                <h4 className="text-[12.5px] font-bold uppercase tracking-wide">
                                  Points to Discuss
                                </h4>
                              </div>
                              <ul className="space-y-1.5 text-[13px] text-[#6D4C41]">
                                {briefing.differences_to_discuss.map((diff, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-[#8D6E63] font-bold">•</span>
                                    <span>{diff}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Questions to Ask */}
                            <div className="p-4 rounded-xl bg-[#F8ECE8] border border-[#EBD6CF] space-y-2.5">
                              <div className="flex items-center gap-1.5 text-[#D97870]">
                                <HelpCircle size={16} />
                                <h4 className="text-[12.5px] font-bold uppercase tracking-wide">
                                  Conversation Starters
                                </h4>
                              </div>
                              <ul className="space-y-1.5 text-[13px] text-[#494F66]">
                                {briefing.questions_to_ask.map((q, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-[#D97870] font-bold">•</span>
                                    <span>{q}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Sub-dimensional Compatibility Signals */}
                <div
                  className="p-6 sm:p-8 rounded-2xl shadow-sm space-y-5"
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid #EBD6CF",
                  }}
                >
                  <div className="border-b pb-3" style={{ borderColor: "#EBD6CF" }}>
                    <h2 className="font-sans text-xl font-bold" style={{ color: "#2D3246" }}>
                      Compatibility Signals Breakdown
                    </h2>
                  </div>

                  <div className="space-y-4 pt-1">
                    {signalKeys.map((key, i) => {
                      const val = candidate.feature_signals[key];
                      if (val === undefined) return null;
                      const pct = Math.round(val);

                      return (
                        <div key={key} className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[13px] font-semibold" style={{ color: "#2D3246" }}>
                              {SIGNAL_LABELS[key] ?? key}
                            </span>
                            <span
                              className="text-[13px] font-bold tabular-nums"
                              style={{ color: PINK_BAR_COLOR }}
                            >
                              {pct}%
                            </span>
                          </div>
                          <div
                            className="h-2 rounded-full overflow-hidden"
                            style={{ background: "rgba(73,79,102,0.08)" }}
                          >
                            <motion.div
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: 0.05 * i, ease: "easeOut" }}
                              style={{
                                background: `linear-gradient(90deg, #F6D7CF, ${PINK_BAR_COLOR})`,
                                boxShadow: `0 0 6px ${PINK_BAR_COLOR}40`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </DashboardGuard>
  );
}
