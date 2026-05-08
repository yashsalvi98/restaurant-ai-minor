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
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">
        Overview of forecasted demand and inventory requirements.
      </p>

      {/* Configuration */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <h3>Report Parameters</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Day of Week</label>
            <input
              type="number"
              min="0"
              max="6"
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="input"
            />
          </div>

          <div className="form-group">
            <label className="label">Month</label>
            <input
              type="number"
              min="1"
              max="12"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="input"
            />
          </div>

          <button
            className="btn"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? "Updating..." : "Generate Report"}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem"
        }}
      >
        <div className="card">
          <h3>Total Forecasted Orders</h3>
          {forecast ? (
            <div>
              <div className="card-number">{forecast.predicted_quantity.toFixed(0)}</div>
              <p className="card-note">Expected for the selected period</p>
            </div>
          ) : (
            <p className="card-note">No data generated</p>
          )}
        </div>

        <div className="card">
          <h3>Top Item Demand</h3>
          {topItem ? (
            <div>
              <div className="card-number" style={{ fontSize: "1.5rem" }}>{topItem.name}</div>
              <p className="card-note">{topItem.value.toFixed(0)} units projected</p>
            </div>
          ) : (
            <p className="card-note">No data generated</p>
          )}
        </div>

        <div className="card">
          <h3>Stock Shortages</h3>
          {stockShortages.length > 0 ? (
            <div>
              <div className="card-number" style={{ color: "var(--accent-red)" }}>
                {stockShortages.length}
              </div>
              <p className="card-note">Items require replenishment</p>
            </div>
          ) : (
            <div>
              <div className="card-number" style={{ color: "var(--accent-green)" }}>0</div>
              <p className="card-note">All stock levels optimized</p>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ background: "#f8fafc" }}>
        <h3>System Status</h3>
        <p className="card-note">
          Demand models are currently operating on XGBoost v3.1.2. Forecast accuracy is calculated based on 
          historical sales trends from the connected database.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
