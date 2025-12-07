import React, { useEffect, useRef, useState } from 'react';
import { AIWalletProvider, useAIWallet, useAIConfig, useAIWalletComponent } from 'ai-wallet/react';
import RemoteStorage from 'remotestoragejs';
import { AI } from "remotestorage-module-ai-wallet";
import './App.css';

// Initialize RemoteStorage
const rs = new RemoteStorage({modules: [AI]});
rs.access.claim('ai-wallet', 'rw');

// Simple inline design system for a clean, modern look
const ui = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    background:
      'radial-gradient(1200px 600px at 10% -10%, rgba(56,189,248,0.18), rgba(0,0,0,0)),' +
      'radial-gradient(900px 500px at 100% 0%, rgba(99,102,241,0.18), rgba(0,0,0,0)),' +
      'linear-gradient(180deg, #0b0f1a 0%, #0a0d16 100%)',
    color: '#e5e7eb',
  } as React.CSSProperties,
  container: {
    width: '100%',
    maxWidth: 1100,
    margin: '0 auto',
    padding: '48px 20px 64px',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 28,
  } as React.CSSProperties,
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  } as React.CSSProperties,
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    background:
      'conic-gradient(from 140deg at 50% 50%, #60a5fa, #34d399, #a78bfa, #60a5fa)',
    boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
  } as React.CSSProperties,
  brandTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 0.2,
    background:
      'linear-gradient(90deg, #e5e7eb 0%, #c7d2fe 35%, #a7f3d0 70%, #e5e7eb 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  } as React.CSSProperties,
  subTitle: {
    margin: 0,
    color: '#9ca3af',
    fontSize: 14,
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    gap: 20,
  } as React.CSSProperties,
  section: {
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
    border: '1px solid rgba(148,163,184,0.18)',
    borderRadius: 16,
    padding: 18,
    boxShadow:
      '0 10px 25px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
    backdropFilter: 'blur(6px)',
  } as React.CSSProperties,
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  } as React.CSSProperties,
  sectionTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#f3f4f6',
  } as React.CSSProperties,
  walletSurface: {
    border: '1px dashed rgba(148,163,184,0.3)',
    borderRadius: 12,
    padding: 10,
    background: 'rgba(2,6,23,0.35)',
  } as React.CSSProperties,
  list: {
    display: 'grid',
    gap: 8,
    margin: '8px 0 0',
    padding: 0,
    listStyle: 'none',
    color: '#cbd5e1',
    fontSize: 14,
  } as React.CSSProperties,
  listItem: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    lineHeight: 1.5,
    flexWrap: 'wrap',
  } as React.CSSProperties,
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 9999,
    background: 'rgba(99,102,241,0.12)',
    color: 'white',
    border: '1px solid rgba(99,102,241,0.25)',
    fontSize: 12,
    fontWeight: 600,
  } as React.CSSProperties,
  code: {
    background: 'rgba(2,6,23,0.55)',
    border: '1px solid rgba(148,163,184,0.2)',
    color: '#93c5fd',
    padding: '1px 6px',
    borderRadius: 6,
  } as React.CSSProperties,
  footer: {
    marginTop: 22,
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  } as React.CSSProperties,
};

function SectionCard(props: React.PropsWithChildren<{ title: string; action?: React.ReactNode }>) {
  return (
    <section style={ui.section}>
      <div style={ui.sectionHeader}>
        <h3 style={ui.sectionTitle}>{props.title}</h3>
        {props.action}
      </div>
      {props.children}
    </section>
  );
}

function ConfigDisplay() {
  const config = useAIConfig();
  const renderWallet = useAIWalletComponent();

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <SectionCard
        title="Wallet"
        action={<span style={ui.pill}>Custom placement</span>}
      >
        <div style={ui.walletSurface}>
          {renderWallet()}
        </div>
      </SectionCard>

      <SectionCard title="Configuration">
        {config ? (
          <ul style={ui.list}>
            <li style={ui.listItem}>
              <span style={{ color: '#94a3b8', minWidth: 110 }}>Endpoint</span>
              <span>{config.endpoint || 'Not set'}</span>
            </li>
            <li style={ui.listItem}>
              <span style={{ color: '#94a3b8', minWidth: 110 }}>API Key</span>
              <span>{config.apiKey ? '• • • • • • • • •' : 'Not set'}</span>
            </li>
            <li style={ui.listItem}>
              <span style={{ color: '#94a3b8', minWidth: 110 }}>LLM</span>
              <span>{config.llm || 'Not selected'}</span>
            </li>
            <li style={ui.listItem}>
              <span style={{ color: '#94a3b8', minWidth: 110 }}>VLM</span>
              <span>{config.vlm || 'Not selected'}</span>
            </li>
            <li style={ui.listItem}>
              <span style={{ color: '#94a3b8', minWidth: 110 }}>SST</span>
              <span>{config.sst || 'Not selected'}</span>
            </li>
            <li style={ui.listItem}>
              <span style={{ color: '#94a3b8', minWidth: 110 }}>TTS</span>
              <span>{config.tts || 'Not selected'}</span>
            </li>
            <li style={ui.listItem}>
              <span style={{ color: '#94a3b8', minWidth: 110 }}>Capabilities</span>
              <span>{config.enabledCapabilities?.join(', ') || 'None'}</span>
            </li>
          </ul>
        ) : (
          <div style={{ color: '#9ca3af' }}>No configuration loaded yet</div>
        )}
      </SectionCard>
    </div>
  );
}

function AIFeature() {
  const { config } = useAIWallet();

  if (!config?.llm) {
    return (
      <SectionCard
        title="AI Feature"
        action={<span style={{ ...ui.pill, background: 'rgba(248,113,113,0.12)', color: '#fecaca', borderColor: 'rgba(248,113,113,0.25)' }}>Setup required</span>}
      >
        <div style={{ color: '#cbd5e1' }}>
          Please configure your AI Wallet to use AI features.
          Open the wallet, set an endpoint and select a model.
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="AI Feature"
      action={<span style={{ ...ui.pill, background: 'rgba(34,197,94,0.12)', color: '#bbf7d0', borderColor: 'rgba(34,197,94,0.25)' }}>Ready</span>}
    >
      <div style={{ color: '#cbd5e1', display: 'grid', gap: 6 }}>
        <div>Your AI is configured and ready to use.</div>
        <div>
          Selected LLM: <code style={ui.code}>{config.llm}</code>
        </div>
      </div>
    </SectionCard>
  );
}

function App() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [isStacked, setIsStacked] = useState(false);

  useEffect(() => {
    const el = gridRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      // Fallback to window width if ResizeObserver is unavailable
      const onResize = () => setIsStacked(window.innerWidth < 960);
      onResize();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? el.clientWidth;
      setIsStacked(width < 960);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <AIWalletProvider remoteStorage={rs} floating={false} variant="border">
      <main style={ui.page}>
        <div style={ui.container}>
          <header style={ui.header}>
            <div style={ui.brand}>
              <div style={ui.brandMark} />
              <div>
                <h1 style={ui.brandTitle}>AI Wallet</h1>
                <p style={ui.subTitle}>Configure, persist, and use AI across your apps.</p>
              </div>
            </div>
            <span style={ui.pill}>
              <a href="https://github.com/m5x5/ai-wallet" target="_blank" rel="noopener noreferrer">
              <svg height="24" aria-hidden="true" viewBox="0 0 24 24" version="1.1" width="24" data-view-component="true" style={{ fill: 'white' }}>
                <path d="M12 1C5.923 1 1 5.923 1 12c0 4.867 3.149 8.979 7.521 10.436.55.096.756-.233.756-.522 0-.262-.013-1.128-.013-2.049-2.764.509-3.479-.674-3.699-1.292-.124-.317-.66-1.293-1.127-1.554-.385-.207-.936-.715-.014-.729.866-.014 1.485.797 1.691 1.128.99 1.663 2.571 1.196 3.204.907.096-.715.385-1.196.701-1.471-2.448-.275-5.005-1.224-5.005-5.432 0-1.196.426-2.186 1.128-2.956-.111-.275-.496-1.402.11-2.915 0 0 .921-.288 3.024 1.128a10.193 10.193 0 0 1 2.75-.371c.936 0 1.871.123 2.75.371 2.104-1.43 3.025-1.128 3.025-1.128.605 1.513.221 2.64.111 2.915.701.77 1.127 1.747 1.127 2.956 0 4.222-2.571 5.157-5.019 5.432.399.344.743 1.004.743 2.035 0 1.471-.014 2.654-.014 3.025 0 .289.206.632.756.522C19.851 20.979 23 16.854 23 12c0-6.077-4.922-11-11-11Z"></path>
              </svg>
              </a>
            </span>
          </header>

          <div
            ref={gridRef}
            style={{ ...ui.grid, gridTemplateColumns: isStacked ? '1fr' : '1.1fr 0.9fr' }}
          >
            <div style={{ display: 'grid', gap: 14 }}>
              <SectionCard title="How it works" action={<span style={ui.pill}>Quick tour</span>}>
                <ul style={ui.list}>
                  <li style={ui.listItem}>
                    <span style={{ color: '#a5b4fc' }}>1.</span>
                    Use the embedded wallet to enter your API key and models.
                  </li>
                  <li style={ui.listItem}>
                    <span style={{ color: '#a5b4fc' }}>2.</span>
                    Settings sync via RemoteStorage and update in real time.
                  </li>
                  <li style={ui.listItem}>
                    <span style={{ color: '#a5b4fc' }}>3.</span>
                    Your components read config from context and unlock features.
                  </li>
                  <li style={ui.listItem}>
                    <span style={{ color: '#a5b4fc' }}>4.</span>
                    Switch placement with <code style={ui.code}>floating</code> or place anywhere with <code style={ui.code}>useAIWalletComponent()</code>.
                  </li>
                </ul>
              </SectionCard>

              <AIFeature />
            </div>

            <ConfigDisplay />
          </div>

          <div style={ui.footer}>
            <span>Tip: see </span>
            <code style={ui.code}>AppCustomPlacement.tsx</code>
            <span> for manual placement and styling variants.</span>
          </div>
        </div>
      </main>
    </AIWalletProvider>
  );
}

export default App;
