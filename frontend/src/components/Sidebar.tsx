import { NavLink } from 'react-router-dom';
import { Home, Map, FileText, BarChart3, Sparkles, Bell, Bookmark, Settings, X } from 'lucide-react';
import Logo from './Logo';

const NAV = [
  { to: '/',          label: 'Overview',     Icon: Home },
  { to: '/map',       label: 'Live Map',     Icon: Map },
  { to: '/reports',   label: 'Reports',      Icon: FileText },
  { to: '/analytics', label: 'Analytics',    Icon: BarChart3 },
  { to: '/ai',        label: 'AI Assistant', Icon: Sparkles },
  { to: '/alerts',    label: 'Alerts',       Icon: Bell },
  { to: '/saved',     label: 'Saved Places', Icon: Bookmark },
  { to: '/settings',  label: 'Settings',     Icon: Settings },
];

function ScoreBand(score: number) {
  if (score >= 75) return { label: 'Good', color: '#22c55e' };
  if (score >= 50) return { label: 'Moderate', color: '#f59e0b' };
  return { label: 'Caution', color: '#ef4444' };
}

function SafetyGauge({ score }: { score: number }) {
  const band = ScoreBand(score);
  const r = 46;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(100, score)) / 100);
  return (
    <div className="sp-card" style={{ padding: '16px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Safety Score</span>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>›</span>
      </div>
      <div style={{ position: 'relative', width: 116, height: 116, margin: '0 auto' }}>
        <svg width="116" height="116" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="58" cy="58" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
          <circle
            cx="58" cy="58" r={r} fill="none" stroke={band.color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease', filter: `drop-shadow(0 0 6px ${band.color}80)` }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>/100</span>
        </div>
      </div>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: band.color }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: band.color }}>{band.label}</span>
      </div>
    </div>
  );
}

interface SidebarProps {
  isDesktop: boolean;
  open: boolean;
  onClose: () => void;
  safetyScore: number;
}

export default function Sidebar({ isDesktop, open, onClose, safetyScore }: SidebarProps) {
  const sidebar = (
    <aside
      style={{
        width: 248,
        flexShrink: 0,
        background: 'var(--sidebar)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: isDesktop ? '100dvh' : '100dvh',
        position: isDesktop ? 'sticky' : 'fixed',
        top: 0, left: 0,
        zIndex: 1200,
        transform: isDesktop ? 'none' : open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
      }}
    >
      {/* Brand */}
      <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo size={32} />
        {!isDesktop && (
          <button onClick={onClose} className="sp-btn-ghost" style={{ padding: 7, display: 'flex' }} aria-label="Close menu">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={!isDesktop ? onClose : undefined}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 13px', borderRadius: 12, fontSize: 14, fontWeight: 500,
              textDecoration: 'none',
              color: isActive ? '#fff' : 'var(--text-2)',
              background: isActive ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'transparent',
              boxShadow: isActive ? '0 8px 22px rgba(239,68,68,0.30)' : 'none',
              transition: 'background 0.15s, color 0.15s',
            })}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Safety score */}
      <div style={{ padding: 12 }}>
        <SafetyGauge score={safetyScore} />
      </div>
    </aside>
  );

  if (isDesktop) return sidebar;

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', zIndex: 1100 }}
        />
      )}
      {sidebar}
    </>
  );
}
