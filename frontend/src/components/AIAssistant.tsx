import { useState } from 'react';
import { Send, Loader2, RotateCcw, X, AlertCircle } from 'lucide-react';
import { chatWithAgent } from '../services/api';

const PROMPTS = [
  'Is it safe to walk from Uxbridge station to the canal at night?',
  'What are the main safety concerns near Brunel University?',
  'Which streets in Uxbridge have the most reported incidents?',
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
    setAsked(text);
    setPrompt('');
    setLoading(true);
    setResponse('');
    setMode('');
    setError('');
    try {
      const { reply, mode } = await chatWithAgent(text);
      setResponse(reply);
      setMode(mode);
    } catch {
      setError('The AI assistant is currently unavailable. Check the backend is running on port 8080.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setPrompt(''); setResponse(''); setMode(''); setError(''); setAsked(''); };

  const hasResult = response || error;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      flex: 1, minHeight: 0,
      background: 'white', borderRadius: '16px',
      border: '1px solid #e2e8f0', overflow: 'hidden',
      position: 'relative',
    }}>

      {/* Error popup banner */}
      {error && (
        <div style={{
          position: 'absolute', top: '12px', left: '12px', right: '12px', zIndex: 10,
          background: '#1e3a5f', borderRadius: '12px', padding: '14px 16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'flex-start', gap: '10px',
        }}>
          <AlertCircle size={16} style={{ color: '#fca5a5', flexShrink: 0, marginTop: '1px' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'white', margin: '0 0 3px' }}>Gemini AI unavailable</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#1e3a5f', padding: '16px 18px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'pulse-anim 2s ease-in-out infinite', flexShrink: 0 }} />
              <p style={{ fontWeight: 700, fontSize: '13px', color: 'white', margin: 0 }}>AI Safety Assistant</p>
            </div>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', margin: 0, paddingLeft: '15px' }}>
              Ask about any route, street or area in Uxbridge
            </p>
          </div>
          {hasResult && (
            <button
              onClick={reset}
              title="New question"
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {asked && (
          <div style={{ background: '#1e3a5f', borderRadius: '10px 10px 10px 2px', padding: '9px 12px', alignSelf: 'flex-start', maxWidth: '88%' }}>
            <p style={{ fontSize: '12px', color: 'white', margin: 0, lineHeight: 1.5 }}>{asked}</p>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignSelf: 'flex-end', width: '90%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Loader2 size={13} style={{ color: '#64748b', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Analysing safety data...</p>
            </div>
            {[95, 80, 88, 65, 72].map((w, i) => (
              <div key={i} className="skeleton" style={{ height: '12px', width: `${w}%`, borderRadius: '4px' }} />
            ))}
          </div>
        )}

        {response && !loading && (
          <div
            className="animate-fade-in-up"
            style={{ background: 'rgba(30,58,95,0.05)', border: '1px solid rgba(30,58,95,0.12)', borderRadius: '2px 10px 10px 10px', padding: '13px 14px', alignSelf: 'flex-end', maxWidth: '92%' }}
          >
            {mode && (
              <span style={{
                display: 'inline-block', marginBottom: '8px', fontSize: '9px', fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: '99px',
                background: mode === 'agent' ? 'rgba(13,148,136,0.12)' : 'rgba(100,116,139,0.12)',
                color: mode === 'agent' ? '#0d9488' : '#64748b',
              }}>
                {mode === 'agent' ? '✦ AI Agent' : 'Data-driven'}
              </span>
            )}
            <p style={{ fontSize: '12px', color: '#1e3a5f', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'Inter' }}>
              {response}
            </p>
          </div>
        )}

        {!asked && !loading && (
          <div style={{ marginTop: 'auto' }}>
            <p style={{ fontSize: '10px', color: '#cbd5e1', margin: '0 0 8px', letterSpacing: '0.06em' }}>TRY ASKING</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => analyse(p)}
                  style={{ textAlign: 'left', fontSize: '12px', padding: '9px 12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e3a5f', lineHeight: 1.45, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Inter' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#1e3a5f'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#1e3a5f'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e3a5f'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid #e2e8f0', flexShrink: 0, display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') analyse(prompt); }}
          placeholder="Type a route, street or area name..."
          style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', fontSize: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontFamily: 'Inter', outline: 'none', transition: 'border-color 0.15s' }}
          onFocus={(e) => (e.target.style.borderColor = '#1e3a5f')}
          onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
        />
        <button
          onClick={() => analyse(prompt)}
          disabled={loading || !prompt.trim()}
          style={{ padding: '8px 13px', borderRadius: '10px', border: 'none', flexShrink: 0, background: loading || !prompt.trim() ? '#e2e8f0' : '#1e3a5f', color: loading || !prompt.trim() ? '#94a3b8' : 'white', cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
