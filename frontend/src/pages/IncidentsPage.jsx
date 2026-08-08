import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Search, Trash2, Edit3, Clock, MapPin, List, GitBranch } from 'lucide-react';
import Modal from '../components/Modal';
import IncidentTimeline from '../components/IncidentTimeline';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';
import { incidentsAPI } from '../services/api';
import { useSearchParams } from 'react-router-dom';

const SEV_CLR = {
  low: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
  critical: 'bg-red-500/10 text-red-400 ring-red-500/20',
};
const STS_CLR = {
  reported: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  responding: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  closed: 'bg-slate-500/10 text-slate-400 ring-slate-500/20',
};
const empty = { title:'', description:'', severity:'medium', status:'reported', location:'' };

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
  const [form, setForm] = useState(empty);
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

  useEffect(() => { load(); }, [fSev, fSts]); // eslint-disable-line

  const openCreate = () => { setEditId(null); setForm(empty); setModal(true); };
  const openEdit = (i) => {
    setEditId(i._id);
    setForm({ title:i.title, description:i.description||'', severity:i.severity, status:i.status, location:i.location });
    setModal(true);
  };
  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editId) { await incidentsAPI.update(editId, form); toast.success('Updated'); }
      else { await incidentsAPI.create(form); toast.success('Created'); }
      setModal(false); load();
    } catch (err) { toast.error(err.message); }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await incidentsAPI.delete(deleteTarget); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.message); }
    finally { setDeleteTarget(null); }
  };

  const filtered = items.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.location.toLowerCase().includes(search.toLowerCase())
  );
  const fmtDate = d => new Date(d).toLocaleString('en-IN',{ day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

  return (
    <main className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Incidents</h1>
          <p className="text-slate-400 text-sm">Manage and track all reported incidents.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center rounded-xl bg-slate-800/50 border border-slate-700/50 p-0.5">
            <button onClick={() => setViewMode('table')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'table' ? 'bg-blue-500/15 text-blue-400' : 'text-slate-500 hover:text-white'}`}>
              <List className="w-3.5 h-3.5" />Table
            </button>
            <button onClick={() => setViewMode('timeline')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'timeline' ? 'bg-blue-500/15 text-blue-400' : 'text-slate-500 hover:text-white'}`}>
              <GitBranch className="w-3.5 h-3.5" />Timeline
            </button>
          </div>
          <button onClick={openCreate} className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all">
            <Plus className="w-4 h-4 mr-2" />Report Incident
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 animate-slide-up stagger-1" style={{ animationFillMode: 'both' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
        </div>
        <select value={fSev} onChange={e=>setFSev(e.target.value)} className="px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-300 focus:outline-none focus:border-blue-500">
          <option value="">All Severity</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
        </select>
        <select value={fSts} onChange={e=>setFSts(e.target.value)} className="px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-300 focus:outline-none focus:border-blue-500">
          <option value="">All Status</option><option value="reported">Reported</option><option value="responding">Responding</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
        </select>
      </div>

      {/* Content */}
      <div className="animate-slide-up stagger-2" style={{ animationFillMode: 'both' }}>
        {loading ? <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 p-4"><TableSkeleton rows={6} /></div>
        : viewMode === 'timeline' ? (
          <IncidentTimeline incidents={filtered} onEdit={openEdit} />
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No incidents found</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-md shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-slate-700/50 bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Incident</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Severity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Time</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-700/30">
                  {filtered.map(inc => (
                    <tr key={inc._id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3"><p className="text-sm font-medium text-white">{inc.title}</p>
                        {inc.description && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{inc.description}</p>}
                      </td>
                      <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-full ring-1 ring-inset font-medium capitalize ${SEV_CLR[inc.severity]}`}>{inc.severity}</span></td>
                      <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-full ring-1 ring-inset font-medium capitalize ${STS_CLR[inc.status]}`}>{inc.status}</span></td>
                      <td className="px-4 py-3"><span className="flex items-center text-sm text-slate-300"><MapPin className="w-3 h-3 mr-1 text-slate-500" />{inc.location}</span></td>
                      <td className="px-4 py-3"><span className="flex items-center text-xs text-slate-400"><Clock className="w-3 h-3 mr-1" />{fmtDate(inc.createdAt)}</span></td>
                      <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1">
                        <button onClick={()=>openEdit(inc)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-blue-400 transition-colors"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={()=>setDeleteTarget(inc._id)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <div className="text-sm text-slate-500 text-right">Showing {filtered.length} of {items.length}</div>

      <Modal isOpen={modal} onClose={()=>setModal(false)} title={editId?'Edit Incident':'Report New Incident'}>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
            <input type="text" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required placeholder="Incident title" className={inputCls} /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Location</label>
            <input type="text" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} required placeholder="Location" className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Severity</label>
              <select value={form.severity} onChange={e=>setForm({...form,severity:e.target.value})} className={inputCls}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className={inputCls}>
                <option value="reported">Reported</option><option value="responding">Responding</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div>
          </div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} placeholder="Describe..." className={`${inputCls} resize-none`} /></div>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all">
            {editId?'Update':'Report'} Incident</button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} title="Confirm Deletion" size="sm">
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-slate-300 font-medium mb-1">Delete this incident?</p>
          <p className="text-slate-500 text-sm mb-6">This action cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={()=>setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-white/5 transition-all">Cancel</button>
            <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold shadow-lg shadow-red-500/20 transition-all">Delete</button>
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default IncidentsPage;
