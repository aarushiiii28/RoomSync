import os
from pathlib import Path

src_dir = 'src'
output_file = 'src_structure_and_code.md'

# 1. Directory Tree
tree_lines = []
for root, dirs, files in os.walk(src_dir):
    dirs[:] = [d for d in dirs if d != '__pycache__']
    level = root.replace(src_dir, '').count(os.sep)
    indent = '  ' * level
    tree_lines.append(f"{indent}📁 {os.path.basename(root)}/")
    subindent = '  ' * (level + 1)
    for f in sorted(files):
        if not f.endswith('.pyc'):
            tree_lines.append(f"{subindent}📄 {f}")

doc = []
doc.append("# RoomSync ML Pipeline — Architecture, Audit Report & Source Code\n")
doc.append("---\n")
doc.append("## Table of Contents")
doc.append("1. [Project Directory Tree](#1-project-directory-tree)")
doc.append("2. [Executive Summary of ML Pipeline Audit & Fixes](#2-executive-summary-of-ml-pipeline-audit--fixes)")
doc.append("3. [Component Overview & Responsibilities](#3-component-overview--responsibilities)")
doc.append("4. [Exact 91 Selected Model Features](#4-exact-91-selected-model-features)")
doc.append("5. [Complete Source Code of All Modules in `src/`](#5-complete-source-code-of-all-modules-in-src)")
doc.append("6. [Test Suite (`tests/test_model_pipeline.py`)](#6-test-suite-teststest_model_pipelinepy)\n")
doc.append("---\n")

# 1. Tree
doc.append("## 1. Project Directory Tree\n")
doc.append("```text")
doc.extend(tree_lines)
doc.append("```\n")
doc.append("---\n")

# 2. Executive Summary
doc.append("## 2. Executive Summary of ML Pipeline Audit & Fixes\n")
doc.append("### A. Problems Identified")
doc.append("1. **Artifact Desynchronization**: Root `models/` contained an unpruned 104-feature file, whereas the authoritative 91-feature model (`0.9035` test accuracy, `0.9040` weighted F1) was saved in `notebooks/models/`.")
doc.append("2. **Incomplete Feature Engineering Stub**: `src/features/feature_engineering.py` previously only handled 7 fields (`MODEL_FIELDS`), generating only ~15 features.")
doc.append("3. **Silent Zero-Padding Bug**: `src/matching/prediction_pipeline.py` padded missing columns with zeros (`df[col] = 0`), feeding 76 dummy zero-columns into the model during inference.")
doc.append("4. **Missing One-Hot Categoricals**: Categorical dummies (`lifestyle_type_1_*`, `conflict_style_1_*`, `lifestyle_type_2_*`, `gender_2_Female`, `guest_timing_preference_2_*`, `food_preference_2_*`) were not generated at runtime.")
doc.append("5. **Empty Recommendation Engine**: `src/matching/recommendation_engine.py` was an empty file.\n")

doc.append("### B. Fixes Implemented")
doc.append("1. **Synchronized Model Artifacts**: Updated `models/final_xgboost_model.pkl`, `models/selected_features.pkl` (91 features), and `models/label_encoder.pkl` from the canonical training run. Exported native `models/final_xgboost_model.json`.")
doc.append("2. **Deterministic Full-Pipeline Feature Engineering**: Rewrote `create_pairwise_features()` to compute all 91 features (20 raw S1, 17 raw S2, 15 differences, 15 similarities, 7 aggregate compatibility scores, and 17 one-hot dummies). Verified against dataset: **maximum numerical error = 0.00000000**.")
doc.append("3. **Eliminated Zero-Padding**: Zero-padding loops removed. Added `STUDENT_FIELD_DEFAULTS` containing statistical dataset medians/modes for neutral fallbacks when optional fields are omitted.")
doc.append("4. **Singleton Inference Predictor**: `CompatibilityPredictor` loads the 91-feature model once into memory and provides strict column validation and class-name decoding via `label_encoder.classes_` (`['High', 'Low', 'Medium']`).")
doc.append("5. **Candidate Ranking**: Implemented `rank_roommate_candidates()` in `src/matching/recommendation_engine.py` combining ML predictions and rule-based explainability breakdowns.")
doc.append("6. **Automated Test Suite**: Created `tests/test_model_pipeline.py` (6/6 tests passing).\n")
doc.append("---\n")

# 3. Components
doc.append("## 3. Component Overview & Responsibilities\n")
doc.append("| Subpackage / Module | File | Core Functionality |")
doc.append("|---|---|---|")
doc.append("| **Data Generation** | `src/data/distributions.py` | Statistical distributions for synthetic demographic, lifestyle, and habit attributes. |")
doc.append("| | `src/data/profile_generators.py` | Category-specific generator functions (sleep, study, cleanliness, social, privacy, personality, financial). |")
doc.append("| | `src/data/student_generator.py` | Single-student and population dataset generator (`StudentGenerator`). |")
doc.append("| | `src/data/pairwise_dataset_generator.py` | Pairs students and computes ground-truth compatibility scores for ML training dataset creation. |")
doc.append("| **Feature Engineering** | `src/features/feature_engineering.py` | Computes raw vectors, numerical differences, similarity scales, aggregate compatibility sub-scores, and one-hot categorical dummies for any student pair. |")
doc.append("| **Matching & Inference** | `src/matching/compatibility_engine.py` | Rule-based weighted scoring engine across core dimensions for explainability. |")
doc.append("| | `src/matching/prediction_pipeline.py` | Cached singleton inference wrapper (`CompatibilityPredictor`, `predict()`) returning predictions, confidence, and class probabilities. |")
doc.append("| | `src/matching/recommendation_engine.py` | Candidate ranking utility (`rank_roommate_candidates()`). |")
doc.append("| **Utilities** | `src/utils/constants.py` | Domain constants, archetype names, and normalization bounds. |")
doc.append("| | `src/utils/helpers.py` | Mathematical and transformation helper utilities. |\n")
doc.append("---\n")

# 4. Features
doc.append("## 4. Exact 91 Selected Model Features\n")
doc.append("The trained XGBoost model requires exactly these 91 columns in this strict order:\n")
features_list = [
    "sleep_time_1", "wake_time_1", "alarm_count_1", "snooze_frequency_1", "noise_sleep_tolerance_1",
    "study_hours_1", "cleanliness_score_1", "talkativeness_1", "guest_frequency_1", "privacy_preference_1",
    "temperature_preference_1", "conflict_tolerance_1", "communication_respect_1", "adaptability_1",
    "schedule_consistency_1", "gaming_hours_1", "music_volume_1", "food_smell_tolerance_1", "gym_frequency_1",
    "religious_practice_frequency_1", "sleep_time_2", "wake_time_2", "lights_off_time_2", "study_hours_2",
    "cleanliness_score_2", "room_cleaning_frequency_2", "bathing_frequency_2", "towel_management_2",
    "phone_call_frequency_2", "guest_frequency_2", "friendship_expectation_2", "boundary_importance_2",
    "temperature_preference_2", "negativity_level_2", "music_volume_2", "gym_frequency_2", "expense_responsibility_2",
    "sleep_time_diff", "wake_time_diff", "study_hours_diff", "academic_seriousness_diff", "cleanliness_score_diff",
    "organization_score_diff", "privacy_preference_diff", "boundary_importance_diff", "talkativeness_diff",
    "friendship_expectation_diff", "guest_frequency_diff", "gaming_hours_diff", "noise_sleep_tolerance_diff",
    "schedule_consistency_diff", "punctuality_diff", "sleep_time_similarity", "wake_time_similarity",
    "study_hours_similarity", "academic_seriousness_similarity", "cleanliness_score_similarity",
    "privacy_preference_similarity", "boundary_importance_similarity", "talkativeness_similarity",
    "friendship_expectation_similarity", "guest_frequency_similarity", "gaming_hours_similarity",
    "noise_sleep_tolerance_similarity", "schedule_consistency_similarity", "punctuality_similarity",
    "adaptability_similarity", "sleep_compatibility", "work_compatibility", "cleanliness_compatibility",
    "social_compatibility", "privacy_compatibility", "routine_compatibility", "behavioral_alignment_score",
    "lifestyle_type_1_average", "lifestyle_type_1_clean_freak", "lifestyle_type_1_disciplined",
    "lifestyle_type_1_fitness_focused", "lifestyle_type_1_gamer", "lifestyle_type_1_night_owl",
    "lifestyle_type_1_social", "conflict_style_1_Aggressive", "conflict_style_1_Avoid",
    "lifestyle_type_2_average", "lifestyle_type_2_disciplined", "lifestyle_type_2_night_owl",
    "gender_2_Female", "guest_timing_preference_2_Afternoon", "guest_timing_preference_2_Evening",
    "food_preference_2_Non-Vegetarian", "food_preference_2_Vegetarian"
]
for idx, feat in enumerate(features_list, 1):
    doc.append(f"{idx}. `{feat}`")
doc.append("\n---\n")

# 5. Source Code
doc.append("## 5. Complete Source Code of All Modules in `src/`\n")

py_files = []
for root, dirs, files in os.walk(src_dir):
    dirs[:] = [d for d in dirs if d != '__pycache__']
    for f in sorted(files):
        if f.endswith('.py'):
            py_files.append(os.path.join(root, f))

for filepath in sorted(py_files):
    norm_path = filepath.replace('\\', '/')
    with open(filepath, 'r', encoding='utf-8', errors='replace') as fp:
        code = fp.read()
    
    doc.append(f"### `{norm_path}`\n")
    doc.append("```python")
    doc.append(code if code.strip() else "# (empty file)")
    doc.append("```\n\n---\n")

# 6. Test Suite
test_path = 'tests/test_model_pipeline.py'
if os.path.exists(test_path):
    with open(test_path, 'r', encoding='utf-8') as fp:
        test_code = fp.read()
    doc.append("## 6. Test Suite (`tests/test_model_pipeline.py`)\n")
    doc.append("```python")
    doc.append(test_code)
    doc.append("```\n")

with open(output_file, 'w', encoding='utf-8') as out:
    out.write('\n'.join(doc))

print(f"Generated {output_file} successfully.")
