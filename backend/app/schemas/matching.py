"""
Pydantic schemas for ML matching and recommendation endpoints.
"""

from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class DirectPredictionRequest(BaseModel):
    """Payload containing raw attributes for two student profiles."""

    student_1: Dict[str, Any] = Field(..., description="Attributes or profile for student 1")
    student_2: Dict[str, Any] = Field(..., description="Attributes or profile for student 2")


class UserPairPredictionRequest(BaseModel):
    """Payload to evaluate compatibility between current user and a candidate user ID."""

    candidate_user_id: UUID = Field(..., description="UUID of prospective roommate candidate")


class MLProbabilities(BaseModel):
    High: float = Field(..., ge=0.0, le=1.0)
    Medium: float = Field(..., ge=0.0, le=1.0)
    Low: float = Field(..., ge=0.0, le=1.0)


class FeatureSignals(BaseModel):
    sleep_compatibility: float
    work_compatibility: float
    cleanliness_compatibility: float
    social_compatibility: float
    privacy_compatibility: float
    routine_compatibility: float
    behavioral_alignment_score: float


class RuleExplainability(BaseModel):
    rule_score: float = Field(..., description="Weighted rule-based percentage score (0-100)")
    feature_breakdown: Dict[str, float] = Field(
        default_factory=dict,
        description="Individual attribute similarity percentages"
    )


class PredictionResponse(BaseModel):
    prediction: str = Field(..., description="ML classification: High, Medium, or Low")
    compatibility_label: str = Field(..., description="Same as prediction")
    confidence: float = Field(..., description="Model probability for predicted class (0.0 - 1.0)")
    probabilities: Dict[str, float] = Field(..., description="Probability distribution across classes")
    feature_signals: Dict[str, float] = Field(..., description="Sub-dimensional compatibility percentages")
    defaulted_fields_s1: List[str] = Field(default_factory=list, description="Fields using statistical dataset defaults for student 1")
    defaulted_fields_s2: List[str] = Field(default_factory=list, description="Fields using statistical dataset defaults for student 2")


class CandidateMatchItem(BaseModel):
    candidate_id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    profile_photo_url: Optional[str] = None
    prediction: str
    confidence: float
    probabilities: Dict[str, float]
    feature_signals: Dict[str, float]
    rule_based_explainability: RuleExplainability
    logistics_score: float


class RecommendationResponse(BaseModel):
    matches: List[CandidateMatchItem]
    total_evaluated: int

class MatchBriefingResponse(BaseModel):
    headline: str = Field(..., description="Short, plain-language summary")
    what_they_value: str = Field(..., description="What they value in a roommate")
    living_style: str = Field(..., description="Description of living style")
    alignment_points: List[str] = Field(..., description="Points of alignment")
    differences_to_discuss: List[str] = Field(..., description="Differences to discuss")
    questions_to_ask: List[str] = Field(..., description="Questions to ask")
