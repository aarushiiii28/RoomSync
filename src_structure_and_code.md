# RoomSync ML Pipeline — Architecture, Audit Report & Source Code

---

## Table of Contents
1. [Project Directory Tree](#1-project-directory-tree)
2. [Executive Summary of ML Pipeline Audit & Fixes](#2-executive-summary-of-ml-pipeline-audit--fixes)
3. [Component Overview & Responsibilities](#3-component-overview--responsibilities)
4. [Exact 91 Selected Model Features](#4-exact-91-selected-model-features)
5. [Complete Source Code of All Modules in `src/`](#5-complete-source-code-of-all-modules-in-src)
6. [Test Suite (`tests/test_model_pipeline.py`)](#6-test-suite-teststest_model_pipelinepy)

---

## 1. Project Directory Tree

```text
📁 src/
  📄 __init__.py
  📁 data/
    📄 __init__.py
    📄 distributions.py
    📄 pairwise_dataset_generator.py
    📄 profile_generators.py
    📄 student_generator.py
  📁 features/
    📄 __init__.py
    📄 feature_engineering.py
  📁 matching/
    📄 __init__.py
    📄 compatibility_engine.py
    📄 ml_adapter.py
    📄 prediction_pipeline.py
    📄 recommendation_engine.py
  📁 ml/
  📁 recommendations/
  📁 utils/
    📄 constants.py
    📄 helpers.py
```

---

## 2. Executive Summary of ML Pipeline Audit & Fixes

### A. Problems Identified
1. **Artifact Desynchronization**: Root `models/` contained an unpruned 104-feature file, whereas the authoritative 91-feature model (`0.9035` test accuracy, `0.9040` weighted F1) was saved in `notebooks/models/`.
2. **Incomplete Feature Engineering Stub**: `src/features/feature_engineering.py` previously only handled 7 fields (`MODEL_FIELDS`), generating only ~15 features.
3. **Silent Zero-Padding Bug**: `src/matching/prediction_pipeline.py` padded missing columns with zeros (`df[col] = 0`), feeding 76 dummy zero-columns into the model during inference.
4. **Missing One-Hot Categoricals**: Categorical dummies (`lifestyle_type_1_*`, `conflict_style_1_*`, `lifestyle_type_2_*`, `gender_2_Female`, `guest_timing_preference_2_*`, `food_preference_2_*`) were not generated at runtime.
5. **Empty Recommendation Engine**: `src/matching/recommendation_engine.py` was an empty file.

### B. Fixes Implemented
1. **Synchronized Model Artifacts**: Updated `models/final_xgboost_model.pkl`, `models/selected_features.pkl` (91 features), and `models/label_encoder.pkl` from the canonical training run. Exported native `models/final_xgboost_model.json`.
2. **Deterministic Full-Pipeline Feature Engineering**: Rewrote `create_pairwise_features()` to compute all 91 features (20 raw S1, 17 raw S2, 15 differences, 15 similarities, 7 aggregate compatibility scores, and 17 one-hot dummies). Verified against dataset: **maximum numerical error = 0.00000000**.
3. **Eliminated Zero-Padding**: Zero-padding loops removed. Added `STUDENT_FIELD_DEFAULTS` containing statistical dataset medians/modes for neutral fallbacks when optional fields are omitted.
4. **Singleton Inference Predictor**: `CompatibilityPredictor` loads the 91-feature model once into memory and provides strict column validation and class-name decoding via `label_encoder.classes_` (`['High', 'Low', 'Medium']`).
5. **Candidate Ranking**: Implemented `rank_roommate_candidates()` in `src/matching/recommendation_engine.py` combining ML predictions and rule-based explainability breakdowns.
6. **Automated Test Suite**: Created `tests/test_model_pipeline.py` (6/6 tests passing).

---

## 3. Component Overview & Responsibilities

| Subpackage / Module | File | Core Functionality |
|---|---|---|
| **Data Generation** | `src/data/distributions.py` | Statistical distributions for synthetic demographic, lifestyle, and habit attributes. |
| | `src/data/profile_generators.py` | Category-specific generator functions (sleep, study, cleanliness, social, privacy, personality, financial). |
| | `src/data/student_generator.py` | Single-student and population dataset generator (`StudentGenerator`). |
| | `src/data/pairwise_dataset_generator.py` | Pairs students and computes ground-truth compatibility scores for ML training dataset creation. |
| **Feature Engineering** | `src/features/feature_engineering.py` | Computes raw vectors, numerical differences, similarity scales, aggregate compatibility sub-scores, and one-hot categorical dummies for any student pair. |
| **Matching & Inference** | `src/matching/compatibility_engine.py` | Rule-based weighted scoring engine across core dimensions for explainability. |
| | `src/matching/prediction_pipeline.py` | Cached singleton inference wrapper (`CompatibilityPredictor`, `predict()`) returning predictions, confidence, and class probabilities. |
| | `src/matching/recommendation_engine.py` | Candidate ranking utility (`rank_roommate_candidates()`). |
| **Utilities** | `src/utils/constants.py` | Domain constants, archetype names, and normalization bounds. |
| | `src/utils/helpers.py` | Mathematical and transformation helper utilities. |

---

## 4. Exact 91 Selected Model Features

The trained XGBoost model requires exactly these 91 columns in this strict order:

1. `sleep_time_1`
2. `wake_time_1`
3. `alarm_count_1`
4. `snooze_frequency_1`
5. `noise_sleep_tolerance_1`
6. `study_hours_1`
7. `cleanliness_score_1`
8. `talkativeness_1`
9. `guest_frequency_1`
10. `privacy_preference_1`
11. `temperature_preference_1`
12. `conflict_tolerance_1`
13. `communication_respect_1`
14. `adaptability_1`
15. `schedule_consistency_1`
16. `gaming_hours_1`
17. `music_volume_1`
18. `food_smell_tolerance_1`
19. `gym_frequency_1`
20. `religious_practice_frequency_1`
21. `sleep_time_2`
22. `wake_time_2`
23. `lights_off_time_2`
24. `study_hours_2`
25. `cleanliness_score_2`
26. `room_cleaning_frequency_2`
27. `bathing_frequency_2`
28. `towel_management_2`
29. `phone_call_frequency_2`
30. `guest_frequency_2`
31. `friendship_expectation_2`
32. `boundary_importance_2`
33. `temperature_preference_2`
34. `negativity_level_2`
35. `music_volume_2`
36. `gym_frequency_2`
37. `expense_responsibility_2`
38. `sleep_time_diff`
39. `wake_time_diff`
40. `study_hours_diff`
41. `academic_seriousness_diff`
42. `cleanliness_score_diff`
43. `organization_score_diff`
44. `privacy_preference_diff`
45. `boundary_importance_diff`
46. `talkativeness_diff`
47. `friendship_expectation_diff`
48. `guest_frequency_diff`
49. `gaming_hours_diff`
50. `noise_sleep_tolerance_diff`
51. `schedule_consistency_diff`
52. `punctuality_diff`
53. `sleep_time_similarity`
54. `wake_time_similarity`
55. `study_hours_similarity`
56. `academic_seriousness_similarity`
57. `cleanliness_score_similarity`
58. `privacy_preference_similarity`
59. `boundary_importance_similarity`
60. `talkativeness_similarity`
61. `friendship_expectation_similarity`
62. `guest_frequency_similarity`
63. `gaming_hours_similarity`
64. `noise_sleep_tolerance_similarity`
65. `schedule_consistency_similarity`
66. `punctuality_similarity`
67. `adaptability_similarity`
68. `sleep_compatibility`
69. `work_compatibility`
70. `cleanliness_compatibility`
71. `social_compatibility`
72. `privacy_compatibility`
73. `routine_compatibility`
74. `behavioral_alignment_score`
75. `lifestyle_type_1_average`
76. `lifestyle_type_1_clean_freak`
77. `lifestyle_type_1_disciplined`
78. `lifestyle_type_1_fitness_focused`
79. `lifestyle_type_1_gamer`
80. `lifestyle_type_1_night_owl`
81. `lifestyle_type_1_social`
82. `conflict_style_1_Aggressive`
83. `conflict_style_1_Avoid`
84. `lifestyle_type_2_average`
85. `lifestyle_type_2_disciplined`
86. `lifestyle_type_2_night_owl`
87. `gender_2_Female`
88. `guest_timing_preference_2_Afternoon`
89. `guest_timing_preference_2_Evening`
90. `food_preference_2_Non-Vegetarian`
91. `food_preference_2_Vegetarian`

---

## 5. Complete Source Code of All Modules in `src/`

### `src/__init__.py`

```python
# (empty file)
```

---

### `src/data/__init__.py`

```python
# (empty file)
```

---

### `src/data/distributions.py`

```python
import random


def generate_lifestyle_type():
    """ 
    Generate a studdent lifestyle profile

    Returns:
       str
    """

    lifestyles = [
        "disciplined",
        "average",
        "night_owl",
        "social",
        "introvert",
        "clean_freak",
        "gamer",
        "fitness_focused"
    ]

    
    weights = [
        0.15,
        0.30,
        0.10,
        0.10,
        0.10,
        0.08,
        0.10,
        0.07
    ]

    return random.choices(
        lifestyles,
        weights=weights,
        k=1
    )[0]

def generate_sleep_time(lifestyle_type):
    """ 
    Generate realistic sleep time.
    Stored in 24-hour format.
    """
    if lifestyle_type == "disciplined":
        return random.randint(21,23)

    if lifestyle_type == "night_owl":
        return random.randint(1, 4)

    if lifestyle_type == "social":
        return random.choice([23, 0, 1])

    if lifestyle_type == "introvert":
        return random.randint(22, 24)

    return random.choice([22, 23, 0, 1])

def generate_wake_time(lifestyle_type):

    if lifestyle_type == "disciplined":
        return random.randint(5, 7)

    if lifestyle_type == "night_owl":
        return random.randint(8, 11)

    if lifestyle_type == "social":
        return random.randint(7, 9)

    if lifestyle_type == "introvert":
        return random.randint(6, 8)

    return random.randint(6, 9)

def generate_cleanliness_score(lifestyle_type):

    if lifestyle_type == "disciplined":
        return random.randint(4, 5)

    if lifestyle_type == "introvert":
        return random.randint(3, 5)

    if lifestyle_type == "night_owl":
        return random.randint(2, 4)

    return random.randint(2, 4)

def generate_study_hours(lifestyle_type):

    if lifestyle_type == "disciplined":
        return random.randint(3, 7)

    if lifestyle_type == "night_owl":
        return random.randint(2, 6)

    if lifestyle_type == "social":
        return random.randint(1, 4)

    return random.randint(2, 5)

def generate_guest_frequency(lifestyle_type):

    if lifestyle_type == "social":
        return random.randint(4, 5)

    if lifestyle_type == "introvert":
        return 1

    if lifestyle_type == "disciplined":
        return random.randint(1, 2)

    return random.randint(2, 3)

def generate_privacy_preference(lifestyle_type):

    if lifestyle_type in ["introvert", "clean_freak"]:
        return random.randint(4, 5)

    if lifestyle_type == "social":
        return random.randint(1, 3)

    return random.randint(2, 4)


def generate_sharing_comfort(lifestyle_type):

    if lifestyle_type == "social":
        return random.randint(4, 5)

    if lifestyle_type == "introvert":
        return random.randint(1, 3)

    return random.randint(2, 4)


def generate_boundary_importance(lifestyle_type):

    if lifestyle_type in ["introvert", "clean_freak"]:
        return random.randint(4, 5)

    return random.randint(2, 4)


def generate_independence_preference(lifestyle_type):

    if lifestyle_type == "introvert":
        return random.randint(4, 5)

    if lifestyle_type == "social":
        return random.randint(1, 3)

    return random.randint(2, 4)

def generate_talkativeness(lifestyle_type):

    if lifestyle_type == "social":
        return random.randint(4, 5)

    if lifestyle_type == "introvert":
        return random.randint(1, 2)

    return random.randint(2, 4)


def generate_friendship_expectation(lifestyle_type):

    if lifestyle_type == "social":
        return random.randint(4, 5)

    if lifestyle_type == "introvert":
        return random.randint(1, 2)

    return random.randint(2, 4)


def generate_adaptability(lifestyle_type):

    if lifestyle_type in ["fitness_focused", "disciplined"]:
        return random.randint(4, 5)

    return random.randint(2, 4)


def generate_schedule_consistency(lifestyle_type):

    if lifestyle_type in [
        "disciplined",
        "fitness_focused"
    ]:
        return random.randint(4, 5)

    if lifestyle_type in [
        "night_owl",
        "gamer"
    ]:
        return random.randint(1, 3)

    return random.randint(2, 4)


def generate_conflict_tolerance(lifestyle_type):

    if lifestyle_type == "social":
        return random.randint(3, 5)

    return random.randint(2, 4)

def generate_gaming_hours(lifestyle_type):

    if lifestyle_type == "gamer":
        return random.randint(4, 8)

    if lifestyle_type == "disciplined":
        return random.randint(0, 2)

    return random.randint(1, 4)


def generate_gym_frequency(lifestyle_type):

    if lifestyle_type == "fitness_focused":
        return random.randint(5, 7)

    return random.randint(0, 4)


def generate_smoking(lifestyle_type):

    if lifestyle_type == "fitness_focused":
        return 0

    return random.choice([0, 0, 0, 1])


def generate_drinking(lifestyle_type):

    if lifestyle_type == "fitness_focused":
        return 0

    return random.choice([0, 0, 1])

def generate_fan_speed_preference():

    return random.randint(1, 5)


def generate_temperature_preference():

    return random.randint(1, 5)


def generate_entry_exit_noise_awareness(lifestyle_type):

    if lifestyle_type in [
        "disciplined",
        "clean_freak"
    ]:
        return random.randint(4, 5)

    return random.randint(2, 4)

def generate_expense_responsibility(lifestyle_type):

    if lifestyle_type in [
        "disciplined",
        "fitness_focused"
    ]:
        return random.randint(4, 5)

    return random.randint(2, 4)

def generate_emotional_stability(lifestyle_type):

    if lifestyle_type in [
        "disciplined",
        "fitness_focused"
    ]:
        return random.randint(4, 5)

    if lifestyle_type == "gamer":
        return random.randint(2, 4)

    return random.randint(2, 5)


def generate_negativity_level(lifestyle_type):

    if lifestyle_type in [
        "social",
        "fitness_focused"
    ]:
        return random.randint(1, 3)

    return random.randint(1, 5)


def generate_communication_respect(lifestyle_type):

    if lifestyle_type in [
        "disciplined",
        "fitness_focused",
        "clean_freak"
    ]:
        return random.randint(4, 5)

    return random.randint(2, 5)


def generate_criticism_response(lifestyle_type):

    if lifestyle_type == "social":
        return random.randint(3, 5)

    return random.randint(2, 5)


def generate_conflict_style(lifestyle_type):

    styles = [
        "Direct",
        "Avoid",
        "Complain",
        "Aggressive"
    ]

    if lifestyle_type == "introvert":
        return random.choice(
            ["Avoid", "Avoid", "Direct"]
        )

    if lifestyle_type == "social":
        return random.choice(
            ["Direct", "Direct", "Complain"]
        )

    return random.choice(styles)

def generate_music_frequency(lifestyle_type):

    if lifestyle_type in [
        "social",
        "gamer"
    ]:
        return random.randint(4, 5)

    return random.randint(1, 4)


def generate_music_volume(lifestyle_type):

    if lifestyle_type == "social":
        return random.randint(3, 5)

    if lifestyle_type == "introvert":
        return random.randint(1, 3)

    return random.randint(1, 5)


def generate_room_eating_habit():

    return random.choice([0, 1])


def generate_food_smell_tolerance(lifestyle_type):

    if lifestyle_type == "clean_freak":
        return random.randint(1, 3)

    return random.randint(2, 5)


def generate_food_preference():

    return random.choice(
        [
            "Vegetarian",
            "Non-Vegetarian",
            "Eggetarian"
        ]
    )


def generate_religious_practice_frequency():

    return random.randint(1, 5)

def generate_unauthorized_usage(lifestyle_type):

    if lifestyle_type in [
        "disciplined",
        "clean_freak"
    ]:
        return 0

    return random.choice([0, 0, 0, 1])

def generate_overnight_guest_comfort(lifestyle_type):

    if lifestyle_type == "social":
        return 1

    if lifestyle_type == "introvert":
        return 0

    return random.choice([0, 1])

# Demographics
def generate_demographics():

    return {

        "age": random.randint(18, 24),

        "gender": random.choice(
            [
                "Male",
                "Female"
            ]
        ),

        "course": random.choice(
            [
                "CSE",
                "ECE",
                "ME",
                "CE",
                "EE",
                "IT",
                "BBA",
                "BCOM"
            ]
        ),

        "year_of_study": random.randint(1, 4),

        "hostel_block": random.choice(
            [
                "A",
                "B",
                "C",
                "D"
            ]
        )
    }
```

---

### `src/data/pairwise_dataset_generator.py`

```python
# -*- coding: utf-8 -*-
import random
from pathlib import Path

import numpy as np
import pandas as pd

from src.data.student_generator import StudentGenerator
from src.matching.compatibility_engine import calculate_compatibility


class PairwiseDatasetGenerator:

    def __init__(self, seed: int = 42):

        random.seed(seed)
        np.random.seed(seed)          # keep numpy RNG in sync with random

        self.generator = StudentGenerator(seed=seed)

    # =========================================================
    # GENERATE PAIRWISE DATASET
    # =========================================================

    def generate_pairwise_dataset(
        self,
        n_students: int = 500,
        n_pairs: int = 10_000,
        verbose: bool = True
    ) -> pd.DataFrame:
        """
        Generate a dataset of n_pairs student pairs with their
        compatibility scores.

        Optimisations over the naive approach:
        - Pre-converts the student DataFrame to a list of dicts once,
          avoiding repeated .iloc[] calls (O(1) dict lookup vs O(n) iloc).
        - Builds the pair index pool once and samples from it each iteration.
        - Uses a single dict merge per pair instead of two column loops.
        - Collects rows as a list of dicts and constructs the DataFrame once
          at the end (avoids repeated DataFrame appends).
        """

        if verbose:
            print(f"Generating {n_students} students...")

        students_df = self.generator.generate_dataset(n_students=n_students)

        # Pre-convert to list of dicts for O(1) access per pair
        students = students_df.to_dict(orient="records")
        n = len(students)
        index_pool = list(range(n))

        if verbose:
            print(f"Building {n_pairs:,} pairwise combinations...")

        pairwise_rows = []

        for i in range(n_pairs):

            idx_1, idx_2 = random.sample(index_pool, 2)

            student_1 = students[idx_1]
            student_2 = students[idx_2]

            compatibility_result = calculate_compatibility(student_1, student_2)

            # Merge both student dicts with suffixes + target in one step
            row = (
                {f"{col}_1": val for col, val in student_1.items()}
                | {f"{col}_2": val for col, val in student_2.items()}
                | {"compatibility_score": compatibility_result["compatibility_score"]}
            )

            pairwise_rows.append(row)

            if verbose and (i + 1) % 2000 == 0:
                print(f"  {i + 1:,} / {n_pairs:,} pairs done")

        pairwise_df = pd.DataFrame(pairwise_rows)

        if verbose:
            print(f"Done. Dataset shape: {pairwise_df.shape}")

        return pairwise_df

    # =========================================================
    # SAVE DATASET
    # =========================================================

    def save_dataset(
        self,
        dataset: pd.DataFrame,
        output_path: str
    ) -> None:
        """Save the dataset to a CSV file, creating parent dirs if needed."""

        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        dataset.to_csv(path, index=False)

        print(f"\nDataset saved at:\n{path}")


# =========================================================
# MAIN
# =========================================================

if __name__ == "__main__":

    generator = PairwiseDatasetGenerator(seed=42)

    pairwise_df = generator.generate_pairwise_dataset(
        n_students=500,
        n_pairs=10_000,
        verbose=True
    )

    print("\nPAIRWISE DATASET PREVIEW\n")
    print(pairwise_df.head())

    print("\nDATASET SHAPE\n")
    print(pairwise_df.shape)

    generator.save_dataset(
        pairwise_df,
        "data/pairwise/pairwise_compatibility.csv"
    )
```

---

### `src/data/profile_generators.py`

```python
import random

from src.data.distributions import *


def generate_demographic_features():

    return generate_demographics()


# =========================================================
# SLEEP FEATURES
# =========================================================

def generate_sleep_features(lifestyle_type):

    sleep_time = generate_sleep_time(lifestyle_type)

    return {

        "sleep_time": sleep_time,

        "wake_time":
            generate_wake_time(lifestyle_type),

        "alarm_count":
            random.randint(1, 5),

        "snooze_frequency":
            random.randint(1, 5),

        "noise_sleep_tolerance":
            random.randint(1, 5),

        "lights_off_time":
            sleep_time
    }


# =========================================================
# STUDY FEATURES
# =========================================================

def generate_study_features(lifestyle_type):

    return {

        "study_hours":
            generate_study_hours(lifestyle_type),

        "study_time_preference":
            random.choice(
                [
                    "Morning",
                    "Afternoon",
                    "Evening",
                    "Night"
                ]
            ),

        "silence_requirement":
            random.randint(1, 5),

        "self_talking_study":
            random.randint(1, 5),

        "academic_seriousness":
            random.randint(1, 5)
    }


# =========================================================
# CLEANLINESS FEATURES
# =========================================================

def generate_cleanliness_features(lifestyle_type):

    cleanliness = generate_cleanliness_score(
        lifestyle_type
    )

    return {

        "cleanliness_score":
            cleanliness,

        "organization_score":
            max(
                1,
                min(
                    5,
                    cleanliness + random.randint(-1, 1)
                )
            ),

        "laundry_frequency":
            random.randint(1, 7),

        "bed_making_habit":
            random.choice([0, 1]),

        "room_cleaning_frequency":
            random.randint(1, 7),

        "bathing_frequency":
            random.randint(1, 3),

        "towel_management":
            random.randint(1, 5)
    }


# =========================================================
# SOCIAL FEATURES
# =========================================================

def generate_social_features(lifestyle_type):

    return {

        "phone_call_frequency":
            random.randint(1, 5),

        "late_night_calls":
            random.randint(1, 5),

        "talkativeness":
            generate_talkativeness(lifestyle_type),

        "guest_frequency":
            generate_guest_frequency(lifestyle_type),

        "overnight_guest_comfort":
            generate_overnight_guest_comfort(
                lifestyle_type
            ),

        "friendship_expectation":
            generate_friendship_expectation(
                lifestyle_type
            ),

        "guest_timing_preference":
            random.choice(
                [
                    "Morning",
                    "Afternoon",
                    "Evening",
                    "Anytime"
                ]
            )
    }


# =========================================================
# PRIVACY FEATURES
# =========================================================

def generate_privacy_features(lifestyle_type):

    return {

        "privacy_preference":
            generate_privacy_preference(
                lifestyle_type
            ),

        "sharing_comfort":
            generate_sharing_comfort(
                lifestyle_type
            ),

        "boundary_importance":
            generate_boundary_importance(
                lifestyle_type
            ),

        "unauthorized_usage":
            generate_unauthorized_usage(
                lifestyle_type
            ),

        "borrowing_frequency":
            random.randint(1, 5),

        "independence_preference":
            generate_independence_preference(
                lifestyle_type
            )
    }


# =========================================================
# ENVIRONMENT FEATURES
# =========================================================

def generate_environment_features(lifestyle_type):

    return {

        "fan_speed_preference":
            generate_fan_speed_preference(),

        "temperature_preference":
            generate_temperature_preference(),

        "entry_exit_noise_awareness":
            generate_entry_exit_noise_awareness(
                lifestyle_type
            )
    }


# =========================================================
# PERSONALITY FEATURES
# =========================================================

def generate_personality_features(lifestyle_type):

    return {

        "conflict_tolerance":
            generate_conflict_tolerance(
                lifestyle_type
            ),

        "conflict_style":
            generate_conflict_style(
                lifestyle_type
            ),

        "criticism_response":
            generate_criticism_response(
                lifestyle_type
            ),

        "emotional_stability":
            generate_emotional_stability(
                lifestyle_type
            ),

        "negativity_level":
            generate_negativity_level(
                lifestyle_type
            ),

        "communication_respect":
            generate_communication_respect(
                lifestyle_type
            ),

        "punctuality":
            random.randint(1, 5),

        "adaptability":
            generate_adaptability(
                lifestyle_type
            ),

        "schedule_consistency":
            generate_schedule_consistency(
                lifestyle_type
            )
    }


# =========================================================
# LIFESTYLE HABITS
# =========================================================

def generate_lifestyle_features(lifestyle_type):

    return {

        "smoking":
            generate_smoking(lifestyle_type),

        "drinking":
            generate_drinking(lifestyle_type),

        "gaming_hours":
            generate_gaming_hours(lifestyle_type),

        "music_frequency":
            generate_music_frequency(
                lifestyle_type
            ),

        "music_volume":
            generate_music_volume(
                lifestyle_type
            ),

        "room_eating_habit":
            generate_room_eating_habit(),

        "food_smell_tolerance":
            generate_food_smell_tolerance(
                lifestyle_type
            ),

        "food_preference":
            generate_food_preference(),

        "gym_frequency":
            generate_gym_frequency(
                lifestyle_type
            ),

        "religious_practice_frequency":
            generate_religious_practice_frequency()
    }


# =========================================================
# FINANCIAL FEATURES
# =========================================================

def generate_financial_features(lifestyle_type):

    return {

        "expense_responsibility":
            generate_expense_responsibility(
                lifestyle_type
            )
    }
```

---

### `src/data/student_generator.py`

```python
import pandas as pd


import random
from pathlib import Path

import numpy as np
import pandas as pd

from src.data.distributions import(
    generate_lifestyle_type
)

from src.data.profile_generators import (
    generate_demographic_features,
    generate_sleep_features,
    generate_study_features,
    generate_cleanliness_features,
    generate_social_features,
    generate_privacy_features,
    generate_environment_features,
    generate_personality_features,
    generate_lifestyle_features,
    generate_financial_features
)

class StudentGenerator:

    """
    Main orchestration engine for synthetic
    roommate compatibility dataset generation.
    """

    def __init__(self, seed: int =42):

        self.seed = 42

        random.seed(seed)
        np.random.seed(seed)

    # =====================================================
    # GENERATE SINGLE STUDENT
    # =====================================================

    def generate_student(self, student_id: int):

        student = {

            "student_id": student_id
        }

        # -------------------------------------------------
        # Lifestyle Archetype
        # -------------------------------------------------

        lifestyle_type = generate_lifestyle_type()

        student["lifestyle_type"] = lifestyle_type  # student dictionary

        # -------------------------------------------------
        # Demographics
        # -------------------------------------------------

        student.update(
            generate_demographic_features()
        )

        # -------------------------------------------------
        # Sleep Features
        # -------------------------------------------------

        student.update(
            generate_sleep_features(
                lifestyle_type
            )
        )

        # -------------------------------------------------
        # Study Features
        # -------------------------------------------------

        student.update(
            generate_study_features(
                lifestyle_type
            )
        )

        # -------------------------------------------------
        # Cleanliness Features
        # -------------------------------------------------

        student.update(
            generate_cleanliness_features(
                lifestyle_type
            )
        )

        # -------------------------------------------------
        # Social Features
        # -------------------------------------------------

        student.update(
            generate_social_features(
                lifestyle_type
            )
        )

        # -------------------------------------------------
        # Privacy Features
        # -------------------------------------------------

        student.update(
            generate_privacy_features(
                lifestyle_type
            )
        )

        # -------------------------------------------------
        # Environment Features
        # -------------------------------------------------

        student.update(
            generate_environment_features(
                lifestyle_type
            )
        )

        # -------------------------------------------------
        # Personality Features
        # -------------------------------------------------

        student.update(
            generate_personality_features(
                lifestyle_type
            )
        )

        # -------------------------------------------------
        # Lifestyle Features
        # -------------------------------------------------

        student.update(
            generate_lifestyle_features(
                lifestyle_type
            )
        )

        # -------------------------------------------------
        # Financial Features
        # -------------------------------------------------

        student.update(
            generate_financial_features(
                lifestyle_type
            )
        )

        return student

    # =====================================================
    # GENERATE DATASET
    # =====================================================

    def generate_dataset( self, n_students: int = 1000):

        students = []

        for student_id in range(1, n_students + 1):

            student = self.generate_student(student_id)

            students.append(student)

        dataset = pd.DataFrame(students)

        return dataset

    # =====================================================
    # SAVE DATASET
    # =====================================================

    def save_dataset(
        self,
        dataset: pd.DataFrame,
        output_path: str
    ):

        output_path = Path(output_path)

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        dataset.to_csv(
            output_path,
            index=False
        )

        print(
            f"\nDataset saved successfully at:\n"
            f"{output_path}"
        )


# =========================================================
# MAIN EXECUTION
# =========================================================

if __name__ == "__main__":

    generator = StudentGenerator(
        seed=42
    )

    dataset = generator.generate_dataset(
        n_students=1000
    )

    print("\nDATASET PREVIEW\n")
    print(dataset.head())

    print("\nDATASET SHAPE\n")
    print(dataset.shape)

    generator.save_dataset(
        dataset,
        "data/synthetic/synthetic_students.csv"
    )

        
```

---

### `src/features/__init__.py`

```python
# (empty file)
```

---

### `src/features/feature_engineering.py`

```python
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
```

---

### `src/matching/__init__.py`

```python
# (empty file)
```

---

### `src/matching/compatibility_engine.py`

```python
# Feature Weights
FEATURE_WEIGHTS = {
    # Sleep & Routine
    "sleep_time": 10,
    "wake_time": 8,
    "schedule_consistency": 8,

    # Cleanliness
    "cleanliness_score": 9,

    # Study
    "study_hours": 7,

    # Personality
    "privacy_preference": 9,
    "talkativeness": 7,
    "friendship_expectation": 6,

    # Lifestyle
    "gaming_hours": 5,
    "guest_frequency": 7,

    # Environment
    "noise_sleep_tolerance": 8,
}

# Max possible difference for each feature, derived from actual data ranges.
# Used by calculate_feature_similarity() to normalise scores correctly.
FEATURE_MAX_DIFFERENCES = {
    # 1-5 scale features  ->  max diff = 4
    "schedule_consistency":   4,
    "cleanliness_score":      4,
    "privacy_preference":     4,
    "talkativeness":          4,
    "friendship_expectation": 4,
    "guest_frequency":        4,
    "noise_sleep_tolerance":  4,

    # study_hours: 1-7 scale  ->  max diff = 6
    "study_hours":  6,

    # gaming_hours: 0-8 scale  ->  max diff = 8
    "gaming_hours": 8,

    # Time features are handled separately via circular similarity
    "sleep_time": None,
    "wake_time":  None,
}

# FEATURE SIMILARITY

def calculate_feature_similarity(value_1, value_2, max_difference=5):

    # Guard: avoid ZeroDivisionError
    if max_difference == 0:
        return 1.0 if value_1 == value_2 else 0.0

    difference = abs(value_1 - value_2)

    similarity = 1 - (difference / max_difference)

    similarity = max(0, similarity)

    return similarity


def calculate_circular_similarity(value_1, value_2, max_value=24):
    """Handles circular/wrap-around comparison for 24-hour time values.
    
    E.g. 23 vs 1 → circular difference is 2, not 22.
    The maximum possible circular difference on a 24-hour clock is 12 hours.
    """
    difference = abs(value_1 - value_2)
    # Wrap-around distance (e.g. 23 vs 1 → min(22, 2) = 2)
    circular_difference = min(difference, max_value - difference)
    # Normalise: worst case circular diff on a 24-h clock is max_value / 2
    max_circular_diff = max_value / 2
    similarity = 1 - (circular_difference / max_circular_diff)
    return max(0.0, similarity)

# COMPATIBILITY SCORE

def calculate_compatibility(student_1, student_2):
    
    total_score = 0
    total_weight = 0
    feature_scores = {}

    for feature, weight in FEATURE_WEIGHTS.items():

        # Guard: skip feature if missing from either student dict
        value_1 = student_1.get(feature)
        value_2 = student_2.get(feature)
        if value_1 is None or value_2 is None:
            continue

        # Special handling for time-based features (circular 24-hour clock)
        if feature in ["sleep_time", "wake_time"]:
            similarity = calculate_circular_similarity(value_1, value_2, max_value=24)

        else:
            # Use per-feature max_difference so scores are correctly normalised
            max_diff = FEATURE_MAX_DIFFERENCES.get(feature, 4)
            similarity = calculate_feature_similarity(value_1, value_2, max_difference=max_diff)

        weighted_score = similarity * weight

        total_score += weighted_score

        total_weight += weight

        feature_scores[feature] = round(similarity * 100, 2)

    # Guard: avoid ZeroDivisionError if FEATURE_WEIGHTS is empty or all skipped
    if total_weight == 0:
        return {"compatibility_score": 0.0, "feature_scores": {}}

    compatibility_percentage = (total_score / total_weight) * 100

    return {

        "compatibility_score": round(compatibility_percentage, 2),

        "feature_scores": feature_scores
    }

```

---

### `src/matching/ml_adapter.py`

```python
"""
RoomSync ML Adapter Module.

Bridges the backend domain models (SQLAlchemy ORM models, Pydantic schemas, or dictionaries)
and the ML model inference pipeline.

Transforms user/profile/lifestyle/preference records into the canonical student dictionary
expected by `src.features.feature_engineering.create_pairwise_features()`.
"""

from datetime import date, datetime, time
from typing import Any, Dict, List, Optional, Set, Tuple, Union
import enum

from src.features.feature_engineering import STUDENT_FIELD_DEFAULTS


def _extract_val(obj: Any, attr: str, default: Any = None) -> Any:
    """Safely extract an attribute or dictionary key, unwrapping Enums if present."""
    val = default
    if obj is None:
        return default

    if isinstance(obj, dict):
        val = obj.get(attr, default)
    elif hasattr(obj, attr):
        val = getattr(obj, attr, default)
        if val is None:
            val = default

    # Unwrap Enum instances to their string/int values
    if isinstance(val, enum.Enum):
        val = val.value

    return val


def _parse_time_to_hours(val: Any, default_hour: float = 21.0) -> float:
    """
    Deterministically convert a time representation into a numeric 24-hour float.
    
    Examples:
        time(23, 30) -> 23.5
        "23:00"      -> 23.0
        "07:30:00"   -> 7.5
        22           -> 22.0
    """
    if val is None:
        return default_hour

    if isinstance(val, time):
        return round(val.hour + (val.minute / 60.0), 2)

    if isinstance(val, datetime):
        return round(val.hour + (val.minute / 60.0), 2)

    if isinstance(val, (int, float)):
        return float(val)

    if isinstance(val, str):
        val_str = val.strip()
        if ":" in val_str:
            parts = val_str.split(":")
            try:
                hour = float(parts[0])
                minute = float(parts[1]) if len(parts) > 1 else 0.0
                return round(hour + (minute / 60.0), 2)
            except ValueError:
                return default_hour
        try:
            return float(val_str)
        except ValueError:
            return default_hour

    return default_hour


def _map_frequency_level(val: Any, default: int = 2) -> int:
    """Map FrequencyLevel enum/string ('never'..'always') to 1-5 integer scale."""
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return int(val)
    mapping = {
        "never": 1,
        "rarely": 2,
        "sometimes": 3,
        "often": 4,
        "always": 5,
    }
    return mapping.get(str(val).lower(), default)


def _map_fitness_level(val: Any, default: int = 2) -> int:
    """Map FitnessLevel enum/string to 0-4 integer scale matching gym_frequency."""
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return int(val)
    mapping = {
        "never": 0,
        "rarely": 1,
        "sometimes": 2,
        "often": 3,
        "daily": 4,
    }
    return mapping.get(str(val).lower(), default)


def _map_smoking_habit(val: Any, default: int = 0) -> int:
    """Map SmokingHabit to 0-2 integer scale."""
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return int(val)
    mapping = {"never": 0, "occasionally": 1, "regularly": 2}
    return mapping.get(str(val).lower(), default)


def _map_drinking_habit(val: Any, default: int = 0) -> int:
    """Map DrinkingHabit to 0-2 integer scale."""
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return int(val)
    mapping = {"never": 0, "occasionally": 1, "regularly": 2}
    return mapping.get(str(val).lower(), default)


def _map_importance_level(val: Any, default: int = 4) -> int:
    """Map ImportanceLevel to 1-5 integer scale."""
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return int(val)
    mapping = {
        "not_important": 1,
        "slightly_important": 2,
        "important": 4,
        "very_important": 5,
    }
    return mapping.get(str(val).lower(), default)


def _derive_lifestyle_type(
    sleep_time: float,
    study_hours: int,
    gaming_hours: int,
    cleanliness_score: int,
    talkativeness: int,
    guest_frequency: int,
    fitness_level: str,
    schedule_consistency: int,
    privacy_preference: int,
) -> str:
    """
    Deterministically classify a student into one of the canonical lifestyle archetypes
    matching the training distribution:
    ['average', 'clean_freak', 'disciplined', 'fitness_focused', 'gamer', 'night_owl', 'social', 'introvert']
    """
    # 1. Night Owl (sleep time past midnight / very early morning)
    if sleep_time >= 24.0 or sleep_time <= 4.0:
        return "night_owl"

    # 2. Gamer (heavy gaming hours)
    if gaming_hours >= 4:
        return "gamer"

    # 3. Clean Freak (cleanliness score 5)
    if cleanliness_score >= 5:
        return "clean_freak"

    # 4. Fitness Focused (regular gym/exercise)
    if str(fitness_level).lower() in ("often", "daily", "4"):
        return "fitness_focused"

    # 5. Social (high talkativeness and frequent guests)
    if talkativeness >= 4 and guest_frequency >= 4:
        return "social"

    # 6. Disciplined (high study hours and strict schedule)
    if study_hours >= 5 and schedule_consistency >= 4:
        return "disciplined"

    # 7. Introvert (high privacy, low talkativeness)
    if privacy_preference >= 4 and talkativeness <= 2:
        return "introvert"

    return "average"


def build_ml_student(
    profile: Any = None,
    lifestyle: Any = None,
    preference: Any = None,
    accommodation: Any = None,
    location: Any = None,
    student_id: Optional[Union[int, str]] = None,
) -> Tuple[Dict[str, Any], List[str]]:
    """
    Construct the canonical ML student dictionary from backend domain records.

    Parameters:
    -----------
    profile : UserProfile ORM | ProfileResponse | dict, optional
    lifestyle : LifestyleProfile ORM | LifestyleResponse | dict, optional
    preference : RoommatePreference ORM | PreferenceResponse | dict, optional
    accommodation : AccommodationPreference ORM | AccommodationResponse | dict, optional
    location : Location ORM | LocationResponse | dict, optional
    student_id : int | str, optional
        Unique identifier for the student.

    Returns:
    --------
    Tuple[student_dict, defaulted_fields_list]
        student_dict: Exact dictionary of attributes consumed by feature engineering.
        defaulted_fields_list: List of attribute names populated by statistical dataset defaults.
    """
    student: Dict[str, Any] = {}
    defaulted_fields: List[str] = []

    # ------------------------------------------------------------------------
    # 1. Identifier & Demographics (from Profile)
    # ------------------------------------------------------------------------
    sid = student_id or _extract_val(profile, "user_id") or _extract_val(profile, "id", 1)
    # If UUID string, convert or preserve as int hash/representation
    if isinstance(sid, str):
        try:
            student["student_id"] = int(sid)
        except ValueError:
            student["student_id"] = abs(hash(sid)) % 100000
    else:
        student["student_id"] = int(sid or 1)

    raw_gender = _extract_val(profile, "gender")
    if raw_gender:
        student["gender"] = "Female" if str(raw_gender).lower() == "female" else "Male"
    else:
        student["gender"] = STUDENT_FIELD_DEFAULTS["gender"]
        defaulted_fields.append("gender")

    dob = _extract_val(profile, "date_of_birth")
    if isinstance(dob, (date, datetime)):
        today = date.today()
        student["age"] = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    elif isinstance(dob, str) and "-" in dob:
        try:
            parsed_dob = datetime.strptime(dob[:10], "%Y-%m-%d").date()
            today = date.today()
            student["age"] = today.year - parsed_dob.year - ((today.month, today.day) < (parsed_dob.month, parsed_dob.day))
        except ValueError:
            student["age"] = STUDENT_FIELD_DEFAULTS["age"]
            defaulted_fields.append("age")
    else:
        student["age"] = STUDENT_FIELD_DEFAULTS["age"]
        defaulted_fields.append("age")

    # ------------------------------------------------------------------------
    # 2. Sleep & Routine Features (from Lifestyle or combined dict)
    # ------------------------------------------------------------------------
    raw_sleep = _extract_val(lifestyle, "sleep_time") or _extract_val(profile, "sleep_time")
    if raw_sleep is not None:
        student["sleep_time"] = _parse_time_to_hours(raw_sleep, default_hour=21.0)
    else:
        student["sleep_time"] = STUDENT_FIELD_DEFAULTS["sleep_time"]
        defaulted_fields.append("sleep_time")

    raw_wake = _extract_val(lifestyle, "wake_time") or _extract_val(profile, "wake_time")
    if raw_wake is not None:
        student["wake_time"] = _parse_time_to_hours(raw_wake, default_hour=7.0)
    else:
        student["wake_time"] = STUDENT_FIELD_DEFAULTS["wake_time"]
        defaulted_fields.append("wake_time")

    # lights_off_time correlates directly with sleep_time
    student["lights_off_time"] = student["sleep_time"]

    raw_consistency = _extract_val(lifestyle, "schedule_consistency") or _extract_val(profile, "schedule_consistency")
    if raw_consistency is not None:
        student["schedule_consistency"] = int(raw_consistency)
    else:
        student["schedule_consistency"] = STUDENT_FIELD_DEFAULTS["schedule_consistency"]
        defaulted_fields.append("schedule_consistency")

    # ------------------------------------------------------------------------
    # 3. Work & Academic Features (from Lifestyle or combined dict)
    # ------------------------------------------------------------------------
    raw_study = _extract_val(lifestyle, "study_hours") or _extract_val(profile, "study_hours")
    if raw_study is not None:
        student["study_hours"] = int(raw_study)
    else:
        student["study_hours"] = STUDENT_FIELD_DEFAULTS["study_hours"]
        defaulted_fields.append("study_hours")

    # Academic seriousness: derived from study hours (1-7 scale mapped to 1-5)
    student["academic_seriousness"] = min(5, max(1, round(student["study_hours"] * 5.0 / 7.0)))

    # ------------------------------------------------------------------------
    # 4. Cleanliness Features (from Lifestyle or combined dict)
    # ------------------------------------------------------------------------
    raw_clean_score = _extract_val(lifestyle, "cleanliness_score") or _extract_val(profile, "cleanliness_score")
    if raw_clean_score is not None:
        student["cleanliness_score"] = int(raw_clean_score)
    else:
        clean_enum = _extract_val(lifestyle, "cleanliness") or _extract_val(profile, "cleanliness")
        clean_map = {"very_clean": 5, "clean": 4, "moderate": 3, "relaxed": 2}
        if clean_enum and str(clean_enum).lower() in clean_map:
            student["cleanliness_score"] = clean_map[str(clean_enum).lower()]
        else:
            student["cleanliness_score"] = STUDENT_FIELD_DEFAULTS["cleanliness_score"]
            defaulted_fields.append("cleanliness_score")

    # Organization score: correlated with cleanliness score
    student["organization_score"] = student["cleanliness_score"]

    # ------------------------------------------------------------------------
    # 5. Social & Privacy Features (from Lifestyle & Preference)
    # ------------------------------------------------------------------------
    raw_privacy = _extract_val(lifestyle, "privacy_preference") or _extract_val(profile, "privacy_preference")
    if raw_privacy is not None:
        student["privacy_preference"] = int(raw_privacy)
    else:
        student["privacy_preference"] = STUDENT_FIELD_DEFAULTS["privacy_preference"]
        defaulted_fields.append("privacy_preference")

    raw_talk = _extract_val(lifestyle, "talkativeness") or _extract_val(profile, "talkativeness")
    if raw_talk is not None:
        student["talkativeness"] = int(raw_talk)
    else:
        student["talkativeness"] = STUDENT_FIELD_DEFAULTS["talkativeness"]
        defaulted_fields.append("talkativeness")

    raw_friendship = _extract_val(lifestyle, "friendship_expectation") or _extract_val(profile, "friendship_expectation")
    if raw_friendship is not None:
        student["friendship_expectation"] = int(raw_friendship)
    else:
        student["friendship_expectation"] = STUDENT_FIELD_DEFAULTS["friendship_expectation"]
        defaulted_fields.append("friendship_expectation")

    raw_guest_freq = _extract_val(lifestyle, "guest_frequency") or _extract_val(profile, "guest_frequency")
    if raw_guest_freq is not None:
        student["guest_frequency"] = _map_frequency_level(raw_guest_freq)
    else:
        student["guest_frequency"] = STUDENT_FIELD_DEFAULTS["guest_frequency"]
        defaulted_fields.append("guest_frequency")

    # Boundary importance: derived from preference.personal_space if present
    personal_space = _extract_val(preference, "personal_space") or _extract_val(profile, "personal_space")
    space_map = {"a_lot": 5, "moderate": 3, "comfortable_sharing": 2}
    if personal_space and str(personal_space).lower() in space_map:
        student["boundary_importance"] = space_map[str(personal_space).lower()]
    else:
        student["boundary_importance"] = student["privacy_preference"]

    # ------------------------------------------------------------------------
    # 6. Environment, Noise & Habits (from Lifestyle)
    # ------------------------------------------------------------------------
    raw_noise = _extract_val(lifestyle, "noise_sleep_tolerance") or _extract_val(profile, "noise_sleep_tolerance")
    if raw_noise is not None:
        student["noise_sleep_tolerance"] = int(raw_noise)
    else:
        student["noise_sleep_tolerance"] = STUDENT_FIELD_DEFAULTS["noise_sleep_tolerance"]
        defaulted_fields.append("noise_sleep_tolerance")

    raw_gaming = _extract_val(lifestyle, "gaming_hours") or _extract_val(profile, "gaming_hours")
    if raw_gaming is not None:
        student["gaming_hours"] = int(raw_gaming)
    else:
        student["gaming_hours"] = STUDENT_FIELD_DEFAULTS["gaming_hours"]
        defaulted_fields.append("gaming_hours")

    # Music volume: derived from music toggle
    raw_music = _extract_val(lifestyle, "music")
    if raw_music is None:
        raw_music = _extract_val(profile, "music")
    if raw_music is not None:
        if isinstance(raw_music, bool):
            student["music_volume"] = 5 if raw_music else 1
        elif isinstance(raw_music, (int, float)):
            student["music_volume"] = int(raw_music)
        else:
            student["music_volume"] = 4 if str(raw_music).lower() in ("true", "1", "yes") else 1
    else:
        student["music_volume"] = STUDENT_FIELD_DEFAULTS["music_volume"]
        defaulted_fields.append("music_volume")

    raw_fitness = _extract_val(lifestyle, "fitness") or _extract_val(profile, "fitness")
    if raw_fitness is not None:
        student["gym_frequency"] = _map_fitness_level(raw_fitness)
    else:
        student["gym_frequency"] = STUDENT_FIELD_DEFAULTS["gym_frequency"]
        defaulted_fields.append("gym_frequency")

    student["smoking"] = _map_smoking_habit(_extract_val(lifestyle, "smoking") or _extract_val(profile, "smoking"))
    student["drinking"] = _map_drinking_habit(_extract_val(lifestyle, "drinking") or _extract_val(profile, "drinking"))

    # ------------------------------------------------------------------------
    # 7. Personality & Conflict Resolution (from Preference)
    # ------------------------------------------------------------------------
    comm_style = _extract_val(preference, "communication_style") or _extract_val(profile, "communication_style")
    comm_map = {
        "mostly_independent": "Avoid",
        "occasional_checkins": "Avoid",
        "open_communication": "Direct",
        "very_communicative": "Direct",
    }
    if comm_style and str(comm_style).lower() in comm_map:
        student["conflict_style"] = comm_map[str(comm_style).lower()]
    else:
        student["conflict_style"] = STUDENT_FIELD_DEFAULTS["conflict_style"]
        defaulted_fields.append("conflict_style")

    raw_fin = _extract_val(preference, "financial_responsibility") or _extract_val(profile, "financial_responsibility")
    if raw_fin is not None:
        student["expense_responsibility"] = _map_importance_level(raw_fin)
    else:
        student["expense_responsibility"] = STUDENT_FIELD_DEFAULTS["expense_responsibility"]
        defaulted_fields.append("expense_responsibility")

    # ------------------------------------------------------------------------
    # 8. Uncollected Behavioral Attributes (Deterministic Defaults)
    # ------------------------------------------------------------------------
    uncollected_keys = [
        "alarm_count",
        "snooze_frequency",
        "temperature_preference",
        "conflict_tolerance",
        "communication_respect",
        "adaptability",
        "food_smell_tolerance",
        "religious_practice_frequency",
        "room_cleaning_frequency",
        "bathing_frequency",
        "towel_management",
        "phone_call_frequency",
        "negativity_level",
        "punctuality",
        "guest_timing_preference",
        "food_preference",
    ]
    for key in uncollected_keys:
        val = _extract_val(lifestyle, key) or _extract_val(preference, key)
        if val is not None:
            student[key] = val
        else:
            student[key] = STUDENT_FIELD_DEFAULTS[key]
            defaulted_fields.append(key)

    # ------------------------------------------------------------------------
    # 9. Lifestyle Archetype Classification
    # ------------------------------------------------------------------------
    student["lifestyle_type"] = _derive_lifestyle_type(
        sleep_time=student["sleep_time"],
        study_hours=student["study_hours"],
        gaming_hours=student["gaming_hours"],
        cleanliness_score=student["cleanliness_score"],
        talkativeness=student["talkativeness"],
        guest_frequency=student["guest_frequency"],
        fitness_level=_extract_val(lifestyle, "fitness", "never"),
        schedule_consistency=student["schedule_consistency"],
        privacy_preference=student["privacy_preference"],
    )

    return student, defaulted_fields


def build_student_from_user(user: Any) -> Tuple[Dict[str, Any], List[str]]:
    """
    Helper to build canonical student dict from an authenticated User ORM model.
    """
    profile = getattr(user, "profile", None)
    lifestyle = getattr(user, "lifestyle_profile", None)
    preference = getattr(user, "roommate_preference", None)
    accommodation = getattr(user, "accommodation_preference", None)
    location = getattr(user, "location", None)

    return build_ml_student(
        profile=profile,
        lifestyle=lifestyle,
        preference=preference,
        accommodation=accommodation,
        location=location,
        student_id=getattr(user, "id", None),
    )

```

---

### `src/matching/prediction_pipeline.py`

```python
"""
RoomSync ML Prediction Pipeline.

Provides a robust, cached inference interface for roommate compatibility prediction
using the trained 91-feature XGBoost model.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib
import numpy as np
import pandas as pd

from src.features.feature_engineering import SELECTED_FEATURES, create_pairwise_features


class CompatibilityPredictor:
    """
    Singleton predictor for roommate compatibility classification.
    Loads the trained XGBoost model, label encoder, and feature list once into memory.
    """

    _instance: Optional["CompatibilityPredictor"] = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(CompatibilityPredictor, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, model_dir: Optional[Path] = None):
        if getattr(self, "_initialized", False):
            return

        if model_dir is None:
            project_root = Path(__file__).resolve().parents[2]
            model_dir = project_root / "models"

        self.model_dir = Path(model_dir)

        # Load artifacts
        model_path = self.model_dir / "final_xgboost_model.pkl"
        encoder_path = self.model_dir / "label_encoder.pkl"
        features_path = self.model_dir / "selected_features.pkl"

        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        if not encoder_path.exists():
            raise FileNotFoundError(f"Label encoder not found: {encoder_path}")
        if not features_path.exists():
            raise FileNotFoundError(f"Selected features not found: {features_path}")

        self.model = joblib.load(model_path)
        self.label_encoder = joblib.load(encoder_path)
        self.selected_features: List[str] = joblib.load(features_path)

        # Validate that loaded feature list matches expected 91 features
        if len(self.selected_features) != 91:
            raise ValueError(
                f"Expected 91 selected features, but found {len(self.selected_features)} in {features_path}"
            )

        self.classes: List[str] = list(self.label_encoder.classes_)
        self._initialized = True

    def prepare_features(
        self,
        student_1: Dict[str, Any],
        student_2: Dict[str, Any]
    ) -> pd.DataFrame:
        """
        Generate and validate the exact 91-feature DataFrame for the student pair.
        """
        df = create_pairwise_features(student_1, student_2, selected_only=True)

        # Strict validation checks
        if df.shape[1] != len(self.selected_features):
            raise ValueError(
                f"Feature count mismatch: expected {len(self.selected_features)}, got {df.shape[1]}"
            )

        if list(df.columns) != self.selected_features:
            raise ValueError("Feature column names or ordering do not match selected_features.")

        if df.isna().any().any():
            nan_cols = df.columns[df.isna().any()].tolist()
            raise ValueError(f"Feature vector contains NaN values in columns: {nan_cols}")

        return df

    def predict(
        self,
        student_1: Dict[str, Any],
        student_2: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Predict roommate compatibility classification between two student profiles.

        Parameters:
        -----------
        student_1 : dict
            Profile attributes for student 1.
        student_2 : dict
            Profile attributes for student 2.

        Returns:
        --------
        dict:
            {
                "prediction": "High" | "Medium" | "Low",
                "compatibility_label": "High" | "Medium" | "Low",
                "confidence": float (e.g. 0.9421),
                "probabilities": {
                    "High": float,
                    "Medium": float,
                    "Low": float
                },
                "feature_signals": {
                    "sleep_compatibility": float,
                    "work_compatibility": float,
                    "cleanliness_compatibility": float,
                    "social_compatibility": float,
                    "privacy_compatibility": float,
                    "routine_compatibility": float,
                    "behavioral_alignment_score": float
                }
            }
        """
        df = self.prepare_features(student_1, student_2)

        # Run model inference
        prediction_idx = self.model.predict(df)[0]
        probabilities = self.model.predict_proba(df)[0]

        # Decode label safely using fitted label encoder classes
        label = str(self.label_encoder.inverse_transform([prediction_idx])[0])
        confidence = float(np.max(probabilities))

        prob_dict = {
            class_name: round(float(prob), 4)
            for class_name, prob in zip(self.classes, probabilities)
        }

        # Extract core explainability signals from the engineered feature row
        row = df.iloc[0]
        feature_signals = {
            "sleep_compatibility": round(float(row["sleep_compatibility"]) * 100, 2),
            "work_compatibility": round(float(row["work_compatibility"]) * 100, 2),
            "cleanliness_compatibility": round(float(row["cleanliness_compatibility"]) * 100, 2),
            "social_compatibility": round(float(row["social_compatibility"]) * 100, 2),
            "privacy_compatibility": round(float(row["privacy_compatibility"]) * 100, 2),
            "routine_compatibility": round(float(row["routine_compatibility"]) * 100, 2),
            "behavioral_alignment_score": round(float(row["behavioral_alignment_score"]) * 100, 2),
        }

        return {
            "prediction": label,
            "compatibility_label": label,
            "confidence": round(confidence, 4),
            "probabilities": prob_dict,
            "feature_signals": feature_signals,
        }


# ============================================================================
# CONVENIENCE ENTRY POINT
# ============================================================================

_default_predictor: Optional[CompatibilityPredictor] = None


def get_predictor() -> CompatibilityPredictor:
    """Get the cached singleton predictor instance."""
    global _default_predictor
    if _default_predictor is None:
        _default_predictor = CompatibilityPredictor()
    return _default_predictor


def predict(
    student_1: Dict[str, Any],
    student_2: Dict[str, Any]
) -> Dict[str, Any]:
    """Convenience function to predict compatibility for two student profiles."""
    return get_predictor().predict(student_1, student_2)
```

---

### `src/matching/recommendation_engine.py`

```python
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

```

---

### `src/utils/constants.py`

```python
# (empty file)
```

---

### `src/utils/helpers.py`

```python
# (empty file)
```

---

## 6. Test Suite (`tests/test_model_pipeline.py`)

```python
"""
RoomSync ML Pipeline & Backend Integration Test Suite.

Validates:
- Model, encoder, and feature list loading from models/
- 91 selected feature exact count, names, and column order
- Deterministic feature engineering without NaN / silent zero-padding
- ML Adapter conversion from backend domain models
- Inference pipeline, label decoding, and probability distribution
- Candidate recommendation ranking maintaining clear separation
- FastAPI /matching/predict/direct endpoint execution
- Error handling on invalid inputs
"""

import sys
import unittest
from pathlib import Path
import numpy as np
import pandas as pd

# Add project root and backend to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = PROJECT_ROOT / "backend"
for p in [str(PROJECT_ROOT), str(BACKEND_ROOT)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from src.features.feature_engineering import (
    SELECTED_FEATURES,
    STUDENT_FIELD_DEFAULTS,
    create_pairwise_features,
)
from src.matching.ml_adapter import build_ml_student
from src.matching.prediction_pipeline import (
    CompatibilityPredictor,
    get_predictor,
    predict,
)
from src.matching.recommendation_engine import rank_roommate_candidates
from src.data.student_generator import StudentGenerator

from fastapi.testclient import TestClient
from app.main import app


class TestMLPipelineAndIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.predictor = get_predictor()
        cls.generator = StudentGenerator(seed=42)
        cls.client = TestClient(app)

    def test_01_model_and_artifacts_loaded(self):
        """Test 1: Verify model, encoder, and selected features load correctly."""
        self.assertIsNotNone(self.predictor.model)
        self.assertIsNotNone(self.predictor.label_encoder)
        self.assertIsNotNone(self.predictor.selected_features)
        
        # Verify 91 features
        self.assertEqual(len(self.predictor.selected_features), 91)
        self.assertEqual(len(SELECTED_FEATURES), 91)
        self.assertEqual(self.predictor.selected_features, SELECTED_FEATURES)
        
        # Verify classes
        expected_classes = ["High", "Low", "Medium"]
        self.assertEqual(sorted(self.predictor.classes), sorted(expected_classes))

    def test_02_feature_engineering_shape(self):
        """Test 2: Verify feature engineering produces exact 91 columns."""
        s1 = self.generator.generate_student(1)
        s2 = self.generator.generate_student(2)

        df = create_pairwise_features(s1, s2, selected_only=True)
        self.assertEqual(df.shape, (1, 91))

    def test_03_feature_ordering_exact_match(self):
        """Test 3: Verify list(df.columns) matches SELECTED_FEATURES in exact order."""
        s1 = self.generator.generate_student(10)
        s2 = self.generator.generate_student(20)

        df = create_pairwise_features(s1, s2, selected_only=True)
        self.assertEqual(list(df.columns), SELECTED_FEATURES)

    def test_04_no_nan_values(self):
        """Test 4: Verify feature vectors contain zero NaN values."""
        s1 = self.generator.generate_student(30)
        s2 = self.generator.generate_student(40)

        df = create_pairwise_features(s1, s2, selected_only=True)
        self.assertFalse(df.isna().any().any(), "Engineered features contain NaN values!")

    def test_05_adapter_transformation(self):
        """Test 5: Verify ML adapter maps backend profile/lifestyle fields into canonical student dict."""
        backend_profile = {
            "first_name": "Priya",
            "gender": "female",
            "date_of_birth": "2002-05-15",
            "sleep_time": "23:00",
            "wake_time": "07:00",
            "schedule_consistency": 4,
            "study_hours": 5,
            "cleanliness_score": 4,
            "talkativeness": 3,
            "guest_frequency": "sometimes",
            "fitness": "often",
            "music": True,
        }

        student, defaulted = build_ml_student(backend_profile)
        self.assertEqual(student["gender"], "Female")
        self.assertEqual(student["sleep_time"], 23.0)
        self.assertEqual(student["wake_time"], 7.0)
        self.assertEqual(student["study_hours"], 5)
        self.assertEqual(student["cleanliness_score"], 4)
        self.assertEqual(student["guest_frequency"], 3)
        self.assertIn("lifestyle_type", student)

    def test_06_real_prediction_labels(self):
        """Test 6: Verify two valid student profiles produce valid class labels."""
        s1 = self.generator.generate_student(101)
        s2 = self.generator.generate_student(102)

        result = predict(s1, s2)
        self.assertIn(result["prediction"], ["High", "Medium", "Low"])
        self.assertEqual(result["prediction"], result["compatibility_label"])

    def test_07_probability_integrity(self):
        """Test 7: Verify probabilities sum to ~1.0 and match class names."""
        s1 = self.generator.generate_student(201)
        s2 = self.generator.generate_student(202)

        result = predict(s1, s2)
        probs = result["probabilities"]
        for cls_name in ["High", "Medium", "Low"]:
            self.assertIn(cls_name, probs)
            self.assertGreaterEqual(probs[cls_name], 0.0)
            self.assertLessEqual(probs[cls_name], 1.0)

        prob_sum = sum(probs.values())
        self.assertAlmostEqual(prob_sum, 1.0, delta=0.01)

    def test_08_recommendation_ranking(self):
        """Test 8: Verify multiple candidates can be ranked."""
        target = self.generator.generate_student(300)
        candidates = [self.generator.generate_student(300 + i) for i in range(1, 10)]

        ranked = rank_roommate_candidates(target, candidates, top_n=5)
        self.assertEqual(len(ranked), 5)
        self.assertTrue(all("prediction" in r for r in ranked))
        self.assertTrue(all("rule_based_explainability" in r for r in ranked))

    def test_09_fastapi_direct_prediction_endpoint(self):
        """Test 9: Verify FastAPI endpoint /matching/predict/direct returns valid JSON response."""
        payload = {
            "student_1": {
                "gender": "female",
                "sleep_time": "23:00",
                "wake_time": "07:00",
                "schedule_consistency": 4,
                "study_hours": 5,
                "cleanliness_score": 4,
                "talkativeness": 3,
                "guest_frequency": "sometimes",
            },
            "student_2": {
                "gender": "female",
                "sleep_time": "23:30",
                "wake_time": "07:30",
                "schedule_consistency": 4,
                "study_hours": 4,
                "cleanliness_score": 4,
                "talkativeness": 3,
                "guest_frequency": "rarely",
            }
        }

        response = self.client.post("/matching/predict/direct", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("prediction", data)
        self.assertIn(data["prediction"], ["High", "Medium", "Low"])
        self.assertIn("confidence", data)
        self.assertIn("probabilities", data)
        self.assertIn("feature_signals", data)

    def test_10_invalid_input_handling(self):
        """Test 10: Verify invalid input structures fail loudly."""
        with self.assertRaises(TypeError):
            create_pairwise_features("invalid_type", {})


if __name__ == "__main__":
    unittest.main()

```
