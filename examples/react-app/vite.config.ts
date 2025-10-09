import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..', '../..'],
    },
  },
})
