import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { schedulerAPI, zonesAPI } from '../services/api';

const SHIFTS = [
  { id: 'morning', name: 'Morn', icon: 'brightness_5' },
  { id: 'evening', name: 'Eve', icon: 'light_mode' },
  { id: 'night', name: 'Nght', icon: 'dark_mode' }
];

const RosterPage = () => {
  const [roster, setRoster] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [fZone, setFZone] = useState('');
  
  const [detailModal, setDetailModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  
  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [rData, zData] = await Promise.all([
        schedulerAPI.getRoster(),
        zonesAPI.getAll()
      ]);
      setRoster(Array.isArray(rData) ? rData : (rData.data || []));
      setZones(Array.isArray(zData) ? zData : (zData.data || []));
    } catch {
      toast.error('Failed to load roster data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await schedulerAPI.generate(30);
      toast.success('Roster generated successfully');
      loadData();
    } catch {
      toast.error('Failed to generate roster');
    } finally {
      setGenerating(false);
    }
  };

  const openDetail = (shiftData) => {
    if (!shiftData || !shiftData.officers) return;
    setSelectedShift(shiftData);
    setDetailModal(true);
  };

  // Group by Zone -> Date -> Shift
  const rosterMap = {}; // { zoneId: { date: { shift: data } } }
  const datesSet = new Set();
  
  roster.forEach(item => {
    const dStr = new Date(item.date).toISOString().split('T')[0];
    datesSet.add(dStr);
    if (!rosterMap[item.zoneId]) rosterMap[item.zoneId] = {};
    if (!rosterMap[item.zoneId][dStr]) rosterMap[item.zoneId][dStr] = {};
    rosterMap[item.zoneId][dStr][item.shiftType] = item;
  });

  const allDates = Array.from(datesSet).sort();
  const startIndex = weekOffset * 7;
  const viewDates = allDates.slice(startIndex, startIndex + 7);
  const filteredZones = fZone ? zones.filter(z => (z._id || z.id) === fZone) : zones;
  const totalDeployed = roster.filter(r => viewDates.includes(new Date(r.date).toISOString().split('T')[0])).reduce((acc, r) => acc + (r.officers?.length || 0), 0);

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
            <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
            <h1 className="font-headline-md text-headline-md text-primary-container tracking-tight">Personnel Roster Grid</h1>
          </div>
          <p className="font-data-md text-data-md text-on-surface-variant">30-day shift allocation and zone coverage matrix.</p>
        </div>
        
        <button 
          onClick={handleGenerate} 
          disabled={generating} 
          className="btn-primary px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.15)] hover:shadow-[0_0_25px_rgba(0,242,255,0.4)]"
        >
          {generating ? (
            <div className="w-4 h-4 border-2 border-on-primary-fixed border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
          )}
          GENERATE 30-DAY ROSTER
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel rounded-lg p-3 z-10 mb-6">
        <div className="flex items-center gap-3">
          <select 
            value={fZone} 
            onChange={e => setFZone(e.target.value)} 
            className="input-field rounded-sm px-3 py-1.5 text-sm bg-surface-container-lowest focus:ring-0"
          >
            <option value="">ALL ZONES</option>
            {zones.map(z => <option key={z._id || z.id} value={z._id || z.id}>{z.name}</option>)}
          </select>
          <button className="text-on-surface-variant hover:text-surface-tint p-1.5 border border-outline-variant/30 rounded-sm hover:border-surface-tint/50 transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span>
          </button>
        </div>
        
        {allDates.length > 0 && (
          <div className="flex items-center gap-2 border border-outline-variant/30 rounded-sm p-1 bg-surface-container-lowest/50">
            <button 
              disabled={weekOffset === 0} 
              onClick={() => setWeekOffset(o => o - 1)} 
              className="p-1 hover:bg-white/10 text-on-surface-variant hover:text-primary rounded-sm disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <div className="px-4 font-label-caps text-label-caps text-surface-tint flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {new Date(viewDates[0]).toLocaleDateString(undefined, {month:'short', day:'2-digit'})} - 
              {viewDates.length > 0 && new Date(viewDates[viewDates.length-1]).toLocaleDateString(undefined, {month:'short', day:'2-digit'})}
            </div>
            <button 
              disabled={startIndex + 7 >= allDates.length} 
              onClick={() => setWeekOffset(o => o + 1)} 
              className="p-1 hover:bg-white/10 text-on-surface-variant hover:text-primary rounded-sm disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto rounded-lg border border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-sm z-10 custom-scrollbar shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        {loading ? (
          <div className="p-10 flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-surface-tint border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : allDates.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center h-full text-center">
            <span className="material-symbols-outlined text-6xl text-outline-variant/30 mb-4">event_busy</span>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">NO ROSTER DATA</h3>
            <p className="font-data-md text-data-md text-on-surface-variant max-w-md">Initialize the 30-day projection matrix to populate shift allocations.</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-20">
              <tr>
                <th rowSpan={2} className="bg-surface-variant/90 border-b border-r border-outline-variant/30 p-3 min-w-[150px] text-left font-label-caps text-label-caps text-on-surface-variant sticky left-0 z-30 backdrop-blur-md">
                  ZONE DESIGNATION
                </th>
                {viewDates.map(d => (
                  <th key={d} colSpan={3} className="bg-surface-variant/90 p-2 text-center border-b border-r border-outline-variant/30 backdrop-blur-md">
                    <div className="font-label-caps text-[10px] text-surface-tint/70 uppercase tracking-widest">{new Date(d).toLocaleDateString(undefined, {weekday:'short'})}</div>
                    <div className="font-data-lg text-data-lg text-on-surface">{new Date(d).getDate()}</div>
                  </th>
                ))}
              </tr>
              <tr>
                {viewDates.map(d => 
                  SHIFTS.map(s => (
                    <th key={`${d}-${s.id}`} className="bg-surface-container-high/90 p-1.5 text-center border-b border-r border-outline-variant/30 backdrop-blur-md" title={s.name}>
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant">{s.icon}</span>
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {filteredZones.map(z => {
                const zId = z._id || z.id;
                const dScore = z.densityScore || z.density_score || 5;
                const cColor = dScore >= 8 ? 'bg-crimson shadow-[0_0_5px_#d50000]' : dScore >= 4 ? 'bg-amber shadow-[0_0_5px_#ffbf00]' : 'bg-success shadow-[0_0_5px_#00c853]';
                
                return (
                  <tr key={zId} className="hover:bg-white/5 transition-colors group">
                    <td className="p-3 font-data-md text-data-md text-on-surface sticky left-0 z-10 bg-surface border-b border-r border-outline-variant/30 group-hover:bg-surface-container-low transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`w-1.5 h-1.5 rounded-full ${cColor}`} />
                        <span className="whitespace-nowrap truncate max-w-[120px]">{z.name}</span>
                      </div>
                    </td>
                    {viewDates.map(d => 
                      SHIFTS.map(s => {
                        const shiftData = rosterMap[zId]?.[d]?.[s.id];
                        const count = shiftData?.officers?.length || 0;
                        const req = shiftData?.requiredOfficers || 2;
                        
                        let statusCls = 'text-on-surface-variant/30';
                        if (shiftData) {
                          if (count >= req) statusCls = 'text-success bg-success/5 shadow-[inset_0_0_10px_rgba(0,200,83,0.1)]';
                          else if (count > 0) statusCls = 'text-amber bg-amber/5 shadow-[inset_0_0_10px_rgba(255,191,0,0.1)]';
                          else statusCls = 'text-crimson bg-crimson/10 shadow-[inset_0_0_10px_rgba(213,0,0,0.2)]';
                        }
                        
                        return (
                          <td 
                            key={`${zId}-${d}-${s.id}`} 
                            className={`p-2 text-center border-b border-r border-outline-variant/10 cursor-pointer hover:brightness-125 transition-all ${statusCls}`}
                            onClick={() => openDetail(shiftData)}
                          >
                            {shiftData ? (
                              <div className="font-data-md text-[13px]">{count}</div>
                            ) : (
                              <div className="font-data-md text-[13px]">-</div>
                            )}
                          </td>
                        );
                      })
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Legend */}
      {allDates.length > 0 && (
        <div className="flex flex-wrap items-center gap-6 mt-4 z-10 bg-surface-container-low/50 p-3 rounded-lg border border-outline-variant/30 backdrop-blur-sm">
          <div className="flex items-center gap-2 font-label-caps text-[10px] text-on-surface-variant tracking-widest uppercase">
            <span className="w-2 h-2 bg-success/50 border border-success"></span> FULLY STAFFED
          </div>
          <div className="flex items-center gap-2 font-label-caps text-[10px] text-on-surface-variant tracking-widest uppercase">
            <span className="w-2 h-2 bg-amber/50 border border-amber"></span> UNDERSTAFFED
          </div>
          <div className="flex items-center gap-2 font-label-caps text-[10px] text-on-surface-variant tracking-widest uppercase">
            <span className="w-2 h-2 bg-crimson/50 border border-crimson"></span> CRITICAL
          </div>
          <div className="ml-auto flex items-center gap-2 font-label-caps text-[10px] text-surface-tint tracking-widest uppercase">
            <span className="material-symbols-outlined text-[14px]">group</span> TOTAL DEPLOYED (VISIBLE): 
            <span className="font-data-lg text-[14px] text-primary">{totalDeployed}</span>
          </div>
        </div>
      )}

      {/* Shift Detail Modal */}
      {detailModal && (
        <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title="SHIFT ALLOCATION DETAILS">
          {selectedShift && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-surface-container-low/50 p-4 rounded-lg border border-outline-variant/30">
                <div>
                  <div className="font-label-caps text-[10px] text-surface-tint/70 tracking-widest uppercase mb-1">
                    {new Date(selectedShift.date).toLocaleDateString(undefined, {weekday:'long', year:'numeric', month:'long', day:'numeric'})}
                  </div>
                  <div className="font-headline-md text-headline-md text-primary-container capitalize flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">
                      {selectedShift.shiftType === 'morning' ? 'brightness_5' : selectedShift.shiftType === 'evening' ? 'light_mode' : 'dark_mode'}
                    </span>
                    {selectedShift.shiftType} Shift
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-label-caps text-[10px] text-on-surface-variant tracking-widest uppercase mb-1">STAFFING RATIO</div>
                  <div className={`font-data-lg text-[24px] font-bold ${selectedShift.officers.length >= selectedShift.requiredOfficers ? 'text-success' : 'text-amber'}`}>
                    {selectedShift.officers.length} / {selectedShift.requiredOfficers}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">shield_person</span>
                  Assigned Personnel
                </h4>
                
                {selectedShift.officers.length === 0 ? (
                  <div className="p-4 text-center bg-crimson/10 text-crimson rounded-lg border border-crimson/20 font-data-md text-[12px] uppercase">
                    NO PERSONNEL ASSIGNED TO THIS VECTOR.
                  </div>
                ) : (
                  <ul className="divide-y divide-outline-variant/20 bg-surface-container-lowest/50 rounded-lg border border-outline-variant/30">
                    {selectedShift.officers.map((off, idx) => {
                      const officer = typeof off === 'object' ? off : { _id: off, name: 'Unknown Officer', role: 'N/A' };
                      return (
                        <li key={idx} className="p-3 flex justify-between items-center hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded border border-surface-tint/30 bg-primary-container/10 flex items-center justify-center">
                              <span className="material-symbols-outlined text-[16px] text-surface-tint">person</span>
                            </div>
                            <div>
                              <div className="font-data-md text-[14px] text-on-surface uppercase">{officer.name || `ID: ${officer}`}</div>
                              {officer.role && <div className="font-label-caps text-[9px] text-on-surface-variant/70 tracking-widest uppercase">{officer.role}</div>}
                            </div>
                          </div>
                          {officer.fatigueScore !== undefined && (
                            <div className="flex flex-col items-end">
                              <div className="font-label-caps text-[9px] text-on-surface-variant/70 tracking-widest uppercase">FATIGUE</div>
                              <div className={`font-data-md text-[14px] ${officer.fatigueScore > 60 ? 'text-crimson' : officer.fatigueScore > 30 ? 'text-amber' : 'text-success'}`}>
                                {officer.fatigueScore}%
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default RosterPage;
