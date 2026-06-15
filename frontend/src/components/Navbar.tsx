import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Map, BarChart3, Info, Menu, X } from 'lucide-react';

const navItems = [
  { to: '/',          label: 'Live Map',  Icon: Map       },
  { to: '/analytics', label: 'Analytics', Icon: BarChart3 },
  { to: '/about',     label: 'About',     Icon: Info      },
];

/** Animated map-pin logo rendered inline so CSS animations work */
function AnimatedLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 56 64"
      width="38"
      height="38"
      aria-hidden="true"
      style={{ overflow: 'visible', flexShrink: 0 }}
    >
      <defs>
        <filter id="pin-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#0d9488" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Rotating dashed outer ring — clearly visible animation */}
      <circle cx="28" cy="24" r="25" fill="none" stroke="#0d9488" strokeWidth="2" strokeDasharray="7 4" opacity="0.85">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 28 24"
          to="360 28 24"
          dur="3.5s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Pulsing solid inner ring */}
      <circle cx="28" cy="24" r="18" fill="none" stroke="#0d9488" strokeWidth="1.5" opacity="0.5">
        <animate attributeName="r"       values="18;22;18" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0.05;0.5" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Pin body — white so it pops on navy */}
      <path
        d="M28 4 C17 4 10 13 10 22 C10 34.5 28 56 28 56 C28 56 46 34.5 46 22 C46 13 39 4 28 4 Z"
        fill="white"
        filter="url(#pin-glow)"
      />

      {/* Teal inner circle */}
      <circle cx="28" cy="22" r="8.5" fill="#0d9488" />

      {/* White centre dot */}
      <circle cx="28" cy="22" r="3.2" fill="white" />
    </svg>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: '#1e3a5f',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.22)',
        height: '64px',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">

        {/* Logo + wordmark */}
        <NavLink to="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
          <AnimatedLogo />
          <span style={{
            fontFamily: 'Inter', fontWeight: 700, fontSize: '18px',
            letterSpacing: '-0.3px', color: 'white',
          }}>
            Street<span style={{ color: '#0d9488' }}>Pulse</span>
          </span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '8px',
                fontSize: '14px', fontWeight: 500, fontFamily: 'Inter',
                color: isActive ? 'white' : 'rgba(255,255,255,0.62)',
                background: isActive ? 'rgba(255,255,255,0.13)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              })}
              onMouseOver={(e) => {
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
              }}
              onMouseOut={(e) => {
                const active = e.currentTarget.getAttribute('aria-current') === 'page';
                e.currentTarget.style.color = active ? 'white' : 'rgba(255,255,255,0.62)';
                e.currentTarget.style.background = active ? 'rgba(255,255,255,0.13)' : 'transparent';
              }}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* LIVE badge */}
        <div className="hidden sm:flex items-center gap-2" style={{ fontSize: '12px', fontWeight: 700, color: '#4ade80', letterSpacing: '0.06em' }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: '#4ade80', display: 'inline-block',
            animation: 'pulse-anim 2s ease-in-out infinite',
          }} />
          LIVE
        </div>

        {/* Mobile menu toggle */}
        <button
          className="sm:hidden p-2 rounded-lg"
          style={{ color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="sm:hidden px-4 pb-4 flex flex-col gap-1"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#1e3a5f' }}
        >
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '10px',
                fontSize: '14px', fontWeight: 500, fontFamily: 'Inter',
                color: isActive ? 'white' : 'rgba(255,255,255,0.62)',
                background: isActive ? 'rgba(255,255,255,0.13)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
