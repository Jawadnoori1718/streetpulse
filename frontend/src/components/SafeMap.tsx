import { MapContainer, TileLayer, CircleMarker, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Incident, IncidentSeverity, FilterState, PoliceIncident, RiskCell } from '../types';

// Free, no-key, no-billing map: OpenStreetMap tiles via Leaflet.
const CENTER: [number, number] = [51.5441, -0.4779];

const SEVERITY_COLOR: Record<IncidentSeverity, string> = {
  HIGH:   '#dc2626',
  MEDIUM: '#d97706',
  LOW:    '#16a34a',
};

const SEVERITY_RADIUS: Record<IncidentSeverity, number> = {
  HIGH:   11,
  MEDIUM: 9,
  LOW:    7,
};

// Risk → colour, matching the legend in the Risk Forecast control (green → red).
function riskColor(score: number): string {
  if (score < 20) return '#16a34a';
  if (score < 40) return '#84cc16';
  if (score < 60) return '#eab308';
  if (score < 80) return '#f97316';
  return '#dc2626';
}

interface SafeMapProps {
  incidents: Incident[];
  filters: FilterState;
  onMapClick: (lat: number, lng: number) => void;
  onIncidentsUpdate: () => void;
  onIncidentSelect: (inc: Incident) => void;
  onPoliceSelect: (pc: PoliceIncident) => void;
  policeCrimes?: PoliceIncident[];
  showPolice?: boolean;
  riskCells?: RiskCell[];
  showRisk?: boolean;
}

// Translate map clicks into "report here".
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
      minZoom={12}
      maxZoom={18}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickHandler onMapClick={onMapClick} />

      {/* Risk forecast heat field — soft overlapping circles (non-interactive, so clicks pass through) */}
      {showRisk &&
        riskCells.map((c, i) => (
          <Circle
            key={`risk-${i}`}
            center={[c.latitude, c.longitude]}
            radius={280}
            interactive={false}
            pathOptions={{
              stroke: false,
              fillColor: riskColor(c.score),
              fillOpacity: 0.12 + (c.score / 100) * 0.28,
            }}
          />
        ))}

      {/* Police UK crime markers */}
      {showPolice &&
        policeCrimes
          .filter((pc) => pc.latitude != null && pc.longitude != null)
          .map((pc) => (
            <CircleMarker
              key={`police-${pc.id}`}
              center={[pc.latitude!, pc.longitude!]}
              radius={5}
              pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.55, weight: 1 }}
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
            radius={90}
            interactive={false}
            pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.08, opacity: 0.2, weight: 1 }}
          />
        ))}

      {/* Community incident markers */}
      {visible.map((inc) => (
        <CircleMarker
          key={`inc-${inc.id}`}
          center={[inc.latitude, inc.longitude]}
          radius={SEVERITY_RADIUS[inc.severity]}
          pathOptions={{ color: '#ffffff', fillColor: SEVERITY_COLOR[inc.severity], fillOpacity: 0.9, weight: 2 }}
          eventHandlers={{ click: () => onIncidentSelect(inc) }}
        />
      ))}
    </MapContainer>
  );
}
