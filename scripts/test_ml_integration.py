"""
RoomSync End-to-End ML Integration Validation Script.

Executes the full chain:
Raw Student / Profile / Lifestyle Data
  -> ML Adapter
  -> Canonical Student Dictionaries
  -> Pairwise Feature Engineering (Exact 91 Features)
  -> XGBoost Model Inference & Label Decoding
  -> Probability Distribution & Feature Signals
  -> Candidate Recommendation Ranking
"""

import json
import sys
from datetime import date, time
from pathlib import Path

# Ensure project root is available
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.features.feature_engineering import SELECTED_FEATURES, create_pairwise_features
from src.matching.ml_adapter import build_ml_student
from src.matching.prediction_pipeline import get_predictor, predict
from src.matching.recommendation_engine import rank_roommate_candidates


def main():
    print("=" * 60)
    print("ROOMSYNC ML INTEGRATION VALIDATION")
    print("=" * 60)

    # 1. Load Model
    predictor = get_predictor()
    print(f"1. Model Loading: PASS (XGBoost 91-feature classifier, classes={predictor.classes})")

    # 2. Define realistic sample profiles from onboarding
    student_1_data = {
        "first_name": "Priya",
        "last_name": "Sharma",
        "gender": "female",
        "date_of_birth": "2002-05-15",
        "sleep_time": "23:00",
        "wake_time": "07:00",
        "schedule_consistency": 4,
        "study_hours": 5,
        "noise_sleep_tolerance": 4,
        "cleanliness": "clean",
        "cleanliness_score": 4,
        "privacy_preference": 4,
        "talkativeness": 3,
        "friendship_expectation": 3,
        "gaming_hours": 0,
        "smoking": "never",
        "drinking": "occasionally",
        "guest_frequency": "sometimes",
        "fitness": "often",
        "music": True,
        "personal_space": "a_lot",
        "communication_style": "open_communication",
        "financial_responsibility": "very_important",
    }

    student_2_data = {
        "first_name": "Ananya",
        "last_name": "Verma",
        "gender": "female",
        "date_of_birth": "2001-08-20",
        "sleep_time": "23:30",
        "wake_time": "07:30",
        "schedule_consistency": 4,
        "study_hours": 4,
        "noise_sleep_tolerance": 3,
        "cleanliness": "clean",
        "cleanliness_score": 4,
        "privacy_preference": 4,
        "talkativeness": 3,
        "friendship_expectation": 4,
        "gaming_hours": 0,
        "smoking": "never",
        "drinking": "never",
        "guest_frequency": "rarely",
        "fitness": "sometimes",
        "music": False,
        "personal_space": "a_lot",
        "communication_style": "open_communication",
        "financial_responsibility": "very_important",
    }

    # 3. Transform via ML Adapter
    s1, def1 = build_ml_student(student_1_data)
    s2, def2 = build_ml_student(student_2_data)

    print(f"2. ML Adapter Transformation: PASS (S1 lifestyle={s1['lifestyle_type']}, S2 lifestyle={s2['lifestyle_type']})")

    # 4. Feature Engineering
    df = create_pairwise_features(s1, s2, selected_only=True)
    assert df.shape == (1, 91), f"Shape mismatch: {df.shape}"
    assert list(df.columns) == SELECTED_FEATURES, "Feature names or order mismatch!"
    assert not df.isna().any().any(), "Feature vector contains NaN values!"

    print("3. Feature Generation Shape: (1, 91) PASS")
    print("4. Feature Ordering Exact Match: PASS")
    print("5. NaN / Null Check: PASS")

    # 5. Prediction Inference
    result = predict(s1, s2)
    print(f"6. ML Prediction: {result['prediction']} PASS")
    print(f"   Confidence: {result['confidence']:.4f}")
    print(f"   Probabilities: {json.dumps(result['probabilities'])}")
    print(f"   Feature Signals: {json.dumps(result['feature_signals'], indent=4)}")

    # 6. Recommendation Ranking
    candidates = [
        s2,
        build_ml_student({
            "gender": "female",
            "sleep_time": "03:00",
            "wake_time": "11:00",
            "gaming_hours": 6,
            "cleanliness_score": 2,
            "privacy_preference": 1,
            "talkativeness": 5,
            "guest_frequency": "always",
        })[0],
    ]

    ranked = rank_roommate_candidates(target_student=s1, candidate_students=candidates)
    assert len(ranked) == 2
    print(f"7. Candidate Ranking: PASS (Top candidate predicted={ranked[0]['prediction']})")

    print("\n" + "=" * 60)
    print("ALL INTEGRATION CHECKS PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    main()
