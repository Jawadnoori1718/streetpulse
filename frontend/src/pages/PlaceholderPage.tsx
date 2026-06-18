import { Construction } from 'lucide-react';

export default function PlaceholderPage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ minHeight: 'calc(100dvh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="sp-card" style={{ padding: '40px 36px', textAlign: 'center', maxWidth: 420 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 18px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Construction size={26} style={{ color: '#ef4444' }} />
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#fff' }}>{title}</h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{subtitle}</p>
      </div>
    </div>
  );
}
