import { Layers } from 'lucide-react';
import { TILE_LAYERS } from './mapUtils';

const MapLayerSwitcher = ({ activeLayer, setActiveLayer, showMenu, setShowMenu }) => {
  return (
    <div className="absolute top-4 left-4 z-[1000]">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="btn-press glass-card p-3 rounded-xl hover:bg-slate-800/80 transition-colors flex items-center justify-center border border-slate-700/50 group shadow-lg"
        title="Change Map Layer"
      >
        <Layers className="w-5 h-5 text-slate-300 group-hover:text-white" />
      </button>
      {showMenu && (
        <div className="mt-2 glass-card rounded-xl p-2 border border-slate-700/50 shadow-xl w-36 space-y-1">
          {Object.entries(TILE_LAYERS).map(([key, layer]) => (
            <button
              key={key}
              onClick={() => { setActiveLayer(key); setShowMenu(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeLayer === key
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MapLayerSwitcher;
