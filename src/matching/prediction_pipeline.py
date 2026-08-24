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