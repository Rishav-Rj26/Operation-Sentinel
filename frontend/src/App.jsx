import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './components/Toast';

import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import IncidentsPage from './pages/IncidentsPage';
import UnitsPage from './pages/UnitsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MapPage from './pages/MapPage';
import OfficersPage from './pages/OfficersPage';
import ZoneConfigPage from './pages/ZoneConfigPage';
import RosterPage from './pages/RosterPage';
import FatiguePage from './pages/FatiguePage';
import AuditLogPage from './pages/AuditLogPage';

import { useState, useEffect } from 'react';
import { statsAPI, incidentsAPI } from './services/api';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#050a18] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm animate-pulse">Loading Sentinel...</p>
        </div>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppLayout = () => {
  const [status, setStatus] = useState('Connecting...');
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    const fetchGlobal = async () => {
      try {
        const [statusData, incData] = await Promise.all([
          statsAPI.getStatus(),
          incidentsAPI.getAll(),
        ]);
        setStatus(statusData.status);
        setIncidents(incData);
      } catch {
        setStatus('Backend disconnected');
      }
    };
    fetchGlobal();
    const interval = setInterval(fetchGlobal, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#0b1220] text-slate-200 font-sans selection:bg-sky-500/30">

      <Navbar status={status} incidents={incidents} />

      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/units" element={<UnitsPage />} />
          <Route path="/officers" element={<OfficersPage />} />
          <Route path="/zones" element={<ZoneConfigPage />} />
          <Route path="/roster" element={<RosterPage />} />
          <Route path="/fatigue" element={<FatiguePage />} />
          <Route path="/audit" element={<AuditLogPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
            </Routes>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
