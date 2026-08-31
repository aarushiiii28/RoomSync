// ---------------------------------------------------------------------------
// Matching & Recommendations — TypeScript interfaces that exactly match
// the backend Pydantic schemas in backend/app/schemas/matching.py
// ---------------------------------------------------------------------------

/** Probability distribution across ML labels */
export interface MLProbabilities {
  High: number;
  Medium: number;
  Low: number;
}

/** Sub-dimensional compatibility signals (all 0-100 range from backend) */
export interface FeatureSignals {
  sleep_compatibility: number;
  work_compatibility: number;
  cleanliness_compatibility: number;
  social_compatibility: number;
  privacy_compatibility: number;
  routine_compatibility: number;
  behavioral_alignment_score: number;
}

/** Rule-based explainability breakdown */
export interface RuleExplainability {
  rule_score: number;
  feature_breakdown: Record<string, number>;
}

/** A single candidate returned by GET /matching/recommendations */
export interface CandidateMatchItem {
  candidate_id: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  gender: string | null;
  occupation: string | null;
  bio?: string | null;
  city: string | null;
  profile_photo_url: string | null;
  prediction: "High" | "Medium" | "Low";
  confidence: number; // 0.0 – 1.0
  probabilities: Record<string, number>;
  feature_signals: Record<string, number>;
  rule_based_explainability: RuleExplainability;
}

/** Top-level response from GET /matching/recommendations */
export interface RecommendationResponse {
  matches: CandidateMatchItem[];
  total_evaluated: number;
}

/** Structured LLM explanation returned by GET /matching/why-this-match/{candidate_id} */
export interface MatchBriefingResponse {
  headline: string;
  what_they_value: string;
  living_style: string;
  alignment_points: string[];
  differences_to_discuss: string[];
  questions_to_ask: string[];
}

