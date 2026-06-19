import { MapContainer, TileLayer, CircleMarker, Circle, Pane, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Incident, IncidentSeverity, FilterState, PoliceIncident, RiskCell } from '../types';

// Free, no-key, no-billing dark map: CartoDB dark tiles via Leaflet.
const CENTER: [number, number] = [51.5441, -0.4779];

const SEVERITY_COLOR: Record<IncidentSeverity, string> = {
  HIGH:   '#ef4444',
  MEDIUM: '#f59e0b',
  LOW:    '#22c55e',
};

const SEVERITY_RADIUS: Record<IncidentSeverity, number> = { HIGH: 9, MEDIUM: 7, LOW: 6 };

// Risk → colour (matches the Risk Level legend): very-high red → very-low grey.
function riskColor(score: number): string {
  if (score >= 80) return '#ef4444';
  if (score >= 60) return '#f97316';
  if (score >= 40) return '#f59e0b';
  if (score >= 20) return '#22c55e';
  return '#64748b';
}

interface SafeMapProps {
  incidents: Incident[];
  filters: FilterState;
  onMapClick: (lat: number, lng: number) => void;
  onIncidentsUpdate?: () => void;
  onIncidentSelect: (inc: Incident) => void;
  onPoliceSelect: (pc: PoliceIncident) => void;
  policeCrimes?: PoliceIncident[];
  showPolice?: boolean;
  riskCells?: RiskCell[];
  showRisk?: boolean;
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function SafeMap({
  incidents,
  filters,
  onMapClick,
  onIncidentSelect,
  onPoliceSelect,
  policeCrimes = [],
  showPolice = true,
  riskCells = [],
  showRisk = false,
}: SafeMapProps) {
  const visible = incidents.filter((inc) => {
    if (filters.category !== 'ALL' && inc.category !== filters.category) return false;
    if (filters.severity !== 'ALL' && inc.severity !== filters.severity) return false;
    return true;
  });

  return (
    <MapContainer
      center={CENTER}
      zoom={14}
      minZoom={11}
      maxZoom={18}
      scrollWheelZoom
      style={{ height: '100%', width: '100%', background: '#0a0a0f' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />

      <ClickHandler onMapClick={onMapClick} />

      {/* Risk forecast heat field — soft circles rendered into a blurred pane = smooth glow */}
      {showRisk && riskCells.length > 0 && (
        <Pane name="heatglow" style={{ zIndex: 350, filter: 'blur(22px)', pointerEvents: 'none' }}>
          {riskCells.map((c, i) => (
            <Circle
              key={`risk-${i}`}
              center={[c.latitude, c.longitude]}
              radius={300}
              interactive={false}
              pathOptions={{ stroke: false, fillColor: riskColor(c.score), fillOpacity: 0.16 + (c.score / 100) * 0.38 }}
            />
          ))}
        </Pane>
      )}

      {/* Police UK crime markers */}
      {showPolice &&
        policeCrimes
          .filter((pc) => pc.latitude != null && pc.longitude != null)
          .map((pc) => (
            <CircleMarker
              key={`police-${pc.id}`}
              center={[pc.latitude!, pc.longitude!]}
              radius={4}
              pathOptions={{ color: '#818cf8', fillColor: '#818cf8', fillOpacity: 0.5, weight: 1 }}
              eventHandlers={{ click: () => onPoliceSelect(pc) }}
            />
          ))}

      {/* HIGH severity glow rings */}
      {visible
        .filter((inc) => inc.severity === 'HIGH')
        .map((inc) => (
          <Circle
            key={`ring-${inc.id}`}
            center={[inc.latitude, inc.longitude]}
            radius={70}
            interactive={false}
            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.12, opacity: 0.35, weight: 1 }}
          />
        ))}

      {/* Community incident markers */}
      {visible.map((inc) => (
        <CircleMarker
          key={`inc-${inc.id}`}
          center={[inc.latitude, inc.longitude]}
          radius={SEVERITY_RADIUS[inc.severity]}
          pathOptions={{ color: 'rgba(255,255,255,0.85)', fillColor: SEVERITY_COLOR[inc.severity], fillOpacity: 0.95, weight: 1.5 }}
          eventHandlers={{ click: () => onIncidentSelect(inc) }}
        />
      ))}
    </MapContainer>
  );
}
