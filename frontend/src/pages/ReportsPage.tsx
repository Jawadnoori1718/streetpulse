import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, MapPin, Search } from 'lucide-react';
import { fetchIncidents } from '../services/api';
import type { Incident, IncidentSeverity } from '../types';

const SEV_COLOR: Record<IncidentSeverity, string> = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' };
const FILTERS: ('ALL' | IncidentSeverity)[] = ['ALL', 'HIGH', 'MEDIUM', 'LOW'];

export default function ReportsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState<'ALL' | IncidentSeverity>('ALL');
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').toLowerCase();

  useEffect(() => {
    fetchIncidents().then(setIncidents).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const list = useMemo(() => {
    return [...incidents]
      .filter((i) => filter === 'ALL' || i.severity === filter)
      .filter((i) => !q || (`${i.title} ${i.area ?? ''} ${i.description ?? ''} ${i.category}`).toLowerCase().includes(q))
      .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
  }, [incidents, filter, q]);

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: '4px 0 4px', fontSize: 22, fontWeight: 700, color: '#fff' }}>Reports</h1>
          {q ? (
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Search size={13} /> {list.length} result{list.length === 1 ? '' : 's'} for “{q}”
              <button onClick={() => setParams({})} className="sp-chip" style={{ border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.14)', color: '#fca5a5' }}>clear</button>
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)' }}>{incidents.length} community reports · sorted by most recent</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'sp-btn-red' : 'sp-btn-ghost'} style={{ padding: '7px 13px', fontSize: 12.5, fontWeight: 600 }}>{f}</button>
          ))}
        </div>
      </div>

      {loading && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading…</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map((inc) => {
          const color = SEV_COLOR[inc.severity];
          return (
            <div key={inc.id} className="sp-card sp-card-hover" style={{ padding: 16, display: 'flex', gap: 13, alignItems: 'flex-start', borderLeft: `3px solid ${color}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: '#fff' }}>{inc.title}</p>
                  <span className="sp-chip" style={{ background: `${color}1f`, color }}>{inc.severity}</span>
                  <span className="sp-chip" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-2)' }}>{inc.category}</span>
                </div>
                {inc.description && <p style={{ margin: '0 0 7px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>{inc.description}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11.5, color: 'var(--muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{inc.area || 'West London'}</span>
                  <span>{formatDistanceToNow(new Date(inc.reportedAt), { addSuffix: true })}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: inc.upvotes > 0 ? '#22c55e' : 'var(--muted)' }}><ThumbsUp size={12} />{inc.upvotes}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
