import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, RefreshCw, Download, Eye, Shield } from 'lucide-react';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { schedulerAPI, zonesAPI } from '../services/api';

const SHIFTS = [
  { id: 'morning', name: 'Morning', icon: '☀️' },
  { id: 'evening', name: 'Evening', icon: '🌅' },
  { id: 'night', name: 'Night', icon: '🌙' }
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
    } catch (err) {
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
    } catch (err) {
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
  
  // Calculate view dates based on offset
  const startIndex = weekOffset * 7;
  const viewDates = allDates.slice(startIndex, startIndex + 7);
  
  const filteredZones = fZone ? zones.filter(z => (z._id || z.id) === fZone) : zones;

  const totalDeployed = roster.filter(r => viewDates.includes(new Date(r.date).toISOString().split('T')[0])).reduce((acc, r) => acc + (r.officers?.length || 0), 0);

  return (
    <main className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Deployment Roster</h1>
          <p className="text-slate-400 text-sm">View and manage officer shift assignments.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleGenerate} disabled={generating} className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all disabled:opacity-50">
            <RefreshCw className={\`w-4 h-4 mr-2 \${generating ? 'animate-spin' : ''}\`} />
            {generating ? 'Generating...' : 'Generate 30-Day Roster'}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <select value={fZone} onChange={e=>setFZone(e.target.value)} className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 focus:outline-none focus:border-blue-500">
            <option value="">All Zones</option>
            {zones.map(z=><option key={z._id || z.id} value={z._id || z.id}>{z.name}</option>)}
          </select>
          <button className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 hover:text-white"><Download className="w-4 h-4" /></button>
        </div>
        
        {allDates.length > 0 && (
          <div className="week-nav">
            <button disabled={weekOffset === 0} onClick={()=>setWeekOffset(o => o - 1)} className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></button>
            <div className="px-3 flex items-center gap-2 text-sm font-medium text-white">
              <Calendar className="w-4 h-4 text-slate-400" />
              {new Date(viewDates[0]).toLocaleDateString(undefined, {month:'short', day:'numeric'})} - 
              {viewDates.length > 0 && new Date(viewDates[viewDates.length-1]).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
            </div>
            <button disabled={startIndex + 7 >= allDates.length} onClick={()=>setWeekOffset(o => o + 1)} className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-700/50">
        {loading ? <div className="p-10 text-center text-slate-400">Loading roster...</div> :
         allDates.length === 0 ? (
          <div className="p-16 text-center">
            <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Roster Available</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">Generate a new 30-day roster to automatically assign officers based on fatigue constraints and zone requirements.</p>
            <button onClick={handleGenerate} disabled={generating} className="inline-flex items-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg">
              <RefreshCw className={\`w-4 h-4 mr-2 \${generating ? 'animate-spin' : ''}\`} />
              {generating ? 'Generating...' : 'Generate Roster Now'}
            </button>
          </div>
         ) : (
          <div className="overflow-x-auto">
            <table className="roster-grid w-full">
              <thead>
                <tr>
                  <th className="bg-slate-800/80 p-3 min-w-[150px] text-left text-sm font-bold text-white sticky left-0 z-20 backdrop-blur-md">Zone</th>
                  {viewDates.map(d => (
                    <th key={d} colSpan={3} className="bg-slate-800/50 p-2 text-center border-b border-slate-700">
                      <div className="text-xs text-slate-400 uppercase tracking-wider">{new Date(d).toLocaleDateString(undefined, {weekday:'short'})}</div>
                      <div className="text-sm font-bold text-white">{new Date(d).getDate()}</div>
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="bg-slate-800/90 border-b border-slate-700 sticky left-0 z-20 backdrop-blur-md"></th>
                  {viewDates.map(d => 
                    SHIFTS.map(s => (
                      <th key={\`\${d}-\${s.id}\`} className="bg-slate-800/30 p-1.5 text-xs text-center border-b border-slate-700" title={s.name}>
                        {s.icon}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredZones.map(z => {
                  const zId = z._id || z.id;
                  const dScore = z.densityScore || 5;
                  const cColor = dScore <= 3 ? 'bg-emerald-500' : dScore <= 7 ? 'bg-amber-500' : 'bg-red-500';
                  
                  return (
                    <tr key={zId}>
                      <td className="p-3 text-sm font-medium text-slate-300 sticky left-0 z-10 bg-[#0c1622] border-r border-slate-700">
                        <div className="flex items-center gap-2">
                          <span className={\`w-2 h-2 rounded-full \${cColor}\`} />
                          <span className="whitespace-nowrap truncate max-w-[120px]">{z.name}</span>
                        </div>
                      </td>
                      {viewDates.map(d => 
                        SHIFTS.map(s => {
                          const shiftData = rosterMap[zId]?.[d]?.[s.id];
                          const count = shiftData?.officers?.length || 0;
                          const req = shiftData?.requiredOfficers || 2;
                          let statusCls = 'text-slate-500';
                          if (shiftData) {
                            if (count >= req) statusCls = 'text-emerald-400 bg-emerald-500/10';
                            else if (count > 0) statusCls = 'text-amber-400 bg-amber-500/10';
                            else statusCls = 'text-red-400 bg-red-500/10';
                          }
                          
                          return (
                            <td 
                              key={\`\${zId}-\${d}-\${s.id}\`} 
                              className={\`roster-cell p-2 text-center \${statusCls}\`}
                              onClick={() => openDetail(shiftData)}
                            >
                              {shiftData ? (
                                <div className="text-sm font-mono">{count}</div>
                              ) : (
                                <div className="text-slate-600">-</div>
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
          </div>
         )}
      </div>

      {allDates.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50"></span> Fully Staffed</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/50"></span> Understaffed</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-500/20 border border-red-500/50"></span> Critical</div>
          <div className="ml-auto flex items-center gap-2 text-white">
            <Users className="w-4 h-4 text-cyan-400" /> Total Deployed (Visible): <span className="font-mono text-cyan-400">{totalDeployed}</span>
          </div>
        </div>
      )}

      {/* Shift Detail Modal */}
      <Modal isOpen={detailModal} onClose={()=>setDetailModal(false)} title="Shift Details">
        {selectedShift && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div>
                <div className="text-sm text-slate-400">{new Date(selectedShift.date).toLocaleDateString(undefined, {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</div>
                <div className="text-lg font-bold text-white capitalize flex items-center gap-2">
                  {selectedShift.shiftType === 'morning' ? '☀️' : selectedShift.shiftType === 'evening' ? '🌅' : '🌙'} 
                  {selectedShift.shiftType} Shift
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">Staffing</div>
                <div className={\`text-lg font-mono font-bold \${selectedShift.officers.length >= selectedShift.requiredOfficers ? 'text-emerald-400' : 'text-amber-400'}\`}>
                  {selectedShift.officers.length} / {selectedShift.requiredOfficers}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">Assigned Officers</h4>
              {selectedShift.officers.length === 0 ? (
                <div className="p-4 text-center bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 text-sm">
                  No officers assigned to this shift.
                </div>
              ) : (
                <ul className="divide-y divide-slate-700/50 bg-slate-800/30 rounded-xl border border-slate-700/50">
                  {selectedShift.officers.map((off, idx) => {
                    const officer = typeof off === 'object' ? off : { _id: off, name: 'Unknown Officer', rank: 'N/A' };
                    // If backend populated it, we have details. Else we just have ID.
                    return (
                      <li key={idx} className="p-3 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{officer.name || \`ID: \${officer}\`}</div>
                            {officer.rank && <div className="text-xs text-slate-400">{officer.rank}</div>}
                          </div>
                        </div>
                        {officer.fatigueScore !== undefined && (
                          <div className="flex flex-col items-end">
                            <div className="text-[10px] text-slate-500 uppercase">Fatigue</div>
                            <div className={\`text-sm font-mono \${officer.fatigueScore > 60 ? 'text-red-400' : officer.fatigueScore > 30 ? 'text-amber-400' : 'text-emerald-400'}\`}>
                              {officer.fatigueScore}
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
    </main>
  );
};

export default RosterPage;
