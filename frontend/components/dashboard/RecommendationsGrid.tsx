"use client";

import { motion } from "framer-motion";
import { Loader2, Users, AlertCircle, WifiOff, RefreshCw } from "lucide-react";
import { useRecommendations } from "@/hooks/useRecommendations";
import MatchCard from "./MatchCard";

// ── Loading skeleton ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden p-5 animate-pulse"
      style={{
        background: "rgba(22,25,37,0.9)",
        border: "1px solid rgba(248,180,200,0.10)",
      }}
    >
      {/* header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-white/5 flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 rounded bg-white/8 w-3/4" />
          <div className="h-2.5 rounded bg-white/5 w-1/2" />
        </div>
        <div className="w-16 h-6 rounded-full bg-white/5" />
      </div>
      {/* score block */}
      <div className="h-[68px] rounded-xl bg-white/4 mb-4" />
      <div className="h-[1px] bg-white/6 mb-4" />
      {/* bars */}
      {[...Array(7)].map((_, i) => (
        <div key={i} className="mb-2.5 space-y-1">
          <div className="flex justify-between">
            <div className="h-2 rounded bg-white/8 w-20" />
            <div className="h-2 rounded bg-white/8 w-8" />
          </div>
          <div className="h-1 rounded-full bg-white/5" />
        </div>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="col-span-full flex flex-col items-center justify-center py-16 px-8 text-center rounded-2xl"
      style={{
        background: "rgba(22,25,37,0.9)",
        border: "1px solid rgba(248,180,200,0.12)",
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: "rgba(248,180,200,0.08)",
          border: "1px solid rgba(248,180,200,0.25)",
        }}
      >
        <Users className="w-6 h-6" style={{ color: "#F8B4C8" }} />
      </div>
      <h3 className="text-[18px] font-bold mb-4 text-white">
        No Matches Yet
      </h3>
      <p className="text-[13px] text-zinc-400 max-w-xs leading-relaxed mb-5">
        We couldn't find compatible roommates yet. Try refreshing or updating your profile.
      </p>
      <button
        id="empty-refresh-btn"
        onClick={onRefresh}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:bg-white/5"
        style={{
          border: "1px solid rgba(248,180,200,0.3)",
          color: "#F8B4C8",
        }}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Refresh
      </button>
    </motion.div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────
function ErrorState({
  message,
  isUnauthorized,
  onRefresh,
}: {
  message: string | null;
  isUnauthorized: boolean;
  onRefresh: () => void;
}) {
  const Icon = isUnauthorized ? AlertCircle : WifiOff;
  const title = isUnauthorized ? "Session Expired" : "Connection Error";
  const hint = isUnauthorized
    ? "Please log in again to see your recommendations."
    : message ?? "An unexpected error occurred.";

  const accentColor = isUnauthorized ? "#f87171" : "#fbbf24";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="col-span-full flex flex-col items-center justify-center py-16 px-8 text-center rounded-2xl"
      style={{
        background: "rgba(22,25,37,0.9)",
        border: `1px solid ${accentColor}25`,
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: `${accentColor}12`,
          border: `1.5px solid ${accentColor}40`,
        }}
      >
        <Icon className="w-6 h-6" style={{ color: accentColor }} />
      </div>
      <h3
        className="text-[18px] font-bold mb-1"
        style={{ color: accentColor }}
      >
        {title}
      </h3>
      <p className="text-[13px] text-zinc-400 max-w-xs leading-relaxed mb-5">
        {hint}
      </p>
      {!isUnauthorized && (
        <button
          id="error-refresh-btn"
          onClick={onRefresh}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:bg-white/5"
          style={{
            border: `1px solid ${accentColor}40`,
            color: accentColor,
          }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      )}
    </motion.div>
  );
}

// ── Main grid ─────────────────────────────────────────────────────────────────
interface RecommendationsGridProps {
  topN?: number;
}

export default function RecommendationsGrid({
  topN = 10,
}: RecommendationsGridProps) {
  const { matches, totalEvaluated, status, errorMessage, refetch } =
    useRecommendations(topN);

  return (
    <section>
      {/* ── Section header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-white">
            Your Matches
          </h2>
          {status === "success" && (
            <p className="text-[13px] font-medium mt-0.5 text-zinc-400">
              {matches.length} match{matches.length !== 1 ? "es" : ""} from{" "}
              {totalEvaluated} evaluated
            </p>
          )}
        </div>

        {status === "success" && (
          <button
            id="recommendations-refresh-btn"
            onClick={refetch}
            title="Refresh recommendations"
            className="p-2.5 rounded-xl hover:bg-white/8 text-zinc-400 hover:text-white transition-all flex items-center justify-center"
            style={{
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Grid body ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Loading */}
        {status === "loading" && (
          <>
            {[...Array(Math.min(topN, 6))].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </>
        )}

        {/* Idle */}
        {status === "idle" && (
          <div className="col-span-full flex items-center justify-center py-20">
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: "#F8B4C8" }}
            />
          </div>
        )}

        {/* Success */}
        {status === "success" &&
          matches.map((candidate, i) => (
            <MatchCard key={candidate.candidate_id} candidate={candidate} index={i} />
          ))}

        {/* Empty */}
        {status === "empty" && <EmptyState onRefresh={refetch} />}

        {/* Unauthorized */}
        {status === "unauthorized" && (
          <ErrorState
            message={errorMessage}
            isUnauthorized={true}
            onRefresh={refetch}
          />
        )}

        {/* Generic error */}
        {status === "error" && (
          <ErrorState
            message={errorMessage}
            isUnauthorized={false}
            onRefresh={refetch}
          />
        )}
      </div>
    </section>
  );
}
