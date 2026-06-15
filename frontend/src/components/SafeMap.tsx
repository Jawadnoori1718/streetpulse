import { useCallback, useRef } from 'react';
import { GoogleMap, useLoadScript, Marker, Circle } from '@react-google-maps/api';
import type { Incident, IncidentSeverity, FilterState, PoliceIncident } from '../types';

const CENTER = { lat: 51.5441, lng: -0.4779 };

const SEVERITY_COLOR: Record<IncidentSeverity, string> = {
  HIGH:   '#dc2626',
  MEDIUM: '#d97706',
  LOW:    '#16a34a',
};

const SEVERITY_SCALE: Record<IncidentSeverity, number> = {
  HIGH:   1.35,
  MEDIUM: 1.0,
  LOW:    0.75,
};

const MAP_OPTIONS = {
  minZoom: 12,
  maxZoom: 18,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  zoomControl: true,
  clickableIcons: false,
  styles: [
    { featureType: 'poi',     elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
};

// google.maps.SymbolPath.CIRCLE == 0 (numeric literal — safe before Maps script loads)
const CIRCLE_PATH = 0;

interface SafeMapProps {
  incidents: Incident[];
  filters: FilterState;
  onMapClick: (lat: number, lng: number) => void;
  onIncidentsUpdate: () => void;
  onIncidentSelect: (inc: Incident) => void;
  onPoliceSelect: (pc: PoliceIncident) => void;
  policeCrimes?: PoliceIncident[];
  showPolice?: boolean;
}

export default function SafeMap({
  incidents,
  filters,
  onMapClick,
  onIncidentSelect,
  onPoliceSelect,
  policeCrimes = [],
  showPolice = true,
}: SafeMapProps) {
  // ── ALL HOOKS FIRST ───────────────────────────────────────────────────────
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY ?? '',
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const onLoad = useCallback((map: google.maps.Map) => { mapRef.current = map; }, []);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) onMapClick(e.latLng.lat(), e.latLng.lng());
    },
    [onMapClick],
  );

  // ── EARLY RETURNS ─────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' }}>
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <p style={{ color: '#dc2626', fontWeight: 600, marginBottom: '8px' }}>Failed to load Google Maps</p>
          <p style={{ color: '#64748b', fontSize: '13px' }}>Check that VITE_GOOGLE_MAPS_KEY in frontend/.env is valid.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '28px', height: '28px', margin: '0 auto 10px',
            border: '2px solid #e2e8f0', borderTop: '2px solid #0d9488',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>Loading map...</p>
        </div>
      </div>
    );
  }

  // ── google IS now defined ─────────────────────────────────────────────────

  const visible = incidents.filter((inc) => {
    if (filters.category !== 'ALL' && inc.category !== filters.category) return false;
    if (filters.severity !== 'ALL' && inc.severity !== filters.severity) return false;
    return true;
  });

  const makeIcon = (color: string, scale: number) => ({
    path: CIRCLE_PATH,
    fillColor: color, fillOpacity: 0.9,
    strokeColor: '#ffffff', strokeWeight: 2,
    scale: 11 * scale,
  });

  const policeIcon = {
    path: CIRCLE_PATH,
    fillColor: '#6366f1', fillOpacity: 0.55,
    strokeColor: '#6366f1', strokeWeight: 1.5,
    scale: 5,
  };

  return (
    <GoogleMap
      mapContainerStyle={{ height: '100%', width: '100%' }}
      center={CENTER}
      zoom={14}
      options={MAP_OPTIONS}
      onClick={handleMapClick}
      onLoad={onLoad}
    >
      {/* Police UK crime markers */}
      {showPolice &&
        policeCrimes
          .filter((pc) => pc.latitude != null && pc.longitude != null)
          .map((pc) => (
            <Marker
              key={`police-${pc.id}`}
              position={{ lat: pc.latitude!, lng: pc.longitude! }}
              icon={policeIcon}
              zIndex={1}
              onClick={() => onPoliceSelect(pc)}
            />
          ))}

      {/* HIGH severity glow rings */}
      {visible
        .filter((inc) => inc.severity === 'HIGH')
        .map((inc) => (
          <Circle
            key={`ring-${inc.id}`}
            center={{ lat: inc.latitude, lng: inc.longitude }}
            radius={90}
            options={{
              fillColor: '#dc2626', fillOpacity: 0.08,
              strokeColor: '#dc2626', strokeOpacity: 0.2,
              strokeWeight: 1, clickable: false,
            }}
          />
        ))}

      {/* Community incident markers */}
      {visible.map((inc) => (
        <Marker
          key={`inc-${inc.id}`}
          position={{ lat: inc.latitude, lng: inc.longitude }}
          icon={makeIcon(SEVERITY_COLOR[inc.severity], SEVERITY_SCALE[inc.severity])}
          zIndex={inc.severity === 'HIGH' ? 3 : inc.severity === 'MEDIUM' ? 2 : 1}
          onClick={() => onIncidentSelect(inc)}
        />
      ))}
    </GoogleMap>
  );
}
