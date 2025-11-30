from pathlib import Path
import numpy as np
import joblib

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "demand_model.pkl"

_model = None


def _load_model():
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model


def predict_demand(day_of_week: int, month: int) -> float:
    """
    Input:
      day_of_week: 0 = Monday ... 6 = Sunday
      month: 1–12
    """
    model = _load_model()
    is_weekend = 1 if day_of_week in (5, 6) else 0

    X = np.array([[day_of_week, is_weekend, month]])
    pred = model.predict(X)[0]
    return float(pred)
