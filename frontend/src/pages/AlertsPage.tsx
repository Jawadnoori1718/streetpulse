import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';
import { fetchAlerts } from '../services/api';
import type { Alert } from '../types';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts().then(setAlerts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 16, maxWidth: 760, margin: '0 auto' }}>
      <h1 style={{ margin: '4px 0 4px', fontSize: 22, fontWeight: 700, color: '#fff' }}>Alerts</h1>
      <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--text-2)' }}>Recent high-priority activity across West London.</p>

      {loading && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading…</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alerts.map((a, i) => {
          const high = a.level === 'HIGH';
          const Icon = high ? AlertTriangle : a.title === 'All clear' ? CheckCircle2 : Shield;
          const color = high ? '#ef4444' : a.title === 'All clear' ? '#22c55e' : '#f59e0b';
          return (
            <div key={i} className="sp-card sp-card-hover" style={{ padding: 16, display: 'flex', gap: 13, alignItems: 'flex-start' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: `${color}1f`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>{a.title}</p>
                  <span className="sp-chip" style={{ background: `${color}1f`, color }}>{a.level}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>{a.message}</p>
                {a.reportedAt && <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--muted)' }}>{formatDistanceToNow(new Date(a.reportedAt), { addSuffix: true })}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
