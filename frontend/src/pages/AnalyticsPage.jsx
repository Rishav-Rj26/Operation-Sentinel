import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Activity, ShieldAlert, Car, BarChart3, TrendingUp } from 'lucide-react';
import { statsAPI } from '../services/api';
import { useToast } from '../components/Toast';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const SEVERITY_COLORS = { 'low': '#10b981', 'medium': '#f59e0b', 'high': '#f97316', 'critical': '#ef4444' };
const STATUS_COLORS = { 'reported': '#3b82f6', 'responding': '#f59e0b', 'resolved': '#10b981', 'closed': '#64748b' };

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await statsAPI.getAnalytics();
        setData(res);
      } catch (err) {
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []); // eslint-disable-line

  if (loading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Processing Analytics Data...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <main className="w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-8 space-y-8 pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 animate-slide-up">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
              <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-semibold text-purple-400">Deep Analytics</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400">Real-time Metrics</span>
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">System Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Comprehensive overview of incidents, resources, and tactical performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-1 animate-slide-up" style={{ animationFillMode: 'both' }}>
        
        {/* Incident Severity Distribution */}
        <div className="glass-card rounded-2xl p-6 flex flex-col h-[400px]">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <ShieldAlert className="w-5 h-5 text-rose-400" /> Incident Severity Distribution
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.severityDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value" stroke="rgba(255,255,255,0.05)">
                  {data.severityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(56, 75, 112, 0.3)', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#e2e8f0' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-slate-300 capitalize text-sm font-medium">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Incident Trend */}
        <div className="glass-card rounded-2xl p-6 flex flex-col h-[400px]">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-indigo-400" /> 12-Hour Activity Trend
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.hourlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(56, 75, 112, 0.3)', borderRadius: '8px' }} />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="incidents" name="New Incidents" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorIncidents)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Unit Type Distribution */}
        <div className="glass-card rounded-2xl p-6 flex flex-col h-[400px]">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <Car className="w-5 h-5 text-blue-400" /> Deployed Resource Types
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.unitTypeDistribution} margin={{ top: 20, right: 20, left: -20, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#e2e8f0" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(56, 75, 112, 0.3)', borderRadius: '8px' }} />
                <Bar dataKey="value" name="Units" radius={[0, 4, 4, 0]}>
                  {data.unitTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Critical Sectors */}
        <div className="glass-card rounded-2xl p-6 flex flex-col h-[400px] overflow-hidden">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <ShieldAlert className="w-5 h-5 text-amber-400" /> Top Critical Sectors
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
            {data.topSectors.map((sector, idx) => (
              <div key={sector._id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex justify-between items-center group hover:bg-slate-800/60 transition-colors">
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx < 3 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-700/50 text-slate-300'}`}>
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-200">{sector.name}</h4>
                    <p className="text-xs text-slate-500">{sector.activeIncidents} Active Incidents</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-amber-400">{sector.intensity}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Intensity</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
};

export default AnalyticsPage;
