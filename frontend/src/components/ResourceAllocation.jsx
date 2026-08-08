import { Shield, MapPin, ChevronRight } from 'lucide-react';

const ResourceAllocation = ({ units, onViewAll }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
      case 'En Route': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25';
      case 'On Scene': return 'bg-red-500/15 text-red-400 border-red-500/25';
      case 'Standby': return 'bg-blue-500/15 text-blue-400 border-blue-500/25';
      case 'Patrolling': return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25';
      default: return 'bg-slate-500/15 text-slate-400 border-slate-500/25';
    }
  };

  const lastUpdated = (date) => {
    if (!date) return '—';
    return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(new Date(date));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Shield className="w-4 h-4 text-blue-400" />
        </div>
        Resource Allocation
      </h2>

      <div className="glass-card rounded-2xl overflow-hidden flex flex-col" style={{ height: '440px' }}>
        <div className="p-4 border-b border-slate-700/30 flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Units</span>
          <span className="bg-blue-500/15 text-blue-400 text-[11px] px-2.5 py-1 rounded-md font-bold border border-blue-500/20">
            {units ? units.length : 0}
          </span>
        </div>

        <div className="overflow-y-auto flex-1 p-2 space-y-0.5 custom-scrollbar">
          {units && units.map((unit) => (
            <div key={unit._id || unit.unitId} className="p-3 rounded-xl hover:bg-white/[0.03] transition-all border border-transparent hover:border-slate-700/30 cursor-pointer group">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Unit {unit.unitId}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getStatusBadge(unit.status)}`}>
                    {unit.status}
                  </span>
                </div>
                <span className="text-[11px] text-slate-600 font-medium">{lastUpdated(unit.updatedAt)}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{unit.sectorName || '—'}</span>
                <span className="text-slate-700">•</span>
                <span>{unit.type}</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 pl-4 truncate group-hover:text-slate-400 transition-colors">
                ↳ {unit.location}
              </p>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-700/30">
          <button onClick={onViewAll} className="btn-press w-full py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-slate-700/30 hover:border-blue-500/30 text-sm font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2">
            View All Units <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceAllocation;
