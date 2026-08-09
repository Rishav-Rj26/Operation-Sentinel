import { useMemo, useState } from 'react';
import { Box, Crosshair, Maximize2 } from 'lucide-react';

const tone = (density = 1) => {
  if (density >= 8) return { color: '#fb4b52', glow: 'rgba(251,75,82,.45)', label: 'critical' };
  if (density >= 4) return { color: '#f4bc32', glow: 'rgba(244,188,50,.4)', label: 'watch' };
  return { color: '#25d5b1', glow: 'rgba(37,213,177,.4)', label: 'stable' };
};

const ZoneOperations3D = ({ zones = [], onSelect }) => {
  const [tilt, setTilt] = useState({ x: 56, y: -4 });
  const nodes = useMemo(() => zones.map((zone, index) => {
    const angle = (index / Math.max(zones.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const radius = zones.length > 10 ? 35 : 29;
    return {
      zone,
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius * 0.62,
      z: Math.round(18 + ((index * 23) % 55)),
    };
  }), [zones]);

  const positionFor = (id) => nodes.find(n => (n.zone._id || n.zone.id) === id);

  const updateTilt = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    setTilt({ x: 56 - y * 10, y: x * 13 });
  };

  return (
    <section className="command-panel command-3d-panel overflow-hidden">
      <header className="command-panel-header">
        <div>
          <p className="command-kicker"><Box className="w-3 h-3" /> Three-dimensional field model</p>
          <h2>Zone Operations Grid</h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-[.16em]">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" /> live topology
        </div>
      </header>

      <div className="command-3d-stage" onMouseMove={updateTilt} onMouseLeave={() => setTilt({ x: 56, y: -4 })}>
        <div className="command-3d-floor" style={{ transform: `rotateX(${tilt.x}deg) rotateZ(${tilt.y}deg)` }}>
          <svg className="command-3d-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {nodes.flatMap(({ zone, x, y }) => (zone.adjacentZones || []).map((adjacentId) => {
              const target = positionFor(typeof adjacentId === 'object' ? (adjacentId._id || adjacentId.id) : adjacentId);
              if (!target) return null;
              return <line key={`${zone._id || zone.id}-${target.zone._id || target.zone.id}`} x1={x} y1={y} x2={target.x} y2={target.y} />;
            }))}
          </svg>

          {nodes.map(({ zone, x, y, z }) => {
            const config = tone(zone.densityScore ?? zone.density_score);
            return (
              <button
                key={zone._id || zone.id}
                type="button"
                onClick={() => onSelect?.(zone)}
                className="command-3d-node"
                style={{ left: `${x}%`, top: `${y}%`, transform: `translate3d(-50%, -50%, ${z}px)`, '--zone-color': config.color, '--zone-glow': config.glow }}
                title={`${zone.name}: ${config.label}`}
              >
                <span className="command-3d-node-top"><span>{zone.name?.slice(0, 3).toUpperCase()}</span></span>
                <span className="command-3d-node-base" />
                <small>{String(zone.densityScore ?? zone.density_score ?? 1).padStart(2, '0')}</small>
              </button>
            );
          })}
        </div>
        {zones.length === 0 && <p className="absolute inset-0 grid place-items-center text-sm text-slate-500">Configure zones to render the field model.</p>}
      </div>

      <footer className="command-3d-footer">
        <span><i className="bg-emerald-400" /> Stable (D 1–3)</span>
        <span><i className="bg-amber-400" /> Watch (D 4–7)</span>
        <span><i className="bg-red-400" /> Critical (D 8–10)</span>
        <span className="ml-auto hidden sm:flex items-center gap-1"><Maximize2 className="w-3 h-3" /> Drag cursor across model</span>
      </footer>
    </section>
  );
};

export default ZoneOperations3D;
