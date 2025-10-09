# ai-wallet

A drop-in component for AI login and provider setup.

## Basic Usage

```html
<ai-wallet></ai-wallet>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `capabilities` | `string[]` | `['vlm', 'llm', 'sst', 'tts']` | AI capabilities to enable |
| `variant` | `'shadow' \| 'border'` | `'shadow'` | Visual style variant |
| `sync` | `boolean` | `true` | Enable RemoteStorage sync |

## Events

### configChanged

Emitted when the AI configuration changes.

```javascript
const wallet = document.querySelector('ai-wallet');
wallet.addEventListener('configChanged', (event) => {
  console.log('New config:', event.detail);
  // event.detail contains:
  // - endpoint: string
  // - apiKey: string
  // - llm: string
  // - vlm: string
  // - sst: string
  // - tts: string
  // - enabledCapabilities: string[]
});
```

## Methods

### getConfiguration()

Returns the current configuration.

```javascript
const config = await wallet.getConfiguration();
console.log(config.endpoint);
console.log(config.llm);
```

### saveConfiguration()

Saves the current configuration to storage.

```javascript
const success = await wallet.saveConfiguration();
```

### setRemoteStorage(rs)

Sets the RemoteStorage instance.

```javascript
import RemoteStorage from 'remotestoragejs';

const rs = new RemoteStorage();
rs.access.claim('ai-wallet', 'rw');

const wallet = document.querySelector('ai-wallet');
await wallet.setRemoteStorage(rs);
```

### getRemoteStorage()

Gets the current RemoteStorage instance.

```javascript
const rs = await wallet.getRemoteStorage();
```

## Styling

### Shadow Variant (Default)

The default variant uses a box shadow:

```html
<ai-wallet variant="shadow"></ai-wallet>
```

### Border Variant

Use a border instead of shadow:

```html
<ai-wallet variant="border"></ai-wallet>
```

## React Integration

For React apps, use the provided hooks and components:

```tsx
import { AIWalletProvider, useAIConfig } from 'ai-wallet/react';

function App() {
  return (
    <AIWalletProvider variant="shadow">
      <YourApp />
    </AIWalletProvider>
  );
}
```

See [React Integration Guide](../guide/react-integration) for more details.

## Examples

### With RemoteStorage

```html
<script type="module">
  import RemoteStorage from 'remotestoragejs';

  const rs = new RemoteStorage();
  rs.access.claim('ai-wallet', 'rw');

  const wallet = document.querySelector('ai-wallet');
  wallet.setRemoteStorage(rs);

  wallet.addEventListener('configChanged', (event) => {
    console.log('Configuration updated:', event.detail);
  });
</script>

<ai-wallet></ai-wallet>
```

### Custom Styling

```html
<style>
  .wallet-container {
    max-width: 500px;
    margin: 2rem auto;
    padding: 1rem;
  }
</style>

<div class="wallet-container">
  <ai-wallet variant="border"></ai-wallet>
</div>
```

### With Specific Capabilities

```html
<!-- Only enable LLM and VLM -->
<ai-wallet
  capabilities='["llm", "vlm"]'
  variant="border">
</ai-wallet>
```
