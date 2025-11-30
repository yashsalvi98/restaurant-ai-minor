import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_absolute_error
import joblib
from pathlib import Path

# 1. Load the CSV
data_path = Path("data") / "item_sales_data.csv"
df = pd.read_csv(data_path)

# 2. Convert date to datetime & create day_of_week feature
df["date"] = pd.to_datetime(df["date"])
df["day_of_week"] = df["date"].dt.weekday  # 0 = Monday, 6 = Sunday

# 3. Features (X) and Targets (y)
X = df[["day_of_week"]]   # input: which day
y = df[["pizza", "burger", "pasta", "fries"]]  # outputs: item-wise demand

# 4. Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 5. Multi-output regression model
base_model = RandomForestRegressor(random_state=42)
model = MultiOutputRegressor(base_model)

model.fit(X_train, y_train)

# 6. Evaluate
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred, multioutput="raw_values")

print("MAE per item [pizza, burger, pasta, fries]:", mae)

# 7. Save the model
models_dir = Path("models")
models_dir.mkdir(exist_ok=True)

model_path = models_dir / "item_demand_model.pkl"
joblib.dump(model, model_path)

print(f"Item demand model saved to {model_path.resolve()}")
