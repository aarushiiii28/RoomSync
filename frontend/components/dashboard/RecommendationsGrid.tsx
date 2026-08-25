"use client";

import { motion } from "framer-motion";
import { Loader2, Users, AlertCircle, WifiOff, RefreshCw } from "lucide-react";
import { useRecommendations } from "@/hooks/useRecommendations";
import MatchCard from "./MatchCard";

// ── Loading skeleton for vertical list items ──────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="rounded-xl overflow-hidden p-4 sm:p-5 animate-pulse flex items-center justify-between gap-4"
      style={{
        background: "#ffffff",
        border: "1.5px solid #EBD6CF",
      }}
    >
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <div
          className="w-12 h-12 rounded-xl flex-shrink-0"
          style={{ background: "#F6D7CF" }}
        />
        <div className="flex-1 space-y-2">
          <div
            className="h-4 rounded"
            style={{ background: "#EBD6CF", width: "40%" }}
          />
          <div
            className="h-3 rounded"
            style={{ background: "#F6D7CF", width: "25%" }}
          />
        </div>
      </div>
      <div
        className="w-16 h-7 rounded-full flex-shrink-0"
        style={{ background: "#F6D7CF" }}
      />
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
      className="flex flex-col items-center justify-center py-16 px-8 text-center rounded-xl"
      style={{
        background: "#ffffff",
        border: "1.5px solid #EBD6CF",
        boxShadow: "0 4px 24px rgba(73,79,102,0.08)",
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "#F6D7CF", border: "1.5px solid #E5ADA2" }}
      >
        <Users className="w-6 h-6" style={{ color: "#D97870" }} />
      </div>
      <h3 className="text-[18px] font-bold mb-2" style={{ color: "#2D3246" }}>
        No Matches Yet
      </h3>
      <p
        className="text-[13px] max-w-xs leading-relaxed mb-5"
        style={{ color: "#494F66" }}
      >
        We couldn't find compatible roommates yet. Try refreshing or updating
        your profile.
      </p>
      <button
        id="empty-refresh-btn"
        onClick={onRefresh}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer hover:opacity-90 active:scale-95"
        style={{
          background: "#F6D7CF",
          border: "1.5px solid #E5ADA2",
          color: "#D97870",
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center rounded-xl"
      style={{
        background: "#ffffff",
        border: "1.5px solid #EBD6CF",
        boxShadow: "0 4px 24px rgba(73,79,102,0.08)",
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: isUnauthorized
            ? "rgba(220,38,38,0.08)"
            : "rgba(217,119,6,0.08)",
          border: `1.5px solid ${isUnauthorized ? "#fca5a5" : "#fcd34d"}`,
        }}
      >
        <Icon
          className="w-6 h-6"
          style={{ color: isUnauthorized ? "#dc2626" : "#d97706" }}
        />
      </div>
      <h3
        className="text-[18px] font-bold mb-1"
        style={{ color: isUnauthorized ? "#dc2626" : "#d97706" }}
      >
        {title}
      </h3>
      <p
        className="text-[13px] max-w-xs leading-relaxed mb-5"
        style={{ color: "#494F66" }}
      >
        {hint}
      </p>
      {!isUnauthorized && (
        <button
          id="error-refresh-btn"
          onClick={onRefresh}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer hover:opacity-90 active:scale-95"
          style={{
            background: "#F6D7CF",
            border: "1.5px solid #E5ADA2",
            color: "#D97870",
          }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      )}
    </motion.div>
  );
}

// ── Main vertical list ────────────────────────────────────────────────────────
interface RecommendationsGridProps {
  topN?: number;
}

export default function RecommendationsGrid({
  topN = 10,
}: RecommendationsGridProps) {
  const { matches, status, errorMessage, refetch } = useRecommendations(topN);

  return (
    <section>
      {/* ── Section header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="font-serif text-[22px] font-normal tracking-tight"
            style={{ color: "#2D3246" }}
          >
            Your Matches
          </h2>
        </div>

        {status === "success" && (
          <button
            id="recommendations-refresh-btn"
            onClick={refetch}
            title="Refresh recommendations"
            className="p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer hover:opacity-90 active:scale-95"
            style={{
              border: "1.5px solid #EBD6CF",
              background: "#F6D7CF",
              color: "#D97870",
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Vertical List body ── */}
      <div className="flex flex-col gap-3.5">
        {status === "loading" && (
          <>
            {[...Array(Math.min(topN, 4))].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </>
        )}

        {status === "idle" && (
          <div className="flex items-center justify-center py-20">
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: "#D97870" }}
            />
          </div>
        )}

        {status === "success" &&
          matches.map((candidate, i) => (
            <MatchCard
              key={candidate.candidate_id}
              candidate={candidate}
              index={i}
            />
          ))}

        {status === "empty" && <EmptyState onRefresh={refetch} />}

        {status === "unauthorized" && (
          <ErrorState
            message={errorMessage}
            isUnauthorized={true}
            onRefresh={refetch}
          />
        )}

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
