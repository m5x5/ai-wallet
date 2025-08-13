import DefaultTheme from 'vitepress/theme'
import { defineCustomElements } from '../loader/index.js'

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


