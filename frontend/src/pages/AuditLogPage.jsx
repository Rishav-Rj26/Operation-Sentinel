import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { auditAPI } from '../services/api';

const ACTION_COLORS = {
  create_zone: 'bg-success/10 text-success border-success',
  update_zone: 'bg-primary/10 text-primary border-primary',
  delete_zone: 'bg-crimson/10 text-crimson border-crimson',
  create_officer: 'bg-success/10 text-success border-success',
  update_officer: 'bg-primary/10 text-primary border-primary',
  delete_officer: 'bg-crimson/10 text-crimson border-crimson',
  bulk_create_officers: 'bg-primary-fixed/10 text-primary-fixed border-primary-fixed',
  generate_roster: 'bg-surface-tint/10 text-surface-tint border-surface-tint',
  resolve_deficit_step_a: 'bg-amber/10 text-amber border-amber',
  resolve_deficit_step_b: 'bg-amber/20 text-amber border-amber',
  resolve_deficit_step_c_escalation: 'bg-crimson/10 text-crimson border-crimson',
  simulate_mass_absence: 'bg-crimson/20 text-crimson border-crimson',
  comprehensive_seed: 'bg-primary-container/10 text-primary-container border-primary-container',
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
      toast.error('Failed to load audit telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [filterAction]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
  };

  const uniqueActions = [...new Set(stats.map(s => s._id))].sort();

  return (
    <div className="flex-1 p-gutter flex flex-col overflow-hidden relative bg-background">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary-container/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-end mb-6 z-10 border-b border-outline-variant/30 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
            <h1 className="font-headline-md text-headline-md text-primary-container tracking-tight">Audit Trail</h1>
          </div>
          <p className="font-data-md text-data-md text-on-surface-variant">Immutable ledger of all system actions, assignments, and protocols.</p>
        </div>
        <div className="flex items-center gap-2 font-data-md text-[12px] text-outline-variant uppercase tracking-widest">
          <span className="material-symbols-outlined text-[16px]">receipt_long</span>
          <span className="font-bold text-primary">{pagination.total}</span> TOTAL ENTRIES
        </div>
      </div>

      {/* Filter and Stats */}
      <div className="flex flex-col gap-4 mb-6 z-10">
        <div className="flex items-center gap-3 glass-panel rounded-lg p-3">
          <span className="material-symbols-outlined text-outline-variant text-[18px]">filter_list</span>
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="flex-1 px-4 py-2 rounded-sm bg-surface-container-lowest border border-outline-variant/50 text-on-surface font-data-md text-[13px] uppercase tracking-widest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          >
            <option value="">ALL ACTION PROTOCOLS</option>
            {uniqueActions.map(a => (
              <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 flex-wrap">
          {stats.slice(0, 10).map(s => {
            const isActive = filterAction === s._id;
            return (
              <button
                key={s._id}
                onClick={() => setFilterAction(isActive ? '' : s._id)}
                className={`font-label-caps text-[10px] px-3 py-1.5 rounded uppercase tracking-widest transition-all border flex items-center gap-2 ${
                  isActive
                    ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_10px_rgba(0,242,255,0.2)]'
                    : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-primary/30 hover:text-on-surface'
                }`}
              >
                <span>{s._id.replace(/_/g, ' ')}</span>
                <span className="font-data-md text-[10px] bg-background/50 px-1.5 py-0.5 rounded">{s.count}</span>
              </button>
            );
          })}
          {filterAction && (
            <button
              onClick={() => setFilterAction('')}
              className="font-label-caps text-[10px] px-3 py-1.5 rounded uppercase tracking-widest transition-all border border-crimson/30 text-crimson hover:bg-crimson hover:text-white"
            >
              CLEAR FILTER
            </button>
          )}
        </div>
      </div>

      {/* Log Table */}
      <div className="sentinel-panel rounded-lg flex-1 overflow-hidden border border-outline-variant/30 z-10 shadow-[0_0_20px_rgba(0,0,0,0.3)] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-surface-container-lowest/50">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_10px_rgba(0,242,255,0.5)] mb-4"></div>
            <p className="font-label-caps text-[11px] text-primary uppercase tracking-widest animate-pulse">Scanning Audit Logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-surface-container-lowest/50 text-center p-8">
            <span className="material-symbols-outlined text-6xl text-outline-variant/30 mb-4">receipt_long</span>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2 uppercase tracking-wider">NO AUDIT ENTRIES</h3>
            <p className="font-data-md text-data-md text-on-surface-variant">System actions will be recorded here as they occur.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface-container-lowest/30 divide-y divide-outline-variant/20">
            {logs.map(log => {
              const actionCls = ACTION_COLORS[log.action] || 'bg-outline-variant/10 text-outline border-outline-variant/50';
              const isExpanded = expandedId === (log._id || log.id);

              return (
                <div key={log._id || log.id} className="hover:bg-white/5 transition-colors group">
                  <button
                    onClick={() => toggleExpand(log._id || log.id)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <div className="flex items-center gap-6 min-w-0">
                      <span className={`font-label-caps text-[10px] px-2.5 py-1 rounded border uppercase tracking-widest whitespace-nowrap ${actionCls}`}>
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                      
                      <div className="flex items-center gap-2 font-data-md text-[12px] text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]">account_circle</span>
                        <span className="truncate uppercase tracking-wider">{log.actor}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 font-data-md text-[11px] text-primary">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        <span className="whitespace-nowrap tracking-widest">{formatDate(log.createdAt || log.timestamp)}</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[20px] text-outline-variant group-hover:text-primary transition-colors">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 animate-slide-down">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {log.before_state && (
                          <div className="flex flex-col gap-2">
                            <div className="font-label-caps text-[10px] text-outline-variant uppercase tracking-widest flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber"></span>
                              Pre-Execution State
                            </div>
                            <pre className="font-data-md text-[11px] text-amber bg-background border border-outline-variant/30 rounded p-3 overflow-x-auto max-h-48 overflow-y-auto custom-scrollbar">
                              {JSON.stringify(log.before_state, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {log.after_state && (
                          <div className="flex flex-col gap-2">
                            <div className="font-label-caps text-[10px] text-outline-variant uppercase tracking-widest flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                              Post-Execution State
                            </div>
                            <pre className="font-data-md text-[11px] text-success bg-background border border-outline-variant/30 rounded p-3 overflow-x-auto max-h-48 overflow-y-auto custom-scrollbar">
                              {JSON.stringify(log.after_state, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                      
                      {(!log.before_state && !log.after_state) && (
                        <div className="font-data-md text-[11px] text-outline-variant uppercase tracking-widest bg-background/50 border border-outline-variant/30 rounded p-3 text-center">
                          NO STATE PAYLOAD RECORDED
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
        <div className="flex items-center justify-between mt-4 z-10 glass-panel rounded-lg p-2 px-4">
          <button
            disabled={pagination.page <= 1}
            onClick={() => loadData(pagination.page - 1)}
            className="font-label-caps text-[11px] px-4 py-2 rounded uppercase tracking-widest text-on-surface-variant hover:bg-white/10 hover:text-primary transition-all disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span> PREV
          </button>
          
          <div className="font-data-md text-[12px] text-outline-variant tracking-widest flex items-center gap-2">
            PAGE <span className="text-primary font-bold">{pagination.page}</span> OF <span className="text-primary font-bold">{pagination.pages}</span>
          </div>
          
          <button
            disabled={pagination.page >= pagination.pages}
            onClick={() => loadData(pagination.page + 1)}
            className="font-label-caps text-[11px] px-4 py-2 rounded uppercase tracking-widest text-on-surface-variant hover:bg-white/10 hover:text-primary transition-all disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-1"
          >
            NEXT <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
