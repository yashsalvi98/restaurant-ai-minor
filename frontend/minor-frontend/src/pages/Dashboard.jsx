import { useState } from "react";
import axios from "axios";

function Dashboard() {
  const [day, setDay] = useState(5);    // default: Friday
  const [month, setMonth] = useState(1); // default: January

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [forecast, setForecast] = useState(null);
  const [topItem, setTopItem] = useState(null);
  const [stockShortages, setStockShortages] = useState([]);

  const backendBase = "http://127.0.0.1:5000";

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError("");
      setForecast(null);
      setTopItem(null);
      setStockShortages([]);

      // Call all three APIs in parallel
      const [forecastRes, itemRes, stockRes] = await Promise.all([
        axios.get(
          `${backendBase}/forecast?day_of_week=${day}&month=${month}`
        ),
        axios.get(
          `${backendBase}/item-forecast?day_of_week=${day}&month=${month}`
        ),
        axios.get(
          `${backendBase}/api/stock-plan?day_of_week=${day}&month=${month}`
        ),
      ]);

      // 1) Total forecast
      setForecast(forecastRes.data);

      // 2) Top item from item-forecast
      const itemsObj = itemRes.data.items || {};
      const sortedItems = Object.entries(itemsObj).sort((a, b) => b[1] - a[1]);
      if (sortedItems.length > 0) {
        setTopItem({
          name: sortedItems[0][0],
          value: sortedItems[0][1],
        });
      }

      // 3) Shortage ingredients from stock-plan
      const plan = stockRes.data.stock_plan || [];
      const shortages = plan.filter((row) => row.need_to_buy > 0);
      setStockShortages(shortages);
    } catch (err) {
      console.error(err);
      setError("Error loading dashboard data. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">AI Restaurant Dashboard</h1>
      <p className="page-subtitle">
        High-level overview powered by demand forecasting, menu insights and stock planning.
      </p>

      {/* Controls */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3>Filters</h3>
        <p className="card-note" style={{ marginBottom: "0.5rem" }}>
          Choose a day of week and month. All cards below will use the same inputs.
        </p>
        <div
          className="form-row"
          style={{ marginTop: "0.5rem", gap: "0.75rem", flexWrap: "wrap" }}
        >
          <label className="label">
            Day of week (0 = Mon, 6 = Sun):
          </label>
          <input
            type="number"
            min="0"
            max="6"
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="input"
          />

          <label className="label">
            Month (1–12):
          </label>
          <input
            type="number"
            min="1"
            max="12"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="input"
          />

          <button
            className="btn"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh Dashboard"}
          </button>
        </div>

        {error && (
          <p className="card-note" style={{ marginTop: "0.5rem", color: "red" }}>
            {error}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div
        className="card"
        style={{
          marginBottom: "1.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Card 1: Total forecast */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3>Forecasted Orders</h3>
          {forecast ? (
            <div style={{ marginTop: "0.5rem" }}>
              <p className="card-note">
                Day {forecast.day_of_week}, Month {forecast.month}
              </p>
              <p style={{ fontSize: "1.8rem", fontWeight: "bold" }}>
                {forecast.predicted_quantity.toFixed(2)}
              </p>
              <p className="card-note">
                Approx. total orders expected for the day.
              </p>
            </div>
          ) : (
            <p className="card-note" style={{ marginTop: "0.5rem" }}>
              No data yet. Click &quot;Refresh Dashboard&quot;.
            </p>
          )}
        </div>

        {/* Card 2: Top item */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3>Top Item by Demand</h3>
          {topItem ? (
            <div style={{ marginTop: "0.5rem" }}>
              <p className="card-note">
                Based on item-wise ML prediction.
              </p>
              <p style={{ fontSize: "1.4rem", fontWeight: "bold" }}>
                {topItem.name}
              </p>
              <p className="card-note">
                Predicted:{" "}
                <strong>{topItem.value.toFixed(1)} orders</strong>
              </p>
            </div>
          ) : (
            <p className="card-note" style={{ marginTop: "0.5rem" }}>
              No item predictions yet.
            </p>
          )}
        </div>

        {/* Card 3: Shortages */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3>Ingredients in Shortage</h3>
          {stockShortages.length > 0 ? (
            <div style={{ marginTop: "0.5rem" }}>
              <p style={{ fontSize: "1.8rem", fontWeight: "bold" }}>
                {stockShortages.length}
              </p>
              <p className="card-note">
                Ingredients where current stock is below required total.
              </p>
              <ul className="card-list" style={{ marginTop: "0.5rem" }}>
                {stockShortages.slice(0, 3).map((row) => (
                  <li key={row.ingredient_id}>
                    {row.ingredient_name} – need{" "}
                    {row.need_to_buy.toFixed(2)} {row.unit}
                  </li>
                ))}
                {stockShortages.length > 3 && (
                  <li>+ more… see full table on Stock page.</li>
                )}
              </ul>
            </div>
          ) : (
            <p className="card-note" style={{ marginTop: "0.5rem" }}>
              No shortages detected for this day & month.
            </p>
          )}
        </div>
      </div>

      {/* Optional: small explanation card */}
      <div className="card">
        <h3>How this Dashboard Works</h3>
        <ul className="card-list">
          <li>
            <strong>Forecasted Orders</strong> uses the total-demand XGBoost model
            trained on real restaurant sales data.
          </li>
          <li>
            <strong>Top Item by Demand</strong> comes from the item-wise XGBoost
            model, predicting popularity for each menu item.
          </li>
          <li>
            <strong>Ingredients in Shortage</strong> are calculated by combining
            item predictions with recipe mappings and current stock from the DB.
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;
