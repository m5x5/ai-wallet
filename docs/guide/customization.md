# Customization

Learn how to customize the AI Wallet appearance and placement.

## Placement Options

The AI Wallet supports two placement modes: **floating** and **custom**.

### Floating Mode (Default)

In floating mode, the wallet automatically appears in the bottom right corner of the screen.

```tsx
import { AIWalletProvider } from 'ai-wallet/react';

function App() {
  return (
    <AIWalletProvider floating={true}>
      <YourApp />
    </AIWalletProvider>
  );
}
```

**When to use:**
- Simple applications
- Quick integration
- No custom layout requirements

### Custom Placement Mode

In custom mode, you control exactly where the wallet appears.

```tsx
import { AIWalletProvider, useAIWalletComponent } from 'ai-wallet/react';

function App() {
  return (
    <AIWalletProvider floating={false}>
      <YourLayout />
    </AIWalletProvider>
  );
}

function YourLayout() {
  const renderWallet = useAIWalletComponent();

  return (
    <div>
      <header>Header</header>
      <main>Content</main>
      <aside>
        {/* Wallet appears here */}
        {renderWallet()}
      </aside>
    </div>
  );
}
```

**When to use:**
- Dashboard layouts
- Settings panels
- Custom designs
- Specific UX requirements

## Style Variants

The AI Wallet supports two visual styles.

### Shadow Variant (Default)

Uses a subtle box shadow for depth and elevation.

```tsx
<AIWalletProvider variant="shadow">
  <YourApp />
</AIWalletProvider>
```

**Visual characteristics:**
- Soft box shadow
- Modern appearance
- Good for light backgrounds
- Creates depth perception

**Best for:**
- Modern applications
- Default styling
- Light/bright interfaces

### Border Variant

Uses a border instead of shadow for a cleaner look.

```tsx
<AIWalletProvider variant="border">
  <YourApp />
</AIWalletProvider>
```

**Visual characteristics:**
- 2px border
- Minimal appearance
- Adapts to dark mode
- Flat design

**Best for:**
- Minimal designs
- Dashboard integrations
- Custom color schemes
- Dark mode interfaces

## Combining Options

You can combine placement and style options:

```tsx
// Custom placement with border style
<AIWalletProvider floating={false} variant="border">
  <YourApp />
</AIWalletProvider>

// Floating with shadow style (default)
<AIWalletProvider floating={true} variant="shadow">
  <YourApp />
</AIWalletProvider>
```

## Layout Examples

### Sidebar Integration

Place the wallet in a settings sidebar:

```tsx
import { AIWalletProvider, useAIWalletComponent } from 'ai-wallet/react';

function App() {
  return (
    <AIWalletProvider floating={false} variant="border">
      <DashboardLayout />
    </AIWalletProvider>
  );
}

function DashboardLayout() {
  const renderWallet = useAIWalletComponent();

  return (
    <div style={{ display: 'flex' }}>
      <main style={{ flex: 1 }}>
        <h1>Dashboard</h1>
        {/* Main content */}
      </main>

      <aside style={{ width: '400px', padding: '1rem', borderLeft: '1px solid #ccc' }}>
        <h2>Settings</h2>
        {renderWallet()}
      </aside>
    </div>
  );
}
```

### Modal/Dialog Integration

Display wallet in a modal:

```tsx
import { AIWalletProvider, useAIWalletComponent } from 'ai-wallet/react';
import { useState } from 'react';

function App() {
  return (
    <AIWalletProvider floating={false} variant="shadow">
      <AppWithModal />
    </AIWalletProvider>
  );
}

function AppWithModal() {
  const [showSettings, setShowSettings] = useState(false);
  const renderWallet = useAIWalletComponent();

  return (
    <div>
      <button onClick={() => setShowSettings(true)}>
        Configure AI
      </button>

      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '600px'
          }}>
            <h2>AI Settings</h2>
            {renderWallet()}
            <button onClick={() => setShowSettings(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Header Integration

Integrate wallet into page header:

```tsx
import { AIWalletProvider, useAIWalletComponent } from 'ai-wallet/react';

function App() {
  return (
    <AIWalletProvider floating={false} variant="border">
      <PageLayout />
    </AIWalletProvider>
  );
}

function PageLayout() {
  const renderWallet = useAIWalletComponent();

  return (
    <div>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '1rem',
        borderBottom: '1px solid #ddd'
      }}>
        <h1>My App</h1>
        <div style={{ width: '400px' }}>
          {renderWallet()}
        </div>
      </header>

      <main>
        {/* Content */}
      </main>
    </div>
  );
}
```

## Styling Tips

### Container Width

Control wallet width using wrapper styles:

```tsx
function MyComponent() {
  const renderWallet = useAIWalletComponent();

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      {renderWallet()}
    </div>
  );
}
```

### Dark Mode

The wallet automatically adapts to dark mode. Use the border variant for better dark mode integration:

```tsx
<AIWalletProvider variant="border">
  <YourApp />
</AIWalletProvider>
```

### Custom Spacing

Add spacing around the wallet:

```tsx
function MyComponent() {
  const renderWallet = useAIWalletComponent();

  return (
    <div style={{ padding: '2rem' }}>
      {renderWallet()}
    </div>
  );
}
```

## Standalone Component

For advanced use cases, use `AIWalletComponent` without the provider:

```tsx
import { AIWalletComponent } from 'ai-wallet/react';

function IndependentWallet() {
  return (
    <AIWalletComponent
      variant="border"
      capabilities={['llm', 'vlm']}
      onConfigChange={(config) => {
        console.log('Config:', config);
      }}
      style={{ maxWidth: '600px' }}
    />
  );
}
```

**Use cases:**
- Multiple independent wallets
- Different configurations per section
- No need for shared context

## Best Practices

1. **Match your design system**: Choose shadow or border based on your app's design language
2. **Consider user workflow**: Place wallet where users naturally look for settings
3. **Responsive layouts**: Use custom placement for better mobile experiences
4. **Consistent styling**: Use the same variant throughout your app
5. **Test dark mode**: Verify appearance in both light and dark themes

## Next Steps

- Learn about [React Integration](./react-integration)
- Explore [RemoteStorage setup](./getting-started#remotestorage)
- Check out [component API](../components/ai-wallet)
