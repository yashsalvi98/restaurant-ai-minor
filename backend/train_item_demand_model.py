import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_absolute_error
from xgboost import XGBRegressor
import joblib

# 1. Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "hotel_restaurant_orders.csv"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

def load_and_prepare():
    df = pd.read_csv(DATA_PATH)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    if "orderdate" in df.columns:
        df["orderdate"] = pd.to_datetime(df["orderdate"])
        df["date"] = df["orderdate"].dt.date
        df["month"] = df["orderdate"].dt.month
    else:
        df["date"] = pd.to_datetime(df["date"]).dt.date
        df["month"] = pd.to_datetime(df["date"]).dt.month

    if "dayofweek" in df.columns:
        if df["dayofweek"].dtype == "object":
            mapping = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6}
            df["day_of_week"] = df["dayofweek"].str.lower().map(mapping)
        else:
            df["day_of_week"] = df["dayofweek"].astype(int)
    else:
        df["day_of_week"] = pd.to_datetime(df["date"]).dt.weekday

    df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)
    df["item_name"] = df["itemname"].str.strip()

    agg = (
        df.groupby(["date", "day_of_week", "is_weekend", "month", "item_name"])["quantity"]
        .sum()
        .reset_index()
    )

    pivot = agg.pivot_table(
        index=["date", "day_of_week", "is_weekend", "month"],
        columns="item_name",
        values="quantity",
        fill_value=0.0,
    ).reset_index()

    item_cols = [c for c in pivot.columns if c not in ["date", "day_of_week", "is_weekend", "month"]]
    X = pivot[["day_of_week", "is_weekend", "month"]]
    y = pivot[item_cols]

    return X, y, item_cols

def train():
    X, y, item_cols = load_and_prepare()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

    base_model = XGBRegressor(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="reg:squarederror",
        random_state=42,
    )

    model = MultiOutputRegressor(base_model)
    model.fit(X_train, y_train)

    print("Item-wise demand model (XGBoost) trained.")
    
    bundle = {"model": model, "items": item_cols}
    joblib.dump(bundle, MODELS_DIR / "item_demand_model.pkl")
    print(f"Saved {MODELS_DIR / 'item_demand_model.pkl'}")

if __name__ == "__main__":
    train()
