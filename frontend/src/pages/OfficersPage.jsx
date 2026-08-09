import { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, AlertTriangle, Activity, Search, Filter, Edit, Trash2, SlidersHorizontal } from 'lucide-react';
import Modal from '../components/Modal';
import ForceConfigurationModal from '../components/ForceConfigurationModal';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';
import { officersAPI, zonesAPI } from '../services/api';

const RANKS = ['DGP', 'ADGP', 'IG', 'DIG', 'SP', 'DSP', 'ASP', 'Inspector', 'SI', 'ASI', 'HeadConstable', 'Constable'];
const STATUSES = ['active', 'on_leave', 'standby'];

const STATUS_COLORS = {
  active: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  on_leave: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  standby: 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20',
};

const emptyForm = { name: '', rank: 'Constable', status: 'active', zoneId: '' };

const OfficersPage = () => {
  const [officers, setOfficers] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fRank, setFRank] = useState('');
  const [fStatus, setFStatus] = useState('');
  
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [forceModal, setForceModal] = useState(false);
  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (fRank) params.rank = fRank;
      if (fStatus) params.status = fStatus;
      
      const [offData, zoneData] = await Promise.all([
        officersAPI.getAll(params),
        zonesAPI.getAll()
      ]);
      setOfficers(Array.isArray(offData) ? offData : (offData.data || []));
      setZones(Array.isArray(zoneData) ? zoneData : (zoneData.data || []));
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [fRank, fStatus]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModal(true); };
  const openEdit = (o) => {
    setEditId(o._id || o.id);
    setForm({ name: o.name, rank: o.rank, status: o.status, zoneId: o.zoneId || o.zone?._id || '' });
    setModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await officersAPI.update(editId, form);
        toast.success('Officer updated');
      } else {
        await officersAPI.create(form);
        toast.success('Officer created');
      }
      setModal(false);
      loadData();
    } catch (err) { toast.error(err.message || 'Error saving officer'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await officersAPI.delete(deleteTarget);
      toast.success('Officer deleted');
      loadData();
    } catch (err) { toast.error(err.message || 'Error deleting officer'); }
    finally { setDeleteTarget(null); }
  };

  const filtered = officers.filter(o =>
    o.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.rank?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: officers.length,
    active: officers.filter(o => o.status === 'active').length,
    on_leave: officers.filter(o => o.status === 'on_leave').length,
    standby: officers.filter(o => o.status === 'standby').length,
    avgFatigue: officers.length ? Math.round(officers.reduce((acc, o) => acc + (o.fatigueScore || 0), 0) / officers.length) : 0
  };

  const rankCounts = RANKS.reduce((acc, r) => {
    acc[r] = officers.filter(o => o.rank === r).length;
    return acc;
  }, {});

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

  return (
    <main className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Personnel Management</h1>
          <p className="text-slate-400 text-sm">Manage officers, view fatigue & force composition.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setForceModal(true)} className="inline-flex items-center rounded-xl bg-slate-800 border border-slate-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-all">
            <SlidersHorizontal className="w-4 h-4 mr-2" />Configure Force
          </button>
          <button onClick={openCreate} className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all">
            <UserPlus className="w-4 h-4 mr-2" />Add Officer
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Officers', val: stats.total, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Active', val: stats.active, icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Standby', val: stats.standby, icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'On Leave', val: stats.on_leave, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Avg Fatigue', val: stats.avgFatigue, icon: Activity, color: stats.avgFatigue > 60 ? 'text-red-400' : 'text-slate-300', bg: 'bg-slate-800' }
        ].map((s, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg}`}>
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">{s.label}</p>
              <h3 className="text-2xl font-bold text-white tabular-nums">{s.val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Rank Composition */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Force Composition by Rank</h3>
        <div className="flex items-end gap-2 h-32">
          {RANKS.map(r => {
            const h = stats.total ? (rankCounts[r] / stats.total) * 100 : 0;
            return (
              <div key={r} className="flex-1 flex flex-col items-center justify-end group">
                <div className="w-full max-w-[40px] bg-blue-500/20 rounded-t-lg relative transition-all group-hover:bg-blue-500/40" style={{ height: `${Math.max(h, 2)}%` }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {rankCounts[r]}
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-slate-500 uppercase rotate-[-45deg] origin-top-left translate-y-2 whitespace-nowrap">
                  {r}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search personnel..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
        </div>
        <select value={fRank} onChange={e=>setFRank(e.target.value)} className="px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-300 focus:outline-none focus:border-blue-500">
          <option value="">All Ranks</option>
          {RANKS.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} className="px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-300 focus:outline-none focus:border-blue-500">
          <option value="">All Status</option>
          {STATUSES.map(s=><option key={s} value={s}>{s.replace('_',' ').toUpperCase()}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-md shadow-xl overflow-hidden">
        {loading ? <div className="p-4"><TableSkeleton rows={6} /></div>
        : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No personnel found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-700/50 bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Zone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Fatigue Score</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map(o => {
                  const fScore = o.fatigueScore || 0;
                  const zName = zones.find(z => z._id === o.zoneId || z.id === o.zoneId)?.name || o.zone?.name || 'Unassigned';
                  return (
                  <tr key={o._id || o.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3"><span className="text-sm font-bold text-white">{o.name}</span></td>
                    <td className="px-4 py-3"><span className="text-sm text-slate-300">{o.rank}</span></td>
                    <td className="px-4 py-3"><span className="text-sm text-slate-400">{zName}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-full ring-1 ring-inset font-medium capitalize ${STATUS_COLORS[o.status]||STATUS_COLORS.active}`}>{o.status.replace('_',' ')}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 fatigue-indicator">
                          <div className="fatigue-marker" style={{ left: `${Math.min(100, Math.max(0, fScore))}%` }} />
                        </div>
                        <span className="text-xs font-mono text-slate-300">{fScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1">
                      <button onClick={()=>openEdit(o)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-blue-400 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={()=>setDeleteTarget(o._id || o.id)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div></td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <ForceConfigurationModal isOpen={forceModal} onClose={() => setForceModal(false)} onConfigured={loadData} />
      <Modal isOpen={modal} onClose={()=>setModal(false)} title={editId?'Edit Personnel':'Add Personnel'}>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
            <input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="e.g. John Doe" className={inputCls} /></div>
          
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Rank</label>
              <select value={form.rank} onChange={e=>setForm({...form,rank:e.target.value})} className={inputCls}>
                {RANKS.map(r=><option key={r} value={r}>{r}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className={inputCls}>
                {STATUSES.map(s=><option key={s} value={s}>{s.replace('_',' ').toUpperCase()}</option>)}
              </select></div>
          </div>
          
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Assigned Zone</label>
            <select value={form.zoneId} onChange={e=>setForm({...form,zoneId:e.target.value})} className={inputCls}>
              <option value="">-- Unassigned --</option>
              {zones.map(z=><option key={z._id || z.id} value={z._id || z.id}>{z.name}</option>)}
            </select>
          </div>
          
          <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all mt-4">
            {editId?'Update':'Add'} Officer</button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} title="Confirm Deletion" size="sm">
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-slate-300 font-medium mb-1">Delete this officer?</p>
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

export default OfficersPage;
