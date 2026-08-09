import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronRight, ShieldAlert, UsersRound } from 'lucide-react';
import { zonesAPI } from '../services/api';
import { useToast } from './Toast';

const CommandActions = ({ zones = [], selectedZone, onZoneChange, onDataChanged }) => {
  const [zoneId, setZoneId] = useState('');
  const [density, setDensity] = useState(5);
  const [working, setWorking] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const toast = useToast();
  const activeZone = useMemo(() => zones.find(z => (z._id || z.id) === zoneId), [zones, zoneId]);

  useEffect(() => {
    const zone = selectedZone || zones[0];
    if (zone) {
      setZoneId(zone._id || zone.id);
      setDensity(zone.densityScore ?? zone.density_score ?? 5);
    }
  }, [selectedZone, zones]);

  const resolveSurge = async () => {
    if (!activeZone) return;
    setWorking(true);
    try {
      const result = await zonesAPI.update(zoneId, {
        name: activeZone.name,
        sizeScore: activeZone.sizeScore ?? activeZone.size_score,
        densityScore: density,
        adjacentZones: (activeZone.adjacentZones || []).map(item => typeof item === 'object' ? (item._id || item.id) : item),
        safeThreshold: activeZone.safeThreshold ?? activeZone.safe_threshold,
        __version: activeZone.__version,
      });
      setOutcome(result.dynamicLoad || { status: density > (activeZone.densityScore ?? activeZone.density_score) ? 'monitoring' : 'updated', deltaT: 0 });
      toast.success(density > (activeZone.densityScore ?? activeZone.density_score) ? 'Density surge assessed' : 'Zone density updated');
      onDataChanged?.();
    } catch (err) { toast.error(err.message); }
    finally { setWorking(false); }
  };

  const simulateAbsence = async () => {
    if (!activeZone) return;
    setWorking(true);
    try {
      const result = await zonesAPI.triggerMassAbsence(zoneId, 0.10);
      setOutcome({ ...result, status: result.incident?.status || (result.deltaT > 0 ? 'monitoring' : 'resolved') });
      toast.success(`${result.absencedCount} personnel marked on leave`);
      onDataChanged?.();
    } catch (err) { toast.error(err.message); }
    finally { setWorking(false); }
  };

  const state = outcome?.status;
  const isCritical = state === 'escalated';

  return (
    <section className={`command-panel command-actions ${isCritical ? 'command-alert-critical' : ''}`}>
      <header className="command-panel-header">
        <div>
          <p className="command-kicker"><AlertTriangle className="w-3 h-3" /> Live control room</p>
          <h2>Incident Simulation</h2>
        </div>
        <span className="command-live-dot">Armed</span>
      </header>

      <div className="space-y-4">
        <label className="command-field">
          <span>Target zone</span>
          <select value={zoneId} onChange={(event) => { setZoneId(event.target.value); onZoneChange?.(zones.find(z => (z._id || z.id) === event.target.value)); }}>
            {zones.map(zone => <option key={zone._id || zone.id} value={zone._id || zone.id}>{zone.name}</option>)}
          </select>
        </label>
        <label className="command-field">
          <span>Threat density <strong>D {density}/10</strong></span>
          <input type="range" min="1" max="10" value={density} onChange={(event) => setDensity(Number(event.target.value))} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button disabled={!activeZone || working} onClick={resolveSurge} className="command-btn command-btn-primary"><AlertTriangle className="w-3.5 h-3.5" /> Simulate surge</button>
          <button disabled={!activeZone || working} onClick={simulateAbsence} className="command-btn"><UsersRound className="w-3.5 h-3.5" /> 10% absence</button>
        </div>
      </div>

      <div className={`command-outcome ${isCritical ? 'is-critical' : ''}`}>
        {isCritical ? <ShieldAlert className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        <div>
          <p>{isCritical ? 'Critical alert — manual command required' : outcome ? 'Resolution status' : 'Resolution route ready'}</p>
          <span>{outcome ? `Delta T: ${Math.max(0, outcome.deltaT || 0)} · ${state}` : 'Adjacent pooling → Standby reserve → Escalation'}</span>
        </div>
      </div>
    </section>
  );
};

export default CommandActions;
