import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, Activity, RefreshCw, MapPin, Navigation } from 'lucide-react';
import { sectorsAPI, unitsAPI, incidentsAPI } from '../services/api';
import { useToast } from '../components/Toast';
import 'leaflet/dist/leaflet.css';

// Map sub-components & utilities
import { TILE_LAYERS, FALLBACK_CENTER, createPulsingIcon, createUserIcon, spreadAround, addDrift, getHeatColor } from '../components/map/mapUtils';
import MapLegend from '../components/map/MapLegend';
import MapLayerSwitcher from '../components/map/MapLayerSwitcher';
import MapStatusBar from '../components/map/MapStatusBar';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom || 13, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

const MapPage = () => {
  const [sectors, setSectors] = useState([]);
  const [units, setUnits] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('Detecting...');
  const [geoError, setGeoError] = useState(null);
  const [mapCenter, setMapCenter] = useState(FALLBACK_CENTER);
  const [flyTarget, setFlyTarget] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeLayer, setActiveLayer] = useState('satellite');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  const toast = useToast();
  const refreshInterval = useRef(null);
  const geoWatchId = useRef(null);
  const centerRef = useRef(FALLBACK_CENTER);

  // ── Get user's real GPS location ─────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported');
      setLocationName('Delhi NCR (Fallback)');
      return;
    }

    const onSuccess = (pos) => {
      const { latitude, longitude, accuracy: acc } = pos.coords;
      setUserLocation([latitude, longitude]);
      setAccuracy(acc);
      centerRef.current = [latitude, longitude];

      if (!mapCenter || mapCenter === FALLBACK_CENTER) {
        setMapCenter([latitude, longitude]);
        setFlyTarget([latitude, longitude]);
      }

      // Reverse geocode to get location name
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=12`)
        .then(r => r.json())
        .then(data => {
          const city = data.address?.city || data.address?.town || data.address?.state_district || data.address?.state || '';
          const area = data.address?.suburb || data.address?.neighbourhood || data.address?.village || '';
          setLocationName(area ? `${area}, ${city}` : city || `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
        })
        .catch(() => setLocationName(`${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`));
    };

    const onError = (err) => {
      setGeoError(err.message);
      setLocationName('Delhi NCR (Fallback)');
      setMapCenter(FALLBACK_CENTER);
      setFlyTarget(FALLBACK_CENTER);
      centerRef.current = FALLBACK_CENTER;
    };

    geoWatchId.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    });

    return () => {
      if (geoWatchId.current !== null) navigator.geolocation.clearWatch(geoWatchId.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch data from backend ──────────────────────────
  const fetchData = useCallback(async (showToast = false) => {
    try {
      setRefreshing(true);
      const [sectorsRes, unitsRes, incidentsRes] = await Promise.all([
        sectorsAPI.getAll(), unitsAPI.getAll(), incidentsAPI.getAll()
      ]);

      const center = centerRef.current;

      const mappedUnits = unitsRes.map((u, i) => {
        let lat = u.latitude, lng = u.longitude;
        if (!lat || !lng) {
          const unitSpots = spreadAround(center[0], center[1], unitsRes.length, 2.5);
          const spot = unitSpots[i] || { lat: center[0], lng: center[1] };
          lat = spot.lat; lng = spot.lng;
        }
        const drifted = addDrift(lat, lng);
        return { ...u, lat: drifted.lat, lng: drifted.lng };
      });

      const activeIncidents = incidentsRes.filter(i => i.status !== 'resolved' && i.status !== 'closed');
      const mappedIncidents = activeIncidents.map((inc, i) => {
        let lat = inc.latitude, lng = inc.longitude;
        if (!lat || !lng) {
          const incSpots = spreadAround(center[0], center[1], activeIncidents.length, 3);
          const spot = incSpots[i] || { lat: center[0], lng: center[1] };
          lat = spot.lat; lng = spot.lng;
        }
        const drifted = addDrift(lat, lng, 0.002);
        return { ...inc, lat: drifted.lat, lng: drifted.lng };
      });

      setSectors(sectorsRes);
      setUnits(mappedUnits);
      setIncidents(mappedIncidents);
      setLastUpdate(new Date());
      if (showToast) toast.success('Map data refreshed');
    } catch {
      toast.error('Failed to load map data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
    refreshInterval.current = setInterval(() => fetchData(), 10000);
    return () => clearInterval(refreshInterval.current);
  }, [fetchData]);

  const timeSince = lastUpdate ? `${Math.floor((Date.now() - lastUpdate) / 1000)}s ago` : '—';
  const currentTile = TILE_LAYERS[activeLayer];
  const sectorCoords = spreadAround(centerRef.current[0], centerRef.current[1], 24, 4);

  return (
    <main className="w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-8 space-y-6 pb-16 animate-fade-in flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-slide-up shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <Navigation className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-400">📍 {locationName}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Crosshair className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400">
                {userLocation ? 'GPS Locked' : geoError ? 'GPS Failed' : 'Acquiring GPS...'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">Auto-refresh: 10s</span>
            </div>
            {accuracy && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-semibold text-purple-400">±{Math.round(accuracy)}m accuracy</span>
              </div>
            )}
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">Tactical Map</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500 font-medium">Updated: {timeSince}</span>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="btn-press inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-card text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="glass-card rounded-2xl p-2 flex-1 relative overflow-hidden animate-slide-up stagger-1 border border-slate-700/50 shadow-2xl">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-50">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-blue-400 font-semibold animate-pulse">Acquiring GPS & Loading Data...</p>
            </div>
          </div>
        )}

        <MapContainer center={mapCenter} zoom={13} className="w-full h-full rounded-xl z-0" zoomControl={false}>
          <TileLayer url={currentTile.url} attribution={currentTile.attr} />
          {currentTile.overlay && <TileLayer url={currentTile.overlay} />}
          <MapController center={flyTarget} />

          {/* User's real location */}
          {userLocation && (
            <>
              <Circle
                center={userLocation}
                radius={accuracy || 50}
                pathOptions={{
                  fillColor: '#3b82f6',
                  fillOpacity: 0.08,
                  color: '#3b82f6',
                  weight: 2,
                  dashArray: '6',
                }}
              />
              <Marker position={userLocation} icon={createUserIcon()}>
                <Popup>
                  <div className="p-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 mb-1">
                      YOUR LOCATION
                    </span>
                    <h3 className="font-bold text-white m-0 text-sm">{locationName}</h3>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {userLocation[0].toFixed(6)}°N, {userLocation[1].toFixed(6)}°E
                    </p>
                    {accuracy && <p className="text-[10px] text-slate-500">Accuracy: ±{Math.round(accuracy)}m</p>}
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* Active Incidents */}
          {incidents.map((incident) => (
            <Marker
              key={incident._id}
              position={[incident.lat, incident.lng]}
              icon={createPulsingIcon('#ef4444', 14, incident.severity === 'critical')}
            >
              <Popup>
                <div className="p-1">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 mb-1">
                    {incident.severity?.toUpperCase()} INCIDENT
                  </span>
                  <h3 className="font-bold text-white m-0 text-sm leading-tight">{incident.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{incident.location}</p>
                  <p className="text-[10px] text-slate-500 mt-1 capitalize">Status: {incident.status}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Units */}
          {units.map((unit) => (
            <Marker
              key={unit._id}
              position={[unit.lat, unit.lng]}
              icon={createPulsingIcon('#22d3ee', 12, unit.status === 'En Route')}
            >
              <Popup>
                <div className="p-1">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 mb-1">
                    {unit.status?.toUpperCase()}
                  </span>
                  <h3 className="font-bold text-white m-0 text-sm leading-tight">Unit {unit.unitId}</h3>
                  <p className="text-xs text-slate-400 mt-1">{unit.type} • {unit.sectorName}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Sector Heat Zones */}
          {sectors.map((sector, idx) => {
            const coords = sectorCoords[idx % sectorCoords.length];
            if (!coords) return null;
            return (
              <Circle
                key={sector._id}
                center={[coords.lat, coords.lng]}
                pathOptions={{
                  fillColor: getHeatColor(sector.intensity),
                  fillOpacity: sector.intensity > 70 ? 0.3 : sector.intensity > 40 ? 0.12 : 0.06,
                  color: getHeatColor(sector.intensity),
                  weight: 1,
                  dashArray: '4',
                }}
                radius={700}
              >
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold text-white m-0">{sector.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">Intensity: <strong className="text-white">{sector.intensity}%</strong></p>
                    <p className="text-xs text-slate-400">Active Incidents: <strong className="text-white">{sector.activeIncidents}</strong></p>
                  </div>
                </Popup>
              </Circle>
            );
          })}
        </MapContainer>

        {/* Map Controls */}
        <MapLayerSwitcher
          activeLayer={activeLayer}
          setActiveLayer={setActiveLayer}
          showMenu={showLayerMenu}
          setShowMenu={setShowLayerMenu}
        />

        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-3">
          <MapLegend incidentCount={incidents.length} unitCount={units.length} />
          <button
            onClick={() => {
              const target = userLocation || FALLBACK_CENTER;
              setFlyTarget([target[0] + 0.0001 * Math.random(), target[1]]);
            }}
            className="btn-press glass-card p-3 rounded-xl hover:bg-slate-800/80 transition-colors flex items-center justify-center border border-slate-700/50 group"
            title="Center on my location"
          >
            <Navigation className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
          </button>
        </div>

        <MapStatusBar
          userLocation={userLocation}
          incidentCount={incidents.length}
          unitCount={units.length}
          locationName={locationName}
        />
      </div>
    </main>
  );
};

export default MapPage;
