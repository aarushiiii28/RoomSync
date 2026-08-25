/**
 * Matching & Recommendations service.
 *
 * Calls GET /matching/recommendations using the shared `api` Axios instance,
 * which automatically attaches "Authorization: Bearer <token>" via the
 * request interceptor defined in services/api.ts.
 *
 * DO NOT duplicate token logic here — the interceptor handles it.
 */

import api from "./api";
import type { RecommendationResponse } from "@/types/matching";

/**
 * Fetch ranked roommate recommendations for the currently-authenticated user.
 *
 * @param topN   Maximum number of candidates to return (default 10, max 50).
 * @param minLabel Optional minimum label filter: "High" | "Medium" | "Low"
 */
export async function getRecommendations(
  topN: number = 10,
  minLabel?: "High" | "Medium" | "Low"
): Promise<RecommendationResponse> {
  const params: Record<string, string | number> = { top_n: topN };
  if (minLabel) {
    params.min_label = minLabel;
  }

  const response = await api.get<RecommendationResponse>(
    "/matching/recommendations",
    { params }
  );

  return response.data;
}
