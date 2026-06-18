import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, AlertTriangle, Shield, CheckCircle2, Settings, LogOut, LogIn, X } from 'lucide-react';
import Logo from './Logo';
import { useProfile, setProfile, initials } from '../lib/profile';
import type { Alert } from '../types';

interface TopBarProps {
  isDesktop: boolean;
  alerts: Alert[];
  onMenuClick: () => void;
}

function Backdrop({ onClick }: { onClick: () => void }) {
  return <div onClick={onClick} style={{ position: 'fixed', inset: 0, zIndex: 1500 }} />;
}

export default function TopBar({ isDesktop, alerts, onMenuClick }: TopBarProps) {
  const navigate = useNavigate();
  const profile = useProfile();
  const [query, setQuery] = useState('');
  const [openNotif, setOpenNotif] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [signIn, setSignIn] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });

  const alertCount = alerts.filter((a) => a.level === 'HIGH').length;

  const submitSearch = () => {
    const q = query.trim();
    navigate(q ? `/reports?q=${encodeURIComponent(q)}` : '/reports');
  };

  const doSignIn = () => {
    if (!form.name.trim()) return;
    setProfile({ name: form.name.trim(), email: form.email.trim() });
    setSignIn(false); setOpenProfile(false); setForm({ name: '', email: '' });
  };

  return (
    <header style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      padding: isDesktop ? '14px 22px' : '12px 14px',
      background: 'rgba(10,10,15,0.72)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)' }}>

      {!isDesktop && (
        <>
          <button onClick={onMenuClick} className="sp-btn-ghost" style={{ padding: 9, display: 'flex' }} aria-label="Open menu"><Menu size={18} /></button>
          <Logo size={28} withText={false} />
        </>
      )}

      {/* Search */}
      <div style={{ flex: 1, position: 'relative', maxWidth: 560 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input className="sp-input" value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }}
          placeholder={isDesktop ? 'Search reports & locations…' : 'Search…'}
          style={{ width: '100%', padding: '10px 14px 10px 40px', fontSize: 13.5 }} />
      </div>

      <div style={{ flex: isDesktop ? undefined : 1 }} />

      {isDesktop && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 999, background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>Live</span>
        </div>
      )}

      {/* Notifications */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => { setOpenNotif((v) => !v); setOpenProfile(false); }} className="sp-btn-ghost" style={{ position: 'relative', padding: 9, display: 'flex' }} aria-label="Alerts">
          <Bell size={18} />
          {alertCount > 0 && (
            <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 17, height: 17, padding: '0 4px', borderRadius: 999, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px var(--bg)' }}>{alertCount > 9 ? '9+' : alertCount}</span>
          )}
        </button>
        {openNotif && (
          <>
            <Backdrop onClick={() => setOpenNotif(false)} />
            <div className="sp-card" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 320, zIndex: 1600, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#fff' }}>Notifications</span>
                <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{alertCount} active</span>
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {alerts.length === 0 && <p style={{ padding: 16, fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>No notifications.</p>}
                {alerts.map((a, i) => {
                  const high = a.level === 'HIGH';
                  const Icon = high ? AlertTriangle : a.title === 'All clear' ? CheckCircle2 : Shield;
                  const color = high ? '#ef4444' : a.title === 'All clear' ? '#22c55e' : '#f59e0b';
                  return (
                    <div key={i} style={{ padding: '11px 14px', display: 'flex', gap: 10, borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: `${color}1f`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={14} style={{ color }} /></div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</p>
                        <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-2)' }}>{a.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => { setOpenNotif(false); navigate('/alerts'); }} className="sp-btn-ghost" style={{ width: '100%', borderRadius: 0, border: 'none', borderTop: '1px solid var(--border)', padding: 11, fontSize: 12.5, color: '#ef4444' }}>View all alerts</button>
            </div>
          </>
        )}
      </div>

      {/* Profile */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => { setOpenProfile((v) => !v); setOpenNotif(false); }} style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, cursor: 'pointer',
          background: profile ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : 'linear-gradient(135deg,#3b3b4a,#1b1b25)',
          border: '1px solid var(--border-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>
          {profile ? initials(profile.name) : 'JN'}
        </button>
        {openProfile && (
          <>
            <Backdrop onClick={() => setOpenProfile(false)} />
            <div className="sp-card" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 240, zIndex: 1600, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: '#fff' }}>{profile ? profile.name : 'Guest'}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--muted)' }}>{profile ? (profile.email || 'Signed in') : 'Not signed in'}</p>
              </div>
              <div style={{ padding: 6 }}>
                <button onClick={() => { setOpenProfile(false); navigate('/settings'); }} className="sp-btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', fontSize: 13 }}><Settings size={15} /> Settings</button>
                {profile ? (
                  <button onClick={() => { setProfile(null); setOpenProfile(false); }} className="sp-btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', fontSize: 13, color: '#fca5a5' }}><LogOut size={15} /> Sign out</button>
                ) : (
                  <button onClick={() => { setSignIn(true); setOpenProfile(false); }} className="sp-btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', fontSize: 13, color: '#22c55e' }}><LogIn size={15} /> Sign in</button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sign-in modal */}
      {signIn && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setSignIn(false); }} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="sp-card" style={{ width: '100%', maxWidth: 380, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Logo size={26} withText={false} /><span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Sign in</span></div>
              <button onClick={() => setSignIn(false)} className="sp-btn-ghost" style={{ padding: 7, display: 'flex' }}><X size={15} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>Sign in to personalise your alerts and save places. Your details stay on this device.</p>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Name *</label>
                <input className="sp-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') doSignIn(); }} placeholder="Your name" style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Email <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
                <input className="sp-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') doSignIn(); }} placeholder="you@email.com" style={{ width: '100%', padding: '10px 12px', fontSize: 13 }} />
              </div>
              <button onClick={doSignIn} className="sp-btn-red" style={{ padding: 12, fontSize: 14, marginTop: 4 }}>Sign in</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
