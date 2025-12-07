import DefaultTheme from 'vitepress/theme'
import { defineCustomElements } from 'ai-wallet/loader'
import RemoteStorage from 'remotestoragejs';
import { AI } from "remotestorage-module-ai-wallet";

export default {
  ...DefaultTheme,
  enhanceApp() {
    if (typeof window !== 'undefined') {
      try {
        defineCustomElements()
        debugger
        console.log('enhanceApp-------------------------------')
        const rs = new RemoteStorage({ modules: [AI] });
        rs.access.claim('ai-wallet', 'rw');
        document.querySelector('ai-wallet')?.setRemoteStorage(rs)
      } catch {
        // ignore
      }
    }
  }
}


