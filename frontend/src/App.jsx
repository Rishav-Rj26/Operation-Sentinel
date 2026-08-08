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
    <div className="min-h-screen w-full bg-[#050a18] text-slate-200 font-sans selection:bg-blue-500/30 grid-bg">
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[10%] w-[600px] h-[600px] rounded-full bg-blue-900/10 blur-[150px]" />
        <div className="absolute bottom-[-15%] right-[5%] w-[500px] h-[500px] rounded-full bg-indigo-900/10 blur-[130px]" />
        <div className="absolute top-[50%] right-[30%] w-[300px] h-[300px] rounded-full bg-purple-900/5 blur-[100px]" />
      </div>

      {/* Neon top line */}
      <div className="fixed top-0 left-0 right-0 z-50 neon-line" />

      <Navbar status={status} incidents={incidents} />

      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/units" element={<UnitsPage />} />
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
