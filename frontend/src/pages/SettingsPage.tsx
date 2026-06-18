import { useEffect, useState } from 'react';
import { User, Bell, Shield, Save, Check } from 'lucide-react';
import { useProfile, setProfile } from '../lib/profile';

interface Prefs {
  highAlertsOnly: boolean;
  policeByDefault: boolean;
  homeArea: string;
}

const PREFS_KEY = 'sp_prefs';
const defaultPrefs: Prefs = { highAlertsOnly: true, policeByDefault: false, homeArea: '' };

function loadPrefs(): Prefs {
  try { const r = localStorage.getItem(PREFS_KEY); return r ? { ...defaultPrefs, ...JSON.parse(r) } : defaultPrefs; }
  catch { return defaultPrefs; }
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: 42, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.18s', background: on ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : 'rgba(255,255,255,0.12)' }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.18s' }} />
    </button>
  );
}

function Row({ Icon, title, desc, children }: { Icon: typeof Bell; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={17} style={{ color: '#ef4444' }} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: '#fff' }}>{title}</p>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)' }}>{desc}</p>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const profile = useProfile();
  const [name, setName] = useState(profile?.name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setName(profile?.name ?? ''); setEmail(profile?.email ?? ''); }, [profile]);

  const persistPrefs = (p: Prefs) => { setPrefs(p); try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* ignore */ } };

  const saveProfile = () => {
    if (name.trim()) setProfile({ name: name.trim(), email: email.trim() });
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ margin: '4px 0 4px', fontSize: 22, fontWeight: 700, color: '#fff' }}>Settings</h1>
      <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--text-2)' }}>Personalise your profile and alert preferences. Saved on this device.</p>

      {/* Profile */}
      <div className="sp-card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <User size={17} style={{ color: '#ef4444' }} />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff' }}>Profile</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Name</label>
            <input className="sp-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Email</label>
            <input className="sp-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
          </div>
        </div>
        <button onClick={saveProfile} className={saved ? 'sp-btn-ghost' : 'sp-btn-red'} style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: saved ? '#22c55e' : undefined }}>
          {saved ? <Check size={15} /> : <Save size={15} />}{saved ? 'Saved' : 'Save profile'}
        </button>
      </div>

      {/* Preferences */}
      <div className="sp-card" style={{ padding: '6px 20px 16px' }}>
        <Row Icon={Bell} title="High-severity alerts only" desc="Only notify me about HIGH priority activity">
          <Toggle on={prefs.highAlertsOnly} onClick={() => persistPrefs({ ...prefs, highAlertsOnly: !prefs.highAlertsOnly })} />
        </Row>
        <Row Icon={Shield} title="Show police data by default" desc="Overlay Police UK crimes on the live map">
          <Toggle on={prefs.policeByDefault} onClick={() => persistPrefs({ ...prefs, policeByDefault: !prefs.policeByDefault })} />
        </Row>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0', borderTop: '1px solid var(--border)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={17} style={{ color: '#ef4444' }} /></div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 6px', fontSize: 13.5, fontWeight: 600, color: '#fff' }}>Home area</p>
            <input className="sp-input" value={prefs.homeArea} onChange={(e) => persistPrefs({ ...prefs, homeArea: e.target.value })} placeholder="e.g. Uxbridge High Street" style={{ width: '100%', padding: '9px 12px', fontSize: 13 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
