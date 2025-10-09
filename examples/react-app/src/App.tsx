import { AIWalletProvider, useAIWallet, useAIConfig, useAIWalletComponent } from 'ai-wallet/react';
import RemoteStorage from 'remotestoragejs';
import './App.css';

// Initialize RemoteStorage
const rs = new RemoteStorage();
rs.access.claim('ai-wallet', 'rw');

function ConfigDisplay() {
  const config = useAIConfig();
  const renderWallet = useAIWalletComponent();

  return (
    <div className="config-display">
      <h2>AI Wallet Configuration</h2>
      {renderWallet()}
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

function App() {
  return (
    <AIWalletProvider remoteStorage={rs} floating={false} variant="border">
      <div>
        <h1>AI Wallet React Example</h1>
        <p className="read-the-docs">
          Configure your AI settings using the wallet in the bottom right corner
        </p>

        <ConfigDisplay />
        <AIFeature />

        <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#888' }}>
          <p>This example demonstrates:</p>
          <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '1rem auto' }}>
            <li><strong>Floating Placement:</strong> floating=true (default) shows wallet in corner</li>
            <li><strong>Shadow Variant:</strong> variant="shadow" (default) uses shadow styling</li>
            <li>AIWalletProvider context integration</li>
            <li>useAIWallet() and useAIConfig() hooks</li>
            <li>RemoteStorage synchronization</li>
            <li>Real-time configuration updates</li>
          </ul>
          <p style={{ marginTop: '1rem' }}>
            <strong>💡 Tip:</strong> Check out AppCustomPlacement.tsx for custom placement example!
          </p>
        </div>
      </div>
    </AIWalletProvider>
  );
}

export default App;
