"use client";

import { useState, useEffect, useCallback } from "react";
import { getRecommendations } from "@/services/matching";
import { tokenStorage } from "@/services/token";
import type { CandidateMatchItem } from "@/types/matching";

export type RecommendationsStatus =
  | "idle"
  | "loading"
  | "success"
  | "empty"
  | "unauthorized"
  | "error";

export interface UseRecommendationsResult {
  matches: CandidateMatchItem[];
  totalEvaluated: number;
  status: RecommendationsStatus;
  errorMessage: string | null;
  refetch: () => void;
}

/**
 * Hook that fetches real ML recommendations from the backend.
 *
 * - Uses the shared api client (Bearer token injected automatically).
 * - Handles loading / empty / 401 / network-error states.
 * - On 401, clears local tokens so the auth context re-evaluates.
 */
export function useRecommendations(topN: number = 10): UseRecommendationsResult {
  const [matches, setMatches] = useState<CandidateMatchItem[]>([]);
  const [totalEvaluated, setTotalEvaluated] = useState(0);
  const [status, setStatus] = useState<RecommendationsStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    // Only fetch if there is an access token
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setStatus("unauthorized");
      setErrorMessage("No access token found. Please log in.");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const data = await getRecommendations(topN);

      setMatches(data.matches);
      setTotalEvaluated(data.total_evaluated);

      if (data.matches.length === 0) {
        setStatus("empty");
      } else {
        setStatus("success");
      }
    } catch (err: unknown) {
      const errObj = err as { response?: { status?: number; data?: unknown } };
      const httpStatus = errObj?.response?.status;

      if (httpStatus === 401) {
        // Session expired — clear tokens so AuthContext redirects to login
        tokenStorage.clearTokens();
        setStatus("unauthorized");
        setErrorMessage("Your session has expired. Please log in again.");
      } else if (httpStatus !== undefined) {
        setStatus("error");
        setErrorMessage(
          `Server error (${httpStatus}). Please try again later.`
        );
      } else {
        setStatus("error");
        setErrorMessage(
          "Could not connect to the server. Check your connection."
        );
      }

      setMatches([]);
    }
  }, [topN]);

  useEffect(() => {
    void fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    matches,
    totalEvaluated,
    status,
    errorMessage,
    refetch: fetchRecommendations,
  };
}
