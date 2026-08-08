import { Activity, Clock, MapPin, Radio } from 'lucide-react';

const severityConfig = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', dot: 'bg-red-500', glow: 'shadow-red-500/40' },
  high:     { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', dot: 'bg-orange-500', glow: 'shadow-orange-500/30' },
  medium:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', dot: 'bg-yellow-500', glow: '' },
  low:      { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-500', glow: '' },
};

const timeSince = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const LiveFeed = ({ incidents = [] }) => {
  const recent = incidents.slice(0, 8);

  return (
    <div className="glass-card rounded-2xl p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
          <Activity className="w-4 h-4 text-blue-400" />
          Live Activity Feed
        </h3>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Radio className="w-8 h-8 text-slate-600 mb-3" />
            <p className="text-slate-500 text-sm font-medium">No recent activity</p>
            <p className="text-slate-600 text-xs mt-1">Seed database to see live feed</p>
          </div>
        ) : (
          recent.map((inc, idx) => {
            const cfg = severityConfig[inc.severity] || severityConfig.low;
            return (
              <div
                key={inc._id || idx}
                className={`group flex items-start gap-3 p-3 rounded-xl ${cfg.bg} border ${cfg.border} transition-all duration-300 hover:scale-[1.01] animate-slide-up`}
                style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}
              >
                {/* Severity indicator */}
                <div className="mt-0.5 shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ${cfg.glow ? `shadow-lg ${cfg.glow}` : ''} ${inc.severity === 'critical' ? 'animate-pulse' : ''}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white leading-snug truncate">
                    {inc.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
                      {inc.severity}
                    </span>
                    <span className="flex items-center text-[10px] text-slate-500">
                      <MapPin className="w-2.5 h-2.5 mr-0.5" />
                      {inc.location?.substring(0, 25) || '—'}
                    </span>
                  </div>
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-slate-500 shrink-0 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {timeSince(inc.createdAt)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LiveFeed;
