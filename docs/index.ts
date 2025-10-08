import DefaultTheme from 'vitepress/theme'
import { defineCustomElements } from 'ai-wallet/loader'

export default {
  ...DefaultTheme,
  enhanceApp() {
    if (typeof window !== 'undefined') {
      try {
        defineCustomElements()
      } catch {
        // ignore
      }
    }
  }
}


