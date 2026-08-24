"""
RoomSync Feature Engineering Module.

Transforms two student profiles into the exact 91-feature pairwise representation
expected by the trained XGBoost roommate compatibility model.

Deterministic, fully aligned with the training pipeline in notebooks/03_feature_engineering.ipynb
and notebooks/04_model_experiments.ipynb.
"""

from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

# ============================================================================
# AUTHORITATIVE 91 SELECTED FEATURES (Exact model input order)
# ============================================================================

SELECTED_FEATURES: List[str] = [
    "sleep_time_1",
    "wake_time_1",
    "alarm_count_1",
    "snooze_frequency_1",
    "noise_sleep_tolerance_1",
    "study_hours_1",
    "cleanliness_score_1",
    "talkativeness_1",
    "guest_frequency_1",
    "privacy_preference_1",
    "temperature_preference_1",
    "conflict_tolerance_1",
    "communication_respect_1",
    "adaptability_1",
    "schedule_consistency_1",
    "gaming_hours_1",
    "music_volume_1",
    "food_smell_tolerance_1",
    "gym_frequency_1",
    "religious_practice_frequency_1",
    "sleep_time_2",
    "wake_time_2",
    "lights_off_time_2",
    "study_hours_2",
    "cleanliness_score_2",
    "room_cleaning_frequency_2",
    "bathing_frequency_2",
    "towel_management_2",
    "phone_call_frequency_2",
    "guest_frequency_2",
    "friendship_expectation_2",
    "boundary_importance_2",
    "temperature_preference_2",
    "negativity_level_2",
    "music_volume_2",
    "gym_frequency_2",
    "expense_responsibility_2",
    "sleep_time_diff",
    "wake_time_diff",
    "study_hours_diff",
    "academic_seriousness_diff",
    "cleanliness_score_diff",
    "organization_score_diff",
    "privacy_preference_diff",
    "boundary_importance_diff",
    "talkativeness_diff",
    "friendship_expectation_diff",
    "guest_frequency_diff",
    "gaming_hours_diff",
    "noise_sleep_tolerance_diff",
    "schedule_consistency_diff",
    "punctuality_diff",
    "sleep_time_similarity",
    "wake_time_similarity",
    "study_hours_similarity",
    "academic_seriousness_similarity",
    "cleanliness_score_similarity",
    "privacy_preference_similarity",
    "boundary_importance_similarity",
    "talkativeness_similarity",
    "friendship_expectation_similarity",
    "guest_frequency_similarity",
    "gaming_hours_similarity",
    "noise_sleep_tolerance_similarity",
    "schedule_consistency_similarity",
    "punctuality_similarity",
    "adaptability_similarity",
    "sleep_compatibility",
    "work_compatibility",
    "cleanliness_compatibility",
    "social_compatibility",
    "privacy_compatibility",
    "routine_compatibility",
    "behavioral_alignment_score",
    "lifestyle_type_1_average",
    "lifestyle_type_1_clean_freak",
    "lifestyle_type_1_disciplined",
    "lifestyle_type_1_fitness_focused",
    "lifestyle_type_1_gamer",
    "lifestyle_type_1_night_owl",
    "lifestyle_type_1_social",
    "conflict_style_1_Aggressive",
    "conflict_style_1_Avoid",
    "lifestyle_type_2_average",
    "lifestyle_type_2_disciplined",
    "lifestyle_type_2_night_owl",
    "gender_2_Female",
    "guest_timing_preference_2_Afternoon",
    "guest_timing_preference_2_Evening",
    "food_preference_2_Non-Vegetarian",
    "food_preference_2_Vegetarian",
]

# ============================================================================
# STATISTICAL DEFAULTS (Dataset medians / modes for optional / uncollected fields)
# ============================================================================

STUDENT_FIELD_DEFAULTS: Dict[str, Any] = {
    "academic_seriousness": 3,
    "adaptability": 3,
    "age": 21,
    "alarm_count": 3,
    "bathing_frequency": 2,
    "bed_making_habit": 0,
    "borrowing_frequency": 3,
    "boundary_importance": 3,
    "cleanliness_score": 3,
    "communication_respect": 4,
    "conflict_style": "Direct",
    "conflict_tolerance": 3,
    "course": "BBA",
    "criticism_response": 4,
    "drinking": 0,
    "emotional_stability": 4,
    "entry_exit_noise_awareness": 3,
    "expense_responsibility": 4,
    "fan_speed_preference": 3,
    "food_preference": "Vegetarian",
    "food_smell_tolerance": 3,
    "friendship_expectation": 3,
    "gaming_hours": 2,
    "gender": "Female",
    "guest_frequency": 2,
    "guest_timing_preference": "Evening",
    "gym_frequency": 2,
    "hostel_block": "D",
    "independence_preference": 3,
    "late_night_calls": 3,
    "laundry_frequency": 4,
    "lifestyle_type": "average",
    "lights_off_time": 21,
    "music_frequency": 3,
    "music_volume": 3,
    "negativity_level": 3,
    "noise_sleep_tolerance": 3,
    "organization_score": 3,
    "overnight_guest_comfort": 0,
    "phone_call_frequency": 3,
    "privacy_preference": 3,
    "punctuality": 3,
    "religious_practice_frequency": 3,
    "room_cleaning_frequency": 4,
    "room_eating_habit": 0,
    "schedule_consistency": 3,
    "self_talking_study": 3,
    "sharing_comfort": 3,
    "silence_requirement": 3,
    "sleep_time": 21,
    "smoking": 0,
    "snooze_frequency": 3,
    "student_id": 251,
    "study_hours": 4,
    "study_time_preference": "Evening",
    "talkativeness": 3,
    "temperature_preference": 3,
    "towel_management": 3,
    "unauthorized_usage": 0,
    "wake_time": 7,
    "year_of_study": 3,
}

# Max difference ranges used for normalization during training
MAX_RANGES: Dict[str, float] = {
    "study_hours": 6.0,             # 1-7 scale -> max diff = 6
    "academic_seriousness": 4.0,    # 1-5 scale -> max diff = 4
    "cleanliness_score": 4.0,
    "organization_score": 4.0,
    "privacy_preference": 4.0,
    "boundary_importance": 4.0,
    "talkativeness": 4.0,
    "friendship_expectation": 4.0,
    "guest_frequency": 4.0,
    "gaming_hours": 8.0,            # 0-8 scale -> max diff = 8
    "music_volume": 4.0,
    "noise_sleep_tolerance": 4.0,
    "schedule_consistency": 4.0,
    "punctuality": 4.0,
    "adaptability": 4.0,
}

# ============================================================================
# HELPER SIMILARITY FUNCTIONS
# ============================================================================

def calculate_time_similarity(time_diff: float) -> float:
    """Circular time similarity matching training definition (1 - diff / 12)."""
    return max(0.0, 1.0 - (float(time_diff) / 12.0))


def calculate_feature_similarity(diff_val: float, max_diff: float) -> float:
    """Normalized feature similarity bounded between 0.0 and 1.0."""
    if max_diff <= 0:
        return 1.0
    return max(0.0, 1.0 - (float(diff_val) / float(max_diff)))


# ============================================================================
# MAIN FEATURE ENGINEERING PIPELINE
# ============================================================================

def create_pairwise_features(
    student_1: Dict[str, Any],
    student_2: Dict[str, Any],
    selected_only: bool = True
) -> pd.DataFrame:
    """
    Generate the complete, deterministic feature representation for a pair of students.

    Parameters:
    -----------
    student_1 : dict
        Profile attributes for student 1.
    student_2 : dict
        Profile attributes for student 2.
    selected_only : bool, default=True
        If True, returns only the 91 features expected by the trained XGBoost model
        in the exact required order. If False, returns all engineered features.

    Returns:
    --------
    pd.DataFrame of shape (1, 91)
    """
    if not isinstance(student_1, dict) or not isinstance(student_2, dict):
        raise TypeError("Both student_1 and student_2 must be dictionaries.")

    # Fill defaults for any missing optional attributes
    s1: Dict[str, Any] = {**STUDENT_FIELD_DEFAULTS, **student_1}
    s2: Dict[str, Any] = {**STUDENT_FIELD_DEFAULTS, **student_2}

    features: Dict[str, Any] = {}

    # ------------------------------------------------------------------------
    # 1. Student 1 Raw Features
    # ------------------------------------------------------------------------
    raw_s1_fields = [
        "sleep_time", "wake_time", "alarm_count", "snooze_frequency",
        "noise_sleep_tolerance", "study_hours", "cleanliness_score",
        "talkativeness", "guest_frequency", "privacy_preference",
        "temperature_preference", "conflict_tolerance", "communication_respect",
        "adaptability", "schedule_consistency", "gaming_hours", "music_volume",
        "food_smell_tolerance", "gym_frequency", "religious_practice_frequency"
    ]
    for field in raw_s1_fields:
        features[f"{field}_1"] = s1[field]

    # ------------------------------------------------------------------------
    # 2. Student 2 Raw Features
    # ------------------------------------------------------------------------
    raw_s2_fields = [
        "sleep_time", "wake_time", "lights_off_time", "study_hours",
        "cleanliness_score", "room_cleaning_frequency", "bathing_frequency",
        "towel_management", "phone_call_frequency", "guest_frequency",
        "friendship_expectation", "boundary_importance", "temperature_preference",
        "negativity_level", "music_volume", "gym_frequency", "expense_responsibility"
    ]
    for field in raw_s2_fields:
        features[f"{field}_2"] = s2[field]

    # ------------------------------------------------------------------------
    # 3. Difference Features
    # ------------------------------------------------------------------------
    diff_fields = [
        "sleep_time", "wake_time", "study_hours", "academic_seriousness",
        "cleanliness_score", "organization_score", "privacy_preference",
        "boundary_importance", "talkativeness", "friendship_expectation",
        "guest_frequency", "gaming_hours", "music_volume", "noise_sleep_tolerance",
        "schedule_consistency", "punctuality", "adaptability"
    ]
    for field in diff_fields:
        features[f"{field}_diff"] = abs(s1[field] - s2[field])

    # ------------------------------------------------------------------------
    # 4. Similarity Features
    # ------------------------------------------------------------------------
    features["sleep_time_similarity"] = calculate_time_similarity(features["sleep_time_diff"])
    features["wake_time_similarity"] = calculate_time_similarity(features["wake_time_diff"])

    for field in [
        "study_hours", "academic_seriousness", "cleanliness_score",
        "organization_score", "privacy_preference", "boundary_importance",
        "talkativeness", "friendship_expectation", "guest_frequency",
        "gaming_hours", "music_volume", "noise_sleep_tolerance",
        "schedule_consistency", "punctuality", "adaptability"
    ]:
        max_diff = MAX_RANGES.get(field, 4.0)
        features[f"{field}_similarity"] = calculate_feature_similarity(
            features[f"{field}_diff"], max_diff
        )

    # ------------------------------------------------------------------------
    # 5. Aggregate Compatibility Features
    # ------------------------------------------------------------------------
    features["sleep_compatibility"] = (
        features["sleep_time_similarity"] + features["wake_time_similarity"]
    ) / 2.0

    features["work_compatibility"] = (
        features["study_hours_similarity"] + features["academic_seriousness_similarity"]
    ) / 2.0

    features["cleanliness_compatibility"] = (
        features["cleanliness_score_similarity"] + features["organization_score_similarity"]
    ) / 2.0

    features["social_compatibility"] = (
        features["talkativeness_similarity"]
        + features["friendship_expectation_similarity"]
        + features["guest_frequency_similarity"]
    ) / 3.0

    features["privacy_compatibility"] = (
        features["privacy_preference_similarity"] + features["boundary_importance_similarity"]
    ) / 2.0

    features["routine_compatibility"] = (
        features["schedule_consistency_similarity"]
        + features["punctuality_similarity"]
        + features["adaptability_similarity"]
    ) / 3.0

    features["behavioral_alignment_score"] = (
        features["sleep_compatibility"]
        + features["work_compatibility"]
        + features["cleanliness_compatibility"]
        + features["social_compatibility"]
        + features["privacy_compatibility"]
        + features["routine_compatibility"]
    ) / 6.0

    # ------------------------------------------------------------------------
    # 6. One-Hot Categorical Features
    # ------------------------------------------------------------------------
    lt1 = str(s1.get("lifestyle_type", "average")).lower()
    features["lifestyle_type_1_average"] = int(lt1 == "average")
    features["lifestyle_type_1_clean_freak"] = int(lt1 == "clean_freak")
    features["lifestyle_type_1_disciplined"] = int(lt1 == "disciplined")
    features["lifestyle_type_1_fitness_focused"] = int(lt1 == "fitness_focused")
    features["lifestyle_type_1_gamer"] = int(lt1 == "gamer")
    features["lifestyle_type_1_night_owl"] = int(lt1 == "night_owl")
    features["lifestyle_type_1_social"] = int(lt1 == "social")

    cs1 = str(s1.get("conflict_style", "Direct"))
    features["conflict_style_1_Aggressive"] = int(cs1 == "Aggressive")
    features["conflict_style_1_Avoid"] = int(cs1 == "Avoid")

    lt2 = str(s2.get("lifestyle_type", "average")).lower()
    features["lifestyle_type_2_average"] = int(lt2 == "average")
    features["lifestyle_type_2_disciplined"] = int(lt2 == "disciplined")
    features["lifestyle_type_2_night_owl"] = int(lt2 == "night_owl")

    g2 = str(s2.get("gender", "Female"))
    features["gender_2_Female"] = int(g2 == "Female")

    gt2 = str(s2.get("guest_timing_preference", "Evening"))
    features["guest_timing_preference_2_Afternoon"] = int(gt2 == "Afternoon")
    features["guest_timing_preference_2_Evening"] = int(gt2 == "Evening")

    fp2 = str(s2.get("food_preference", "Vegetarian"))
    features["food_preference_2_Non-Vegetarian"] = int(fp2 == "Non-Vegetarian")
    features["food_preference_2_Vegetarian"] = int(fp2 == "Vegetarian")

    df = pd.DataFrame([features])

    if selected_only:
        # Strict validation of feature presence and exact ordering
        missing_features = [col for col in SELECTED_FEATURES if col not in df.columns]
        if missing_features:
            raise KeyError(
                f"Feature engineering failed to produce expected features: {missing_features}"
            )
        df = df[SELECTED_FEATURES]

    return df