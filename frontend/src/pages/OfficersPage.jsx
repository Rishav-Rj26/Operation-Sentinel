import { useState, useEffect } from 'react';
import { officersAPI } from '../services/api';
import { useToast } from '../components/Toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const OfficersPage = () => {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegForm, setShowRegForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', badge: '', role: 'officer' });
  const [submitting, setSubmitting] = useState(false);
  
  const toast = useToast();

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    try {
      const data = await officersAPI.getAll();
      setOfficers(data);
    } catch (err) {
      toast.error('Failed to load personnel data');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Create random password for now
      await officersAPI.create({ ...form, password: 'password123' });
      toast.success('Personnel registered successfully');
      setShowRegForm(false);
      setForm({ name: '', email: '', badge: '', role: 'officer' });
      fetchOfficers();
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Badge ID', accessor: 'badge', render: (row) => <span className="font-data-md text-surface-tint">{row.badge || 'N/A'}</span> },
    { header: 'Name', accessor: 'name' },
    { header: 'Role', accessor: 'role', render: (row) => (
      <span className="px-2 py-0.5 rounded-sm bg-surface-variant/50 border border-outline-variant/30 text-[11px] uppercase tracking-wider">
        {row.role}
      </span>
    )},
    { header: 'Email', accessor: 'email', render: (row) => <span className="text-on-surface-variant">{row.email}</span> },
    { header: 'Status', accessor: 'status', render: (row) => {
      const isOnline = row.status === 'active' || row.status === 'online';
      return (
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-success shadow-[0_0_8px_rgba(0,200,83,0.5)]' : 'bg-on-surface-variant'}`}></div>
          <span className={`text-[11px] uppercase tracking-widest ${isOnline ? 'text-success' : 'text-on-surface-variant'}`}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      );
    }}
  ];

  return (
    <div className="flex-1 p-gutter flex flex-col overflow-hidden relative bg-background">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary-container/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="flex justify-between items-center mb-6 z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
            <h1 className="font-headline-md text-headline-md text-primary-container tracking-tight">Personnel Roster</h1>
          </div>
          <p className="font-data-md text-data-md text-on-surface-variant">Global overview of assigned personnel and dispatch status.</p>
        </div>
        
        <button 
          onClick={() => setShowRegForm(true)}
          className="btn-primary px-6 py-2.5 rounded-lg flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          REGISTER PERSONNEL
        </button>
      </div>

      <div className="flex-1 overflow-y-auto z-10 pb-8">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 w-full skeleton-shimmer rounded-sm border border-outline-variant/20"></div>
            ))}
          </div>
        ) : (
          <DataTable columns={columns} data={officers} />
        )}
      </div>

      {showRegForm && (
        <Modal title="Register New Personnel" onClose={() => setShowRegForm(false)}>
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Full Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required className="input-field w-full rounded-lg px-4 py-3" placeholder="Officer Name" />
            </div>
            
            <div className="space-y-2">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Email Address</label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required className="input-field w-full rounded-lg px-4 py-3" placeholder="officer@sentinel.gov" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Role</label>
                <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="input-field w-full rounded-lg px-4 py-3 bg-surface">
                  <option value="officer">Officer</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Badge #</label>
                <input type="text" value={form.badge} onChange={(e) => setForm({...form, badge: e.target.value})} className="input-field w-full rounded-lg px-4 py-3" placeholder="OP-0000" />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-outline-variant/30">
              <button type="button" onClick={() => setShowRegForm(false)} className="btn-secondary px-6 py-2 rounded-lg">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary px-8 py-2 rounded-lg flex items-center gap-2">
                {submitting ? <div className="w-4 h-4 border-2 border-primary-fixed border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[16px]">how_to_reg</span>}
                REGISTER
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default OfficersPage;
