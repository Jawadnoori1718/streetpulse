import { useCallback, useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import SafeMap from '../components/SafeMap';
import ReportForm from '../components/ReportForm';
import { fetchIncidents, fetchPoliceCrimes, fetchRiskGrid } from '../services/api';
import type { Incident, PoliceIncident, RiskCell, IncidentSeverity } from '../types';

const SEV_COLOR: Record<IncidentSeverity, string> = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' };

export default function LiveMapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [police, setPolice] = useState<PoliceIncident[]>([]);
  const [risk, setRisk] = useState<RiskCell[]>([]);
  const [hour, setHour] = useState(new Date().getHours());
  const [showRisk, setShowRisk] = useState(true);
  const [showPolice, setShowPolice] = useState(false);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [reportAt, setReportAt] = useState<{ lat: number; lng: number } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const load = useCallback(() => {
    fetchIncidents().then(setIncidents).catch(() => {});
    fetchPoliceCrimes().then(setPolice).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!showRisk) { setRisk([]); return; }
    const t = setTimeout(() => { fetchRiskGrid(hour).then(setRisk).catch(() => {}); }, 250);
    return () => clearTimeout(t);
  }, [showRisk, hour]);

  const openReport = (lat: number, lng: number) => { setReportAt({ lat, lng }); setReportOpen(true); };

  return (
    <div style={{ position: 'relative', height: 'calc(100dvh - 64px)' }}>
      <SafeMap
        incidents={incidents}
        filters={{ category: 'ALL', severity: 'ALL' }}
        onMapClick={openReport}
        onIncidentSelect={setSelected}
        onPoliceSelect={() => {}}
        policeCrimes={police}
        showPolice={showPolice}
        riskCells={risk}
        showRisk={showRisk}
      />

      {/* Control panel */}
      <div className="sp-card" style={{ position: 'absolute', top: 14, left: 14, zIndex: 600, width: 250, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showRisk ? 12 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Risk Forecast</span>
          </div>
          <button onClick={() => setShowRisk((v) => !v)} className="sp-chip" style={{ border: 'none', cursor: 'pointer', background: showRisk ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : 'rgba(255,255,255,0.08)', color: showRisk ? '#fff' : 'var(--text-2)' }}>{showRisk ? 'ON' : 'OFF'}</button>
        </div>
        {showRisk && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', minWidth: 46, fontFamily: "'Space Grotesk',sans-serif" }}>{String(hour).padStart(2, '0')}:00</span>
              <input type="range" min={0} max={23} value={hour} onChange={(e) => setHour(Number(e.target.value))} style={{ flex: 1, accentColor: '#ef4444' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10 }}>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>Lower</span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'linear-gradient(to right,#64748b,#22c55e,#f59e0b,#f97316,#ef4444)' }} />
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>Higher</span>
            </div>
          </>
        )}
        <button onClick={() => setShowPolice((v) => !v)} className="sp-btn-ghost" style={{ width: '100%', marginTop: 12, padding: '8px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: showPolice ? '#818cf8' : '#3a3a4c' }} /> Police data {showPolice ? 'on' : 'off'}
        </button>
      </div>

      {/* Hint */}
      <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 590, pointerEvents: 'none', background: 'rgba(13,13,20,0.78)', backdropFilter: 'blur(8px)', border: '1px solid var(--border)', borderRadius: 999, padding: '6px 14px', fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
        Tap anywhere on the map to report an incident
      </div>

      {/* Report FAB */}
      <button onClick={() => { setReportAt(null); setReportOpen(true); }} className="sp-btn-red" style={{ position: 'absolute', right: 16, bottom: 16, zIndex: 600, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
        <Plus size={17} /> Report
      </button>

      {/* Incident detail */}
      {selected && (
        <div className="sp-card" style={{ position: 'absolute', right: 16, bottom: 78, zIndex: 600, width: 280, padding: 16, borderLeft: `3px solid ${SEV_COLOR[selected.severity]}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>{selected.title}</p>
            <button onClick={() => setSelected(null)} className="sp-btn-ghost" style={{ padding: 5, display: 'flex' }}><X size={14} /></button>
          </div>
          <div style={{ display: 'flex', gap: 7, margin: '7px 0' }}>
            <span className="sp-chip" style={{ background: `${SEV_COLOR[selected.severity]}1f`, color: SEV_COLOR[selected.severity] }}>{selected.severity}</span>
            <span className="sp-chip" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-2)' }}>{selected.category}</span>
          </div>
          {selected.description && <p style={{ margin: '0 0 8px', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>{selected.description}</p>}
          <p style={{ margin: 0, fontSize: 11.5, color: 'var(--muted)' }}>{selected.area || 'West London'} · {formatDistanceToNow(new Date(selected.reportedAt), { addSuffix: true })}</p>
        </div>
      )}

      {/* Report modal */}
      {reportOpen && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setReportOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <ReportForm initialLat={reportAt?.lat} initialLng={reportAt?.lng} onClose={() => setReportOpen(false)} onSuccess={() => { setReportOpen(false); setReportAt(null); load(); }} />
          </div>
        </div>
      )}
    </div>
  );
}
