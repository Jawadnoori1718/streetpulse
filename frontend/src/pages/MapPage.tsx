import { useState, useEffect, useCallback } from 'react';
import { Plus, Map, List, Sliders, X, MapPin, ThumbsUp, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import SafeMap from '../components/SafeMap';
import ReportForm from '../components/ReportForm';
import LiveFeed from '../components/LiveFeed';
import MapFilters from '../components/MapFilters';
import AIAssistant from '../components/AIAssistant';
import { fetchIncidents, fetchRecentIncidents, fetchPoliceCrimes, upvoteIncident } from '../services/api';
import type { Incident, FilterState, PoliceIncident } from '../types';

type MobileTab = 'map' | 'filters' | 'feed';

const mobileTabs: { id: MobileTab; label: string; Icon: typeof Map }[] = [
  { id: 'map',     label: 'Map',     Icon: Map     },
  { id: 'filters', label: 'Filters', Icon: Sliders },
  { id: 'feed',    label: 'Feed',    Icon: List    },
];

const SIDEBAR_BORDER = '1px solid #e2e8f0';

const SEVERITY_COLOR: Record<string, string> = {
  HIGH: '#dc2626', MEDIUM: '#d97706', LOW: '#16a34a',
};

const CATEGORY_LABEL: Record<string, string> = {
  LIGHTING: 'Poor Lighting', HAZARD: 'Physical Hazard', SUSPICIOUS: 'Suspicious Activity',
  VANDALISM: 'Vandalism', ANTISOCIAL: 'Anti-social Behaviour', PARKING: 'Dangerous Parking',
  NOISE: 'Noise Nuisance', DRUG: 'Drug Activity', VEHICLE: 'Vehicle Crime', THEFT: 'Theft / Robbery',
};

// ── Overlay wrapper ────────────────────────────────────────────────────────
function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

// ── Incident detail modal ──────────────────────────────────────────────────
function IncidentDetail({
  incident,
  upvoted,
  onUpvote,
  onClose,
}: {
  incident: Incident;
  upvoted: boolean;
  onUpvote: () => void;
  onClose: () => void;
}) {
  const sevColor = SEVERITY_COLOR[incident.severity] ?? '#94a3b8';

  return (
    <div style={{ width: '100%', maxWidth: '460px', background: 'white', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
      {/* Header */}
      <div style={{ background: '#1e3a5f', padding: '20px 22px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '15px', color: 'white', margin: '0 0 6px', lineHeight: 1.3 }}>{incident.title}</p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
              background: `${sevColor}30`, color: sevColor, border: `1px solid ${sevColor}50`,
              letterSpacing: '0.06em',
            }}>
              {incident.severity}
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
              {CATEGORY_LABEL[incident.category] ?? incident.category}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', borderRadius: '8px', padding: '6px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
        >
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {incident.description && (
          <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, margin: 0 }}>{incident.description}</p>
        )}

        {/* Detail rows */}
        {[
          { label: 'Area',     value: incident.area || 'Not specified' },
          { label: 'Reported', value: format(new Date(incident.reportedAt), "d MMMM yyyy 'at' HH:mm") },
          { label: 'Coordinates', value: `${incident.latitude.toFixed(5)}, ${incident.longitude.toFixed(5)}` },
          { label: 'Time ago',  value: formatDistanceToNow(new Date(incident.reportedAt), { addSuffix: true }) },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
            <span style={{ color: '#94a3b8', minWidth: '90px', flexShrink: 0 }}>{label}</span>
            <span style={{ color: '#0f172a', fontWeight: 500 }}>{value}</span>
          </div>
        ))}

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={13} style={{ color: '#94a3b8' }} />
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Uxbridge area</span>
          </div>

          <button
            onClick={onUpvote}
            disabled={upvoted}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: upvoted ? 'default' : 'pointer',
              background: upvoted ? 'rgba(13,148,136,0.1)' : '#1e3a5f',
              color: upvoted ? '#0d9488' : 'white',
              fontFamily: 'Inter', fontWeight: 600, fontSize: '13px',
              transition: 'opacity 0.15s',
            }}
            onMouseOver={(e) => { if (!upvoted) e.currentTarget.style.opacity = '0.88'; }}
            onMouseOut={(e) => { if (!upvoted) e.currentTarget.style.opacity = '1'; }}
          >
            <ThumbsUp size={13} />
            {upvoted ? 'Confirmed' : 'Confirm'}
            <span style={{ fontWeight: 700, marginLeft: '2px' }}>{incident.upvotes}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Police detail modal ────────────────────────────────────────────────────
function PoliceDetail({ pc, onClose }: { pc: PoliceIncident; onClose: () => void }) {
  return (
    <div style={{ width: '100%', maxWidth: '420px', background: 'white', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
      {/* Header */}
      <div style={{ background: '#1e3a5f', padding: '20px 22px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', letterSpacing: '0.1em' }}>POLICE UK — OFFICIAL RECORD</p>
          <p style={{ fontWeight: 700, fontSize: '15px', color: 'white', margin: 0 }}>{pc.category}</p>
        </div>
        <button
          onClick={onClose}
          style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', borderRadius: '8px', padding: '6px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
        >
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[
          { label: 'Crime type',  value: pc.category },
          { label: 'Street',      value: pc.streetName || 'Not disclosed' },
          { label: 'Month',       value: pc.month },
          { label: 'Outcome',     value: pc.outcomeStatus || 'No further action / under investigation' },
          { label: 'Coordinates', value: pc.latitude != null ? `${pc.latitude?.toFixed(5)}, ${pc.longitude?.toFixed(5)}` : 'Approximate location' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
            <span style={{ color: '#94a3b8', minWidth: '90px', flexShrink: 0 }}>{label}</span>
            <span style={{ color: '#0f172a', fontWeight: 500, textTransform: label === 'Outcome' ? 'none' : 'none' }}>{value}</span>
          </div>
        ))}

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
            Source: Police UK open data API. Records are published approximately 2–3 months after the date of occurrence. Location accuracy is approximate (snapped to nearest street).
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main MapPage ───────────────────────────────────────────────────────────
export default function MapPage() {
  const [allIncidents, setAllIncidents]       = useState<Incident[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [policeCrimes, setPoliceCrimes]       = useState<PoliceIncident[]>([]);
  const [showPolice, setShowPolice]           = useState(true);
  const [loading, setLoading]                 = useState(true);

  // Modal states
  const [showReport, setShowReport]       = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedPolice, setSelectedPolice]     = useState<PoliceIncident | null>(null);

  // Upvote tracking
  const [upvotedIds, setUpvotedIds]   = useState<Set<number>>(new Set());
  const [upvotingId, setUpvotingId]   = useState<number | null>(null);

  const [filters, setFilters]   = useState<FilterState>({ category: 'ALL', severity: 'ALL' });
  const [mobileTab, setMobileTab] = useState<MobileTab>('map');

  const loadData = useCallback(async () => {
    try {
      const [all, recent] = await Promise.all([fetchIncidents(), fetchRecentIncidents()]);
      setAllIncidents(all);
      setRecentIncidents(recent);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPoliceCrimes().then(setPoliceCrimes).catch(() => {}); }, []);
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleMapClick = (lat: number, lng: number) => {
    setClickedCoords({ lat, lng });
    setShowReport(true);
  };

  const handleReportSuccess = () => {
    loadData();
    setShowReport(false);
    setClickedCoords(null);
  };

  const handleUpvote = async (id: number) => {
    if (upvotedIds.has(id) || upvotingId === id) return;
    setUpvotingId(id);
    try {
      const updated = await upvoteIncident(id);
      setAllIncidents((prev) => prev.map((inc) => inc.id === updated.id ? updated : inc));
      setRecentIncidents((prev) => prev.map((inc) => inc.id === updated.id ? updated : inc));
      if (selectedIncident?.id === id) setSelectedIncident(updated);
      setUpvotedIds((prev) => new Set(prev).add(id));
    } catch { /* fail silently */ }
    finally { setUpvotingId(null); }
  };

  const visibleCount = allIncidents.filter((inc) => {
    if (filters.category !== 'ALL' && inc.category !== filters.category) return false;
    if (filters.severity !== 'ALL' && inc.severity !== filters.severity) return false;
    return true;
  }).length;

  const ReportButton = (
    <button
      onClick={() => setShowReport(true)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        width: '100%', padding: '12px', borderRadius: '12px',
        background: '#1e3a5f', color: 'white',
        fontFamily: 'Inter', fontWeight: 600, fontSize: '14px',
        cursor: 'pointer', border: 'none', transition: 'opacity 0.2s',
        boxShadow: '0 2px 8px rgba(30,58,95,0.25)',
      }}
      onMouseOver={(e) => (e.currentTarget.style.opacity = '0.88')}
      onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
    >
      <Plus size={16} /> Report an Incident
    </button>
  );

  const LeftPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <MapFilters
        filters={filters}
        onChange={setFilters}
        totalVisible={visibleCount}
        totalAll={allIncidents.length}
        showPolice={showPolice}
        onTogglePolice={setShowPolice}
      />
      {ReportButton}
      <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <LiveFeed
          incidents={recentIncidents}
          loading={loading}
          onIncidentClick={setSelectedIncident}
        />
      </div>
    </div>
  );

  const MapArea = (
    <div style={{ flex: 1, position: 'relative', zIndex: 0, height: '100%' }}>
      <div style={{
        position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, pointerEvents: 'none',
        background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(8px)',
        border: '1px solid #e2e8f0', borderRadius: '99px', padding: '5px 14px',
        fontSize: '12px', color: '#64748b', fontFamily: 'Inter', whiteSpace: 'nowrap',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        Click anywhere on the map to report an incident
      </div>

      {loading && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 1000, background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
          padding: '20px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}>
          <Loader2 size={22} style={{ color: '#0d9488', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Loading incidents...</p>
        </div>
      )}

      <SafeMap
        incidents={allIncidents}
        filters={filters}
        onMapClick={handleMapClick}
        onIncidentsUpdate={loadData}
        onIncidentSelect={setSelectedIncident}
        onPoliceSelect={setSelectedPolice}
        policeCrimes={policeCrimes}
        showPolice={showPolice}
      />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>

      {/* Desktop 3-column */}
      <div className="hidden lg:flex" style={{ flex: 1, overflow: 'hidden' }}>
        <aside style={{ width: '280px', minWidth: '280px', flexShrink: 0, padding: '14px', overflowY: 'auto', background: '#ffffff', borderRight: SIDEBAR_BORDER }}>
          {LeftPanel}
        </aside>

        {MapArea}

        <aside style={{ width: '300px', minWidth: '300px', flexShrink: 0, padding: '14px', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#ffffff', borderLeft: SIDEBAR_BORDER }}>
          <AIAssistant />
        </aside>
      </div>

      {/* Tablet 2-column */}
      <div className="hidden md:flex lg:hidden" style={{ flex: 1, overflow: 'hidden' }}>
        <aside style={{ width: '260px', minWidth: '260px', flexShrink: 0, padding: '12px', overflowY: 'auto', background: '#ffffff', borderRight: SIDEBAR_BORDER }}>
          {LeftPanel}
        </aside>
        {MapArea}
      </div>

      {/* Mobile */}
      <div className="flex md:hidden" style={{ flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: mobileTab === 'map' ? 'flex' : 'none', flex: 1, position: 'relative' }}>
          {MapArea}
        </div>
        {mobileTab !== 'map' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mobileTab === 'filters' && (
              <>
                <MapFilters filters={filters} onChange={setFilters} totalVisible={visibleCount} totalAll={allIncidents.length} showPolice={showPolice} onTogglePolice={setShowPolice} />
                {ReportButton}
              </>
            )}
            {mobileTab === 'feed' && (
              <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <LiveFeed incidents={recentIncidents} loading={loading} onIncidentClick={setSelectedIncident} />
              </div>
            )}
          </div>
        )}
        <nav style={{ display: 'flex', background: '#ffffff', borderTop: '1px solid #e2e8f0', paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -2px 8px rgba(0,0,0,0.06)' }}>
          {mobileTabs.map(({ id, label, Icon }) => {
            const active = mobileTab === id;
            return (
              <button key={id} onClick={() => setMobileTab(id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '10px 4px', background: 'none', border: 'none', cursor: 'pointer', color: active ? '#1e3a5f' : '#94a3b8', borderTop: `2px solid ${active ? '#1e3a5f' : 'transparent'}`, transition: 'color 0.15s' }}>
                <Icon size={18} />
                <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400 }}>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Report form modal */}
      {showReport && (
        <Overlay onClose={() => { setShowReport(false); setClickedCoords(null); }}>
          <div style={{ width: '100%', maxWidth: '580px', height: 'min(90vh, 720px)', display: 'flex', flexDirection: 'column' }}>
            <ReportForm
              initialLat={clickedCoords?.lat}
              initialLng={clickedCoords?.lng}
              onClose={() => { setShowReport(false); setClickedCoords(null); }}
              onSuccess={handleReportSuccess}
            />
          </div>
        </Overlay>
      )}

      {/* Incident detail modal */}
      {selectedIncident && (
        <Overlay onClose={() => setSelectedIncident(null)}>
          <IncidentDetail
            incident={selectedIncident}
            upvoted={upvotedIds.has(selectedIncident.id)}
            onUpvote={() => handleUpvote(selectedIncident.id)}
            onClose={() => setSelectedIncident(null)}
          />
        </Overlay>
      )}

      {/* Police detail modal */}
      {selectedPolice && (
        <Overlay onClose={() => setSelectedPolice(null)}>
          <PoliceDetail pc={selectedPolice} onClose={() => setSelectedPolice(null)} />
        </Overlay>
      )}
    </div>
  );
}
