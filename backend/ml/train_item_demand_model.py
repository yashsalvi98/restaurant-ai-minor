import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_absolute_error
from xgboost import XGBRegressor
import joblib

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "hotel_restaurant_orders.csv"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)


def load_and_prepare():
    df = pd.read_csv(DATA_PATH)

    # Normalise column names
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    # Expected after this:
    # orderid, customerid, customername, orderdate, restauranttype,
    # menucategory, itemname, quantity, unitprice, totalprice,
    # paymentmethod, servername, tablenumber, dayofweek, timeofday, specialrequest

    # Parse date
    if "orderdate" in df.columns:
        df["orderdate"] = pd.to_datetime(df["orderdate"])
        df["date"] = df["orderdate"].dt.date
        df["month"] = df["orderdate"].dt.month
    else:
        # fallback if csv already has "date"
        df["date"] = pd.to_datetime(df["date"]).dt.date
        df["month"] = pd.to_datetime(df["date"]).dt.month

    # Ensure we have numeric day-of-week: 0–6 (Mon–Sun)
    if "dayofweek" in df.columns:
        # if strings like "Monday", map them; if already numeric, keep
        if df["dayofweek"].dtype == "object":
            mapping = {
                "monday": 0,
                "tuesday": 1,
                "wednesday": 2,
                "thursday": 3,
                "friday": 4,
                "saturday": 5,
                "sunday": 6,
            }
            df["day_of_week"] = df["dayofweek"].str.lower().map(mapping)
        else:
            df["day_of_week"] = df["dayofweek"].astype(int)
    else:
        # compute from date
        df["day_of_week"] = pd.to_datetime(df["date"]).dt.weekday

    df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)

    # Clean item names
    df["item_name"] = df["itemname"].str.strip()

    # Aggregate: per date, per day_of_week, per item_name
    agg = (
        df.groupby(["date", "day_of_week", "is_weekend", "month", "item_name"])["quantity"]
        .sum()
        .reset_index()
    )

    # Pivot to wide format: one column per item
    pivot = agg.pivot_table(
        index=["date", "day_of_week", "is_weekend", "month"],
        columns="item_name",
        values="quantity",
        fill_value=0.0,
    ).reset_index()

    # List of item columns
    item_cols = [c for c in pivot.columns if c not in ["date", "day_of_week", "is_weekend", "month"]]

    X = pivot[["day_of_week", "is_weekend", "month"]]
    y = pivot[item_cols]

    return X, y, item_cols


def train():
    X, y, item_cols = load_and_prepare()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )

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

    y_pred = model.predict(X_test)
    mae_per_item = mean_absolute_error(y_test, y_pred, multioutput="raw_values")

    print("Item-wise demand model (XGBoost)")
    for name, mae in zip(item_cols, mae_per_item):
        print(f"MAE for {name}: {mae:.3f}")

    # Save both model + item column order together
    bundle = {"model": model, "items": item_cols}
    joblib.dump(bundle, MODELS_DIR / "item_demand_model.pkl")
    print("✅ Saved models/item_demand_model.pkl")


if __name__ == "__main__":
    train()
