import { useState } from "react";

function WaitTime() {
  const [numItems, setNumItems] = useState(1);
  const [timeOfDay, setTimeOfDay] = useState("normal"); // normal, lunch, dinner
  const [queueSize, setQueueSize] = useState(0);
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    // Simple dummy logic for now
    let base = 5; // base time in minutes

    // More items → more time
    const itemsTime = numItems * 2;

    // Bigger queue → more delay
    const queueTime = queueSize * 3;

    // Lunch / dinner rush
    let peakExtra = 0;
    if (timeOfDay === "lunch" || timeOfDay === "dinner") {
      peakExtra = 8;
    }

    const totalMinutes = base + itemsTime + queueTime + peakExtra;

    let status = "Normal load";
    if (totalMinutes > 30) status = "High load – consider informing customers";
    else if (totalMinutes > 20) status = "Moderate load";

    setResult({
      minutes: totalMinutes,
      status,
    });
  };

  return (
    <div className="page">
      <h1 className="page-title">Wait Time Estimator</h1>
      <p className="page-subtitle">
        Estimate how long a customer might wait based on order size and current load.
      </p>

      <div className="card">
        <div className="form-column">
          <div className="form-row">
            <label className="label">Number of items in this order:</label>
            <input
              type="number"
              min="1"
              value={numItems}
              onChange={(e) => setNumItems(Number(e.target.value))}
              className="input"
            />
          </div>

          <div className="form-row">
            <label className="label">Time of day:</label>
            <select
              className="input"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
            >
              <option value="normal">Normal hours</option>
              <option value="lunch">Lunch peak</option>
              <option value="dinner">Dinner peak</option>
            </select>
          </div>

          <div className="form-row">
            <label className="label">Current queue size (active orders):</label>
            <input
              type="number"
              min="0"
              value={queueSize}
              onChange={(e) => setQueueSize(Number(e.target.value))}
              className="input"
            />
          </div>

          <button className="btn" style={{ marginTop: "0.8rem" }} onClick={handleCalculate}>
            Calculate Wait Time
          </button>
        </div>

        {result && (
          <div className="result-box" style={{ marginTop: "1rem" }}>
            <h3>Estimated Wait Time</h3>
            <p>
              <strong>Approximate time:</strong> {result.minutes.toFixed(1)} minutes
            </p>
            <p>
              <strong>Status:</strong> {result.status}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default WaitTime;
