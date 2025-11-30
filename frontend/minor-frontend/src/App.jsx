import { Routes, Route, Link } from "react-router-dom";
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
        <h2 className="sidebar-title">Restaurant AI</h2>
        <nav className="sidebar-nav">
          <Link to="/" className="nav-link">
            Dashboard
          </Link>
          <Link to="/forecast" className="nav-link">
            Forecast
          </Link>
          <Link to="/menu" className="nav-link">
            Menu Insights
          </Link>
          <Link to="/wait-time" className="nav-link">
            Wait Time
          </Link>
          <Link to="/stock" className="nav-link">
           Stock Management
          </Link>
          <Link to="/admin" className="nav-link">
           Admin
          </Link>

        </nav>
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
