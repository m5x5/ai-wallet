import { AIWalletProvider, useAIWallet, useAIConfig, useAIWalletComponent } from 'ai-wallet/react';
import RemoteStorage from 'remotestoragejs';
import './App.css';

// Initialize RemoteStorage
const rs = new RemoteStorage();
rs.access.claim('ai-wallet', 'rw');

function ConfigDisplay() {
  const config = useAIConfig();

  return (
    <div className="config-display">
      <h2>AI Wallet Configuration</h2>
      {config ? (
        <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
          <p><strong>Endpoint:</strong> {config.endpoint || 'Not set'}</p>
          <p><strong>API Key:</strong> {config.apiKey ? '***********' : 'Not set'}</p>
          <p><strong>LLM Model:</strong> {config.llm || 'Not selected'}</p>
          <p><strong>VLM Model:</strong> {config.vlm || 'Not selected'}</p>
          <p><strong>SST Model:</strong> {config.sst || 'Not selected'}</p>
          <p><strong>TTS Model:</strong> {config.tts || 'Not selected'}</p>
          <p><strong>Enabled Capabilities:</strong> {config.enabledCapabilities?.join(', ') || 'None'}</p>
        </div>
      ) : (
        <p>No configuration loaded yet</p>
      )}
    </div>
  );
}

function AIFeature() {
  const { config } = useAIWallet();

  if (!config?.llm) {
    return (
      <div className="card">
        <p>Please configure your AI Wallet to use AI features</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>AI Feature Ready</h3>
      <p>Your AI is configured and ready to use!</p>
      <p>Selected LLM: <code>{config.llm}</code></p>
    </div>
  );
}

function CustomWalletPlacement() {
  const renderWallet = useAIWalletComponent();

  return (
    <div style={{
      marginTop: '2rem',
      padding: '1rem',
      border: '2px dashed #ccc',
      borderRadius: '8px',
      maxWidth: '600px',
      margin: '2rem auto'
    }}>
      <h3 style={{ marginTop: 0 }}>Custom Wallet Placement (Border Variant)</h3>
      <p style={{ fontSize: '0.9rem', color: '#666' }}>
        The wallet is placed here instead of floating in the corner!
      </p>
      {renderWallet()}
    </div>
  );
}

function App() {
  return (
    <AIWalletProvider
      remoteStorage={rs}
      floating={false}
      variant="border"
    >
      <div>
        <h1>AI Wallet - Custom Placement Example</h1>
        <p className="read-the-docs">
          This example shows the wallet with custom placement and border variant
        </p>

        <ConfigDisplay />
        <AIFeature />

        <CustomWalletPlacement />

        <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#888' }}>
          <p>This example demonstrates:</p>
          <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '1rem auto' }}>
            <li><strong>Custom Placement:</strong> floating=false allows manual placement</li>
            <li><strong>Border Variant:</strong> variant="border" uses border instead of shadow</li>
            <li><strong>useAIWalletComponent():</strong> Hook to render wallet anywhere</li>
            <li><strong>Context Integration:</strong> Config still shared via context</li>
          </ul>
        </div>
      </div>
    </AIWalletProvider>
  );
}

export default App;
