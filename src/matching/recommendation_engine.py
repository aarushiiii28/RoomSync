"""
RoomSync Recommendation Engine.

Ranks prospective roommate candidates for a target student.
Maintains clear, explicit separation between:
  1. ML Prediction: Discrete classification ('High', 'Medium', 'Low') with confidence and class probabilities.
  2. Feature Signals: Sub-dimensional compatibility percentages computed from engineered features.
  3. Rule-Based Explainability: Weighted rule-based breakdown for transparent reasoning.
"""

from typing import Any, Dict, List, Optional
from src.matching.prediction_pipeline import get_predictor
from src.matching.compatibility_engine import calculate_compatibility


def rank_roommate_candidates(
    target_student: Dict[str, Any],
    candidate_students: List[Dict[str, Any]],
    top_n: Optional[int] = None,
    min_label: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Rank a list of prospective roommate candidates for a target student.

    Parameters:
    -----------
    target_student : dict
        Profile of the search user.
    candidate_students : list of dicts
        List of candidate student profiles.
    top_n : int, optional
        Maximum number of ranked results to return.
    min_label : str, optional
        Filter out candidates below this label (e.g. only 'High' or 'Medium').

    Returns:
    --------
    list of dicts, sorted by compatibility in descending order.
    """
    predictor = get_predictor()
    ranked_results = []

    label_priority = {"High": 3, "Medium": 2, "Low": 1}

    for candidate in candidate_students:
        # 1. ML Classification Prediction (XGBoost)
        ml_result = predictor.predict(target_student, candidate)

        # 2. Rule-Based Scoring for Explainability Breakdown
        rule_result = calculate_compatibility(target_student, candidate)

        label = ml_result["compatibility_label"]

        if min_label and label_priority.get(label, 0) < label_priority.get(min_label, 0):
            continue

        result_item = {
            "candidate_id": candidate.get("student_id", candidate.get("id")),
            "candidate": candidate,
            "prediction": label,
            "compatibility_label": label,
            "confidence": ml_result["confidence"],
            "probabilities": ml_result["probabilities"],
            "feature_signals": ml_result["feature_signals"],
            "rule_based_explainability": {
                "rule_score": rule_result["compatibility_score"],
                "feature_breakdown": rule_result["feature_scores"],
            },
        }
        ranked_results.append(result_item)

    # Ranking logic:
    # 1. Primary: Discrete ML label priority (High > Medium > Low)
    # 2. Secondary: Model's predicted probability for 'High' (or class confidence)
    # 3. Tertiary: Behavioral alignment score from feature signals
    ranked_results.sort(
        key=lambda x: (
            label_priority.get(x["compatibility_label"], 0),
            x["probabilities"].get("High", 0.0),
            x["feature_signals"].get("behavioral_alignment_score", 0.0)
        ),
        reverse=True
    )

    if top_n is not None:
        return ranked_results[:top_n]

    return ranked_results
