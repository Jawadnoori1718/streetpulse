interface LogoProps {
  size?: number;
  withText?: boolean;
}

/** StreetPulse mark: a shield with a heartbeat pulse line, in crimson. */
export default function Logo({ size = 34, withText = true }: LogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 11,
          background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(239,68,68,0.45)',
          flexShrink: 0,
        }}
      >
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
          {/* Shield */}
          <path
            d="M12 2.5 20 5.2v6.1c0 4.9-3.4 8.8-8 10.2-4.6-1.4-8-5.3-8-10.2V5.2L12 2.5Z"
            fill="rgba(255,255,255,0.16)"
            stroke="#ffffff"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          {/* Heartbeat pulse */}
          <path
            d="M5.5 12.5h3l1.6-3.2 2.2 5 1.5-2.6h4.2"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {withText && (
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: size * 0.55,
            color: '#fff',
            letterSpacing: '-0.02em',
          }}
        >
          StreetPulse
        </span>
      )}
    </div>
  );
}
