import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import IncidentTimeline from '../components/IncidentTimeline';
import DataTable from '../components/DataTable';
import { useToast } from '../components/Toast';
import { incidentsAPI } from '../services/api';
import { useSearchParams } from 'react-router-dom';

const emptyForm = { title: '', description: '', severity: 'medium', status: 'reported', location: '' };

const IncidentsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const [fSev, setFSev] = useState(searchParams.get('severity') || '');
  const [fSts, setFSts] = useState(searchParams.get('status') || '');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'timeline'
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const load = async () => {
    try {
      const p = {};
      if (fSev) p.severity = fSev;
      if (fSts) p.status = fSts;
      setItems(await incidentsAPI.getAll(p));
    } catch { toast.error('Failed to load incidents'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [fSev, fSts]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModal(true); };
  const openEdit = (i) => {
    setEditId(i._id);
    setForm({ title: i.title, description: i.description || '', severity: i.severity, status: i.status, location: i.location });
    setModal(true);
  };
  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editId) { await incidentsAPI.update(editId, form); toast.success('Alert updated'); }
      else { await incidentsAPI.create(form); toast.success('Alert initialized'); }
      setModal(false); load();
    } catch (err) { toast.error(err.message); }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await incidentsAPI.delete(deleteTarget); toast.success('Alert purged'); load(); }
    catch (err) { toast.error(err.message); }
    finally { setDeleteTarget(null); }
  };

  const filtered = items.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.location.toLowerCase().includes(search.toLowerCase())
  );

  const getSevColors = (sev) => {
    switch(sev) {
      case 'critical': return 'text-crimson bg-crimson/10 border-crimson drop-shadow-[0_0_5px_rgba(213,0,0,0.5)]';
      case 'high': return 'text-amber bg-amber/10 border-amber drop-shadow-[0_0_5px_rgba(255,191,0,0.5)]';
      case 'medium': return 'text-surface-tint bg-surface-tint/10 border-surface-tint drop-shadow-[0_0_5px_rgba(0,219,231,0.5)]';
      default: return 'text-success bg-success/10 border-success drop-shadow-[0_0_5px_rgba(0,200,83,0.5)]';
    }
  };

  const tableColumns = [
    { header: 'ALERT DESIGNATION', accessor: 'title', render: (row) => (
      <div>
        <p className="font-data-md text-[14px] text-on-surface uppercase">{row.title}</p>
        {row.description && <p className="font-data-md text-[11px] text-on-surface-variant/70 truncate max-w-xs">{row.description}</p>}
      </div>
    )},
    { header: 'SEVERITY', accessor: 'severity', render: (row) => (
      <span className={`font-label-caps text-[10px] px-2 py-1 rounded border uppercase tracking-widest ${getSevColors(row.severity)}`}>
        {row.severity}
      </span>
    )},
    { header: 'STATUS', accessor: 'status', render: (row) => (
      <span className="font-label-caps text-[10px] text-primary uppercase tracking-widest">{row.status}</span>
    )},
    { header: 'VECTOR (LOCATION)', accessor: 'location', render: (row) => (
      <span className="font-data-md text-[12px] text-outline-variant">{row.location}</span>
    )},
    { header: 'TIMESTAMP', accessor: 'time', render: (row) => (
      <span className="font-data-md text-[12px] text-primary font-bold tracking-widest">
        {new Date(row.createdAt).toLocaleTimeString('en-US', { hour12: false })}
      </span>
    )},
    { header: 'ACTIONS', align: 'right', render: (row) => (
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => openEdit(row)} className="text-outline-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-[18px]">terminal</span></button>
        <button onClick={() => setDeleteTarget(row._id)} className="text-outline-variant hover:text-crimson transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
      </div>
    )}
  ];

  return (
    <div className="flex-1 p-gutter flex flex-col overflow-hidden relative bg-background">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-crimson/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-end mb-6 z-10 border-b border-outline-variant/30 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-crimson" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <h1 className="font-headline-md text-headline-md text-crimson tracking-tight drop-shadow-[0_0_10px_rgba(213,0,0,0.5)]">Critical Incident Alert</h1>
          </div>
          <p className="font-data-md text-data-md text-on-surface-variant">Real-time threat monitoring and resolution tracking.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-1">
            <button onClick={() => setViewMode('table')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-label-caps tracking-widest transition-all ${viewMode === 'table' ? 'bg-primary/20 text-primary border border-primary/50' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <span className="material-symbols-outlined text-[16px]">list</span> TABLE
            </button>
            <button onClick={() => setViewMode('timeline')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-label-caps tracking-widest transition-all ${viewMode === 'timeline' ? 'bg-primary/20 text-primary border border-primary/50' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <span className="material-symbols-outlined text-[16px]">timeline</span> TIMELINE
            </button>
          </div>
          <button onClick={openCreate} className="btn-primary px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.15)] hover:shadow-[0_0_25px_rgba(0,242,255,0.4)]">
            <span className="material-symbols-outlined text-[18px]">add_alert</span>
            INITIALIZE ALERT
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 z-10 mb-6 glass-panel p-3 rounded-lg">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="QUERY DATABASE..." className="w-full pl-10 pr-4 py-2 rounded-sm bg-surface-container-lowest border border-outline-variant/50 text-on-surface font-data-md text-[13px] placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
        </div>
        <select value={fSev} onChange={e => setFSev(e.target.value)} className="px-4 py-2 rounded-sm bg-surface-container-lowest border border-outline-variant/50 text-on-surface font-data-md text-[13px] focus:outline-none focus:border-primary">
          <option value="">ALL SEVERITIES</option><option value="low">LOW</option><option value="medium">MEDIUM</option><option value="high">HIGH</option><option value="critical">CRITICAL</option>
        </select>
        <select value={fSts} onChange={e => setFSts(e.target.value)} className="px-4 py-2 rounded-sm bg-surface-container-lowest border border-outline-variant/50 text-on-surface font-data-md text-[13px] focus:outline-none focus:border-primary">
          <option value="">ALL STATUSES</option><option value="reported">REPORTED</option><option value="responding">RESPONDING</option><option value="resolved">RESOLVED</option><option value="closed">CLOSED</option>
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto z-10 custom-scrollbar pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-surface-tint border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : viewMode === 'timeline' ? (
          <IncidentTimeline incidents={filtered} onEdit={openEdit} />
        ) : (
          <DataTable columns={tableColumns} data={filtered} />
        )}
      </div>

      <div className="z-10 text-right mt-4 font-data-md text-[12px] text-outline-variant tracking-widest">
        DISPLAYING {filtered.length} OF {items.length} RECORDS
      </div>

      {/* Modals */}
      {modal && (
        <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'UPDATE ALERT PROTOCOL' : 'INITIALIZE ALERT PROTOCOL'}>
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest">Alert Designation</label>
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="input-field w-full rounded-sm px-4 py-3 bg-surface-container-lowest" placeholder="e.g. SUSPICIOUS ACTIVITY" />
            </div>
            
            <div className="space-y-2">
              <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest">Vector (Location)</label>
              <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} required className="input-field w-full rounded-sm px-4 py-3 bg-surface-container-lowest" placeholder="Coordinates or Address" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest">Severity Protocol</label>
                <select value={form.severity} onChange={e => setForm({...form, severity: e.target.value})} className="input-field w-full rounded-sm px-4 py-3 bg-surface-container-lowest">
                  <option value="low">LOW</option><option value="medium">MEDIUM</option><option value="high">HIGH</option><option value="critical">CRITICAL</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest">Cascade Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input-field w-full rounded-sm px-4 py-3 bg-surface-container-lowest">
                  <option value="reported">REPORTED</option><option value="responding">RESPONDING</option><option value="resolved">RESOLVED</option><option value="closed">CLOSED</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest">Tactical Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="input-field w-full rounded-sm px-4 py-3 bg-surface-container-lowest resize-none" placeholder="Enter tactical details..." />
            </div>

            <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-outline-variant/30">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary px-6 py-2.5 rounded-lg">ABORT</button>
              <button type="submit" className="btn-primary px-8 py-2.5 rounded-lg">EXECUTE</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="CONFIRM PURGE">
          <div className="text-center py-6">
            <span className="material-symbols-outlined text-6xl text-crimson mb-4 drop-shadow-[0_0_15px_rgba(213,0,0,0.5)]">warning</span>
            <p className="font-headline-md text-headline-md text-on-surface mb-2">PURGE RECORD?</p>
            <p className="font-data-md text-data-md text-on-surface-variant mb-8">This action will permanently erase the alert from the database.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary px-8 py-2.5 rounded-lg">ABORT</button>
              <button onClick={confirmDelete} className="bg-crimson/20 border border-crimson text-crimson font-label-caps px-8 py-2.5 rounded-lg hover:bg-crimson hover:text-white transition-all shadow-[0_0_15px_rgba(213,0,0,0.2)] hover:shadow-[0_0_25px_rgba(213,0,0,0.5)]">PURGE</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default IncidentsPage;
