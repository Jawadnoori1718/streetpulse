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
  { value: 'SUSPICIOUS', label: 'Suspicious Activity',  Icon: Eye           },
  { value: 'VANDALISM',  label: 'Vandalism',            Icon: Hammer        },
  { value: 'ANTISOCIAL', label: 'Anti-social',          Icon: Users         },
  { value: 'PARKING',    label: 'Dangerous Parking',    Icon: Car           },
  { value: 'NOISE',      label: 'Noise Nuisance',       Icon: Volume2       },
  { value: 'DRUG',       label: 'Drug Activity',        Icon: Pill          },
  { value: 'VEHICLE',    label: 'Vehicle Crime',        Icon: Truck         },
  { value: 'THEFT',      label: 'Theft / Robbery',      Icon: ShoppingBag   },
];

const severities: { value: IncidentSeverity; label: string; desc: string; colour: string }[] = [
  { value: 'LOW',    label: 'Low',    desc: 'Minor concern',    colour: '#16a34a' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Significant',      colour: '#ea580c' },
  { value: 'HIGH',   label: 'High',   desc: 'Immediate danger', colour: '#dc2626' },
];

const inputStyle: React.CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  color: '#0f172a',
  fontFamily: 'Inter',
  borderRadius: '8px',
  padding: '9px 12px',
  fontSize: '13px',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
};

export default function ReportForm({ initialLat, initialLng, onClose, onSuccess }: ReportFormProps) {
  const [step, setStep]     = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [form, setForm]     = useState<NewIncident>({
    title: '',
    description: '',
    category: 'LIGHTING',
    severity: 'MEDIUM',
    latitude:  initialLat  ?? 51.5441,
    longitude: initialLng ?? -0.4779,
    area: '',
    reporterEmail: '',
  });
  const [gdprConsent, setGdprConsent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Please add a short title.'); return; }
    if (form.reporterEmail && !gdprConsent) { setError('Please tick consent to include your email.'); return; }
    setError('');
    setLoading(true);
    try {
      const payload: NewIncident = { ...form };
      if (!payload.reporterEmail) delete payload.reporterEmail;
      await createIncident(payload);
      setStep('success');
      setTimeout(() => { onSuccess(); onClose(); }, 2000);
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'white', borderRadius: '16px', overflow: 'hidden',
      height: '100%', display: 'flex', flexDirection: 'column',
      boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
    }}>

      {/* Header */}
      <div style={{
        background: '#1e3a5f', padding: '18px 22px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h3 style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '15px', color: 'white', margin: 0 }}>
            Report an Incident
          </h3>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', margin: '3px 0 0' }}>
            Uxbridge community safety report
          </p>
        </div>
        <button
          onClick={onClose}
          style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', borderRadius: '8px', padding: '6px', display: 'flex', alignItems: 'center' }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
        >
          <X size={15} />
        </button>
      </div>

      {step === 'success' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '32px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={28} style={{ color: '#16a34a' }} />
          </div>
          <p style={{ fontFamily: 'Inter', fontWeight: 600, color: '#1e3a5f', fontSize: '16px', margin: 0 }}>Report Submitted</p>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Thank you for helping keep the community safe.</p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Location pin */}
          {initialLat && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)' }}>
              <MapPin size={12} style={{ color: '#0d9488', flexShrink: 0 }} />
              <span style={{ color: '#475569' }}>Location pinned: {initialLat.toFixed(4)}, {initialLng?.toFixed(4)}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>Title *</label>
            <input
              type="text"
              placeholder="e.g. Broken street light near bus stop"
              value={form.title}
              maxLength={120}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#0d9488')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          {/* Two-column row: Area + Description */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>Area / Landmark</label>
              <input
                type="text"
                placeholder="e.g. Uxbridge High Street"
                value={form.area}
                maxLength={80}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#0d9488')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>Description</label>
              <input
                type="text"
                placeholder="Brief additional detail..."
                value={form.description}
                maxLength={300}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#0d9488')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
          </div>

          {/* Category — 5-column compact grid */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '7px' }}>Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {categories.map(({ value, label, Icon }) => {
                const active = form.category === value;
                return (
                  <button
                    key={value}
                    onClick={() => setForm({ ...form, category: value })}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                      padding: '8px 4px', borderRadius: '10px', cursor: 'pointer',
                      background: active ? 'rgba(30,58,95,0.08)' : '#f8fafc',
                      border: `1px solid ${active ? '#1e3a5f' : '#e2e8f0'}`,
                      color: active ? '#1e3a5f' : '#64748b',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={13} style={{ color: active ? '#1e3a5f' : '#94a3b8' }} />
                    <span style={{ fontSize: '9.5px', fontWeight: active ? 600 : 400, textAlign: 'center', fontFamily: 'Inter', lineHeight: 1.2 }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity — 3 columns */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '7px' }}>Severity</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {severities.map(({ value, label, desc, colour }) => {
                const active = form.severity === value;
                return (
                  <button
                    key={value}
                    onClick={() => setForm({ ...form, severity: value })}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                      padding: '10px 8px', borderRadius: '10px', cursor: 'pointer',
                      background: active ? `${colour}10` : '#f8fafc',
                      border: `1px solid ${active ? colour + '50' : '#e2e8f0'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colour }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: active ? colour : '#475569', fontFamily: 'Inter' }}>{label}</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'Inter' }}>{desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
              Email <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional — for follow-up only)</span>
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={form.reporterEmail ?? ''}
              maxLength={254}
              onChange={(e) => setForm({ ...form, reporterEmail: e.target.value })}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#0d9488')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          {/* GDPR (only when email filled) */}
          {form.reporterEmail && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: '#64748b', cursor: 'pointer', lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={gdprConsent}
                onChange={(e) => setGdprConsent(e.target.checked)}
                style={{ marginTop: '2px', accentColor: '#0d9488', flexShrink: 0 }}
              />
              I consent to my email being stored solely for follow-up on this report, processed under UK GDPR.
            </label>
          )}

          {error && (
            <p style={{ fontSize: '12px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(220,38,38,0.06)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.15)', margin: 0 }}>
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%', padding: '12px', borderRadius: '10px',
              background: loading ? '#e2e8f0' : '#1e3a5f',
              color: loading ? '#94a3b8' : 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter', fontWeight: 600, fontSize: '14px', border: 'none',
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={15} />}
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      )}
    </div>
  );
}
