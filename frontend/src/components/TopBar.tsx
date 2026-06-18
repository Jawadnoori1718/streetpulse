import { Search, Bell, Menu } from 'lucide-react';
import Logo from './Logo';

interface TopBarProps {
  isDesktop: boolean;
  alertCount: number;
  onMenuClick: () => void;
}

export default function TopBar({ isDesktop, alertCount, onMenuClick }: TopBarProps) {
  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 900,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: isDesktop ? '14px 22px' : '12px 14px',
        background: 'rgba(10,10,15,0.72)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {!isDesktop && (
        <>
          <button onClick={onMenuClick} className="sp-btn-ghost" style={{ padding: 9, display: 'flex' }} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <Logo size={28} withText={false} />
        </>
      )}

      {/* Search */}
      <div style={{ flex: 1, position: 'relative', maxWidth: 560 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input
          className="sp-input"
          placeholder={isDesktop ? 'Search location in West London…' : 'Search…'}
          style={{ width: '100%', padding: '10px 14px 10px 40px', fontSize: 13.5 }}
        />
      </div>

      <div style={{ flex: isDesktop ? undefined : 1 }} />

      {/* Live */}
      {isDesktop && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 999, background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>Live</span>
        </div>
      )}

      {/* Notifications */}
      <button className="sp-btn-ghost" style={{ position: 'relative', padding: 9, display: 'flex' }} aria-label="Alerts">
        <Bell size={18} />
        {alertCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, minWidth: 17, height: 17, padding: '0 4px',
            borderRadius: 999, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', color: '#fff',
            fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 2px var(--bg)',
          }}>
            {alertCount > 9 ? '9+' : alertCount}
          </span>
        )}
      </button>

      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: 11, flexShrink: 0,
        background: 'linear-gradient(135deg,#3b3b4a,#1b1b25)',
        border: '1px solid var(--border-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: '#fff',
        fontFamily: "'Space Grotesk', sans-serif",
      }}>
        JN
      </div>
    </header>
  );
}
