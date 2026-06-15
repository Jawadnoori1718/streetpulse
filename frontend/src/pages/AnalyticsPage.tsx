import { useEffect, useState, useCallback } from 'react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, PointElement, LineElement, Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { fetchStats, fetchIncidents, fetchPoliceCrimes } from '../services/api';
import type { IncidentStats, Incident, PoliceIncident } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

// ─── Palette ──────────────────────────────────────────────────────────────────
const NAVY  = '#1e3a5f';
const TEAL  = '#0d9488';

// Navy shades for multi-series charts — all on-brand, no rainbow
const N = {
  900: 'rgba(30,58,95,0.95)',
  700: 'rgba(30,58,95,0.70)',
  500: 'rgba(30,58,95,0.45)',
  300: 'rgba(30,58,95,0.25)',
  100: 'rgba(30,58,95,0.10)',
};
const T = {
  700: 'rgba(13,148,136,0.80)',
  300: 'rgba(13,148,136,0.20)',
};

// Outcome colours — desaturated so they stay in palette family
const OUTCOME_COLORS: Record<string, string> = {
  'Resolved':             TEAL,
  'Community Resolution': 'rgba(13,148,136,0.55)',
  'Under Investigation':  NAVY,
  'No Suspect Identified':'rgba(30,58,95,0.55)',
  'No Further Action':    'rgba(30,58,95,0.30)',
};

const tip = {
  backgroundColor: 'rgba(255,255,255,0.97)',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  titleColor: '#0f172a',
  bodyColor: '#475569',
  titleFont: { family: 'Inter', size: 13 } as object,
  bodyFont:  { family: 'Inter', size: 12 } as object,
  padding: 12,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function groupOutcome(o: string | null): string {
  if (!o) return 'Under Investigation';
  const l = o.toLowerCase();
  if (l.includes('conviction') || l.includes('caution') || l.includes('charged') || l.includes('penalty')) return 'Resolved';
  if (l.includes('local resolution') || l.includes('community resolution')) return 'Community Resolution';
  if (l.includes('no suspect')) return 'No Suspect Identified';
  if (l.includes('unable to prosecute') || l.includes('not in public interest')) return 'No Further Action';
  return 'Under Investigation';
}

function timeAgo(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Divider({ label, color = NAVY }: { label: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '36px 0 16px' }}>
      <div style={{ width: 3, height: 20, borderRadius: 2, background: color, flexShrink: 0 }} />
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', fontFamily: 'Inter' }}>{label}</h2>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [stats,        setStats]        = useState<IncidentStats | null>(null);
  const [incidents,    setIncidents]    = useState<Incident[]>([]);
  const [policeCrimes, setPoliceCrimes] = useState<PoliceIncident[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [updatedAt,    setUpdatedAt]    = useState<Date | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchIncidents(), fetchPoliceCrimes()])
      .then(([s, inc, pc]) => { setStats(s); setIncidents(inc); setPoliceCrimes(pc); setUpdatedAt(new Date()); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', fontFamily: 'Inter' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: `2px solid #e2e8f0`, borderTopColor: NAVY, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>Loading intelligence data…</p>
      </div>
    </div>
  );

  if (!stats) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', fontFamily: 'Inter' }}>
      <p style={{ color: '#dc2626', fontSize: 14 }}>Could not load data. Is the backend running on port 8080?</p>
    </div>
  );

  // ── Police processing ──────────────────────────────────────────────────────
  const policeCatCounts: Record<string, number> = {};
  policeCrimes.forEach(p => { policeCatCounts[p.category] = (policeCatCounts[p.category] || 0) + 1; });
  const sortedPoliceCats = Object.entries(policeCatCounts).sort(([, a], [, b]) => b - a);

  const monthCounts: Record<string, number> = {};
  policeCrimes.forEach(p => { monthCounts[p.month] = (monthCounts[p.month] || 0) + 1; });
  const sortedMonths = Object.entries(monthCounts).sort(([a], [b]) => a.localeCompare(b));

  let momChange = 0, momLabel = 'N/A';
  if (sortedMonths.length >= 2) {
    const [, latest] = sortedMonths[sortedMonths.length - 1];
    const [, prev]   = sortedMonths[sortedMonths.length - 2];
    momChange = Math.round(((latest - prev) / prev) * 100);
    momLabel  = `${momChange > 0 ? '+' : ''}${momChange}%`;
  }

  const outcomeCounts: Record<string, number> = {};
  policeCrimes.forEach(p => { const b = groupOutcome(p.outcomeStatus); outcomeCounts[b] = (outcomeCounts[b] || 0) + 1; });

  const streetData: Record<string, { count: number; cats: Record<string, number> }> = {};
  policeCrimes.forEach(p => {
    const s = p.streetName || 'Unknown';
    if (!streetData[s]) streetData[s] = { count: 0, cats: {} };
    streetData[s].count++;
    streetData[s].cats[p.category] = (streetData[s].cats[p.category] || 0) + 1;
  });
  const topStreets = Object.entries(streetData)
    .sort(([, a], [, b]) => b.count - a.count).slice(0, 10)
    .map(([street, d]) => ({ street, count: d.count, topCrime: Object.entries(d.cats).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A' }));

  const unresolvedCount = policeCrimes.filter(p => groupOutcome(p.outcomeStatus) === 'Under Investigation' || groupOutcome(p.outcomeStatus) === 'No Suspect Identified').length;
  const topCat  = sortedPoliceCats[0]?.[0] || 'N/A';
  const topCatN = sortedPoliceCats[0]?.[1] || 0;

  // ── Community processing ───────────────────────────────────────────────────
  const commCatCounts: Record<string, number> = {};
  incidents.forEach(i => { commCatCounts[i.category] = (commCatCounts[i.category] || 0) + 1; });
  const commCatLabels = Object.keys(commCatCounts).sort((a, b) => commCatCounts[b] - commCatCounts[a]);

  const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  const dailyCounts = last7.map(d => incidents.filter(i => new Date(i.reportedAt).toDateString() === d.toDateString()).length);

  const areaScores: Record<string, { score: number; count: number; h: number; m: number; l: number }> = {};
  const W = { HIGH: 3, MEDIUM: 2, LOW: 1 } as const;
  incidents.forEach(i => {
    if (!i.area) return;
    if (!areaScores[i.area]) areaScores[i.area] = { score: 0, count: 0, h: 0, m: 0, l: 0 };
    areaScores[i.area].score += W[i.severity];
    areaScores[i.area].count++;
    if (i.severity === 'HIGH') areaScores[i.area].h++;
    else if (i.severity === 'MEDIUM') areaScores[i.area].m++;
    else areaScores[i.area].l++;
  });
  const sortedAreas = Object.entries(areaScores).sort(([, a], [, b]) => b.score - a.score).slice(0, 8);
  const maxScore = sortedAreas[0]?.[1].score || 1;

  const highAlerts   = incidents.filter(i => i.severity === 'HIGH').sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()).slice(0, 8);
  const topConfirmed = [...incidents].sort((a, b) => b.upvotes - a.upvotes).slice(0, 5);
  const totalUpvotes = incidents.reduce((s, i) => s + i.upvotes, 0);

  const unresPct  = policeCrimes.length > 0 ? Math.round(unresolvedCount / policeCrimes.length * 100) : 0;
  const highPct   = stats.totalIncidents   > 0 ? Math.round(stats.highSeverityCount / stats.totalIncidents * 100) : 0;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = [
    { label: 'Police Crimes',     value: policeCrimes.length,       sub: 'Last 3 months · Police UK',        accent: NAVY  },
    { label: 'Community Reports', value: stats.totalIncidents,       sub: 'Submitted by residents',           accent: NAVY  },
    { label: 'High Priority',     value: stats.highSeverityCount,    sub: `${highPct}% of all reports`,       accent: '#dc2626' },
    { label: 'Unresolved Cases',  value: unresolvedCount,            sub: `${unresPct}% no outcome recorded`, accent: '#d97706' },
    { label: 'Month-on-Month',    value: momLabel,                   sub: momChange > 0 ? 'Crime increased' : momChange < 0 ? 'Crime decreased' : 'No change vs last month', accent: momChange > 5 ? '#dc2626' : momChange < -5 ? '#16a34a' : '#d97706' },
    { label: 'Top Crime Type',    value: topCat.split(' ').slice(0, 2).join(' '), sub: `${topCatN} recorded incidents`, accent: NAVY  },
    { label: 'Last 24 Hours',     value: stats.last24HoursCount,     sub: 'New community reports',            accent: TEAL  },
    { label: 'Upvotes',           value: totalUpvotes,               sub: 'Community confirmations',          accent: TEAL  },
  ];

  // ── Chart data ─────────────────────────────────────────────────────────────
  const polCatData = {
    labels: sortedPoliceCats.slice(0, 12).map(([c]) => c),
    datasets: [{ label: 'Crimes', data: sortedPoliceCats.slice(0, 12).map(([, n]) => n), backgroundColor: N[700], borderColor: NAVY, borderWidth: 1, borderRadius: 4 }],
  };

  const monthlyData = {
    labels: sortedMonths.map(([m]) => { const [y, mo] = m.split('-'); return new Date(+y, +mo - 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }); }),
    datasets: [{ label: 'Crimes', data: sortedMonths.map(([, n]) => n), borderColor: NAVY, backgroundColor: N[100], fill: true, pointBackgroundColor: NAVY, pointBorderColor: 'white', pointBorderWidth: 2, pointRadius: 6, tension: 0.35 }],
  };

  const outcomeLabels = Object.keys(outcomeCounts);
  const outcomeData = {
    labels: outcomeLabels,
    datasets: [{ data: outcomeLabels.map(l => outcomeCounts[l]), backgroundColor: outcomeLabels.map(l => OUTCOME_COLORS[l] || N[300]), borderColor: 'white', borderWidth: 2, hoverOffset: 5 }],
  };

  const commCatData = {
    labels: commCatLabels,
    datasets: [{ label: 'Reports', data: commCatLabels.map(c => commCatCounts[c]), backgroundColor: T[700], borderColor: TEAL, borderWidth: 1, borderRadius: 4 }],
  };

  const timelineData = {
    labels: last7.map(d => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })),
    datasets: [{ label: 'Reports', data: dailyCounts, fill: true, borderColor: TEAL, backgroundColor: T[300], pointBackgroundColor: TEAL, pointBorderColor: 'white', pointBorderWidth: 2, pointRadius: 5, tension: 0.4 }],
  };

  const scales = (horiz: boolean) => horiz
    ? { x: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } as object }, beginAtZero: true }, y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } as object } } }
    : { x: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } as object } }, y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } as object }, beginAtZero: true } };

  const chartOpts = (horiz = false) => ({ responsive: true, maintainAspectRatio: false, indexAxis: (horiz ? 'y' : 'x') as 'x' | 'y', plugins: { legend: { display: false }, tooltip: { ...tip } }, scales: scales(horiz) });

  // ── Risk helpers ───────────────────────────────────────────────────────────
  const riskOf = (score: number) => {
    const p = score / maxScore;
    return p > 0.66 ? { label: 'HIGH', color: '#dc2626', bg: '#fef2f2' } : p > 0.33 ? { label: 'MED', color: '#d97706', bg: '#fffbeb' } : { label: 'LOW', color: '#16a34a', bg: '#f0fdf4' };
  };

  // ── Insights ───────────────────────────────────────────────────────────────
  const prevM = sortedMonths.length >= 2 ? sortedMonths[sortedMonths.length - 2][0] : '';
  const lastM = sortedMonths.length     ? sortedMonths[sortedMonths.length - 1][0] : '';
  const insights = [
    { title: 'Dominant Crime Type',    body: `${topCat} is the most recorded crime in Uxbridge — ${topCatN} incidents over 3 months (${policeCrimes.length > 0 ? Math.round(topCatN / policeCrimes.length * 100) : 0}% of all Police UK data).` },
    { title: 'Case Resolution',        body: `${unresPct}% of Police-recorded crimes (${unresolvedCount} of ${policeCrimes.length}) have no confirmed outcome. Community reporting can help drive police action.` },
    { title: 'Monthly Crime Trend',    body: momLabel !== 'N/A' ? `Police crimes ${momChange >= 0 ? 'rose' : 'fell'} by ${Math.abs(momChange)}% from ${prevM} to ${lastM}. ${momChange > 10 ? 'Significant rise — heightened awareness advised.' : momChange < -10 ? 'Notable improvement in recorded levels.' : 'Broadly stable month-on-month.'}` : 'Not enough monthly data yet to calculate a trend.' },
    { title: 'Community Risk Profile', body: `${highPct}% of community reports are HIGH priority. ${sortedAreas[0] ? `"${sortedAreas[0][0]}" scores highest on the weighted risk index (${sortedAreas[0][1].h} high, ${sortedAreas[0][1].m} medium severity reports).` : 'No area data available yet.'}` },
  ];

  return (
    <div style={{ fontFamily: 'Inter', background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .ap-wrap { padding: 28px 32px; max-width: 1200px; margin: 0 auto; }
        .ap-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .ap-chart3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .ap-chart2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .ap-area-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .ap-insight-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .ap-card { background: white; border: 1px solid #e8edf4; border-radius: 16px; padding: 20px 22px; }
        .ap-label { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.07em; text-transform: uppercase; margin: 0 0 14px; }
        .ap-refresh { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 16px; font-size: 13px; color: ${NAVY}; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: Inter; transition: background 0.15s; }
        .ap-refresh:hover { background: #f1f5f9; }
        .ap-th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.06em; }
        .ap-td { padding: 10px 16px; font-size: 13px; color: #475569; border-top: 1px solid #f1f5f9; }

        @media (max-width: 900px) {
          .ap-wrap { padding: 20px 16px; }
          .ap-kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .ap-chart3 { grid-template-columns: 1fr; }
          .ap-chart2 { grid-template-columns: 1fr; }
          .ap-area-grid { grid-template-columns: repeat(2, 1fr); }
          .ap-insight-grid { grid-template-columns: 1fr; }
          .ap-hide-mobile { display: none; }
        }
        @media (max-width: 480px) {
          .ap-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .ap-area-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="ap-wrap">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: NAVY }}>Crime Intelligence</h1>
              <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, letterSpacing: '0.05em' }}>LIVE</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
              Uxbridge &amp; Hillingdon · Police UK open data + community reports
              {updatedAt && ` · ${updatedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
            </p>
          </div>
          <button className="ap-refresh" onClick={load}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Refresh
          </button>
        </div>

        {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
        <div className="ap-kpi-grid" style={{ marginBottom: 8 }}>
          {kpis.map(({ label, value, sub, accent }) => (
            <div key={label} className="ap-card" style={{ borderTop: `3px solid ${accent}`, padding: '14px 16px' }}>
              <p style={{ margin: '0 0 3px', fontSize: 22, fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</p>
              <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{label}</p>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Police Crime Intelligence ───────────────────────────────────────── */}
        <Divider label="Police Crime Intelligence" color={NAVY} />
        <div className="ap-chart3">
          <div className="ap-card">
            <p className="ap-label">Crime Type Breakdown</p>
            <div style={{ height: 260 }}><Bar data={polCatData} options={chartOpts(true)} /></div>
          </div>
          <div className="ap-card">
            <p className="ap-label">Monthly Crime Trend</p>
            <div style={{ height: 180 }}>
              <Line data={monthlyData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...tip } }, scales: scales(false) }} />
            </div>
            {momLabel !== 'N/A' && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: momChange > 5 ? '#fef2f2' : momChange < -5 ? '#f0fdf4' : '#fffbeb', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: momChange > 5 ? '#dc2626' : momChange < -5 ? '#16a34a' : '#d97706' }}>{momLabel}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>vs previous month</span>
              </div>
            )}
          </div>
          <div className="ap-card">
            <p className="ap-label">Case Outcome Status</p>
            <div style={{ height: 200 }}>
              <Doughnut data={outcomeData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#475569', font: { family: 'Inter', size: 11 } as object, padding: 8, boxWidth: 10 } }, tooltip: { ...tip } }, cutout: '60%' }} />
            </div>
          </div>
        </div>

        {/* ── Crime Hotspot Streets ───────────────────────────────────────────── */}
        <Divider label="Crime Hotspot Streets" color={NAVY} />
        <div className="ap-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th className="ap-th">#</th>
                <th className="ap-th">Location</th>
                <th className="ap-th">Crimes (3 mo)</th>
                <th className="ap-th ap-hide-mobile">Top Crime Type</th>
                <th className="ap-th">Risk</th>
              </tr>
            </thead>
            <tbody>
              {topStreets.map((s, i) => {
                const risk = i < 3 ? { label: 'HIGH', color: '#dc2626', bg: '#fef2f2' } : i < 6 ? { label: 'MED', color: '#d97706', bg: '#fffbeb' } : { label: 'LOW', color: '#16a34a', bg: '#f0fdf4' };
                return (
                  <tr key={s.street}>
                    <td className="ap-td" style={{ fontWeight: 700, color: N[300], width: 32 }}>{i + 1}</td>
                    <td className="ap-td" style={{ fontWeight: 500, color: '#0f172a' }}>{s.street}</td>
                    <td className="ap-td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: NAVY, minWidth: 24 }}>{s.count}</span>
                        <div style={{ height: 5, width: 60, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.round(s.count / topStreets[0].count * 100)}%`, background: NAVY, borderRadius: 3 }} />
                        </div>
                      </div>
                    </td>
                    <td className="ap-td ap-hide-mobile" style={{ fontSize: 12 }}>{s.topCrime}</td>
                    <td className="ap-td">
                      <span style={{ fontSize: 10, fontWeight: 700, color: risk.color, background: risk.bg, padding: '3px 8px', borderRadius: 20, letterSpacing: '0.04em' }}>{risk.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Community Reports ───────────────────────────────────────────────── */}
        <Divider label="Community Safety Reports" color={TEAL} />
        <div className="ap-chart3">
          <div className="ap-card">
            <p className="ap-label">Category Distribution</p>
            <div style={{ height: 200 }}><Bar data={commCatData} options={chartOpts(true)} /></div>
          </div>
          <div className="ap-card">
            <p className="ap-label">7-Day Activity</p>
            <div style={{ height: 200 }}>
              <Line data={timelineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...tip } }, scales: scales(false) }} />
            </div>
          </div>
          <div className="ap-card">
            <p className="ap-label">Severity Breakdown</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
              {[
                { label: 'High',   count: stats.highSeverityCount,   color: '#dc2626' },
                { label: 'Medium', count: stats.mediumSeverityCount, color: '#d97706' },
                { label: 'Low',    count: stats.lowSeverityCount,    color: '#16a34a' },
              ].map(({ label, count, color }) => {
                const pct = stats.totalIncidents > 0 ? Math.round(count / stats.totalIncidents * 100) : 0;
                return (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#475569' }}>{label} severity</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color }}>{count} <span style={{ fontWeight: 400, color: '#94a3b8' }}>({pct}%)</span></span>
                    </div>
                    <div style={{ height: 7, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 4, padding: '10px 12px', background: '#f8fafc', borderRadius: 10 }}>
                <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                  Most active area: <strong style={{ color: NAVY }}>{stats.mostActiveArea || 'N/A'}</strong><br />
                  Last 24 h: <strong style={{ color: TEAL }}>{stats.last24HoursCount} new reports</strong>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Area Risk Assessment ────────────────────────────────────────────── */}
        {sortedAreas.length > 0 && (
          <>
            <Divider label="Area Risk Assessment" color={NAVY} />
            <div className="ap-area-grid">
              {sortedAreas.map(([area, d]) => {
                const r = riskOf(d.score);
                return (
                  <div key={area} className="ap-card" style={{ padding: '14px 16px', borderLeft: `4px solid ${r.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1, marginRight: 6 }}>{area}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: r.color, background: r.bg, padding: '2px 7px', borderRadius: 20, flexShrink: 0, letterSpacing: '0.04em' }}>{r.label}</span>
                    </div>
                    <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round(d.score / maxScore * 100)}%`, background: r.color, borderRadius: 2 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>{d.h}H</span>
                      <span style={{ color: '#d97706', fontWeight: 700 }}>{d.m}M</span>
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>{d.l}L</span>
                      <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>{d.count} reports</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── High Priority Alerts ────────────────────────────────────────────── */}
        {highAlerts.length > 0 && (
          <>
            <Divider label="High Priority Alerts" color="#dc2626" />
            <div className="ap-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter' }}>
                <thead>
                  <tr style={{ background: '#fef2f2' }}>
                    <th className="ap-th">Incident</th>
                    <th className="ap-th ap-hide-mobile">Category</th>
                    <th className="ap-th">Area</th>
                    <th className="ap-th">Reported</th>
                    <th className="ap-th">Confirmed</th>
                  </tr>
                </thead>
                <tbody>
                  {highAlerts.map(inc => (
                    <tr key={inc.id}>
                      <td className="ap-td" style={{ fontWeight: 500, color: '#0f172a', maxWidth: 200 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{inc.title}</span>
                      </td>
                      <td className="ap-td ap-hide-mobile">
                        <span style={{ fontSize: 11, fontWeight: 500, color: NAVY, background: N[100], padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>{inc.category}</span>
                      </td>
                      <td className="ap-td">{inc.area}</td>
                      <td className="ap-td" style={{ color: '#94a3b8', fontSize: 12, whiteSpace: 'nowrap' }}>{timeAgo(inc.reportedAt)}</td>
                      <td className="ap-td" style={{ fontWeight: 700, color: inc.upvotes > 0 ? TEAL : '#cbd5e1', fontSize: 12 }}>{inc.upvotes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Most Confirmed ──────────────────────────────────────────────────── */}
        {topConfirmed.length > 0 && (
          <>
            <Divider label="Most Confirmed by Community" color={TEAL} />
            <div className="ap-card" style={{ padding: 0, overflow: 'hidden' }}>
              {topConfirmed.map((inc, idx) => (
                <div key={inc.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: idx < topConfirmed.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: N[300], width: 18, textAlign: 'right', flexShrink: 0 }}>{idx + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.title}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{inc.area} · {inc.category} · {timeAgo(inc.reportedAt)}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: inc.severity === 'HIGH' ? '#dc2626' : inc.severity === 'MEDIUM' ? '#d97706' : '#16a34a', background: inc.severity === 'HIGH' ? '#fef2f2' : inc.severity === 'MEDIUM' ? '#fffbeb' : '#f0fdf4', padding: '2px 7px', borderRadius: 20 }}>{inc.severity}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: TEAL, minWidth: 22, textAlign: 'right' }}>{inc.upvotes}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Key Insights ────────────────────────────────────────────────────── */}
        <Divider label="Key Insights" color={NAVY} />
        <div className="ap-insight-grid" style={{ paddingBottom: 40 }}>
          {insights.map((ins, i) => (
            <div key={ins.title} className="ap-card" style={{ borderTop: `3px solid ${i % 2 === 0 ? NAVY : TEAL}` }}>
              <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{ins.title}</p>
              <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.65 }}>{ins.body}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
