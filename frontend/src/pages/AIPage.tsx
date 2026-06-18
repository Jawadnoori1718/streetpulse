import AIAssistant from '../components/AIAssistant';

export default function AIPage() {
  return (
    <div style={{ padding: 16, maxWidth: 760, margin: '0 auto' }}>
      <h1 style={{ margin: '4px 0 4px', fontSize: 22, fontWeight: 700, color: '#fff' }}>AI Safety Assistant</h1>
      <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-2)' }}>
        Ask about any route, street, or area — answers are grounded in live community reports, Police UK data, and the risk model.
      </p>
      <div style={{ height: 'calc(100dvh - 200px)', minHeight: 460 }}>
        <AIAssistant />
      </div>
    </div>
  );
}
