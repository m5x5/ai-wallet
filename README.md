# ai-wallet

Note: Guide is Not Complete yet, Only read and try to set it up if you have enought time and experience

## Features
- Syncing with the Backend
- One Login for all AI Apps
- Drop-In Web Component
- Own Your Data
- Easy AI Provider Setup (use any AI provider)
- Open Source

## Screenshot
![Image of AI Wallet](./images/component.png)

A new standard for accessing AI in Applications.


## Getting started with AI Wallet

Clone the repo, and install the dependencies:
```shell
npm install ai-wallet
```

Start the stencil dev server:
```shell
npm start
```

If you would like to build the application:
```shell
npm run build
```

# How to setup your own AI

- Create an ollama instance and run a model of your choice.
- Enter the URL of the ollama instance in the component.
- If the application that you want to use correctly uses this component, you can now use the AI Wallet to access the AI model.

# How to become an AI Provider

- Use LiteLLM to spin up an instance and connect it to your ai model that you're running.
- Contact me or create a GitHub issue once the repository exists

## Using the AI Wallet Component in React

The `ai-wallet` is a Stencil web component that can be used in any React application.

### Basic Usage

```tsx
import { useEffect, useRef, useState } from 'react';
import { defineCustomElements } from 'ai-wallet/loader';

// Register the web components
defineCustomElements();

function App() {
  const walletRef = useRef(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    // Listen for configuration changes
    const handleConfigChange = (event) => {
      console.log('Config changed:', event.detail);
      setConfig(event.detail);
    };

    const element = walletRef.current;
    element?.addEventListener('configChanged', handleConfigChange);

    return () => {
      element?.removeEventListener('configChanged', handleConfigChange);
    };
  }, []);

  return <ai-wallet ref={walletRef} />;
}
```

### Advanced Usage with React Hooks (Recommended)

For a better React integration, use the provided hooks and context:

```tsx
import { AIWalletProvider, useAIWallet } from 'ai-wallet/react';

function App() {
  return (
    <AIWalletProvider>
      <YourComponent />
    </AIWalletProvider>
  );
}

function YourComponent() {
  const { config, wallet } = useAIWallet();

  // Access configuration
  console.log('Current endpoint:', config?.endpoint);
  console.log('Selected LLM:', config?.llm);

  return <div>AI is configured!</div>;
}
```

### With RemoteStorage Integration

```tsx
import { AIWalletProvider } from 'ai-wallet/react';
import RemoteStorage from 'remotestoragejs';

function App() {
  const rs = new RemoteStorage();
  rs.access.claim('ai-wallet', 'rw');

  return (
    <AIWalletProvider remoteStorage={rs}>
      <YourApp />
    </AIWalletProvider>
  );
}
```

### Configuration Interface

```typescript
interface AIWalletConfig {
  endpoint?: string;           // API endpoint URL
  apiKey?: string;             // API key
  vlm?: string;                // Selected Vision Language Model
  llm?: string;                // Selected Language Model
  sst?: string;                // Selected Speech-to-Text Model
  tts?: string;                // Selected Text-to-Speech Model
  enabledCapabilities?: string[]; // Array of enabled capabilities
}
```

### Available Hooks

- `useAIWallet()`: Returns `{ config, wallet, renderWallet }` with current configuration, wallet ref, and render function
- `useAIConfig()`: Returns just the configuration object
- `useAIWalletComponent()`: Returns a function to render the wallet component anywhere in your app

### Customizing Wallet Placement and Style

#### Floating vs Custom Placement

By default, the wallet floats in the bottom right corner. You can control this behavior:

```tsx
// Floating in corner (default)
<AIWalletProvider floating={true} remoteStorage={rs}>
  <YourApp />
</AIWalletProvider>

// Disable floating - render it manually wherever you want
<AIWalletProvider floating={false} remoteStorage={rs}>
  <YourApp />
</AIWalletProvider>
```

#### Style Variants

Choose between shadow (default) or border styling:

```tsx
// Shadow variant (default)
<AIWalletProvider variant="shadow" remoteStorage={rs}>
  <YourApp />
</AIWalletProvider>

// Border variant
<AIWalletProvider variant="border" remoteStorage={rs}>
  <YourApp />
</AIWalletProvider>
```

#### Custom Placement Example

Use the `useAIWalletComponent()` hook to render the wallet anywhere:

```tsx
import { AIWalletProvider, useAIWalletComponent, useAIConfig } from 'ai-wallet/react';

function App() {
  return (
    <AIWalletProvider floating={false} variant="border" remoteStorage={rs}>
      <MyCustomLayout />
    </AIWalletProvider>
  );
}

function MyCustomLayout() {
  const renderWallet = useAIWalletComponent();
  const config = useAIConfig();

  return (
    <div>
      <header>
        <h1>My App</h1>
        {/* Render wallet in header */}
        <div style={{ maxWidth: '400px' }}>
          {renderWallet()}
        </div>
      </header>

      <main>
        {config?.llm && <p>Using model: {config.llm}</p>}
      </main>
    </div>
  );
}
```

#### Standalone Component

For use without the context provider:

```tsx
import { AIWalletComponent } from 'ai-wallet/react';

function MyComponent() {
  return (
    <AIWalletComponent
      variant="border"
      capabilities={['llm', 'vlm']}
      onConfigChange={(config) => {
        console.log('Config updated:', config);
      }}
      style={{ maxWidth: '500px' }}
    />
  );
}
```

### AIWalletProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `remoteStorage` | `any` | `undefined` | RemoteStorage instance for syncing |
| `capabilities` | `string[]` | `['llm', 'vlm', 'sst', 'tts']` | Enabled AI capabilities |
| `floating` | `boolean` | `true` | Whether wallet floats in corner or is manually placed |
| `variant` | `'shadow' \| 'border'` | `'shadow'` | Visual style variant |
| `onConfigChange` | `(config: AIWalletConfig) => void` | `undefined` | Callback when config changes |
