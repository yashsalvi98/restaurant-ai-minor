import { useState } from "react";
import axios from "axios";

function MenuInsights() {
  const [day, setDay] = useState(5);   // 0–6
  const [month, setMonth] = useState(1); // 1–12
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    try {
      setLoading(true);
      setPredictions(null);

      const res = await axios.get(
        `http://127.0.0.1:5000/item-forecast?day_of_week=${day}&month=${month}`
      );

      // res.data.items is an object like { pizza: x, burger: y, ... }
      setPredictions(res.data.items);
    } catch (error) {
      console.error(error);
      alert("Error calling /item-forecast. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Convert predictions object → sorted array for display
  const sortedItems = predictions
    ? Object.entries(predictions).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="page">
      <h1 className="page-title">Menu Insights</h1>
      <p className="page-subtitle">
        AI-based prediction of demand for each menu item, for a chosen day and month.
      </p>

      {/* Controls */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3>Choose Day & Month</h3>
        <p className="card-note" style={{ marginBottom: "0.5rem" }}>
          Day of week: 0 = Monday, 6 = Sunday. The model also uses the month to
          learn seasonal patterns (festive months, holidays, etc.).
        </p>

        <div className="form-row" style={{ marginTop: "0.5rem", gap: "0.75rem" }}>
          <label className="label">Day of week:</label>
          <input
            type="number"
            min="0"
            max="6"
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="input"
          />

          <label className="label">Month (1–12):</label>
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
            onClick={handleFetch}
            disabled={loading}
          >
            {loading ? "Fetching..." : "Get AI Prediction"}
          </button>
        </div>
      </div>

      {/* Predicted demand table */}
      <div className="card">
        <h3>Predicted Demand by Item</h3>
        {!predictions && (
          <p className="card-note" style={{ marginTop: "0.5rem" }}>
            No data yet. Choose a day and month and click &quot;Get AI Prediction&quot;
            to see item-wise demand.
          </p>
        )}

        {predictions && (
          <>
            <p className="card-note" style={{ marginTop: "0.5rem" }}>
              Sorted from highest to lowest predicted demand.
            </p>

            <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Item</th>
                    <th>Predicted Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map(([name, value], index) => (
                    <tr key={name}>
                      <td>#{index + 1}</td>
                      <td>{name}</td>
                      <td>{value.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* AI Recommendations based on prediction */}
      {predictions && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <h3>AI Recommendations</h3>
          <ul className="card-list">
            {sortedItems[0] && (
              <li>
                <strong>{sortedItems[0][0]}</strong> has the highest predicted
                demand. Consider highlighting it on the menu or running a combo offer.
              </li>
            )}
            {sortedItems[sortedItems.length - 1] && (
              <li>
                <strong>{sortedItems[sortedItems.length - 1][0]}</strong> has
                the lowest predicted demand. Consider discounts, bundling or even
                temporary removal.
              </li>
            )}
            <li>
              Use these predictions to adjust ingredient purchasing and preparation
              quantity to reduce food waste.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default MenuInsights;
