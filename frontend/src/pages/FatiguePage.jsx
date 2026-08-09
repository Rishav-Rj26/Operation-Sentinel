import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, RefreshCw, Shield, Users, TrendingUp, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useToast } from '../components/Toast';
import { fatigueAPI } from '../services/api';

const HISTOGRAM_COLORS = {
  '0-20': '#00c853',
  '21-40': '#4caf50',
  '41-60': '#ffbf00',
  '61-80': '#ff9800',
  '81-100': '#f44336',
  '100+': '#d50000',
};

const FatiguePage = () => {
  const [data, setData] = useState(null);
  const [highRisk, setHighRisk] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboard, hrData] = await Promise.all([
        fatigueAPI.getDashboard(),
        fatigueAPI.getHighRisk(),
      ]);
      setData(dashboard);
      setHighRisk(Array.isArray(hrData) ? hrData : []);
    } catch {
      toast.error('Failed to load fatigue data');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const result = await fatigueAPI.recalculate();
      toast.success(result.message || 'Fatigue recalculated');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Recalculation failed');
    } finally {
      setRecalculating(false);
    }
  };

  // Prepare histogram data for recharts
  const histogramData = data?.histogram
    ? Object.entries(data.histogram).map(([range, count]) => ({ range, count }))
    : [];

  const p90 = data?.p90_threshold || 0;

  return (
    <main className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Fatigue Monitoring</h1>
          <p className="text-slate-400 text-sm">Track officer fatigue levels and identify high-risk personnel.</p>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
          {recalculating ? 'Recalculating...' : 'Recalculate Fatigue'}
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 text-center py-20">Loading fatigue data...</div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Officers Tracked',
                value: data?.total_officers || 0,
                icon: Users,
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
              },
              {
                label: 'High-Risk (P90+)',
                value: data?.high_risk_count || 0,
                icon: AlertTriangle,
                color: 'text-red-400',
                bg: 'bg-red-500/10',
              },
              {
                label: 'P90 Threshold',
                value: p90,
                icon: TrendingUp,
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
              },
              {
                label: 'Avg Fatigue',
                value: data?.officers?.length
                  ? Math.round(
                      data.officers.reduce((acc, o) => acc + (o.fatigueScore || o.fatigue_score || 0), 0) /
                        data.officers.length
                    )
                  : 0,
                icon: Activity,
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/10',
              },
            ].map((s, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">{s.label}</p>
                  <h3 className="text-2xl font-bold text-white tabular-nums">{s.value}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Fatigue Distribution Histogram */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Fatigue Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(18, 33, 49, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {histogramData.map((entry) => (
                      <Cell key={entry.range} fill={HISTOGRAM_COLORS[entry.range] || '#00dbe7'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* P90 Threshold Indicator */}
            <div className="mt-4 flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span className="text-sm text-amber-300">
                Officers at or above <span className="font-mono font-bold">{p90}</span> fatigue (90th percentile) are
                excluded from Red-zone deployment the following day.
              </span>
            </div>
          </div>

          {/* High-Risk Officers Table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" /> High-Risk Officers ({highRisk.length})
              </h3>
            </div>
            {highRisk.length === 0 ? (
              <div className="p-12 text-center">
                <Shield className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No high-risk officers</p>
                <p className="text-slate-500 text-sm">All officers are within safe fatigue levels.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50 bg-slate-800/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                        Fatigue Score
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                        Risk Level
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {highRisk.map((o) => {
                      const fScore = o.fatigueScore || o.fatigue_score || 0;
                      const pct = p90 > 0 ? Math.round((fScore / p90) * 100) : 0;
                      return (
                        <tr key={o._id || o.id} className="hover:bg-slate-700/20 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold text-white">{o.name}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-300">{o.rank}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2.5 py-1 rounded-full ring-1 ring-inset ring-red-500/20 bg-red-500/10 text-red-400 font-medium capitalize">
                              {o.status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 fatigue-indicator">
                                <div
                                  className="fatigue-marker"
                                  style={{ left: `${Math.min(100, Math.max(0, fScore))}%` }}
                                />
                              </div>
                              <span className="text-sm font-mono text-red-400 font-bold">{fScore}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-bold px-2 py-1 rounded ${
                                pct >= 150
                                  ? 'bg-red-600/20 text-red-300'
                                  : pct >= 120
                                    ? 'bg-orange-500/20 text-orange-300'
                                    : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {pct >= 150 ? 'CRITICAL' : pct >= 120 ? 'HIGH' : 'ELEVATED'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
};

export default FatiguePage;
