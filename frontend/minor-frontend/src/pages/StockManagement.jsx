import { useState } from "react";
import axios from "axios";

function StockManagement() {
  const [forecastDay, setForecastDay] = useState(5); // default Friday
  const [month, setMonth] = useState(1); // 1–12
  const [loading, setLoading] = useState(false);

  const [itemPredictions, setItemPredictions] = useState(null);
  const [stockPlan, setStockPlan] = useState(null);

  const handleFetchStockPlan = async () => {
    try {
      setLoading(true);
      setItemPredictions(null);
      setStockPlan(null);

      const res = await axios.get(
        `http://127.0.0.1:5000/api/stock-plan?day_of_week=${forecastDay}&month=${month}`
      );

      setItemPredictions(res.data.item_predictions);
      setStockPlan(res.data.stock_plan);
    } catch (error) {
      console.error(error);
      alert("Error calling /api/stock-plan. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Inventory Planning</h1>
      <p className="page-subtitle">
        Requirement analysis based on projected customer demand.
      </p>

      {/* Configuration */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <h3>Planning Parameters</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Day of Week (0-6)</label>
            <input
              type="number"
              min="0"
              max="6"
              value={forecastDay}
              onChange={(e) => setForecastDay(Number(e.target.value))}
              className="input"
            />
          </div>

          <div className="form-group">
            <label className="label">Month (1-12)</label>
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
            onClick={handleFetchStockPlan}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Generate Analysis"}
          </button>
        </div>
      </div>

      {/* Metrics */}
      {itemPredictions && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {Object.entries(itemPredictions).map(([name, value]) => (
            <div className="card" key={name}>
              <div className="label">{name}</div>
              <div className="card-number" style={{ fontSize: "1.5rem" }}>{value.toFixed(0)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Data Table */}
      <div className="card">
        <h3>Ingredient Requirements</h3>
        
        {!stockPlan && (
          <p className="card-note">
            Define parameters above to generate a procurement strategy.
          </p>
        )}

        {stockPlan && (
          <div className="table-container" style={{ marginTop: "1rem" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>On Hand</th>
                  <th>Required</th>
                  <th>Procure</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stockPlan.map((row) => (
                  <tr key={row.ingredient_id}>
                    <td style={{ fontWeight: "500" }}>{row.ingredient_name}</td>
                    <td>{row.current_stock.toFixed(1)} {row.unit}</td>
                    <td>{row.required_total.toFixed(1)} {row.unit}</td>
                    <td>
                      {row.need_to_buy > 0 ? (
                        <span style={{ color: "var(--accent-red)", fontWeight: "600" }}>
                          {row.need_to_buy.toFixed(1)} {row.unit}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {row.need_to_buy > 0 ? (
                        <span className="tag tag-alert">Shortage</span>
                      ) : (
                        <span className="tag tag-ok">Optimized</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default StockManagement;
