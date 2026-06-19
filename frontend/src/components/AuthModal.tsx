import { useState } from 'react';
import { X, Loader2, Mail, Lock, User as UserIcon } from 'lucide-react';
import Portal from './Portal';
import Logo from './Logo';
import { loginUser, registerUser, authErrorMessage } from '../services/api';
import { setProfile } from '../lib/profile';

interface AuthModalProps {
  initialTab?: 'login' | 'register';
  onClose: () => void;
}

const Field = ({ Icon, ...props }: { Icon: typeof Mail } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div style={{ position: 'relative' }}>
    <Icon size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
    <input className="sp-input" {...props} style={{ width: '100%', padding: '11px 13px 11px 38px', fontSize: 13.5 }} />
  </div>
);

export default function AuthModal({ initialTab = 'login', onClose }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const user = tab === 'register'
        ? await registerUser(name, email, password)
        : await loginUser(email, password);
      setProfile({ name: user.name, email: user.email });
      onClose();
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const TabBtn = ({ id, label }: { id: 'login' | 'register'; label: string }) => (
    <button onClick={() => { setTab(id); setError(''); }}
      style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        background: tab === id ? 'rgba(239,68,68,0.14)' : 'transparent', color: tab === id ? '#fca5a5' : 'var(--text-2)', transition: 'all 0.15s' }}>
      {label}
    </button>
  );

  return (
    <Portal>
      <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="sp-card" style={{ width: '100%', maxWidth: 400, padding: 0, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.7)' }}>
          {/* Header */}
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Logo size={28} />
            <button onClick={onClose} className="sp-btn-ghost" style={{ padding: 7, display: 'flex' }}><X size={16} /></button>
          </div>

          <div style={{ padding: 22 }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 6, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 12, marginBottom: 18 }}>
              <TabBtn id="login" label="Sign in" />
              <TabBtn id="register" label="Create account" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {tab === 'register' && (
                <Field Icon={UserIcon} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoComplete="name" />
              )}
              <Field Icon={Mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" autoComplete="email" />
              <Field Icon={Lock} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} placeholder="Password" autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />

              {error && (
                <p style={{ margin: 0, fontSize: 12, padding: '8px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }}>{error}</p>
              )}

              <button onClick={submit} disabled={loading} className="sp-btn-red"
                style={{ padding: 12, fontSize: 14, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
                {loading && <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />}
                {tab === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </div>

            <p style={{ margin: '16px 0 0', fontSize: 11.5, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
              {tab === 'login' ? 'New here?' : 'Already have an account?'}{' '}
              <span onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); }} style={{ color: '#fca5a5', cursor: 'pointer', fontWeight: 600 }}>
                {tab === 'login' ? 'Create an account' : 'Sign in'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </Portal>
  );
}
