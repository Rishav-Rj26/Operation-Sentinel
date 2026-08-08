import { MapPin, BarChart3, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeatMap = ({ sectors }) => {
  const navigate = useNavigate();

  const getHeatColor = (intensity) => {
    if (intensity < 20) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25';
    if (intensity < 50) return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25 hover:bg-yellow-500/25';
    if (intensity < 80) return 'bg-orange-500/20 text-orange-400 border-orange-500/35 hover:bg-orange-500/30';
    return 'bg-red-500/25 text-red-400 border-red-500/40 hover:bg-red-500/35 badge-critical';
  };

  const criticalCount = sectors ? sectors.filter(s => s.intensity > 70).length : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <MapPin className="w-4 h-4 text-indigo-400" />
          </div>
          Sector Heat Map
        </h2>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium uppercase tracking-wider">
          <span>Low</span>
          <div className="w-20 h-1.5 rounded-full bg-gradient-to-r from-emerald-500/60 via-yellow-500/60 via-orange-500/60 to-red-500/60" />
          <span>High</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {sectors && sectors.map((sector) => (
            <div
              key={sector._id || sector.sectorId}
              className={`relative group aspect-square rounded-xl border flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 cursor-pointer ${getHeatColor(sector.intensity)}`}
              onClick={() => navigate('/incidents')}
            >
              <span className="text-[11px] font-bold leading-none">{sector.name}</span>
              <span className="text-[10px] opacity-70 mt-1">{sector.intensity}%</span>
              {sector.intensity > 80 && (
                <AlertCircle className="absolute top-1 right-1 w-3 h-3 text-red-400 animate-pulse" />
              )}

              {/* Tooltip */}
              <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 bg-slate-900/95 border border-slate-700 rounded-lg py-2 px-3 text-xs w-max transition-all z-20 shadow-2xl pointer-events-none">
                <p className="font-bold text-white">{sector.name}</p>
                <p className="text-slate-400 mt-0.5">Intensity: {sector.intensity}%</p>
                <p className="text-slate-400">Active: {sector.activeIncidents || Math.floor(sector.intensity / 10)}</p>
                <p className="text-blue-400 mt-1 text-[10px]">Click → View Incidents</p>
              </div>
            </div>
          ))}
        </div>

        <div className="neon-line mt-5 mb-4 rounded-full" />

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              <strong className="text-white font-semibold">{criticalCount}</strong> Critical Zones
            </span>
            <span className="text-xs text-slate-600">•</span>
            <span className="text-xs text-slate-500">
              <strong className="text-white font-semibold">{sectors ? sectors.length : 0}</strong> Total Sectors
            </span>
          </div>
          <button onClick={() => navigate('/incidents')} className="text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center gap-1 transition-colors">
            <BarChart3 className="w-3.5 h-3.5" /> Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeatMap;
