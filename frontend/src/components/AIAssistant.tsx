import { useState } from 'react';
import { Send, Loader2, RotateCcw, X, AlertCircle, Sparkles } from 'lucide-react';
import { chatWithAgent } from '../services/api';

const PROMPTS = [
  'Is my route safe right now?',
  'What are the risks near me?',
  'Show incidents near Uxbridge station',
];

export default function AIAssistant() {
  const [prompt, setPrompt]     = useState('');
  const [response, setResponse] = useState('');
  const [mode, setMode]         = useState<'agent' | 'fallback' | ''>('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [asked, setAsked]       = useState('');

  const analyse = async (q: string) => {
    const text = q.trim();
    if (!text || loading) return;
    setAsked(text); setPrompt(''); setLoading(true); setResponse(''); setMode(''); setError('');
    try {
      const { reply, mode } = await chatWithAgent(text);
      setResponse(reply); setMode(mode);
    } catch {
      setError('The AI assistant is unavailable. Check the backend is running on port 8080.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setPrompt(''); setResponse(''); setMode(''); setError(''); setAsked(''); };
  const hasResult = response || error;

  return (
    <div className="sp-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.4)' }}>
            <Sparkles size={15} color="#fff" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>AI Safety Assistant</p>
            <p style={{ margin: 0, fontSize: 10.5, color: 'var(--muted)' }}>Grounded in live data</p>
          </div>
        </div>
        {hasResult && (
          <button onClick={reset} className="sp-btn-ghost" style={{ padding: 7, display: 'flex' }} title="New question"><RotateCcw size={13} /></button>
        )}
      </div>

      {/* Body */}
      <div className="sp-scroll" style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 12, display: 'flex', gap: 9 }}>
            <AlertCircle size={15} style={{ color: '#fca5a5', flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 11.5, color: '#fca5a5', lineHeight: 1.5 }}>{error}</p>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}><X size={13} /></button>
          </div>
        )}

        {asked && (
          <div style={{ alignSelf: 'flex-end', maxWidth: '88%', background: 'linear-gradient(135deg,#ef4444,#b91c1c)', borderRadius: '12px 12px 4px 12px', padding: '9px 13px' }}>
            <p style={{ margin: 0, fontSize: 12.5, color: '#fff', lineHeight: 1.5 }}>{asked}</p>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'flex-start', width: '90%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader2 size={13} style={{ color: '#ef4444', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>Analysing safety data…</p>
            </div>
            {[95, 80, 88, 65].map((w, i) => <div key={i} className="skeleton" style={{ height: 11, width: `${w}%` }} />)}
          </div>
        )}

        {response && !loading && (
          <div className="animate-fade-in-up" style={{ alignSelf: 'flex-start', maxWidth: '94%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '4px 12px 12px 12px', padding: '12px 13px' }}>
            {mode && (
              <span className="sp-chip" style={{ display: 'inline-block', marginBottom: 8, background: mode === 'agent' ? 'rgba(239,68,68,0.14)' : 'rgba(148,163,184,0.14)', color: mode === 'agent' ? '#fca5a5' : '#9ca3af' }}>
                {mode === 'agent' ? '✦ AI Agent' : 'Data-driven'}
              </span>
            )}
            <p style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>{response}</p>
          </div>
        )}

        {!asked && !loading && (
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
            <p style={{ fontSize: 10, color: 'var(--muted)', margin: '0 0 2px', letterSpacing: '0.08em' }}>TRY ASKING</p>
            {PROMPTS.map((p) => (
              <button key={p} onClick={() => analyse(p)} className="sp-btn-ghost" style={{ textAlign: 'left', fontSize: 12.5, padding: '10px 12px', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {p} <span style={{ color: '#ef4444' }}>›</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: 12, borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: 8 }}>
        <input
          className="sp-input" value={prompt} onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') analyse(prompt); }}
          placeholder="How can I help you today?"
          style={{ flex: 1, padding: '10px 13px', fontSize: 12.5 }}
        />
        <button onClick={() => analyse(prompt)} disabled={loading || !prompt.trim()} className="sp-btn-red"
          style={{ padding: '0 13px', display: 'flex', alignItems: 'center', opacity: loading || !prompt.trim() ? 0.5 : 1 }}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
