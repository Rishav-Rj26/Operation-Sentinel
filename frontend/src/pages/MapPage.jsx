import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
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
      if (showToast) toast.success('Telemetry synchronized');
    } catch {
      toast.error('Failed to sync map telemetry');
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

  const timeSince = lastUpdate ? `${Math.floor((Date.now() - lastUpdate) / 1000)}s` : '—';
  const currentTile = TILE_LAYERS[activeLayer];
  const sectorCoords = spreadAround(centerRef.current[0], centerRef.current[1], 24, 4);

  return (
    <div className="flex-1 p-gutter flex flex-col overflow-hidden relative bg-background">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary-container/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-slide-up shrink-0 z-10 mb-6 border-b border-outline-variant/30 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border bg-primary/10 border-primary/30 font-label-caps text-[10px] uppercase tracking-widest text-primary">
              <span className="material-symbols-outlined text-[12px]">location_on</span>
              {locationName}
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border font-label-caps text-[10px] uppercase tracking-widest ${userLocation ? 'bg-primary-fixed/10 border-primary-fixed/30 text-primary-fixed' : geoError ? 'bg-crimson/10 border-crimson/30 text-crimson' : 'bg-amber/10 border-amber/30 text-amber'}`}>
              <span className="material-symbols-outlined text-[12px]">my_location</span>
              {userLocation ? 'GPS LOCKED' : geoError ? 'GPS FAILED' : 'ACQUIRING GPS...'}
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border bg-success/10 border-success/30 font-label-caps text-[10px] uppercase tracking-widest text-success">
              <span className="material-symbols-outlined text-[12px]">sync</span>
              AUTO-SYNC: 10s
            </div>
            {accuracy && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border bg-outline-variant/10 border-outline-variant/30 font-label-caps text-[10px] uppercase tracking-widest text-outline-variant">
                <span className="material-symbols-outlined text-[12px]">radar</span>
                ±{Math.round(accuracy)}m RADAR
              </div>
            )}
          </div>
          <h1 className="font-headline-md text-headline-md text-primary-container tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
            Tactical Map
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="font-data-md text-[11px] text-outline-variant uppercase tracking-widest">
            LAST SYNC: <span className="text-primary">{timeSince}</span>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.15)] hover:shadow-[0_0_25px_rgba(0,242,255,0.4)]"
          >
            <span className={`material-symbols-outlined text-[16px] ${refreshing ? 'animate-spin' : ''}`}>sync</span>
            SYNC
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="sentinel-panel rounded-lg flex-1 relative overflow-hidden animate-slide-up border border-outline-variant/30 z-10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[2000]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,242,255,0.5)]" />
              <p className="font-label-caps text-label-caps text-primary uppercase tracking-widest animate-pulse">Initializing Telemetry...</p>
            </div>
          </div>
        )}

        <MapContainer center={mapCenter} zoom={13} className="w-full h-full z-0 bg-[#0a192f]" zoomControl={false}>
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
                  fillColor: 'var(--primary-container)',
                  fillOpacity: 0.1,
                  color: 'var(--primary-container)',
                  weight: 1,
                  dashArray: '4',
                }}
              />
              <Marker position={userLocation} icon={createUserIcon()}>
                <Popup className="sentinel-popup">
                  <div className="p-1 font-body-md text-sm">
                    <span className="inline-block px-1.5 py-0.5 rounded font-label-caps text-[9px] bg-primary-fixed/20 text-primary-fixed border border-primary-fixed/30 mb-1 uppercase tracking-widest">
                      COMMAND NODE
                    </span>
                    <h3 className="font-bold text-on-surface m-0 mb-1">{locationName}</h3>
                    <p className="font-data-md text-[10px] text-on-surface-variant">
                      {userLocation[0].toFixed(6)}°N, {userLocation[1].toFixed(6)}°E
                    </p>
                    {accuracy && <p className="font-data-md text-[10px] text-outline-variant">ACCURACY: ±{Math.round(accuracy)}m</p>}
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
              icon={createPulsingIcon(incident.severity === 'critical' ? '#d50000' : '#ffbf00', 14, incident.severity === 'critical')}
            >
              <Popup className="sentinel-popup">
                <div className="p-1 font-body-md text-sm">
                  <span className={`inline-block px-1.5 py-0.5 rounded font-label-caps text-[9px] uppercase tracking-widest mb-1 border ${incident.severity === 'critical' ? 'bg-crimson/20 text-crimson border-crimson/30' : 'bg-amber/20 text-amber border-amber/30'}`}>
                    {incident.severity} INCIDENT
                  </span>
                  <h3 className="font-bold text-on-surface m-0 mb-1 leading-tight">{incident.title}</h3>
                  <p className="font-data-md text-[10px] text-outline-variant mb-1">{incident.location}</p>
                  <p className="font-label-caps text-[9px] text-primary uppercase tracking-widest">STATUS: {incident.status}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Units */}
          {units.map((unit) => (
            <Marker
              key={unit._id}
              position={[unit.lat, unit.lng]}
              icon={createPulsingIcon('#00dbe7', 12, unit.status === 'En Route')}
            >
              <Popup className="sentinel-popup">
                <div className="p-1 font-body-md text-sm">
                  <span className="inline-block px-1.5 py-0.5 rounded font-label-caps text-[9px] bg-primary/20 text-primary border border-primary/30 mb-1 uppercase tracking-widest">
                    {unit.status}
                  </span>
                  <h3 className="font-bold text-on-surface m-0 mb-1 leading-tight">UNIT {unit.unitId}</h3>
                  <p className="font-data-md text-[10px] text-outline-variant uppercase">{unit.type} • {unit.sectorName}</p>
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
                  fillOpacity: sector.intensity > 70 ? 0.15 : sector.intensity > 40 ? 0.08 : 0.03,
                  color: getHeatColor(sector.intensity),
                  weight: 1,
                  dashArray: '2',
                }}
                radius={700}
              >
                <Popup className="sentinel-popup">
                  <div className="p-1 font-body-md text-sm">
                    <h3 className="font-bold text-on-surface m-0 mb-1 uppercase tracking-wider">{sector.name}</h3>
                    <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest mb-1">
                      INTENSITY: <span className="font-data-md text-[12px] text-surface-tint font-bold">{sector.intensity}%</span>
                    </p>
                    <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">
                      ACTIVE ALERTS: <span className="font-data-md text-[12px] text-primary font-bold">{sector.activeIncidents}</span>
                    </p>
                  </div>
                </Popup>
              </Circle>
            );
          })}
        </MapContainer>

        {/* Floating Controls */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-3">
          <MapLegend incidentCount={incidents.length} unitCount={units.length} />
          
          <button
            onClick={() => {
              const target = userLocation || FALLBACK_CENTER;
              setFlyTarget([target[0] + 0.0001 * Math.random(), target[1]]);
            }}
            className="w-10 h-10 rounded-full bg-surface-container-low/80 border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary/50 flex items-center justify-center backdrop-blur-md transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            title="CENTER ON COMMAND NODE"
          >
            <span className="material-symbols-outlined text-[20px]">my_location</span>
          </button>
        </div>

        <MapLayerSwitcher
          activeLayer={activeLayer}
          setActiveLayer={setActiveLayer}
          showMenu={showLayerMenu}
          setShowMenu={setShowLayerMenu}
        />
        
        <MapStatusBar
          userLocation={userLocation}
          incidentCount={incidents.length}
          unitCount={units.length}
          locationName={locationName}
        />
      </div>
    </div>
  );
};

export default MapPage;
