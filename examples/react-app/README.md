# AI Wallet React Example

This is a React + Vite example app demonstrating the AI Wallet component integration.

## Features

- **Context Provider**: Uses `AIWalletProvider` to wrap the app
- **Hooks**: Demonstrates `useAIWallet()` and `useAIConfig()` hooks
- **RemoteStorage**: Shows how to integrate RemoteStorage for syncing
- **Real-time Updates**: Configuration changes are reflected immediately

## Running the Example

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

## How It Works

1. The `AIWalletProvider` wraps the entire app and automatically renders the wallet widget in the bottom right corner
2. The `useAIConfig()` hook provides access to the current configuration
3. The `useAIWallet()` hook provides both config and wallet ref
4. RemoteStorage is passed to the provider for data synchronization

## Code Structure

- `App.tsx` - Main app with provider and example components
- `ConfigDisplay` - Component showing current wallet configuration
- `AIFeature` - Component that uses the wallet config
