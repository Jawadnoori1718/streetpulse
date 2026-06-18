import { useState } from 'react';
import {
  X, Send, MapPin, Loader2, CheckCircle,
  Lightbulb, AlertTriangle, Eye, Hammer,
  Users, Car, Volume2, Pill, Truck, ShoppingBag,
} from 'lucide-react';
import type { NewIncident, IncidentCategory, IncidentSeverity } from '../types';
import { createIncident } from '../services/api';

interface ReportFormProps {
  initialLat?: number;
  initialLng?: number;
  onClose: () => void;
  onSuccess: () => void;
}

const categories: { value: IncidentCategory; label: string; Icon: typeof Lightbulb }[] = [
  { value: 'LIGHTING',   label: 'Poor Lighting',       Icon: Lightbulb     },
  { value: 'HAZARD',     label: 'Physical Hazard',      Icon: AlertTriangle },
  { value: 'SUSPICIOUS', label: 'Suspicious',           Icon: Eye           },
  { value: 'VANDALISM',  label: 'Vandalism',            Icon: Hammer        },
  { value: 'ANTISOCIAL', label: 'Anti-social',          Icon: Users         },
  { value: 'PARKING',    label: 'Bad Parking',          Icon: Car           },
  { value: 'NOISE',      label: 'Noise',                Icon: Volume2       },
  { value: 'DRUG',       label: 'Drugs',                Icon: Pill          },
  { value: 'VEHICLE',    label: 'Vehicle Crime',        Icon: Truck         },
  { value: 'THEFT',      label: 'Theft',                Icon: ShoppingBag   },
];

const severities: { value: IncidentSeverity; label: string; desc: string; colour: string }[] = [
  { value: 'LOW',    label: 'Low',    desc: 'Minor concern',    colour: '#22c55e' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Significant',      colour: '#f59e0b' },
  { value: 'HIGH',   label: 'High',   desc: 'Immediate danger', colour: '#ef4444' },
];

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 };

export default function ReportForm({ initialLat, initialLng, onClose, onSuccess }: ReportFormProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<NewIncident>({
    title: '', description: '', category: 'LIGHTING', severity: 'MEDIUM',
    latitude: initialLat ?? 51.5441, longitude: initialLng ?? -0.4779, area: '', reporterEmail: '',
  });
  const [gdprConsent, setGdprConsent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Please add a short title.'); return; }
    if (form.reporterEmail && !gdprConsent) { setError('Please tick consent to include your email.'); return; }
    setError(''); setLoading(true);
    try {
      const payload: NewIncident = { ...form };
      if (!payload.reporterEmail) delete payload.reporterEmail;
      await createIncident(payload);
      setStep('success');
      setTimeout(() => { onSuccess(); onClose(); }, 1800);
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sp-card" style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: '#fff', margin: 0 }}>Report an Incident</h3>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 0' }}>Uxbridge community safety report</p>
        </div>
        <button onClick={onClose} className="sp-btn-ghost" style={{ padding: 7, display: 'flex' }}><X size={15} /></button>
      </div>

      {step === 'success' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={28} style={{ color: '#22c55e' }} />
          </div>
          <p style={{ fontWeight: 600, color: '#fff', fontSize: 16, margin: 0 }}>Report Submitted</p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Thank you for helping keep the community safe.</p>
        </div>
      ) : (
        <div className="sp-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {initialLat && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '8px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <MapPin size={12} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-2)' }}>Location pinned: {initialLat.toFixed(4)}, {initialLng?.toFixed(4)}</span>
            </div>
          )}

          <div>
            <label style={labelStyle}>Title *</label>
            <input className="sp-input" type="text" placeholder="e.g. Broken street light near bus stop" value={form.title} maxLength={120}
              onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ padding: '9px 12px', fontSize: 13 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Area / Landmark</label>
              <input className="sp-input" type="text" placeholder="Uxbridge High Street" value={form.area} maxLength={80}
                onChange={(e) => setForm({ ...form, area: e.target.value })} style={{ padding: '9px 12px', fontSize: 13 }} />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input className="sp-input" type="text" placeholder="Brief detail…" value={form.description} maxLength={300}
                onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ padding: '9px 12px', fontSize: 13 }} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {categories.map(({ value, label, Icon }) => {
                const active = form.category === value;
                return (
                  <button key={value} onClick={() => setForm({ ...form, category: value })}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                      background: active ? 'rgba(239,68,68,0.14)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`, color: active ? '#fca5a5' : 'var(--text-2)', transition: 'all 0.15s' }}>
                    <Icon size={13} />
                    <span style={{ fontSize: 9.5, fontWeight: active ? 600 : 400, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Severity</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {severities.map(({ value, label, desc, colour }) => {
                const active = form.severity === value;
                return (
                  <button key={value} onClick={() => setForm({ ...form, severity: value })}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                      background: active ? `${colour}1a` : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? colour + '60' : 'var(--border)'}`, transition: 'all 0.15s' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: colour }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: active ? colour : 'var(--text-2)' }}>{label}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>{desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional — follow-up only)</span></label>
            <input className="sp-input" type="email" placeholder="your@email.com" value={form.reporterEmail ?? ''} maxLength={254}
              onChange={(e) => setForm({ ...form, reporterEmail: e.target.value })} style={{ padding: '9px 12px', fontSize: 13 }} />
          </div>

          {form.reporterEmail && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, color: 'var(--text-2)', cursor: 'pointer', lineHeight: 1.5 }}>
              <input type="checkbox" checked={gdprConsent} onChange={(e) => setGdprConsent(e.target.checked)} style={{ marginTop: 2, accentColor: '#ef4444', flexShrink: 0 }} />
              I consent to my email being stored solely for follow-up on this report, under UK GDPR.
            </label>
          )}

          {error && <p style={{ fontSize: 12, padding: '8px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)', margin: 0 }}>{error}</p>}

          <button onClick={handleSubmit} disabled={loading} className="sp-btn-red"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 12, fontSize: 14, opacity: loading ? 0.6 : 1 }}>
            {loading ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={15} />}
            {loading ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      )}
    </div>
  );
}
