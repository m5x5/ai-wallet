import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
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

export interface AIWalletComponentProps {
  remoteStorage?: any;
  capabilities?: string[];
  onConfigChange?: (config: AIWalletConfig) => void;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'shadow' | 'border';
}

export interface AIWalletComponentRef {
  getConfiguration: () => Promise<AIWalletConfig>;
  saveConfiguration: () => Promise<boolean>;
  setRemoteStorage: (rs: any) => Promise<void>;
  getRemoteStorage: () => Promise<any>;
}

export const AIWalletComponent = forwardRef<AIWalletComponentRef, AIWalletComponentProps>(
  ({ remoteStorage, capabilities = ['llm', 'vlm', 'sst', 'tts'], onConfigChange, className, style, variant = 'shadow' }, ref) => {
    const walletRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      getConfiguration: () => walletRef.current?.getConfiguration(),
      saveConfiguration: () => walletRef.current?.saveConfiguration(),
      setRemoteStorage: (rs: any) => walletRef.current?.setRemoteStorage(rs),
      getRemoteStorage: () => walletRef.current?.getRemoteStorage(),
    }));

    useEffect(() => {
      ensureComponentsLoaded();
    }, []);

    useEffect(() => {
      const handleConfigChange = (event: CustomEvent<AIWalletConfig>) => {
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

      return () => {
        element.removeEventListener('configChanged', handleConfigChange);
      };
    }, [remoteStorage, onConfigChange]);

    return (
      <div className={className} style={style}>
        <ai-wallet
          ref={walletRef}
          capabilities={capabilities}
          variant={variant}
        />
      </div>
    );
  }
);

AIWalletComponent.displayName = 'AIWalletComponent';
