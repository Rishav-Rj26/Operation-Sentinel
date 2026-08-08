import { Activity } from 'lucide-react';

const MapLegend = ({ incidentCount, unitCount }) => {
  return (
    <div className="glass-card rounded-xl p-4 shadow-xl border border-slate-700/50 w-52">
      <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-blue-400" /> Map Legend
      </h4>
      <div className="space-y-2.5 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_12px_rgba(59,130,246,1)]" />
          <span className="text-slate-300">Your Location</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          <span className="text-slate-300">Incident ({incidentCount})</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 border border-white shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <span className="text-slate-300">Unit ({unitCount})</span>
        </div>
        <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-700/50">
          <div className="w-3 h-3 rounded-full bg-red-500/40 border border-red-500 border-dashed" />
          <span className="text-slate-300">Critical Zone</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500/40 border border-emerald-500 border-dashed" />
          <span className="text-slate-300">Safe Zone</span>
        </div>
      </div>
    </div>
  );
};

export default MapLegend;
