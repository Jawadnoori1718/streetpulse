import { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS, ArcElement, BarElement, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { fetchStats, fetchIncidents, fetchPoliceCrimes } from '../services/api';
import type { IncidentStats, Incident, PoliceIncident } from '../types';

ChartJS.register(ArcElement, BarElement, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend);

const RED = '#ef4444';
const CAT_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#eab308', '#64748b'];

const axis = {
  x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b6b7b', font: { size: 10 } } },
  y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b6b7b', font: { size: 10 } }, beginAtZero: true },
};

function Card({ title, children, h = 240 }: { title: string; children: React.ReactNode; h?: number }) {
  return (
    <div className="sp-card" style={{ padding: 18 }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#fff' }}>{title}</h3>
      <div style={{ height: h }}>{children}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [police, setPolice] = useState<PoliceIncident[]>([]);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => {});
    fetchIncidents().then(setIncidents).catch(() => {});
    fetchPoliceCrimes().then(setPolice).catch(() => {});
  }, []);

  const polCats = useMemo(() => {
    const c: Record<string, number> = {};
    police.forEach((p) => { c[p.category] = (c[p.category] || 0) + 1; });
    return Object.entries(c).sort(([, a], [, b]) => b - a).slice(0, 12);
  }, [police]);

  const months = useMemo(() => {
    const c: Record<string, number> = {};
    police.forEach((p) => { c[p.month] = (c[p.month] || 0) + 1; });
    return Object.entries(c).sort(([a], [b]) => a.localeCompare(b));
  }, [police]);

  const commCats = useMemo(() => {
    const c: Record<string, number> = {};
    incidents.forEach((i) => { c[i.category] = (c[i.category] || 0) + 1; });
    return Object.entries(c).sort(([, a], [, b]) => b - a);
  }, [incidents]);

  const areas = useMemo(() => {
    const w = { HIGH: 3, MEDIUM: 2, LOW: 1 } as const;
    const s: Record<string, number> = {};
    incidents.forEach((i) => { if (i.area) s[i.area] = (s[i.area] || 0) + w[i.severity]; });
    return Object.entries(s).sort(([, a], [, b]) => b - a).slice(0, 8);
  }, [incidents]);

  const kpis = [
    { label: 'Police Crimes', value: police.length, sub: 'last 12 months', color: '#818cf8' },
    { label: 'Community Reports', value: stats?.totalIncidents ?? incidents.length, sub: 'submitted by residents', color: RED },
    { label: 'High Priority', value: stats?.highSeverityCount ?? 0, sub: 'HIGH severity', color: '#f97316' },
    { label: 'Last 24 Hours', value: stats?.last24HoursCount ?? 0, sub: 'new reports', color: '#22c55e' },
  ];

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ margin: '4px 0 4px', fontSize: 22, fontWeight: 700, color: '#fff' }}>Crime Intelligence</h1>
      <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--text-2)' }}>Uxbridge &amp; Hillingdon · Police UK open data + community reports</p>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12, marginBottom: 14 }}>
        {kpis.map((k) => (
          <div key={k.label} className="sp-card" style={{ padding: '16px 18px', borderTop: `2px solid ${k.color}` }}>
            <p style={{ margin: 0, fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: '#fff' }}>{k.value}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' }}>{k.label}</p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 14 }}>
        <Card title="Police Crime Types">
          <Bar
            data={{ labels: polCats.map(([c]) => c), datasets: [{ data: polCats.map(([, n]) => n), backgroundColor: '#818cf8aa', borderRadius: 4 }] }}
            options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: axis }}
          />
        </Card>

        <Card title="Monthly Crime Trend">
          <Line
            data={{ labels: months.map(([m]) => m), datasets: [{ data: months.map(([, n]) => n), borderColor: '#818cf8', borderWidth: 2, tension: 0.4, pointRadius: 3, fill: true,
              backgroundColor: (ctx: { chart: ChartJS }) => { const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 240); g.addColorStop(0, '#818cf855'); g.addColorStop(1, '#818cf800'); return g; } }] }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: axis }}
          />
        </Card>

        <Card title="Community Categories">
          <Bar
            data={{ labels: commCats.map(([c]) => c), datasets: [{ data: commCats.map(([, n]) => n), backgroundColor: '#ef4444aa', borderRadius: 4 }] }}
            options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: axis }}
          />
        </Card>

        <Card title="Severity Split">
          {stats ? (
            <Doughnut
              data={{ labels: ['High', 'Medium', 'Low'], datasets: [{ data: [stats.highSeverityCount, stats.mediumSeverityCount, stats.lowSeverityCount], backgroundColor: ['#ef4444', '#f59e0b', '#22c55e'], borderColor: 'transparent', hoverOffset: 6 }] }}
              options={{ responsive: true, maintainAspectRatio: false, cutout: '64%', plugins: { legend: { position: 'bottom', labels: { color: 'var(--text-2)', boxWidth: 9, padding: 10, font: { size: 11 } } } } }}
            />
          ) : <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading…</p>}
        </Card>
      </div>

      {/* Top areas */}
      <div className="sp-card" style={{ padding: 18, marginTop: 14 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#fff' }}>Area Risk Index (community)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {areas.map(([area, score], i) => {
            const max = areas[0]?.[1] || 1;
            const pct = Math.round((score / max) * 100);
            const color = i < 2 ? '#ef4444' : i < 4 ? '#f59e0b' : '#22c55e';
            return (
              <div key={area}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text)' }}>{area}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color }}>{score}</span>
                </div>
                <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
          {areas.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>No area data yet.</p>}
        </div>
      </div>
    </div>
  );
}
