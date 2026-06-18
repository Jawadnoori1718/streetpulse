import { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS, ArcElement, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, ShieldCheck, Clock, Footprints, ArrowRight, AlertTriangle, Shield, FileText } from 'lucide-react';
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
    <div style={{ height: 40, marginTop: 8 }}>
      <Line
        data={{
          labels: data.map((_, i) => i),
          datasets: [{ data, borderColor: color, borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0,
            backgroundColor: (ctx: { chart: ChartJS }) => {
              const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 40);
              g.addColorStop(0, color + '55'); g.addColorStop(1, color + '00'); return g;
            } }],
        }}
        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } }, elements: { line: { borderJoinStyle: 'round' } } }}
      />
    </div>
  );
}

function Kpi({ label, value, delta, deltaUp, deltaGood, sub, spark, color }: {
  label: string; value: string | number; delta?: string; deltaUp?: boolean; deltaGood?: boolean; sub: string; spark: number[]; color: string;
}) {
  return (
    <div className="sp-card sp-card-hover" style={{ padding: '16px 18px' }}>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500 }}>{label}</p>
      <p style={{ margin: '6px 0 2px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{value}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {delta && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11.5, fontWeight: 600, color: deltaGood ? '#22c55e' : '#ef4444' }}>
            {deltaUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{delta}
          </span>
        )}
        <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{sub}</span>
      </div>
      <Sparkline data={spark} color={color} />
    </div>
  );
}

function SectionCard({ title, right, children, pad = 18 }: { title: string; right?: React.ReactNode; children: React.ReactNode; pad?: number }) {
  return (
    <div className="sp-card" style={{ padding: pad, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: '#fff' }}>{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function OverviewPage() {
  const wide = useMediaQuery('(min-width: 1180px)');
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

  // Safe-route illustrative metrics (Uxbridge station → Brunel University)
  const routeKm = haversineKm(51.5462, -0.4784, 51.5326, -0.4756);
  const routeSafety = routeRisk != null ? Math.max(1, 100 - routeRisk) : 84;
  const routeEta = Math.max(1, Math.round((routeKm / 4.8) * 60));
  const routeMiles = (routeKm * 0.621371).toFixed(1);

  const gridGap = 14;

  return (
    <div style={{ padding: wide ? '20px 22px 36px' : '14px 14px 90px', maxWidth: 1500, margin: '0 auto', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: wide ? 'minmax(0,1fr) 360px' : '1fr', gap: gridGap, alignItems: 'start' }}>

        {/* ── MAIN COLUMN ─────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: gridGap, minWidth: 0 }}>

          {/* Map */}
          <div className="sp-card" style={{ position: 'relative', overflow: 'hidden', height: wide ? 440 : 320, padding: 0 }}>
            <SafeMap
              incidents={incidents}
              filters={{ category: 'ALL', severity: 'ALL' }}
              onMapClick={() => {}}
              onIncidentSelect={() => {}}
              onPoliceSelect={() => {}}
              policeCrimes={police}
              showPolice={false}
              riskCells={risk}
              showRisk
            />
            {/* Uxbridge label */}
            <div style={{ position: 'absolute', top: '46%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 500, pointerEvents: 'none',
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: wide ? 26 : 18, letterSpacing: '0.18em',
              color: 'rgba(255,255,255,0.85)', textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>UXBRIDGE</div>
            {/* Legend */}
            <div style={{ position: 'absolute', right: 14, bottom: 14, zIndex: 500,
              background: 'rgba(13,13,20,0.78)', backdropFilter: 'blur(8px)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '10px 12px' }}>
              <p style={{ margin: '0 0 7px', fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>Risk Level</p>
              {LEGEND.map((x) => (
                <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: x.c, boxShadow: `0 0 6px ${x.c}` }} />
                  <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{x.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: wide ? 'repeat(4, minmax(0,1fr))' : 'repeat(2, minmax(0,1fr))', gap: gridGap }}>
            <Kpi label="Incidents (total)" value={kpi.total} delta="live" deltaUp deltaGood={false} sub="community + escalated" spark={trend.slice(-14)} color={RED} />
            <Kpi label="High Risk Areas" value={kpi.highAreas} sub="areas with HIGH reports" spark={dailySeries(incidents, 14, (i) => i.severity === 'HIGH')} color="#f97316" />
            <Kpi label="Reports This Week" value={kpi.week} sub="last 7 days" spark={dailySeries(incidents, 7)} color="#22c55e" deltaGood deltaUp delta="" />
            <Kpi label="Police Updates" value={kpi.police} sub="last 12 months" spark={dailySeries(incidents, 14)} color="#818cf8" />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: wide ? 'minmax(0,1.5fr) minmax(0,1fr)' : '1fr', gap: gridGap }}>
            <SectionCard title="Incident Trend" right={<span className="sp-chip" style={{ background: 'rgba(239,68,68,0.12)', color: RED }}>30D</span>}>
              <div style={{ height: 200 }}>
                <Line
                  data={{
                    labels: trend.map((_, i) => `${30 - i}d`),
                    datasets: [
                      { label: 'All', data: trend, borderColor: RED, borderWidth: 2, tension: 0.4, pointRadius: 0, fill: true,
                        backgroundColor: (ctx: { chart: ChartJS }) => { const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, '#ef444455'); g.addColorStop(1, '#ef444400'); return g; } },
                      { label: 'High severity', data: trendHigh, borderColor: '#f59e0b', borderWidth: 2, tension: 0.4, pointRadius: 0, fill: false },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: 'var(--text-2)', boxWidth: 10, font: { size: 11 } } }, tooltip: { enabled: true } },
                    scales: {
                      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b6b7b', maxTicksLimit: 6, font: { size: 10 } } },
                      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b6b7b', font: { size: 10 } }, beginAtZero: true },
                    } }}
                />
              </div>
            </SectionCard>

            <SectionCard title="Incidents by Category">
              {catData.values.length > 0 ? (
                <div style={{ height: 200, display: 'flex', alignItems: 'center' }}>
                  <Doughnut
                    data={{ labels: catData.labels, datasets: [{ data: catData.values, backgroundColor: catData.labels.map((_, i) => CAT_COLORS[i % CAT_COLORS.length]), borderColor: 'transparent', borderWidth: 0, hoverOffset: 6 }] }}
                    options={{ responsive: true, maintainAspectRatio: false, cutout: '64%',
                      plugins: { legend: { position: 'right', labels: { color: 'var(--text-2)', boxWidth: 9, padding: 8, font: { size: 11 } } }, tooltip: { enabled: true } } }}
                  />
                </div>
              ) : <p style={{ color: 'var(--muted)', fontSize: 13 }}>No data yet.</p>}
            </SectionCard>
          </div>
        </div>

        {/* ── RIGHT RAIL ──────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: gridGap, minWidth: 0 }}>

          {/* AI assistant */}
          <div style={{ height: 420 }}>
            <AIAssistant />
          </div>

          {/* Safe route */}
          <div className="sp-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: '#fff' }}>Safe Route Suggestion</h3>
              <span className="sp-chip" style={{ background: 'rgba(34,197,94,0.14)', color: '#22c55e' }}>Recommended</span>
            </div>
            <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--text)' }}>Uxbridge Station → Brunel University</p>
            <p style={{ margin: '0 0 14px', fontSize: 11.5, color: 'var(--muted)' }}>Now · routed around current risk</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
              {[
                { Icon: ShieldCheck, v: routeSafety, l: 'Safety Score', c: '#22c55e' },
                { Icon: Clock, v: `${routeEta} min`, l: 'ETA', c: 'var(--text)' },
                { Icon: Footprints, v: `${routeMiles} mi`, l: 'Distance', c: 'var(--text)' },
              ].map(({ Icon, v, l, c }) => (
                <div key={l} style={{ textAlign: 'center', padding: '10px 4px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <Icon size={15} style={{ color: c, margin: '0 auto 5px', display: 'block' }} />
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: c === 'var(--text)' ? '#fff' : c }}>{v}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{l}</div>
                </div>
              ))}
            </div>
            <button className="sp-btn-red" style={{ width: '100%', padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 13.5 }}>
              View Route <ArrowRight size={15} />
            </button>
          </div>

          {/* Active alerts */}
          <div className="sp-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: '#fff' }}>Active Alerts</h3>
              <span style={{ fontSize: 12, color: RED, cursor: 'pointer' }}>View all</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {alerts.slice(0, 4).map((a, i) => {
                const Icon = a.level === 'HIGH' ? AlertTriangle : a.area ? Shield : FileText;
                const color = a.level === 'HIGH' ? '#ef4444' : '#f59e0b';
                return (
                  <div key={i} style={{ display: 'flex', gap: 11 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: `${color}1f`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={14} style={{ color }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</p>
                      <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-2)' }}>{a.area || 'West London'}</p>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>{a.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
