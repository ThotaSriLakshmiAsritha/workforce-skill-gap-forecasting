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

function AppLayout({ darkMode, toggleDark }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // If on landing page, render without sidebar
  if (location.pathname === '/') {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <LandingPage />
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
        {/* Sidebar */}
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar
            darkMode={darkMode}
            toggleDark={toggleDark}
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
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('skillsync-dark') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('skillsync-dark', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDark = () => setDarkMode(d => !d);

  return (
    <BrowserRouter>
      <AppLayout darkMode={darkMode} toggleDark={toggleDark} />
    </BrowserRouter>
  );
}
