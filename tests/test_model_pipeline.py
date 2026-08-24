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
