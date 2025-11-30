import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
import joblib
from pathlib import Path

# 1. Load the CSV
data_path = Path("data") / "sales_data.csv"
df = pd.read_csv(data_path)

# 2. Convert date to datetime & create day_of_week feature
df["date"] = pd.to_datetime(df["date"])
df["day_of_week"] = df["date"].dt.weekday  # 0 = Monday, 6 = Sunday

# 3. Inputs (X) and target (y)
X = df[["day_of_week"]]          # feature: day of week
y = df["total_orders"]           # target: how many orders

# 4. Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 5. Train model
model = RandomForestRegressor(random_state=42)
model.fit(X_train, y_train)

# 6. Evaluate (just to check)
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
print("Training complete. MAE =", mae)

# 7. Save model
models_dir = Path("models")
models_dir.mkdir(exist_ok=True)

model_path = models_dir / "demand_model.pkl"
joblib.dump(model, model_path)

print(f"Model saved to {model_path.resolve()}")
