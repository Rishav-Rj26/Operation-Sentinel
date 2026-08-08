import { useState, useEffect } from 'react';
import { Car, Plus, Search, Trash2, Edit3, MapPin } from 'lucide-react';
import Modal from '../components/Modal';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';
import { unitsAPI } from '../services/api';

const STS = {
  Available: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  'En Route': 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
  'On Scene': 'bg-red-500/10 text-red-400 ring-red-500/20',
  Standby: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  'Off Duty': 'bg-slate-500/10 text-slate-400 ring-slate-500/20',
  Patrolling: 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/20',
};
const empty = { unitId:'', type:'Patrol', status:'Available', sectorName:'', location:'' };

const UnitsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fSts, setFSts] = useState('');
  const [fType, setFType] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(empty);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const load = async () => {
    try {
      const p = {};
      if (fSts) p.status = fSts;
      if (fType) p.type = fType;
      setItems(await unitsAPI.getAll(p));
    } catch { toast.error('Failed to load units'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [fSts, fType]); // eslint-disable-line

  const openCreate = () => { setEditId(null); setForm(empty); setModal(true); };
  const openEdit = (u) => {
    setEditId(u._id);
    setForm({ unitId:u.unitId, type:u.type, status:u.status, sectorName:u.sectorName||'', location:u.location });
    setModal(true);
  };
  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editId) { await unitsAPI.update(editId, form); toast.success('Unit updated'); }
      else { await unitsAPI.create(form); toast.success('Unit created'); }
      setModal(false); load();
    } catch (err) { toast.error(err.message); }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await unitsAPI.delete(deleteTarget); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.message); }
    finally { setDeleteTarget(null); }
  };

  const filtered = items.filter(u =>
    u.unitId.toLowerCase().includes(search.toLowerCase()) ||
    u.location.toLowerCase().includes(search.toLowerCase()) ||
    u.type.toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

  return (
    <main className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Units</h1>
          <p className="text-slate-400 text-sm">Manage all tactical and patrol units.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4 mr-2" />Add Unit
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search units..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
        </div>
        <select value={fType} onChange={e=>setFType(e.target.value)} className="px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-300 focus:outline-none focus:border-blue-500">
          <option value="">All Types</option><option value="Patrol">Patrol</option><option value="Response">Response</option><option value="K-9">K-9</option><option value="Tactical">Tactical</option><option value="Air Support">Air Support</option><option value="Traffic">Traffic</option><option value="Detective">Detective</option>
        </select>
        <select value={fSts} onChange={e=>setFSts(e.target.value)} className="px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-300 focus:outline-none focus:border-blue-500">
          <option value="">All Status</option><option value="Available">Available</option><option value="En Route">En Route</option><option value="On Scene">On Scene</option><option value="Standby">Standby</option><option value="Patrolling">Patrolling</option><option value="Off Duty">Off Duty</option>
        </select>
      </div>

      <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-md shadow-xl overflow-hidden">
        {loading ? <div className="p-4"><TableSkeleton rows={6} /></div>
        : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No units found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-700/50 bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Unit ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Sector</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Location</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map(u => (
                  <tr key={u._id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3"><span className="text-sm font-bold text-white">Unit {u.unitId}</span></td>
                    <td className="px-4 py-3"><span className="text-sm text-slate-300">{u.type}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-full ring-1 ring-inset font-medium ${STS[u.status]||STS.Available}`}>{u.status}</span></td>
                    <td className="px-4 py-3"><span className="text-sm text-slate-300">{u.sectorName||'—'}</span></td>
                    <td className="px-4 py-3"><span className="flex items-center text-sm text-slate-300"><MapPin className="w-3 h-3 mr-1 text-slate-500" />{u.location}</span></td>
                    <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1">
                      <button onClick={()=>openEdit(u)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-blue-400 transition-colors"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={()=>setDeleteTarget(u._id)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="text-sm text-slate-500 text-right">Showing {filtered.length} of {items.length}</div>

      <Modal isOpen={modal} onClose={()=>setModal(false)} title={editId?'Edit Unit':'Add New Unit'}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Unit ID</label>
              <input type="text" value={form.unitId} onChange={e=>setForm({...form,unitId:e.target.value})} required placeholder="e.g. 104" className={inputCls} disabled={!!editId} /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Type</label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className={inputCls}>
                {['Patrol','Response','K-9','Tactical','Air Support','Traffic','Detective'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className={inputCls}>
                {['Available','En Route','On Scene','Standby','Patrolling','Off Duty'].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Sector</label>
              <input type="text" value={form.sectorName} onChange={e=>setForm({...form,sectorName:e.target.value})} placeholder="Sector A1" className={inputCls} /></div>
          </div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Location</label>
            <input type="text" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} required placeholder="Current location" className={inputCls} /></div>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all">
            {editId?'Update':'Add'} Unit</button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} title="Confirm Deletion" size="sm">
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-slate-300 font-medium mb-1">Delete this unit?</p>
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

export default UnitsPage;
