import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import type { AIWalletConfig } from './types';

// Define custom element types for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'ai-wallet': any;
    }
  }
}

// Lazy load web components
let componentsLoaded = false;
function ensureComponentsLoaded() {
  if (!componentsLoaded) {
    import('../../loader').then(({ defineCustomElements }) => {
      defineCustomElements();
      componentsLoaded = true;
    });
  }
}

interface AIWalletContextValue {
  config: AIWalletConfig | null;
  wallet: any;
  renderWallet: () => React.ReactElement | null;
}

const AIWalletContext = createContext<AIWalletContextValue | undefined>(undefined);

interface AIWalletProviderProps {
  children: ReactNode;
  remoteStorage?: any;
  capabilities?: string[];
  onConfigChange?: (config: AIWalletConfig) => void;
  floating?: boolean; // Controls if wallet is floating (default: true) or embedded in children
  variant?: 'shadow' | 'border'; // Style variant (default: 'shadow')
}

export function AIWalletProvider({
  children,
  remoteStorage,
  capabilities = ['llm', 'vlm', 'sst', 'tts'],
  onConfigChange,
  floating = true,
  variant = 'shadow'
}: AIWalletProviderProps) {
  const walletRef = useRef<any>(null);
  const [config, setConfig] = useState<AIWalletConfig | null>(null);

  useEffect(() => {
    ensureComponentsLoaded();
  }, []);

  useEffect(() => {
    const handleConfigChange = (event: CustomEvent<AIWalletConfig>) => {
      setConfig(event.detail);
      onConfigChange?.(event.detail);
    };

    const element = walletRef.current;
    if (!element) return;

    element.addEventListener('configChanged', handleConfigChange);

    // Set RemoteStorage if provided
    if (remoteStorage) {
      // Wait for web component to be defined
      if (customElements.get('ai-wallet')) {
        element.setRemoteStorage(remoteStorage);
      } else {
        customElements.whenDefined('ai-wallet').then(() => {
          element.setRemoteStorage(remoteStorage);
        });
      }
    }

    // Load initial config
    element.getConfiguration?.().then((initialConfig: AIWalletConfig) => {
      setConfig(initialConfig);
    }).catch(() => {
      // Component not ready yet, will load on configChanged event
    });

    return () => {
      element.removeEventListener('configChanged', handleConfigChange);
    };
  }, [remoteStorage, onConfigChange]);

  const renderWallet = () => (
    <ai-wallet
      ref={walletRef}
      capabilities={capabilities}
      variant={variant}
    />
  );

  return (
    <AIWalletContext.Provider value={{ config, wallet: walletRef, renderWallet }}>
      {children}
      {floating && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 99 }}>
          {renderWallet()}
        </div>
      )}
    </AIWalletContext.Provider>
  );
}

export function useAIWallet() {
  const context = useContext(AIWalletContext);
  if (context === undefined) {
    throw new Error('useAIWallet must be used within an AIWalletProvider');
  }
  return context;
}

export function useAIConfig(): AIWalletConfig | null {
  const { config } = useAIWallet();
  return config;
}

export function useAIWalletComponent() {
  const { renderWallet } = useAIWallet();
  return renderWallet;
}
