import { Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Forecast from "./pages/Forecast.jsx";
import MenuInsights from "./pages/MenuInsights.jsx";
import WaitTime from "./pages/WaitTime.jsx";
import StockManagement from "./pages/StockManagement.jsx";
import AdminData from "./pages/AdminData.jsx";

function App() {
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="sidebar-title">RESTAURANT AI</h2>
        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <span className="nav-icon">📊</span> Dashboard
          </NavLink>
          <NavLink to="/forecast" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <span className="nav-icon">📈</span> Forecast
          </NavLink>
          <NavLink to="/menu" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <span className="nav-icon">🍔</span> Menu Insights
          </NavLink>
          <NavLink to="/wait-time" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <span className="nav-icon">⏳</span> Wait Time
          </NavLink>
          <NavLink to="/stock" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <span className="nav-icon">📦</span> Stock Management
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <span className="nav-icon">🛡️</span> Admin
          </NavLink>
        </nav>
        
        <div style={{ marginTop: "auto", padding: "1rem", opacity: 0.5, fontSize: "0.75rem" }}>
          v2.0.1 Premium AI
        </div>
      </aside>

      {/* Main content */}
      <main className="main-area">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/menu" element={<MenuInsights />} />
          <Route path="/wait-time" element={<WaitTime />} />
          <Route path="/stock" element={<StockManagement />} />
          <Route path="/admin" element={<AdminData />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
