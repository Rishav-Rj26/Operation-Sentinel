import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { zonesAPI, statsAPI, incidentsAPI } from '../services/api';
import ZoneGraph from '../components/ZoneGraph';

const DashboardPage = () => {
  const [zones, setZones] = useState([]);
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [zoneData, statsData, incData] = await Promise.all([
        zonesAPI.getAll(), statsAPI.getStats(), incidentsAPI.getAll(),
      ]);
      setZones(zoneData);
      setStats(statsData);
      setIncidents(incData.slice(0, 8)); // Just recent ones for the feed
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Format time for activity feed
  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${Math.floor(d.getMilliseconds()/10).toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-background">
      
      {/* TopAppBar */}
      <header className="bg-surface/10 backdrop-blur-lg border-b border-surface-tint/20 shadow-[0_0_15px_rgba(0,219,231,0.1)] flex justify-between items-center w-full px-margin-desktop h-16 shrink-0 z-30">
        <div className="flex items-center gap-6">
          <h2 className="font-headline-lg text-headline-lg tracking-tighter text-surface-tint drop-shadow-[0_0_8px_rgba(0,219,231,0.6)]">SENTINEL_CMD_V4</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-highest/50 border border-white/10 rounded-sm font-label-caps text-label-caps text-on-surface-variant">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-surface-tint' : 'bg-amber'} block animate-pulse`}></span>
            {connected ? 'LIVE TELEMETRY' : 'OFFLINE'}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:text-primary transition-colors duration-200 scale-95 active:opacity-80 p-2">
            <span className="material-symbols-outlined">sensors</span>
          </button>
          <button onClick={() => navigate('/audit')} className="text-on-surface-variant hover:text-primary transition-colors duration-200 scale-95 active:opacity-80 p-2">
            <span className="material-symbols-outlined">memory</span>
          </button>
          <button onClick={() => navigate('/map')} className="text-on-surface-variant hover:text-primary transition-colors duration-200 scale-95 active:opacity-80 p-2 relative">
            <span className="material-symbols-outlined">satellite_alt</span>
          </button>
          <div className="h-8 w-px bg-white/10 mx-2"></div>
          <div className="w-8 h-8 rounded-sm bg-primary-container/20 border border-surface-tint/50 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px] text-surface-tint">person</span>
          </div>
        </div>
      </header>

      {/* Canvas Area */}
      <div className="flex-1 p-gutter flex gap-gutter overflow-hidden relative">
        
        {/* Central Visualization: Node Graph */}
        <div className="flex-1 bg-surface/30 border border-surface-tint/20 shadow-[0_0_20px_rgba(0,219,231,0.05)] relative overflow-hidden flex items-center justify-center">
          
          <div className="corner-bracket-tl"></div>
          <div className="corner-bracket-tr"></div>
          <div className="corner-bracket-bl"></div>
          <div className="corner-bracket-br"></div>
          
          <div className="absolute top-4 left-4 flex flex-col gap-1 z-10">
            <h3 className="font-label-caps text-label-caps text-surface-tint/80 tracking-widest">ZONE ADJACENCY NETWORK</h3>
            <span className="font-data-md text-[10px] text-on-surface-variant/50">COORD: [42.11, -71.05] // S-LINK ACTIVE</span>
          </div>

          <ZoneGraph zones={zones} />

          <div className="absolute bottom-4 right-4 flex gap-4 bg-surface/50 p-2 border border-surface-tint/20 shadow-[0_0_10px_rgba(0,219,231,0.1)] backdrop-blur z-10 text-[10px] font-data-md">
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-none bg-surface-tint"></div><span className="text-surface-tint/70">NOMINAL</span></div>
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-none bg-white/50"></div><span className="text-white/50">ELEVATED</span></div>
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-none bg-[#ff5252] animate-pulse-critical"></div><span className="text-[#ff5252]/70">CRITICAL</span></div>
          </div>
        </div>

        {/* Right Sidebar / Telemetry */}
        <div className="w-80 flex flex-col gap-gutter shrink-0">
          
          {/* Stat Cards */}
          <div className="bg-surface/20 border border-surface-tint/20 shadow-[0_0_15px_rgba(0,219,231,0.05)] p-4 flex flex-col gap-1 relative">
            <div className="corner-bracket-tl"></div>
            <div className="corner-bracket-tr"></div>
            <div className="corner-bracket-bl"></div>
            <div className="corner-bracket-br"></div>
            <span className="font-label-caps text-label-caps text-on-surface-variant flex justify-between tracking-widest">
              TOTAL FORCE <span className="material-symbols-outlined text-[14px]">group</span>
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-data-md text-[32px] leading-none text-on-surface">{loading ? '...' : (stats?.totalOfficers || 0)}</span>
              <span className="font-data-md text-[10px] text-surface-tint animate-bitstream">0101</span>
            </div>
          </div>

          <div className="bg-surface/20 border border-surface-tint/20 shadow-[0_0_15px_rgba(0,219,231,0.05)] p-4 flex flex-col gap-1 relative overflow-hidden">
            <div className="corner-bracket-tl"></div>
            <div className="corner-bracket-tr"></div>
            <div className="corner-bracket-bl"></div>
            <div className="corner-bracket-br"></div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 blur-xl rounded-full"></div>
            <span className="font-label-caps text-label-caps text-on-surface-variant flex justify-between tracking-widest">
              GLOBAL STANDBY POOL <span className="material-symbols-outlined text-[14px] text-white/50">warning</span>
            </span>
            <span className="font-data-md text-[32px] leading-none text-on-surface">{loading ? '...' : (stats?.standbyOfficers || 0)}</span>
            <div className="w-full h-[1px] bg-white/10 mt-2 overflow-hidden relative">
              <div className="h-full bg-surface-tint w-[15%] absolute top-0 left-0"></div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="flex-1 bg-surface-container-low/30 backdrop-blur-md border border-surface-tint/20 shadow-[0_0_15px_rgba(0,219,231,0.05)] flex flex-col overflow-hidden relative">
            <div className="corner-bracket-tl"></div>
            <div className="corner-bracket-tr"></div>
            <div className="corner-bracket-bl"></div>
            <div className="corner-bracket-br"></div>
            
            <div className="p-3 border-b border-surface-tint/20 flex justify-between items-center bg-surface-tint/5">
              <span className="font-label-caps text-label-caps text-surface-tint tracking-widest">LIVE TELEMETRY FEED</span>
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full bg-surface-tint opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 bg-surface-tint"></span>
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 font-data-md text-[11px] flex flex-col gap-1">
              {incidents.length === 0 && (
                <div className="py-1.5 px-2 hover:bg-white/5 flex gap-3 transition-colors border-l border-transparent">
                  <span className="text-on-surface-variant/50 w-[70px] shrink-0">--:--:--</span>
                  <span className="text-on-surface/80 uppercase">SYSTEM AWAITING EVENTS</span>
                </div>
              )}
              {incidents.map((inc) => (
                <div 
                  key={inc._id}
                  className={`py-1.5 px-2 flex gap-3 transition-colors ${
                    inc.severity === 'critical' || inc.severity === 'high' 
                    ? 'bg-error/10 border-l border-error text-error' 
                    : 'hover:bg-white/5 border-l border-transparent text-on-surface/80'
                  }`}
                >
                  <span className={`${inc.severity === 'critical' ? 'opacity-70' : 'text-on-surface-variant/50'} w-[70px] shrink-0`}>
                    {formatTime(inc.createdAt)}
                  </span>
                  <span className="uppercase line-clamp-1">{inc.title} - {inc.location}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-surface-container-lowest/40 backdrop-blur-md border-t border-surface-tint/20 shadow-[0_-5px_15px_rgba(0,219,231,0.05)] w-full z-50 flex justify-between items-center px-margin-desktop py-2 shrink-0">
        <div className="flex gap-6 font-data-md text-[11px] text-on-surface-variant/70 uppercase">
          <span>SYSTEM_STABLE // LATENCY: 14MS // ENCRYPTION: ACTIVE</span>
        </div>
        <div className="flex gap-4 font-data-md text-[11px]">
          <span className="text-on-surface-variant/70 hover:text-surface-tint transition-colors cursor-pointer uppercase">Diagnostic Log</span>
          <span className="text-on-surface-variant/70 hover:text-surface-tint transition-colors cursor-pointer uppercase">Relay Status</span>
        </div>
      </footer>
    </div>
  );
};

export default DashboardPage;
