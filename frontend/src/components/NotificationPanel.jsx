import { useState, useEffect, useRef } from 'react';
import { Bell, X, AlertTriangle, ShieldAlert, CheckCircle, Clock, Trash2 } from 'lucide-react';

const sevIcon = {
  critical: { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10' },
  high: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  medium: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  low: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

const timeSince = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const NotificationPanel = ({ incidents = [] }) => {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState(new Set());
  const ref = useRef(null);

  const notifs = incidents
    .filter(i => i.severity === 'critical' || i.severity === 'high')
    .slice(0, 10);
  const unread = notifs.filter(n => !readIds.has(n._id)).length;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all" title="Notifications">
        <Bell className={`w-4 h-4 ${open ? 'text-blue-400' : ''}`} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-[9px] font-black text-white flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 glass-card rounded-2xl shadow-2xl shadow-black/50 border border-slate-700/50 overflow-hidden animate-scale-in z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold text-white">Alerts</span>
              {unread > 0 && <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">{unread} new</span>}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={() => setReadIds(new Set(notifs.map(n => n._id)))} className="text-[10px] text-slate-500 hover:text-blue-400 transition-colors px-2 py-1 rounded-md hover:bg-blue-500/10">Mark all read</button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded-md hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {notifs.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-xs">No critical alerts</p>
              </div>
            ) : notifs.map(n => {
              const cfg = sevIcon[n.severity] || sevIcon.low;
              const Icon = cfg.icon;
              const isRead = readIds.has(n._id);
              return (
                <div key={n._id} className={`flex items-start gap-3 px-4 py-3 border-b border-slate-800/50 hover:bg-white/[0.02] cursor-default ${!isRead ? 'bg-blue-500/[0.03]' : ''}`} onClick={() => setReadIds(prev => new Set([...prev, n._id]))}>
                  <div className={`shrink-0 w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center mt-0.5`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-semibold truncate ${isRead ? 'text-slate-400' : 'text-white'}`}>{n.title}</p>
                      {!isRead && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold uppercase ${cfg.color}`}>{n.severity}</span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{timeSince(n.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {notifs.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-700/50 flex justify-center">
              <button onClick={() => { setReadIds(new Set(notifs.map(n => n._id))); setOpen(false); }} className="text-[11px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
