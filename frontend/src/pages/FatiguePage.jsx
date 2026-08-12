import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useToast } from '../components/Toast';
import { fatigueAPI } from '../services/api';
import FatigueBar from '../components/FatigueBar';
import DataTable from '../components/DataTable';

const HISTOGRAM_COLORS = {
  '0-20': '#00c853',
  '21-40': '#00c853',
  '41-60': '#ffbf00',
  '61-80': '#ffbf00',
  '81-100': '#d50000',
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

  const histogramData = data?.histogram
    ? Object.entries(data.histogram).map(([range, count]) => ({ range, count }))
    : [];

  const p90 = data?.p90_threshold || 0;

  const columns = [
    { header: 'OFFICER DESIGNATION', accessor: 'name', render: (row) => <span className="font-data-md text-[13px] text-on-surface uppercase">{row.name}</span> },
    { header: 'BADGE / RANK', accessor: 'rank', render: (row) => <span className="font-data-md text-[11px] text-on-surface-variant uppercase">{row.rank || row.badge || 'N/A'}</span> },
    { header: 'STATUS', accessor: 'status', render: (row) => (
      <span className="font-label-caps text-[10px] px-2 py-1 rounded bg-crimson/10 border border-crimson/30 text-crimson uppercase tracking-widest drop-shadow-[0_0_5px_rgba(213,0,0,0.5)]">
        {row.status?.replace('_', ' ') || 'ACTIVE'}
      </span>
    )},
    { header: 'FATIGUE LEVEL', accessor: 'fatigue', render: (row) => (
      <div className="w-48"><FatigueBar score={row.fatigueScore || row.fatigue_score || 0} /></div>
    )},
    { header: 'RISK ASSESSMENT', accessor: 'risk', render: (row) => {
      const fScore = row.fatigueScore || row.fatigue_score || 0;
      const pct = p90 > 0 ? Math.round((fScore / p90) * 100) : 0;
      let riskLevel = 'ELEVATED';
      let riskClass = 'bg-amber/20 text-amber border-amber';
      if (pct >= 150) {
        riskLevel = 'CRITICAL';
        riskClass = 'bg-crimson/20 text-crimson border-crimson shadow-[inset_0_0_8px_rgba(213,0,0,0.3)]';
      } else if (pct >= 120) {
        riskLevel = 'HIGH';
        riskClass = 'bg-amber/40 text-amber border-amber shadow-[inset_0_0_8px_rgba(255,191,0,0.3)]';
      }
      return <span className={`font-label-caps text-[10px] px-2 py-1 rounded border uppercase tracking-widest ${riskClass}`}>{riskLevel}</span>
    }}
  ];

  return (
    <div className="flex-1 p-gutter flex flex-col overflow-hidden relative bg-background">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-crimson/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="flex justify-between items-end mb-6 z-10 border-b border-outline-variant/30 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>monitor_heart</span>
            <h1 className="font-headline-md text-headline-md text-primary-container tracking-tight">Fatigue & Force Analytics</h1>
          </div>
          <p className="font-data-md text-data-md text-on-surface-variant">Biometric fatigue monitoring and deployment risk assessment.</p>
        </div>
        
        <button 
          onClick={handleRecalculate} 
          disabled={recalculating} 
          className="btn-primary px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.15)] hover:shadow-[0_0_25px_rgba(0,242,255,0.4)]"
        >
          {recalculating ? (
            <div className="w-4 h-4 border-2 border-on-primary-fixed border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-[18px]">sync</span>
          )}
          RUN FATIGUE ANALYSIS
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center z-10">
          <div className="w-8 h-8 border-2 border-surface-tint border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto z-10 custom-scrollbar pr-2 flex flex-col gap-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="sentinel-card rounded-lg p-5 flex flex-col gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest flex justify-between items-center">
                ACTIVE PERSONNEL
                <span className="material-symbols-outlined text-[14px]">group</span>
              </span>
              <span className="font-data-lg text-[32px] font-bold text-surface-tint drop-shadow-[0_0_10px_rgba(0,219,231,0.5)]">{data?.total_officers || 0}</span>
            </div>
            
            <div className="sentinel-card rounded-lg p-5 flex flex-col gap-2 border-crimson/30 shadow-[0_0_15px_rgba(213,0,0,0.1)]">
              <span className="font-label-caps text-label-caps text-crimson uppercase tracking-widest flex justify-between items-center">
                HIGH-RISK (P90+)
                <span className="material-symbols-outlined text-[14px]">warning</span>
              </span>
              <span className="font-data-lg text-[32px] font-bold text-crimson drop-shadow-[0_0_10px_rgba(213,0,0,0.6)]">{data?.high_risk_count || 0}</span>
            </div>
            
            <div className="sentinel-card rounded-lg p-5 flex flex-col gap-2 border-amber/30 shadow-[0_0_15px_rgba(255,191,0,0.1)]">
              <span className="font-label-caps text-label-caps text-amber uppercase tracking-widest flex justify-between items-center">
                P90 THRESHOLD
                <span className="material-symbols-outlined text-[14px]">show_chart</span>
              </span>
              <span className="font-data-lg text-[32px] font-bold text-amber drop-shadow-[0_0_10px_rgba(255,191,0,0.6)]">{p90}</span>
            </div>
            
            <div className="sentinel-card rounded-lg p-5 flex flex-col gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest flex justify-between items-center">
                AVERAGE FATIGUE
                <span className="material-symbols-outlined text-[14px]">monitor_heart</span>
              </span>
              <span className="font-data-lg text-[32px] font-bold text-on-surface">
                {data?.officers?.length ? Math.round(data.officers.reduce((acc, o) => acc + (o.fatigueScore || o.fatigue_score || 0), 0) / data.officers.length) : 0}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Histogram */}
            <div className="lg:col-span-1 sentinel-panel rounded-lg p-5 border border-outline-variant/30 flex flex-col gap-4">
              <h3 className="font-label-caps text-[11px] text-surface-tint uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                Force Composition Breakdown
              </h3>
              
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogramData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="range" tick={{ fill: '#849495', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                    <YAxis tick={{ fill: '#849495', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: 'rgba(13, 28, 45, 0.95)', border: '1px solid #3a494b', borderRadius: '4px', color: '#00dbe7', fontFamily: 'JetBrains Mono', fontSize: '11px' }}
                    />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {histogramData.map((entry) => (
                        <Cell key={entry.range} fill={HISTOGRAM_COLORS[entry.range] || '#00dbe7'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-amber/10 border-l-2 border-amber px-4 py-3 flex items-start gap-3 rounded-r">
                <span className="material-symbols-outlined text-amber text-lg shrink-0">warning</span>
                <div>
                  <p className="font-label-caps text-[10px] text-amber mb-1 tracking-widest">DEPLOYMENT RESTRICTION</p>
                  <p className="text-xs text-on-surface-variant font-data-md">Officers at or above P90 threshold ({p90}) are excluded from Red-zone assignments.</p>
                </div>
              </div>
            </div>

            {/* High-Risk Table */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <h3 className="font-label-caps text-[11px] text-crimson uppercase tracking-widest flex items-center gap-2 drop-shadow-[0_0_5px_rgba(213,0,0,0.5)]">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                High-Risk Personnel ({highRisk.length})
              </h3>
              
              {highRisk.length === 0 ? (
                <div className="sentinel-panel border border-outline-variant/30 rounded-lg p-16 flex flex-col items-center justify-center text-center flex-1">
                  <span className="material-symbols-outlined text-6xl text-success/30 mb-4 drop-shadow-[0_0_15px_rgba(0,200,83,0.3)]">check_circle</span>
                  <h3 className="font-headline-md text-headline-md text-success mb-2 drop-shadow-[0_0_8px_rgba(0,200,83,0.5)]">ALL CLEAR</h3>
                  <p className="font-data-md text-data-md text-on-surface-variant max-w-md">No personnel detected within high-risk fatigue thresholds.</p>
                </div>
              ) : (
                <DataTable columns={columns} data={highRisk} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FatiguePage;
