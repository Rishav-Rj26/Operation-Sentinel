import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { zonesAPI } from '../services/api';
import ScoreSlider from '../components/ScoreSlider';

const ZoneConfigPage = () => {
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({ name: '', size: 5, density_score: 5, type: 'commercial', boundaries: [] });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const data = await zonesAPI.getAll();
      setZones(data);
    } catch (err) {
      toast.error('Failed to load zones');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const zoneData = {
        name: form.name || 'SECTOR-X',
        type: form.type,
        boundaries: form.boundaries.length > 0 ? form.boundaries : [[-71.0589, 42.3601]],
        density_score: form.density_score
      };
      await zonesAPI.create(zoneData);
      toast.success('Zone initialized successfully');
      setForm({ name: '', size: 5, density_score: 5, type: 'commercial', boundaries: [] });
      fetchZones();
    } catch (err) {
      toast.error(err.message || 'Failed to initialize zone');
    } finally {
      setLoading(false);
    }
  };

  // Hologram styling logic based on threat level
  const getThreatColors = (level) => {
    if (level <= 3) return {
      textClass: 'text-primary-container',
      bgClass: 'bg-primary-container/5',
      borderClass: 'border-primary-container',
      borderColor: 'rgba(0,242,255,0.5)',
      shadow: 'rgba(0,242,255,0.2)',
      status: 'NOMINAL'
    };
    if (level <= 7) return {
      textClass: 'text-amber-400',
      bgClass: 'bg-amber-400/5',
      borderClass: 'border-amber-400',
      borderColor: 'rgba(251,191,36,0.5)',
      shadow: 'rgba(251,191,36,0.2)',
      status: 'ELEVATED'
    };
    return {
      textClass: 'text-rose-500',
      bgClass: 'bg-rose-500/10',
      borderClass: 'border-rose-500',
      borderColor: 'rgba(244,63,94,0.5)',
      shadow: 'rgba(244,63,94,0.4)',
      status: 'CRITICAL'
    };
  };

  const threatColors = getThreatColors(form.density_score);
  const scaleOuter = 0.8 + (form.size * 0.05);

  return (
    <div className="flex-1 p-gutter flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-container/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary-container/10 rounded-full blur-[80px]"></div>
      </div>

      <main className="w-full max-w-5xl sentinel-panel rounded-xl flex flex-col md:flex-row overflow-hidden relative z-10 border border-outline-variant/30">
        
        {/* Left Form Section */}
        <div className="w-full md:w-3/5 p-8 border-b md:border-b-0 md:border-r border-outline-variant/30 z-10 flex flex-col bg-surface/80">
          <header className="mb-8 border-b border-outline-variant/30 pb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>add_location_alt</span>
                <h1 className="font-headline-md text-headline-md text-primary-container tracking-tight">Zone Configuration</h1>
              </div>
              <p className="font-data-md text-data-md text-on-surface-variant">Initialize and parameterize new operational zone.</p>
            </div>
            <div className="text-right">
              <div className="font-data-md text-[10px] text-outline uppercase tracking-widest">System Status</div>
              <div className="font-data-md text-data-md text-primary-fixed flex items-center gap-2 justify-end">
                <div className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse shadow-[0_0_8px_#74f5ff]"></div>
                ONLINE
              </div>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-grow">
            
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Zone Designation</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={(e) => setForm({...form, name: e.target.value})} 
                  placeholder="e.g. SECTOR-7G" 
                  required 
                  className="w-full bg-surface-container-lowest/50 text-on-surface border border-outline-variant/50 rounded-lg px-3 py-3 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all font-data-md text-data-md backdrop-blur-sm"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="material-symbols-outlined text-outline-variant text-sm">terminal</span>
                </div>
              </div>
            </div>

            <ScoreSlider 
              label="Spatial Radius" 
              value={form.size} 
              onChange={(val) => setForm({...form, size: val})} 
            />

            <ScoreSlider 
              label="Threat Assessment Level" 
              value={form.density_score} 
              onChange={(val) => setForm({...form, density_score: val})} 
              isThreat={true} 
            />

            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Adjacent Sectors</label>
              <div className="bg-surface-container-lowest/50 border border-outline-variant/50 rounded-lg p-3 min-h-[52px] flex flex-wrap gap-2 items-center cursor-text">
                <span className="inline-flex items-center gap-1 bg-surface-variant/50 text-on-surface px-2 py-1 rounded font-data-md text-xs border border-outline-variant/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed"></span> ALPHA-01
                  <button type="button" className="text-outline hover:text-error transition-colors ml-1"><span className="material-symbols-outlined text-[14px]">close</span></button>
                </span>
                <input type="text" placeholder="Add sector..." className="bg-transparent border-none focus:ring-0 text-on-surface font-data-md text-data-md p-0 flex-grow min-w-[100px] outline-none" />
              </div>
            </div>

            <div className="flex-grow"></div>

            <div className="flex items-center justify-end gap-4 mt-6 pt-4 border-t border-outline-variant/30">
              <button type="button" onClick={() => setForm({ name: '', size: 5, density_score: 5, type: 'commercial', boundaries: [] })} className="px-6 py-2.5 text-on-surface-variant font-label-caps text-label-caps tracking-widest hover:text-on-surface hover:bg-surface-container-highest/50 transition-all rounded-lg">
                DISCARD
              </button>
              <button type="submit" disabled={loading} className="relative group overflow-hidden px-8 py-2.5 bg-primary-container/10 border border-primary-container text-primary-container font-label-caps text-label-caps font-bold tracking-widest hover:bg-primary-container hover:text-on-primary-container transition-all duration-300 rounded-lg shadow-[0_0_15px_rgba(0,242,255,0.15)] hover:shadow-[0_0_25px_rgba(0,242,255,0.4)]">
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                  )}
                  INITIALIZE ZONE
                </span>
                <div className="absolute inset-0 h-full w-0 bg-primary-container transition-all duration-300 ease-out group-hover:w-full z-0"></div>
              </button>
            </div>
          </form>
        </div>

        {/* Right Preview Section */}
        <div className="w-full md:w-2/5 bg-surface-container-lowest/30 p-8 flex flex-col items-center justify-center z-10 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute inset-0 opacity-[0.2]" style={{ backgroundImage: 'linear-gradient(rgba(132, 148, 149, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(132, 148, 149, 0.2) 1px, transparent 1px)', backgroundSize: '20px 20px', perspective: '500px' }}></div>
          
          <div className="absolute top-8 left-8 z-20 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-fixed animate-ping"></div>
            <span className="font-label-caps text-label-caps text-primary-fixed tracking-widest uppercase">Live Telemetry Preview</span>
          </div>

          <div className="relative w-80 h-80 flex items-center justify-center mt-8 z-10" style={{ transform: 'rotateX(15deg) rotateY(-5deg)', transformStyle: 'preserve-3d', perspective: '1000px' }}>
            {/* Base floor */}
            <div className="absolute bottom-0 w-full h-full border border-outline-variant/20 rounded-full" style={{ transform: 'rotateX(70deg) translateZ(-50px)', boxShadow: '0 0 20px rgba(0, 242, 255, 0.05) inset' }}></div>
            
            {/* Rings */}
            <div className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${threatColors.borderClass.replace('border-', 'border-')}/20`} style={{ transform: `scale(${scaleOuter}) translateZ(0px)`, borderColor: threatColors.borderColor, boxShadow: `0 0 15px ${threatColors.shadow} inset, 0 0 15px ${threatColors.shadow}` }}></div>
            
            <div className={`absolute inset-4 rounded-full border-2 border-dashed transition-all duration-300 ${threatColors.borderClass.replace('border-', 'border-')}/40`} style={{ transform: 'scale(1) translateZ(20px)', borderColor: threatColors.borderColor.replace('0.5', '0.8'), animation: `spin ${30 - form.size*1.5}s linear infinite` }}></div>
            
            {/* Core Box */}
            <div className={`absolute w-40 h-40 flex flex-col items-center justify-center backdrop-blur-sm rounded-lg transition-all duration-300 border ${threatColors.bgClass}`} style={{ transform: 'translateZ(60px)', borderColor: threatColors.borderColor, boxShadow: `0 0 30px ${threatColors.shadow}, inset 0 0 20px ${threatColors.shadow}` }}>
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 rounded-tl-sm" style={{ borderColor: threatColors.textClass.replace('text-', '') }}></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 rounded-tr-sm" style={{ borderColor: threatColors.textClass.replace('text-', '') }}></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 rounded-bl-sm" style={{ borderColor: threatColors.textClass.replace('text-', '') }}></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 rounded-br-sm" style={{ borderColor: threatColors.textClass.replace('text-', '') }}></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <span className="font-data-md text-data-md text-on-surface truncate max-w-[90%] text-center opacity-90 tracking-wider uppercase">{form.name || 'SECTOR'}</span>
                <div className="h-px w-12 my-2 transition-colors duration-300" style={{ backgroundColor: threatColors.borderColor }}></div>
                <span className={`font-headline-lg text-headline-lg font-bold transition-colors duration-300 ${threatColors.textClass}`} style={{ textShadow: `0 0 10px ${threatColors.shadow}` }}>LVL {form.density_score}</span>
              </div>
            </div>

            <div className="absolute -right-8 top-1/4 text-[10px] font-data-md text-outline-variant text-right" style={{ transform: 'translateZ(30px)' }}>
              <div>LAT: 42.3601</div><div>LNG: -71.0589</div>
            </div>
          </div>

          <div className="mt-8 w-full grid grid-cols-2 gap-4 border-t border-outline-variant/30 pt-6 z-20">
            <div className="flex flex-col bg-surface-container-low/50 p-3 rounded-lg border border-outline-variant/20 backdrop-blur-sm">
              <span className="font-label-caps text-label-caps text-outline uppercase mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">straighten</span> Est. Radius
              </span>
              <span className="font-data-lg text-data-lg text-primary-fixed">{form.size * 100}m</span>
            </div>
            <div className="flex flex-col items-end bg-surface-container-low/50 p-3 rounded-lg border border-outline-variant/20 backdrop-blur-sm text-right">
              <span className="font-label-caps text-label-caps text-outline uppercase mb-1 flex items-center gap-1">
                Status <span className="material-symbols-outlined text-[14px]">warning</span>
              </span>
              <span className={`font-data-lg text-data-lg font-bold transition-colors duration-300 ${threatColors.textClass}`}>{threatColors.status}</span>
            </div>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: scale(1) translateZ(20px) rotate(0deg); }
          to { transform: scale(1) translateZ(20px) rotate(360deg); }
        }
      `}} />
    </div>
  );
};

export default ZoneConfigPage;
