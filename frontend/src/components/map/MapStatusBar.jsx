const MapStatusBar = ({ userLocation, incidentCount, unitCount, locationName }) => {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] glass-card rounded-lg px-3 py-2 flex items-center gap-3 text-[11px] border border-slate-700/50">
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${userLocation ? 'bg-emerald-500' : 'bg-yellow-500'} animate-pulse`} />
        <span className={`font-semibold ${userLocation ? 'text-emerald-400' : 'text-yellow-400'}`}>
          {userLocation ? 'LIVE' : 'CONNECTING'}
        </span>
      </div>
      <span className="text-slate-500">|</span>
      <span className="text-slate-400">{incidentCount} incidents • {unitCount} units</span>
      <span className="text-slate-500">|</span>
      <span className="text-slate-400">{locationName}</span>
    </div>
  );
};

export default MapStatusBar;
