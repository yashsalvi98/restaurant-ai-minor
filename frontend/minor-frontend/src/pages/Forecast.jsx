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
        Predict total number of orders for a specific day & month.
      </p>

      <div className="card">
        <div className="form-row" style={{ marginBottom: "1rem" }}>
          {/* DAY INPUT */}
          <label className="label" htmlFor="day-input">
            Day of week (0 = Monday, 6 = Sunday):
          </label>
          <input
            id="day-input"
            type="number"
            min="0"
            max="6"
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="input"
          />
        </div>

        <div className="form-row" style={{ marginBottom: "1rem" }}>
          {/* MONTH INPUT */}
          <label className="label" htmlFor="month-input">
            Month (1–12):
          </label>
          <input
            id="month-input"
            type="number"
            min="1"
            max="12"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="input"
          />
        </div>

        <button className="btn" onClick={handlePredict} disabled={loading}>
          {loading ? "Predicting..." : "Predict"}
        </button>

        {result && (
          <div className="result-box" style={{ marginTop: "1.5rem" }}>
            <h3>Prediction Result</h3>
            <p>
              <strong>Day of week:</strong> {result.day_of_week}
            </p>
            <p>
              <strong>Month:</strong> {result.month}
            </p>
            <p>
              <strong>Predicted total orders:</strong>{" "}
              {result.predicted_quantity.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Forecast;
