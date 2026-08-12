import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { statsAPI } from '../services/api';
import { useToast } from '../components/Toast';

const COLORS = ['#00f2ff', '#00dbe7', '#74f5ff', '#b9cacb', '#414755', '#273647'];
const SEVERITY_COLORS = { 'low': '#00c853', 'medium': '#ffbf00', 'high': '#ff9800', 'critical': '#d50000' };

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await statsAPI.getAnalytics();
        setData(res);
      } catch {
        toast.error('Failed to load analytics telemetry');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-gutter flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,242,255,0.5)]" />
          <p className="font-label-caps text-label-caps text-primary uppercase tracking-widest animate-pulse">Initializing Analytics Core...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex-1 p-gutter flex flex-col overflow-hidden relative bg-background">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-container/5 rounded-full blur-[150px]"></div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 animate-slide-up z-10 mb-6 border-b border-outline-variant/30 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border bg-primary/10 border-primary/30 font-label-caps text-[10px] uppercase tracking-widest text-primary">
              <span className="material-symbols-outlined text-[12px]">analytics</span>
              DEEP ANALYTICS
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border bg-surface-tint/10 border-surface-tint/30 font-label-caps text-[10px] uppercase tracking-widest text-surface-tint">
              <span className="material-symbols-outlined text-[12px]">monitoring</span>
              REAL-TIME METRICS
            </div>
          </div>
          <h1 className="font-headline-md text-headline-md text-primary-container tracking-tight">System Analytics</h1>
          <p className="font-data-md text-data-md text-on-surface-variant">Comprehensive overview of incidents, resources, and tactical performance.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationFillMode: 'both' }}>
          
          {/* Incident Severity Distribution */}
          <div className="sentinel-panel rounded-lg p-6 flex flex-col h-[400px] border border-outline-variant/30">
            <h3 className="font-label-caps text-[12px] text-primary uppercase tracking-widest flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-[18px]">donut_large</span> 
              Incident Severity Distribution
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.severityDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value" stroke="rgba(5, 20, 36, 1)" strokeWidth={2}>
                    {data.severityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(13, 28, 45, 0.95)', border: '1px solid #3a494b', borderRadius: '4px', color: '#00dbe7', fontFamily: 'JetBrains Mono', fontSize: '11px' }} 
                    itemStyle={{ color: '#d4e4fa' }} 
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly Incident Trend */}
          <div className="sentinel-panel rounded-lg p-6 flex flex-col h-[400px] border border-outline-variant/30">
            <h3 className="font-label-caps text-[12px] text-primary-fixed uppercase tracking-widest flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-[18px]">timeline</span> 
              12-Hour Activity Trend
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.hourlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d50000" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#d50000" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00c853" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#00c853" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(132, 148, 149, 0.2)" vertical={false} />
                  <XAxis dataKey="hour" stroke="#849495" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
                  <YAxis stroke="#849495" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(13, 28, 45, 0.95)', border: '1px solid #3a494b', borderRadius: '4px', fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
                  <Legend iconType="circle" formatter={(value) => <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">{value}</span>} />
                  <Area type="monotone" dataKey="incidents" name="NEW ALERTS" stroke="#d50000" strokeWidth={2} fillOpacity={1} fill="url(#colorIncidents)" />
                  <Area type="monotone" dataKey="resolved" name="RESOLVED" stroke="#00c853" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Unit Type Distribution */}
          <div className="sentinel-panel rounded-lg p-6 flex flex-col h-[400px] border border-outline-variant/30">
            <h3 className="font-label-caps text-[12px] text-surface-tint uppercase tracking-widest flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-[18px]">local_police</span> 
              Deployed Resource Types
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.unitTypeDistribution} margin={{ top: 20, right: 20, left: -20, bottom: 5 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(132, 148, 149, 0.2)" horizontal={false} />
                  <XAxis type="number" stroke="#849495" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#d4e4fa" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} width={80} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(13, 28, 45, 0.95)', border: '1px solid #3a494b', borderRadius: '4px', fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
                  <Bar dataKey="value" name="UNITS" radius={[0, 2, 2, 0]}>
                    {data.unitTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Critical Sectors */}
          <div className="sentinel-panel rounded-lg p-6 flex flex-col h-[400px] overflow-hidden border border-outline-variant/30">
            <h3 className="font-label-caps text-[12px] text-amber uppercase tracking-widest flex items-center gap-2 mb-6 drop-shadow-[0_0_5px_rgba(255,191,0,0.5)]">
              <span className="material-symbols-outlined text-[18px]">warning</span> 
              Top Critical Sectors
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              {data.topSectors.map((sector, idx) => (
                <div key={sector._id} className="p-4 rounded bg-surface-container-low/50 border border-outline-variant/30 flex justify-between items-center group hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded flex items-center justify-center font-data-lg text-[14px] font-bold ${idx < 3 ? 'bg-crimson/20 text-crimson border border-crimson/30 shadow-[inset_0_0_8px_rgba(213,0,0,0.3)]' : 'bg-surface-variant/50 text-outline border border-outline-variant/30'}`}>
                      0{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-data-lg text-data-lg text-on-surface uppercase tracking-wider">{sector.name}</h4>
                      <p className="font-data-md text-[11px] text-outline-variant uppercase">{sector.activeIncidents} Active Alerts</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-data-lg text-[20px] font-bold ${idx < 3 ? 'text-crimson' : 'text-amber'}`}>{sector.intensity}%</div>
                    <div className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant">Intensity</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
