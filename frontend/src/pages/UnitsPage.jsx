import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';
import { useToast } from '../components/Toast';
import { unitsAPI } from '../services/api';

const STS = {
  'Available': 'bg-success/10 text-success border-success drop-shadow-[0_0_5px_rgba(0,200,83,0.5)]',
  'En Route': 'bg-amber/10 text-amber border-amber drop-shadow-[0_0_5px_rgba(255,191,0,0.5)]',
  'On Scene': 'bg-crimson/10 text-crimson border-crimson drop-shadow-[0_0_5px_rgba(213,0,0,0.5)]',
  'Standby': 'bg-surface-tint/10 text-surface-tint border-surface-tint drop-shadow-[0_0_5px_rgba(0,219,231,0.5)]',
  'Off Duty': 'bg-outline-variant/10 text-outline-variant border-outline-variant drop-shadow-[0_0_5px_rgba(132,148,149,0.5)]',
  'Patrolling': 'bg-primary/10 text-primary border-primary drop-shadow-[0_0_5px_rgba(0,242,255,0.5)]',
};

const emptyForm = { unitId: '', type: 'Patrol', status: 'Available', sectorName: '', location: '' };

const UnitsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fSts, setFSts] = useState('');
  const [fType, setFType] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const load = async () => {
    try {
      const p = {};
      if (fSts) p.status = fSts;
      if (fType) p.type = fType;
      setItems(await unitsAPI.getAll(p));
    } catch { toast.error('Failed to load unit telemetry'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [fSts, fType]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModal(true); };
  const openEdit = (u) => {
    setEditId(u._id);
    setForm({ unitId: u.unitId, type: u.type, status: u.status, sectorName: u.sectorName || '', location: u.location });
    setModal(true);
  };
  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editId) { await unitsAPI.update(editId, form); toast.success('Unit parameters updated'); }
      else { await unitsAPI.create(form); toast.success('Unit initialized'); }
      setModal(false); load();
    } catch (err) { toast.error(err.message); }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await unitsAPI.delete(deleteTarget); toast.success('Unit removed from grid'); load(); }
    catch (err) { toast.error(err.message); }
    finally { setDeleteTarget(null); }
  };

  const filtered = items.filter(u =>
    u.unitId.toLowerCase().includes(search.toLowerCase()) ||
    u.location.toLowerCase().includes(search.toLowerCase()) ||
    u.type.toLowerCase().includes(search.toLowerCase())
  );

  const tableColumns = [
    { header: 'CALL SIGN / DESIGNATION', accessor: 'unitId', render: (row) => (
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-outline-variant text-[18px]">directions_car</span>
        <span className="font-data-md text-[14px] text-on-surface uppercase font-bold tracking-wider">UNIT {row.unitId}</span>
      </div>
    )},
    { header: 'CLASS', accessor: 'type', render: (row) => (
      <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">{row.type}</span>
    )},
    { header: 'OPERATIONAL STATUS', accessor: 'status', render: (row) => (
      <span className={`font-label-caps text-[10px] px-2 py-1 rounded border uppercase tracking-widest ${STS[row.status] || STS.Available}`}>
        {row.status}
      </span>
    )},
    { header: 'SECTOR', accessor: 'sectorName', render: (row) => (
      <span className="font-data-md text-[12px] text-primary">{row.sectorName || 'UNASSIGNED'}</span>
    )},
    { header: 'CURRENT VECTOR', accessor: 'location', render: (row) => (
      <span className="font-data-md text-[11px] text-outline-variant">{row.location}</span>
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
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-surface-tint/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-end mb-6 z-10 border-b border-outline-variant/30 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>local_police</span>
            <h1 className="font-headline-md text-headline-md text-primary-container tracking-tight">Tactical Units</h1>
          </div>
          <p className="font-data-md text-data-md text-on-surface-variant">Manage active patrols, special response teams, and fleet status.</p>
        </div>
        
        <button onClick={openCreate} className="btn-primary px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.15)] hover:shadow-[0_0_25px_rgba(0,242,255,0.4)]">
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          INITIALIZE UNIT
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 z-10 mb-6 glass-panel p-3 rounded-lg">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="QUERY DATABASE..." className="w-full pl-10 pr-4 py-2 rounded-sm bg-surface-container-lowest border border-outline-variant/50 text-on-surface font-data-md text-[13px] placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
        </div>
        <select value={fType} onChange={e => setFType(e.target.value)} className="px-4 py-2 rounded-sm bg-surface-container-lowest border border-outline-variant/50 text-on-surface font-data-md text-[13px] focus:outline-none focus:border-primary">
          <option value="">ALL CLASSES</option><option value="Patrol">PATROL</option><option value="Response">RESPONSE</option><option value="K-9">K-9</option><option value="Tactical">TACTICAL</option><option value="Air Support">AIR SUPPORT</option><option value="Traffic">TRAFFIC</option><option value="Detective">DETECTIVE</option>
        </select>
        <select value={fSts} onChange={e => setFSts(e.target.value)} className="px-4 py-2 rounded-sm bg-surface-container-lowest border border-outline-variant/50 text-on-surface font-data-md text-[13px] focus:outline-none focus:border-primary">
          <option value="">ALL STATUSES</option><option value="Available">AVAILABLE</option><option value="En Route">EN ROUTE</option><option value="On Scene">ON SCENE</option><option value="Standby">STANDBY</option><option value="Patrolling">PATROLLING</option><option value="Off Duty">OFF DUTY</option>
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto z-10 custom-scrollbar pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-surface-tint border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center sentinel-panel border border-outline-variant/30 rounded-lg">
            <span className="material-symbols-outlined text-6xl text-outline-variant/30 mb-4">search_off</span>
            <p className="font-headline-md text-headline-md text-on-surface mb-2">NO UNITS DETECTED</p>
            <p className="font-data-md text-data-md text-on-surface-variant max-w-md">Adjust search parameters or initialize a new tactical unit.</p>
          </div>
        ) : (
          <DataTable columns={tableColumns} data={filtered} />
        )}
      </div>

      <div className="z-10 text-right mt-4 font-data-md text-[12px] text-outline-variant tracking-widest">
        DISPLAYING {filtered.length} OF {items.length} RECORDS
      </div>

      {/* Modals */}
      {modal && (
        <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'UPDATE UNIT PARAMETERS' : 'INITIALIZE TACTICAL UNIT'}>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest">Call Sign / ID</label>
                <input type="text" value={form.unitId} onChange={e => setForm({...form, unitId: e.target.value})} required className="input-field w-full rounded-sm px-4 py-3 bg-surface-container-lowest" placeholder="e.g. 104" disabled={!!editId} />
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest">Unit Class</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input-field w-full rounded-sm px-4 py-3 bg-surface-container-lowest">
                  {['Patrol','Response','K-9','Tactical','Air Support','Traffic','Detective'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest">Operational Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input-field w-full rounded-sm px-4 py-3 bg-surface-container-lowest">
                  {['Available','En Route','On Scene','Standby','Patrolling','Off Duty'].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest">Assigned Sector</label>
                <input type="text" value={form.sectorName} onChange={e => setForm({...form, sectorName: e.target.value})} placeholder="e.g. Sector A1" className="input-field w-full rounded-sm px-4 py-3 bg-surface-container-lowest" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest">Current Vector (Location)</label>
              <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} required className="input-field w-full rounded-sm px-4 py-3 bg-surface-container-lowest" placeholder="Coordinates or Address" />
            </div>

            <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-outline-variant/30">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary px-6 py-2.5 rounded-lg">ABORT</button>
              <button type="submit" className="btn-primary px-8 py-2.5 rounded-lg">EXECUTE</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="CONFIRM DECOMMISSION">
          <div className="text-center py-6">
            <span className="material-symbols-outlined text-6xl text-crimson mb-4 drop-shadow-[0_0_15px_rgba(213,0,0,0.5)]">warning</span>
            <p className="font-headline-md text-headline-md text-on-surface mb-2">DECOMMISSION UNIT?</p>
            <p className="font-data-md text-data-md text-on-surface-variant mb-8">This action will permanently remove the unit from the active grid.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary px-8 py-2.5 rounded-lg">ABORT</button>
              <button onClick={confirmDelete} className="bg-crimson/20 border border-crimson text-crimson font-label-caps px-8 py-2.5 rounded-lg hover:bg-crimson hover:text-white transition-all shadow-[0_0_15px_rgba(213,0,0,0.2)] hover:shadow-[0_0_25px_rgba(213,0,0,0.5)]">DECOMMISSION</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UnitsPage;
