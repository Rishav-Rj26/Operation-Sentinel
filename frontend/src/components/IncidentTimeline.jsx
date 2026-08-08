import { AlertTriangle, Clock, MapPin, ChevronRight, ShieldAlert } from 'lucide-react';

const severityConfig = {
  critical: { color: 'text-red-400', bg: 'bg-red-500', ring: 'ring-red-500/30', badge: 'bg-red-500/15 text-red-400 border-red-500/25', label: 'CRITICAL' },
  high:     { color: 'text-orange-400', bg: 'bg-orange-500', ring: 'ring-orange-500/30', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/25', label: 'HIGH' },
  medium:   { color: 'text-yellow-400', bg: 'bg-yellow-500', ring: 'ring-yellow-500/30', badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25', label: 'MEDIUM' },
  low:      { color: 'text-emerald-400', bg: 'bg-emerald-500', ring: 'ring-emerald-500/30', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', label: 'LOW' },
};

const statusConfig = {
  reported:   { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  responding: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  resolved:   { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  closed:     { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' },
};

const fmtDate = (d) => new Date(d).toLocaleString('en-IN', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
});

const IncidentTimeline = ({ incidents = [], onEdit }) => {
  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-16 h-16 text-slate-700 mb-4" />
        <p className="text-slate-400 font-semibold text-lg">No incidents to display</p>
        <p className="text-slate-600 text-sm mt-1">Create an incident to see the timeline</p>
      </div>
    );
  }

  return (
    <div className="relative py-4">
      {/* Central timeline line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/40 via-indigo-500/20 to-transparent -translate-x-1/2 hidden lg:block" />
      <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/40 via-indigo-500/20 to-transparent lg:hidden" />

      <div className="space-y-6 lg:space-y-8">
        {incidents.map((inc, idx) => {
          const sev = severityConfig[inc.severity] || severityConfig.low;
          const sts = statusConfig[inc.status] || statusConfig.reported;
          const isLeft = idx % 2 === 0;

          return (
            <div
              key={inc._id}
              className="relative animate-slide-up"
              style={{ animationDelay: `${idx * 0.06}s`, animationFillMode: 'both' }}
            >
              {/* Timeline Node — Desktop */}
              <div className="hidden lg:flex absolute left-1/2 top-5 -translate-x-1/2 z-10">
                <div className={`w-4 h-4 rounded-full ${sev.bg} ring-4 ${sev.ring} shadow-lg ${inc.severity === 'critical' ? 'animate-pulse' : ''}`} />
              </div>

              {/* Timeline Node — Mobile */}
              <div className="lg:hidden absolute left-6 top-5 -translate-x-1/2 z-10">
                <div className={`w-3.5 h-3.5 rounded-full ${sev.bg} ring-4 ${sev.ring} shadow-lg ${inc.severity === 'critical' ? 'animate-pulse' : ''}`} />
              </div>

              {/* Content Card */}
              <div className={`
                lg:w-[calc(50%-2rem)]
                ${isLeft ? 'lg:mr-auto lg:pr-8' : 'lg:ml-auto lg:pl-8'}
                ml-12 lg:ml-0
              `}>
                <div className="glass-card rounded-xl p-4 border border-slate-700/30 hover:scale-[1.01] transition-all duration-300 group cursor-default">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sev.badge} uppercase tracking-wider`}>
                          {sev.label}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sts.bg} ${sts.color} border ${sts.border} capitalize`}>
                          {inc.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white leading-snug">{inc.title}</h4>
                    </div>
                  </div>

                  {/* Description */}
                  {inc.description && (
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">{inc.description}</p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {inc.location?.substring(0, 30) || '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {fmtDate(inc.createdAt)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEdit && (
                        <button onClick={() => onEdit(inc)} className="p-1 rounded-md hover:bg-blue-500/10 text-slate-500 hover:text-blue-400 transition-colors" title="Edit">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IncidentTimeline;
