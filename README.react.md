# AI Wallet React Integration Guide

Complete guide for using AI Wallet in React applications.

## Installation

```bash
npm install ai-wallet
```

## Quick Start

### 1. Basic Integration (Floating Wallet)

The simplest way to add AI Wallet to your React app:

```tsx
import { AIWalletProvider, useAIConfig } from 'ai-wallet/react';

function App() {
  return (
    <AIWalletProvider>
      <YourApp />
    </AIWalletProvider>
  );
}

function YourApp() {
  const config = useAIConfig();

  return (
    <div>
      {config?.llm && <p>LLM configured: {config.llm}</p>}
    </div>
  );
}
```

This creates a floating wallet in the bottom right corner with default shadow styling.

## Configuration Options

### AIWalletProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `remoteStorage` | `RemoteStorage` | `undefined` | RemoteStorage instance for cross-app sync |
| `capabilities` | `string[]` | `['llm', 'vlm', 'sst', 'tts']` | Which AI capabilities to enable |
| `floating` | `boolean` | `true` | If true, wallet floats in corner. If false, use `useAIWalletComponent()` to place it |
| `variant` | `'shadow' \| 'border'` | `'shadow'` | Visual style: shadow or border |
| `onConfigChange` | `(config) => void` | `undefined` | Callback fired when configuration changes |

## Placement Options

### Option 1: Floating (Default)

Wallet appears in the bottom right corner:

```tsx
<AIWalletProvider floating={true}>
  <YourApp />
</AIWalletProvider>
```

### Option 2: Custom Placement

Place the wallet anywhere in your component tree:

```tsx
import { AIWalletProvider, useAIWalletComponent } from 'ai-wallet/react';

function App() {
  return (
    <AIWalletProvider floating={false}>
      <Layout />
    </AIWalletProvider>
  );
}

function Layout() {
  const renderWallet = useAIWalletComponent();

  return (
    <div>
      <header>
        <h1>My App</h1>
      </header>

      <aside>
        {/* Wallet renders here */}
        {renderWallet()}
      </aside>

      <main>
        <Content />
      </main>
    </div>
  );
}
```

### Option 3: Standalone Component

Use without the context provider (no shared state):

```tsx
import { AIWalletComponent } from 'ai-wallet/react';

function MyComponent() {
  const handleConfigChange = (config) => {
    console.log('Config updated:', config);
  };

  return (
    <AIWalletComponent
      capabilities={['llm', 'vlm']}
      variant="border"
      onConfigChange={handleConfigChange}
    />
  );
}
```

## Style Variants

### Shadow Variant (Default)

Uses box shadow for depth:

```tsx
<AIWalletProvider variant="shadow">
  <YourApp />
</AIWalletProvider>
```

### Border Variant

Uses border instead of shadow:

```tsx
<AIWalletProvider variant="border">
  <YourApp />
</AIWalletProvider>
```

## Available Hooks

### useAIWallet()

Returns the full context value:

```tsx
import { useAIWallet } from 'ai-wallet/react';

function MyComponent() {
  const { config, wallet, renderWallet } = useAIWallet();

  // config: Current AI configuration
  // wallet: Ref to wallet web component
  // renderWallet: Function to render wallet

  return <div>{config?.endpoint}</div>;
}
```

### useAIConfig()

Returns just the configuration object:

```tsx
import { useAIConfig } from 'ai-wallet/react';

function MyComponent() {
  const config = useAIConfig();

  if (!config?.llm) {
    return <p>Please configure an LLM</p>;
  }

  return <p>Using: {config.llm}</p>;
}
```

### useAIWalletComponent()

Returns a function to render the wallet component:

```tsx
import { useAIWalletComponent } from 'ai-wallet/react';

function MyComponent() {
  const renderWallet = useAIWalletComponent();

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      {renderWallet()}
    </div>
  );
}
```

## RemoteStorage Integration

Sync configuration across multiple apps using RemoteStorage:

```tsx
import { AIWalletProvider } from 'ai-wallet/react';
import RemoteStorage from 'remotestoragejs';

function App() {
  // Initialize RemoteStorage
  const rs = new RemoteStorage();
  rs.access.claim('ai-wallet', 'rw');

  return (
    <AIWalletProvider remoteStorage={rs}>
      <YourApp />
    </AIWalletProvider>
  );
}
```

With RemoteStorage:
- Configuration is automatically saved
- Syncs across all apps using the same storage
- Users only configure once

Without RemoteStorage:
- Configuration stored in localStorage
- Scoped to single app/domain

## Configuration Object

```typescript
interface AIWalletConfig {
  endpoint?: string;           // API endpoint URL
  apiKey?: string;             // API authentication key
  llm?: string;                // Selected Language Model ID
  vlm?: string;                // Selected Vision Language Model ID
  sst?: string;                // Selected Speech-to-Text Model ID
  tts?: string;                // Selected Text-to-Speech Model ID
  enabledCapabilities?: string[]; // Active capabilities
}
```

## Complete Examples

### Example 1: Floating with Shadow (Default)

```tsx
import { AIWalletProvider, useAIConfig } from 'ai-wallet/react';

function App() {
  return (
    <AIWalletProvider>
      <Dashboard />
    </AIWalletProvider>
  );
}

function Dashboard() {
  const config = useAIConfig();

  return (
    <div>
      <h1>AI Dashboard</h1>
      {config?.llm && (
        <p>Ready with model: {config.llm}</p>
      )}
    </div>
  );
}
```

### Example 2: Custom Placement with Border

```tsx
import { AIWalletProvider, useAIWalletComponent, useAIConfig } from 'ai-wallet/react';

function App() {
  return (
    <AIWalletProvider floating={false} variant="border">
      <Layout />
    </AIWalletProvider>
  );
}

function Layout() {
  const renderWallet = useAIWalletComponent();
  const config = useAIConfig();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
      <main>
        <h1>My Application</h1>
        {config?.llm ? (
          <AIChat model={config.llm} />
        ) : (
          <p>Configure AI to start chatting</p>
        )}
      </main>

      <aside style={{ padding: '1rem' }}>
        <h2>Settings</h2>
        {renderWallet()}
      </aside>
    </div>
  );
}
```

### Example 3: With RemoteStorage

```tsx
import { AIWalletProvider, useAIConfig } from 'ai-wallet/react';
import RemoteStorage from 'remotestoragejs';

const rs = new RemoteStorage();
rs.access.claim('ai-wallet', 'rw');

function App() {
  return (
    <AIWalletProvider remoteStorage={rs} variant="shadow">
      <SyncedApp />
    </AIWalletProvider>
  );
}

function SyncedApp() {
  const config = useAIConfig();

  return (
    <div>
      <h1>Synced Across Apps</h1>
      <p>Configuration syncs via RemoteStorage</p>
      <pre>{JSON.stringify(config, null, 2)}</pre>
    </div>
  );
}
```

### Example 4: Multiple Wallets (Advanced)

Different sections with different capabilities:

```tsx
import { AIWalletComponent } from 'ai-wallet/react';

function App() {
  const [textConfig, setTextConfig] = useState(null);
  const [visionConfig, setVisionConfig] = useState(null);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      <section>
        <h2>Text Processing</h2>
        <AIWalletComponent
          capabilities={['llm']}
          variant="border"
          onConfigChange={setTextConfig}
        />
        {textConfig?.llm && <TextProcessor model={textConfig.llm} />}
      </section>

      <section>
        <h2>Vision Processing</h2>
        <AIWalletComponent
          capabilities={['vlm']}
          variant="border"
          onConfigChange={setVisionConfig}
        />
        {visionConfig?.vlm && <VisionProcessor model={visionConfig.vlm} />}
      </section>
    </div>
  );
}
```

## Best Practices

1. **Use AIWalletProvider at app root** - Wrap your entire app for shared configuration
2. **Use floating for simple apps** - Default floating placement works for most use cases
3. **Use custom placement for dashboards** - Integrate into settings panels or sidebars
4. **Choose variant based on design** - Use shadow for modern UIs, border for minimal designs
5. **Add RemoteStorage for multi-app setups** - Let users configure once, use everywhere
6. **Check config before using** - Always verify config exists and has required models

## TypeScript Support

All components and hooks are fully typed:

```tsx
import type { AIWalletConfig, AIWalletComponentProps } from 'ai-wallet/react';

const config: AIWalletConfig = {
  endpoint: 'https://api.example.com',
  apiKey: 'sk-...',
  llm: 'gpt-4',
  enabledCapabilities: ['llm', 'vlm']
};
```

## Troubleshooting

### Configuration not loading
- Check that `AIWalletProvider` wraps your components
- Verify you're using hooks inside the provider
- Check browser console for errors

### Wallet not appearing
- If `floating={false}`, use `useAIWalletComponent()` to render it
- Verify the provider is mounted
- Check CSS z-index conflicts

### RemoteStorage not syncing
- Ensure RemoteStorage is initialized before provider
- Check that `rs.access.claim()` is called
- Verify user is connected to RemoteStorage

## Migration Guide

### From standalone web component:

```tsx
// Before
<ai-wallet ref={walletRef} />

// After
import { AIWalletProvider, useAIConfig } from 'ai-wallet/react';

<AIWalletProvider>
  <YourApp />
</AIWalletProvider>
```

### From floating to custom placement:

```tsx
// Before
<AIWalletProvider>
  <App />
</AIWalletProvider>

// After
<AIWalletProvider floating={false}>
  <App />
</AIWalletProvider>

// In your component:
function App() {
  const renderWallet = useAIWalletComponent();
  return <div>{renderWallet()}</div>;
}
```
