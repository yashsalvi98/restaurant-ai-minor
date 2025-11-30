import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from xgboost import XGBRegressor
import joblib


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "restaurant_sales_data.csv"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)


def load_and_prepare():
    df = pd.read_csv(DATA_PATH)

    # Normalise column names -> lowercase, underscores
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    # Expected now: order_id, datetime, customer_id, num_items, items,
    # order_value, delivery_time_minutes, order_type, payment_method,
    # day_of_week, hour, is_peak_hour, customer_rating, is_weekend, month

    # ---- parse datetime & create date ----
    if "datetime" in df.columns:
        df["datetime"] = pd.to_datetime(df["datetime"])
        df["date"] = df["datetime"].dt.date
    elif "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"]).dt.date
    else:
        raise ValueError("No datetime/date column found in restaurant_sales_data.csv")

    # ---- aggregate per day ----
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

    # ---- make sure all feature columns are numeric ----

    # 1) day_of_week might be names like "Tuesday"
    if daily["day_of_week"].dtype == "object":
        dow_map = {
            "monday": 0,
            "tuesday": 1,
            "wednesday": 2,
            "thursday": 3,
            "friday": 4,
            "saturday": 5,
            "sunday": 6,
        }
        daily["day_of_week"] = (
            daily["day_of_week"]
            .astype(str)
            .str.strip()
            .str.lower()
            .map(dow_map)
        )

    # 2) is_weekend & month might be strings
    for col in ["is_weekend", "month"]:
        daily[col] = pd.to_numeric(daily[col], errors="coerce")

    # Fill any NaNs (just in case) and cast to int
    daily["is_weekend"] = daily["is_weekend"].fillna(0).astype(int)
    daily["month"] = daily["month"].fillna(1).astype(int)

    # Final feature matrix (X) and target (y)
    X = daily[["day_of_week", "is_weekend", "month"]].astype(float)
    y = daily["total_orders"].astype(float)

    return X, y



def train():
    X, y = load_and_prepare()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )

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
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print("Total demand model (XGBoost)")
    print("MAE:", mae)
    print("R2 :", r2)

    joblib.dump(model, MODELS_DIR / "demand_model.pkl")
    print("✅ Saved models/demand_model.pkl")


if __name__ == "__main__":
    train()
