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
      <h1 className="page-title">Stock Management</h1>
      <p className="page-subtitle">
        AI-powered ingredient planning based on predicted item-wise demand and
        recipe mapping from the database.
      </p>

      {/* Controls */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3>Generate Stock Plan</h3>
        <p className="card-note" style={{ marginBottom: "0.5rem" }}>
          Choose a day of the week and month. The backend will:
          <br />
          1) Predict demand for each menu item using the ML model, and
          <br />
          2) Convert that into ingredient requirements using recipes stored in the database.
        </p>

        <div className="form-row" style={{ marginTop: "0.5rem", gap: "0.75rem" }}>
          <label className="label">
            Day of week (0 = Mon, 6 = Sun):
          </label>
          <input
            type="number"
            min="0"
            max="6"
            value={forecastDay}
            onChange={(e) => setForecastDay(Number(e.target.value))}
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
            onClick={handleFetchStockPlan}
            disabled={loading}
          >
            {loading ? "Calculating..." : "Generate AI Stock Plan"}
          </button>
        </div>
      </div>

      {/* Item-wise predictions */}
      {itemPredictions && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3>Predicted Item Demand</h3>
          <p className="card-note" style={{ marginBottom: "0.5rem" }}>
            These values come directly from the item-demand ML model in the backend.
          </p>
          <ul className="card-list">
            {Object.entries(itemPredictions).map(([name, value]) => (
              <li key={name}>
                <strong>{name}</strong>: {value.toFixed(1)} orders
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ingredient stock plan table */}
      <div className="card">
        <h3>Ingredient Requirements & Purchase Plan</h3>
        {!stockPlan && (
          <p className="card-note" style={{ marginTop: "0.5rem" }}>
            No stock plan yet. Choose a day & month and click
            &quot;Generate AI Stock Plan&quot;.
          </p>
        )}

        {stockPlan && (
          <>
            <p className="card-note" style={{ marginTop: "0.5rem" }}>
              Backend has combined ML predictions with recipe data to compute
              required ingredients and suggested purchase quantities.
            </p>

            <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>Current Stock</th>
                    <th>Required Total</th>
                    <th>Need to Buy</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stockPlan.map((row) => (
                    <tr key={row.ingredient_id}>
                      <td>{row.ingredient_name}</td>
                      <td>
                        {row.current_stock.toFixed(2)} {row.unit}
                      </td>
                      <td>
                        {row.required_total.toFixed(2)} {row.unit}
                      </td>
                      <td>
                        {row.need_to_buy > 0
                          ? `${row.need_to_buy.toFixed(2)} ${row.unit}`
                          : "-"}
                      </td>
                      <td>
                        {row.need_to_buy > 0 ? (
                          <span className="tag tag-alert">Buy More</span>
                        ) : (
                          <span className="tag tag-ok">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Future enhancements */}
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h3>Future Enhancements</h3>
        <ul className="card-list">
          <li>Allow editing current stock from this screen and update the database.</li>
          <li>Generate downloadable purchase order PDFs based on &quot;Need to Buy&quot; column.</li>
          <li>Support multiple branches / outlets with separate stock plans.</li>
        </ul>
      </div>
    </div>
  );
}

export default StockManagement;
