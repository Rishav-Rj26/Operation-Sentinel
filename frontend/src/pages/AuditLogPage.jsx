import { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp, Filter, Clock, User, ArrowRight } from 'lucide-react';
import { useToast } from '../components/Toast';
import { auditAPI } from '../services/api';

const ACTION_COLORS = {
  create_zone: 'bg-emerald-500/10 text-emerald-400',
  update_zone: 'bg-blue-500/10 text-blue-400',
  delete_zone: 'bg-red-500/10 text-red-400',
  create_officer: 'bg-emerald-500/10 text-emerald-400',
  update_officer: 'bg-blue-500/10 text-blue-400',
  delete_officer: 'bg-red-500/10 text-red-400',
  bulk_create_officers: 'bg-cyan-500/10 text-cyan-400',
  generate_roster: 'bg-indigo-500/10 text-indigo-400',
  resolve_deficit_step_a: 'bg-amber-500/10 text-amber-400',
  resolve_deficit_step_b: 'bg-orange-500/10 text-orange-400',
  resolve_deficit_step_c_escalation: 'bg-red-500/10 text-red-400',
  simulate_mass_absence: 'bg-rose-500/10 text-rose-400',
  comprehensive_seed: 'bg-purple-500/10 text-purple-400',
};

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const toast = useToast();

  const loadData = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 30 };
      if (filterAction) params.action = filterAction;

      const [logData, statsData] = await Promise.all([
        auditAPI.getAll(params),
        auditAPI.getStats(),
      ]);

      setLogs(logData.data || []);
      setPagination(logData.pagination || { page: 1, pages: 1, total: 0 });
      setStats(Array.isArray(statsData) ? statsData : []);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Reloading is intentionally keyed to the active filter; loadData also drives pagination.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [filterAction]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const uniqueActions = [...new Set(stats.map(s => s._id))].sort();

  return (
    <main className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Audit Trail</h1>
          <p className="text-slate-400 text-sm">
            Every assignment, reassignment, and system action is logged for accountability.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <FileText className="w-4 h-4" />
          <span className="font-mono">{pagination.total}</span> total entries
        </div>
      </div>

      {/* Action Stats */}
      <div className="flex gap-2 flex-wrap">
        {stats.slice(0, 8).map(s => (
          <button
            key={s._id}
            onClick={() => setFilterAction(filterAction === s._id ? '' : s._id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              filterAction === s._id
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{s._id.replace(/_/g, ' ')}</span>
            <span className="font-mono text-[10px] opacity-70">({s.count})</span>
          </button>
        ))}
        {filterAction && (
          <button
            onClick={() => setFilterAction('')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-all"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 glass-card rounded-2xl p-4">
        <Filter className="w-4 h-4 text-slate-500" />
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 focus:outline-none focus:border-blue-500 text-sm"
        >
          <option value="">All Actions</option>
          {uniqueActions.map(a => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Log Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-700/50">
        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Audit Entries</h3>
            <p className="text-slate-400">Actions will appear here as they are performed.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {logs.map(log => {
              const actionCls = ACTION_COLORS[log.action] || 'bg-slate-500/10 text-slate-400';
              const isExpanded = expandedId === (log._id || log.id);

              return (
                <div
                  key={log._id || log.id}
                  className="hover:bg-slate-700/10 transition-colors"
                >
                  <button
                    onClick={() => toggleExpand(log._id || log.id)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${actionCls}`}>
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <User className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{log.actor}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="whitespace-nowrap">{formatDate(log.createdAt || log.timestamp)}</span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-3 animate-slide-down">
                      {log.before_state && (
                        <div>
                          <div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Before State</div>
                          <pre className="text-xs text-slate-400 bg-slate-900/50 rounded-lg p-3 overflow-x-auto max-h-40 overflow-y-auto">
                            {JSON.stringify(log.before_state, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.before_state && log.after_state && (
                        <div className="flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 text-blue-400" />
                        </div>
                      )}
                      {log.after_state && (
                        <div>
                          <div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">After State</div>
                          <pre className="text-xs text-slate-400 bg-slate-900/50 rounded-lg p-3 overflow-x-auto max-h-40 overflow-y-auto">
                            {JSON.stringify(log.after_state, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={pagination.page <= 1}
            onClick={() => loadData(pagination.page - 1)}
            className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 text-sm disabled:opacity-30 hover:bg-slate-700/50 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-slate-400 font-mono">
            {pagination.page} / {pagination.pages}
          </span>
          <button
            disabled={pagination.page >= pagination.pages}
            onClick={() => loadData(pagination.page + 1)}
            className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 text-sm disabled:opacity-30 hover:bg-slate-700/50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
};

export default AuditLogPage;
