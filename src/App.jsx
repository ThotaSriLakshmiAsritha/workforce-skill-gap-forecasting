import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import EmployeeProfile from './components/EmployeeProfile';
import RecommendationEngine from './components/RecommendationEngine';
import TechTrends from './components/TechTrends';
import AdminView from './components/AdminView';
import ForecastingEngine from './components/ForecastingEngine';

function AppLayout() {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();

  // If on landing page, render without sidebar
  if (location.pathname === '/') {
    return (
      <div className="dark">
        <LandingPage />
      </div>
    );
  }

  return (
    <div className="dark">
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
        {/* Sidebar */}
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar
            sidebarCollapsed={collapsed}
            setSidebarCollapsed={setCollapsed}
            notifications={7}
          />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analyzer" element={<EmployeeProfile />} />
              <Route path="/pathways" element={<RecommendationEngine />} />
              <Route path="/trends" element={<TechTrends />} />
              <Route path="/admin" element={<AdminView />} />
              <Route path="/forecasting" element={<ForecastingEngine />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
