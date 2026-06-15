import { formatDistanceToNow } from 'date-fns';
import type { Incident } from '../types';

const SEVERITY_COLOR: Record<string, string> = {
  HIGH:   '#dc2626',
  MEDIUM: '#d97706',
  LOW:    '#16a34a',
};

const CATEGORY_LABEL: Record<string, string> = {
  LIGHTING:   'Lighting',
  HAZARD:     'Hazard',
  SUSPICIOUS: 'Suspicious',
  VANDALISM:  'Vandalism',
  ANTISOCIAL: 'Anti-social',
  PARKING:    'Parking',
  NOISE:      'Noise',
  DRUG:       'Drug Activity',
  VEHICLE:    'Vehicle Crime',
  THEFT:      'Theft',
};

interface LiveFeedProps {
  incidents: Incident[];
  loading: boolean;
  onIncidentClick: (incident: Incident) => void;
}

export default function LiveFeed({ incidents, loading, onIncidentClick }: LiveFeedProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: '56px', width: '100%', borderRadius: '10px' }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 18px', borderBottom: '1px solid #e2e8f0',
      }}>
        <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '12px', color: '#94a3b8', margin: 0, letterSpacing: '0.06em' }}>
          RECENT REPORTS
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: '#16a34a' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          LIVE
        </div>
      </div>

      {/* Rows */}
      <div style={{ overflowY: 'auto', maxHeight: '380px' }}>
        {incidents.length === 0 ? (
          <div style={{ padding: '28px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>No reports yet. Be the first.</p>
          </div>
        ) : (
          incidents.map((incident, idx) => (
            <button
              key={incident.id}
              onClick={() => onIncidentClick(incident)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                width: '100%', padding: '11px 18px', textAlign: 'left',
                background: 'transparent', border: 'none', cursor: 'pointer',
                borderBottom: idx < incidents.length - 1 ? '1px solid #f1f5f9' : 'none',
                transition: 'background 0.12s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(30,58,95,0.03)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Severity dot */}
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: SEVERITY_COLOR[incident.severity] ?? '#94a3b8',
                flexShrink: 0, display: 'block',
              }} />

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '13px', fontWeight: 500, color: '#0f172a', margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {incident.title}
                </p>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                  {incident.area
                    ? `${incident.area} · `
                    : ''
                  }
                  {CATEGORY_LABEL[incident.category] ?? incident.category}
                  {' · '}
                  {formatDistanceToNow(new Date(incident.reportedAt), { addSuffix: true })}
                </p>
              </div>

              {/* Confirmation count */}
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e3a5f', flexShrink: 0 }}>
                {incident.upvotes}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
