from pathlib import Path
import numpy as np
import joblib

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "item_demand_model.pkl"

_bundle = None


def _load_bundle():
    global _bundle
    if _bundle is None:
        _bundle = joblib.load(MODEL_PATH)
    return _bundle["model"], _bundle["items"]


def predict_item_demand(day_of_week: int, month: int) -> dict:
    """
    Input:
      day_of_week: 0–6
      month: 1–12
    Output:
      { item_name: predicted_quantity }
    """
    model, item_cols = _load_bundle()
    is_weekend = 1 if day_of_week in (5, 6) else 0

    X = np.array([[day_of_week, is_weekend, month]])
    preds = model.predict(X)[0]

    return {name: float(val) for name, val in zip(item_cols, preds)}
