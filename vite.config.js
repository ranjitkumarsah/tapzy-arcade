import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // allows testing on a phone over LAN during dev
  },
  build: {
    rollupOptions: {
      output: {
        // Keep the initial launcher bundle small: split heavy vendors so they
        // load in parallel and cache independently. Games are lazy-loaded too.
        manualChunks: {
          'firebase-app': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
})
