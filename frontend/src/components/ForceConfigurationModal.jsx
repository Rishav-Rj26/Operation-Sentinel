import { useMemo, useState } from 'react';
import { ShieldCheck, UsersRound } from 'lucide-react';
import Modal from './Modal';
import { officersAPI } from '../services/api';
import { useToast } from './Toast';

const RANKS = ['DGP', 'ADGP', 'IG', 'DIG', 'SP', 'DSP', 'ASP', 'Inspector', 'SI', 'ASI', 'HeadConstable', 'Constable'];

const emptyComposition = () => Object.fromEntries(RANKS.map((rank) => [rank, 0]));

const ForceConfigurationModal = ({ isOpen, onClose, onConfigured }) => {
  const [composition, setComposition] = useState(emptyComposition);
  const [replace, setReplace] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const total = useMemo(() => Object.values(composition).reduce((sum, value) => sum + Number(value || 0), 0), [composition]);
  const deployable = useMemo(() => RANKS.slice(5).reduce((sum, rank) => sum + Number(composition[rank] || 0), 0), [composition]);
  const standby = Math.ceil(deployable * 0.15);

  const updateCount = (rank, rawValue) => {
    const value = Math.max(0, Math.min(10000, Number.parseInt(rawValue, 10) || 0));
    setComposition((current) => ({ ...current, [rank]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (total < 1) return toast.error('Enter at least one member of the force.');
    setSaving(true);
    try {
      const result = await officersAPI.configureForce(composition, replace);
      toast.success(`Force configured: ${result.totalForce} personnel, ${result.standby} standby.`);
      onConfigured?.();
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Force Configuration" size="lg">
      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-300 shrink-0" />
          <p className="text-sm text-slate-300">Set the force composition before roster generation. Command ranks are recorded but not field deployed; 15% of sector-duty personnel is reserved as standby.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {RANKS.map((rank) => (
            <label key={rank} className="rounded-xl border border-slate-700/70 bg-slate-900/50 p-3">
              <span className="block text-xs uppercase tracking-wider text-slate-400 mb-2">{rank}</span>
              <input type="number" min="0" max="10000" value={composition[rank]} onChange={(event) => updateCount(rank, event.target.value)} className="w-full bg-transparent text-xl font-mono font-bold text-white outline-none" />
            </label>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-slate-800/70 p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">Total Force</p><strong className="text-xl text-white">{total}</strong></div>
          <div className="rounded-xl bg-emerald-500/10 p-3"><p className="text-[10px] uppercase tracking-wider text-emerald-400">Deployable</p><strong className="text-xl text-emerald-300">{deployable}</strong></div>
          <div className="rounded-xl bg-amber-500/10 p-3"><p className="text-[10px] uppercase tracking-wider text-amber-400">15% Standby</p><strong className="text-xl text-amber-300">{standby}</strong></div>
        </div>

        <label className="flex gap-3 items-start text-sm text-slate-400 cursor-pointer">
          <input type="checkbox" checked={replace} onChange={(event) => setReplace(event.target.checked)} className="mt-1 rounded border-slate-600 bg-slate-900" />
          <span><strong className="text-slate-200">Replace existing force and roster.</strong> Use this to start a clean Micro or Macro scenario.</span>
        </label>

        <button type="submit" disabled={saving || total < 1} className="btn-primary w-full py-3 rounded-xl font-bold disabled:opacity-50 flex justify-center items-center gap-2">
          <UsersRound className="w-4 h-4" /> {saving ? 'Configuring force...' : 'Apply Force Configuration'}
        </button>
      </form>
    </Modal>
  );
};

export default ForceConfigurationModal;
