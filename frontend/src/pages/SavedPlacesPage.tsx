import { useState } from 'react';
import { Bookmark, Plus, Trash2, MapPin } from 'lucide-react';

interface Place { name: string; area: string }

const KEY = 'sp_saved_places';

function load(): Place[] {
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}

export default function SavedPlacesPage() {
  const [places, setPlaces] = useState<Place[]>(load);
  const [name, setName] = useState('');
  const [area, setArea] = useState('');

  const persist = (next: Place[]) => { setPlaces(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ } };
  const add = () => { if (!name.trim()) return; persist([...places, { name: name.trim(), area: area.trim() }]); setName(''); setArea(''); };
  const remove = (i: number) => persist(places.filter((_, idx) => idx !== i));

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ margin: '4px 0 4px', fontSize: 22, fontWeight: 700, color: '#fff' }}>Saved Places</h1>
      <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--text-2)' }}>Bookmark areas and routes you care about for quick safety checks.</p>

      {/* Add */}
      <div className="sp-card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Label</label>
            <input className="sp-input" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} placeholder="e.g. Home" style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Area</label>
            <input className="sp-input" value={area} onChange={(e) => setArea(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} placeholder="e.g. Uxbridge High Street" style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
          </div>
          <button onClick={add} className="sp-btn-red" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, height: 40 }}><Plus size={15} /> Add</button>
        </div>
      </div>

      {/* List */}
      {places.length === 0 ? (
        <div className="sp-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, margin: '0 auto 14px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bookmark size={22} style={{ color: '#ef4444' }} /></div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)' }}>No saved places yet. Add one above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {places.map((p, i) => (
            <div key={i} className="sp-card sp-card-hover" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin size={17} style={{ color: '#ef4444' }} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>{p.name}</p>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)' }}>{p.area || 'No area set'}</p>
              </div>
              <button onClick={() => remove(i)} className="sp-btn-ghost" style={{ padding: 9, display: 'flex', color: '#fca5a5' }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
