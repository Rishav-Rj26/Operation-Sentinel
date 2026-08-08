import { useState, useEffect } from 'react';
import { MapPin, Grid3X3, Link as LinkIcon, Zap, Plus, Settings, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { zonesAPI } from '../services/api';

const emptyForm = { name: '', sizeScore: 5, densityScore: 5, adjacentZones: [] };

const computeZScore = (s, d) => ((0.4 * s + 0.6 * d) / 1.0).toFixed(2);

const getColorForD = (d) => {
  if (d <= 3) return 'green';
  if (d <= 7) return 'yellow';
  return 'red';
};

const ZoneConfigPage = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await zonesAPI.getAll();
      setZones(Array.isArray(res) ? res : (res.data || []));
    } catch (err) {
      toast.error('Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModal(true); };
  const openEdit = (z) => {
    setEditId(z._id || z.id);
    setForm({ 
      name: z.name, 
      sizeScore: z.sizeScore || 5, 
      densityScore: z.densityScore || 5, 
      adjacentZones: z.adjacentZones || [] 
    });
    setModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await zonesAPI.update(editId, form);
        toast.success('Zone updated');
      } else {
        await zonesAPI.create(form);
        toast.success('Zone created');
      }
      setModal(false);
      loadData();
    } catch (err) { toast.error(err.message || 'Error saving zone'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await zonesAPI.delete(deleteTarget);
      toast.success('Zone deleted');
      loadData();
    } catch (err) { toast.error(err.message || 'Error deleting zone'); }
    finally { setDeleteTarget(null); }
  };

  const handleToggleAdjacency = (id) => {
    setForm(prev => {
      const adj = prev.adjacentZones.includes(id) 
        ? prev.adjacentZones.filter(x => x !== id)
        : [...prev.adjacentZones, id];
      return { ...prev, adjacentZones: adj };
    });
  };

  // Pre-calculate positions for visualization nodes
  const nodeRadius = 120;
  const nodes = zones.map((z, i) => {
    const angle = (i / Math.max(1, zones.length)) * 2 * Math.PI;
    return {
      ...z,
      x: 150 + nodeRadius * Math.cos(angle),
      y: 150 + nodeRadius * Math.sin(angle),
    };
  });

  return (
    <main className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Zone Configuration</h1>
          <p className="text-slate-400 text-sm">Configure zone attributes and adjacencies.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4 mr-2" />Add Zone
        </button>
      </div>

      {/* Heatmap Strip */}
      <div className="glass-card rounded-2xl p-4 flex gap-1 h-12 items-center">
        {zones.length === 0 ? <span className="text-slate-500 text-sm">No zones configured</span> : 
          zones.map(z => {
            const c = getColorForD(z.densityScore || 5);
            const bg = c === 'green' ? 'bg-emerald-500' : c === 'yellow' ? 'bg-amber-500' : 'bg-crimson-500 bg-red-600';
            return (
              <div key={z._id || z.id} className={`flex-1 h-full rounded-sm opacity-80 hover:opacity-100 transition-opacity ${bg}`} title={`${z.name} (D:${z.densityScore})`} />
            );
          })
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto hide-scrollbar pr-2">
          {loading ? <div className="text-slate-500">Loading zones...</div> : 
           zones.length === 0 ? <div className="text-slate-500 text-center py-10 glass-card rounded-2xl">No zones created yet</div> :
           zones.map(z => {
             const c = getColorForD(z.densityScore || 5);
             const zScore = computeZScore(z.sizeScore ?? z.size_score ?? 5, z.densityScore ?? z.density_score ?? 5);
             const borderLeft = c === 'green' ? '#00C853' : c === 'yellow' ? '#FFBF00' : '#D50000';
             
             return (
               <div key={z._id || z.id} className="zone-card glass-card rounded-xl p-4 flex flex-col gap-3" style={{ borderLeft: `4px solid ${borderLeft}` }}>
                 <div className="flex justify-between items-start">
                   <div className="flex items-center gap-2">
                     <MapPin className="w-5 h-5 text-slate-400" />
                     <h3 className="text-lg font-bold text-white">{z.name}</h3>
                   </div>
                   <div className="flex gap-1">
                     <button onClick={()=>openEdit(z)} className="p-1.5 text-slate-400 hover:text-blue-400"><Settings className="w-4 h-4" /></button>
                     <button onClick={()=>setDeleteTarget(z._id || z.id)} className="p-1.5 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                   </div>
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                   <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                     <div className="text-[10px] text-slate-400 uppercase">Size (S)</div>
                     <div className="text-lg font-mono text-white">{z.sizeScore || 5}</div>
                   </div>
                   <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                     <div className="text-[10px] text-slate-400 uppercase">Density (D)</div>
                     <div className="text-lg font-mono text-white">{z.densityScore || 5}</div>
                   </div>
                   <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                     <div className="text-[10px] text-cyan-400 uppercase">Z-Score</div>
                     <div className="text-lg font-mono text-cyan-300">{zScore}</div>
                   </div>
                 </div>
                 <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                   <LinkIcon className="w-4 h-4" />
                   <span>Adjacencies: {(z.adjacentZones || []).length}</span>
                 </div>
               </div>
             );
           })
          }
        </div>

        {/* RIGHT PANEL - Adjacency Visualization */}
        <div className="glass-card rounded-2xl p-6 min-h-[400px] flex flex-col items-center justify-center relative">
          <h3 className="absolute top-6 left-6 text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" /> Adjacency Map
          </h3>
          
          <div className="adjacency-graph w-full max-w-[300px] aspect-square relative bg-transparent border-0 mt-8">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 300">
              {nodes.map(n => 
                (n.adjacentZones || []).map(adjId => {
                  const target = nodes.find(x => (x._id || x.id) === adjId);
                  if (!target) return null;
                  return (
                    <line 
                      key={`${n._id || n.id}-${adjId}`}
                      x1={n.x} y1={n.y} x2={target.x} y2={target.y}
                      className="edge-line"
                    />
                  );
                })
              )}
            </svg>
            
            {nodes.map(n => {
              const c = getColorForD(n.densityScore || 5);
              return (
                <div key={n._id || n.id} className={`node-zone ${c}`} style={{ left: `${n.x}px`, top: `${n.y}px` }}>
                  {n.name.substring(0, 3)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal} onClose={()=>setModal(false)} title={editId?'Edit Zone':'Add Zone'}>
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Zone Name</label>
            <input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="e.g. North Sector" className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500" />
          </div>
          
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-300">Size Score (S)</label>
              <span className="text-cyan-400 font-mono">{form.sizeScore}</span>
            </div>
            <input type="range" min="1" max="10" value={form.sizeScore} onChange={e=>setForm({...form,sizeScore:parseInt(e.target.value)})} className="score-slider" />
          </div>
          
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-300">Density Score (D)</label>
              <span className="text-cyan-400 font-mono">{form.densityScore}</span>
            </div>
            <input type="range" min="1" max="10" value={form.densityScore} onChange={e=>setForm({...form,densityScore:parseInt(e.target.value)})} className="score-slider" />
          </div>

          <div className="bg-slate-800/40 rounded-xl p-4 flex justify-between items-center border border-slate-700/50">
            <span className="text-sm text-slate-400 uppercase tracking-wide">Computed Z-Score</span>
            <span className="text-2xl font-bold text-cyan-400 tabular-nums flex items-center gap-2">
              <Zap className="w-5 h-5" />
              {computeZScore(form.sizeScore, form.densityScore)}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Adjacent Zones</label>
            <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto custom-scrollbar p-1">
              {zones.filter(z => (z._id || z.id) !== editId).map(z => (
                <label key={z._id || z.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/30 border border-slate-700/50 cursor-pointer hover:bg-slate-700/30 transition-colors">
                  <input type="checkbox" checked={form.adjacentZones.includes(z._id || z.id)} onChange={()=>handleToggleAdjacency(z._id || z.id)} className="rounded border-slate-600 text-blue-500 focus:ring-blue-500 bg-slate-900" />
                  <span className="text-sm text-slate-300 truncate">{z.name}</span>
                </label>
              ))}
              {zones.length <= 1 && <span className="text-slate-500 text-sm italic col-span-2">No other zones available</span>}
            </div>
          </div>
          
          <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all">
            {editId?'Update':'Add'} Zone
          </button>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} title="Confirm Deletion" size="sm">
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-slate-300 font-medium mb-1">Delete this zone?</p>
          <p className="text-slate-500 text-sm mb-6">This will remove adjacencies from other zones.</p>
          <div className="flex gap-3">
            <button onClick={()=>setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-white/5 transition-all">Cancel</button>
            <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold shadow-lg shadow-red-500/20 transition-all">Delete</button>
          </div>
        </div>
      </Modal>

    </main>
  );
};

export default ZoneConfigPage;
