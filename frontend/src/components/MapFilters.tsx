import type { FilterState, IncidentCategory, IncidentSeverity } from '../types';

interface MapFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  totalVisible: number;
  totalAll: number;
  showPolice: boolean;
  onTogglePolice: (show: boolean) => void;
}

const categories: Array<{ value: IncidentCategory | 'ALL'; label: string }> = [
  { value: 'ALL',        label: 'All'              },
  { value: 'LIGHTING',   label: 'Lighting'         },
  { value: 'HAZARD',     label: 'Hazard'           },
  { value: 'SUSPICIOUS', label: 'Suspicious'       },
  { value: 'VANDALISM',  label: 'Vandalism'        },
  { value: 'ANTISOCIAL', label: 'Anti-social'      },
  { value: 'PARKING',    label: 'Parking'          },
  { value: 'NOISE',      label: 'Noise'            },
  { value: 'DRUG',       label: 'Drug Activity'    },
  { value: 'VEHICLE',    label: 'Vehicle Crime'    },
  { value: 'THEFT',      label: 'Theft'            },
];

const severities: Array<{ value: IncidentSeverity | 'ALL'; label: string; colour?: string }> = [
  { value: 'ALL',    label: 'All'    },
  { value: 'HIGH',   label: 'High',   colour: '#dc2626' },
  { value: 'MEDIUM', label: 'Medium', colour: '#d97706' },
  { value: 'LOW',    label: 'Low',    colour: '#16a34a' },
];

export default function MapFilters({ filters, onChange, showPolice, onTogglePolice }: MapFiltersProps) {
  const pillBase: React.CSSProperties = {
    fontSize: '11px', padding: '4px 9px', borderRadius: '99px',
    cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Inter',
    border: '1px solid #e2e8f0',
  };

  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '14px 16px', border: '1px solid #e2e8f0' }}>
      <p style={{ fontWeight: 600, fontSize: '12px', color: '#94a3b8', margin: '0 0 12px', letterSpacing: '0.06em' }}>
        FILTERS
      </p>

      {/* Category filter */}
      <div style={{ marginBottom: '10px' }}>
        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 6px' }}>Type</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {categories.map(({ value, label }) => {
            const active = filters.category === value;
            return (
              <button
                key={value}
                onClick={() => onChange({ ...filters, category: value as IncidentCategory | 'ALL' })}
                style={{
                  ...pillBase,
                  background: active ? '#1e3a5f' : 'white',
                  color: active ? 'white' : '#475569',
                  borderColor: active ? '#1e3a5f' : '#e2e8f0',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Severity filter */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 6px' }}>Severity</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {severities.map(({ value, label, colour }) => {
            const active = filters.severity === value;
            return (
              <button
                key={value}
                onClick={() => onChange({ ...filters, severity: value as IncidentSeverity | 'ALL' })}
                style={{
                  ...pillBase,
                  background: active ? (colour ?? '#1e3a5f') : 'white',
                  color: active ? 'white' : '#475569',
                  borderColor: active ? (colour ?? '#1e3a5f') : '#e2e8f0',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}
              >
                {!active && colour && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colour, display: 'inline-block' }} />
                )}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Police data toggle */}
      <div style={{ paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
        <button
          onClick={() => onTogglePolice(!showPolice)}
          style={{
            ...pillBase,
            display: 'flex', alignItems: 'center', gap: '7px',
            background: showPolice ? 'rgba(99,102,241,0.08)' : 'white',
            color: showPolice ? '#6366f1' : '#475569',
            borderColor: showPolice ? 'rgba(99,102,241,0.3)' : '#e2e8f0',
            width: '100%', justifyContent: 'center',
          }}
        >
          <span style={{
            width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
            border: '1.5px dashed #6366f1',
            background: showPolice ? 'rgba(99,102,241,0.15)' : 'transparent',
          }} />
          {showPolice ? 'Showing Police Data' : 'Show Police Data'}
        </button>
      </div>
    </div>
  );
}
