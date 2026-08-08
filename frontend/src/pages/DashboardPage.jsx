import { useState, useEffect } from 'react';
import { AlertTriangle, Database, Activity, TrendingUp, Eye, Wifi, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import StatsGrid from '../components/StatsGrid';
import HeatMap from '../components/HeatMap';
import ResourceAllocation from '../components/ResourceAllocation';
import LiveFeed from '../components/LiveFeed';
import ReportGenerator from '../components/ReportGenerator';
import { StatsSkeleton, HeatMapSkeleton, UnitListSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';
import { useSocket } from '../context/SocketContext';
import Modal from '../components/Modal';
import { sectorsAPI, unitsAPI, incidentsAPI, seedAPI, statsAPI } from '../services/api';

const DashboardPage = () => {
  const [sectors, setSectors] = useState(null);
  const [units, setUnits] = useState(null);
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    title: '', severity: 'high', location: '', description: '',
  });

  const toast = useToast();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  const fetchData = async () => {
    try {
      const [sectorsData, unitsData, statsData, incData] = await Promise.all([
        sectorsAPI.getAll(), unitsAPI.getAll(), statsAPI.getStats(), incidentsAPI.getAll(),
      ]);
      setSectors(sectorsData);
      setUnits(unitsData);
      setStats(statsData);
      setIncidents(incData);
    } catch {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line

  // ── Socket.io real-time listeners ─────────────────────
  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchData();
    socket.on('incident:created', refresh);
    socket.on('incident:updated', refresh);
    socket.on('incident:deleted', refresh);
    socket.on('unit:created', refresh);
    socket.on('unit:updated', refresh);
    socket.on('data:seeded', refresh);
    return () => {
      socket.off('incident:created', refresh);
      socket.off('incident:updated', refresh);
      socket.off('incident:deleted', refresh);
      socket.off('unit:created', refresh);
      socket.off('unit:updated', refresh);
      socket.off('data:seeded', refresh);
    };
  }, [socket]); // eslint-disable-line

  const handleDispatch = async (e) => {
    e.preventDefault();
    try {
      // Attach GPS coords if available
      const payload = { ...dispatchForm };
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }));
          payload.latitude = pos.coords.latitude;
          payload.longitude = pos.coords.longitude;
        } catch { void 0; } // GPS optional
      }
      await incidentsAPI.create(payload);
      toast.success('Emergency incident dispatched!');
      setShowDispatchModal(false);
      setDispatchForm({ title: '', severity: 'high', location: '', description: '' });
    } catch (err) { toast.error(err.message); }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      // Send user's GPS so seed data spreads around their real location
      let baseLat, baseLng;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }));
          baseLat = pos.coords.latitude;
          baseLng = pos.coords.longitude;
        } catch { void 0; } // fallback to Delhi
      }
      const result = await seedAPI.seed({ baseLat, baseLng, scale: 'micro' });
      const c = result.counts;
      toast.success(`Seeded — ${c.zones} zones, ${c.officers} officers, ${c.shifts} shifts, ${c.standby} standby`);
    } catch (err) { toast.error(err.message); }
    finally { setSeeding(false); }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all";

  return (
    <>
      <main className="w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-8 space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 animate-slide-up">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${connected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-yellow-500/10 border-yellow-500/20'} border`}>
                <Wifi className={`w-3.5 h-3.5 ${connected ? 'text-emerald-400' : 'text-yellow-400'}`} />
                <span className={`text-xs font-semibold ${connected ? 'text-emerald-400' : 'text-yellow-400'}`}>{connected ? 'Real-time Connected' : 'Connecting...'}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400">Live Tracking</span>
              </div>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">Command Center</h1>
            <p className="text-slate-500 text-sm mt-1">Real-time incident monitoring & tactical resource deployment</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={handleSeed} disabled={seeding} className="btn-press inline-flex items-center rounded-xl glass-card px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-all disabled:opacity-50">
              <Database className={`w-4 h-4 mr-2 ${seeding ? 'animate-spin' : ''}`} />
              {seeding ? 'Seeding...' : 'Seed DB'}
            </button>
            <button onClick={() => setShowDispatchModal(true)} className="btn-press group inline-flex items-center rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-xl shadow-red-500/20 hover:shadow-red-500/40 hover:-translate-y-0.5 transition-all duration-300">
              <AlertTriangle className="w-4 h-4 mr-2 group-hover:animate-pulse" />
              Dispatch Emergency
            </button>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-3 flex-wrap animate-slide-up stagger-1" style={{ animationFillMode: 'both' }}>
          <button onClick={() => navigate('/incidents?severity=critical')} className="btn-press inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all group">
            <Zap className="w-3.5 h-3.5 group-hover:animate-pulse" />
            View Critical ({incidents.filter(i => i.severity === 'critical' && i.status !== 'closed').length})
          </button>
          <button onClick={() => navigate('/incidents?status=responding')} className="btn-press inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold hover:bg-yellow-500/20 transition-all">
            <Eye className="w-3.5 h-3.5" />
            Responding ({incidents.filter(i => i.status === 'responding').length})
          </button>
          <ReportGenerator stats={stats} incidents={incidents} units={units} />
        </div>

        {/* Stats */}
        <div className="animate-slide-up stagger-1" style={{ animationFillMode: 'both' }}>
          {loading ? <StatsSkeleton /> : <StatsGrid stats={stats} />}
        </div>

        {/* Map & Resources */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-slide-up stagger-2" style={{ animationFillMode: 'both' }}>
          {loading ? (
            <>
              <div className="lg:col-span-3"><HeatMapSkeleton /></div>
              <div className="lg:col-span-2"><UnitListSkeleton /></div>
            </>
          ) : (
            <>
              <div className="lg:col-span-3">
                <HeatMap sectors={sectors} />
              </div>
              <div className="lg:col-span-2">
                <ResourceAllocation units={units} onViewAll={() => navigate('/units')} />
              </div>
            </>
          )}
        </div>

        {/* Live Activity Feed */}
        <div className="animate-slide-up stagger-3" style={{ animationFillMode: 'both' }}>
          <LiveFeed incidents={incidents} />
        </div>
      </main>

      {/* Dispatch Modal */}
      <Modal isOpen={showDispatchModal} onClose={() => setShowDispatchModal(false)} title="🚨 Dispatch Emergency Incident">
        <form onSubmit={handleDispatch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Incident Title</label>
            <input type="text" value={dispatchForm.title} onChange={(e) => setDispatchForm({ ...dispatchForm, title: e.target.value })} required placeholder="e.g. Armed Robbery in Progress" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Severity</label>
              <select value={dispatchForm.severity} onChange={(e) => setDispatchForm({ ...dispatchForm, severity: e.target.value })} className={inputCls}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Location</label>
              <input type="text" value={dispatchForm.location} onChange={(e) => setDispatchForm({ ...dispatchForm, location: e.target.value })} required placeholder="Downtown Market" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
            <textarea value={dispatchForm.description} onChange={(e) => setDispatchForm({ ...dispatchForm, description: e.target.value })} rows={3} placeholder="Describe the incident..." className={`${inputCls} resize-none`} />
          </div>
          <button type="submit" className="btn-press w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold shadow-xl shadow-red-500/20 hover:shadow-red-500/40 transition-all">
            🚨 Dispatch Now
          </button>
        </form>
      </Modal>
    </>
  );
};

export default DashboardPage;
