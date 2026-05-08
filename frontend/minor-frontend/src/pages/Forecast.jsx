import { useState } from "react";
import axios from "axios";

function Forecast() {
  const [day, setDay] = useState(0);     // 0–6
  const [month, setMonth] = useState(1); // 1–12
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    try {
      setLoading(true);
      setResult(null);

      const res = await axios.get(
        `http://127.0.0.1:5000/forecast?day_of_week=${day}&month=${month}`
      );

      setResult(res.data);
    } catch (error) {
      console.error(error);
      alert("Error calling backend. Check if Flask is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Demand Forecast</h1>
      <p className="page-subtitle">
        Predict order volumes based on temporal variables.
      </p>

      <div className="card">
        <h3>Input Parameters</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Day of Week (0-6)</label>
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

          <button className="btn" onClick={handlePredict} disabled={loading}>
            {loading ? "Processing..." : "Run Forecast"}
          </button>
        </div>

        {result && (
          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-color)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <div className="label">Predicted Orders</div>
                <div className="card-number">{result.predicted_quantity.toFixed(0)}</div>
              </div>
              <div>
                <div className="label">Forecast Reliability</div>
                <div className="card-number" style={{ color: "var(--accent-green)" }}>High</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Forecast;
