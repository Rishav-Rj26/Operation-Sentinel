import { useMemo } from 'react';

const ZoneGraph = ({ zones, onSelect }) => {
  // Simple layout logic for zones on the SVG canvas
  // In a real app we might use d3-force or react-flow, 
  // but here we can statically position them or use a simple grid layout for the demo.
  
  const nodes = useMemo(() => {
    if (!zones) return [];
    
    // Fallback static positions for up to 6 zones for the demo 
    // to match the visual layout in Stitch
    const defaultPositions = [
      { x: 400, y: 300 }, // Center
      { x: 250, y: 200 }, // Top Left
      { x: 550, y: 200 }, // Top Right
      { x: 400, y: 450 }, // Bottom
      { x: 250, y: 450 }, // Bottom Left
      { x: 550, y: 450 }, // Bottom Right
    ];

    return zones.map((zone, i) => {
      const pos = defaultPositions[i % defaultPositions.length];
      const density = zone.densityScore ?? zone.density_score ?? 1;
      
      let status = 'nominal';
      if (density >= 8) status = 'critical';
      else if (density >= 4) status = 'elevated';

      return {
        ...zone,
        x: pos.x + (Math.random() * 20 - 10), // slight random offset
        y: pos.y + (Math.random() * 20 - 10),
        status,
        density
      };
    });
  }, [zones]);

  const edges = useMemo(() => {
    const list = [];
    if (!nodes.length) return list;
    
    // Connect adjacent zones
    for (const node of nodes) {
      if (node.adjacency && node.adjacency.length) {
        for (const adjId of node.adjacency) {
          const target = nodes.find(n => n._id === adjId || n.id === adjId);
          if (target) {
            // Check if we already have this edge
            const exists = list.find(e => 
              (e.source === node._id && e.target === target._id) || 
              (e.source === target._id && e.target === node._id)
            );
            if (!exists) {
              list.push({ source: node, target });
            }
          }
        }
      }
    }

    // If no adjacency data, generate some fake edges for the visualization
    if (list.length === 0 && nodes.length > 1) {
      list.push({ source: nodes[0], target: nodes[1] });
      if (nodes[2]) list.push({ source: nodes[0], target: nodes[2] });
      if (nodes[3]) list.push({ source: nodes[0], target: nodes[3] });
    }

    return list;
  }, [nodes]);

  return (
    <div className="absolute inset-0 z-0">
      <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-critical" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const isCritical = edge.source.status === 'critical' || edge.target.status === 'critical';
          const isActive = edge.source.status === 'elevated' || edge.target.status === 'elevated';
          
          let className = 'line-inactive';
          if (isCritical) className = 'line-critical';
          else if (isActive) className = 'line-active';

          return (
            <line 
              key={`edge-${i}`} 
              x1={edge.source.x} y1={edge.source.y} 
              x2={edge.target.x} y2={edge.target.y} 
              className={className} 
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isCritical = node.status === 'critical';
          const isElevated = node.status === 'elevated';
          
          let ringStroke = '#00dbe7';
          let ringFill = 'rgba(0, 219, 231, 0.05)';
          let innerStroke = '#00dbe7';
          let textClass = 'fill-surface-tint';
          let nameClass = 'fill-on-surface-variant';

          if (isCritical) {
            ringStroke = '#ff5252';
            ringFill = 'rgba(255, 82, 82, 0.15)';
            innerStroke = '#ff5252';
            textClass = 'fill-[#ff5252]';
            nameClass = 'fill-on-surface';
          } else if (isElevated) {
            ringStroke = 'rgba(255,255,255,0.3)';
            ringFill = 'rgba(255, 255, 255, 0.05)';
            innerStroke = 'rgba(255,255,255,0.5)';
            textClass = 'fill-on-surface';
            nameClass = 'fill-on-surface-variant';
          }

          return (
            <g 
              key={node._id || node.id} 
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-pointer transition-transform hover:scale-110"
              onClick={() => onSelect && onSelect(node)}
            >
              {isCritical && (
                <circle className="animate-pulse-ring" fill="none" r="24" stroke="#ff5252" strokeWidth="1.5" />
              )}
              
              <circle 
                fill={ringFill} 
                filter={isCritical ? 'url(#glow-critical)' : 'url(#glow)'} 
                r="20" 
                stroke={ringStroke} 
                strokeWidth={isCritical ? "1" : "0.5"} 
              />
              
              <circle fill="#010f1f" r="12" stroke={innerStroke} strokeWidth={isCritical ? "1.5" : "1"} />
              
              <text className={`font-data-md text-[10px] ${nameClass}`} textAnchor="middle" x="0" y="-26">
                {node.name || `Z-${node.id?.slice(-4)}`}
              </text>
              <text className={`font-data-md text-[10px] ${textClass}`} textAnchor="middle" x="0" y="3">
                {node.density}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default ZoneGraph;
