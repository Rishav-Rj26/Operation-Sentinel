import L from 'leaflet';

// ── Tile Layer configs ───────────────────────────────────
export const TILE_LAYERS = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr: '&copy; OpenStreetMap &copy; CARTO',
    label: 'Dark',
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '&copy; OpenStreetMap contributors',
    label: 'Street',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '&copy; Esri, Maxar, Earthstar Geographics',
    label: 'Satellite',
  },
  hybrid: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '&copy; Esri',
    label: 'Hybrid',
    overlay: 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
  },
};

// Default fallback (Delhi) if geolocation fails
export const FALLBACK_CENTER = [28.6139, 77.2090];

// ── Custom Map Icons ──────────────────────────────────────
export const createPulsingIcon = (color, size = 14, pulse = false) => {
  return new L.DivIcon({
    className: 'custom-icon',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${pulse ? `<div style="position:absolute;inset:-6px;border-radius:50%;background:${color};opacity:0.3;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
        <div style="position:relative;width:${size}px;height:${size}px;background:${color};border-radius:50%;border:3px solid rgba(255,255,255,0.9);box-shadow:0 0 12px ${color},0 2px 8px rgba(0,0,0,0.4);z-index:1;"></div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export const createUserIcon = () => {
  return new L.DivIcon({
    className: 'custom-icon',
    html: `
      <div style="position:relative;width:22px;height:22px;">
        <div style="position:absolute;inset:-8px;border-radius:50%;background:#3b82f6;opacity:0.2;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="position:absolute;inset:-4px;border-radius:50%;background:#3b82f6;opacity:0.15;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite 0.5s;"></div>
        <div style="position:relative;width:22px;height:22px;background:#3b82f6;border-radius:50%;border:4px solid white;box-shadow:0 0 20px rgba(59,130,246,0.8),0 0 40px rgba(59,130,246,0.4);z-index:2;"></div>
      </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

// ── Geospatial Utilities ──────────────────────────────────
export const spreadAround = (centerLat, centerLng, count, radiusKm = 3) => {
  const points = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count + (Math.random() - 0.5) * 0.8;
    const r = (0.3 + Math.random() * 0.7) * radiusKm;
    const dLat = (r / 111) * Math.cos(angle);
    const dLng = (r / (111 * Math.cos((centerLat * Math.PI) / 180))) * Math.sin(angle);
    points.push({ lat: centerLat + dLat, lng: centerLng + dLng });
  }
  return points;
};

export const addDrift = (lat, lng, amount = 0.0005) => ({
  lat: lat + (Math.random() - 0.5) * amount,
  lng: lng + (Math.random() - 0.5) * amount,
});

export const getHeatColor = (intensity) => {
  if (intensity < 20) return '#10b981';
  if (intensity < 50) return '#facc15';
  if (intensity < 80) return '#f97316';
  return '#ef4444';
};
