const features = [
  {
    title: 'Community-powered reporting',
    detail: 'Residents flag lighting failures, hazards, vandalism, anti-social behaviour, and more directly on the map in seconds.',
  },
  {
    title: 'Live Police UK open data',
    detail: 'Verified crime records for the Uxbridge area pulled from the official Police UK API — no API key required, published under the Open Government Licence.',
  },
  {
    title: 'Gemini AI analysis',
    detail: 'Ask about any route or street in Uxbridge. Google Gemini synthesises both community reports and police data into a plain-language safety summary.',
  },
];

const tech = ['React 18', 'Spring Boot', 'Google Maps', 'Gemini AI', 'Police UK API', 'Chart.js', 'H2 Database'];

export default function AboutPage() {
  return (
    <div style={{
      height: 'calc(100vh - 64px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter', padding: '24px',
      background: '#f8fafc',
    }}>
      <div style={{ width: '100%', maxWidth: '640px' }}>

        {/* Header card */}
        <div style={{
          background: '#1e3a5f', borderRadius: '20px',
          padding: '28px 32px', marginBottom: '12px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: '-20px', left: '60%', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', fontWeight: 500 }}>
              UXBRIDGE · WEST LONDON · UB8
            </span>
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'white', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
            StreetPulse
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.65, maxWidth: '400px' }}>
            Community-powered urban safety for Uxbridge. Real incident reports layered with official Police UK data and AI-driven route analysis.
          </p>
        </div>

        {/* Feature rows */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '12px' }}>
          {features.map(({ title, detail }, idx) => (
            <div key={title} style={{
              display: 'flex', gap: '16px', padding: '16px 20px',
              borderBottom: idx < features.length - 1 ? '1px solid #f1f5f9' : 'none',
            }}>
              <div style={{
                width: '3px', borderRadius: '99px',
                background: '#1e3a5f', flexShrink: 0, alignSelf: 'stretch',
                opacity: 1 - idx * 0.2,
              }} />
              <div>
                <p style={{ fontWeight: 600, fontSize: '13px', color: '#1e3a5f', margin: '0 0 3px' }}>{title}</p>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>{detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom row: tech + privacy */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          {/* Tech pills */}
          <div style={{ flex: 1, background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '14px 16px' }}>
            <p style={{ fontSize: '10px', color: '#94a3b8', margin: '0 0 9px', letterSpacing: '0.08em', fontWeight: 600 }}>BUILT WITH</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {tech.map((t) => (
                <span key={t} style={{ padding: '3px 10px', borderRadius: '99px', background: 'rgba(30,58,95,0.07)', color: '#1e3a5f', fontSize: '11px', fontWeight: 500 }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Privacy note */}
          <div style={{ flex: 1, background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '14px 16px' }}>
            <p style={{ fontSize: '10px', color: '#94a3b8', margin: '0 0 9px', letterSpacing: '0.08em', fontWeight: 600 }}>PRIVACY</p>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: 1.65 }}>
              No account required. Location stored to street level only. Email is optional and never returned via the public API. Police data is published under the Open Government Licence v3.0.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
