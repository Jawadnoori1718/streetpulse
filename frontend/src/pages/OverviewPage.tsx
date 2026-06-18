import { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS, ArcElement, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ShieldCheck, Clock, Footprints, ArrowRight, AlertTriangle, Shield, FileText } from 'lucide-react';
import SafeMap from '../components/SafeMap';
import AIAssistant from '../components/AIAssistant';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { fetchIncidents, fetchStats, fetchPoliceCrimes, fetchRiskGrid, fetchAlerts, fetchRiskAt } from '../services/api';
import type { Incident, IncidentStats, PoliceIncident, RiskCell, Alert } from '../types';

ChartJS.register(ArcElement, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend);

const RED = '#ef4444';
const CAT_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#eab308', '#64748b'];
const LEGEND = [
  { c: '#ef4444', l: 'Very High' }, { c: '#f97316', l: 'High' }, { c: '#f59e0b', l: 'Medium' },
  { c: '#22c55e', l: 'Low' }, { c: '#64748b', l: 'Very Low' },
];

function daysAgo(iso: string) { return (Date.now() - new Date(iso).getTime()) / 86_400_000; }

function dailySeries(incidents: Incident[], days: number, filter?: (i: Incident) => boolean): number[] {
  const arr = new Array(days).fill(0);
  incidents.forEach((i) => {
    if (filter && !filter(i)) return;
    const d = Math.floor(daysAgo(i.reportedAt));
    if (d >= 0 && d < days) arr[days - 1 - d]++;
  });
  return arr;
}

function haversineKm(la1: number, lo1: number, la2: number, lo2: number) {
  const R = 6371, dLa = (la2 - la1) * Math.PI / 180, dLo = (lo2 - lo1) * Math.PI / 180;
  const a = Math.sin(dLa / 2) ** 2 + Math.cos(la1 * Math.PI / 180) * Math.cos(la2 * Math.PI / 180) * Math.sin(dLo / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  return (
    <div style={{ height: 34, marginTop: 6 }}>
      <Line
        data={{ labels: data.map((_, i) => i), datasets: [{ data, borderColor: color, borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0,
          backgroundColor: (ctx: { chart: ChartJS }) => { const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 34); g.addColorStop(0, color + '55'); g.addColorStop(1, color + '00'); return g; } }] }}
        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }}
      />
    </div>
  );
}

function Kpi({ label, value, sub, spark, color, live }: { label: string; value: string | number; sub: string; spark: number[]; color: string; live?: boolean }) {
  return (
    <div className="sp-card sp-card-hover" style={{ padding: '14px 16px' }}>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{label}</p>
      <p style={{ margin: '4px 0 2px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{value}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {live && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 600, color: '#22c55e' }}><TrendingUp size={11} />live</span>}
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</span>
      </div>
      <Sparkline data={spark} color={color} />
    </div>
  );
}

export default function OverviewPage() {
  const wide = useMediaQuery('(min-width: 1180px)');
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [police, setPolice] = useState<PoliceIncident[]>([]);
  const [risk, setRisk] = useState<RiskCell[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [routeRisk, setRouteRisk] = useState<number | null>(null);

  useEffect(() => {
    fetchIncidents().then(setIncidents).catch(() => {});
    fetchStats().then(setStats).catch(() => {});
    fetchPoliceCrimes().then(setPolice).catch(() => {});
    fetchRiskGrid(new Date().getHours()).then(setRisk).catch(() => {});
    fetchAlerts().then(setAlerts).catch(() => {});
    fetchRiskAt(51.5326, -0.4756, new Date().getHours()).then((r) => setRouteRisk(r.score)).catch(() => {});
  }, []);

  const kpi = useMemo(() => {
    const total = stats?.totalIncidents ?? incidents.length;
    const highAreas = new Set(incidents.filter((i) => i.severity === 'HIGH' && i.area).map((i) => i.area)).size;
    const week = incidents.filter((i) => daysAgo(i.reportedAt) <= 7).length;
    return { total, highAreas, week, police: police.length };
  }, [stats, incidents, police]);

  const catData = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach((i) => { counts[i.category] = (counts[i.category] || 0) + 1; });
    const entries = Object.entries(counts).sort(([, a], [, b]) => b - a);
    return { labels: entries.map((e) => e[0]), values: entries.map((e) => e[1]) };
  }, [incidents]);

  const trend = dailySeries(incidents, 30);
  const trendHigh = dailySeries(incidents, 30, (i) => i.severity === 'HIGH');

  const routeKm = haversineKm(51.5462, -0.4784, 51.5326, -0.4756);
  const routeSafety = routeRisk != null ? Math.max(1, 100 - routeRisk) : 84;
  const routeEta = Math.max(1, Math.round((routeKm / 4.8) * 60));
  const routeMiles = (routeKm * 0.621371).toFixed(1);

  const G = 14;

  // Layout differs: desktop = fit-to-viewport (no scroll); mobile = scroll.
  const rootStyle: React.CSSProperties = wide
    ? { height: '100%', padding: 16, boxSizing: 'border-box', overflow: 'hidden', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 352px', gap: G }
    : { padding: '14px 14px 80px', width: '100%', boxSizing: 'border-box', overflowX: 'hidden', display: 'grid', gridTemplateColumns: '1fr', gap: G };

  const mainCol: React.CSSProperties = wide
    ? { display: 'flex', flexDirection: 'column', gap: G, minWidth: 0, minHeight: 0, height: '100%' }
    : { display: 'flex', flexDirection: 'column', gap: G, minWidth: 0 };

  const railCol: React.CSSProperties = wide
    ? { display: 'flex', flexDirection: 'column', gap: G, minWidth: 0, minHeight: 0, height: '100%', overflow: 'hidden' }
    : { display: 'flex', flexDirection: 'column', gap: G, minWidth: 0 };

  const trendChart = (
    <Line
      data={{ labels: trend.map((_, i) => `${30 - i}d`), datasets: [
        { label: 'All', data: trend, borderColor: RED, borderWidth: 2, tension: 0.4, pointRadius: 0, fill: true,
          backgroundColor: (ctx: { chart: ChartJS }) => { const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, '#ef444455'); g.addColorStop(1, '#ef444400'); return g; } },
        { label: 'High severity', data: trendHigh, borderColor: '#f59e0b', borderWidth: 2, tension: 0.4, pointRadius: 0, fill: false },
      ] }}
      options={{ responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: 'var(--text-2)', boxWidth: 10, font: { size: 10 } } }, tooltip: { enabled: true } },
        scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b6b7b', maxTicksLimit: 6, font: { size: 9 } } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b6b7b', font: { size: 9 } }, beginAtZero: true } } }}
    />
  );

  return (
    <div style={rootStyle}>
      {/* ── MAIN ─────────────────────────────────────── */}
      <div style={mainCol}>
        {/* Map */}
        <div className="sp-card" style={{ position: 'relative', overflow: 'hidden', padding: 0, ...(wide ? { flex: '1 1 auto', minHeight: 150 } : { height: 300 }) }}>
          <SafeMap incidents={incidents} filters={{ category: 'ALL', severity: 'ALL' }} onMapClick={() => navigate('/map')} onIncidentSelect={() => navigate('/map')} onPoliceSelect={() => {}} policeCrimes={police} showPolice={false} riskCells={risk} showRisk />
          <div style={{ position: 'absolute', top: '46%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 500, pointerEvents: 'none', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: wide ? 26 : 18, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.85)', textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>UXBRIDGE</div>
          <div style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 500, background: 'rgba(13,13,20,0.78)', backdropFilter: 'blur(8px)', border: '1px solid var(--border)', borderRadius: 12, padding: '9px 11px' }}>
            <p style={{ margin: '0 0 6px', fontSize: 10.5, fontWeight: 600, color: 'var(--text-2)' }}>Risk Level</p>
            {LEGEND.map((x) => (
              <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: x.c, boxShadow: `0 0 6px ${x.c}` }} />
                <span style={{ fontSize: 10.5, color: 'var(--text-2)' }}>{x.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: wide ? 'repeat(4, minmax(0,1fr))' : 'repeat(2, minmax(0,1fr))', gap: G, flexShrink: 0 }}>
          <Kpi label="Incidents (total)" value={kpi.total} live sub="community + escalated" spark={trend.slice(-14)} color={RED} />
          <Kpi label="High Risk Areas" value={kpi.highAreas} sub="areas with HIGH reports" spark={dailySeries(incidents, 14, (i) => i.severity === 'HIGH')} color="#f97316" />
          <Kpi label="Reports This Week" value={kpi.week} sub="last 7 days" spark={dailySeries(incidents, 7)} color="#22c55e" />
          <Kpi label="Police Updates" value={kpi.police} sub="last 12 months" spark={dailySeries(incidents, 14)} color="#818cf8" />
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: wide ? 'minmax(0,1.6fr) minmax(0,1fr)' : '1fr', gap: G, flexShrink: 0, ...(wide ? { height: 'clamp(150px, 23vh, 230px)' } : {}) }}>
          <div className="sp-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', ...(wide ? {} : { height: 220 }) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>Incident Trend</h3>
              <span className="sp-chip" style={{ background: 'rgba(239,68,68,0.12)', color: RED }}>30D</span>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>{trendChart}</div>
          </div>
          <div className="sp-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', ...(wide ? {} : { height: 220 }) }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#fff' }}>Incidents by Category</h3>
            <div style={{ flex: 1, minHeight: 0 }}>
              {catData.values.length > 0 ? (
                <Doughnut data={{ labels: catData.labels, datasets: [{ data: catData.values, backgroundColor: catData.labels.map((_, i) => CAT_COLORS[i % CAT_COLORS.length]), borderColor: 'transparent', hoverOffset: 6 }] }}
                  options={{ responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'right', labels: { color: 'var(--text-2)', boxWidth: 8, padding: 6, font: { size: 10 } } } } }} />
              ) : <p style={{ color: 'var(--muted)', fontSize: 13 }}>No data yet.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT RAIL ───────────────────────────────── */}
      <div style={railCol}>
        <div style={wide ? { flex: '1 1 auto', minHeight: 180 } : { height: 400 }}>
          <AIAssistant />
        </div>

        {/* Safe route */}
        <div className="sp-card" style={{ padding: 15, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>Safe Route Suggestion</h3>
            <span className="sp-chip" style={{ background: 'rgba(34,197,94,0.14)', color: '#22c55e' }}>Recommended</span>
          </div>
          <p style={{ margin: '0 0 1px', fontSize: 12.5, color: 'var(--text)' }}>Uxbridge Station → Brunel University</p>
          <p style={{ margin: '0 0 11px', fontSize: 11, color: 'var(--muted)' }}>Now · routed around current risk</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7, marginBottom: 11 }}>
            {[{ Icon: ShieldCheck, v: routeSafety, l: 'Safety Score', c: '#22c55e' }, { Icon: Clock, v: `${routeEta} min`, l: 'ETA', c: '#fff' }, { Icon: Footprints, v: `${routeMiles} mi`, l: 'Distance', c: '#fff' }].map(({ Icon, v, l, c }) => (
              <div key={l} style={{ textAlign: 'center', padding: '9px 4px', background: 'rgba(255,255,255,0.03)', borderRadius: 11, border: '1px solid var(--border)' }}>
                <Icon size={14} style={{ color: c === '#fff' ? '#22c55e' : c, margin: '0 auto 4px', display: 'block' }} />
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: c }}>{v}</div>
                <div style={{ fontSize: 9.5, color: 'var(--muted)' }}>{l}</div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/map')} className="sp-btn-red" style={{ width: '100%', padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 13.5 }}>View Route <ArrowRight size={15} /></button>
        </div>

        {/* Active alerts */}
        <div className="sp-card" style={{ padding: 15, flexShrink: 0, ...(wide ? { maxHeight: 190, display: 'flex', flexDirection: 'column' } : {}) }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>Active Alerts</h3>
            <span onClick={() => navigate('/alerts')} style={{ fontSize: 12, color: RED, cursor: 'pointer' }}>View all</span>
          </div>
          <div className="sp-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 11, overflowY: 'auto', minHeight: 0 }}>
            {alerts.slice(0, 4).map((a, i) => {
              const Icon = a.level === 'HIGH' ? AlertTriangle : a.area ? Shield : FileText;
              const color = a.level === 'HIGH' ? '#ef4444' : '#f59e0b';
              return (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: `${color}1f`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={13} style={{ color }} /></div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-2)' }}>{a.area || 'West London'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
