import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from xgboost import XGBRegressor
import joblib

# 1. Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "restaurant_sales_data.csv"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

def load_and_prepare():
    df = pd.read_csv(DATA_PATH)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    if "datetime" in df.columns:
        df["datetime"] = pd.to_datetime(df["datetime"])
        df["date"] = df["datetime"].dt.date
    elif "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"]).dt.date
    else:
        raise ValueError("No datetime/date column found in restaurant_sales_data.csv")

    daily = (
        df.groupby("date")
        .agg(
            total_orders=("order_id", "count"),
            total_sales=("order_value", "sum"),
            total_items=("num_items", "sum"),
            day_of_week=("day_of_week", "max"),
            is_weekend=("is_weekend", "max"),
            month=("month", "max"),
        )
        .reset_index()
    )

    if daily["day_of_week"].dtype == "object":
        dow_map = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6}
        daily["day_of_week"] = daily["day_of_week"].astype(str).str.strip().str.lower().map(dow_map)

    for col in ["is_weekend", "month"]:
        daily[col] = pd.to_numeric(daily[col], errors="coerce")

    daily["is_weekend"] = daily["is_weekend"].fillna(0).astype(int)
    daily["month"] = daily["month"].fillna(1).astype(int)

    X = daily[["day_of_week", "is_weekend", "month"]].astype(float)
    y = daily["total_orders"].astype(float)

    return X, y

def train():
    X, y = load_and_prepare()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

    model = XGBRegressor(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="reg:squarederror",
        random_state=42,
    )

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    print("Total demand model (XGBoost) MAE:", mean_absolute_error(y_test, y_pred))

    joblib.dump(model, MODELS_DIR / "demand_model.pkl")
    print(f"Saved {MODELS_DIR / 'demand_model.pkl'}")

if __name__ == "__main__":
    train()
